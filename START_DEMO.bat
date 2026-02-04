@echo off
title AI Fitness Trainer - Demo Launcher
color 0A
cls

echo.
echo     ╔═══════════════════════════════════════════════════════╗
echo     ║                                                       ║
echo     ║         AI FITNESS TRAINER - DEMO LAUNCHER            ║
echo     ║                                                       ║
echo     ║            Presentation Ready Setup                   ║
echo     ║                                                       ║
echo     ╚═══════════════════════════════════════════════════════╝
echo.
echo.

echo [SYSTEM CHECK] Verifying environment...
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)
echo [OK] Python found: 
python --version

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node --version
echo.

echo ========================================
echo   Select Launch Mode:
echo ========================================
echo.
echo   1. Start Backend Only
echo   2. Start Frontend Only
echo   3. Start Both (Full Demo)
echo   4. Check API Connection
echo   5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto test
if "%choice%"=="5" exit /b 0

echo Invalid choice. Please try again.
pause
goto :eof

:backend
echo.
echo [LAUNCHING] Starting Backend Server...
echo.
start "AI Fitness Backend" cmd /k "cd /d "%~dp0backend" && start_backend.bat"
timeout /t 3 >nul
echo.
echo Backend server is starting...
echo Check the Backend window for status.
echo.
echo Backend API: http://127.0.0.1:8002
echo API Docs: http://127.0.0.1:8002/docs
echo.
pause
goto :eof

:frontend
echo.
echo [LAUNCHING] Starting Frontend Server...
echo.
echo IMPORTANT: Make sure Backend is running on port 8002!
timeout /t 2 >nul
start "AI Fitness Frontend" cmd /k "cd /d "%~dp0frontend" && start_frontend.bat"
timeout /t 3 >nul
echo.
echo Frontend server is starting...
echo Check the Frontend window for status.
echo.
echo Once ready, open: http://localhost:3000
echo.
pause
goto :eof

:both
echo.
echo [LAUNCHING] Starting Full Demo Environment...
echo.
echo Step 1/2: Starting Backend Server...
start "AI Fitness Backend" cmd /k "cd /d "%~dp0backend" && start_backend.bat"
echo Waiting for backend to initialize...
timeout /t 8 >nul

echo.
echo Step 2/2: Starting Frontend Server...
start "AI Fitness Frontend" cmd /k "cd /d "%~dp0frontend" && start_frontend.bat"
echo Waiting for frontend to initialize...
timeout /t 5 >nul

echo.
echo ========================================
echo   DEMO ENVIRONMENT READY!
echo ========================================
echo.
echo   Backend API:  http://127.0.0.1:8002
echo   API Docs:     http://127.0.0.1:8002/docs
echo.
echo   Frontend:     http://localhost:3000
echo.
echo   Opening browser in 5 seconds...
echo ========================================
timeout /t 5 >nul

start http://localhost:3000

echo.
echo Demo is running!
echo Check the Backend and Frontend windows for logs.
echo.
echo Press any key to return to menu...
pause >nul
goto :eof

:test
echo.
echo [TESTING] Checking API Connection...
echo.
cd /d "%~dp0backend"
python -c "import requests; r=requests.get('http://127.0.0.1:8002/api/health', timeout=5); print('✓ Backend is running!' if r.status_code==200 else '✗ Backend returned error'); print('Status:', r.status_code); print('Response:', r.json())" 2>nul
if errorlevel 1 (
    echo.
    echo ✗ Backend is not responding!
    echo   Please start the backend first (Option 1 or 3)
) else (
    echo.
    echo Testing exercise API...
    python -c "import requests; r=requests.get('http://127.0.0.1:8002/api/workout/exercises?limit=5', timeout=5); data=r.json(); print('✓ Exercises API working!' if r.status_code==200 and data.get('success') else '✗ Exercise API error'); print('Exercises found:', data.get('total', 0))" 2>nul
)
echo.
pause
goto :eof
