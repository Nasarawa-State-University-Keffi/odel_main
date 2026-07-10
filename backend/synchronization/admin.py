from django.contrib import admin

from .models import Department, Faculty, Programme, ProgrammeType


for model in (ProgrammeType, Faculty, Department, Programme):
    admin.site.register(model)
