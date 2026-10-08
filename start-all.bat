@echo off
echo ==========================================
echo  Student Hub - Start BOTH (Local Dev)
echo ==========================================
echo.
echo Starting Backend in a new window...
start "StudentHub - Backend" cmd /k "cd /d d:\fullp\backend && call .venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting Frontend in a new window...
start "StudentHub - Frontend" cmd /k "cd /d d:\fullp\frontend && npm run dev"

echo.
echo ==========================================
echo  Both servers are starting!
echo  Backend:  http://localhost:8000
echo  Docs:     http://localhost:8000/docs
echo  Frontend: http://localhost:3000
echo ==========================================
echo.
pause
