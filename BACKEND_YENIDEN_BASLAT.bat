@echo off
chcp 65001 >nul
echo ========================================
echo BACKEND YENIDEN BASLATILIYOR
echo ========================================
echo.

echo [1/2] Mevcut backend process'leri kapatiliyor...
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/2] Backend baslatiliyor...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "cd /d %CD%\backend && py manage.py runserver"

cd /d "%~dp0"

echo.
echo ========================================
echo ✅ BACKEND YENIDEN BASLATILDI!
echo ========================================
echo.
echo Backend: http://localhost:8000
echo.
echo Terminal penceresinde kodlari goreceksiniz.
echo.
pause


