# EviLock 1-Click Launch Script
Write-Host "=====================================================================" -ForegroundColor DarkYellow
Write-Host "   EVILOCK - STARTING LOCAL APPLICATION WITH GLOBAL SUPABASE DB" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor DarkYellow

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend
Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Start Frontend
Write-Host "[2/2] Starting React Frontend on http://127.0.0.1:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; npm run dev -- --host 127.0.0.1 --port 5173"

Start-Sleep -Seconds 3

Write-Host "`nLaunching browser at http://127.0.0.1:5173 ..." -ForegroundColor Green
Start-Process "http://127.0.0.1:5173"

Write-Host "`n=====================================================================" -ForegroundColor Green
Write-Host "   EVILOCK IS RUNNING!" -ForegroundColor Green
Write-Host "   - Frontend: http://127.0.0.1:5173"
Write-Host "   - Backend:  http://127.0.0.1:8000"
Write-Host "   - API Docs: http://127.0.0.1:8000/docs"
Write-Host "====================================================================="
