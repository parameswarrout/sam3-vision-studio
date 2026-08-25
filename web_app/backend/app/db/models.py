import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=True)
    full_name = Column(String(120), default="Local Architect")
    role = Column(String(30), default="architect")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    rooms = relationship("RoomSession", back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(150), default="Default Project")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="projects")
    rooms = relationship("RoomSession", back_populates="project", cascade="all, delete-orphan")


class RoomSession(Base):
    __tablename__ = "room_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    
    image_hash = Column(String(64), unique=True, index=True, nullable=False)
    room_title = Column(String(150), default="Analyzed Room")
    room_category = Column(String(50), default="living_room")
    
    image_storage_path = Column(String(500), nullable=False)
    thumbnail_base64 = Column(Text, nullable=False)
    img_width = Column(Integer, nullable=False)
    img_height = Column(Integer, nullable=False)
    
    wall_count = Column(Integer, default=0)
    floor_count = Column(Integer, default=0)
    opening_count = Column(Integer, default=0)
    furniture_count = Column(Integer, default=0)
    
    overall_confidence = Column(Float, default=0.90)
    quality_scores = Column(JSON, default=dict)
    execution_time_ms = Column(Float, nullable=True)
    is_bookmarked = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    # Relationships
    user = relationship("User", back_populates="rooms")
    project = relationship("Project", back_populates="rooms")
    regions = relationship("SurfaceRegion", back_populates="room", cascade="all, delete-orphan")
    tensor_artifact = relationship("TensorArtifact", back_populates="room", uselist=False, cascade="all, delete-orphan")


class SurfaceRegion(Base):
    __tablename__ = "surface_regions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    room_session_id = Column(String(36), ForeignKey("room_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    
    surface_type = Column(String(30), nullable=False)   # 'wall', 'floor', 'window', 'door', 'furniture', 'ceiling'
    label = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    area_ratio = Column(Float, nullable=False)
    color_hex = Column(String(10), default="#3b82f6")
    plane_index = Column(Integer, default=0)
    needs_review = Column(Boolean, default=False)
    
    polygon_vertices = Column(JSON, nullable=True)
    mask_storage_path = Column(String(500), nullable=True)
    quality_metrics = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=utc_now)

    room = relationship("RoomSession", back_populates="regions")


class TensorArtifact(Base):
    __tablename__ = "gpu_tensor_artifacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    room_session_id = Column(String(36), ForeignKey("room_sessions.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    storage_backend = Column(String(30), default="local_disk")  # 'local_disk', 'aws_s3', 'gcs'
    tensor_uri = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    
    vit_tensor_shape = Column(String(50), nullable=True)
    depth_shape = Column(String(50), nullable=True)
    normals_shape = Column(String(50), nullable=True)
    compression = Column(String(20), default="npz")
    compute_device = Column(String(30), default="cuda:0")
    
    created_at = Column(DateTime(timezone=True), default=utc_now)

    room = relationship("RoomSession", back_populates="tensor_artifact")
