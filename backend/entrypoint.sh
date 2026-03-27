#!/bin/bash

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Create or Update superuser if env vars are present
if [ ! -z "$DJANGO_SUPERUSER_EMAIL" ] && [ ! -z "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Ensuring superuser $DJANGO_SUPERUSER_EMAIL exists..."
    python manage.py shell -c "from apps.accounts.models import User; u, created = User.objects.get_or_create(email='$DJANGO_SUPERUSER_EMAIL', defaults={'name': 'Super Admin'}); u.set_password('$DJANGO_SUPERUSER_PASSWORD'); u.is_superuser=True; u.is_staff=True; u.save(); print('Superuser created/updated successfully.')"
fi

# Exec the CMD from Dockerfile
exec "$@"
