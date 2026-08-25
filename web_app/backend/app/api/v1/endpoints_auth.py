from typing import List, Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
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
    email: EmailStr
    password: str
    full_name: str = "Studio Architect"
    role: str = "architect" # 'admin', 'architect', 'client'

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: str
    role: str
    is_active: bool

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    req: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Registers a new user and returns a signed JWT access token."""
    try:
        user = await UserRepository.create_user(
            session=db,
            email=req.email,
            password=req.password,
            full_name=req.full_name,
            role=req.role,
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
    db: AsyncSession = Depends(get_db),
):
    """Authenticates user credentials and returns a JWT access token."""
    user = await UserRepository.authenticate(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
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
    }

@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "architect"])),
):
    """Lists all studio users (Admin/Architect only)."""
    users = await UserRepository.list_users(db)
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
        }
        for u in users
    ]
