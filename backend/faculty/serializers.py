from rest_framework import serializers
from .models import Faculty, Department


class FacultySerializer(serializers.ModelSerializer):
    """Serializer for Faculty model"""
    department_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Faculty
        fields = '__all__'
    
    def get_department_count(self, obj):
        return obj.departments.count()


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model"""
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)
    
    class Meta:
        model = Department
        fields = '__all__'
