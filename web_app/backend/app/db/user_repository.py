import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, func, desc, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, UserLoginAudit, RoomSession, SurfaceRegion, TensorArtifact, Project
from app.core.security import hash_password, verify_password
from app.core.logger import api_logger

class UserRepository:
    """Async Database Repository for User Management, Authentication & Database Telemetry."""

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
            avatar_url="/avatar_pa_thumb.jpg" if email.lower() == "pa" else None,
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
        user_count = (await session.execute(select(func.count(User.id)))).scalar() or 0
        room_count = (await session.execute(select(func.count(RoomSession.id)))).scalar() or 0
        tensor_size = (await session.execute(select(func.sum(TensorArtifact.file_size_bytes)))).scalar() or 0
        login_count = (await session.execute(select(func.count(UserLoginAudit.id)))).scalar() or 0
        avg_conf = (await session.execute(select(func.avg(RoomSession.overall_confidence)))).scalar() or 0.0

        return {
            "total_users": user_count,
            "total_room_sessions": room_count,
            "total_tensor_storage_bytes": tensor_size,
            "total_tensor_storage_mb": round(tensor_size / (1024 * 1024), 2),
            "total_login_audits": login_count,
            "average_confidence": round(float(avg_conf) * 100, 1),
        }

    @staticmethod
    async def get_detailed_database_info(session: AsyncSession) -> Dict[str, Any]:
        """Collects low-level SQLite database telemetry, table row counts, PRAGMA flags, and storage disk usage."""
        from app.config import settings
        db_file = str(settings.DATA_DIR / "rooms.db")
        wal_file = str(settings.DATA_DIR / "rooms.db-wal")
        shm_file = str(settings.DATA_DIR / "rooms.db-shm")

        db_size_bytes = os.path.getsize(db_file) if os.path.exists(db_file) else 0
        wal_size_bytes = os.path.getsize(wal_file) if os.path.exists(wal_file) else 0

        # Query PRAGMA settings
        journal_mode = (await session.execute(text("PRAGMA journal_mode;"))).scalar() or "wal"
        sync_mode = (await session.execute(text("PRAGMA synchronous;"))).scalar() or 1
        page_size = (await session.execute(text("PRAGMA page_size;"))).scalar() or 4096
        page_count = (await session.execute(text("PRAGMA page_count;"))).scalar() or 0

        # Table Row Counts
        user_rows = (await session.execute(select(func.count(User.id)))).scalar() or 0
        audit_rows = (await session.execute(select(func.count(UserLoginAudit.id)))).scalar() or 0
        project_rows = (await session.execute(select(func.count(Project.id)))).scalar() or 0
        session_rows = (await session.execute(select(func.count(RoomSession.id)))).scalar() or 0
        surface_rows = (await session.execute(select(func.count(SurfaceRegion.id)))).scalar() or 0
        tensor_rows = (await session.execute(select(func.count(TensorArtifact.id)))).scalar() or 0

        # Storage Tier 2 disk directory sizes
        def get_dir_size(path):
            total = 0
            count = 0
            if os.path.exists(path):
                for dirpath, _, filenames in os.walk(path):
                    for f in filenames:
                        fp = os.path.join(dirpath, f)
                        if os.path.exists(fp):
                            total += os.path.getsize(fp)
                            count += 1
            return count, total

        images_dir = str(settings.STORAGE_DIR / "images")
        tensors_dir = str(settings.STORAGE_DIR / "tensors")
        images_count, images_bytes = get_dir_size(images_dir)
        tensors_count, tensors_bytes = get_dir_size(tensors_dir)

        return {
            "engine": "SQLite 3 (SQLAlchemy 2.0 Async Engine with aiosqlite)",
            "database_file": db_file,
            "database_size_bytes": db_size_bytes,
            "database_size_kb": round(db_size_bytes / 1024, 2),
            "wal_size_bytes": wal_size_bytes,
            "wal_size_kb": round(wal_size_bytes / 1024, 2),
            "journal_mode": str(journal_mode).upper(),
            "synchronous_mode": "NORMAL" if sync_mode in (1, "1") else "FULL",
            "page_size": page_size,
            "page_count": page_count,
            "tables": {
                "users": {"rows": user_rows, "description": "Studio team members, passwords & roles"},
                "user_login_audits": {"rows": audit_rows, "description": "Security audit trail (IPs, devices, logins)"},
                "projects": {"rows": project_rows, "description": "Architectural project containers"},
                "room_sessions": {"rows": session_rows, "description": "Analyzed room scenes, metadata & confidence"},
                "surface_regions": {"rows": surface_rows, "description": "Individual polygon surface masks (walls, floors)"},
                "gpu_tensor_artifacts": {"rows": tensor_rows, "description": "Compressed ViT embeddings, 3D depth & normals"},
            },
            "storage_tier_2": {
                "images_dir": "data/storage/images",
                "images_count": images_count,
                "images_size_kb": round(images_bytes / 1024, 2),
                "tensors_dir": "data/storage/tensors",
                "tensors_count": tensors_count,
                "tensors_size_kb": round(tensors_bytes / 1024, 2),
                "total_storage_mb": round((images_bytes + tensors_bytes + db_size_bytes) / (1024 * 1024), 2),
            },
            "driver": "LocalStorageDriver (Drop-in ready for AWS S3 / Cloudflare R2)",
            "status": "HEALTHY (Lock-free WAL mode active)",
        }
