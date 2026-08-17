from django.db import migrations


def move_descriptions_to_text_content(apps, schema_editor):
    LearningContent = apps.get_model('content', 'LearningContent')
    for item in LearningContent.objects.all().iterator():
        if not item.text_content and item.description:
            item.text_content = item.description
            item.save(update_fields=['text_content'])


class Migration(migrations.Migration):
    dependencies = [
        ('content', '0005_remove_content_type'),
    ]

    operations = [
        migrations.RunPython(move_descriptions_to_text_content, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='learningcontent',
            name='description',
        ),
    ]
