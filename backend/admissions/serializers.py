from rest_framework import serializers
from users.models import Applicant
from .models import Application, ExamResult, ExamSubject
from users.serializers import ApplicantSerializer
from programmes.serializers import ProgrammeSerializer
from core.logging import get_logger

logger = get_logger(__name__)


class ExamSubjectSerializer(serializers.ModelSerializer):
    """Serializer for ExamSubject - nested in ExamResult"""
    
    class Meta:
        model = ExamSubject
        fields = ('id', 'subject', 'grade', 'created_at')
        read_only_fields = ('id', 'created_at')


class ExamResultSerializer(serializers.ModelSerializer):
    """Serializer for ExamResult - nested in Application"""
    exam_subjects = ExamSubjectSerializer(many=True, required=False)
    
    class Meta:
        model = ExamResult
        fields = (
            'id', 'exam_type', 'exam_year', 'exam_number', 
            'scratch_card_pin', 'sitting_number', 'exam_subjects',
            'is_verified', 'verification_status', 'verified_at',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'is_verified', 'verification_status', 
            'verified_at', 'created_at', 'updated_at'
        )
    
    def create(self, validated_data):
        """Create exam result with nested subjects"""
        subjects_data = validated_data.pop('exam_subjects', [])
        exam_result = ExamResult.objects.create(**validated_data)
        
        # Create subjects
        for subject_data in subjects_data:
            ExamSubject.objects.create(exam_result=exam_result, **subject_data)
        
        logger.info(
            f"Created ExamResult {exam_result.id} with "
            f"{len(subjects_data)} subjects"
        )
        return exam_result
    
    def update(self, instance, validated_data):
        """Update exam result and nested subjects"""
        subjects_data = validated_data.pop('exam_subjects', None)
        
        # Update exam result fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update subjects if provided
        if subjects_data is not None:
            # Delete existing subjects
            instance.exam_subjects.all().delete()
            
            # Create new subjects
            for subject_data in subjects_data:
                ExamSubject.objects.create(
                    exam_result=instance, 
                    **subject_data
                )
            
            logger.info(
                f"Updated ExamResult {instance.id} with "
                f"{len(subjects_data)} subjects"
            )
        
        return instance


class ApplicationSerializer(serializers.ModelSerializer):
    """
    Main Application serializer with nested exam results and subjects
    Supports create/update of entire application tree in one request
    """
    exam_results = ExamResultSerializer(many=True, required=False)
    applicant = ApplicantSerializer(read_only=True)
    programme_details = ProgrammeSerializer(source='programme', read_only=True)
    is_complete_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = (
            'id', 'application_id', 'is_active', 'applicant', 'session', 
            'programme', 'programme_details', 'mode_of_entry', 'sitting_type', 
            'status', 'exam_results', 'is_complete_status', 'created_at', 
            'updated_at', 'submitted_at'
        )
        read_only_fields = (
            'id', 'application_id', 'is_active', 'applicant', 'status', 
            'created_at', 'updated_at', 'submitted_at'
        )
    
    def get_is_complete_status(self, obj):
        """Get application completeness status"""
        is_valid, errors = obj.is_complete()
        return {
            'is_complete': is_valid,
            'errors': errors
        }
    
    def create(self, validated_data):
        """Create application with nested exam results and subjects"""
        exam_results_data = validated_data.pop('exam_results', [])
        
        application = Application.objects.create(**validated_data)
        
        # Create exam results with subjects
        for result_data in exam_results_data:
            subjects_data = result_data.pop('exam_subjects', [])
            exam_result = ExamResult.objects.create(
                application=application,
                **result_data
            )
            
            # Create subjects for this result
            for subject_data in subjects_data:
                ExamSubject.objects.create(
                    exam_result=exam_result,
                    **subject_data
                )
        
        logger.info(
            f"Created Application {application.id} for "
            f"{application.applicant.applicant_id}"
        )
        return application
    
    def update(self, instance, validated_data):
        """Update application with nested exam results and subjects"""
        exam_results_data = validated_data.pop('exam_results', None)
        
        # Update application fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update exam results if provided
        if exam_results_data is not None:
            # Delete existing results and subjects
            instance.exam_results.all().delete()
            
            # Create new results with subjects
            for result_data in exam_results_data:
                subjects_data = result_data.pop('exam_subjects', [])
                exam_result = ExamResult.objects.create(
                    application=instance,
                    **result_data
                )
                
                # Create subjects for this result
                for subject_data in subjects_data:
                    ExamSubject.objects.create(
                        exam_result=exam_result,
                        **subject_data
                    )
            
            logger.info(
                f"Updated Application {instance.id} with "
                f"{len(exam_results_data)} exam results"
            )
        
        return instance


class ApplicationPreviewSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for application preview
    Shows complete nested structure before submission
    """
    exam_results = ExamResultSerializer(many=True, read_only=True)
    applicant = ApplicantSerializer(read_only=True)
    programme_details = ProgrammeSerializer(source='programme', read_only=True)
    is_complete_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = '__all__'
    
    def get_is_complete_status(self, obj):
        """Get application completeness status with detailed errors"""
        is_valid, errors = obj.is_complete()
        return {
            'is_complete': is_valid,
            'errors': errors,
            'can_submit': is_valid and obj.status == 'draft'
        }


# Legacy serializers for backward compatibility
class UpdateApplicationSerializer(serializers.ModelSerializer):
    """Serializer for applicants to update their application details"""
    class Meta:
        model = Applicant
        fields = ('phone', 'address', 'programme_choice')
        
    def validate_programme_choice(self, value):
        """Validate programme choice exists in database"""
        from programmes.models import Programme
        
        if not value or not value.strip():
            raise serializers.ValidationError("Programme choice cannot be empty")
        
        value = value.strip()
        
        # Check if programme exists by name (case-insensitive)
        if not Programme.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError(
                f"Programme '{value}' does not exist. Please select a valid programme."
            )
        
        return value


class ApplicationStatusSerializer(serializers.ModelSerializer):
    """Simple serializer for checking application status"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Applicant
        fields = ('applicant_id', 'username', 'email', 'full_name', 'status', 'programme_choice')
        read_only_fields = ('applicant_id', 'status')
        
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
