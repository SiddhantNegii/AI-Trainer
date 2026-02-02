"""
Workout & Exercise API Routes
Exercise database from ExerciseDB API + Workout plan generation
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/workout", tags=["Workout"])

EXERCISEDB_API_KEY = os.getenv("EXERCISEDB_API_KEY")
EXERCISEDB_API_HOST = os.getenv("EXERCISEDB_API_HOST")
DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "exercises_sample.json")


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

@router.get("/exercises")
async def get_exercises(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get list of exercises from ExerciseDB API
    """
    try:
        print("EXERCISEDB_API_HOST:", EXERCISEDB_API_HOST, "EXERCISEDB_API_KEY set:", bool(EXERCISEDB_API_KEY))
        if EXERCISEDB_API_HOST:
            url = f"https://{EXERCISEDB_API_HOST}/api/v1/exercises"
            headers = {}
            if EXERCISEDB_API_KEY:
                headers = {
                    "x-rapidapi-key": EXERCISEDB_API_KEY,
                    "x-rapidapi-host": EXERCISEDB_API_HOST
                }
            params = {"limit": limit, "offset": offset}
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers or None, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                exercises = data.get("data", []) or data.get("data", [])
                for ex in exercises:
                    if "gifUrl" in ex and "imageUrl" not in ex:
                        ex["imageUrl"] = ex["gifUrl"]
        else:
            exercises = load_local_exercises()[offset:offset+limit]
        return {"success": True, "total": len(exercises), "exercises": exercises}
    
    except httpx.HTTPError:
        exercises = load_local_exercises()[offset:offset+limit]
        return {"success": True, "total": len(exercises), "exercises": exercises}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/exercises/search")
