from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('portal_auth', '0003_portaluser_programme'),
    ]

    operations = [
        migrations.AlterField(
            model_name='portaluser',
            name='external_id',
            field=models.CharField(db_index=True, max_length=255, unique=True),
        ),
    ]
