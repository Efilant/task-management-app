@echo off
chcp 65001 >nul
echo ========================================
echo TASK MANAGEMENT APP - PROJE BASLATMA
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Backend baslatiliyor...
start "Backend Server" cmd /k "cd /d %CD%\backend && python manage.py runserver"
timeout /t 3 /nobreak >nul

echo [2/2] Frontend baslatiliyor...
start "Frontend Server" cmd /k "cd /d %CD%\frontend && npm start"

echo.
echo ========================================
echo ✅ PROJE BASLATILDI!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Sunucular ayri pencerelerde acildi.
echo Kapatmak icin o pencereleri kapatin.
echo.
echo Tarayicida http://localhost:3000 adresine gidin.
echo.
pause


