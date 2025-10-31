from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Applicant, Student, Staff

User = get_user_model()

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role')


@admin.register(Applicant)
class ApplicantAdmin(admin.ModelAdmin):
    list_display = ('applicant_id', 'user', 'status')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('matric_no', 'user', 'programme')


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
