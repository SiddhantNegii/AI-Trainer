@echo off
title AI Fitness Trainer - Frontend
echo ========================================
echo   AI Fitness Trainer - Frontend
echo ========================================
echo.

cd /d "%~dp0"
echo [1/3] Navigating to frontend directory...
echo Current directory: %CD%
echo.

echo [2/3] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo [3/3] Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies... This may take a few minutes.
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)
echo.

echo ========================================
echo   Starting Frontend Development Server
echo ========================================
echo.
echo Frontend will be available at:
echo   - http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm run dev

if errorlevel 1 (
    echo.
    echo ERROR: Frontend server failed to start!
    echo Check the error messages above.
    pause
)
