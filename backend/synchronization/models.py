from django.db import models


class MasterData(models.Model):
    up_stream_id = models.PositiveBigIntegerField(unique=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ProgrammeType(MasterData):
    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Faculty(MasterData):
    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Department(MasterData):
    faculty = models.ForeignKey(Faculty, on_delete=models.PROTECT, related_name='departments')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Programme(MasterData):
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='programmes')
    programme_type = models.ForeignKey(ProgrammeType, on_delete=models.PROTECT, related_name='programmes')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
