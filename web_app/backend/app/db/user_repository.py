from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, UserLoginAudit, RoomSession, TensorArtifact
from app.core.security import hash_password, verify_password
from app.core.logger import api_logger

class UserRepository:
    """Async Database Repository for User Management, Authentication & Login Audits."""

    @staticmethod
    async def create_user(
        session: AsyncSession,
        email: str,
        password: str,
        full_name: str = "Studio Member",
        role: str = "architect",
    ) -> User:
        """Creates a new user with hashed password."""
        stmt = select(User).where(User.email == email.lower())
        res = await session.execute(stmt)
        if res.scalar_one_or_none():
            raise ValueError(f"User with username/email '{email}' already exists.")

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
        """Fetches user by email or username."""
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
        
        # Update last login timestamp
        user.last_login_at = datetime.now(timezone.utc)
        await session.commit()
        return user

    @staticmethod
    async def record_login_audit(
        session: AsyncSession,
        username_or_email: str,
        status: str = "SUCCESS",
        user: Optional[User] = None,
        ip_address: str = "127.0.0.1",
        user_agent: str = "Unknown Browser",
    ) -> UserLoginAudit:
        """Records a user login event in the audit trail."""
        audit = UserLoginAudit(
            user_id=user.id if user else None,
            username_or_email=username_or_email,
            role=user.role if user else "unknown",
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        session.add(audit)
        await session.commit()
        await session.refresh(audit)
        return audit

    @staticmethod
    async def list_login_audits(
        session: AsyncSession,
        limit: int = 50,
        offset: int = 0
    ) -> List[UserLoginAudit]:
        """Fetches paginated login audit history (most recent first)."""
        stmt = select(UserLoginAudit).order_by(desc(UserLoginAudit.created_at)).limit(limit).offset(offset)
        res = await session.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def list_users(session: AsyncSession) -> List[User]:
        """Lists all registered users."""
        stmt = select(User).order_by(User.created_at)
        res = await session.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_admin_dashboard_stats(session: AsyncSession) -> Dict[str, Any]:
        """Aggregates platform metrics for Admin Dashboard."""
        # Total users
        user_count_stmt = select(func.count(User.id))
        total_users = (await session.execute(user_count_stmt)).scalar() or 0

        # Total room sessions
        room_count_stmt = select(func.count(RoomSession.id))
        total_rooms = (await session.execute(room_count_stmt)).scalar() or 0

        # Total tensor artifacts & bytes
        tensor_size_stmt = select(func.sum(TensorArtifact.file_size_bytes))
        total_tensor_bytes = (await session.execute(tensor_size_stmt)).scalar() or 0

        # Total login events
        login_count_stmt = select(func.count(UserLoginAudit.id))
        total_logins = (await session.execute(login_count_stmt)).scalar() or 0

        # Average confidence
        avg_conf_stmt = select(func.avg(RoomSession.overall_confidence))
        avg_confidence = (await session.execute(avg_conf_stmt)).scalar() or 0.0

        return {
            "total_users": total_users,
            "total_room_sessions": total_rooms,
            "total_tensor_storage_bytes": total_tensor_bytes,
            "total_tensor_storage_mb": round(total_tensor_bytes / (1024 * 1024), 2),
            "total_login_audits": total_logins,
            "average_confidence": round(float(avg_confidence) * 100, 1),
        }
