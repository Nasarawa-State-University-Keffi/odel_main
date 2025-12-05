from rest_framework import serializers
from .models import (
    CourseCache, EnrollmentCache, Classroom, Session, Resource, Assignment, Submission,
)


class CourseCacheSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCache
        fields = ['external_id', 'title', 'code', 'data', 'updated_at']


class EnrollmentCacheSerializer(serializers.ModelSerializer):
    course = CourseCacheSerializer(read_only=True)

    class Meta:
        model = EnrollmentCache
        fields = ['user_external_id', 'course', 'role', 'data', 'created_at']


class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ['id', 'course', 'title', 'description', 'created_by', 'created_at']


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'classroom', 'title', 'start_time', 'end_time', 'status', 'live_provider', 'external_meeting_id', 'join_url', 'created_at']
        read_only_fields = ['status', 'external_meeting_id', 'join_url', 'created_at']


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'classroom', 'title', 'file', 'uploaded_by', 'is_public', 'created_at']


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'classroom', 'title', 'description', 'due_at', 'created_by', 'created_at']
        read_only_fields = ['created_at']


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student_external_id', 'file', 'marks', 'feedback', 'created_at', 'graded_at']
        read_only_fields = ['created_at', 'graded_at']
