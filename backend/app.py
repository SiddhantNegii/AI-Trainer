"""
FastAPI Backend for AI Fitness Trainer
Main application entry point
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import cv2
import numpy as np
import json
import base64
import sys
import os

# Import routers
from routes.workout import router as workout_router
from routes.diet import router as diet_router
from routes.auth import router as auth_router
from routes.pose import router as pose_router
from routes.analytics import router as analytics_router

# Add ml_models to path for pose detection
ml_models_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml_models', 'pose_detection'))
sys.path.insert(0, ml_models_path)

try:
    from pose_detector import PoseDetector
    from exercise_analyzer import ExerciseAnalyzer
    MEDIAPIPE_AVAILABLE = True
    print(f"MediaPipe modules loaded from: {ml_models_path}")
except ImportError as e:
    MEDIAPIPE_AVAILABLE = False
    print(f"WARNING: MediaPipe not available: {e}")

app = FastAPI(
    title="AI Fitness Trainer API",
    description="Backend API for AI-powered virtual fitness trainer",
    version="1.0.0"
)

frontend_origin = os.getenv("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin] if frontend_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(workout_router)
app.include_router(diet_router)
app.include_router(auth_router)
app.include_router(pose_router)
app.include_router(analytics_router)


@app.websocket("/ws/pose")
async def websocket_pose_detection(websocket: WebSocket):
    """
    WebSocket endpoint for real-time pose detection
    Receives video frames, processes with MediaPipe, returns analysis
    """
    print("WebSocket connection attempt...")
    await websocket.accept()
    print("WebSocket connected!")
    
    if not MEDIAPIPE_AVAILABLE:
        await websocket.send_json({
            "error": "MediaPipe not available. Please install: pip install mediapipe opencv-python numpy"
        })
        await websocket.close()
        return
    
    # Initialize pose detector and analyzer
    pose_detector = PoseDetector(min_detection_confidence=0.5, min_tracking_confidence=0.5)
    exercise_analyzer = ExerciseAnalyzer()
    current_exercise = "squat"
    
    try:
        while True:
            # Receive data from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "frame":
                # Decode base64 image
                image_data = message.get("image", "").split(",")[1]
                image_bytes = base64.b64decode(image_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is not None:
                    # Detect pose
                    frame_with_pose, landmarks = pose_detector.detect_pose(frame, draw=False)
                    
                    # Analyze exercise
                    result = {"exercise": current_exercise, "rep_count": 0, "form_score": 0, "feedback": []}
                    
                    if landmarks:
                        if current_exercise == "squat":
                            result = exercise_analyzer.analyze_squat(landmarks)
                        elif current_exercise == "pushup":
                            result = exercise_analyzer.analyze_pushup(landmarks)
                        elif current_exercise == "plank":
                            result = exercise_analyzer.analyze_plank(landmarks)
                        
                        # Draw skeleton on frame
                        frame_with_pose, _ = pose_detector.detect_pose(frame, draw=True)
                    
                    # Encode processed frame
                    _, buffer = cv2.imencode('.jpg', frame_with_pose)
                    processed_image = base64.b64encode(buffer).decode('utf-8')
                    
                    # Send response
                    await websocket.send_json({
                        "type": "analysis",
                        "image": f"data:image/jpeg;base64,{processed_image}",
                        "rep_count": result.get("reps", 0),
                        "form_score": result.get("form_score", 0),
                        "feedback": result.get("feedback", []),
                        "exercise": current_exercise,
                        "stage": result.get("stage", "")
                    })
            
            elif message.get("type") == "change_exercise":
                current_exercise = message.get("exercise", "squat")
                exercise_analyzer.reset_reps()
                await websocket.send_json({
                    "type": "exercise_changed",
                    "exercise": current_exercise
                })
            
            elif message.get("type") == "reset":
                exercise_analyzer.reset_reps()
                await websocket.send_json({
                    "type": "reset_complete"
                })
    
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"Error in websocket: {str(e)}")
        await websocket.send_json({
            "error": str(e)
        })


@app.get("/")
async def root():
    """
    Health check endpoint
    """
    return {
        "message": "AI Fitness Trainer API is running",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "workout": "/api/workout",
            "diet": "/api/diet",
            "auth": "/api/auth",
            "pose": "/api/pose",
            "analytics": "/api/analytics",
            "docs": "/docs"
        }
    }


@app.get("/api/health")
async def health_check():
    """
    API health check
    """
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
