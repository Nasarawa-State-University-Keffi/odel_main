import logging

from django.db import transaction

from .client import UpstreamSynchronizationClient
from .models import Department, Faculty, Programme, ProgrammeType

logger = logging.getLogger(__name__)


def _required(item, field):
    value = item.get(field)
    if value in (None, ''):
        raise ValueError(f'Upstream record is missing {field}')
    return value


def sync_programme_types(client):
    count = 0
    with transaction.atomic():
        for item in client.programme_types():
            ProgrammeType.objects.update_or_create(
                up_stream_id=_required(item, 'id'),
                defaults={'name': _required(item, 'name'), 'code': _required(item, 'code')},
            )
            count += 1
    return count


def sync_faculties(client):
    count = 0
    with transaction.atomic():
        for item in client.faculties():
            Faculty.objects.update_or_create(
                up_stream_id=_required(item, 'id'),
                defaults={'name': _required(item, 'name'), 'code': _required(item, 'code')},
            )
            count += 1
    return count


def sync_departments(client):
    count = skipped = 0
    with transaction.atomic():
        for item in client.departments():
            faculty_name = (item.get('faculty') or {}).get('name')
            faculty = Faculty.objects.filter(name=faculty_name).first()
            if not faculty:
                logger.warning('Skipping department %s: faculty %r not found', item.get('id'), faculty_name)
                skipped += 1
                continue
            Department.objects.update_or_create(
                up_stream_id=_required(item, 'id'),
                defaults={
                    'name': _required(item, 'name'),
                    'code': _required(item, 'code'),
                    'faculty': faculty,
                },
            )
            count += 1
    return count, skipped


def sync_programmes(client):
    count = skipped = 0
    for programme_type in ProgrammeType.objects.all():
        with transaction.atomic():
            for item in client.programmes(programme_type.code):
                department = Department.objects.filter(code=item.get('department')).first()
                if not department:
                    logger.warning('Skipping programme %s: department %r not found', item.get('id'), item.get('department'))
                    skipped += 1
                    continue
                Programme.objects.update_or_create(
                    up_stream_id=_required(item, 'id'),
                    defaults={
                        'name': _required(item, 'name'),
                        'code': _required(item, 'code'),
                        'department': department,
                        'programme_type': programme_type,
                    },
                )
                count += 1
    return count, skipped


def sync_all():
    client = UpstreamSynchronizationClient()
    programme_types = sync_programme_types(client)
    faculties = sync_faculties(client)
    departments, skipped_departments = sync_departments(client)
    programmes, skipped_programmes = sync_programmes(client)
    return {
        'programme_types': programme_types,
        'faculties': faculties,
        'departments': departments,
        'programmes': programmes,
        'skipped_departments': skipped_departments,
        'skipped_programmes': skipped_programmes,
    }
