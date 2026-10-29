"""
Workout & Exercise API Routes
Exercise database from ExerciseDB API + Workout plan generation
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
import asyncio
import logging
from dotenv import load_dotenv
import time
import json
from pathlib import Path

import sys

load_dotenv()

logger = logging.getLogger("ai-trainer.workout")

router = APIRouter(prefix="/api/workout", tags=["Workout"])

EXERCISEDB_API_KEY = os.getenv("EXERCISEDB_API_KEY")
EXERCISEDB_API_HOST = os.getenv("EXERCISEDB_API_HOST")
DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "exercises_sample.json")
PERSISTENT_CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "api_cache.json")
FORCE_API = os.getenv("EXERCISEDB_FORCE_API", "").lower() in ("1", "true", "yes")

# Rate limiting configuration
RATE_LIMIT_DELAY = 1.0  # Minimum seconds between API requests
LAST_API_CALL = {"time": 0}
REQUEST_LOCK = asyncio.Lock()
MAX_RETRIES = 3
RETRY_DELAYS = [2, 5, 10]  # Exponential backoff delays


def load_local_exercises():
    if os.path.exists(DATA_FILE):
        try:
            import json
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get("data", [])
        except Exception:
            return []
    return []


# ========== EXERCISE DATABASE ENDPOINTS ==========

def normalize_exercise(ex: dict) -> dict:
    if not isinstance(ex, dict):
        return {}
    img = ex.get("imageUrl") or ex.get("gifUrl")
    if img and not ex.get("imageUrl"):
        ex["imageUrl"] = img
    bp = ex.get("bodyParts")
    if not bp:
        single_bp = ex.get("bodyPart")
        if isinstance(single_bp, str) and single_bp.strip():
            ex["bodyParts"] = [single_bp]
        elif isinstance(single_bp, list):
            ex["bodyParts"] = [s for s in single_bp if isinstance(s, str)]
        else:
            ex["bodyParts"] = []
    eqs = ex.get("equipments")
    if not eqs:
        single_eq = ex.get("equipment")
        if isinstance(single_eq, str) and single_eq.strip():
            ex["equipments"] = [single_eq]
        elif isinstance(single_eq, list):
            ex["equipments"] = [s for s in single_eq if isinstance(s, str)]
        else:
            ex["equipments"] = []
    return ex

def api_headers() -> Optional[dict]:
    host = (EXERCISEDB_API_HOST or "").lower()
    if "rapidapi" in host:
        if EXERCISEDB_API_KEY:
            return {
                "x-rapidapi-key": EXERCISEDB_API_KEY,
                "x-rapidapi-host": EXERCISEDB_API_HOST
            }
    elif "exercisedb.dev" in host:
        if EXERCISEDB_API_KEY:
            return {
                "X-API-Key": EXERCISEDB_API_KEY
            }
    return None

EXERCISES_CACHE = {}
BODYPARTS_CACHE = {"ts": 0, "data": []}
EQUIPMENTS_CACHE = {"ts": 0, "data": []}
CACHE_TTL = 86400  # 24 hours instead of 5 minutes to reduce API calls

# Load persistent cache on startup
def load_persistent_cache():
    """Load cache from disk to survive server restarts"""
    global BODYPARTS_CACHE, EQUIPMENTS_CACHE, EXERCISES_CACHE
    try:
        if os.path.exists(PERSISTENT_CACHE_FILE):
            with open(PERSISTENT_CACHE_FILE, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
                
                # Validate and clean cached data - extract strings from objects
                if cache_data.get('bodyparts'):
                    bp_data = cache_data['bodyparts'].get('data', [])
                    if bp_data:
                        # Always extract name from objects, keep strings as-is
                        cleaned_bp = []
                        for item in bp_data:
                            if isinstance(item, str):
                                cleaned_bp.append(item)
                            elif isinstance(item, dict) and item.get('name'):
                                cleaned_bp.append(item['name'])
                        if cleaned_bp:
                            cache_data['bodyparts']['data'] = cleaned_bp
                            BODYPARTS_CACHE = cache_data['bodyparts']
                            logger.info(f"Loaded and cleaned {len(cleaned_bp)} body parts from cache")
                
                if cache_data.get('equipments'):
                    eq_data = cache_data['equipments'].get('data', [])
                    if eq_data:
                        # Always extract name from objects, keep strings as-is
                        cleaned_eq = []
                        for item in eq_data:
                            if isinstance(item, str):
                                cleaned_eq.append(item)
                            elif isinstance(item, dict) and item.get('name'):
                                cleaned_eq.append(item['name'])
                        if cleaned_eq:
                            cache_data['equipments']['data'] = cleaned_eq
                            EQUIPMENTS_CACHE = cache_data['equipments']
                            logger.info(f"Loaded and cleaned {len(cleaned_eq)} equipments from cache")
                
                if cache_data.get('exercises'):
                    EXERCISES_CACHE = cache_data['exercises']
    except Exception as e:
        logger.info(f"Could not load persistent cache: {e}")

def save_persistent_cache():
    """Save cache to disk"""
    try:
        os.makedirs(os.path.dirname(PERSISTENT_CACHE_FILE), exist_ok=True)
        cache_data = {
            'bodyparts': BODYPARTS_CACHE,
            'equipments': EQUIPMENTS_CACHE,
            'exercises': EXERCISES_CACHE,
            'last_updated': time.time()
        }
        with open(PERSISTENT_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f)
    except Exception as e:
        logger.info(f"Could not save persistent cache: {e}")

async def throttled_api_call(url: str, headers: Optional[dict], params: Optional[dict] = None, retry_count: int = 0):
    """Make API call with rate limiting and retry logic"""
    async with REQUEST_LOCK:
        # Enforce rate limiting
        elapsed = time.time() - LAST_API_CALL["time"]
        if elapsed < RATE_LIMIT_DELAY:
            await asyncio.sleep(RATE_LIMIT_DELAY - elapsed)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params, timeout=30.0)
                LAST_API_CALL["time"] = time.time()
                
                # Check for rate limiting
                if response.status_code == 429:
                    if retry_count < MAX_RETRIES:
                        retry_delay = RETRY_DELAYS[min(retry_count, len(RETRY_DELAYS) - 1)]
                        logger.info(f"Rate limited. Retrying in {retry_delay}s (attempt {retry_count + 1}/{MAX_RETRIES})")
                        await asyncio.sleep(retry_delay)
                        return await throttled_api_call(url, headers, params, retry_count + 1)
                    else:
                        raise HTTPException(status_code=429, detail="API rate limit exceeded. Using cached data.")
                
                response.raise_for_status()
                return response
        except httpx.HTTPError as e:
            if retry_count < MAX_RETRIES:
                retry_delay = RETRY_DELAYS[min(retry_count, len(RETRY_DELAYS) - 1)]
                logger.info(f"API error: {e}. Retrying in {retry_delay}s")
                await asyncio.sleep(retry_delay)
                return await throttled_api_call(url, headers, params, retry_count + 1)
            raise

# Load cache on module import
logger.info("="*50)
logger.info("WORKOUT MODULE INITIALIZATION")
logger.info(f"EXERCISEDB_API_HOST: {EXERCISEDB_API_HOST}")
logger.info(f"EXERCISEDB_API_KEY set: {bool(EXERCISEDB_API_KEY)}")
logger.info(f"Cache file location: {PERSISTENT_CACHE_FILE}")
logger.info("="*50)
load_persistent_cache()

@router.get("/clear-cache")
async def clear_cache():
    """Clear all cached data to force fresh API calls"""
    global BODYPARTS_CACHE, EQUIPMENTS_CACHE, EXERCISES_CACHE
    BODYPARTS_CACHE = {"ts": 0, "data": []}
    EQUIPMENTS_CACHE = {"ts": 0, "data": []}
    EXERCISES_CACHE = {}
    
    # Delete cache file
    if os.path.exists(PERSISTENT_CACHE_FILE):
        os.remove(PERSISTENT_CACHE_FILE)
    
    return {"success": True, "message": "Cache cleared successfully"}

# Maximum total exercises to fetch from upstream API (caps monthly API spend).
# 250 = 10 pages of 25 = ~300 API calls/month worst case, well within RapidAPI free tier.
MAX_EXERCISES_TO_FETCH = 250
ALL_EXERCISES_CACHE_KEY = "__all__"


async def get_all_cached_exercises() -> List[dict]:
    """
    Returns the full normalized exercise list, fetching from the API once per CACHE_TTL.
    Subsequent calls hit memory. Filters/search/pagination operate on this in-memory list,
    so there are no extra upstream API calls per user request.
    """
    cached = EXERCISES_CACHE.get(ALL_EXERCISES_CACHE_KEY)
    if cached and time.time() - cached["ts"] < CACHE_TTL:
        return cached["data"]

    if not EXERCISEDB_API_HOST:
        local = [normalize_exercise(ex) for ex in load_local_exercises()]
        EXERCISES_CACHE[ALL_EXERCISES_CACHE_KEY] = {"data": local, "ts": time.time()}
        return local

    url = f"https://{EXERCISEDB_API_HOST}/api/v1/exercises"
    headers = api_headers()
    page_size = 25  # ExerciseDB's effective max per request
    all_exercises: List[dict] = []
    offset = 0

    logger.info("Populating full exercise cache from ExerciseDB API...")
    while offset < MAX_EXERCISES_TO_FETCH:
        try:
            response = await throttled_api_call(url, headers, {"limit": page_size, "offset": offset})
            data = response.json()
            page = data if isinstance(data, list) else (data.get("data") or data.get("exercises") or [])
            if not page:
                break
            all_exercises.extend(normalize_exercise(ex) for ex in page)
            if len(page) < page_size:
                break  # short page means we hit the end
            offset += page_size
        except HTTPException as he:
            if he.status_code == 429:
                logger.warning("Rate limited mid-fetch at offset=%s; serving partial list of %d", offset, len(all_exercises))
                break
            raise
        except Exception as e:
            logger.exception("Error fetching page at offset=%s: %s", offset, e)
            break

    if not all_exercises:
        all_exercises = [normalize_exercise(ex) for ex in load_local_exercises()]
        logger.info("Falling back to local sample list (%d exercises)", len(all_exercises))

    EXERCISES_CACHE[ALL_EXERCISES_CACHE_KEY] = {"data": all_exercises, "ts": time.time()}
    save_persistent_cache()
    logger.info("Cached %d exercises (good for %ds)", len(all_exercises), CACHE_TTL)
    return all_exercises


def _filter_exercises(
    exercises: List[dict],
    search: Optional[str],
    bodypart: Optional[str],
    equipment: Optional[str],
) -> List[dict]:
    """Filter the in-memory exercise list. All filters are case-insensitive and combine with AND."""
    result = exercises
    if search:
        q = search.lower().strip()
        result = [
            ex for ex in result
            if q in ex.get("name", "").lower()
            or any(q in k.lower() for k in ex.get("keywords", []) or [])
        ]
    if bodypart:
        bp = bodypart.lower().strip()
        result = [ex for ex in result if any(bp == b.lower() for b in ex.get("bodyParts", []) or [])]
    if equipment:
        eq = equipment.lower().strip()
        result = [ex for ex in result if any(eq == e.lower() for e in ex.get("equipments", []) or [])]
    return result


@router.get("/exercises")
async def get_exercises(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    bodypart: Optional[str] = Query(None),
    equipment: Optional[str] = Query(None),
):
    """
    Unified exercise endpoint. Combines pagination, search, body-part filter, and equipment filter.
    All filters operate against the in-memory cache populated once per 24h.
    """
    try:
        all_exercises = await get_all_cached_exercises()
        filtered = _filter_exercises(all_exercises, search, bodypart, equipment)
        page = filtered[offset:offset + limit]
        return {
            "success": True,
            "total": len(filtered),
            "offset": offset,
            "limit": limit,
            "has_more": offset + limit < len(filtered),
            "exercises": page,
        }
    except Exception as e:
        logger.exception("Error in /exercises: %s", e)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/exercises/search")
async def search_exercises(
    query: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Legacy search endpoint — routes to the unified /exercises endpoint logic."""
    all_exercises = await get_all_cached_exercises()
    filtered = _filter_exercises(all_exercises, search=query, bodypart=None, equipment=None)
    return {
        "success": True,
        "query": query,
        "total": len(filtered),
        "offset": offset,
        "limit": limit,
        "has_more": offset + limit < len(filtered),
        "exercises": filtered[offset:offset + limit],
    }


