from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Rename database tables from classroom_ prefix to courses_ prefix'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Drop the classroom_classroom table if it exists (since we removed the Classroom model)
            try:
                cursor.execute("DROP TABLE IF EXISTS classroom_classroom")
                self.stdout.write(self.style.SUCCESS('✓ Dropped classroom_classroom table'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Could not drop classroom_classroom: {e}'))
            
            # Rename tables
            try:
                cursor.execute("ALTER TABLE classroom_coursecache RENAME TO courses_coursecache")
                self.stdout.write(self.style.SUCCESS('✓ Renamed classroom_coursecache → courses_coursecache'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Table already renamed or does not exist: {e}'))
            
            try:
                cursor.execute("ALTER TABLE classroom_enrollmentcache RENAME TO courses_enrollmentcache")
                self.stdout.write(self.style.SUCCESS('✓ Renamed classroom_enrollmentcache → courses_enrollmentcache'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Table already renamed or does not exist: {e}'))
                
        self.stdout.write(self.style.SUCCESS('\nDatabase tables renamed successfully!'))
