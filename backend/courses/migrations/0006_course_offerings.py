from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0005_student_enrollment_user_fk'),
    ]

    operations = [
        migrations.CreateModel(
            name='CourseOffering',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('programme_type_code', models.CharField(db_index=True, max_length=100)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('active', 'Active'), ('closed', 'Closed'), ('archived', 'Archived')], db_index=True, default='active', max_length=20)),
                ('last_synced_at', models.DateTimeField(auto_now=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='offerings', to='courses.coursecache')),
                ('semester', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='course_offerings', to='courses.semester')),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='course_offerings', to='courses.academicsession')),
            ],
            options={'ordering': ['-session__name', 'semester__name', 'course__course_code']},
        ),
        migrations.AddField(
            model_name='staffassignedcourse',
            name='course_offering',
            field=models.ForeignKey(blank=True, help_text='Term-specific course context. Null is retained for legacy records.', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='teaching_assignments', to='courses.courseoffering'),
        ),
        migrations.AlterUniqueTogether(name='staffassignedcourse', unique_together=set()),
        migrations.AddConstraint(
            model_name='courseoffering',
            constraint=models.UniqueConstraint(fields=('course', 'session', 'semester', 'programme_type_code'), name='unique_course_offering_context'),
        ),
        migrations.AddIndex(
            model_name='courseoffering',
            index=models.Index(fields=['session', 'semester', 'programme_type_code', 'status'], name='course_offering_context_idx'),
        ),
        migrations.AddConstraint(
            model_name='staffassignedcourse',
            constraint=models.UniqueConstraint(condition=models.Q(('course_offering__isnull', False)), fields=('staff_external_id', 'course_offering'), name='unique_staff_course_offering'),
        ),
        migrations.AddConstraint(
            model_name='staffassignedcourse',
            constraint=models.UniqueConstraint(condition=models.Q(('course_offering__isnull', True)), fields=('staff_external_id', 'course', 'programme_type_code'), name='unique_legacy_staff_course'),
        ),
        migrations.AddIndex(
            model_name='staffassignedcourse',
            index=models.Index(fields=['staff_external_id', 'course_offering'], name='staff_course_offering_idx'),
        ),
    ]
