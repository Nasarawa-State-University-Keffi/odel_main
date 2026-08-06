from datetime import timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from portal_auth.models import PortalUser

from .email import send_one
from .models import EmailConfiguration, NotificationLog
from .services.base import NotificationException
from .services.console_service import ConsoleEmailService
from .services.router import get_email_service
from .services.smtp_service import SMTPEmailService


class AdminNotificationApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = PortalUser.objects.create(
            external_id='notification-admin',
            full_name='Notification Admin',
            roles=['ADMIN'],
            is_staff=True,
        )
        self.staff = PortalUser.objects.create(
            external_id='notification-staff',
            full_name='Notification Staff',
            roles=['STAFF'],
            is_staff=True,
        )
        self.active_config = EmailConfiguration.objects.create(
            backend_choice='console',
            is_active=True,
            config={'from_email': 'notifications@example.edu.ng'},
        )
        self.client.force_authenticate(self.admin)

    def test_only_portal_admins_can_manage_notification_settings(self):
        response = self.client.get('/api/notifications/settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/notifications/settings/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=None)
        response = self.client.get('/api/notifications/settings/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rejects_credentials_and_unsupported_database_config(self):
        response = self.client.post(
            '/api/notifications/settings/',
            {
                'backend_choice': 'resend',
                'is_active': False,
                'config': {'api_key': 'must-not-be-stored'},
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('environment variables', str(response.data['detail']))

        response = self.client.post(
            '/api/notifications/settings/',
            {
                'backend_choice': 'smtp',
                'is_active': False,
                'config': {'host': 'smtp.example.edu.ng'},
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Unsupported configuration keys', str(response.data['detail']))

    def test_validates_default_sender_address(self):
        response = self.client.patch(
            f'/api/notifications/settings/{self.active_config.id}/',
            {'config': {'from_email': 'not-an-email'}},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_redacts_credentials_from_legacy_configuration_rows(self):
        EmailConfiguration.objects.filter(pk=self.active_config.pk).update(
            config={'api_key': 'legacy-secret', 'from_email': 'sender@example.edu.ng'}
        )

        response = self.client.get(
            f'/api/notifications/settings/{self.active_config.id}/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['config']['api_key'], '********')
        self.assertNotContains(response, 'legacy-secret')

    def test_activate_action_deactivates_previous_configuration(self):
        smtp_config = EmailConfiguration.objects.create(
            backend_choice='smtp',
            is_active=False,
        )

        response = self.client.post(
            f'/api/notifications/settings/{smtp_config.id}/activate/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_active'])
        self.active_config.refresh_from_db()
        smtp_config.refresh_from_db()
        self.assertFalse(self.active_config.is_active)
        self.assertTrue(smtp_config.is_active)
        self.assertEqual(EmailConfiguration.objects.filter(is_active=True).count(), 1)

    def test_active_configuration_cannot_be_deleted(self):
        response = self.client.delete(
            f'/api/notifications/settings/{self.active_config.id}/'
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(EmailConfiguration.objects.filter(pk=self.active_config.pk).exists())

    def test_inactive_configuration_can_be_deleted(self):
        inactive = EmailConfiguration.objects.create(
            backend_choice='smtp',
            is_active=False,
        )

        response = self.client.delete(
            f'/api/notifications/settings/{inactive.id}/'
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(EmailConfiguration.objects.filter(pk=inactive.pk).exists())

    @patch.object(ConsoleEmailService, 'send_one', return_value=True)
    def test_test_action_sends_and_records_delivery(self, service_send_one):
        response = self.client.post(
            f'/api/notifications/settings/{self.active_config.id}/test/',
            {
                'recipient': 'recipient@example.edu.ng',
                'subject': 'Configuration test',
                'message': 'Delivery check',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        service_send_one.assert_called_once()
        log = NotificationLog.objects.get(recipient='recipient@example.edu.ng')
        self.assertEqual(log.status, 'sent')
        self.assertEqual(log.backend_used, 'console')
        self.assertIsNotNone(log.sent_at)

    @patch.object(
        ConsoleEmailService,
        'send_one',
        side_effect=NotificationException('provider unavailable'),
    )
    def test_test_action_returns_bad_gateway_and_records_failure(self, _service_send_one):
        response = self.client.post(
            f'/api/notifications/settings/{self.active_config.id}/test/',
            {'recipient': 'recipient@example.edu.ng'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        log = NotificationLog.objects.get(recipient='recipient@example.edu.ng')
        self.assertEqual(log.status, 'failed')
        self.assertEqual(log.error_message, 'provider unavailable')


class NotificationLogApiTests(APITestCase):
    def setUp(self):
        self.admin = PortalUser.objects.create(
            external_id='log-admin',
            full_name='Log Admin',
            roles=['SUPER_ADMIN'],
            is_staff=True,
        )
        self.staff = PortalUser.objects.create(
            external_id='log-staff',
            full_name='Log Staff',
            roles=['STAFF'],
            is_staff=True,
        )
        self.client.force_authenticate(self.admin)

        self.sent_log = NotificationLog.objects.create(
            recipient='alice@example.edu.ng',
            subject='Welcome Alice',
            body_text='Welcome to the LMS',
            status='sent',
            backend_used='resend',
            sent_at=timezone.now(),
        )
        self.failed_log = NotificationLog.objects.create(
            recipient='bob@example.edu.ng',
            subject='Assessment result',
            body_text='Your result is available',
            status='failed',
            backend_used='BrevoEmailService',
            error_message='Provider rejected the request',
        )
        self.old_log = NotificationLog.objects.create(
            recipient='archived@other.edu.ng',
            subject='Archived notice',
            body_text='Old message',
            status='sent',
            backend_used='smtp',
            sent_at=timezone.now() - timedelta(days=10),
        )
        NotificationLog.objects.filter(pk=self.old_log.pk).update(
            created_at=timezone.now() - timedelta(days=10)
        )

    def results(self, response):
        return response.data['results']

    def test_admin_can_list_and_retrieve_logs(self):
        response = self.client.get('/api/notifications/logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

        response = self.client.get(f'/api/notifications/logs/{self.failed_log.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['error_message'], 'Provider rejected the request')

    def test_logs_are_admin_only_and_read_only(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/notifications/logs/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.admin)
        response = self.client.post('/api/notifications/logs/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        response = self.client.delete(f'/api/notifications/logs/{self.sent_log.id}/')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_filters_logs_by_status_backend_recipient_and_search(self):
        response = self.client.get('/api/notifications/logs/?status=failed')
        self.assertEqual([row['id'] for row in self.results(response)], [str(self.failed_log.id)])

        response = self.client.get('/api/notifications/logs/?backend=brevo')
        self.assertEqual([row['id'] for row in self.results(response)], [str(self.failed_log.id)])

        response = self.client.get('/api/notifications/logs/?recipient=alice')
        self.assertEqual([row['id'] for row in self.results(response)], [str(self.sent_log.id)])

        response = self.client.get('/api/notifications/logs/?search=assessment')
        self.assertEqual([row['id'] for row in self.results(response)], [str(self.failed_log.id)])

    def test_filters_logs_by_date_range(self):
        today = timezone.localdate().isoformat()
        response = self.client.get(
            f'/api/notifications/logs/?date_from={today}&date_to={today}'
        )

        ids = {row['id'] for row in self.results(response)}
        self.assertEqual(ids, {str(self.sent_log.id), str(self.failed_log.id)})

    def test_rejects_invalid_filters(self):
        response = self.client.get('/api/notifications/logs/?status=unknown')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        tomorrow = (timezone.localdate() + timedelta(days=1)).isoformat()
        today = timezone.localdate().isoformat()
        response = self.client.get(
            f'/api/notifications/logs/?date_from={tomorrow}&date_to={today}'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EmailServiceRoutingTests(TestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_switching_active_configuration_replaces_cached_service(self):
        EmailConfiguration.objects.create(backend_choice='console', is_active=True)
        self.assertIsInstance(get_email_service(), ConsoleEmailService)

        EmailConfiguration.objects.create(backend_choice='smtp', is_active=True)
        self.assertIsInstance(get_email_service(), SMTPEmailService)

    def test_explicit_backend_never_returns_another_cached_backend(self):
        EmailConfiguration.objects.create(backend_choice='console', is_active=True)
        self.assertIsInstance(get_email_service(), ConsoleEmailService)
        self.assertIsInstance(get_email_service('smtp'), SMTPEmailService)

    def test_configuration_update_refreshes_cached_service(self):
        configuration = EmailConfiguration.objects.create(
            backend_choice='console',
            is_active=True,
            config={'from_email': 'first@example.edu.ng'},
        )
        first_service = get_email_service(configuration=configuration)

        configuration.config = {'from_email': 'second@example.edu.ng'}
        configuration.save()
        second_service = get_email_service(configuration=configuration)

        self.assertIsNot(first_service, second_service)
        self.assertEqual(second_service.from_email, 'second@example.edu.ng')

    def test_backend_configuration_mismatch_is_rejected(self):
        configuration = EmailConfiguration.objects.create(
            backend_choice='console',
            is_active=False,
        )

        with self.assertRaises(NotificationException):
            get_email_service(backend='smtp', configuration=configuration)

    def test_service_initialization_error_is_written_to_delivery_log(self):
        success = send_one(
            recipient='recipient@example.edu.ng',
            subject='Bad backend',
            message='This should fail',
            backend='unsupported',
        )

        self.assertFalse(success)
        log = NotificationLog.objects.get()
        self.assertEqual(log.status, 'failed')
        self.assertIn("Email backend 'unsupported' is not supported", log.error_message)

    def test_database_prevents_multiple_active_rows_when_save_hook_is_bypassed(self):
        configurations = [
            EmailConfiguration(backend_choice='console', is_active=True),
            EmailConfiguration(backend_choice='smtp', is_active=True),
        ]

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                EmailConfiguration.objects.bulk_create(configurations)


class InAppNotificationApiTests(APITestCase):
    def setUp(self):
        self.student = PortalUser.objects.create(
            external_id='student101',
            full_name='Jane Student',
            roles=['STUDENT'],
        )
        self.client.force_authenticate(self.student)

        from .models import InAppNotification, NotificationType
        self.notification1 = InAppNotification.objects.create(
            recipient=self.student,
            notification_type=NotificationType.ASSIGNMENT_POSTED,
            title='New Assignment Posted',
            message='Assignment 1 is now available.',
            is_read=False
        )
        self.notification2 = InAppNotification.objects.create(
            recipient=self.student,
            notification_type=NotificationType.DEADLINE_EXTENDED,
            title='Deadline Extended',
            message='Assignment 1 deadline extended.',
            is_read=False
        )

    def test_list_in_app_notifications(self):
        response = self.client.get('/api/notifications/in-app/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_unread_count(self):
        response = self.client.get('/api/notifications/in-app/unread-count/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 2)

    def test_mark_read(self):
        response = self.client.post(f'/api/notifications/in-app/{self.notification1.id}/mark-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)

    def test_mark_all_read(self):
        response = self.client.post('/api/notifications/in-app/mark-all-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.student.in_app_notifications.filter(is_read=False).count(),
            0
        )


class AssignmentNotificationSignalTests(TestCase):
    def setUp(self):
        from courses.models import CourseCache, StudentRegisteredCourse
        from assessment.models import Assignment

        self.staff = PortalUser.objects.create(
            external_id='staff202',
            full_name='Lecturer Smith',
            roles=['STAFF'],
        )
        self.student = PortalUser.objects.create(
            external_id='student202',
            full_name='Alice Student',
            roles=['STUDENT'],
        )
        self.course = CourseCache.objects.create(
            course_external_id=999,
            course_code='CSC401',
            course_title='Software Engineering'
        )
        StudentRegisteredCourse.objects.create(
            student_external=self.student,
            course=self.course,
            session='2025/2026',
            semester='FIRST'
        )

    def test_assignment_posted_signal_dispatches_notification(self):
        from assessment.models import Assignment
        from notifications.models import InAppNotification, NotificationType

        now = timezone.now()
        assignment = Assignment.objects.create(
            course=self.course,
            title='Project Architecture',
            created_by=self.staff,
            open_at=now,
            due_at=now + timedelta(days=7),
            is_published=True
        )

        notifications = InAppNotification.objects.filter(recipient=self.student)
        self.assertEqual(notifications.count(), 1)
        notif = notifications.first()
        self.assertEqual(notif.notification_type, NotificationType.ASSIGNMENT_POSTED)
        self.assertIn('Project Architecture', notif.title)

    def test_assignment_deadline_extended_signal_dispatches_notification(self):
        from assessment.models import Assignment
        from notifications.models import InAppNotification, NotificationType

        now = timezone.now()
        assignment = Assignment.objects.create(
            course=self.course,
            title='Final Project',
            created_by=self.staff,
            open_at=now,
            due_at=now + timedelta(days=5),
            is_published=True
        )

        InAppNotification.objects.all().delete()

        assignment.due_at = now + timedelta(days=10)
        assignment.save()

        notifications = InAppNotification.objects.filter(recipient=self.student)
        self.assertEqual(notifications.count(), 1)
        notif = notifications.first()
        self.assertEqual(notif.notification_type, NotificationType.DEADLINE_EXTENDED)
        self.assertIn('Deadline Extended', notif.title)


