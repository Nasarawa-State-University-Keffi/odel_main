from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from .models import Applicant, Student, Staff
from core.logging import get_logger

User = get_user_model()
logger = get_logger(__name__)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'middle_name', 'last_name', 
                  'full_name', 'phone', 'gender', 'country', 'state', 'role', 'is_email_verified')
        
    def get_full_name(self, obj):
        parts = [obj.first_name, obj.middle_name, obj.last_name]
        return ' '.join([p for p in parts if p]).strip() or obj.username


class RegisterApplicantSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True, max_length=150)
    middle_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=True, max_length=20)
    gender = serializers.ChoiceField(choices=['M', 'F', 'O'], required=True)
    country = serializers.CharField(required=True, max_length=100)
    state = serializers.CharField(required=True, max_length=100)
    programme_choice = serializers.CharField(required=True, max_length=128, source='course')
    mode_of_entry = serializers.ChoiceField(choices=['100', '200', '300'], required=True, help_text='Entry level (100, 200, or 300)')
    password1 = serializers.CharField(write_only=True, required=True, min_length=8)
    password2 = serializers.CharField(write_only=True, required=True, min_length=8)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            logger.warning(f"Registration attempted with existing email: {value}")
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def validate_programme_choice(self, value):
        """Validate that the programme exists in the database"""
        from programmes.models import Programme
        
        # Check if programme exists by name (case-sensitive)
        if not Programme.objects.filter(name__exact=value).exists():
            logger.warning(f"Registration attempted with non-existent programme: {value}")
            raise serializers.ValidationError(
                f"Programme '{value}' does not exist. Please select a valid programme."
            )
        return value
    
    def validate(self, data):
        if data['password1'] != data['password2']:
            logger.warning("Registration attempted with mismatched passwords")
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return data

    def create(self, validated_data):
        from django.db import transaction
        from core.utils import get_setting
        from users.utils import generate_verification_token
        from users.models import EmailVerificationToken
        from users.emails import send_verification_email
        
        # Remove password2 and extract course and mode_of_entry
        validated_data.pop('password2')
        password = validated_data.pop('password1')
        course = validated_data.pop('course')
        mode_of_entry = validated_data.pop('mode_of_entry')
        
        # Use atomic transaction to ensure all-or-nothing operation
        try:
            with transaction.atomic():
                # Create user (set username = email since AbstractUser requires it)
                user = User.objects.create(
                    username=validated_data['email'],  # Use email as username
                    email=validated_data['email'],
                    first_name=validated_data['first_name'],
                    middle_name=validated_data.get('middle_name', ''),
                    last_name=validated_data['last_name'],
                    phone=validated_data['phone'],
                    gender=validated_data['gender'],
                    country=validated_data['country'],
                    state=validated_data['state'],
                    role='applicant',
                    is_active=True  # Always active, but check is_email_verified separately
                )
                user.set_password(password)
                
                # Handle email verification (from database setting)
                require_verification = get_setting('REQUIRE_EMAIL_VERIFICATION', default=True)
                if require_verification:
                    user.is_email_verified = False
                    user.save()
                    # Create verification token
                    token_value = generate_verification_token()
                    EmailVerificationToken.objects.create(user=user, token=token_value)
                else:
                    user.is_email_verified = True
                    user.save()
                
                # Create applicant profile with course and mode_of_entry
                Applicant.objects.create(user=user, programme_choice=course, mode_of_entry=mode_of_entry)
                
                # Add to Applicants group for RBAC
                try:
                    from django.contrib.auth.models import Group
                    grp, _ = Group.objects.get_or_create(name='Applicants')
                    user.groups.add(grp)
                except Exception as e:
                    logger.warning(f"Failed to add user {user.email} to Applicants group: {e}")
                    # Don't fail the transaction for group assignment issues
                
                logger.info(f"User account and applicant profile created successfully for {user.email}")
                
        except Exception as e:
            logger.error(f"Failed to create user account: {e}")
            raise
        
        # Send verification email AFTER transaction commits successfully
        # Email sending should not cause rollback
        if require_verification and not user.is_email_verified:
            email_sent = send_verification_email(user, token_value)
            # Store email sent status on user object for view access
            logger.info(f"Verification email {'sent successfully' if email_sent else 'failed to send'} for {user.email}")
            
        return user


class RegisterStaffSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=[r[0] for r in Staff.ROLE])

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            role='staff'
        )
        user.set_password(validated_data['password'])
        user.save()
        Staff.objects.create(user=user, role=validated_data['role'])
        # add to Staff group and specific admission officer group if applicable
        try:
            staff_grp, _ = Group.objects.get_or_create(name='Staff')
            user.groups.add(staff_grp)
            if validated_data.get('role') == 'admission_officer':
                ao_grp, _ = Group.objects.get_or_create(name='Admission Officers')
                user.groups.add(ao_grp)
        except Exception:
            pass
        return user


class ApplicantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Applicant
        fields = ('applicant_id', 'user', 'programme_choice', 'mode_of_entry', 'status', 'created_at', 'updated_at')


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Student
        fields = ('matric_no', 'user', 'programme')


class StaffSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Staff
        fields = ('user', 'role')
