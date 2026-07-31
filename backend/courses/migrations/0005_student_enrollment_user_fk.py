import django.db.models.deletion
from django.db import migrations, models


def ensure_enrollment_users(apps, schema_editor):
    PortalUser = apps.get_model('portal_auth', 'PortalUser')
    StudentRegisteredCourse = apps.get_model('courses', 'StudentRegisteredCourse')

    student_ids = StudentRegisteredCourse.objects.values_list(
        'student_external_id', flat=True
    ).distinct()
    for student_id in student_ids.iterator():
        PortalUser.objects.get_or_create(
            external_id=student_id,
            defaults={
                'full_name': student_id,
                'roles': ['STUDENT'],
                'is_active': False,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ('courses', '0004_academicsession_semester'),
        ('portal_auth', '0004_alter_portaluser_external_id'),
    ]

    operations = [
        migrations.RunPython(ensure_enrollment_users, migrations.RunPython.noop),
        migrations.RenameField(
            model_name='studentregisteredcourse',
            old_name='student_external_id',
            new_name='student_external',
        ),
        migrations.AlterField(
            model_name='studentregisteredcourse',
            name='student_external',
            field=models.ForeignKey(
                db_column='student_external_id',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='registered_courses',
                to='portal_auth.portaluser',
                to_field='external_id',
            ),
        ),
        migrations.AlterUniqueTogether(
            name='studentregisteredcourse',
            unique_together={('student_external', 'course', 'session', 'semester')},
        ),
    ]
