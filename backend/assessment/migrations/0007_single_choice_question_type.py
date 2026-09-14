from django.db import migrations, models


QUESTION_TYPE_CHOICES = [
    ('multichoice', 'Multiple Choice'),
    ('singlechoice', 'Single Choice'),
    ('truefalse', 'True/False'),
    ('shortanswer', 'Short Answer'),
    ('essay', 'Essay'),
]


class Migration(migrations.Migration):
    dependencies = [('assessment', '0006_autograded_assessments')]

    operations = [
        migrations.AlterField(
            model_name='question',
            name='qtype',
            field=models.CharField(choices=QUESTION_TYPE_CHOICES, db_index=True, max_length=32),
        ),
        migrations.AlterField(
            model_name='questiontypeavailability',
            name='question_type',
            field=models.CharField(choices=QUESTION_TYPE_CHOICES, db_index=True, help_text='Type of question', max_length=32),
        ),
    ]