@router.get("/exercises/bodypart/{bodypart}")
async def get_exercises_by_bodypart(
    bodypart: str,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Legacy body-part filter endpoint — routes to the unified /exercises endpoint logic."""
    all_exercises = await get_all_cached_exercises()
    filtered = _filter_exercises(all_exercises, search=None, bodypart=bodypart, equipment=None)
    return {
        "success": True,
        "bodypart": bodypart,
        "total": len(filtered),
        "offset": offset,
        "limit": limit,
        "has_more": offset + limit < len(filtered),
        "exercises": filtered[offset:offset + limit],
    }


@router.get("/exercises/equipment/{equipment}")
async def get_exercises_by_equipment(
    equipment: str,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Legacy equipment filter endpoint — routes to the unified /exercises endpoint logic."""
    all_exercises = await get_all_cached_exercises()
    filtered = _filter_exercises(all_exercises, search=None, bodypart=None, equipment=equipment)
    return {
        "success": True,
        "equipment": equipment,
        "total": len(filtered),
        "offset": offset,
        "limit": limit,
        "has_more": offset + limit < len(filtered),
        "exercises": filtered[offset:offset + limit],
    }


@router.get("/exercises/{exercise_id}")
async def get_exercise_by_id(exercise_id: str):
    """
    Get detailed information about a specific exercise
    """
    try:
        url = f"https://{EXERCISEDB_API_HOST}/api/v1/exercises/{exercise_id}"
        headers = api_headers()
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            if isinstance(data, dict):
                data = normalize_exercise(data)
            return {"success": True, "exercise": data}
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=404, detail=f"Exercise not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/bodyparts")
async def get_available_bodyparts():
    """List body parts derived from the cached exercise list (no extra API calls)."""
    all_exercises = await get_all_cached_exercises()
    parts = sorted({bp for ex in all_exercises for bp in (ex.get("bodyParts") or []) if isinstance(bp, str)})
    return {"success": True, "total": len(parts), "bodyParts": parts}


