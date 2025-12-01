# Core App - Dynamic Settings System

## Overview
The `core` app provides a database-driven dynamic settings system that replaces hard-coded configuration values in `settings.py`. Settings can be modified through Django Admin without code changes or server restarts.

## Features
- ✅ Database-stored settings with type support (string, boolean, integer, JSON)
- ✅ Built-in caching for performance (prevents excessive DB queries)
- ✅ Django Admin interface with automatic cache invalidation
- ✅ Audit trail (tracks who updated settings and when)
- ✅ Management command for initial setup
- ✅ Reusable across all Django apps

## Usage

### In Your Views/Code
```python
from core.utils import get_setting

# Get a setting with default fallback
require_verification = get_setting('REQUIRE_EMAIL_VERIFICATION', default=True)
site_name = get_setting('SITE_NAME', default='ODeL')
max_attempts = get_setting('MAX_LOGIN_ATTEMPTS', default=5)

# Check if admission is open
if get_setting('ADMISSION_OPEN', default=True):
    # Allow applications
    pass
```

### Available Helper Functions
```python
from core.utils import get_setting, set_setting, clear_settings_cache, get_all_settings

# Get a setting
value = get_setting('KEY_NAME', default='fallback')

# Set/Update a setting programmatically
set_setting('NEW_SETTING', 'value', description='What it does', value_type='string', user=request.user)

# Clear cache after bulk updates
clear_settings_cache()

# Get all settings as dictionary
all_settings = get_all_settings()
```

## Initial Setup

### 1. Run Migrations
```bash
python manage.py makemigrations core
python manage.py migrate core
```

### 2. Initialize Default Settings
```bash
# Create default settings
python manage.py init_settings

# Or force update existing settings
python manage.py init_settings --force
```

## Default Settings Included

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `REQUIRE_EMAIL_VERIFICATION` | boolean | true | Email verification required for registration |
| `SITE_NAME` | string | ODeL Portal | Application name |
| `ADMIN_EMAIL` | string | admin@odel.edu | System admin email |
| `MAX_LOGIN_ATTEMPTS` | integer | 5 | Max failed login attempts |
| `SESSION_TIMEOUT_MINUTES` | integer | 60 | Session timeout |
| `ALLOW_APPLICANT_REGISTRATION` | boolean | true | Allow new registrations |
| `ADMISSION_OPEN` | boolean | true | Admission period status |
| `MAINTENANCE_MODE` | boolean | false | Maintenance mode toggle |

## Admin Interface

1. Go to Django Admin: `/admin/`
2. Navigate to **Core System > App Settings**
3. Click on any setting to edit
4. Changes take effect immediately (cache auto-cleared)

### Admin Features
- List view shows all settings with formatted values
- Boolean settings show ✅/❌ indicators
- Key field is read-only after creation (prevents breaking changes)
- Audit trail shows who made changes and when
- Search and filter capabilities

## How It Works

### Caching Strategy
- Each setting is cached individually for 1 hour
- Cache key format: `app_setting_{KEY_NAME}`
- Cache automatically invalidated when setting is saved/deleted
- Manual cache clear: `clear_settings_cache()`

### Type Conversion
Settings are stored as text but automatically converted:
- **boolean**: Accepts `true/false`, `1/0`, `yes/no`, `on/off`
- **integer**: Converted to int, defaults to 0 on error
- **json**: Parsed as JSON object
- **string**: Returned as-is

### Performance
- First access: Database query + cache write
- Subsequent accesses: Cache read only (no DB hit)
- Cache miss: Automatic DB fallback

## Best Practices

1. **Always provide defaults**
   ```python
   # Good
   value = get_setting('KEY', default=True)
   
   # Avoid
   value = get_setting('KEY')  # Returns None if missing
   ```

2. **Use descriptive keys**
   ```python
   # Good
   'REQUIRE_EMAIL_VERIFICATION'
   'MAX_LOGIN_ATTEMPTS'
   
   # Avoid
   'REQ_VER'
   'MAX_ATT'
   ```

3. **Document settings**
   Always provide clear descriptions when creating settings

4. **Use appropriate types**
   Choose the correct `value_type` for proper conversion

## Extending the System

### Add New Settings via Migration
```python
# core/migrations/XXXX_add_new_settings.py
from django.db import migrations

def add_settings(apps, schema_editor):
    AppSetting = apps.get_model('core', 'AppSetting')
    AppSetting.objects.get_or_create(
        key='NEW_SETTING_KEY',
        defaults={
            'value': 'default_value',
            'value_type': 'string',
            'description': 'What this setting controls'
        }
    )

class Migration(migrations.Migration):
    dependencies = [('core', 'XXXX_previous_migration')]
    operations = [migrations.RunPython(add_settings)]
```

### Programmatic Setting Creation
```python
from core.utils import set_setting

set_setting(
    key='CUSTOM_FEATURE_ENABLED',
    value=True,
    value_type='boolean',
    description='Enable custom feature',
    user=request.user
)
```

## Troubleshooting

### Setting not updating?
1. Check Django Admin - was it actually saved?
2. Clear cache manually: `AppSetting.clear_all_cache()` in shell
3. Verify cache backend is configured in settings.py

### Performance issues?
- Check cache is enabled and working
- Consider increasing cache timeout
- Use `use_cache=False` parameter for debugging: `get_setting('KEY', use_cache=False)`

### Type conversion errors?
- Verify `value_type` matches actual value format
- Check value format (e.g., `true` not `True` for booleans)
- Use string type as fallback

## Security Notes

- Only admin users can modify settings
- Audit trail tracks all changes
- Consider restricting admin access to settings model
- Don't store sensitive data (passwords, keys) in settings - use environment variables instead
