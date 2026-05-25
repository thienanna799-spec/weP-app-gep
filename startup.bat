@echo off
setlocal
title GEP Auto Startup

set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo ============================================
echo   GEP - Auto Startup Node
echo ============================================
echo.

:: Step 0: Set Portable NodeJS PATH & Clean Zombies
set PATH=%PROJECT_DIR%portable\node;%PATH%
taskkill /F /IM node.exe >NUL 2>&1
taskkill /F /IM cloudflared.exe >NUL 2>&1

:: Step 0.5: Reset WSL2 to flush stale bind mount cache
:: INVARIANT: MUST run before Docker Desktop starts.
:: REASON: WSL2 caches volume mounts. After SSD move or PC restart, containers see partial/stale mysql_data.
:: HISTORY: EVT-2026-05-14 — MySQL crash-loop because WSL2 only mounted 9/40+ files from E:\mysql_data.
echo [PRE] Resetting WSL2 mount layer...
wsl --shutdown >NUL 2>&1
ping 127.0.0.1 -n 4 >nul
echo       WSL2 reset complete.

:: Step 1: Check Docker Installation
echo [1/7] Checking Docker Desktop...
if not exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo       [WARNING] Docker Desktop is not installed on this PC!
    echo       Starting Docker Installer from SSD...
    start "" "%PROJECT_DIR%installers\DockerDesktop.exe"
    echo       Please finish the Docker installation, restart your PC if needed, and run this script again.
    pause
    exit /b
)

tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I "Docker Desktop.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo       Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
) else (
    echo       Docker Desktop is already running.
)

:: Step 2: Wait for Docker daemon to be ready
echo [2/7] Waiting for Docker daemon to be ready...
:wait_docker
docker info >NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo       Docker daemon not ready yet, waiting 5 seconds...
    ping 127.0.0.1 -n 6 >nul
    goto wait_docker
)
echo       Docker daemon is ready!

:: Step 3: First Boot Logic & Start Database
echo [3/7] Starting MySQL container...
for /f "tokens=*" %%i in ('docker images -q mysql:8.0') do set HAS_MYSQL_IMAGE=%%i
if "%HAS_MYSQL_IMAGE%"=="" (
    echo       [First Boot] Docker image mysql:8.0 not found locally.
    echo       Loading from SSD backup... This may take a moment.
    docker load -i "%PROJECT_DIR%portable\docker_images\mysql_8.0.tar"
)

:: [SSD Portability Fix] Remove orphan containers from previous machine before starting
echo       [SSD Fix] Checking for orphan containers from previous machine...
docker rm -f bocchongsoc_db >NUL 2>&1
docker rm -f gep_memgraph >NUL 2>&1
docker rm -f gep_chroma >NUL 2>&1
echo       [SSD Fix] Orphan containers cleared. Starting fresh...
docker-compose up -d
echo       MySQL container started!

echo       Waiting for MySQL to be healthy...
:wait_mysql
docker inspect --format="{{.State.Health.Status}}" bocchongsoc_db 2>NUL | find "healthy" >NUL
if %ERRORLEVEL% NEQ 0 (
    ping 127.0.0.1 -n 4 >nul
    goto wait_mysql
)
echo       MySQL is healthy!

:: Auto-Backup Database (only if container is actually running)
echo       [Backup] Creating automatic daily database backup...
for /f "tokens=*" %%I in ('powershell -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set datetime=%%I
set BACKUP_FILE=%PROJECT_DIR%backups\backup_%datetime%.sql
docker exec bocchongsoc_db mysqldump -uroot -pmatkhau bocchongsoc > "%BACKUP_FILE%" 2>NUL
if %ERRORLEVEL% EQU 0 (
    echo       [Backup] Saved to %BACKUP_FILE%
) else (
    echo       [Backup] SKIPPED - Container not ready yet. Will backup next startup.
    del "%BACKUP_FILE%" >NUL 2>&1
)

:: Step 4: First Boot Node Dependencies & Start App
echo [4/7] Checking Dependencies and Starting App...
cd /d "%PROJECT_DIR%app"
if not exist "node_modules\" (
    echo       [First Boot] node_modules not found. Installing dependencies...
    call npm ci
)
start "GEP Dev Server" cmd /k "npm run dev"

:: Step 5: Start Cloudflare Tunnel (Portable)
echo [5/7] Starting Cloudflare Tunnel for gepoder.click...
:: INVARIANT: MUST use --protocol http2, NEVER --protocol auto.
:: REASON: 'auto' selects QUIC (UDP). Windows drops idle UDP → "context canceled" on ALL requests.
:: HISTORY: EVT-2026-05-13-001 (first fix) | EVT-2026-05-13-012 (recurrence after SSD move)
start "Cloudflare Tunnel" cmd /k ""%PROJECT_DIR%portable\cloudflared\cloudflared.exe" tunnel --protocol http2 --origincert "%PROJECT_DIR%portable\cloudflared\.cloudflared\cert.pem" --cred-file "%PROJECT_DIR%portable\cloudflared\.cloudflared\c6600d99-5f04-47ce-ad68-3b2d5600f4fc.json" --url http://127.0.0.1:3000 run gep-tunnel"

:: Step 6: Start OpenClaw Governance Agent
echo [6/7] Starting OpenClaw Telegram Bot...
cd /d "%PROJECT_DIR%app\openclaw"
if not exist "node_modules\" (
    echo       [First Boot] openclaw node_modules not found. Installing dependencies...
    call npm install
)
start "OpenClaw Telegram Bot" cmd /k "npm run dev"

:: Step 7: Start AI Engineering OS Watcher
echo [7/7] Starting AI Memory Watcher...
cd /d "%PROJECT_DIR%app\ai\automation"
if not exist "node_modules\" (
    echo       [First Boot] automation node_modules not found. Installing dependencies...
    call npm install
)
start "AI Memory Watcher" cmd /k "npm run watch"

:: Step 8: Start GEP Git Auto-Sync Service (Every 10 mins)
echo [8/8] Starting Git Auto-Sync Daemon...
cd /d "%PROJECT_DIR%"
start "GEP Git Auto-Sync" cmd /k "%PROJECT_DIR%auto_git_push.bat"