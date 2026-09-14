from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0006_course_offerings'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentregisteredcourse',
            name='course_offering',
            field=models.ForeignKey(
                blank=True,
                help_text='Exact programme and teaching-period offering when supplied by the portal.',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='student_enrollments',
                to='courses.courseoffering',
            ),
        ),
    ]
