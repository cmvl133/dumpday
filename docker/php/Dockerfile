FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    git \
    unzip \
    libpq-dev \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    linux-headers \
    $PHPIZE_DEPS

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    intl \
    opcache \
    zip \
    mbstring

RUN pecl install xdebug && docker-php-ext-enable xdebug

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY php.ini /usr/local/etc/php/conf.d/custom.ini

WORKDIR /var/www/html

RUN addgroup -g 1000 appgroup && adduser -u 1000 -G appgroup -s /bin/sh -D appuser
RUN chown -R appuser:appgroup /var/www/html

USER appuser

EXPOSE 9000

CMD ["php-fpm"]
