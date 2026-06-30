FROM php:8.4-apache

# Install standard utilities
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip

# Download official script to install PHP extensions (handles system dependencies automatically)
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions

# Install required PHP extensions for Laravel and its packages (dompdf, excel, intervention, etc.)
RUN install-php-extensions pdo pdo_mysql pdo_pgsql mbstring gd zip bcmath xml intl

# Enable Apache rewrite module
RUN a2enmod rewrite

# Change Apache document root to Laravel public directory
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf
RUN sed -i 's|/var/www/|/var/www/html/public/|g' /etc/apache2/apache2.conf

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

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

# Use custom entrypoint script to run migrations and start Apache
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
