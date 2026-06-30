FROM php:8.4-apache

# Install standard utilities
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip

# Copy the PHP extension installer from the official docker image (offline/registry friendly)
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

# Install required PHP extensions for Laravel (gd, zip, pdo_mysql, pdo_pgsql, bcmath, intl)
# Note: mbstring and xml are already built-in in the base php:8.4-apache image
RUN install-php-extensions pdo_mysql pdo_pgsql gd zip bcmath intl

# Enable Apache rewrite module
RUN a2enmod rewrite

# Change Apache document root to Laravel public directory
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf
RUN sed -i 's|/var/www/|/var/www/html/public/|g' /etc/apache2/apache2.conf

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files (works whether build context is repo root or /backend)
COPY . .

# Align directories if build context was repo root (i.e. 'backend' directory exists)
RUN if [ -d "backend" ]; then \
        echo "Detected repo root build context. Aligning files..." && \
        mv backend/* backend/.[!.]* ./ 2>/dev/null || true && \
        rm -rf backend frontend; \
    fi

# Copy the entrypoint script to /usr/local/bin and make it executable
RUN cp docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# Ensure all Laravel directories exist
RUN mkdir -p storage/framework/cache/data \
             storage/framework/sessions \
             storage/framework/testing \
             storage/framework/views \
             storage/logs \
             bootstrap/cache

# Set up storage and bootstrap cache permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Install PHP dependencies (runs package discovery and Laravel boot scripts)
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Expose port 80
EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
