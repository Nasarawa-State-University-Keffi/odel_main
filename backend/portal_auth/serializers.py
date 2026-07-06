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
            'level', 
            'roles', 
            'profile_picture',
            'is_active',
            'is_staff',
            'last_synced_at'
        ]
        read_only_fields = fields
