import os
from pathlib import Path
from dotenv import load_dotenv
import base64
import json
from google.oauth2 import service_account

BASE_DIR = Path(__file__).resolve().parent.parent
# Load the unified root .env (one level above backend/)
load_dotenv(BASE_DIR.parent / '.env')

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-diamenu-dev-key-change-in-production')

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    # DiaMenu apps
    'apps.accounts',
    'apps.bloodsugar',
    'apps.auditor',
    'apps.mealplan',
    'apps.pantry',
    'apps.ai',
    'storages',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'diamenu.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'diamenu.wsgi.application'

# --- Database (PostgreSQL) ---
# Cloud Run uses Unix socket for Cloud SQL; local dev uses TCP host
_cloud_sql_conn = os.environ.get('CLOUD_SQL_CONNECTION_NAME', '')
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'diamenu_db'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': f'/cloudsql/{_cloud_sql_conn}' if _cloud_sql_conn else os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432') if not _cloud_sql_conn else '',
    }
}

# --- Custom User Model ---
AUTH_USER_MODEL = 'accounts.User'

# --- Password Validation ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Internationalization ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Manila'
USE_I18N = True
USE_TZ = True

# --- Static files ---
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# --- Media files (Uploads) ---
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Django REST Framework ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/minute',
        'otp_send': '3/hour',
        'otp_verify': '5/minute',
        'ai_requests': '10/minute',
    }
}

# --- JWT Settings ---
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# --- CORS Settings ---
if DEBUG:
    # Allow all origins in development so any localhost/LAN IP works
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://diamenu.online",
        "https://www.diamenu.online",
    ]

# Allow Google OAuth popups to communicate with the opener window
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin-allow-popups'
CORS_ALLOW_CREDENTIALS = True

# --- Security Settings (Mitigate T-04) ---
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # --- Google Cloud Storage Settings ---
    DEFAULT_FILE_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'
    GS_BUCKET_NAME = os.environ.get('GS_BUCKET_NAME')
    GS_DEFAULT_ACL = 'publicRead'

    # If raw JSON is explicitly provided (e.g., local dev), use it.
    # Otherwise, django-storages automatically uses Cloud Run's native Application Default Credentials!
    gcp_sa_key_json = os.environ.get('GCP_SA_KEY')
    if gcp_sa_key_json:
        try:
            gcp_sa_credentials = json.loads(gcp_sa_key_json)
            GS_CREDENTIALS = service_account.Credentials.from_service_account_info(gcp_sa_credentials)
            GS_PROJECT_ID = gcp_sa_credentials.get('project_id')
        except Exception as e:
            print(f"Notice: Could not decode GCP_SA_KEY as JSON. Falling back to default identity. {e}")

# --- Email Settings ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'your-email@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', 'your-app-password')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'your-email@gmail.com')

# AI Settings
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', os.environ.get('VITE_GEMINI_API_KEY', ))
