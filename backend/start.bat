@echo off
echo ==========================================
echo  Student Hub - Start Backend (Local)
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/2] Activating Python virtual environment...
call .venv\Scripts\activate.bat

echo [2/2] Starting FastAPI backend on http://localhost:8000
echo  - API Docs: http://localhost:8000/docs
echo  - Health:   http://localhost:8000/api/v1/health
echo.
echo Press CTRL+C to stop the server.
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
