"""
Settings module for lms.
Automatically loads the appropriate settings based on DJANGO_SETTINGS_MODULE.
"""
import os

# Determine which settings to use
environment = os.environ.get('DJANGO_ENV', 'staging')

if environment == 'production':
    from .production import *
else:
    from .staging import *
