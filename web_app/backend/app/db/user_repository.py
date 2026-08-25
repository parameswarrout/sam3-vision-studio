from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.core.security import hash_password, verify_password
from app.core.logger import api_logger

class UserRepository:
    """Async Database Repository for User Management and Authentication."""

    @staticmethod
    async def create_user(
        session: AsyncSession,
        email: str,
        password: str,
        full_name: str = "Studio Member",
        role: str = "architect",
    ) -> User:
        """Creates a new user with hashed password."""
        # Check existing
        stmt = select(User).where(User.email == email.lower())
        res = await session.execute(stmt)
        if res.scalar_one_or_none():
            raise ValueError(f"User with email '{email}' already exists.")

        user = User(
            email=email.lower(),
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        api_logger.info(f"[UserRepository] Created new user: {user.email} (role={user.role})")
        return user

    @staticmethod
    async def get_by_email(session: AsyncSession, email: str) -> Optional[User]:
        """Fetches user by email."""
        stmt = select(User).where(User.email == email.lower())
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def get_by_id(session: AsyncSession, user_id: str) -> Optional[User]:
        """Fetches user by UUID."""
        stmt = select(User).where(User.id == user_id)
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    @classmethod
    async def authenticate(
        cls,
        session: AsyncSession,
        email: str,
        password: str
    ) -> Optional[User]:
        """Verifies credentials and returns user if valid."""
        user = await cls.get_by_email(session, email)
        if not user or not user.hashed_password:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    async def list_users(session: AsyncSession) -> List[User]:
        """Lists all registered users."""
        stmt = select(User).order_by(User.created_at)
        res = await session.execute(stmt)
        return list(res.scalars().all())
