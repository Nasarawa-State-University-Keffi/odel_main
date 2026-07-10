from rest_framework import serializers

from .models import Department, Faculty, Programme, ProgrammeType


class ProgrammeTypeSerializer(serializers.ModelSerializer):
    upStreamId = serializers.IntegerField(source='up_stream_id', read_only=True)

    class Meta:
        model = ProgrammeType
        fields = ['id', 'upStreamId', 'name', 'code', 'last_synced_at']


class FacultySerializer(serializers.ModelSerializer):
    upStreamId = serializers.IntegerField(source='up_stream_id', read_only=True)

    class Meta:
        model = Faculty
        fields = ['id', 'upStreamId', 'name', 'code', 'last_synced_at']


class DepartmentSerializer(serializers.ModelSerializer):
    upStreamId = serializers.IntegerField(source='up_stream_id', read_only=True)
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'upStreamId', 'name', 'code', 'faculty', 'faculty_name', 'last_synced_at']


class ProgrammeSerializer(serializers.ModelSerializer):
    upStreamId = serializers.IntegerField(source='up_stream_id', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    programme_type_name = serializers.CharField(source='programme_type.name', read_only=True)

    class Meta:
        model = Programme
        fields = [
            'id', 'upStreamId', 'name', 'code', 'department',
            'department_name', 'programme_type', 'programme_type_name', 'last_synced_at',
        ]
