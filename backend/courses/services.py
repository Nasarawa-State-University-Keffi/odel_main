import logging

from rest_framework.exceptions import ValidationError

from portal_auth.services import normalize_semester_name, normalize_session_name

from .models import AcademicSession, Semester


logger = logging.getLogger(__name__)


def resolve_academic_period(session_name: str, semester_name: str) -> tuple[str, str]:
    """Resolve user-supplied academic period names to their canonical values."""
    normalized_session = normalize_session_name(session_name)
    normalized_semester = normalize_semester_name(semester_name)
    logger.info(
        "Resolving academic period session=%r normalized_session=%r "
        "semester=%r normalized_semester=%r",
        session_name,
        normalized_session,
        semester_name,
        normalized_semester,
    )

    session = AcademicSession.objects.filter(name__iexact=normalized_session).first()
    semester = Semester.objects.filter(name__iexact=normalized_semester).first()

    errors = {}
    if not session:
        errors["session"] = "Unknown academic session"
    if not semester:
        errors["semester"] = "Unknown semester"
    if errors:
        logger.warning(
            "Academic period validation failed session=%r semester=%r errors=%s",
            normalized_session,
            normalized_semester,
            errors,
        )
        raise ValidationError(errors)

    logger.info(
        "Academic period resolved session=%r semester=%r",
        session.name,
        semester.name,
    )
    return session.name, semester.name
