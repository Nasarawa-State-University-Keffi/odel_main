from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import EmailConfiguration
from .serializers import EmailConfigurationSerializer


class EmailConfigurationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing email backend settings.
    Only accessible by staff/admin.
    """
    queryset = EmailConfiguration.objects.all()
    serializer_class = EmailConfigurationSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        # Automatically deactivates other configs if this one is active
        serializer.save()

    def perform_update(self, serializer):
        # Automatically deactivates other configs if this one is active
        serializer.save()
