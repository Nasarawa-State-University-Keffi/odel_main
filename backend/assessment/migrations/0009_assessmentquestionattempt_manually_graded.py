from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assessment', '0008_assessment_score_release'),
    ]

    operations = [
        migrations.AddField(
            model_name='assessmentquestionattempt',
            name='manually_graded',
            field=models.BooleanField(
                default=False,
                help_text='True when a staff member has marked this response manually (for example, an essay).',
            ),
        ),
    ]
