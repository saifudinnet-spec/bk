@echo off
setlocal EnableDelayedExpansion
title Server Ruang BK - Akses Jaringan Lokal (LAN / Wi-Fi)
color 0B

echo =====================================================================
echo           RUANG BK - SERVER DAN AKSES JARINGAN LOKAL
echo =====================================================================
echo.

:: Hostname
set "HOST_NAME=%COMPUTERNAME%"

:: Deteksi IP Aktif menggunakan PowerShell yang akurat
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi*','Ethernet*' | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1).IPAddress"`) do (
    set "LOCAL_IP=%%i"
)

if "!LOCAL_IP!"=="" set "LOCAL_IP=10.78.3.2"

echo ---------------------------------------------------------------------
echo  ALAMAT TETAP (HOSTNAME mDNS) - REKOMENDASI UTAMA:
echo    http://!HOST_NAME!.local:5173
echo    atau: http://!HOST_NAME!:5173
echo.
echo  * Keterangan: Alamat di atas TETAP dan TIDAK AKAN BERUBAH meskipun
echo    koneksi Wi-Fi putus / berganti IP router.
echo    Bisa langsung diketik di browser laptop lain (Windows 10/11, Mac, HP).
echo ---------------------------------------------------------------------
echo  ALAMAT BERDASARKAN IP SAAT INI:
echo    http://!LOCAL_IP!:5173
echo ---------------------------------------------------------------------
echo  ALAMAT LOKAL (LAPTOP INI):
echo    http://localhost:5173
echo =====================================================================
echo.
echo Pilihan tindakan:
echo   [1] Jalankan Backend ^& Frontend sekarang
echo   [2] Hanya tampilkan informasi alamat (Keluar)
echo.
set "pilihan=1"
set /p "pilihan=Masukkan pilihan (1/2) [default: 1]: "

if "!pilihan!"=="2" goto :selesai

echo.
echo Memulai Laravel Backend (Port 8000)...
start "Backend Laravel (Port 8000)" cmd /k "cd /d "%~dp0backend" && php artisan serve --host=0.0.0.0 --port=8000"

echo Memulai Vite Frontend (Port 5173)...
start "Frontend Vite (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo =====================================================================
echo  Kedua server telah dibuka di jendela Command Prompt baru.
echo  Silakan bagikan link: http://!HOST_NAME!.local:5173 ke laptop lain.
echo =====================================================================
echo.

:selesai
pause
