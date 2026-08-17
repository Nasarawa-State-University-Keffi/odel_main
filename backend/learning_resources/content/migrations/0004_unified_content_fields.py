from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('content', '0003_course_modules'),
    ]

    operations = [
        migrations.AddField(
            model_name='learningcontent',
            name='content_format',
            field=models.CharField(
                choices=[
                    ('file', 'Uploaded file'),
                    ('text', 'Text'),
                    ('link', 'External link'),
                    ('youtube', 'YouTube video'),
                ],
                db_index=True,
                default='file',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='learningcontent',
            name='external_url',
            field=models.URLField(blank=True, max_length=2048),
        ),
        migrations.AddField(
            model_name='learningcontent',
            name='text_content',
            field=models.TextField(blank=True),
        ),
    ]
