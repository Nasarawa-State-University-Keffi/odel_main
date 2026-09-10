import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('content', '0006_remove_content_description'),
        ('portal_auth', '0004_alter_portaluser_external_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='LessonComment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('body', models.TextField(max_length=4000)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lesson_comments', to='portal_auth.portaluser')),
                ('content', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lesson_comments', to='content.learningcontent')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='content.lessoncomment')),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='lessoncomment',
            index=models.Index(fields=['content', 'parent', 'created_at'], name='lesson_comment_thread_idx'),
        ),
    ]
