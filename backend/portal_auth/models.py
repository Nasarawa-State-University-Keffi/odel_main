from django.db import models


class PortalUser(models.Model):
    external_id = models.CharField(max_length=50, unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    level = models.CharField(max_length=20, blank=True, null=True)
    roles = models.JSONField(default=list)
    profile_picture = models.URLField(blank=True, null=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    last_synced_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.external_id})"

    @property
    def is_authenticated(self):
        """
        Required for DRF permission checks.
        Treats PortalUser as an authenticated user.
        """
        return True
