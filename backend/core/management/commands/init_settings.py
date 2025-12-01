from django.core.management.base import BaseCommand
from core.models import AppSetting
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Initialize default application settings in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update existing settings with default values',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        logger.info("Starting settings initialization...")
        
        # Define default settings
        default_settings = [
            {
                'key': 'REQUIRE_EMAIL_VERIFICATION',
                'value': 'true',
                'value_type': 'boolean',
                'description': 'Whether email verification is required for new applicant registrations. '
                              'When enabled, users must verify their email before they can log in.'
            },
            {
                'key': 'SITE_NAME',
                'value': 'ODeL Portal',
                'value_type': 'string',
                'description': 'The name of the application displayed in emails and UI'
            },
            {
                'key': 'ADMIN_EMAIL',
                'value': 'admin@odel.edu',
                'value_type': 'string',
                'description': 'Primary admin email for system notifications'
            },
            {
                'key': 'MAX_LOGIN_ATTEMPTS',
                'value': '5',
                'value_type': 'integer',
                'description': 'Maximum number of failed login attempts before account lockout'
            },
            {
                'key': 'SESSION_TIMEOUT_MINUTES',
                'value': '60',
                'value_type': 'integer',
                'description': 'Session timeout in minutes for inactive users'
            },
            {
                'key': 'ALLOW_APPLICANT_REGISTRATION',
                'value': 'true',
                'value_type': 'boolean',
                'description': 'Whether new applicants can register. Disable during closed admission periods.'
            },
            {
                'key': 'ADMISSION_OPEN',
                'value': 'true',
                'value_type': 'boolean',
                'description': 'Whether admission is currently open for applications'
            },
            {
                'key': 'MAINTENANCE_MODE',
                'value': 'false',
                'value_type': 'boolean',
                'description': 'Enable maintenance mode to prevent user access (admins only)'
            },
            {
                'key': 'ENABLE_APPLICATION_LOGGING',
                'value': 'true',
                'value_type': 'boolean',
                'description': 'Enable or disable application logging globally. '
                              'When disabled, most application logs will not be recorded.'
            },
            {
                'key': 'LOG_LEVEL',
                'value': 'INFO',
                'value_type': 'string',
                'description': 'Logging level for the application. Options: DEBUG, INFO, WARNING, ERROR, CRITICAL'
            },
        ]
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for setting_data in default_settings:
            key = setting_data['key']
            
            try:
                setting = AppSetting.objects.get(key=key)
                if force:
                    setting.value = setting_data['value']
                    setting.value_type = setting_data['value_type']
                    setting.description = setting_data['description']
                    setting.save()
                    updated_count += 1
                    logger.info(f"Updated setting: {key} = {setting_data['value']}")
                    self.stdout.write(
                        self.style.WARNING(f"Updated: {key} = {setting_data['value']}")
                    )
                else:
                    skipped_count += 1
                    logger.debug(f"Skipped existing setting: {key}")
                    self.stdout.write(
                        self.style.NOTICE(f"Exists: {key} (use --force to update)")
                    )
            except AppSetting.DoesNotExist:
                AppSetting.objects.create(**setting_data)
                created_count += 1
                logger.info(f"Created setting: {key} = {setting_data['value']}")
                self.stdout.write(
                    self.style.SUCCESS(f"Created: {key} = {setting_data['value']}")
                )
        
        # Summary
        summary_msg = (
            f"Settings initialization complete: "
            f"Created={created_count}, Updated={updated_count}, Skipped={skipped_count}"
        )
        logger.info(summary_msg)
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nSettings initialization complete:\n"
                f"  Created: {created_count}\n"
                f"  Updated: {updated_count}\n"
                f"  Skipped: {skipped_count}"
            )
        )
        
        # Clear cache to ensure fresh values
        from core.utils import clear_settings_cache
        clear_settings_cache()
        logger.info("Settings cache cleared")
        self.stdout.write(self.style.SUCCESS("Settings cache cleared."))
