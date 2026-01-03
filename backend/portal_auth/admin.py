from django.contrib import admin
from .models import PortalUser

@admin.register(PortalUser)
class PortalUserAdmin(admin.ModelAdmin):
    list_display = ("external_id", "full_name", "email", "level", "is_staff", "is_active", "last_synced_at")
    search_fields = ("external_id", "full_name", "email", "level")
    list_filter = ("is_staff", "is_active", "level")
    readonly_fields = ("last_synced_at",)
