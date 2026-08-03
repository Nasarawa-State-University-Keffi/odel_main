from collections.abc import Mapping

from django.core.exceptions import ValidationError
from django.core.validators import validate_email


ALLOWED_CONFIG_KEYS = frozenset({'from_email'})
SENSITIVE_CONFIG_KEY_PARTS = (
    'access_key',
    'api_key',
    'apikey',
    'credential',
    'password',
    'private_key',
    'secret',
    'token',
)
REDACTED_VALUE = '********'


def normalize_config_key(key):
    return str(key).strip().lower().replace('-', '_').replace(' ', '_')


def is_sensitive_config_key(key):
    normalized_key = normalize_config_key(key)
    return any(part in normalized_key for part in SENSITIVE_CONFIG_KEY_PARTS)


def validate_email_configuration(value):
    """Allow only non-sensitive settings understood by every email service."""
    if not isinstance(value, dict):
        raise ValidationError('Config must be a valid JSON object.')

    sensitive_keys = sorted(str(key) for key in value if is_sensitive_config_key(key))
    if sensitive_keys:
        raise ValidationError(
            'Sensitive configuration keys are not allowed: '
            f"{', '.join(sensitive_keys)}. Configure credentials through environment variables."
        )

    unknown_keys = sorted(str(key) for key in value if key not in ALLOWED_CONFIG_KEYS)
    if unknown_keys:
        raise ValidationError(
            f"Unsupported configuration keys: {', '.join(unknown_keys)}. "
            f"Allowed keys: {', '.join(sorted(ALLOWED_CONFIG_KEYS))}."
        )

    from_email = value.get('from_email')
    if from_email:
        if not isinstance(from_email, str):
            raise ValidationError('from_email must be a valid email address.')
        validate_email(from_email)


def redact_sensitive_config(value):
    """Defensively hide credentials that may exist in legacy database rows."""
    if isinstance(value, Mapping):
        return {
            key: REDACTED_VALUE if is_sensitive_config_key(key) else redact_sensitive_config(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [redact_sensitive_config(item) for item in value]
    return value
