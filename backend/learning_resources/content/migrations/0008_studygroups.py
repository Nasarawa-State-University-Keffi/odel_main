import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('content', '0007_lessoncomment'),
        ('portal_auth', '0004_alter_portaluser_external_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudyGroup',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('session', models.CharField(db_index=True, max_length=50)),
                ('semester', models.CharField(db_index=True, max_length=100)),
                ('name', models.CharField(max_length=120)),
                ('description', models.TextField(blank=True, max_length=1200)),
                ('join_code', models.CharField(db_index=True, max_length=12, unique=True)),
                ('is_open', models.BooleanField(default=True)),
                ('member_limit', models.PositiveIntegerField(default=20)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='study_groups', to='courses.coursecache')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_study_groups', to='portal_auth.portaluser')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='StudyGroupMaterial',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, max_length=1000)),
                ('external_url', models.URLField(blank=True, max_length=2048)),
                ('storage_path', models.CharField(blank=True, max_length=512)),
                ('original_filename', models.CharField(blank=True, max_length=512)),
                ('file_size', models.BigIntegerField(blank=True, null=True)),
                ('mime_type', models.CharField(blank=True, max_length=100)),
                ('storage_backend', models.CharField(default='local', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='materials', to='content.studygroup')),
                ('uploaded_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='shared_study_group_materials', to='portal_auth.portaluser')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='StudyGroupMembership',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('owner', 'Owner'), ('member', 'Member')], default='member', max_length=12)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='content.studygroup')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='study_group_memberships', to='portal_auth.portaluser')),
            ],
            options={'ordering': ['joined_at']},
        ),
        migrations.CreateModel(
            name='StudyGroupComment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('body', models.TextField(max_length=4000)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='study_group_comments', to='portal_auth.portaluser')),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='content.studygroup')),
                ('material', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='content.studygroupmaterial')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='content.studygroupcomment')),
            ],
            options={'ordering': ['created_at']},
        ),
        migrations.AddConstraint(
            model_name='studygroupmembership',
            constraint=models.UniqueConstraint(fields=('group', 'user'), name='unique_study_group_member'),
        ),
        migrations.AddIndex(
            model_name='studygroup',
            index=models.Index(fields=['course', 'session', 'semester'], name='study_group_course_period_idx'),
        ),
        migrations.AddIndex(
            model_name='studygroupcomment',
            index=models.Index(fields=['group', 'material', 'parent', 'created_at'], name='study_group_comment_idx'),
        ),
    ]
