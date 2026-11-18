#!/bin/bash
# =============================================================
# deploy.sh — Script Deployment Otomatis Ruang BK
# Dipanggil oleh: DeployController.php (Webhook / Admin Panel)
# =============================================================

set -e  # Hentikan proses jika ada perintah yang gagal

LOG_ID="$1"

BACKEND_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${BACKEND_DIR}/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
LOG_DIR="${BACKEND_DIR}/storage/logs"
mkdir -p "$LOG_DIR" 2>/dev/null || true

# Tangkap exit code script secara pasti
finish_deploy() {
    EXIT_CODE=$?
    if [ -n "$LOG_ID" ]; then
        echo "$EXIT_CODE" > "$LOG_DIR/deploy_${LOG_ID}.exit"
    fi
}
trap finish_deploy EXIT

# Deteksi lokasi Node.js & NPM umum pada Linux / aaPanel
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin"
for nodedir in /www/server/nodejs/*/bin; do
    if [ -d "$nodedir" ]; then
        export PATH="$nodedir:$PATH"
    fi
done

if [ -d "$HOME/.nvm" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 2>/dev/null || true
fi

# Deteksi PHP CLI executable (hindari php-fpm / php-cgi!)
PHP_CMD=""
if [ -n "$PHP_BIN" ] && [ -x "$PHP_BIN" ] && [[ "$(basename "$PHP_BIN")" != *"fpm"* ]] && [[ "$(basename "$PHP_BIN")" != *"cgi"* ]]; then
    PHP_CMD="$PHP_BIN"
    export PATH="$(dirname "$PHP_BIN"):$PATH"
else
    # Pilih versi PHP CLI terbaru dari aaPanel (mis. 84/83/82 lebih diprioritaskan daripada 74)
    for phpdir in $(ls -dr /www/server/php/*/bin 2>/dev/null || true); do
        if [ -x "$phpdir/php" ]; then
            PHP_CMD="$phpdir/php"
            export PATH="$phpdir:$PATH"
            break
        fi
    done
    PHP_CMD="${PHP_CMD:-php}"
fi

# Deteksi Composer
if command -v composer >/dev/null 2>&1; then
    COMPOSER_CMD="$PHP_CMD $(command -v composer)"
elif [ -f "$BACKEND_DIR/composer.phar" ]; then
    COMPOSER_CMD="$PHP_CMD $BACKEND_DIR/composer.phar"
elif [ -f "/usr/local/bin/composer" ]; then
    COMPOSER_CMD="$PHP_CMD /usr/local/bin/composer"
elif [ -f "/usr/bin/composer" ]; then
    COMPOSER_CMD="$PHP_CMD /usr/bin/composer"
else
    COMPOSER_CMD="composer"
fi

echo "============================================"
echo "  RUANG BK — AUTO DEPLOYMENT"
echo "  $(date '+%d %b %Y %H:%M:%S')"
echo "  User: $(whoami 2>/dev/null || echo unknown)"
echo "  PHP: $($PHP_CMD -v 2>&1 | head -n 1)"
if command -v node >/dev/null 2>&1; then
    echo "  Node: $(node -v)"
else
    echo "  Node: TIDAK DITEMUKAN di PATH"
fi
echo "============================================"
echo ""

# --- [1/6] Git Fetch & Reset (Bebas Konflik) ---
echo ">>> [1/6] Mengambil kode terbaru dari GitHub..."
cd "$ROOT_DIR"
git config --global --add safe.directory "$ROOT_DIR" 2>/dev/null || true
export GIT_TERMINAL_PROMPT=0
BEFORE_HASH="$(git -c safe.directory="$ROOT_DIR" rev-parse HEAD 2>/dev/null || echo "")"
git -c safe.directory="$ROOT_DIR" fetch origin main
git -c safe.directory="$ROOT_DIR" reset --hard origin/main
echo "    ✅ Sinkronisasi kode dari GitHub berhasil (clean state)."
echo ""

# --- [2/6] Update Composer Dependencies ---
echo ">>> [2/6] Memeriksa Composer dependencies..."
cd "$BACKEND_DIR"
$COMPOSER_CMD install --no-interaction --prefer-dist --optimize-autoloader --no-dev
echo "    ✅ Composer selesai."
echo ""

# --- [3/6] Build Frontend ---
echo ">>> [3/6] Memeriksa & build frontend..."
if [ -d "$FRONTEND_DIR" ]; then
    if ! command -v npm >/dev/null 2>&1; then
        echo "    ❌ ERROR: npm tidak ditemukan di PATH ($PATH). Pastikan Node.js terpasang di aaPanel."
        exit 1
    fi
    cd "$FRONTEND_DIR"
    NEED_NPM_INSTALL=0
    if [ ! -d "node_modules" ]; then
        NEED_NPM_INSTALL=1
    elif [ -n "$BEFORE_HASH" ] && (cd "$ROOT_DIR" && git -c safe.directory="$ROOT_DIR" diff --name-only "$BEFORE_HASH" HEAD 2>/dev/null | grep -q "frontend/package"); then
        NEED_NPM_INSTALL=1
    fi
    if [ "$NEED_NPM_INSTALL" -eq 1 ]; then
        echo "    📦 Menginstal dependensi frontend..."
        npm install --prefer-offline --no-audit --no-fund --silent
    fi
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
$PHP_CMD artisan migrate --force
echo "    ✅ Migrasi selesai."
echo ""

# --- [5/6] Storage Symlink ---
echo ">>> [5/6] Memastikan storage symlink terhubung..."
cd "$BACKEND_DIR"
$PHP_CMD artisan storage:link --force
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
if [ -d "$FRONTEND_DIR/dist" ]; then
    ln -sfn "$BACKEND_DIR/storage/app/public" "$FRONTEND_DIR/dist/storage" 2>/dev/null || true
fi
echo "    ✅ Storage symlink selesai."
echo ""

# --- [6/6] Clear Cache & Optimize ---
echo ">>> [6/6] Clear cache dan optimasi..."
cd "$BACKEND_DIR"
$PHP_CMD artisan optimize:clear
$PHP_CMD artisan optimize
echo "    ✅ Cache & optimasi selesai."
echo ""

echo "============================================"
echo "  ✅ DEPLOYMENT SELESAI!"
echo "  $(date '+%d %b %Y %H:%M:%S')"
echo "============================================"
