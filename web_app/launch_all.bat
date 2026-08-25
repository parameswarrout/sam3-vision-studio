@echo off
title SAM 3 Full-Stack Vision App
echo ========================================================
echo   SAM 3: Decoupled Next.js (JS) + FastAPI (Python)
echo ========================================================
echo.

echo [1/2] Starting Python FastAPI Backend on http://localhost:8000 ...
start "SAM 3 FastAPI Backend" cmd /k "cd backend && python run.py"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Next.js Frontend on http://localhost:3000 ...
start "SAM 3 Next.js Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application successfully launched!
echo - Frontend: http://localhost:3000
echo - Backend API Docs: http://localhost:8000/api/v1/docs
echo.
pause
