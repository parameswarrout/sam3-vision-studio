from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db, RoomRepository
from app.db.user_repository import UserRepository
from app.db.models import User
from app.core.security import decode_access_token
from app.core.logger import api_logger

# Optional OAuth2 scheme (auto_error=False allows graceful fallback to local dev mode)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Resolves the active user.
    - If valid JWT Bearer token is provided: returns authenticated User.
    - If NO token is provided: gracefully defaults to 'default_local_user' (Local Architect)
      to ensure 100% friction-free local development and testing.
    """
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
            user = await UserRepository.get_by_id(db, user_id)
            if user and user.is_active:
                return user
        api_logger.warning("[Auth] Invalid or expired JWT token provided.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Local Seamless Fallback
    return await RoomRepository.get_or_create_default_user(db)

def require_role(allowed_roles: List[str]):
    """Role-Based Access Control (RBAC) Dependency Decorator."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)} (Your role: {current_user.role})",
            )
        return current_user
    return role_checker
