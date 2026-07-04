from rest_framework import serializers
from .models import PortalUser

class PortalUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalUser
        fields = [
            'id', 
            'external_id', 
            'email', 
            'full_name', 
            'user_type', 
            'roles', 
            'program_code',
            'is_active',
            'is_staff',
            'is_superuser'
        ]
        read_only_fields = fields
