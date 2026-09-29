@echo off
echo ========================================================
echo   BK ONLINE - BUKA PORT FIREWALL (Jalankan sbg Admin)
echo ========================================================
echo.

REM Hapus rule lama jika ada
netsh advfirewall firewall delete rule name="BK Online Port 5173" >nul 2>&1
netsh advfirewall firewall delete rule name="BK Online Port 8000" >nul 2>&1

REM Tambah rule baru untuk port 5173 (Frontend HTTPS Vite)
netsh advfirewall firewall add rule name="BK Online Port 5173" protocol=TCP dir=in localport=5173 action=allow
if %errorlevel%==0 (
    echo [OK] Port 5173 (Frontend) berhasil dibuka
) else (
    echo [GAGAL] Port 5173 - coba jalankan sebagai Administrator
)

REM Tambah rule baru untuk port 8000 (Backend Laravel)
netsh advfirewall firewall add rule name="BK Online Port 8000" protocol=TCP dir=in localport=8000 action=allow
if %errorlevel%==0 (
    echo [OK] Port 8000 (Backend) berhasil dibuka
) else (
    echo [GAGAL] Port 8000 - coba jalankan sebagai Administrator
)

echo.
echo ========================================================
echo  SELESAI. Laptop lain di jaringan sekarang bisa akses:
echo    https://10.78.3.197:5173
echo.
echo  Jika masih tidak bisa, matikan Windows Defender Firewall
echo  sementara untuk pengujian:
echo    Control Panel - Windows Firewall - Turn off (Private)
echo ========================================================
echo.
pause
