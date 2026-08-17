import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0002_alter_contentaccesslog_user_and_more'),
        ('courses', '0005_student_enrollment_user_fk'),
        ('portal_auth', '0004_alter_portaluser_external_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='CourseModule',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('order', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_published', models.BooleanField(db_index=True, default=False)),
                ('available_from', models.DateTimeField(blank=True, null=True)),
                ('available_until', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='content_modules', to='courses.coursecache')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_course_modules', to='portal_auth.portaluser')),
            ],
            options={
                'ordering': ['course', 'order', 'created_at'],
            },
        ),
        migrations.AddField(
            model_name='learningcontent',
            name='module',
            field=models.ForeignKey(blank=True, help_text='Course module containing this item. Null preserves legacy ungrouped content.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='contents', to='content.coursemodule'),
        ),
        migrations.AddField(
            model_name='learningcontent',
            name='order',
            field=models.PositiveIntegerField(db_index=True, default=0, help_text='Display order within the module.'),
        ),
        migrations.AddIndex(
            model_name='coursemodule',
            index=models.Index(fields=['course', 'order'], name='content_mod_course_order_idx'),
        ),
        migrations.AddIndex(
            model_name='coursemodule',
            index=models.Index(fields=['course', 'is_published'], name='content_mod_course_pub_idx'),
        ),
        migrations.AddIndex(
            model_name='learningcontent',
            index=models.Index(fields=['module', 'order'], name='content_lea_module_order_idx'),
        ),
    ]
