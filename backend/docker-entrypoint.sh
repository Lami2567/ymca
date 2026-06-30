#!/bin/sh
set -e

# If using SQLite (default) and the database file doesn't exist, create it
if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    DB_PATH="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    if [ ! -f "$DB_PATH" ]; then
        echo "Creating SQLite database file at $DB_PATH..."
        mkdir -p "$(dirname "$DB_PATH")"
        touch "$DB_PATH"
        chown www-data:www-data "$DB_PATH"
        chown www-data:www-data "$(dirname "$DB_PATH")"
    fi
fi

# Run database migrations
echo "Running migrations..."
php artisan migrate --force

# Cache configuration, routes, and views for production
echo "Caching configuration and routes..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Execute the main container command
echo "Starting Apache..."
exec "$@"
