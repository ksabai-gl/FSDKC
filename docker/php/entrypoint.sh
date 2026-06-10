#!/bin/sh
set -e

if [ ! -f /var/www/html/vendor/autoload.php ]; then
  composer install --no-interaction --prefer-dist
fi

if [ ! -f /var/www/html/.env ]; then
  cp /var/www/html/.env.example /var/www/html/.env
  php artisan key:generate --force
fi

php artisan config:clear 2>/dev/null || true

exec "$@"
