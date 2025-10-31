from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Create core groups and optionally assign model permissions'

    def add_arguments(self, parser):
        parser.add_argument('--assign-default-perms', action='store_true', help='Assign default model permissions to groups when available')

    def handle(self, *args, **options):
        from django.contrib.auth.models import Group, Permission
        from django.contrib.contenttypes.models import ContentType
        from django.db import transaction

        groups = {
            'Applicants': [],
            'Students': [],
            'Staff': [],
            'Admission Officers': [],
        }

        created = []
        for name in groups.keys():
            grp, _ = Group.objects.get_or_create(name=name)
            created.append(name)

        self.stdout.write(self.style.SUCCESS(f'Created/ensured groups: {", ".join(created)}'))

        if options.get('assign_default_perms'):
            # Attempt to add common model permissions if they exist
            model_perms_map = {
                'applicant': ('Applicants', ['add_applicant', 'change_applicant', 'delete_applicant', 'view_applicant']),
                'student': ('Students', ['add_student', 'change_student', 'delete_student', 'view_student']),
                'staff': ('Staff', ['add_staff', 'change_staff', 'delete_staff', 'view_staff']),
            }
            assigned = []
            with transaction.atomic():
                for model_label, (group_name, codenames) in model_perms_map.items():
                    try:
                        # ContentType lookup by model name lowercased in this app
                        ct = ContentType.objects.get(app_label='users', model=model_label)
                    except ContentType.DoesNotExist:
                        continue
                    for code in codenames:
                        try:
                            perm = Permission.objects.get(content_type=ct, codename=code)
                        except Permission.DoesNotExist:
                            continue
                        grp = Group.objects.get(name=group_name)
                        grp.permissions.add(perm)
                        assigned.append(f'{code} -> {group_name}')

            if assigned:
                self.stdout.write(self.style.SUCCESS('Assigned permissions:'))
                for a in assigned:
                    self.stdout.write(f' - {a}')
            else:
                self.stdout.write('No model permissions found to assign (run after migrations).')

        self.stdout.write(self.style.SUCCESS('create_groups complete.'))
