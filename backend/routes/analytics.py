"""
Analytics API Routes
Provides workout analytics and progress tracking endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import csv
import sys
import os

# Add ml_models to path
backend_dir = os.path.dirname(os.path.dirname(__file__))
ml_models_path = os.path.abspath(os.path.join(backend_dir, '..', 'ml_models'))
sys.path.insert(0, ml_models_path)

try:
    from analytics.analytics_engine import AnalyticsEngine
    analytics_engine = AnalyticsEngine()
    print(f"Analytics Engine loaded from: {ml_models_path}")
except Exception as e:
    print(f"WARNING: Analytics Engine not available: {e}")
    print(f"   Searched in: {ml_models_path}")
    analytics_engine = None

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/test")
async def test_route():
    """Simple test route"""
    print("Test route called!")
    try:
        result = {"status": "ok", "message": "Analytics routes working"}
        print(f"Returning: {result}")
        return result
    except Exception as e:
        print(f"Error in test route: {e}")
        import traceback
        traceback.print_exc()
        raise


class WorkoutSession(BaseModel):
    date: str
    exercise_type: str
    duration_minutes: int
    calories_burned: int
    intensity: int  # 1-10 scale
    reps: Optional[int] = 0
    sets: Optional[int] = 0


class ProgressDataPoint(BaseModel):
    date: str
    value: float


class GoalPredictionRequest(BaseModel):
    current_progress: float
    goal: float
    history: List[ProgressDataPoint]


@router.get("/weekly-stats")
async def get_weekly_stats():
    """Get statistics for the last 7 days"""
    if not analytics_engine:
        raise HTTPException(status_code=503, detail="Analytics engine not available")
    
    csv_path = os.path.join(ml_models_path, 'analytics', 'sample_workout_history.csv')
    
    try:
        workouts = []
        if os.path.exists(csv_path):
            with open(csv_path, mode='r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    workouts.append({
                        "date": row.get("date", ""),
                        "exercise_type": row.get("exercise_type", ""),
                        "duration_minutes": int(row.get("duration_minutes", 0) or 0),
                        "calories_burned": int(row.get("calories_burned", 0) or 0),
                        "intensity": int(row.get("intensity", 0) or 0),
                        "reps": int(row.get("reps", 0) or 0),
                        "sets": int(row.get("sets", 0) or 0),
                    })
        
        stats = analytics_engine.calculate_weekly_stats(workouts)
        return {
            "status": "success",
            "stats": stats,
            "message": "Weekly statistics calculated"
        }
    except Exception as e:
        print(f"Error in weekly stats: {e}")
        # Return default data if CSV is empty or error
        stats = {
            'total_workouts': 0,
            'total_calories': 0,
            'total_duration': 0,
            'avg_intensity': 0,
            'most_common_exercise': 'None',
            'workout_streak': 0
        }
        return {
            "status": "success",
            "stats": stats,
            "message": "No workout data yet"
        }


@router.get("/performance-metrics")
async def get_performance_metrics():
    """Get comprehensive performance metrics"""
    if not analytics_engine:
        raise HTTPException(status_code=503, detail="Analytics engine not available")
    
    csv_path = os.path.join(ml_models_path, 'analytics', 'sample_workout_history.csv')
    
    try:
        workouts = []
        if os.path.exists(csv_path):
            with open(csv_path, mode='r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    workouts.append({
                        "date": row.get("date", ""),
                        "exercise_type": row.get("exercise_type", ""),
                        "duration_minutes": int(row.get("duration_minutes", 0) or 0),
                        "calories_burned": int(row.get("calories_burned", 0) or 0),
                        "intensity": int(row.get("intensity", 0) or 0),
                        "reps": int(row.get("reps", 0) or 0),
                        "sets": int(row.get("sets", 0) or 0),
                    })
        
        metrics = analytics_engine.calculate_performance_metrics(workouts)
        return {
            "status": "success",
            "metrics": metrics,
            "message": "Performance metrics calculated"
        }
    except Exception as e:
        print(f"Error in performance metrics: {e}")
        # Return default data if CSV is empty or error
        metrics = {
            'total_workouts': 0,
            'total_time_minutes': 0,
            'avg_workout_duration': 0,
            'total_calories_burned': 0,
            'favorite_exercises': [],
            'peak_performance_day': 'Not enough data',
            'consistency_percentage': 0
        }
        return {
            "status": "success",
            "metrics": metrics,
            "message": "No workout data yet"
        }


@router.get("/insights")
async def get_insights():
    """Get personalized workout insights"""
    if not analytics_engine:
        raise HTTPException(status_code=503, detail="Analytics engine not available")
    
    csv_path = os.path.join(ml_models_path, 'analytics', 'sample_workout_history.csv')
    
    try:
        workouts = []
        if os.path.exists(csv_path):
            with open(csv_path, mode='r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    workouts.append({
                        "date": row.get("date", ""),
                        "exercise_type": row.get("exercise_type", ""),
                        "duration_minutes": int(row.get("duration_minutes", 0) or 0),
                        "calories_burned": int(row.get("calories_burned", 0) or 0),
                        "intensity": int(row.get("intensity", 0) or 0),
                        "reps": int(row.get("reps", 0) or 0),
                        "sets": int(row.get("sets", 0) or 0),
                    })
        
        user_data = {
            'workouts': workouts,
            'consistency_score': 85
        }
        
        insights = analytics_engine.generate_insights(user_data)
        return {
            "status": "success",
            "insights": insights,
            "count": len(insights)
        }
    except Exception as e:
        print(f"Error in insights: {e}")
        # Return motivational message if no data
        insights = ["Start working out to get personalized insights! 💪"]
        return {
            "status": "success",
            "insights": insights,
            "count": len(insights)
        }


@router.post("/predict-goal")
async def predict_goal(request: GoalPredictionRequest):
    """Predict when user will achieve their goal"""
    if not analytics_engine:
        raise HTTPException(status_code=503, detail="Analytics engine not available")
    
    try:
        history = [{"date": p.date, "value": p.value} for p in request.history]
        
        prediction = analytics_engine.predict_goal_achievement(
            current_progress=request.current_progress,
            goal=request.goal,
            history=history
        )
        
        return {
            "status": "success",
            "prediction": prediction,
            "current_progress": request.current_progress,
            "goal": request.goal
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting goal: {str(e)}")


@router.post("/log-workout")
async def log_workout(workout: WorkoutSession):
    """Log a new workout session"""
    csv_path = os.path.join(ml_models_path, 'analytics', 'sample_workout_history.csv')
    
    try:
        file_exists = os.path.exists(csv_path)
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)
        fieldnames = ['date', 'exercise_type', 'duration_minutes', 'calories_burned', 'intensity', 'reps', 'sets']
        # Append row and write header if file didn't exist
        with open(csv_path, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            if not file_exists:
                writer.writeheader()
            writer.writerow(workout.dict())
        
        return {
            "status": "success",
            "message": "Workout logged successfully",
            "workout": workout.dict()
        }
    except Exception as e:
        print(f"Error logging workout: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error logging workout: {str(e)}")


@router.get("/workout-history")
async def get_workout_history(limit: int = 30):
    """Get workout history"""
    csv_path = os.path.join(ml_models_path, 'analytics', 'sample_workout_history.csv')
    
    try:
        workouts = []
        if os.path.exists(csv_path):
            with open(csv_path, mode='r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    workouts.append(row)
        # Sort by date descending and limit
        workouts = sorted(workouts, key=lambda x: x.get('date', ''), reverse=True)[:limit]
        
        return {
            "status": "success",
            "workouts": workouts,
            "count": len(workouts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")
