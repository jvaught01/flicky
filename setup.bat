@echo off
setlocal
cd /d "%~dp0"

echo [Flicky] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [Flicky] ERROR: Node.js is not installed or not in PATH.
    echo         Download it from https://nodejs.org
    pause
    exit /b 1
)

echo [Flicky] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [Flicky] ERROR: npm install failed.
    pause
    exit /b 1
)

echo [Flicky] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo [Flicky] ERROR: Build failed.
    pause
    exit /b 1
)

echo [Flicky] Setup complete. Launching Flicky...
call npm start
