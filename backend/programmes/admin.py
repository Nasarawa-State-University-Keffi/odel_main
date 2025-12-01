from django.contrib import admin
from .models import StudyCategory, DegreeType, Programme


class DegreeTypeInline(admin.TabularInline):
    """Inline admin for DegreeType under StudyCategory"""
    model = DegreeType
    extra = 1
    fields = ('code', 'name', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(StudyCategory)
class StudyCategoryAdmin(admin.ModelAdmin):
    """Admin configuration for StudyCategory model"""
    list_display = ('code', 'name', 'created_at', 'updated_at')
    search_fields = ('code', 'name')
    ordering = ('code',)
    readonly_fields = ('created_at', 'updated_at')
    inlines = [DegreeTypeInline]


@admin.register(DegreeType)
class DegreeTypeAdmin(admin.ModelAdmin):
    """Admin configuration for DegreeType model"""
    list_display = ('code', 'name', 'category', 'created_at', 'updated_at')
    list_filter = ('category',)
    search_fields = ('code', 'name', 'category__name')
    ordering = ('category__code', 'code')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Programme)
class ProgrammeAdmin(admin.ModelAdmin):
    """Admin configuration for Programme model"""
    list_display = ('name', 'degree_type', 'department', 'get_faculty', 'duration_years', 'created_at')
    list_filter = ('degree_type', 'department__faculty', 'duration_years')
    search_fields = ('name', 'degree_type__code', 'degree_type__name', 'department__name', 'department__faculty__name')
    ordering = ('department__faculty__name', 'department__name', 'degree_type__code', 'name')
    readonly_fields = ('created_at', 'updated_at', 'full_name', 'faculty_name')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'degree_type', 'department', 'duration_years')
        }),
        ('Computed Fields', {
            'fields': ('full_name', 'faculty_name'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_faculty(self, obj):
        """Display faculty name in list view"""
        return obj.department.faculty.name
    get_faculty.short_description = 'Faculty'
    get_faculty.admin_order_field = 'department__faculty__name'
