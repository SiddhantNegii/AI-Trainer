"""
Database models. Identified by Clerk user IDs (string).
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class User(Base):
    """One row per Clerk user. Synced from Clerk JWT claims on first authenticated request."""
    __tablename__ = "users"

    id = Column(String, primary_key=True)  # Clerk user ID (sub claim)
    email = Column(String, index=True, nullable=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship(
        "UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    sessions = relationship(
        "WorkoutSession", back_populates="user", cascade="all, delete-orphan"
    )


class UserProfile(Base):
    """Per-user preferences. One-to-one with User."""
    __tablename__ = "user_profiles"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    goal = Column(String, nullable=True)  # 'lose-fat' | 'build-muscle' | 'athletic' | 'general'
    unit_system = Column(String, default="metric", nullable=False)  # 'metric' | 'imperial'
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")


class WorkoutSession(Base):
    """One row per completed pose-detection session."""
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise = Column(String, nullable=False)  # 'squat' | 'pushup' | 'plank'
    reps = Column(Integer, default=0, nullable=False)
    form_score = Column(Integer, default=0, nullable=False)  # 0..100
    duration_seconds = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="sessions")


Index("ix_workout_sessions_user_created", WorkoutSession.user_id, WorkoutSession.created_at)
