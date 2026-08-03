from typing import Optional, Dict, Type, Any
from django.core.cache import cache

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

EMAIL_SERVICE_CACHE_PREFIX = 'email_service_instance'


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


def clear_email_service_cache(backend: Optional[str] = None):
    """Invalidate cached service instances after configuration changes."""
    keys = [EMAIL_SERVICE_CACHE_PREFIX]
    if backend:
        keys.append(f'{EMAIL_SERVICE_CACHE_PREFIX}:{backend.lower()}')
    else:
        keys.extend(f'{EMAIL_SERVICE_CACHE_PREFIX}:{name}' for name in EMAIL_SERVICES)
    cache.delete_many(keys)


def _configuration_fingerprint(config_obj):
    if config_obj is None:
        return 'environment'
    updated_at = getattr(config_obj, 'updated_at', None)
    return f'{config_obj.id}:{updated_at.isoformat() if updated_at else "unsaved"}'


def get_email_service(
    backend: Optional[str] = None,
    configuration: Optional[Any] = None,
) -> BaseEmailService:
    """
    Get email service instance based on configuration.
    Selection priority:
    1. Explicit 'backend' argument
    2. Database-backed active EmailConfiguration
    3. ENV/Settings fallback (defaulting to 'smtp')
    """
    config_obj = configuration

    if config_obj is not None:
        configured_backend = config_obj.backend_choice.lower()
        if backend is not None and backend.lower() != configured_backend:
            raise NotificationException(
                f"Email backend '{backend}' does not match configuration backend "
                f"'{configured_backend}'."
            )
        backend = configured_backend
    
    # 1. If no backend is provided, try to get it from the database
    if backend is None:
        config_obj = get_active_configuration()
        if config_obj:
            backend = config_obj.backend_choice
        else:
            # Fallback to default
            backend = 'smtp'
    
    backend = backend.lower()

    # Explicit backend requests may still use the active configuration when it
    # belongs to that backend. Inactive configurations must be passed directly.
    if config_obj is None:
        active_config = get_active_configuration()
        if active_config and active_config.backend_choice.lower() == backend:
            config_obj = active_config
    
    if backend not in EMAIL_SERVICES:
        supported = ', '.join(EMAIL_SERVICES.keys())
        raise NotificationException(
            f"Email backend '{backend}' is not supported. "
            f"Supported backends: {supported}"
        )
    
    cache_key = f'{EMAIL_SERVICE_CACHE_PREFIX}:{backend}'
    fingerprint = _configuration_fingerprint(config_obj)
    cached = cache.get(cache_key)
    if isinstance(cached, dict) and cached.get('fingerprint') == fingerprint:
        return cached['service']

    try:
        service_class = EMAIL_SERVICES[backend]
        init_kwargs = {}
        from os import environ

        if backend == 'resend':
            init_kwargs['api_key'] = environ.get('RESEND_API_KEY')
        elif backend == 'brevo':
            init_kwargs['api_key'] = environ.get('BREVO_API_KEY')

        # Only supported, non-sensitive database settings reach constructors.
        if config_obj:
            db_config = config_obj.config or {}
            if db_config.get('from_email'):
                init_kwargs['from_email'] = db_config['from_email']

        service = service_class(**init_kwargs)
        cache.set(
            cache_key,
            {'fingerprint': fingerprint, 'service': service},
            3600,
        )
        return service
    except Exception as exc:
        raise NotificationException(
            f'Failed to initialize {backend} email service: {exc}'
        ) from exc


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
    
    clear_email_service_cache()
