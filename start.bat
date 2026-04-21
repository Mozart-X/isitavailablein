@echo off
setlocal

cd /d "%~dp0"

echo.
echo ============================================
echo   IsItAvailableIn - local dev server
echo ============================================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 goto :error
)

if not exist "data.db" (
    echo Seeding database...
    call npm run seed
    if errorlevel 1 goto :error
)

echo.
echo Detecting your local IP address...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do (
    for /f "tokens=* delims= " %%b in ("%%a") do (
        echo   On THIS pc:   http://localhost:3000
        echo   From phone:   http://%%b:3000
    )
)

echo.
echo Tip: to access from your phone, connect it to the SAME Wi-Fi as this PC.
echo      If it does not load, allow Node through Windows Firewall when prompted.
echo.
echo Press Ctrl+C to stop the server.
echo ============================================
echo.

call npx next dev --hostname 0.0.0.0 --port 3000
goto :eof

:error
echo.
echo Something failed. See messages above.
pause