@router.get("/equipments")
async def get_available_equipments():
    """List equipment derived from the cached exercise list (no extra API calls)."""
    all_exercises = await get_all_cached_exercises()
    equip = sorted({eq for ex in all_exercises for eq in (ex.get("equipments") or []) if isinstance(eq, str)})
    return {"success": True, "total": len(equip), "equipments": equip}


# ========== WORKOUT PLAN ENDPOINTS (ML Integration Pending) ==========

class WorkoutRequest(BaseModel):
    user_id: str
    duration_minutes: int = 30
    difficulty: str = "intermediate"


@router.get("/recommend")
async def recommend_workout(fitness_level: str = "intermediate"):
    """
    Get recommended workout plan based on fitness level
    """
    plans = {
        "beginner": {
            "plan_name": "Beginner Full Body",
            "duration_weeks": 4,
            "days_per_week": 3,
            "exercises": [
                {"name": "Squats", "sets": 3, "reps": 10},
                {"name": "Push-ups", "sets": 3, "reps": 8},
                {"name": "Plank", "sets": 3, "duration": "30 seconds"}
            ],
            "estimated_calories": 250
        },
        "intermediate": {
            "plan_name": "Intermediate Strength",
            "duration_weeks": 6,
            "days_per_week": 4,
            "exercises": [
                {"name": "Squats", "sets": 4, "reps": 12},
                {"name": "Push-ups", "sets": 4, "reps": 15},
                {"name": "Lunges", "sets": 3, "reps": 10},
                {"name": "Plank", "sets": 3, "duration": "60 seconds"}
            ],
            "estimated_calories": 400
        },
        "advanced": {
            "plan_name": "Advanced HIIT",
            "duration_weeks": 8,
            "days_per_week": 5,
            "exercises": [
                {"name": "Jump Squats", "sets": 4, "reps": 15},
                {"name": "Burpees", "sets": 4, "reps": 12},
                {"name": "Mountain Climbers", "sets": 4, "duration": "45 seconds"},
                {"name": "Plank", "sets": 4, "duration": "90 seconds"}
            ],
            "estimated_calories": 600
        }
    }
    
    plan = plans.get(fitness_level.lower(), plans["intermediate"])
    return {
        "status": "success",
        "fitness_level": fitness_level,
        "plan": plan
    }


@router.post("/generate")
async def generate_workout_plan(request: WorkoutRequest):
    """
    Generate personalized workout plan (ML integration pending)
    """
    return {
        "message": "Workout plan generation endpoint - ML integration pending",
        "status": "not_implemented",
        "user_id": request.user_id
    }


@router.get("/history/{user_id}")
async def get_workout_history(user_id: str):
    """
    Get user's workout history (Database integration pending)
    """
    return {
        "message": "Workout history endpoint - Database integration pending",
        "user_id": user_id
    }


@router.post("/track")
async def track_workout_session():
    """
    Track completed workout session (Database integration pending)
    """
    return {
        "message": "Workout tracking endpoint - Database integration pending"
    }
