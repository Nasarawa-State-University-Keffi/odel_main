"""
Utility functions for the admissions app
"""
from django.utils import timezone
from core.logging import get_logger
import random

logger = get_logger(__name__)


def verify_exam_result(exam_result):
    """
    Placeholder function for 3rd-party exam verification
    
    In production, this would call WAEC/NECO API to verify:
    - Exam number exists
    - Grades match records
    - Scratch card PIN is valid
    
    Args:
        exam_result: ExamResult instance
        
    Returns:
        tuple: (is_verified: bool, status_message: str)
    """
    logger.info(
        f"Starting verification for {exam_result.exam_type} "
        f"{exam_result.exam_number}"
    )
    
    # Simulate API call delay
    # In production, replace with actual API call:
    # response = requests.post(
    #     WAEC_API_URL,
    #     data={
    #         'exam_number': exam_result.exam_number,
    #         'exam_year': exam_result.exam_year,
    #         'scratch_card_pin': exam_result.scratch_card_pin
    #     }
    # )
    
    # Simulate verification result (80% success rate for testing)
    is_verified = random.random() < 0.8
    
    if is_verified:
        status_message = (
            f"Verified successfully via {exam_result.exam_type} API"
        )
        exam_result.is_verified = True
        exam_result.verification_status = status_message
        exam_result.verified_at = timezone.now()
        exam_result.save()
        
        logger.info(
            f"Verification successful for {exam_result.exam_type} "
            f"{exam_result.exam_number}"
        )
    else:
        status_message = (
            f"Verification failed: Could not validate "
            f"{exam_result.exam_type} record"
        )
        exam_result.is_verified = False
        exam_result.verification_status = status_message
        exam_result.save()
        
        logger.warning(
            f"Verification failed for {exam_result.exam_type} "
            f"{exam_result.exam_number}: {status_message}"
        )
    
    return (is_verified, status_message)


def verify_application_results(application):
    """
    Verify all exam results for an application
    
    Args:
        application: Application instance
        
    Returns:
        tuple: (all_verified: bool, results: list)
    """
    from core.utils import get_setting
    
    verification_mode = get_setting(
        'RESULT_VERIFICATION_MODE',
        default='manual'
    )
    
    logger.info(
        f"Verifying application {application.id} in {verification_mode} mode"
    )
    
    if verification_mode == 'manual':
        logger.info(
            f"Manual verification mode - skipping automatic verification "
            f"for application {application.id}"
        )
        return (True, ["Manual verification mode - no automatic verification"])
    
    # Auto verification mode
    results = []
    all_verified = True
    
    for exam_result in application.exam_results.all():
        is_verified, message = verify_exam_result(exam_result)
        results.append({
            'exam_result_id': exam_result.id,
            'exam_type': exam_result.exam_type,
            'is_verified': is_verified,
            'message': message
        })
        
        if not is_verified:
            all_verified = False
    
    return (all_verified, results)


def get_allowed_sitting_count():
    """
    Get the allowed number of exam sittings from database settings
    
    Returns:
        int: 1 or 2
    """
    from core.utils import get_setting
    
    count = get_setting('ALLOWED_SITTING_COUNT', default=2)
    
    # Ensure valid value
    try:
        count = int(count)
        if count not in [1, 2]:
            count = 2
    except (ValueError, TypeError):
        count = 2
    
    return count
