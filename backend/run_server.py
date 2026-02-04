import uvicorn
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    print("Starting server on http://127.0.0.1:8002")
    uvicorn.run("app:app", host="127.0.0.1", port=8002, log_level="info", reload=True)
