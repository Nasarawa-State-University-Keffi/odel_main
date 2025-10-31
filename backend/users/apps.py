from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    # Note: group creation moved to management command `create_groups`.
    # Avoid database access during app initialization to prevent runtime warnings.
