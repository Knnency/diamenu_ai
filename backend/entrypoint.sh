#!/bin/bash

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Create superuser if env vars are present (non-interactive)
if [ ! -z "$DJANGO_SUPERUSER_EMAIL" ] && [ ! -z "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser..."
    # name is a required field in our custom User model
    python manage.py createsuperuser --noinput --name="Super Admin" || echo "Superuser exists or creation skipped."
fi

# Exec the CMD from Dockerfile
exec "$@"
