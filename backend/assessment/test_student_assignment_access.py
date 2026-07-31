from datetime import timedelta
from unittest.mock import patch

from django.db.models import ProtectedError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from courses.models import (
    AcademicSession,
    CourseCache,
    Semester,
    StudentRegisteredCourse,
)
from portal_auth.models import PortalUser

from .models import Assignment, AssignmentContent, AssignmentSubmission, Quiz


class StudentAssignmentAccessTests(TestCase):
    def setUp(self):
        self.student = PortalUser.objects.create(
            external_id='student-1',
            full_name='Student One',
            roles=['STUDENT'],
        )
        self.non_student = PortalUser.objects.create(
            external_id='staff-1',
            full_name='Staff One',
            roles=['STAFF'],
            is_staff=True,
        )
        AcademicSession.objects.create(name='2025/2026')
        AcademicSession.objects.create(name='2024/2025')
        Semester.objects.create(name='First Semester')

        self.current_course = self.create_course(101, 'CSC101', 'Current Course')
        self.past_course = self.create_course(102, 'CSC102', 'Past Course')
        self.other_course = self.create_course(103, 'CSC103', 'Other Course')
        self.current_enrollment = StudentRegisteredCourse.objects.create(
            student_external_id=self.student.external_id,
            course=self.current_course,
            session='2025/2026',
            semester='First Semester',
        )
        StudentRegisteredCourse.objects.create(
            student_external_id=self.student.external_id,
            course=self.past_course,
            session='2024/2025',
            semester='First Semester',
        )

        self.current_assignment = self.create_assignment(
            self.current_course, 'Current assignment'
        )
        self.past_assignment = self.create_assignment(
            self.past_course, 'Past assignment'
        )
        self.other_assignment = self.create_assignment(
            self.other_course, 'Other assignment'
        )
        self.unpublished_assignment = self.create_assignment(
            self.current_course,
            'Unpublished assignment',
            is_published=False,
        )
        AssignmentContent.objects.create(
            assignment=self.current_assignment,
            content_type='instruction',
            title='Published brief',
            storage_path='assignments/published.pdf',
            original_filename='published.pdf',
            is_published=True,
        )
        AssignmentContent.objects.create(
            assignment=self.current_assignment,
            content_type='instruction',
            title='Draft marking guide',
            storage_path='assignments/draft.pdf',
            original_filename='draft.pdf',
            is_published=False,
        )

        self.client = APIClient()
        self.client.force_authenticate(self.student)
        sync_patcher = patch(
            'assessment.apis.get_or_sync_student_registered_courses',
            side_effect=self.synced_enrollments,
        )
        self.sync_courses = sync_patcher.start()
        self.addCleanup(sync_patcher.stop)

    @staticmethod
    def create_course(external_id, code, title):
        return CourseCache.objects.create(
            course_external_id=external_id,
            course_code=code,
            course_title=title,
        )

    def create_assignment(self, course, title, *, is_published=True):
        now = timezone.now()
        return Assignment.objects.create(
            course=course,
            title=title,
            open_at=now - timedelta(hours=1),
            due_at=now + timedelta(days=1),
            close_at=now + timedelta(days=2),
            is_published=is_published,
            created_by=self.non_student,
        )

    def synced_enrollments(self, *, student_external_id, session, semester):
        return list(StudentRegisteredCourse.objects.filter(
            student_external_id=student_external_id,
            session=session,
            semester=semester,
        ))

    @property
    def current_period(self):
        return {'session': '2025/2026', 'semester': 'First Semester'}

    def test_assignment_list_requires_and_syncs_academic_period(self):
        missing_period = self.client.get('/api/student/assessment/assignments/')
        self.assertEqual(missing_period.status_code, 400)

        response = self.client.get(
            '/api/student/assessment/assignments/',
            self.current_period,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item['id'] for item in response.data['results']],
            [str(self.current_assignment.id)],
        )
        self.sync_courses.assert_called_once_with(
            student_external_id=self.student.external_id,
            session='2025/2026',
            semester='First Semester',
        )

    def test_student_only_receives_published_assignment_content(self):
        response = self.client.get(
            f'/api/student/assessment/assignments/{self.current_assignment.id}/',
            self.current_period,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item['title'] for item in response.data['content_files']],
            ['Published brief'],
        )

    def test_assignment_detail_is_limited_to_selected_period(self):
        response = self.client.get(
            f'/api/student/assessment/assignments/{self.past_assignment.id}/',
            self.current_period,
        )

        self.assertEqual(response.status_code, 404)

    def test_submission_creation_rejects_other_course_and_unpublished_assignments(self):
        for assignment in (self.other_assignment, self.unpublished_assignment):
            with self.subTest(assignment=assignment.title):
                response = self.client.post(
                    '/api/student/assessment/submissions/create/',
                    {
                        'assignment_id': str(assignment.id),
                        **self.current_period,
                    },
                    format='multipart',
                )
                self.assertEqual(response.status_code, 404)

        self.assertEqual(AssignmentSubmission.objects.count(), 0)

    def test_student_can_create_and_finalize_an_authorized_submission(self):
        create_response = self.client.post(
            '/api/student/assessment/submissions/create/',
            {
                'assignment_id': str(self.current_assignment.id),
                **self.current_period,
            },
            format='multipart',
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(
            create_response.data['student_external_id'],
            self.student.external_id,
        )
        submission = AssignmentSubmission.objects.get(id=create_response.data['id'])
        self.assertEqual(submission.student_external, self.student)

        submit_response = self.client.post(
            f'/api/student/assessment/submissions/{submission.id}/submit/',
            {'confirm': True, **self.current_period},
            format='json',
        )
        self.assertEqual(submit_response.status_code, 200)
        submission.refresh_from_db()
        self.assertEqual(submission.status, 'submitted')

    def test_finalization_rechecks_deadline_and_current_enrollment(self):
        submission = AssignmentSubmission.objects.create(
            assignment=self.current_assignment,
            student_external_id=self.student.external_id,
            attempt_number=1,
        )
        self.current_assignment.due_at = timezone.now() - timedelta(minutes=1)
        self.current_assignment.save(update_fields=['due_at'])

        late_response = self.client.post(
            f'/api/student/assessment/submissions/{submission.id}/submit/',
            {'confirm': True, **self.current_period},
            format='json',
        )
        self.assertEqual(late_response.status_code, 400)

        past_submission = AssignmentSubmission.objects.create(
            assignment=self.past_assignment,
            student_external_id=self.student.external_id,
            attempt_number=1,
        )
        wrong_period_response = self.client.post(
            f'/api/student/assessment/submissions/{past_submission.id}/submit/',
            {'confirm': True, **self.current_period},
            format='json',
        )
        self.assertEqual(wrong_period_response.status_code, 403)

    def test_non_student_role_cannot_use_student_assignment_api(self):
        self.client.force_authenticate(self.non_student)
        response = self.client.get(
            '/api/student/assessment/assignments/',
            self.current_period,
        )
        self.assertEqual(response.status_code, 403)

    def test_student_relationships_are_database_protected(self):
        AssignmentSubmission.objects.create(
            assignment=self.current_assignment,
            student_external_id=self.student.external_id,
            attempt_number=1,
        )

        with self.assertRaises(ProtectedError):
            self.student.delete()

    def test_quiz_start_is_limited_to_current_registered_courses(self):
        current_quiz = Quiz.objects.create(
            course=self.current_course,
            name='Current quiz',
        )
        other_quiz = Quiz.objects.create(
            course=self.other_course,
            name='Other quiz',
        )

        allowed = self.client.post(
            f'/api/student/assessment/quizzes/{current_quiz.id}/start/',
            self.current_period,
            format='json',
        )
        denied = self.client.post(
            f'/api/student/assessment/quizzes/{other_quiz.id}/start/',
            self.current_period,
            format='json',
        )

        self.assertEqual(allowed.status_code, 201)
        self.assertEqual(denied.status_code, 404)
