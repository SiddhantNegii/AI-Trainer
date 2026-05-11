"""
FastAPI Backend for AI Fitness Trainer.

Pose detection now runs client-side in the browser via MediaPipe WASM.
This backend serves: exercise library proxy, meal plan proxy, user profile,
and workout-session history.
"""

import asyncio
import logging
import os
import sys

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai-trainer.app")

# Make sibling backend modules importable when the working dir is the repo root.
sys.path.insert(0, os.path.dirname(__file__))

from db import init_db  # noqa: E402
from routes.workout import router as workout_router  # noqa: E402
from routes.diet import router as diet_router  # noqa: E402
from routes.profile import router as profile_router  # noqa: E402
from routes.sessions import router as sessions_router  # noqa: E402

app = FastAPI(
    title="AI Fitness Trainer API",
    description="Backend API for the AI Fitness Trainer web app.",
    version="2.0.0",
)


async def _warm_exercise_cache() -> None:
    """Pre-populate the in-memory exercise list so the first user request is instant."""
    try:
        from routes.workout import get_all_cached_exercises  # local import to avoid cycles

        logger.info("Warming exercise cache in background...")
        exercises = await get_all_cached_exercises()
        logger.info("Exercise cache warm: %d exercises ready", len(exercises))
    except Exception as e:
        # Don't block startup if the upstream API is down — first user request will retry.
        logger.warning("Exercise cache warmup failed: %s", e)


@app.on_event("startup")
async def on_startup() -> None:
    try:
        init_db()
    except Exception as e:
        logger.exception("Database init failed: %s", e)

    # Fire-and-forget: warm the exercise cache so the /workout page loads instantly.
    asyncio.create_task(_warm_exercise_cache())


# CORS
frontend_host = os.getenv("FRONTEND_HOST")
frontend_url = os.getenv("FRONTEND_URL")
extra_origins = [o.strip() for o in os.getenv("EXTRA_CORS_ORIGINS", "").split(",") if o.strip()]
if frontend_host:
    allowed_origins = [f"https://{frontend_host}", f"http://{frontend_host}"]
elif frontend_url:
    allowed_origins = [frontend_url]
else:
    allowed_origins = ["http://localhost:3000"]
allowed_origins.extend(extra_origins)
logger.info("CORS allowed origins: %s", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workout_router)
app.include_router(diet_router)
app.include_router(profile_router)
app.include_router(sessions_router)


@app.get("/")
async def root():
    return {
        "message": "AI Fitness Trainer API is running",
        "version": "2.0.0",
        "status": "healthy",
        "endpoints": {
            "workout": "/api/workout",
            "diet": "/api/diet",
            "profile": "/api/profile",
            "sessions": "/api/sessions",
            "me": "/api/me",
            "docs": "/docs",
        },
    }


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8002"))
    uvicorn.run(app, host="0.0.0.0", port=port)
