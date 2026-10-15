@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python 3.10 or newer is required. Install from https://www.python.org/downloads/
  pause
  exit /b 1
)
echo Starting ScopeKit. Open http://127.0.0.1:8765 in your browser.
echo Keep this window open while using the app. Press Ctrl+C to stop.
python launch.py
pause
