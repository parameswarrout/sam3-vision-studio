from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import sam3_service
from app.core.auth import require_role
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
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

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
    """Lists all studio users with login timestamps and role details."""
    users = await UserRepository.list_users(db)
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "last_login_at": u.last_login_at,
            "created_at": u.created_at,
        }
        for u in users
    ]

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

    target_user.role = req.role
    await db.commit()
    await db.refresh(target_user)
    return {
        "message": f"User '{target_user.full_name}' role updated to '{target_user.role}'.",
        "user_id": target_user.id,
        "new_role": target_user.role,
    }
