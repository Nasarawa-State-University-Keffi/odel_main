from rest_framework import serializers
from .models import EmailConfiguration


class EmailConfigurationSerializer(serializers.ModelSerializer):
    """
    Serializer for managing email backend configurations.
    """
    class Meta:
        model = EmailConfiguration
        fields = ['id', 'backend_choice', 'is_active', 'config', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'config': {
                'help_text': 'Non-sensitive settings only. API keys must be set in environment variables.'
            }
        }

    def validate_config(self, value):
        """
        Ensure config is a valid dictionary if provided.
        """
        if not isinstance(value, dict):
            raise serializers.ValidationError("Config must be a valid JSON object.")
        return value
