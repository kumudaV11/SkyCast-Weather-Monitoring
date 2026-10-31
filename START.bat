@echo off
setlocal enabledelayedexpansion
title SKYCAST - Weather Intelligence & AWS Multi-Instance Platform

echo ======================================================================
echo    SKYCAST - Intelligent Weather Monitoring & AWS Multi-EC2 Platform
echo    Production-Grade College Project Environment Loader
echo ======================================================================
echo.

:: 1. Check Python Installation
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not detected in your system PATH.
    echo Please install Python 3.11 or higher from https://www.python.org/
    echo Make sure to check the box "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

:: 2. Display Python Version
echo [1/5] Verifying Python installation...
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VER=%%i
echo       Detected: !PYTHON_VER!

:: 3. Setup Virtual Environment
if not exist ".venv\Scripts\activate.bat" (
    echo [2/5] Creating dedicated virtual environment (.venv)...
    python -m venv .venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo       Virtual environment created successfully.
) else (
    echo [2/5] Virtual environment (.venv) already exists.
)

:: 4. Activate Virtual Environment
echo [3/5] Activating virtual environment...
call .venv\Scripts\activate.bat

:: 5. Install / Verify Requirements
echo [4/5] Checking and installing dependencies from requirements.txt...
python -m pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Encountered issues during package installation. Retrying with verbose logs...
    pip install -r requirements.txt
)

:: 6. Launch Application and Browser
echo [5/5] Starting SKYCAST server on http://localhost:5000...
echo.
echo ======================================================================
echo    SKYCAST is now running!
echo    URL: http://localhost:5000
echo    To stop the server, run STOP.bat or press Ctrl + C in this window.
echo ======================================================================
echo.

:: Launch default web browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5000"

:: Run Flask Application
python app.py

pause
