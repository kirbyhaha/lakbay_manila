
FROM php:8.3-apache

# Install trusted CA certificates
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install PHP database extensions
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Configure Apache to use Render's port 10000
RUN sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf
RUN sed -i 's/:80>/:10000>/' /etc/apache2/sites-available/000-default.conf

# Set homepage priority
RUN echo "DirectoryIndex index.php index.html home.html" >> /etc/apache2/apache2.conf

# Copy website files
COPY . /var/www/html/

# Set upload folder permissions
RUN chown -R www-data:www-data /var/www/html/backend/uploads \
    && chmod -R 775 /var/www/html/backend/uploads

EXPOSE 10000
