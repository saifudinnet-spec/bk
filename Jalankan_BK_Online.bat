@echo off
setlocal enabledelayedexpansion
title BK Online - Server Launcher

:: ==========================================================
:: DETEKSI FOLDER PROJECT
:: ==========================================================
if exist "%~dp0backend\artisan" if exist "%~dp0frontend\package.json" (
    set "PROJECT_DIR=%~dp0"
) else (
    set "PROJECT_DIR=c:\Users\Saifudin\.gemini\antigravity-ide\scratch\bk-online"
)

:: Hilangkan trailing slash jika ada
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"

if not exist "%BACKEND_DIR%\artisan" (
    color 0C
    echo ========================================================
    echo  [ERROR] Direktori Backend tidak ditemukan!
    echo  Target: %BACKEND_DIR%
    echo ========================================================
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
    color 0C
    echo ========================================================
    echo  [ERROR] Direktori Frontend tidak ditemukan!
    echo  Target: %FRONTEND_DIR%
    echo ========================================================
    pause
    exit /b 1
)

:START_SERVERS
color 0A
cls
echo ========================================================
echo        BK ONLINE - APLIKASI BIMBINGAN KONSELING
echo ========================================================
echo  Lokasi Project : %PROJECT_DIR%
echo ========================================================
echo.
echo  [1/3] Menjalankan Backend Laravel (Port 8000)...
start "BK-Online Backend [Port 8000]" /min cmd /k "cd /d "%BACKEND_DIR%" && title BK-Online Backend && echo [Backend Berjalan di Port 8000] && php artisan serve --host=127.0.0.1 --port=8000"

echo  [2/3] Menjalankan Frontend Vite React (Port 5173)...
start "BK-Online Frontend [Port 5173]" /min cmd /k "cd /d "%FRONTEND_DIR%" && title BK-Online Frontend && echo [Frontend Berjalan di Port 5173] && npm run dev"

echo  [3/3] Menunggu server inisialisasi...
timeout /t 3 /nobreak >nul

echo.
echo  Membuka browser ke http://localhost:5173 ...
start http://localhost:5173

:MENU
color 0B
cls
echo ========================================================
echo        BK ONLINE - STATUS SERVER AKTIF
echo ========================================================
echo.
echo   [OK] Backend API   : http://127.0.0.1:8000
echo   [OK] Frontend Web  : http://localhost:5173
echo.
echo   Kedua server berjalan di latar belakang (minimized).
echo ========================================================
echo   PILIHAN KONTROL:
echo   [1] Buka Web di Browser (http://localhost:5173)
echo   [2] Buka API Backend (http://127.0.0.1:8000)
echo   [3] Restart Semua Server
echo   [4] Hentikan Server ^& Keluar
echo ========================================================
echo.
set /p "choice=Pilih nomor [1-4]: "

if "%choice%"=="1" (
    start http://localhost:5173
    goto MENU
)
if "%choice%"=="2" (
    start http://127.0.0.1:8000
    goto MENU
)
if "%choice%"=="3" (
    echo.
    echo Menghentikan proses pada port 8000 dan 5173...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 /nobreak >nul
    echo Memulai ulang...
    goto START_SERVERS
)
if "%choice%"=="4" (
    echo.
    echo Menghentikan server BK Online...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
    echo Server berhasil dimatikan. Sampai jumpa!
    timeout /t 2 /nobreak >nul
    exit /b 0
)

echo Pilihan tidak valid, silakan coba lagi.
timeout /t 1 >nul
goto MENU
