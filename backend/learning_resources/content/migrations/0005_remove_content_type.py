from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('content', '0004_unified_content_fields'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='learningcontent',
            name='content_lea_course__7b6002_idx',
        ),
        migrations.RemoveIndex(
            model_name='learningcontent',
            name='content_lea_course__49ce18_idx',
        ),
        migrations.RemoveField(
            model_name='learningcontent',
            name='content_type',
        ),
    ]
