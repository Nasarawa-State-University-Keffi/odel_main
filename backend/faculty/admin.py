from django.contrib import admin
from .models import Faculty, Department


class DepartmentInline(admin.TabularInline):
    """Inline admin for Departments under Faculty"""
    model = Department
    extra = 1
    fields = ('name', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    """Admin configuration for Faculty model"""
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    inlines = [DepartmentInline]


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin configuration for Department model"""
    list_display = ('name', 'faculty', 'created_at', 'updated_at')
    list_filter = ('faculty',)
    search_fields = ('name', 'faculty__name')
    ordering = ('faculty__name', 'name')
    readonly_fields = ('created_at', 'updated_at')
