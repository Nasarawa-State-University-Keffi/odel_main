from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('content', '0011_forums')]
    operations = [
        migrations.AddField(model_name='forumpost', name='attachment_url',
                            field=models.URLField(max_length=2048, blank=True)),
        migrations.AddField(model_name='forumpost', name='resource_type',
                            field=models.CharField(max_length=20, blank=True)),
    ]
