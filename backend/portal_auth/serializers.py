from rest_framework import serializers
from .models import PortalUser

class PortalUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='external_id', read_only=True)
    firstName = serializers.CharField(source='first_name', read_only=True)
    lastName = serializers.CharField(source='last_name', read_only=True)

    class Meta:
        model = PortalUser
        fields = [
            'id', 
            'external_id', 
            'username',
            'email', 
            'full_name', 
            'first_name',
            'last_name',
            'firstName',
            'lastName',
            'level', 
            'roles', 
            'profile_picture',
            'programme',
            'is_active',
            'is_staff',
            'last_synced_at'
        ]
        read_only_fields = fields
