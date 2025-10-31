import csv
from io import StringIO
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from users.models import Applicant, Student
from backend.utils import api_response
from users.permissions import IsAdmissionOfficer
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

User = get_user_model()


class DownloadApplicantsCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmissionOfficer]
    @extend_schema(
        responses={200: OpenApiResponse(description='CSV file of applicants', response=OpenApiTypes.BINARY)},
    )
    def get(self, request):
        applicants = Applicant.objects.all()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['applicant_id', 'username', 'email', 'phone', 'programme_choice', 'status'])
        for a in applicants:
            writer.writerow([a.applicant_id, a.user.username, a.user.email, a.phone, a.programme_choice, a.status])
        resp = HttpResponse(output.getvalue(), content_type='text/csv')
        resp['Content-Disposition'] = 'attachment; filename="applicants.csv"'
        return resp


class UploadAdmittedCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmissionOfficer]
    @extend_schema(
        request={"multipart/form-data": {
            "type": "object",
            "properties": {"file": {"type": "string", "format": "binary"}}
        }},
        responses={200: OpenApiResponse(description='Upload results')},
        examples=[OpenApiExample('Upload example', value={"file": "applicants.csv"}, request_only=True)],
    )
    def post(self, request):
        f = request.FILES.get('file')
        if not f:
            return Response(api_response('error', 'No file uploaded'), status=status.HTTP_400_BAD_REQUEST)
        decoded = f.read().decode('utf-8')
        reader = csv.DictReader(StringIO(decoded))
        updated = 0
        created_students = 0
        for row in reader:
            # Expect at least applicant_id and matric_no and programme
            aid = row.get('applicant_id') or row.get('applicant') or row.get('id')
            matric = row.get('matric_no') or row.get('matric')
            programme = row.get('programme') or row.get('programme_choice')
            try:
                applicant = Applicant.objects.get(applicant_id=aid)
            except Applicant.DoesNotExist:
                continue
            applicant.status = 'admitted'
            applicant.save()
            # mark user role via groups
            user = applicant.user
            try:
                from django.contrib.auth.models import Group
                students_grp, _ = Group.objects.get_or_create(name='Students')
                user.groups.add(students_grp)
            except Exception:
                pass
            user.role = 'student'
            user.save()
            # create student record if matric provided
            if matric and programme:
                Student.objects.update_or_create(user=user, defaults={'matric_no': matric, 'programme': programme})
                created_students += 1
            updated += 1
        return Response(api_response('success', f'Updated {updated} applicants; created {created_students} students'))
