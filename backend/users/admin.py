from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Applicant, Student, Staff

User = get_user_model()

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role')


@admin.register(Applicant)
class ApplicantAdmin(admin.ModelAdmin):
    list_display = ('applicant_id', 'user', 'programme_choice', 'mode_of_entry', 'status')
    list_filter = ('status', 'mode_of_entry')
    search_fields = ('applicant_id', 'user__email', 'user__first_name', 'user__last_name')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('matric_no', 'user', 'programme')


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
