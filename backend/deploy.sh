#!/bin/bash
# =============================================================
# deploy.sh — Script Deployment Otomatis Ruang BK
# Dipanggil oleh: DeployController.php (Webhook / Admin Panel)
# =============================================================

set -e  # Hentikan proses jika ada perintah yang gagal

# Deteksi lokasi Node.js & NPM umum pada Linux / aaPanel
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/www/server/nodejs/v20/bin:/www/server/nodejs/v18/bin:/www/server/nodejs/current/bin"
if [ -d "$HOME/.nvm" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 2>/dev/null || true
fi

BACKEND_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${BACKEND_DIR}/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"

echo "============================================"
echo "  RUANG BK — AUTO DEPLOYMENT"
echo "  $(date '+%d %b %Y %H:%M:%S')"
echo "============================================"
echo ""

# --- [1/6] Git Fetch & Reset (Bebas Konflik) ---
echo ">>> [1/6] Mengambil kode terbaru dari GitHub..."
cd "$ROOT_DIR"
git fetch origin main
git reset --hard origin/main
echo "    ✅ Sinkronisasi kode dari GitHub berhasil (clean state)."
echo ""

# --- [2/6] Update Composer Dependencies ---
echo ">>> [2/6] Memeriksa Composer dependencies..."
cd "$BACKEND_DIR"
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev
echo "    ✅ Composer selesai."
echo ""

# --- [3/6] Build Frontend ---
echo ">>> [3/6] Memeriksa & build frontend..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    # Hanya jalankan npm install jika node_modules belum ada atau package.json baru berubah
    if [ ! -d "node_modules" ] || (cd "$ROOT_DIR" && git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q "frontend/package"); then
        echo "    📦 Menginstal dependensi frontend..."
        npm install --prefer-offline --no-audit --no-fund --silent
    fi
    # Batasi memori heap Node maksimal 1GB agar tidak terkena OOM killer di VPS
    export NODE_OPTIONS="--max-old-space-size=1024"
    npm run build
    echo "    ✅ Build frontend selesai."
else
    echo "    ⚠️  Folder frontend tidak ditemukan, lewati build."
fi
echo ""

# --- [4/6] Migrasi Database ---
echo ">>> [4/6] Menjalankan migrasi database..."
cd "$BACKEND_DIR"
php artisan migrate --force
echo "    ✅ Migrasi selesai."
echo ""

# --- [5/6] Storage Symlink ---
echo ">>> [5/6] Memastikan storage symlink terhubung..."
cd "$BACKEND_DIR"
php artisan storage:link --force
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
if [ -d "$FRONTEND_DIR/dist" ]; then
    ln -sfn "$BACKEND_DIR/storage/app/public" "$FRONTEND_DIR/dist/storage" 2>/dev/null || true
fi
echo "    ✅ Storage symlink selesai."
echo ""

# --- [6/6] Clear Cache & Optimize ---
echo ">>> [6/6] Clear cache dan optimasi..."
cd "$BACKEND_DIR"
php artisan optimize:clear
php artisan optimize
echo "    ✅ Cache & optimasi selesai."
echo ""

echo "============================================"
echo "  ✅ DEPLOYMENT SELESAI!"
echo "  $(date '+%d %b %Y %H:%M:%S')"
echo "============================================"
