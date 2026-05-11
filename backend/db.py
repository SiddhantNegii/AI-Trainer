"""
SQLAlchemy engine + session + get_db dependency.
"""

import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine

logger = logging.getLogger("ai-trainer.db")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./local.db")

# Render's DATABASE_URL uses the legacy "postgres://" scheme; SQLAlchemy 2.x wants "postgresql://".
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """FastAPI dependency that yields a database session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Safe to call repeatedly — only creates missing tables."""
    from models.database import Base  # local import to avoid circular dep
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured (engine=%s)", engine.url.drivername)
