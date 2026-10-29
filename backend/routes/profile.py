"""
Per-user profile + identity endpoints.
"""

from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.clerk import get_current_user
from db import get_db
from models.database import User, UserProfile

router = APIRouter(prefix="/api", tags=["Profile"])


class ProfileOut(BaseModel):
    user_id: str
    email: Optional[str]
    name: Optional[str]
    height_cm: Optional[float]
    weight_kg: Optional[float]
    goal: Optional[str]
    unit_system: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    height_cm: Optional[float] = Field(default=None, ge=50, le=300)
    weight_kg: Optional[float] = Field(default=None, ge=20, le=400)
    goal: Optional[str] = None
    unit_system: Optional[str] = None


def _profile_to_out(user: User, profile: Optional[UserProfile]) -> ProfileOut:
    return ProfileOut(
        user_id=user.id,
        email=user.email,
        name=user.name,
        height_cm=profile.height_cm if profile else None,
        weight_kg=profile.weight_kg if profile else None,
        goal=profile.goal if profile else None,
        unit_system=profile.unit_system if profile else "metric",
    )


@router.get("/me", response_model=ProfileOut)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _profile_to_out(user, user.profile)


@router.get("/profile", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _profile_to_out(user, user.profile)


@router.put("/profile", response_model=ProfileOut)
def update_profile(
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.name is not None:
        user.name = body.name

    profile = user.profile
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        user.profile = profile

    if body.height_cm is not None:
        profile.height_cm = body.height_cm
    if body.weight_kg is not None:
        profile.weight_kg = body.weight_kg
    if body.goal is not None:
        if body.goal not in {"lose-fat", "build-muscle", "athletic", "general"}:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=f"Invalid goal: {body.goal}")
        profile.goal = body.goal
    if body.unit_system is not None:
        if body.unit_system not in {"metric", "imperial"}:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=f"Invalid unit_system: {body.unit_system}")
        profile.unit_system = body.unit_system

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return _profile_to_out(user, user.profile)
