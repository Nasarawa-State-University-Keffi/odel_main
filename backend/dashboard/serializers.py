from rest_framework import serializers

from courses.models import CourseCache
from assessment.models import Assignment, Quiz



class CourseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCache
        fields = ["id", "course_code", "course_title"]

class QuizSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ["id", "name", "time_close"]

class AssignmentSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ["id", "title", "due_at"]