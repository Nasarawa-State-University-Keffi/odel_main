import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('content', '0008_studygroups'),
        ('portal_auth', '0004_alter_portaluser_external_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudyGroupCommentMention',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('comment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mention_records', to='content.studygroupcomment')),
                ('mentioned_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='study_group_mentions', to='portal_auth.portaluser')),
            ],
        ),
        migrations.AddConstraint(
            model_name='studygroupcommentmention',
            constraint=models.UniqueConstraint(fields=('comment', 'mentioned_user'), name='unique_study_group_comment_mention'),
        ),
    ]
