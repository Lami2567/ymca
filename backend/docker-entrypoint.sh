#!/bin/sh
set -e

ENV_FILE="/var/www/html/.env"

echo "==> Generating .env from environment variables..."

# NOTE: SESSION_DRIVER, CACHE_STORE, QUEUE_CONNECTION are HARDCODED to 'database'
# to avoid Redis connection failures in single-container deployments.
# Override them here only if you add a Redis sidecar.

cat > "$ENV_FILE" <<EOF
APP_NAME="${APP_NAME:-YMCA Academic ERP}"
APP_ENV="${APP_ENV:-production}"
APP_KEY="${APP_KEY}"
APP_DEBUG="${APP_DEBUG:-true}"
APP_TIMEZONE="${APP_TIMEZONE:-UTC}"
APP_URL="${APP_URL:-http://localhost}"

APP_LOCALE="${APP_LOCALE:-en}"
APP_FALLBACK_LOCALE="${APP_FALLBACK_LOCALE:-en}"
APP_FAKER_LOCALE="${APP_FAKER_LOCALE:-en_US}"

APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS="${BCRYPT_ROUNDS:-12}"

LOG_CHANNEL=stderr
LOG_LEVEL=debug

DB_CONNECTION="${DB_CONNECTION:-pgsql}"
DB_URL="${DB_URL}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-ymca_academic_erp}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"
DB_SSLMODE="${DB_SSLMODE:-prefer}"

# Hardcoded to 'database' — no Redis needed
SESSION_DRIVER=database
SESSION_LIFETIME=${SESSION_LIFETIME:-120}
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local

# Hardcoded to 'database' — no Redis needed
QUEUE_CONNECTION=database
CACHE_STORE=database
CACHE_PREFIX="${CACHE_PREFIX}"

MAIL_MAILER="${MAIL_MAILER:-log}"
MAIL_HOST="${MAIL_HOST:-127.0.0.1}"
MAIL_PORT="${MAIL_PORT:-2525}"
MAIL_USERNAME="${MAIL_USERNAME:-null}"
MAIL_PASSWORD="${MAIL_PASSWORD:-null}"
MAIL_ENCRYPTION="${MAIL_ENCRYPTION:-null}"
MAIL_FROM_ADDRESS="${MAIL_FROM_ADDRESS:-hello@example.com}"
MAIL_FROM_NAME="${MAIL_FROM_NAME:-YMCA Academic ERP}"

SANCTUM_STATEFUL_DOMAINS="${SANCTUM_STATEFUL_DOMAINS:-localhost}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

JWT_SECRET="${JWT_SECRET}"
JWT_TTL="${JWT_TTL:-15}"
JWT_REFRESH_TTL="${JWT_REFRESH_TTL:-20160}"

TENANT_IDENTIFICATION="${TENANT_IDENTIFICATION:-subdomain}"
MAX_UPLOAD_SIZE="${MAX_UPLOAD_SIZE:-10240}"
ALLOWED_FILE_TYPES="${ALLOWED_FILE_TYPES:-pdf,doc,docx,xls,xlsx,jpg,jpeg,png}"
EOF

chown www-data:www-data "$ENV_FILE"
chmod 640 "$ENV_FILE"

# Clear any stale config cache
echo "==> Clearing config/route/view cache..."
php artisan config:clear  2>&1 || true
php artisan cache:clear   2>&1 || true

# Handle SQLite
if [ "${DB_CONNECTION:-pgsql}" = "sqlite" ]; then
    DB_PATH="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    echo "==> Setting up SQLite at $DB_PATH..."
    mkdir -p "$(dirname "$DB_PATH")"
    touch "$DB_PATH"
    chown -R www-data:www-data "$(dirname "$DB_PATH")"
fi

# Ensure sessions table migration exists (needed for SESSION_DRIVER=database)
echo "==> Ensuring sessions migration exists..."
php artisan session:table 2>&1 || true

# Run migrations
echo "==> Running migrations..."
php artisan migrate --force 2>&1

# Cache config for performance
echo "==> Caching config..."
php artisan config:cache 2>&1 || true

# Fix permissions
echo "==> Fixing permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "==> Starting Apache..."
exec apache2-foreground
