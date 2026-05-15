@echo off
title GEP Auto Shutdown
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo ============================================
echo   GEP - Safe Shutdown
echo ============================================
echo.
echo [1/2] Stopping NodeJS processes...
taskkill /F /IM node.exe >NUL 2>&1
echo       NodeJS stopped.

echo [2/2] Stopping Docker containers gracefully...
docker-compose down
echo       Docker containers stopped.

echo.
echo ============================================
echo   Shutdown complete. It is now safe to unplug the SSD!
echo ============================================
pause
