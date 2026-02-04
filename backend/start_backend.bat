@echo off
title AI Fitness Trainer - Backend Server
echo ========================================
echo   AI Fitness Trainer - Backend Server
echo ========================================
echo.

cd /d "%~dp0"
echo [1/4] Navigating to backend directory...
echo Current directory: %CD%
echo.

echo [2/4] Checking virtual environment...
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found!
    echo Please create virtual environment first:
    echo    python -m venv venv
    echo    venv\Scripts\activate
    echo    pip install -r requirements.txt
    pause
    exit /b 1
)

echo [3/4] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo [4/4] Installing/Checking dependencies...
python -m pip install --quiet email-validator httpx requests
echo.

echo ========================================
echo   Starting Backend Server on Port 8002
echo ========================================
echo.
echo Server will be available at:
echo   - http://127.0.0.1:8002
echo   - http://localhost:8002
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

set PYTHONIOENCODING=utf-8
python -m uvicorn app:app --host 0.0.0.0 --port 8002 --reload

if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start!
    echo Check the error messages above.
    pause
)
