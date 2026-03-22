#!/bin/sh
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Creating superuser if not exists..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
import os
User = get_user_model()
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(
        username,
        os.environ.get('DJANGO_SUPERUSER_EMAIL', ''),
        os.environ.get('DJANGO_SUPERUSER_PASSWORD', ''),
    )
    print('Superuser created.')
else:
    print('Superuser already exists, skipping.')
"

echo "Starting Gunicorn..."
exec gunicorn sunday_orders_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 30 \
    --access-logfile - \
    --error-logfile -

