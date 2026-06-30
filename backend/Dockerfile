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

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

CMD ["/usr/local/bin/docker-entrypoint.sh"]
