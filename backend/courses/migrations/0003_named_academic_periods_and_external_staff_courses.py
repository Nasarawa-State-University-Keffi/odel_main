from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('courses', '0002_rename_staffregisteredcourse_staffassignedcourse_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='coursecache',
            name='semester_id',
        ),
        migrations.RemoveField(
            model_name='coursecache',
            name='session_id',
        ),
        migrations.RemoveField(
            model_name='coursecache',
            name='programme_id',
        ),
        migrations.RenameField(
            model_name='studentregisteredcourse',
            old_name='session_id',
            new_name='session',
        ),
        migrations.RenameField(
            model_name='studentregisteredcourse',
            old_name='semester_id',
            new_name='semester',
        ),
        migrations.AlterField(
            model_name='studentregisteredcourse',
            name='session',
            field=models.CharField(db_index=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='studentregisteredcourse',
            name='semester',
            field=models.CharField(db_index=True, max_length=100),
        ),
        migrations.AlterUniqueTogether(
            name='studentregisteredcourse',
            unique_together={('student_external_id', 'course', 'session', 'semester')},
        ),
        migrations.AddField(
            model_name='staffassignedcourse',
            name='programme_type_code',
            field=models.CharField(db_index=True, default='UNKNOWN', max_length=100),
        ),
        migrations.AlterUniqueTogether(
            name='staffassignedcourse',
            unique_together={('staff_external_id', 'course', 'programme_type_code')},
        ),
    ]
