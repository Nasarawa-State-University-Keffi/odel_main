from rest_framework import serializers
import re
from .models import AcademicSession, CourseCache, Semester, StaffAssignedCourse, StudentRegisteredCourse


class UniqueNameSerializer(serializers.ModelSerializer):
    def validate_name(self, value):
        value = value.strip()
        queryset = self.Meta.model.objects.filter(name__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('A record with this name already exists.')
        return value


class AcademicSessionSerializer(UniqueNameSerializer):
    def validate_name(self, value):
        value = value.strip()
        if re.fullmatch(r'\d{4}-\d{4}', value):
            value = value.replace('-', '/')
        return super().validate_name(value)

    class Meta:
        model = AcademicSession
        fields = ['id', 'name']


class SemesterSerializer(UniqueNameSerializer):
    def validate_name(self, value):
        value = ' '.join(value.replace('-', ' ').split())
        return super().validate_name(value)

    class Meta:
        model = Semester
        fields = ['id', 'name']


class CourseCacheSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCache
        fields = ['course_external_id', 'course_title', 'course_code', 'department_name', 'updated_at']


class StaffRegisteredCourseSerializer(serializers.ModelSerializer):
    course = CourseCacheSerializer(read_only=True)

    class Meta:
        model = StaffAssignedCourse
        fields = ['staff_external_id', 'course', 'programme_type_code', 'role', 'created_at']

class StudentRegisteredCourseSerializer(serializers.ModelSerializer):
    student_external_id = serializers.CharField(
        source='student_external.external_id',
        read_only=True,
    )
    course = CourseCacheSerializer(read_only=True)

    class Meta:
        model = StudentRegisteredCourse
        fields = ['student_external_id', 'course', 'session', 'semester']
