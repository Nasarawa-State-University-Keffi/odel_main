from django.db import models


class Faculty(models.Model):
    """Academic Faculty (e.g., Faculty of Science, Faculty of Management Sciences)"""
    name = models.CharField(max_length=200, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Faculty"
        verbose_name_plural = "Faculties"
        ordering = ['name']

    def __str__(self):
        return self.name


class Department(models.Model):
    """Academic Department within a Faculty"""
    faculty = models.ForeignKey(
        Faculty, 
        on_delete=models.CASCADE, 
        related_name="departments"
    )
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("faculty", "name")
        ordering = ['faculty__name', 'name']

    def __str__(self):
        return f"{self.name} ({self.faculty.name})"
