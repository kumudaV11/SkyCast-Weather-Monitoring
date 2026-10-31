@echo off
setlocal enabledelayedexpansion
title Stopping SKYCAST Server...

echo ======================================================================
echo    SKYCAST - Shutdown Script
echo ======================================================================
echo.

echo Searching for running SKYCAST Flask instances on port 5000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    set PID_FOUND=%%a
    echo Found process with PID: !PID_FOUND! listening on port 5000.
    echo Terminating PID !PID_FOUND!...
    taskkill /F /PID !PID_FOUND! >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [SUCCESS] Successfully stopped SKYCAST server (PID: !PID_FOUND!).
    ) else (
        echo [INFO] Process was already stopped or required elevation.
    )
)

if not defined PID_FOUND (
    echo [INFO] No active SKYCAST instance found on port 5000.
)

echo.
echo ======================================================================
echo    SKYCAST server shutdown complete.
echo ======================================================================
echo.
timeout /t 3 >nul
exit /b 0
