"""
Workout session logging + retrieval.
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from auth.clerk import get_current_user
from db import get_db
from models.database import User, WorkoutSession

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

ALLOWED_EXERCISES = {"squat", "pushup", "plank"}


class SessionCreate(BaseModel):
    exercise: str
    reps: int = Field(ge=0)
    form_score: int = Field(ge=0, le=100)
    duration_seconds: int = Field(default=0, ge=0)


class SessionOut(BaseModel):
    id: int
    exercise: str
    reps: int
    form_score: int
    duration_seconds: int
    created_at: datetime


class SessionStats(BaseModel):
    total_sessions: int
    total_reps: int
    avg_form_score: int
    by_exercise: dict
    last_7_scores: list


@router.post("", response_model=SessionOut)
def log_session(
    body: SessionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.exercise not in ALLOWED_EXERCISES:
        raise HTTPException(status_code=400, detail=f"Unknown exercise: {body.exercise}")
    s = WorkoutSession(
        user_id=user.id,
        exercise=body.exercise,
        reps=body.reps,
        form_score=body.form_score,
        duration_seconds=body.duration_seconds,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return SessionOut(
        id=s.id,
        exercise=s.exercise,
        reps=s.reps,
        form_score=s.form_score,
        duration_seconds=s.duration_seconds,
        created_at=s.created_at,
    )


@router.get("", response_model=List[SessionOut])
def list_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == user.id)
        .order_by(desc(WorkoutSession.created_at))
        .offset(offset)
        .limit(limit)
    )
    return [
        SessionOut(
            id=s.id,
            exercise=s.exercise,
            reps=s.reps,
            form_score=s.form_score,
            duration_seconds=s.duration_seconds,
            created_at=s.created_at,
        )
        for s in q.all()
    ]


@router.get("/stats", response_model=SessionStats)
def session_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base = db.query(WorkoutSession).filter(WorkoutSession.user_id == user.id)

    total_sessions = base.count()
    total_reps = base.with_entities(func.coalesce(func.sum(WorkoutSession.reps), 0)).scalar() or 0
    avg_score_raw = base.with_entities(func.coalesce(func.avg(WorkoutSession.form_score), 0)).scalar() or 0
    avg_form_score = int(round(float(avg_score_raw)))

    by_exercise = {}
    rows = (
        db.query(
            WorkoutSession.exercise,
            func.count(WorkoutSession.id),
            func.coalesce(func.avg(WorkoutSession.form_score), 0),
            func.coalesce(func.sum(WorkoutSession.reps), 0),
        )
        .filter(WorkoutSession.user_id == user.id)
        .group_by(WorkoutSession.exercise)
        .all()
    )
    for ex, sessions, avg_score, reps in rows:
        by_exercise[ex] = {
            "sessions": int(sessions),
            "avg_score": int(round(float(avg_score))),
            "reps": int(reps),
        }

    last_7 = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == user.id)
        .order_by(desc(WorkoutSession.created_at))
        .limit(7)
        .all()
    )
    # Return oldest-first so the chart reads left to right chronologically.
    last_7_scores = [
        {
            "score": s.form_score,
            "exercise": s.exercise,
            "created_at": s.created_at.isoformat(),
        }
        for s in reversed(last_7)
    ]

    return SessionStats(
        total_sessions=total_sessions,
        total_reps=int(total_reps),
        avg_form_score=avg_form_score,
        by_exercise=by_exercise,
        last_7_scores=last_7_scores,
    )
