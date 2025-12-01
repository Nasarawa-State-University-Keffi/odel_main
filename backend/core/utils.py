from django.core.cache import cache
from django.db import models
from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)


def api_response(status: str, message: str, data: Optional[Any] = None) -> dict:
    """Uniform API response helper.

    status: 'success' or 'error'
    message: human readable message
    data: optional payload
    """
    payload = {
        'status': status,
        'message': message,
    }
    if data is not None:
        payload['data'] = data
    return payload


def get_serializer_error_message(serializer_errors: dict) -> str:
    """
    Extract error messages from serializer errors with field names.
    Returns a user-friendly error message that includes field names.
    
    Args:
        serializer_errors: Dictionary of serializer validation errors
        
    Returns:
        String containing error message(s) with field names
    """
    if not serializer_errors:
        return 'Validation error'
    
    error_messages = []
    
    for field, errors in serializer_errors.items():
        # Format field name for better readability (replace underscores with spaces, capitalize)
        readable_field = field.replace('_', ' ').title()
        
        if isinstance(errors, list):
            for error in errors:
                if isinstance(error, dict):
                    # Handle nested errors recursively
                    nested_msg = get_serializer_error_message(error)
                    error_messages.append(f"{readable_field}: {nested_msg}")
                else:
                    error_messages.append(f"{readable_field}: {str(error)}")
        elif isinstance(errors, dict):
            # Handle nested errors
            nested_msg = get_serializer_error_message(errors)
            error_messages.append(f"{readable_field}: {nested_msg}")
        else:
            error_messages.append(f"{readable_field}: {str(errors)}")
    
    # Return all error messages joined, or just the first one for brevity
    if len(error_messages) == 1:
        return error_messages[0]
    else:
        # Return all errors separated by semicolons
        return "; ".join(error_messages)


def get_setting(key, default=None, use_cache=True):
    """
    Retrieve a dynamic setting from the database with caching support.
    
    Args:
        key (str): The setting key to retrieve
        default: Default value if setting doesn't exist
        use_cache (bool): Whether to use caching (default: True)
    
    Returns:
        The setting value converted to its appropriate type, or default if not found
    
    Example:
        >>> from core.utils import get_setting
        >>> require_verification = get_setting('REQUIRE_EMAIL_VERIFICATION', True)
    """
    from core.models import AppSetting
    
    cache_key = f'app_setting_{key}'
    
    # Try cache first
    if use_cache:
        cached_value = cache.get(cache_key)
        if cached_value is not None:
            return cached_value
    
    # Fetch from database
    try:
        setting = AppSetting.objects.get(key=key)
        value = setting.get_value()
        
        # Cache for 1 hour (3600 seconds)
        if use_cache:
            cache.set(cache_key, value, 3600)
        
        return value
    except AppSetting.DoesNotExist:
        logger.debug(f"Setting '{key}' not found, using default: {default}")
        return default
    except Exception as e:
        logger.error(f"Error retrieving setting '{key}': {e}")
        return default


def set_setting(key, value, description='', value_type='string', user=None):
    """
    Create or update a dynamic setting.
    
    Args:
        key (str): The setting key
        value: The setting value
        description (str): Optional description
        value_type (str): One of: string, boolean, integer, json
        user: The user making the change (for audit trail)
    
    Returns:
        AppSetting instance
    """
    from core.models import AppSetting
    import json
    
    # Convert value to string for storage
    if value_type == 'boolean':
        str_value = 'true' if value else 'false'
    elif value_type == 'integer':
        str_value = str(value)
    elif value_type == 'json':
        str_value = json.dumps(value)
    else:
        str_value = str(value)
    
    setting, created = AppSetting.objects.update_or_create(
        key=key,
        defaults={
            'value': str_value,
            'value_type': value_type,
            'description': description,
            'updated_by': user,
        }
    )
    
    return setting


def clear_settings_cache():
    """
    Clear all cached settings.
    Useful after bulk updates or migrations.
    """
    from core.models import AppSetting
    AppSetting.clear_all_cache()
    logger.info("All settings cache cleared")


def get_all_settings():
    """
    Get all settings as a dictionary.
    Useful for debugging or display purposes.
    
    Returns:
        dict: Dictionary of key-value pairs
    """
    from core.models import AppSetting
    
    settings_dict = {}
    for setting in AppSetting.objects.all():
        settings_dict[setting.key] = setting.get_value()
    
    return settings_dict
