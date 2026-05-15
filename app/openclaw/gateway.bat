@echo off
REM ================================================================
REM OpenClaw Gateway — Windows Quick Start
REM ================================================================

if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="status" goto status
goto help

:start
echo.
echo  🦞 Starting OpenClaw Telegram Gateway...
echo.

REM Option A: Run directly with Node (simplest)
start "OpenClaw Gateway" cmd /k "cd /d %~dp0 && npx tsx scripts/run.ts listen"
echo  ✅ Gateway started in new window.
echo  📱 Check Telegram — @Devdavidbot should be ONLINE
goto end

:stop
echo  🛑 Stopping OpenClaw Gateway...
taskkill /F /FI "WINDOWTITLE eq OpenClaw Gateway" 2>nul
echo  ✅ Stopped.
goto end

:restart
call %0 stop
timeout /t 2 /nobreak >nul
call %0 start
goto end

:logs
type logs\gateway.log 2>nul || echo No log file found.
goto end

:status
echo.
echo  🦞 OpenClaw Gateway Status:
tasklist | findstr "node" >nul
if %errorlevel%==0 (
  echo  ✅ RUNNING ^(node.js process found^)
) else (
  echo  ❌ NOT RUNNING
)
goto end

:help
echo.
echo  Usage: gateway.bat [start^|stop^|restart^|logs^|status]
echo.
echo    start    — Start the Telegram Gateway in new window
echo    stop     — Stop the Gateway
echo    restart  — Restart the Gateway
echo    logs     — View log output
echo    status   — Check if Gateway is running
echo.

:end
