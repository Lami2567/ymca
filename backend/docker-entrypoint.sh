#!/bin/sh
set -e

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
