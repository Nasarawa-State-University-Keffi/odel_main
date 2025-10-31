from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from .models import Applicant, Student, Staff

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role')


class RegisterApplicantSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            role='applicant'
        )
        user.set_password(validated_data['password'])
        user.save()
        Applicant.objects.create(user=user)
        # add to Applicants group for RBAC
        try:
            grp, _ = Group.objects.get_or_create(name='Applicants')
            user.groups.add(grp)
        except Exception:
            pass
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
        fields = ('applicant_id', 'user', 'phone', 'address', 'programme_choice', 'status')


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
