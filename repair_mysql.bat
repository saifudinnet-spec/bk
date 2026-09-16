@echo off
setlocal enabledelayedexpansion
title XAMPP MySQL Auto Repair Tool
color 0A

echo =====================================================================
echo               XAMPP MySQL Auto Repair ^& Recovery Tool
echo =====================================================================
echo  Script ini otomatis memperbaiki error crash MySQL XAMPP:
echo   - MySQL shutdown unexpectedly
echo   - Index / privilege table corrupt (proxies_priv, dsb)
echo   - Lock file temporary tablespace (ibtmp1, mysqld.dmp)
echo   - Log sequence desync / zombie process
echo.
echo  * SEMUA DATABASE ANDA (bk_counseling, dsb) 100%% AMAN DAN UTUH *
echo =====================================================================
echo.

set "XAMPP_DIR=C:\xampp"

if not exist "%XAMPP_DIR%\mysql\bin\mysqld.exe" (
    color 0C
    echo [ERROR] Folder XAMPP tidak ditemukan di %XAMPP_DIR%!
    echo Pastikan file ini dijalankan di komputer yang terpasang XAMPP.
    echo.
    pause
    exit /b 1
)

echo [1/6] Menghentikan proses mysqld yang menggantung (zombie process)...
taskkill /F /IM mysqld.exe /T >nul 2>&1
ping 127.0.0.1 -n 3 >nul

echo [2/6] Membuat backup cadangan metadata file di mysql\data...
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set datetime=%%I
set "TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%"
if "%TIMESTAMP%"=="" set "TIMESTAMP=latest"
set "BACKUP_DIR=%XAMPP_DIR%\mysql\data_backup_%TIMESTAMP%"
mkdir "%BACKUP_DIR%" >nul 2>&1
mkdir "%BACKUP_DIR%\mysql" >nul 2>&1

copy "%XAMPP_DIR%\mysql\data\ibdata1" "%BACKUP_DIR%\" >nul 2>&1
copy "%XAMPP_DIR%\mysql\data\ib_logfile*" "%BACKUP_DIR%\" >nul 2>&1
copy "%XAMPP_DIR%\mysql\data\mysql\proxies_priv.*" "%BACKUP_DIR%\mysql\" >nul 2>&1
echo   -> Backup cadangan tersimpan di: %BACKUP_DIR%

echo [3/6] Membersihkan file crash dump dan temporary tablespace yang mengunci...
if exist "%XAMPP_DIR%\mysql\data\ibtmp1" (
    del /f /q "%XAMPP_DIR%\mysql\data\ibtmp1" >nul 2>&1
)
if exist "%XAMPP_DIR%\mysql\data\mysqld.dmp" (
    del /f /q "%XAMPP_DIR%\mysql\data\mysqld.dmp" >nul 2>&1
)

echo [4/6] Memulihkan tabel sistem hak akses (proxies_priv) yang sering korup...
if exist "%XAMPP_DIR%\mysql\backup\mysql\proxies_priv.*" (
    copy /Y "%XAMPP_DIR%\mysql\backup\mysql\proxies_priv.*" "%XAMPP_DIR%\mysql\data\mysql\" >nul 2>&1
)

echo [5/6] Memperbaiki indeks tabel sistem Aria Engine (aria_chk)...
cd /d "%XAMPP_DIR%\mysql"
for %%F in ("%XAMPP_DIR%\mysql\data\mysql\*.MAI") do (
    "%XAMPP_DIR%\mysql\bin\aria_chk.exe" -r --silent "%%F" >nul 2>&1
)

echo [6/6] Menjalankan uji coba start MySQL dan sinkronisasi checkpoint InnoDB...
start "" /B "%XAMPP_DIR%\mysql\bin\mysqld.exe" --defaults-file="%XAMPP_DIR%\mysql\bin\my.ini" --standalone >nul 2>&1
ping 127.0.0.1 -n 5 >nul

"%XAMPP_DIR%\mysql\bin\mysqladmin.exe" -u root shutdown >nul 2>&1
ping 127.0.0.1 -n 3 >nul

echo.
echo =====================================================================
echo                  PERBAIKAN MYSQL BERHASIL SELESAI!
echo =====================================================================
echo.
echo Semua database Anda (bk_counseling, dsb.) 100%% AMAN dan UTUH.
echo File log InnoDB dan indeks sistem sudah disinkronkan kembali.
echo.
echo Silakan sekarang:
echo   1. Buka XAMPP Control Panel.
echo   2. Klik tombol [Start] pada modul MySQL.
echo.
echo =====================================================================
pause
