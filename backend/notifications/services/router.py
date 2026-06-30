from typing import Optional, Dict, Type, Any
from django.core.cache import cache
from django.conf import settings

from .base import BaseEmailService, NotificationException
from .smtp_service import SMTPEmailService
from .console_service import ConsoleEmailService
from .resend_service import ResendEmailService
from .brevo_service import BrevoEmailService


# Service registry
EMAIL_SERVICES: Dict[str, Type[BaseEmailService]] = {
    'smtp': SMTPEmailService,
    'console': ConsoleEmailService,
    'resend': ResendEmailService,
    'brevo': BrevoEmailService,
}


def get_active_configuration() -> Optional[Any]:
    """
    Fetch the currently active email configuration from the database.
    """
    try:
        from notifications.models import EmailConfiguration
        return EmailConfiguration.objects.filter(is_active=True).first()
    except Exception:
        # App might not be initialized or migrations not run
        return None


def get_email_service(backend: Optional[str] = None) -> BaseEmailService:
    """
    Get email service instance based on configuration.
    Selection priority:
    1. Explicit 'backend' argument
    2. Database-backed active EmailConfiguration
    3. ENV/Settings fallback (defaulting to 'smtp')
    """
    config_obj = None
    
    # 1. If no backend is provided, try to get it from the database
    if backend is None:
        config_obj = get_active_configuration()
        if config_obj:
            backend = config_obj.backend_choice
        else:
            # Fallback to default
            backend = 'smtp'
    
    backend = backend.lower()
    
    if backend not in EMAIL_SERVICES:
        supported = ', '.join(EMAIL_SERVICES.keys())
        raise NotificationException(
            f"Email backend '{backend}' is not supported. "
            f"Supported backends: {supported}"
        )
    
    # Use cache to avoid repeated DB hits and re-initialization
    cache_key = f'email_service_instance'
    # We include the backend in the logic but cache the *active* instance
    service = cache.get(cache_key)
    
    # If we have a cached service but it's not the backend we want (unlikely if we only cache the active one)
    # or if we are requesting a specific one, we might need to recreate.
    # For now, let's just re-initialize if not cached or if explicit backend doesn't match active config
    
    if service is None or (config_obj and backend != config_obj.backend_choice):
        try:
            service_class = EMAIL_SERVICES[backend]
            
            # Prepare initialization arguments
            init_kwargs = {}
            from os import environ

            # Determine API key from Environment Variables ONLY
            api_key = None
            if backend == 'resend':
                api_key = environ.get('RESEND_API_KEY')
            elif backend == 'brevo':
                api_key = environ.get('BREVO_API_KEY')

            if backend in ['resend', 'brevo']:
                init_kwargs['api_key'] = api_key

            # Merge with database config (for non-sensitive settings like from_email)
            if config_obj and backend == config_obj.backend_choice:
                # We filter out 'api_key' if it accidentally exists in DB config for extra safety
                db_config = config_obj.config or {}
                if 'api_key' in db_config:
                    db_config = db_config.copy()
                    del db_config['api_key']
                init_kwargs.update(db_config)
            
            service = service_class(**init_kwargs)
            
            # Cache the active service for 1 hour
            cache.set(cache_key, service, 3600)
            
        except Exception as e:
            raise NotificationException(f"Failed to initialize {backend} email service: {str(e)}")
    
    return service


def register_email_service(name: str, service_class: Type[BaseEmailService]):
    """
    Register a custom email service.
    """
    if not issubclass(service_class, BaseEmailService):
        raise ValueError(
            f"Email service must inherit from BaseEmailService. "
            f"{service_class.__name__} does not."
        )
    
    EMAIL_SERVICES[name.lower()] = service_class
    
    # Clear cache
    cache.delete('email_service_instance')
