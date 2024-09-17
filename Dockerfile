# Use an official PHP runtime as a parent image
FROM php:8.1-apache

# Install necessary PHP extensions (adjust based on your project needs)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Copy the current directory contents into the container
COPY . /var/www/html/

# Set working directory
WORKDIR /var/www/html

# Expose port 80 for the web server
EXPOSE 80
