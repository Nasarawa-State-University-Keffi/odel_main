"""
Settings module for lms.
Automatically loads the appropriate settings based on DJANGO_SETTINGS_MODULE.
"""
import os
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass  # python-dotenv not installed

# Determine which settings to use
environment = os.environ.get('DJANGO_ENV', 'staging')

if environment == 'production':
    from .production import *
elif environment == 'development':
    from .development import *
else:
    from .staging import *
