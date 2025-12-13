"""
Staging settings - for local development and testing.
"""
from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-staging-key-change-in-production')

# Allow debug in staging (default to True for development)
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0').split(',')

# Database - Can use SQLite for staging/development or PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.environ.get('DB_NAME', str(BASE_DIR / 'db.sqlite3')),
        'USER': os.environ.get('DB_USER', ''),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', ''),
        'PORT': os.environ.get('DB_PORT', ''),
    },
    # Portal database (read-only for syncing)
    'portal': {
        'ENGINE': os.environ.get('PORTAL_DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.environ.get('PORTAL_DB_NAME', str(BASE_DIR / 'portal.sqlite3')),
        'USER': os.environ.get('PORTAL_DB_USER', ''),
        'PASSWORD': os.environ.get('PORTAL_DB_PASSWORD', ''),
        'HOST': os.environ.get('PORTAL_DB_HOST', ''),
        'PORT': os.environ.get('PORTAL_DB_PORT', ''),
    },
}

# CORS Settings - Allow all origins in staging
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Email Backend - Console for staging
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Cache - Simple in-memory cache for staging
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Less strict security for staging
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Logging - More verbose in staging
LOGGING['root']['level'] = 'INFO'
LOGGING['loggers']['django']['level'] = 'INFO'
LOGGING['loggers']['courses']['level'] = 'DEBUG'

# Email - Can use console backend in staging if needed
if os.environ.get('USE_CONSOLE_EMAIL', 'False') == 'True':
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
