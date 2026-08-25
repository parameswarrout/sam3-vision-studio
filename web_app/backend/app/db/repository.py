import json
from typing import List, Optional, Dict, Any
from sqlalchemy import select, desc, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import RoomSession, SurfaceRegion, TensorArtifact, User, Project
from app.core.logger import api_logger

class RoomRepository:
    """Async Database Repository for Room Sessions, Surface Masks, and GPU Tensors."""

    @staticmethod
    async def get_or_create_default_user(session: AsyncSession) -> User:
        """Retrieves or creates the local default user for seamless single-user mode."""
        stmt = select(User).limit(1)
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            user = User(
                id="default_local_user",
                email="architect@local.studio",
                full_name="Local Architect",
                role="admin",
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        return user

    @classmethod
    async def save_room_analysis(
        cls,
        session: AsyncSession,
        image_hash: str,
        room_title: str,
        image_storage_path: str,
        thumbnail_base64: str,
        img_width: int,
        img_height: int,
        regions: List[Dict[str, Any]],
        quality_scores: Dict[str, float],
        overall_confidence: float,
        execution_time_ms: Optional[float] = None,
        tensor_uri: Optional[str] = None,
        tensor_size_bytes: int = 0,
        compute_device: str = "cuda",
    ) -> RoomSession:
        """Persists a complete analyzed room session, its surface regions, and tensor artifacts."""
        user = await cls.get_or_create_default_user(session)

        # Check if already saved by hash
        existing_stmt = (
            select(RoomSession)
            .options(selectinload(RoomSession.regions), selectinload(RoomSession.tensor_artifact))
            .where(RoomSession.image_hash == image_hash)
        )
        res = await session.execute(existing_stmt)
        existing = res.scalar_one_or_none()
        if existing:
            api_logger.info(f"[RoomRepository] Image hash {image_hash[:12]} already in database. Updating record.")
            existing.overall_confidence = overall_confidence
            existing.quality_scores = quality_scores
            existing.execution_time_ms = execution_time_ms
            await session.commit()
            await session.refresh(existing)
            return existing

        # Count surface categories
        wall_count = sum(1 for r in regions if r.get("type") == "wall")
        floor_count = sum(1 for r in regions if r.get("type") == "floor")
        opening_count = sum(1 for r in regions if r.get("type") in ["window", "door"])
        furniture_count = sum(1 for r in regions if r.get("type") == "furniture")

        # Create master RoomSession
        room_session = RoomSession(
            user_id=user.id,
            image_hash=image_hash,
            room_title=room_title,
            image_storage_path=image_storage_path,
            thumbnail_base64=thumbnail_base64,
            img_width=img_width,
            img_height=img_height,
            wall_count=wall_count,
            floor_count=floor_count,
            opening_count=opening_count,
            furniture_count=furniture_count,
            overall_confidence=overall_confidence,
            quality_scores=quality_scores,
            execution_time_ms=execution_time_ms,
        )
        session.add(room_session)
        await session.flush()

        # Add Surface Regions
        for r in regions:
            region_entity = SurfaceRegion(
                id=r.get("id"),
                room_session_id=room_session.id,
                surface_type=r.get("type", "wall"),
                label=r.get("label", "Surface"),
                confidence=float(r.get("confidence", 0.90)),
                area_ratio=float(r.get("area_ratio", 0.10)),
                color_hex=r.get("color", "#3b82f6"),
                plane_index=int(r.get("plane_index", 0)),
                needs_review=bool(r.get("needs_review", False)),
                polygon_vertices=r.get("polygon", []),
                mask_storage_path=r.get("mask_base64", ""),  # Stores data URI / path
                quality_metrics=r.get("quality", {}),
            )
            session.add(region_entity)

        # Add GPU Tensor Artifact Pointer
        if tensor_uri:
            tensor_entity = TensorArtifact(
                room_session_id=room_session.id,
                storage_backend="local_disk",
                tensor_uri=tensor_uri,
                file_size_bytes=tensor_size_bytes,
                compute_device=compute_device,
            )
            session.add(tensor_entity)

        await session.commit()
        await session.refresh(room_session)
        api_logger.info(f"[RoomRepository] Successfully persisted room session {room_session.id} ({image_hash[:12]})")
        return room_session

    @staticmethod
    async def list_history(
        session: AsyncSession,
        limit: int = 50,
        offset: int = 0
    ) -> List[RoomSession]:
        """Returns paginated history of past analyzed rooms sorted newest first."""
        stmt = (
            select(RoomSession)
            .options(selectinload(RoomSession.regions))
            .order_by(desc(RoomSession.created_at))
            .limit(limit)
            .offset(offset)
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_by_id(session: AsyncSession, room_id: str) -> Optional[RoomSession]:
        """Fetches full room session with all surface masks and tensor artifacts."""
        stmt = (
            select(RoomSession)
            .options(selectinload(RoomSession.regions), selectinload(RoomSession.tensor_artifact))
            .where(RoomSession.id == room_id)
        )
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def delete_by_id(session: AsyncSession, room_id: str) -> bool:
        """Deletes a room session and cascades to regions and tensor records."""
        room = await RoomRepository.get_by_id(session, room_id)
        if not room:
            return False
        await session.delete(room)
        await session.commit()
        return True
