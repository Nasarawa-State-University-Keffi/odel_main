"""
Development settings - for local development.
"""
from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-dev-key-change-in-production-' + os.environ.get('SECRET_KEY_SUFFIX', 'default')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Database - SQLite for local development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': str(BASE_DIR / 'db.sqlite3'),
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

# CORS Settings - Allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# CSRF Settings - Relaxed for API testing in development
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:3000',
]
# Allow API endpoints to work without CSRF in development (using token auth instead)
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

# Email Backend - Console for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Cache - Simple in-memory cache for development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Development-specific installed apps (optional, install if needed)
# INSTALLED_APPS += [
#     'django_extensions',  # Optional: useful development tools
# ]

# Simplified logging for development
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['django']['level'] = 'DEBUG'

# Disable password validation in development for easier testing
AUTH_PASSWORD_VALIDATORS = []
