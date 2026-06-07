@echo off
:: LinkedIn Emailer Tool - Windows Launcher
:: Double-click this file to start the app

cd /d "%~dp0"

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)
if not exist "client\node_modules" (
    echo Installing client dependencies...
    call npm install --prefix client
)

echo.
echo   Starting LinkedIn Emailer Tool...
echo   App will open at http://localhost:5173
echo.

:: Open browser after a short delay
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

call npm run dev
