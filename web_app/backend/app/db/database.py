import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import event
from app.core.logger import api_logger

# Base for declarative models
Base = declarative_base()

# Default SQLite database path in data/rooms.db
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "rooms.db"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH}")

# Create Async Engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

# Async Session Maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def init_db():
    """Initializes database schema and enables SQLite WAL mode for high concurrency."""
    async with engine.begin() as conn:
        if "sqlite" in DATABASE_URL:
            # Enable WAL mode for high concurrency and zero locking
            await conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
            await conn.exec_driver_sql("PRAGMA synchronous=NORMAL;")
        
        # Create all tables if they do not exist
        await conn.run_sync(Base.metadata.create_all)
        
        # Safe column check/migration for SQLite
        if "sqlite" in DATABASE_URL:
            try:
                res = await conn.exec_driver_sql("PRAGMA table_info(room_sessions);")
                cols = [row[1] for row in res.fetchall()]
                if cols and "room_category" not in cols:
                    await conn.exec_driver_sql("ALTER TABLE room_sessions ADD COLUMN room_category VARCHAR(50) DEFAULT 'interior_room';")
            except Exception as migration_err:
                api_logger.debug(f"[Database] Migration check: {migration_err}")

        api_logger.info("[Database] Schema verified and tables initialized.")

async def get_db():
    """FastAPI Dependency for database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
