#!/bin/sh
set -e

ENV_FILE="/var/www/html/.env"

echo "==> Generating .env from environment variables..."

cat > "$ENV_FILE" <<EOF
APP_NAME="${APP_NAME:-YMCA Academic ERP}"
APP_ENV="${APP_ENV:-production}"
APP_KEY="${APP_KEY}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_TIMEZONE="${APP_TIMEZONE:-UTC}"
APP_URL="${APP_URL:-http://localhost}"

APP_LOCALE="${APP_LOCALE:-en}"
APP_FALLBACK_LOCALE="${APP_FALLBACK_LOCALE:-en}"
APP_FAKER_LOCALE="${APP_FAKER_LOCALE:-en_US}"

APP_MAINTENANCE_DRIVER="${APP_MAINTENANCE_DRIVER:-file}"
APP_MAINTENANCE_STORE="${APP_MAINTENANCE_STORE:-database}"

BCRYPT_ROUNDS="${BCRYPT_ROUNDS:-12}"

LOG_CHANNEL="${LOG_CHANNEL:-stderr}"
LOG_STACK="${LOG_STACK:-single}"
LOG_DEPRECATIONS_CHANNEL="${LOG_DEPRECATIONS_CHANNEL:-null}"
LOG_LEVEL="${LOG_LEVEL:-error}"

DB_CONNECTION="${DB_CONNECTION:-pgsql}"
DB_URL="${DB_URL}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-ymca_academic_erp}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"
DB_SSLMODE="${DB_SSLMODE:-prefer}"

SESSION_DRIVER="${SESSION_DRIVER:-database}"
SESSION_LIFETIME="${SESSION_LIFETIME:-120}"
SESSION_ENCRYPT="${SESSION_ENCRYPT:-false}"
SESSION_PATH="${SESSION_PATH:-/}"
SESSION_DOMAIN="${SESSION_DOMAIN:-null}"

BROADCAST_CONNECTION="${BROADCAST_CONNECTION:-log}"
FILESYSTEM_DISK="${FILESYSTEM_DISK:-local}"
QUEUE_CONNECTION="${QUEUE_CONNECTION:-database}"

CACHE_STORE="${CACHE_STORE:-database}"
CACHE_PREFIX="${CACHE_PREFIX}"

REDIS_CLIENT="${REDIS_CLIENT:-predis}"
REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
REDIS_PASSWORD="${REDIS_PASSWORD:-null}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_DATABASE="${REDIS_DATABASE:-0}"
REDIS_CACHE_DB="${REDIS_CACHE_DB:-1}"

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

echo "==> Clearing config cache..."
php artisan config:clear || true

# Handle SQLite database creation
if [ "${DB_CONNECTION:-pgsql}" = "sqlite" ]; then
    DB_PATH="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    echo "==> Setting up SQLite database at $DB_PATH..."
    mkdir -p "$(dirname "$DB_PATH")"
    touch "$DB_PATH"
    chown -R www-data:www-data "$(dirname "$DB_PATH")"
fi

echo "==> Caching Laravel config..."
php artisan config:cache || true

echo "==> Running database migrations..."
php artisan migrate --force

echo "==> Fixing storage permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "==> Starting Apache..."
exec apache2-foreground
