@echo off
cd /d "%~dp0"
echo Recruitment Admin launcher
echo Project: %cd%
echo.
echo [1] OpenAI  (Port 3001)
echo [2] Infomaniak qwen3 (Port 3002)
set /p CHOICE=Choose instance (1/2):

if "%CHOICE%"=="2" (
  call "%~dp0start-infomaniak.bat"
) else (
  call "%~dp0start-openai.bat"
)
