@echo off
cd /d "%~dp0"
echo Starting Recruitment Admin (OpenAI) on Port 3001...
start "" cmd /k "cd /d %~dp0 && set AI_PROVIDER=openai && set NEXT_PUBLIC_AI_PROVIDER=openai && set OPENAI_MODEL=gpt-5.2 && npm run dev"
echo Waiting for server to start...
timeout /t 5 /nobreak >nul
start http://localhost:3001
