from django.core.management.base import BaseCommand
from core.models import AppSetting
from core.logging import get_logger

logger = get_logger(__name__)


class Command(BaseCommand):
    help = 'Initialize admission-related settings in database'

    def handle(self, *args, **options):
        logger.info("Starting admission settings initialization...")
        self.stdout.write("Initializing admission settings...")
        
        settings = [
            {
                'key': 'RESULT_VERIFICATION_MODE',
                'value': 'manual',
                'value_type': 'string',
                'description': (
                    'Exam result verification mode: "auto" for automatic '
                    '3rd-party API verification, "manual" for staff review only'
                )
            },
            {
                'key': 'ALLOWED_SITTING_COUNT',
                'value': '2',
                'value_type': 'integer',
                'description': (
                    'Maximum number of exam sittings allowed per application (1 or 2)'
                )
            },
            {
                'key': 'CURRENT_ADMISSION_SESSION',
                'value': '2024/2025',
                'value_type': 'string',
                'description': 'Current admission session'
            },
            {
                'key': 'MINIMUM_CREDIT_PASSES',
                'value': '5',
                'value_type': 'integer',
                'description': 'Minimum number of credit passes (C6 or better) required'
            },
        ]
        
        created = 0
        updated = 0
        skipped = 0
        
        for setting_data in settings:
            setting, was_created = AppSetting.objects.get_or_create(
                key=setting_data['key'],
                defaults={
                    'value': setting_data['value'],
                    'value_type': setting_data['value_type'],
                    'description': setting_data['description']
                }
            )
            
            if was_created:
                created += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created: {setting.key} = {setting.value}"
                    )
                )
                logger.info(f"Created setting: {setting.key} = {setting.value}")
            else:
                skipped += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"Already exists: {setting.key} = {setting.value}"
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nAdmission settings initialization complete:\n"
                f"  Created: {created}\n"
                f"  Updated: {updated}\n"
                f"  Skipped: {skipped}"
            )
        )
        logger.info(
            f"Admission settings initialization complete: "
            f"Created={created}, Updated={updated}, Skipped={skipped}"
        )
        
        # Clear cache
        from core.utils import clear_settings_cache
        clear_settings_cache()
        self.stdout.write(self.style.SUCCESS("Settings cache cleared."))
