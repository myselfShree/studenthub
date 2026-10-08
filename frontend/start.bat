@echo off
echo ==========================================
echo  Student Hub - Start Frontend (Local)
echo ==========================================
echo.

cd /d "%~dp0"

echo Starting Next.js frontend on http://localhost:3000
echo.
echo Press CTRL+C to stop the server.
echo.

npm run dev

pause
