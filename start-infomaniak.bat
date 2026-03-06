@echo off
cd /d "%~dp0"
echo Starting Recruitment Admin (Infomaniak) on Port 3002...
start "" cmd /k "cd /d %~dp0 && set AI_PROVIDER=infomaniak && set NEXT_PUBLIC_AI_PROVIDER=infomaniak && set INFOMANIAK_MODEL=qwen3 && npx next dev --port 3002"
echo Waiting for server to start...
timeout /t 5 /nobreak >nul
start http://localhost:3002
