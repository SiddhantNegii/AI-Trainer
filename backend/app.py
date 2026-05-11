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
import logging

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai-trainer.app")

# Import routers
from routes.workout import router as workout_router
from routes.diet import router as diet_router
from routes.auth import router as auth_router
from routes.pose import router as pose_router

# Add ml_models to path for pose detection
ml_models_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml_models', 'pose_detection'))
sys.path.insert(0, ml_models_path)

app = FastAPI(
    title="AI Fitness Trainer API",
    description="Backend API for AI-powered virtual fitness trainer",
    version="1.0.0"
)

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

# Include routers
app.include_router(workout_router)
app.include_router(diet_router)
app.include_router(auth_router)
app.include_router(pose_router)


@app.websocket("/ws/pose")
async def websocket_pose_detection(websocket: WebSocket):
    """
    WebSocket endpoint for real-time pose detection
    Receives video frames, processes with MediaPipe, returns analysis
    """
    logger.info("WebSocket connection attempt...")
    await websocket.accept()
    logger.info("WebSocket connected")
    try:
        from pose_detector import PoseDetector
        from exercise_analyzer import ExerciseAnalyzer
    except Exception as e:
        await websocket.send_json({"error": f"MediaPipe not available: {str(e)}"})
        await websocket.close()
        return
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
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.exception("Error in websocket: %s", e)
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
    port = int(os.getenv("PORT", "8002"))
    uvicorn.run(app, host="0.0.0.0", port=port)
