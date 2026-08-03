from rest_framework import serializers

from .config import redact_sensitive_config
from .models import EmailConfiguration, NotificationLog


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
                'help_text': (
                    'Non-sensitive settings only. Currently supports from_email. '
                    'Credentials must be set through environment variables.'
                )
            }
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['config'] = redact_sensitive_config(representation.get('config', {}))
        return representation


class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = [
            'id',
            'recipient',
            'subject',
            'body_text',
            'body_html',
            'status',
            'error_message',
            'backend_used',
            'sent_at',
            'created_at',
        ]
        read_only_fields = fields


class NotificationLogFilterSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=NotificationLog.STATUS_CHOICES,
        required=False,
    )
    backend = serializers.CharField(max_length=50, required=False)
    recipient = serializers.CharField(max_length=254, required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)

    def validate(self, attrs):
        date_from = attrs.get('date_from')
        date_to = attrs.get('date_to')
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError('date_from must not be later than date_to.')
        return attrs


class TestEmailSerializer(serializers.Serializer):
    recipient = serializers.EmailField()
    subject = serializers.CharField(max_length=255, default='LMS email delivery test')
    message = serializers.CharField(default='This is a test notification from the LMS.')
    html_message = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class TestEmailSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField(read_only=True)
    detail = serializers.CharField(read_only=True)
    backend = serializers.ChoiceField(
        choices=EmailConfiguration.BACKEND_CHOICES,
        read_only=True,
    )
    recipient = serializers.EmailField(read_only=True)
