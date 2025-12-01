from django.db import models
from faculty.models import Department


class StudyCategory(models.Model):
    """
    Study Category (e.g., Undergraduate, Postgraduate, Diploma, Certificate)
    """
    code = models.CharField(max_length=10, unique=True, help_text="e.g., UG, PG, DIP, CERT")
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Study Category"
        verbose_name_plural = "Study Categories"
        ordering = ['code']

    def __str__(self):
        return self.name


class DegreeType(models.Model):
    """
    Degree Type within a Study Category (e.g., BSc, BA, MSc, PhD)
    """
    category = models.ForeignKey(
        StudyCategory,
        on_delete=models.CASCADE,
        related_name='degree_types'
    )
    code = models.CharField(max_length=20, help_text="e.g., BSc, BA, PGD, MSc, MBA, PhD")
    name = models.CharField(max_length=100, help_text="Full name of degree")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('category', 'code')
        ordering = ['category__code', 'code']

    def __str__(self):
        return f"{self.code} ({self.category.code})"


class Programme(models.Model):
    """
    Academic Programme (e.g., BSc Accounting, MSc Data Science)
    """
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='programmes'
    )
    degree_type = models.ForeignKey(
        DegreeType,
        on_delete=models.CASCADE,
        related_name='programmes'
    )
    name = models.CharField(max_length=200, help_text="Programme name (e.g., Accounting, Computer Science)")
    duration_years = models.IntegerField(default=4, help_text="Programme duration in years")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('department', 'degree_type', 'name')
        ordering = ['department__faculty__name', 'department__name', 'degree_type__code', 'name']

    def __str__(self):
        return f"{self.degree_type.code} {self.name}"
    
    @property
    def full_name(self):
        """Return full programme name including degree type"""
        return f"{self.degree_type.name} in {self.name}"
    
    @property
    def faculty_name(self):
        """Return faculty name"""
        return self.department.faculty.name
