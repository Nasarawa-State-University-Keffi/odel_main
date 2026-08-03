from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from portal_auth.permissions import IsPortalAdmin

from .email import send_one
from .models import EmailConfiguration, NotificationLog
from .serializers import (
    EmailConfigurationSerializer,
    NotificationLogFilterSerializer,
    NotificationLogSerializer,
    TestEmailSerializer,
    TestEmailSuccessSerializer,
)


@extend_schema(tags=['Admin - Notifications'])
class EmailConfigurationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing email backend settings.
    Only accessible by portal administrators.
    """
    queryset = EmailConfiguration.objects.order_by('-updated_at')
    serializer_class = EmailConfigurationSerializer
    permission_classes = [IsPortalAdmin]

    def perform_create(self, serializer):
        # Automatically deactivates other configs if this one is active
        serializer.save()

    def perform_update(self, serializer):
        # Automatically deactivates other configs if this one is active
        serializer.save()

    @extend_schema(
        summary='Delete an inactive email configuration',
        responses={
            204: None,
            409: OpenApiResponse(
                description='The active configuration cannot be deleted.'
            ),
        },
    )
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_active:
            return Response(
                {
                    'status': 'error',
                    'detail': 'The active email configuration cannot be deleted. Activate another configuration first.',
                },
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary='Activate an email configuration',
        request=None,
        responses={200: EmailConfigurationSerializer},
    )
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        with transaction.atomic():
            # Serialize concurrent activation attempts before the model and
            # database constraint enforce the single-active invariant.
            list(EmailConfiguration.objects.select_for_update().filter(is_active=True))
            instance = self.get_object()
            instance.is_active = True
            instance.save(update_fields=['is_active', 'updated_at'])

        return Response(self.get_serializer(instance).data)

    @extend_schema(
        summary='Send a test email with this configuration',
        request=TestEmailSerializer,
        responses={
            200: TestEmailSuccessSerializer,
            502: OpenApiResponse(
                description='The provider could not deliver the test email.'
            ),
        },
    )
    @action(detail=True, methods=['post'], url_path='test')
    def test(self, request, pk=None):
        configuration = self.get_object()
        serializer = TestEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        success = send_one(
            recipient=payload['recipient'],
            subject=payload['subject'],
            message=payload['message'],
            html_message=payload.get('html_message'),
            configuration=configuration,
        )
        if not success:
            return Response(
                {
                    'status': 'error',
                    'detail': 'The test email could not be delivered. Check the notification log for details.',
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            'success': True,
            'detail': 'Test email sent successfully.',
            'backend': configuration.backend_choice,
            'recipient': payload['recipient'],
        })


@extend_schema(tags=['Admin - Notifications'])
class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only delivery audit logs for portal administrators."""
    queryset = NotificationLog.objects.all()
    serializer_class = NotificationLogSerializer
    permission_classes = [IsPortalAdmin]
    search_fields = ['recipient', 'subject', 'body_text', 'error_message']
    ordering_fields = ['created_at', 'sent_at', 'recipient', 'status', 'backend_used']
    ordering = ['-created_at']

    @extend_schema(
        summary='List notification delivery logs',
        parameters=[
            OpenApiParameter('status', str, enum=['pending', 'sent', 'failed']),
            OpenApiParameter('backend', str),
            OpenApiParameter('recipient', str),
            OpenApiParameter('date_from', str, description='Earliest creation date (YYYY-MM-DD).'),
            OpenApiParameter('date_to', str, description='Latest creation date (YYYY-MM-DD).'),
        ],
        responses={200: NotificationLogSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        filters = NotificationLogFilterSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        values = filters.validated_data
        queryset = super().get_queryset()

        if values.get('status'):
            queryset = queryset.filter(status=values['status'])
        if values.get('backend'):
            queryset = queryset.filter(backend_used__icontains=values['backend'])
        if values.get('recipient'):
            queryset = queryset.filter(recipient__icontains=values['recipient'])
        if values.get('date_from'):
            queryset = queryset.filter(created_at__date__gte=values['date_from'])
        if values.get('date_to'):
            queryset = queryset.filter(created_at__date__lte=values['date_to'])

        return queryset
