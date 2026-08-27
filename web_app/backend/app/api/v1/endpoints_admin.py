from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import sam3_service
from app.core.auth import require_role
from app.core.security import hash_password
from app.db import get_db
from app.db.models import User
from app.db.user_repository import UserRepository

router = APIRouter()

class LoginAuditItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    username_or_email: str
    role: str
    status: str
    ip_address: str
    user_agent: Optional[str] = None
    created_at: datetime

class AdminUserItem(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: str
    role: str
    avatar_url: Optional[str] = None
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

class CreateUserAdminRequest(BaseModel):
    email: str
    password: str
    full_name: str = "Studio Member"
    role: str = "architect" # 'admin', 'architect', 'client'
    avatar_url: Optional[str] = None
    is_active: bool = True

class UpdateUserAdminRequest(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None # Optional password reset

class RoleUpdateRequest(BaseModel):
    role: str # 'admin', 'architect', 'client'

@router.get("/stats")
async def get_admin_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Returns platform overview statistics, storage metrics, and hardware state."""
    stats = await UserRepository.get_admin_dashboard_stats(db)
    stats["hardware"] = {
        "device": sam3_service.device,
        "is_cuda": "cuda" in sam3_service.device,
        "model_loaded": sam3_service.is_loaded(),
    }
    return stats

@router.get("/database-info")
async def get_database_telemetry_info(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Returns detailed low-level SQLite database telemetry, WAL flags, table metrics, and storage breakdown."""
    return await UserRepository.get_detailed_database_info(db)

@router.get("/tables/{table_name}")
async def get_table_data(
    table_name: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Fetches schema columns and raw live data rows for any database table."""
    valid_tables = {
        "users": "SELECT id, email, full_name, role, is_active, last_login_at, created_at, updated_at FROM users ORDER BY created_at DESC",
        "user_login_audits": "SELECT id, user_id, username_or_email, role, status, ip_address, user_agent, created_at FROM user_login_audits ORDER BY created_at DESC",
        "projects": "SELECT id, user_id, name, description, created_at FROM projects ORDER BY created_at DESC",
        "room_sessions": "SELECT id, project_id, user_id, image_hash, room_title, image_width, image_height, overall_confidence, wall_count, floor_count, total_surfaces, created_at FROM room_sessions ORDER BY created_at DESC",
        "surface_regions": "SELECT id, room_session_id, surface_type, label, confidence, area_ratio, color_hex, plane_index, needs_review, created_at FROM surface_regions ORDER BY created_at DESC",
        "gpu_tensor_artifacts": "SELECT id, room_session_id, storage_backend, tensor_uri, file_size_bytes, vit_tensor_shape, depth_shape, normals_shape, compression, compute_device, created_at FROM gpu_tensor_artifacts ORDER BY created_at DESC",
    }

    if table_name not in valid_tables:
        raise HTTPException(status_code=400, detail=f"Invalid table '{table_name}'. Valid: {list(valid_tables.keys())}")

    query_str = f"{valid_tables[table_name]} LIMIT {limit}"
    from sqlalchemy import text
    result = await db.execute(text(query_str))
    columns = list(result.keys())
    rows = [dict(zip(columns, [str(val) if isinstance(val, datetime) else val for val in row])) for row in result.fetchall()]

    return {
        "table_name": table_name,
        "columns": columns,
        "row_count": len(rows),
        "rows": rows,
    }

@router.get("/logins", response_model=List[LoginAuditItem])
async def get_login_audit_trail(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Returns real-time user login events, IP addresses, client devices, and timestamps."""
    audits = await UserRepository.list_login_audits(db, limit=limit, offset=offset)
    return [
        {
            "id": a.id,
            "user_id": a.user_id,
            "username_or_email": a.username_or_email,
            "role": a.role,
            "status": a.status,
            "ip_address": a.ip_address,
            "user_agent": a.user_agent,
            "created_at": a.created_at,
        }
        for a in audits
    ]

@router.get("/users", response_model=List[AdminUserItem])
async def get_all_studio_users(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Lists all studio users with login timestamps, avatars, and role details."""
    users = await UserRepository.list_users(db)
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "avatar_url": u.avatar_url or ("/avatar_pa_thumb.jpg" if u.email == "pa" else None),
            "is_active": u.is_active,
            "last_login_at": u.last_login_at,
            "created_at": u.created_at,
        }
        for u in users
    ]

@router.post("/users", response_model=AdminUserItem, status_code=status.HTTP_201_CREATED)
async def create_user_from_admin(
    req: CreateUserAdminRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Creates a new user directly from Admin Command Center."""
    try:
        user = await UserRepository.create_user(
            session=db,
            email=req.email,
            password=req.password,
            full_name=req.full_name,
            role=req.role,
        )
        if not req.is_active:
            user.is_active = False
            await db.commit()
            await db.refresh(user)

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "last_login_at": user.last_login_at,
            "created_at": user.created_at,
        }
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.put("/users/{user_id}", response_model=AdminUserItem)
async def update_user_from_admin(
    user_id: str,
    req: UpdateUserAdminRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Updates user information, permissions, and optional password reset."""
    target_user = await UserRepository.get_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if req.full_name is not None:
        target_user.full_name = req.full_name
    if req.email is not None and req.email.lower() != target_user.email:
        # Check uniqueness
        existing = await UserRepository.get_by_email(db, req.email)
        if existing and existing.id != target_user.id:
            raise HTTPException(status_code=400, detail=f"Username/Email '{req.email}' is already taken.")
        target_user.email = req.email.lower()
    if req.role is not None:
        if req.role not in ["admin", "architect", "client"]:
            raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin', 'architect', or 'client'.")
        # Prevent demoting the primary 'pa' admin
        if target_user.email == "pa" and req.role != "admin":
            raise HTTPException(status_code=400, detail="Primary Admin 'pa' cannot be demoted.")
        target_user.role = req.role
    if req.is_active is not None:
        if target_user.email == "pa" and not req.is_active:
            raise HTTPException(status_code=400, detail="Primary Admin 'pa' cannot be deactivated.")
        target_user.is_active = req.is_active
    if req.password:
        target_user.hashed_password = hash_password(req.password)

    await db.commit()
    await db.refresh(target_user)

    return {
        "id": target_user.id,
        "email": target_user.email,
        "full_name": target_user.full_name,
        "role": target_user.role,
        "is_active": target_user.is_active,
        "last_login_at": target_user.last_login_at,
        "created_at": target_user.created_at,
    }

@router.delete("/users/{user_id}")
async def delete_user_from_admin(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Deletes a user from the studio database (Primary Admin 'pa' is protected)."""
    target_user = await UserRepository.get_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.email == "pa":
        raise HTTPException(status_code=400, detail="Cannot delete primary administrator 'pa'.")

    await db.delete(target_user)
    await db.commit()
    return {"message": f"User '{target_user.full_name}' ({target_user.email}) successfully deleted.", "user_id": user_id}

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    req: RoleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Updates a user's role (Admin only)."""
    if req.role not in ["admin", "architect", "client"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin', 'architect', or 'client'.")
    
    target_user = await UserRepository.get_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.email == "pa" and req.role != "admin":
        raise HTTPException(status_code=400, detail="Primary Admin 'pa' cannot be demoted.")

    target_user.role = req.role
    await db.commit()
    await db.refresh(target_user)
    return {
        "message": f"User '{target_user.full_name}' role updated to '{target_user.role}'.",
        "user_id": target_user.id,
        "new_role": target_user.role,
    }
