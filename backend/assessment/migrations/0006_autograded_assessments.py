# Generated manually because the local Python runtime does not include Django.

from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
import uuid
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('assessment', '0005_quiz_publish_and_attempt_order'),
        ('courses', '0006_course_offerings'),
    ]

    operations = [
        migrations.AddField(
            model_name='questioncategory',
            name='bank',
            field=models.CharField(
                choices=[('quiz', 'Quiz question bank'), ('assessment', 'Assessment question bank')],
                db_index=True,
                default='quiz',
                help_text='Keeps quiz questions and assessment questions in separate banks.',
                max_length=20,
            ),
        ),
        migrations.AlterUniqueTogether(
            name='questioncategory',
            unique_together={('course', 'bank', 'name')},
        ),
        migrations.CreateModel(
            name='Assessment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('is_published', models.BooleanField(default=False, help_text='Only published assessments are visible to enrolled students.')),
                ('time_open', models.DateTimeField(blank=True, null=True)),
                ('time_close', models.DateTimeField(blank=True, null=True)),
                ('time_limit', models.IntegerField(blank=True, help_text='Time limit in seconds. Leave blank for no per-attempt limit.', null=True)),
                ('max_grade', models.DecimalField(decimal_places=2, default=100.0, max_digits=10)),
                ('shuffle_questions', models.BooleanField(default=False)),
                ('max_attempts', models.PositiveIntegerField(default=1, help_text='Maximum attempts allowed; zero means unlimited.')),
                ('show_feedback', models.BooleanField(default=True, help_text='Show marked responses after submission.')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assessments', to='courses.coursecache')),
                ('course_offering', models.ForeignKey(blank=True, help_text='The programme, session, and semester delivery this assessment belongs to.', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='assessments', to='courses.courseoffering')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='AssessmentAttempt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_external_id', models.CharField(db_index=True, max_length=255)),
                ('attempt_number', models.PositiveIntegerField()),
                ('state', models.CharField(choices=[('in_progress', 'In Progress'), ('finished', 'Finished'), ('abandoned', 'Abandoned')], db_index=True, default='in_progress', max_length=20)),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                ('deadline_at', models.DateTimeField(blank=True, help_text='Deadline frozen when this attempt starts.', null=True)),
                ('grade_scale', models.DecimalField(decimal_places=2, default='100.00', help_text='Assessment maximum grade frozen when this attempt starts.', max_digits=10)),
                ('show_feedback', models.BooleanField(default=True, help_text='Feedback visibility policy frozen when this attempt starts.')),
                ('total_score', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('assessment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attempts', to='assessment.assessment')),
            ],
            options={'ordering': ['-started_at']},
        ),
        migrations.CreateModel(
            name='AssessmentQuestion',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('order', models.PositiveIntegerField()),
                ('max_mark', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))])),
                ('assessment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assessment_questions', to='assessment.assessment')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='assessment_slots', to='assessment.question')),
            ],
            options={'ordering': ['assessment', 'order']},
        ),
        migrations.CreateModel(
            name='AssessmentQuestionAttempt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('max_mark', models.DecimalField(decimal_places=2, default=1, max_digits=10)),
                ('question_snapshot', models.JSONField(default=dict)),
                ('response', models.JSONField(default=dict)),
                ('fraction', models.DecimalField(blank=True, decimal_places=2, max_digits=3, null=True)),
                ('score', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('graded_at', models.DateTimeField(blank=True, null=True)),
                ('feedback', models.TextField(blank=True)),
                ('assessment_attempt', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='question_attempts', to='assessment.assessmentattempt')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='assessment_attempts', to='assessment.question')),
            ],
            options={'ordering': ['assessment_attempt', 'display_order', 'id']},
        ),
        migrations.AddIndex(
            model_name='assessment',
            index=models.Index(fields=['course', 'is_published'], name='assess_course_pub_idx'),
        ),
        migrations.AddIndex(
            model_name='assessmentattempt',
            index=models.Index(fields=['assessment', 'user_external_id', '-attempt_number'], name='assessment_attempt_user_idx'),
        ),
        migrations.AddIndex(
            model_name='assessmentattempt',
            index=models.Index(fields=['state', 'started_at'], name='assessment_attempt_state_idx'),
        ),
        migrations.AddConstraint(
            model_name='assessmentquestion',
            constraint=models.UniqueConstraint(fields=('assessment', 'question'), name='unique_assessment_question'),
        ),
        migrations.AddConstraint(
            model_name='assessmentquestion',
            constraint=models.UniqueConstraint(fields=('assessment', 'order'), name='unique_assessment_question_order'),
        ),
        migrations.AddConstraint(
            model_name='assessmentquestion',
            constraint=models.CheckConstraint(condition=models.Q(('max_mark__gt', 0)), name='assessment_question_positive_mark'),
        ),
        migrations.AddConstraint(
            model_name='assessmentattempt',
            constraint=models.UniqueConstraint(fields=('assessment', 'user_external_id', 'attempt_number'), name='unique_assessment_attempt_number'),
        ),
        migrations.AddConstraint(
            model_name='assessmentquestionattempt',
            constraint=models.UniqueConstraint(fields=('assessment_attempt', 'question'), name='unique_assessment_question_attempt'),
        ),
        migrations.AddField(
            model_name='grade',
            name='assessment_attempt',
            field=models.ForeignKey(blank=True, help_text='Link to graded assessment attempt', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='grades', to='assessment.assessmentattempt'),
        ),
        migrations.AlterField(
            model_name='grade',
            name='grade_type',
            field=models.CharField(choices=[('assignment', 'Assignment'), ('quiz', 'Quiz'), ('assessment', 'Assessment')], db_index=True, help_text='Type of graded item', max_length=20),
        ),
        migrations.AddConstraint(
            model_name='grade',
            constraint=models.UniqueConstraint(condition=models.Q(('assessment_attempt__isnull', False)), fields=('assessment_attempt',), name='unique_assessment_attempt_grade'),
        ),
    ]
