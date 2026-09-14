from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0009_studygroupcommentmention'),
    ]

    operations = [
        migrations.AddField(
            model_name='coursemodule',
            name='programme_type_code',
            field=models.CharField(blank=True, db_index=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='coursemodule',
            name='session',
            field=models.CharField(blank=True, db_index=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='coursemodule',
            name='semester',
            field=models.CharField(blank=True, db_index=True, default='', max_length=100),
        ),
        migrations.AddIndex(
            model_name='coursemodule',
            index=models.Index(
                fields=['course', 'programme_type_code', 'session', 'semester', 'order'],
                name='content_mod_period_order_idx',
            ),
        ),
    ]
