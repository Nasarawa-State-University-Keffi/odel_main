from rest_framework import serializers
from .models import CourseCache, EnrollmentCache


class CourseCacheSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCache
        fields = ['external_id', 'title', 'code', 'data', 'updated_at']


class EnrollmentCacheSerializer(serializers.ModelSerializer):
    course = CourseCacheSerializer(read_only=True)

    class Meta:
        model = EnrollmentCache
        fields = ['user_external_id', 'course', 'role', 'data', 'created_at']
