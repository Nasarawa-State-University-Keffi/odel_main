from django.db import migrations, models


def withhold_existing_assessment_scores(apps, schema_editor):
    """Require an explicit lecturer release for scores created before this setting."""
    Assessment = apps.get_model('assessment', 'Assessment')
    Assessment.objects.update(show_feedback=False)


class Migration(migrations.Migration):
    dependencies = [('assessment', '0007_single_choice_question_type')]

    operations = [
        migrations.AlterField(
            model_name='assessment',
            name='show_feedback',
            field=models.BooleanField(
                default=False,
                help_text='Release scores and marked responses to students after submission.',
            ),
        ),
        migrations.AlterField(
            model_name='assessmentattempt',
            name='show_feedback',
            field=models.BooleanField(
                default=False,
                help_text='Legacy score-release snapshot; assessment settings control visibility.',
            ),
        ),
        migrations.RunPython(withhold_existing_assessment_scores, migrations.RunPython.noop),
    ]
