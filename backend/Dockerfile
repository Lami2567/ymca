FROM php:8.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip

# Copy Composer and PHP extension installer from official images
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY --from=ghcr.io/mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/

# Install required PHP extensions for Laravel (gd, zip, pdo_mysql, pdo_pgsql, bcmath, intl)
RUN install-php-extensions pdo_mysql pdo_pgsql gd zip bcmath intl

# Enable Apache rewrite module
RUN a2enmod rewrite

# Configure Apache: set document root, enable .htaccess, suppress ServerName warning
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf \
    && sed -i '/<\/VirtualHost>/i\\t<Directory /var/www/html/public>\n\t\tAllowOverride All\n\t\tRequire all granted\n\t<\/Directory>' /etc/apache2/sites-available/000-default.conf \
    && echo 'ServerName localhost' >> /etc/apache2/apache2.conf

# Set working directory
WORKDIR /var/www/html

# Copy application files (works whether build context is repo root or /backend)
COPY . .

# Safe directory alignment if build context was repo root (i.e. 'backend' directory exists)
RUN if [ -d "backend" ]; then \
        cp -r backend/. ./ && \
        rm -rf backend frontend; \
    fi

# Create required directories BEFORE composer install
# (post-autoload-dump runs `php artisan package:discover` which needs bootstrap/cache)
RUN mkdir -p storage/framework/sessions \
        storage/framework/views \
        storage/framework/cache \
        storage/logs \
        bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Install PHP dependencies
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Fix ownership after all files are in place
RUN chown -R www-data:www-data /var/www/html

# Write the startup entrypoint inline — no external file needed
RUN cat > /usr/local/bin/docker-entrypoint.sh <<"ENTRYPOINT_EOF"
#!/bin/sh
set -e

echo "==> Generating .env from container environment..."

cat > /var/www/html/.env << EOF
APP_NAME=${APP_NAME:-YMCA Academic ERP}
APP_ENV=${APP_ENV:-production}
APP_KEY=${APP_KEY}
APP_DEBUG=${APP_DEBUG:-true}
APP_TIMEZONE=${APP_TIMEZONE:-UTC}
APP_URL=${APP_URL:-http://localhost}
APP_LOCALE=${APP_LOCALE:-en}
APP_FALLBACK_LOCALE=${APP_FALLBACK_LOCALE:-en}
APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=${BCRYPT_ROUNDS:-12}

LOG_CHANNEL=stderr
LOG_LEVEL=debug

DB_CONNECTION=${DB_CONNECTION:-pgsql}
DB_URL=${DB_URL}
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-ymca_academic_erp}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD}
DB_SSLMODE=${DB_SSLMODE:-prefer}

SESSION_DRIVER=database
SESSION_LIFETIME=${SESSION_LIFETIME:-120}
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database
CACHE_PREFIX=${CACHE_PREFIX}

MAIL_MAILER=${MAIL_MAILER:-log}
MAIL_FROM_ADDRESS=${MAIL_FROM_ADDRESS:-hello@example.com}
MAIL_FROM_NAME=${MAIL_FROM_NAME:-YMCA Academic ERP}

SANCTUM_STATEFUL_DOMAINS=${SANCTUM_STATEFUL_DOMAINS:-localhost}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}

JWT_SECRET=${JWT_SECRET}
JWT_TTL=${JWT_TTL:-15}
JWT_REFRESH_TTL=${JWT_REFRESH_TTL:-20160}

TENANT_IDENTIFICATION=${TENANT_IDENTIFICATION:-subdomain}
MAX_UPLOAD_SIZE=${MAX_UPLOAD_SIZE:-10240}
ALLOWED_FILE_TYPES=${ALLOWED_FILE_TYPES:-pdf,doc,docx,xls,xlsx,jpg,jpeg,png}
EOF

chown www-data:www-data /var/www/html/.env
chmod 640 /var/www/html/.env

echo "==> Clearing stale caches..."
php artisan config:clear 2>&1 || true
php artisan cache:clear  2>&1 || true

# Create SQLite db file if needed
if [ "${DB_CONNECTION:-pgsql}" = "sqlite" ]; then
    DB_PATH="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    echo "==> Creating SQLite database at $DB_PATH..."
    mkdir -p "$(dirname "$DB_PATH")"
    touch "$DB_PATH"
    chown -R www-data:www-data "$(dirname "$DB_PATH")"
fi

echo "==> Creating sessions table migration if needed..."
php artisan session:table 2>&1 || true

echo "==> Running migrations..."
php artisan migrate --force 2>&1

echo "==> Caching config..."
php artisan config:cache 2>&1 || true

echo "==> Fixing permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "==> Starting Apache..."
exec apache2-foreground
ENTRYPOINT_EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

CMD ["/usr/local/bin/docker-entrypoint.sh"]
