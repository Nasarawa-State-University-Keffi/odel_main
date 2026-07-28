from rest_framework.exceptions import APIException


class PortalLMSUnavailable(APIException):
    status_code = 502
    default_detail = 'The portal LMS service could not complete the request.'
    default_code = 'portal_lms_unavailable'
