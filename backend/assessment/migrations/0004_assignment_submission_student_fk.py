import django.db.models.deletion
from django.db import migrations, models


def ensure_submission_users(apps, schema_editor):
    PortalUser = apps.get_model('portal_auth', 'PortalUser')
    AssignmentSubmission = apps.get_model('assessment', 'AssignmentSubmission')

    student_ids = AssignmentSubmission.objects.values_list(
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
        ('assessment', '0003_alter_assignmentcontent_uploaded_by_and_more'),
        ('portal_auth', '0004_alter_portaluser_external_id'),
    ]

    operations = [
        migrations.RunPython(ensure_submission_users, migrations.RunPython.noop),
        migrations.RenameField(
            model_name='assignmentsubmission',
            old_name='student_external_id',
            new_name='student_external',
        ),
        migrations.AlterField(
            model_name='assignmentsubmission',
            name='student_external',
            field=models.ForeignKey(
                db_column='student_external_id',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='assignment_submissions',
                to='portal_auth.portaluser',
                to_field='external_id',
            ),
        ),
        migrations.AlterUniqueTogether(
            name='assignmentsubmission',
            unique_together={('assignment', 'student_external', 'attempt_number')},
        ),
        migrations.RemoveIndex(
            model_name='assignmentsubmission',
            name='assessment__assignm_887916_idx',
        ),
        migrations.AddIndex(
            model_name='assignmentsubmission',
            index=models.Index(
                fields=['assignment', 'student_external'],
                name='assessment__assignm_887916_idx',
            ),
        ),
    ]
