from rest_framework import serializers
from .models import StudyCategory, DegreeType, Programme


class StudyCategorySerializer(serializers.ModelSerializer):
    """Serializer for StudyCategory model"""
    degree_type_count = serializers.SerializerMethodField()
    
    class Meta:
        model = StudyCategory
        fields = '__all__'
    
    def get_degree_type_count(self, obj):
        return obj.degree_types.count()


class DegreeTypeSerializer(serializers.ModelSerializer):
    """Serializer for DegreeType model"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_code = serializers.CharField(source='category.code', read_only=True)
    programme_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DegreeType
        fields = '__all__'
    
    def get_programme_count(self, obj):
        return obj.programmes.count()


class ProgrammeSerializer(serializers.ModelSerializer):
    """Serializer for Programme model"""
    degree_type_code = serializers.CharField(source='degree_type.code', read_only=True)
    degree_type_name = serializers.CharField(source='degree_type.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    faculty_name = serializers.CharField(source='department.faculty.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Programme
        fields = '__all__'
