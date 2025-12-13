from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Rename classroom app to courses in migration history'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Update django_migrations table
            cursor.execute("UPDATE django_migrations SET app = 'courses' WHERE app = 'classroom'")
            migrations_updated = cursor.rowcount
            
            # Update django_content_type table
            cursor.execute("UPDATE django_content_type SET app_label = 'courses' WHERE app_label = 'classroom'")
            content_types_updated = cursor.rowcount
            
        self.stdout.write(self.style.SUCCESS(f'✓ Updated {migrations_updated} migration records'))
        self.stdout.write(self.style.SUCCESS(f'✓ Updated {content_types_updated} content type records'))
        self.stdout.write(self.style.SUCCESS('\nMigration history updated successfully!'))
        self.stdout.write('You can now run: python manage.py makemigrations')
