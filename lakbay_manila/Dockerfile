FROM php:8.3-apache

# Install MySQL extensions
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Configure Apache to listen on Render's port
RUN sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf

RUN sed -i 's/:80>/:10000>/' /etc/apache2/sites-available/000-default.conf

# Set the homepage priority
RUN echo "DirectoryIndex index.php index.html home.html" >> /etc/apache2/apache2.conf

# Copy website files
COPY . /var/www/html/

EXPOSE 10000
