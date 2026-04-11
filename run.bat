@echo off
setlocal
cd /d "%~dp0"

if not exist "dist\main\main\index.js" (
    echo [Flicky] ERROR: Application is not built. Run setup.bat first.
    pause
    exit /b 1
)

echo [Flicky] Starting Flicky...
call npm start
