from rest_framework import serializers
from .models import CourseCache, StaffAssignedCourse, StudentRegisteredCourse


class CourseCacheSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCache
        fields = ['course_external_id', 'course_title', 'course_code', 'department_name', 'updated_at']


class StaffRegisteredCourseSerializer(serializers.ModelSerializer):
    course = CourseCacheSerializer(read_only=True)

    class Meta:
        model = StaffAssignedCourse
        fields = ['staff_external_id', 'course', 'role', 'created_at']

class StudentRegisteredCourseSerializer(serializers.ModelSerializer):
    course = CourseCacheSerializer(read_only=True)

    class Meta:
        model = StudentRegisteredCourse
        fields = ['student_external_id', 'course', 'session_id', 'semester_id']
