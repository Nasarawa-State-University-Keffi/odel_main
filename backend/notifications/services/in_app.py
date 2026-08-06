import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from courses.models import StudentRegisteredCourse
from notifications.models import InAppNotification, NotificationType

logger = logging.getLogger(__name__)

def dispatch_assignment_posted_sync(assignment):
    """
    Synchronously creates InAppNotification records in DB for all enrolled students
    and pushes real-time WebSocket messages to connected online users.
    """
    enrolled_students = StudentRegisteredCourse.objects.filter(
        course=assignment.course
    ).select_related('student_external')

    notifications = []
    student_map = []  # tuple of (student_user, notification_dict) for websocket push

    formatted_due_at = assignment.due_at.strftime('%b %d, %Y at %I:%M %p')
    title = f"New Assignment: {assignment.title}"
    message = f"A new assignment has been posted for {assignment.course.course_code}. Due on {formatted_due_at}."
    action_url = f"/student/assignments/{assignment.id}/"

    for enrollment in enrolled_students:
        student_user = enrollment.student_external
        notification = InAppNotification(
            recipient=student_user,
            notification_type=NotificationType.ASSIGNMENT_POSTED,
            title=title,
            message=message,
            assignment_id=assignment.id,
            course_id=assignment.course.id,
            action_url=action_url,
        )
        notifications.append(notification)
        student_map.append((student_user, {
            'notification_type': NotificationType.ASSIGNMENT_POSTED,
            'title': title,
            'message': message,
            'assignment_id': str(assignment.id),
            'course_id': assignment.course.id,
            'action_url': action_url,
        }))

    if notifications:
        created_notifications = InAppNotification.objects.bulk_create(notifications, batch_size=500)
        
        # Attach created UUIDs to websocket payload
        for i, (student_user, payload) in enumerate(student_map):
            if i < len(created_notifications):
                payload['id'] = str(created_notifications[i].id)
                payload['created_at'] = created_notifications[i].created_at.isoformat()
                payload['is_read'] = False

            _broadcast_websocket_notification(student_user.external_id, payload)

    return len(notifications)


def dispatch_deadline_extended_sync(assignment, old_due_at=None):
    """
    Synchronously creates InAppNotification records in DB for all enrolled students
    and pushes real-time WebSocket messages to connected online users when a deadline is extended.
    """
    enrolled_students = StudentRegisteredCourse.objects.filter(
        course=assignment.course
    ).select_related('student_external')

    notifications = []
    student_map = []

    formatted_due_at = assignment.due_at.strftime('%b %d, %Y at %I:%M %p')
    title = f"Deadline Extended: {assignment.title}"
    message = f"The deadline for '{assignment.title}' ({assignment.course.course_code}) has been extended to {formatted_due_at}."
    action_url = f"/student/assignments/{assignment.id}/"

    for enrollment in enrolled_students:
        student_user = enrollment.student_external
        notification = InAppNotification(
            recipient=student_user,
            notification_type=NotificationType.DEADLINE_EXTENDED,
            title=title,
            message=message,
            assignment_id=assignment.id,
            course_id=assignment.course.id,
            action_url=action_url,
        )
        notifications.append(notification)
        student_map.append((student_user, {
            'notification_type': NotificationType.DEADLINE_EXTENDED,
            'title': title,
            'message': message,
            'assignment_id': str(assignment.id),
            'course_id': assignment.course.id,
            'action_url': action_url,
        }))

    if notifications:
        created_notifications = InAppNotification.objects.bulk_create(notifications, batch_size=500)

        for i, (student_user, payload) in enumerate(student_map):
            if i < len(created_notifications):
                payload['id'] = str(created_notifications[i].id)
                payload['created_at'] = created_notifications[i].created_at.isoformat()
                payload['is_read'] = False

            _broadcast_websocket_notification(student_user.external_id, payload)

    return len(notifications)


def _broadcast_websocket_notification(user_external_id, payload):
    """
    Safely pushes payload to user's WebSocket channel group.
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer is not None:
            group_name = f"user_{user_external_id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'send_notification',
                    'notification': payload
                }
            )
    except Exception as e:
        logger.warning(f"WebSocket broadcast failed for user {user_external_id}: {e}")
