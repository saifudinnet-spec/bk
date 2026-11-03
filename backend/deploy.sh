#!/bin/bash
# =============================================================
# deploy.sh — Script Deployment Otomatis Ruang BK
# Dipanggil oleh: DeployController.php saat menerima webhook GitHub
# Lokasi: root project (setara dengan folder backend/)
# =============================================================

set -e  # Hentikan jika ada perintah yang gagal

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="${PROJECT_DIR}/../frontend"

echo "============================================"
echo "  RUANG BK — AUTO DEPLOYMENT"
echo "  $(date '+%d %b %Y %H:%M:%S')"
echo "============================================"
echo ""

# --- [1/5] Git Pull ---
echo ">>> [1/5] Mengambil kode terbaru dari GitHub..."
cd "$PROJECT_DIR"
git pull origin main
echo "    ✅ Git pull selesai."
echo ""

# --- [2/5] Install/Update Composer Dependencies ---
echo ">>> [2/5] Update Composer dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev
echo "    ✅ Composer selesai."
echo ""

# --- [3/5] Build Frontend ---
echo ">>> [3/5] Build frontend (npm run build)..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    npm install --silent
    npm run build
    echo "    ✅ Build frontend selesai."
else
    echo "    ⚠️  Folder frontend tidak ditemukan, lewati build."
fi
echo ""

# --- [4/5] Migrasi Database ---
echo ">>> [4/5] Menjalankan migrasi database..."
cd "$PROJECT_DIR"
php artisan migrate --force
echo "    ✅ Migrasi selesai."
echo ""

# --- [5/5] Clear Cache & Optimize ---
echo ">>> [5/5] Clear cache dan optimasi..."
php artisan optimize:clear
php artisan optimize
echo "    ✅ Cache & optimasi selesai."
echo ""

echo "============================================"
echo "  ✅ DEPLOYMENT SELESAI!"
echo "  $(date '+%d %b %Y %H:%M:%S')"
echo "============================================"

