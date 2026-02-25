@echo off
cd /d "%~dp0"
echo Starting Recruitment Admin (Port 3001)...
echo Projekt: %cd%
start "" cmd /k "cd /d %~dp0 && echo Recruitment Admin - %cd% && npm run dev"
echo Waiting for server to start...
timeout /t 5 /nobreak >nul
start http://localhost:3001
