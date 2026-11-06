FROM php:8.3-apache

RUN docker-php-ext-install mysqli pdo pdo_mysql

RUN sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf

RUN sed -i 's/:80>/:10000>/' /etc/apache2/sites-available/000-default.conf

RUN echo "DirectoryIndex index.php index.html home.html" >> /etc/apache2/apache2.conf

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html/backend/uploads \
    && chmod -R 775 /var/www/html/backend/uploads

EXPOSE 10000
