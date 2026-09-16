import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('content', '0010_course_module_academic_context'), ('portal_auth', '0001_initial')]
    operations = [
        migrations.CreateModel(name='Forum', fields=[
            ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
            ('name', models.CharField(max_length=120)),
            ('description', models.TextField(max_length=1200, blank=True)),
            ('is_closed', models.BooleanField(default=False)),
            ('created_at', models.DateTimeField(auto_now_add=True)),
            ('created_by', models.ForeignKey(to='portal_auth.portaluser', on_delete=django.db.models.deletion.SET_NULL, null=True, related_name='created_forums')),
        ], options={'ordering': ['-created_at']}),
        migrations.CreateModel(name='ForumMembership', fields=[
            ('id', models.BigAutoField(primary_key=True, auto_created=True, serialize=False, verbose_name='ID')),
            ('is_admin', models.BooleanField(default=False)),
            ('joined_at', models.DateTimeField(auto_now_add=True)),
            ('forum', models.ForeignKey(to='content.forum', on_delete=django.db.models.deletion.CASCADE, related_name='memberships')),
            ('user', models.ForeignKey(to='portal_auth.portaluser', on_delete=django.db.models.deletion.CASCADE, related_name='forum_memberships')),
        ], options={'constraints': [models.UniqueConstraint(fields=('forum', 'user'), name='unique_forum_member')]}),
        migrations.CreateModel(name='ForumPost', fields=[
            ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
            ('body', models.TextField(max_length=10000)),
            ('storage_path', models.CharField(max_length=512, blank=True)),
            ('storage_backend', models.CharField(max_length=20, default='local')),
            ('filename', models.CharField(max_length=255, blank=True)),
            ('created_at', models.DateTimeField(auto_now_add=True)),
            ('forum', models.ForeignKey(to='content.forum', on_delete=django.db.models.deletion.CASCADE, related_name='posts')),
            ('author', models.ForeignKey(to='portal_auth.portaluser', on_delete=django.db.models.deletion.SET_NULL, null=True)),
            ('parent', models.ForeignKey(to='content.forumpost', on_delete=django.db.models.deletion.CASCADE, null=True, blank=True, related_name='replies')),
        ], options={'ordering': ['created_at']}),
    ]
