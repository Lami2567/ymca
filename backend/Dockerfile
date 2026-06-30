FROM php:8.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip

# Copy Composer and PHP extension installer from official images
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY --from=mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/

# Install required PHP extensions for Laravel (gd, zip, pdo_mysql, pdo_pgsql, bcmath, intl)
RUN install-php-extensions pdo_mysql pdo_pgsql gd zip bcmath intl

# Enable Apache rewrite module
RUN a2enmod rewrite

# Change Apache document root to Laravel public directory
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# Set working directory
WORKDIR /var/www/html

# Copy backend files from monorepo root context
COPY backend/ .

# Install PHP dependencies
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Ensure storage and bootstrap directories exist with correct permissions
RUN mkdir -p storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Expose port 80
EXPOSE 80

# Auto-create SQLite database if connection is sqlite, run migrations, and start Apache
CMD sh -c "if [ \"\${DB_CONNECTION:-sqlite}\" = \"sqlite\" ]; then DB_PATH=\"\${DB_DATABASE:-/var/www/html/database/database.sqlite}\"; mkdir -p \"\$(dirname \"\$DB_PATH\")\"; touch \"\$DB_PATH\"; chown -R www-data:www-data \"\$(dirname \"\$DB_PATH\")\"; fi && php artisan migrate --force && apache2-foreground"
