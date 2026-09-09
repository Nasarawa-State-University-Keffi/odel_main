from rest_framework import serializers

from courses.models import CourseCache, StaffAssignedCourse
from assessment.models import Assignment, AssignmentSubmission, Quiz, QuizAttempt
from learning_resources.content.models import ContentAccessLog, LearningContent



class CourseSummarySerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()

    class Meta:
        model = CourseCache
        fields = ["course_external_id", "course_code", "course_title", "progress"]

    def get_progress(self, course):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'external_id', None):
            return 0

        content_ids = LearningContent.objects.filter(
            course=course,
            is_published=True,
        ).values_list('id', flat=True)
        assignment_ids = Assignment.objects.filter(
            course=course,
            is_published=True,
        ).values_list('id', flat=True)
        quiz_ids = Quiz.objects.filter(course=course).values_list('id', flat=True)

        total = content_ids.count() + assignment_ids.count() + quiz_ids.count()
        if total == 0:
            return 0

        completed_content = ContentAccessLog.objects.filter(
            content_id__in=content_ids,
            user=user,
        ).values('content_id').distinct().count()
        completed_assignments = AssignmentSubmission.objects.filter(
            assignment_id__in=assignment_ids,
            student_external_id=user.external_id,
            status__in=['submitted', 'graded'],
        ).values('assignment_id').distinct().count()
        completed_quizzes = QuizAttempt.objects.filter(
            quiz_id__in=quiz_ids,
            user_external_id=user.external_id,
            state='finished',
        ).values('quiz_id').distinct().count()

        return round(
            ((completed_content + completed_assignments + completed_quizzes) / total) * 100
        )


class TeachingAssignmentSummarySerializer(serializers.ModelSerializer):
    offering_id = serializers.IntegerField(source='course_offering_id', read_only=True)
    course_external_id = serializers.IntegerField(source='course.course_external_id', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    course_title = serializers.CharField(source='course.course_title', read_only=True)
    session = serializers.CharField(source='course_offering.session.name', read_only=True)
    semester = serializers.CharField(source='course_offering.semester.name', read_only=True)

    class Meta:
        model = StaffAssignedCourse
        fields = [
            'offering_id', 'course_external_id', 'course_code', 'course_title',
            'programme_type_code', 'session', 'semester', 'role',
        ]

class QuizSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ["id", "name", "time_close"]

class AssignmentSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ["id", "title", "due_at"]
