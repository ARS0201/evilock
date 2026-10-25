@echo off
title EviLock - Secure Digital Evidence Management
echo =====================================================================
echo    EVILOCK - STARTING LOCAL APPLICATION WITH GLOBAL SUPABASE DB
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "EviLock Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Frontend on http://127.0.0.1:5173 ...
start "EviLock Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Waiting for servers to initialize...
timeout /t 3 >nul

echo Launching browser at http://127.0.0.1:5173 ...
start http://127.0.0.1:5173

echo.
echo =====================================================================
echo    EVILOCK IS RUNNING!
echo    - Frontend: http://127.0.0.1:5173
echo    - Backend:  http://127.0.0.1:8000
echo    - API Docs: http://127.0.0.1:8000/docs
echo =====================================================================
pause
