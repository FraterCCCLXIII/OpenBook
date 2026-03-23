# Stage 1: Build Assets
FROM node:18 AS asset-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx gulp compile

# Stage 2: Final Image
FROM php:8.4-fpm

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    zip \
    unzip \
    nginx \
    supervisor \
    && curl -sSL https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions -o - | sh -s \
    curl gd intl ldap mbstring mysqli odbc pdo pdo_mysql soap sockets xml zip exif sqlite3 gettext bcmath csv event inotify redis \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Configure Nginx
COPY docker/nginx/nginx-prod.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default \
    && rm -f /etc/nginx/conf.d/default.conf

# Configure Supervisor
RUN mkdir -p /var/log/supervisor
COPY docker/supervisor.conf /etc/supervisor/conf.d/supervisor.conf

# Set working directory
WORKDIR /var/www/html

# Copy application code
COPY . .

# Copy built assets from Stage 1
COPY --from=asset-builder /app/assets ./assets

# Install composer dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data storage \
    && chmod -R 750 storage

# Expose port 80
EXPOSE 80

# Use entrypoint to handle config.php
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisor.conf"]
