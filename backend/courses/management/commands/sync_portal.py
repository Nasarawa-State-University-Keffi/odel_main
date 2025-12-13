from django.core.management.base import BaseCommand
from django.db import connections, transaction
from courses.models import CourseCache, EnrollmentCache


class Command(BaseCommand):
    help = 'Sync courses and enrollments from the portal database into caches.'

    def handle(self, *args, **options):
        self.stdout.write('Starting portal sync...')
        conn_alias = 'portal'
        if conn_alias not in connections:
            self.stdout.write('No portal DB configured; skipping.')
            return

        with connections[conn_alias].cursor() as cursor:
            # Example: portal should expose `courses` and `enrollments` tables
            try:
                cursor.execute('SELECT id, title, code, data FROM courses')
                courses = cursor.fetchall()
            except Exception:
                courses = []

            for row in courses:
                external_id, title, code, data = row
                with transaction.atomic():
                    CourseCache.objects.update_or_create(
                        external_id=str(external_id),
                        defaults={'title': title or '', 'code': code or '', 'data': data or {}},
                    )

            try:
                cursor.execute('SELECT user_external_id, course_id, role, data FROM enrollments')
                enrolls = cursor.fetchall()
            except Exception:
                enrolls = []

            for row in enrolls:
                user_external_id, course_id, role, data = row
                try:
                    course = CourseCache.objects.get(external_id=str(course_id))
                except CourseCache.DoesNotExist:
                    continue
                with transaction.atomic():
                    EnrollmentCache.objects.update_or_create(
                        user_external_id=str(user_external_id),
                        course=course,
                        defaults={'role': role or 'student', 'data': data or {}},
                    )

        self.stdout.write('Portal sync completed.')