async def search_exercises(
    query: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search exercises by name
    """
    try:
        if EXERCISEDB_API_HOST:
            url = f"https://{EXERCISEDB_API_HOST}/api/v1/exercises/search"
            headers = {}
            if EXERCISEDB_API_KEY:
                headers = {"x-rapidapi-key": EXERCISEDB_API_KEY, "x-rapidapi-host": EXERCISEDB_API_HOST}
            params = {"search": query, "limit": limit}
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers or None, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                exercises = data.get("data", []) or data.get("data", [])
                for ex in exercises:
                    if "gifUrl" in ex and "imageUrl" not in ex:
                        ex["imageUrl"] = ex["gifUrl"]
        else:
            exercises = load_local_exercises()
            exercises = [ex for ex in exercises if query.lower() in ex.get("name", "").lower()][:limit]
        return {"success": True, "query": query, "total": len(exercises), "exercises": exercises}
    
    except httpx.HTTPError:
        exercises = load_local_exercises()
        exercises = [ex for ex in exercises if query.lower() in ex.get("name", "").lower()][:limit]
        return {"success": True, "query": query, "total": len(exercises), "exercises": exercises}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/exercises/bodypart/{bodypart}")
async def get_exercises_by_bodypart(
    bodypart: str,
    limit: int = Query(100, ge=1, le=200)
):
    """
    Get exercises filtered by body part (client-side filtering)
    """
    try:
        # Fetch exercises and filter by body part
        if EXERCISEDB_API_HOST:
            url = f"https://{EXERCISEDB_API_HOST}/api/v1/exercises"
            headers = {}
            if EXERCISEDB_API_KEY:
                headers = {"x-rapidapi-key": EXERCISEDB_API_KEY, "x-rapidapi-host": EXERCISEDB_API_HOST}
            params = {"limit": 200, "offset": 0}
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers or None, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                exercises = data.get("data", []) or data.get("data", [])
                for ex in exercises:
                    if "gifUrl" in ex and "imageUrl" not in ex:
                        ex["imageUrl"] = ex["gifUrl"]
        else:
            exercises = load_local_exercises()
        bodypart_upper = bodypart.upper()
        
        filtered_exercises = [
            ex for ex in exercises 
            if bodypart_upper in [bp.upper() for bp in ex.get("bodyParts", [])]
        ][:limit]
        
        return {"success": True, "bodypart": bodypart, "total": len(filtered_exercises), "exercises": filtered_exercises}
    
    except httpx.HTTPError:
        exercises = load_local_exercises()
        bodypart_upper = bodypart.upper()
        filtered_exercises = [ex for ex in exercises if bodypart_upper in [bp.upper() for bp in ex.get("bodyParts", [])]][:limit]
        return {"success": True, "bodypart": bodypart, "total": len(filtered_exercises), "exercises": filtered_exercises}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/exercises/equipment/{equipment}")
async def get_exercises_by_equipment(
    equipment: str,
    limit: int = Query(100, ge=1, le=200)
):
    """
    Get exercises filtered by equipment (client-side filtering)
    """
    try:
        # Fetch exercises and filter by equipment
        if EXERCISEDB_API_HOST:
            url = f"https://{EXERCISEDB_API_HOST}/api/v1/exercises"
            headers = {}
            if EXERCISEDB_API_KEY:
                headers = {"x-rapidapi-key": EXERCISEDB_API_KEY, "x-rapidapi-host": EXERCISEDB_API_HOST}
            params = {"limit": 200, "offset": 0}
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers or None, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                exercises = data.get("data", []) or data.get("data", [])
                for ex in exercises:
                    if "gifUrl" in ex and "imageUrl" not in ex:
                        ex["imageUrl"] = ex["gifUrl"]
        else:
            exercises = load_local_exercises()
        equipment_upper = equipment.upper()
        
        filtered_exercises = [
            ex for ex in exercises 
            if equipment_upper in [eq.upper() for eq in ex.get("equipments", [])]
        ][:limit]
        
        return {"success": True, "equipment": equipment, "total": len(filtered_exercises), "exercises": filtered_exercises}
    
    except httpx.HTTPError:
        exercises = load_local_exercises()
        equipment_upper = equipment.upper()
        filtered_exercises = [ex for ex in exercises if equipment_upper in [eq.upper() for eq in ex.get("equipments", [])]][:limit]
        return {"success": True, "equipment": equipment, "total": len(filtered_exercises), "exercises": filtered_exercises}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/exercises/{exercise_id}")
async def get_exercise_by_id(exercise_id: str):
    """
    Get detailed information about a specific exercise
    """
    try:
        url = f"https://{EXERCISEDB_API_HOST}/api/v1/exercises/{exercise_id}"
        headers = {}
        if EXERCISEDB_API_KEY:
            headers = {
                "x-rapidapi-key": EXERCISEDB_API_KEY,
                "x-rapidapi-host": EXERCISEDB_API_HOST
            }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers or None, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            if isinstance(data, dict) and "gifUrl" in data and "imageUrl" not in data:
                data["imageUrl"] = data["gifUrl"]
            return {"success": True, "exercise": data}
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=404, detail=f"Exercise not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/bodyparts")
async def get_available_bodyparts():
    """
    Get list of available body parts for filtering
    """
    try:
        # Extract unique body parts
        if EXERCISEDB_API_HOST:
            url = f"https://{EXERCISEDB_API_HOST}/api/v1/exercises"
            headers = {}
            if EXERCISEDB_API_KEY:
                headers = {"x-rapidapi-key": EXERCISEDB_API_KEY, "x-rapidapi-host": EXERCISEDB_API_HOST}
            params = {"limit": 100, "offset": 0}
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers or None, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                exercises = data.get("data", []) or data.get("data", [])
        else:
            exercises = load_local_exercises()
        body_parts_set = set()
        for ex in exercises:
            for bp in ex.get("bodyParts", []):
                body_parts_set.add(bp)
        
        body_parts = sorted(list(body_parts_set))
        
        return {"success": True, "total": len(body_parts), "bodyParts": body_parts}
    
    except httpx.HTTPError:
        exercises = load_local_exercises()
        body_parts_set = set()
        for ex in exercises:
            for bp in ex.get("bodyParts", []):
                body_parts_set.add(bp)
        body_parts = sorted(list(body_parts_set))
        return {"success": True, "total": len(body_parts), "bodyParts": body_parts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/equipments")
async def get_available_equipments():
    """
    Get list of available equipment types for filtering
    """
    try:
        # Extract unique equipment types
        if EXERCISEDB_API_HOST:
            url = f"https://{EXERCISEDB_API_HOST}/api/v1/exercises"
            headers = {}
            if EXERCISEDB_API_KEY:
                headers = {"x-rapidapi-key": EXERCISEDB_API_KEY, "x-rapidapi-host": EXERCISEDB_API_HOST}
            params = {"limit": 100, "offset": 0}
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers or None, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                exercises = data.get("data", []) or data.get("data", [])
        else:
            exercises = load_local_exercises()
        equipments_set = set()
        for ex in exercises:
            for eq in ex.get("equipments", []):
                equipments_set.add(eq)
        
        equipments = sorted(list(equipments_set))
        
        return {"success": True, "total": len(equipments), "equipments": equipments}
    
    except httpx.HTTPError:
        exercises = load_local_exercises()
        equipments_set = set()
        for ex in exercises:
            for eq in ex.get("equipments", []):
                equipments_set.add(eq)
        equipments = sorted(list(equipments_set))
        return {"success": True, "total": len(equipments), "equipments": equipments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


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
