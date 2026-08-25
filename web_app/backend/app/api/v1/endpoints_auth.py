from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.db.user_repository import UserRepository
from app.db.models import User
from app.core.security import create_access_token
from app.core.auth import get_current_user, require_role
from app.core.logger import api_logger

router = APIRouter()

# Pydantic Schemas
class UserRegisterRequest(BaseModel):
    email: str # Supports both username (e.g. 'pa') and email (e.g. 'pa@studio.ai')
    password: str
    full_name: str = "Studio Architect"
    role: str = "architect" # 'admin', 'architect', 'client'

class UserLoginRequest(BaseModel):
    email: str # Supports both username (e.g. 'pa') and email (e.g. 'pa@studio.ai')
    password: str

class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: str
    role: str
    is_active: bool
    last_login_at: Optional[datetime] = None

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    req: UserRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Registers a new user, logs audit, and returns a signed JWT access token."""
    try:
        user = await UserRepository.create_user(
            session=db,
            email=req.email,
            password=req.password,
            full_name=req.full_name,
            role=req.role,
        )
        
        # Record registration audit
        ip_addr = request.client.host if request.client else "127.0.0.1"
        ua = request.headers.get("user-agent", "Unknown Browser")
        await UserRepository.record_login_audit(
            session=db,
            username_or_email=user.email,
            status="REGISTER",
            user=user,
            ip_address=ip_addr,
            user_agent=ua,
        )

        token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_active": user.is_active,
                "last_login_at": user.last_login_at,
            }
        }
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        api_logger.error(f"[AuthAPI] Registration failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=AuthTokenResponse)
async def login_user(
    req: UserLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticates user credentials, tracks audit trail, and returns a JWT access token."""
    ip_addr = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "Unknown Browser")

    user = await UserRepository.authenticate(db, req.email, req.password)
    if not user:
        # Record failed login attempt
        await UserRepository.record_login_audit(
            session=db,
            username_or_email=req.email,
            status="FAILED",
            user=None,
            ip_address=ip_addr,
            user_agent=ua,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Record successful login audit
    await UserRepository.record_login_audit(
        session=db,
        username_or_email=user.email,
        status="SUCCESS",
        user=user,
        ip_address=ip_addr,
        user_agent=ua,
    )

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "last_login_at": user.last_login_at,
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """Returns the profile of the currently active/authenticated user."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "last_login_at": current_user.last_login_at,
    }
