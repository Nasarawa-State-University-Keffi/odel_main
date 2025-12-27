"""
Grading Service - Handles grading of assignments and quizzes

Provides service functions for:
- Grading assignment submissions and creating grade records
- Grading quiz attempts and creating grade records
- Computing aggregated grades for students
- Fetching gradebook data
"""

from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Avg, Count, Q
from typing import Optional, Dict, List

from assessment.models import (
    Assignment, AssignmentSubmission,
    Quiz, QuizAttempt,
    Grade
)


# ==========================================
# ASSIGNMENT GRADING
# ==========================================

@transaction.atomic
def grade_assignment_submission(submission_id: str, marks: Decimal, graded_by: Optional[str] = None) -> Grade:
    """
    Grade an assignment submission and create/update grade record.
    
    Args:
        submission_id: UUID of the AssignmentSubmission
        marks: Score to assign
        graded_by: Optional identifier of who graded this
    
    Returns:
        Grade: The created or updated grade record
    
    Raises:
        AssignmentSubmission.DoesNotExist: If submission not found
        ValueError: If marks exceed maximum or submission not submitted
    """
    from django.shortcuts import get_object_or_404
    
    # Get the submission
    submission = get_object_or_404(AssignmentSubmission, id=submission_id)
    
    # Validate submission state
    if submission.status not in ['submitted', 'graded', 'reopened']:
        raise ValueError("Can only grade submitted assignments")
    
    # Get max marks from assignment
    max_marks = submission.assignment.max_marks
    
    # Validate marks
    if marks < 0:
        raise ValueError("Marks cannot be negative")
    
    if marks > max_marks:
        raise ValueError(f"Marks ({marks}) cannot exceed maximum ({max_marks})")
    
    # Update submission
    submission.marks = marks
    submission.status = 'graded'
    submission.graded_at = timezone.now()
    submission.save(update_fields=['marks', 'status', 'graded_at'])
    
    # Create or update grade record
    grade, created = Grade.objects.update_or_create(
        assignment_submission=submission,
        defaults={
            'student_external_id': submission.student_external_id,
            'course': submission.assignment.course,
            'grade_type': 'assignment',
            'marks': marks,
            'total_possible': max_marks,
            'graded_at': submission.graded_at,
        }
    )
    
    return grade


@transaction.atomic
def regrade_assignment_submission(submission_id: str, new_marks: Decimal) -> Grade:
    """
    Update the grade for an already graded assignment submission.
    
    Args:
        submission_id: UUID of the AssignmentSubmission
        new_marks: New score to assign
    
    Returns:
        Grade: The updated grade record
    """
    return grade_assignment_submission(submission_id, new_marks)


# ==========================================
# QUIZ GRADING
# ==========================================

@transaction.atomic
def grade_quiz_attempt(attempt_id: str, total_score: Decimal) -> Grade:
    """
    Grade a quiz attempt and create/update grade record.
    
    Args:
        attempt_id: UUID of the QuizAttempt
        total_score: Final score for the quiz
    
    Returns:
        Grade: The created or updated grade record
    
    Raises:
        QuizAttempt.DoesNotExist: If attempt not found
        ValueError: If score invalid or attempt not finished
    """
    from django.shortcuts import get_object_or_404
    
    # Get the quiz attempt
    attempt = get_object_or_404(QuizAttempt, id=attempt_id)
    
    # Validate attempt state
    if attempt.state != 'finished':
        raise ValueError("Can only grade finished quiz attempts")
    
    # Get max grade from quiz
    max_grade = attempt.quiz.max_grade
    
    # Validate score
    if total_score < 0:
        raise ValueError("Score cannot be negative")
    
    if total_score > max_grade:
        raise ValueError(f"Score ({total_score}) cannot exceed maximum ({max_grade})")
    
    # Update quiz attempt
    attempt.total_score = total_score
    if not attempt.finished_at:
        attempt.finished_at = timezone.now()
    attempt.save(update_fields=['total_score', 'finished_at'])
    
    graded_at = attempt.finished_at or timezone.now()
    
    # Create or update grade record
    grade, created = Grade.objects.update_or_create(
        quiz_attempt=attempt,
        defaults={
            'student_external_id': attempt.user_external_id,
            'course': attempt.quiz.course,
            'grade_type': 'quiz',
            'marks': total_score,
            'total_possible': max_grade,
            'graded_at': graded_at,
        }
    )
    
    return grade


@transaction.atomic
def auto_grade_quiz_attempt(attempt_id: str) -> Grade:
    """
    Automatically grade a quiz attempt based on question attempts.
    Calculates total score from all graded question attempts.
    
    Args:
        attempt_id: UUID of the QuizAttempt
    
    Returns:
        Grade: The created or updated grade record
    """
    from django.shortcuts import get_object_or_404
    
    attempt = get_object_or_404(QuizAttempt, id=attempt_id)
    
    # Calculate total score from question attempts
    total_score = attempt.question_attempts.aggregate(
        total=Sum('score')
    )['total'] or Decimal('0.00')
    
    return grade_quiz_attempt(str(attempt.id), total_score)


# ==========================================
# GRADE RETRIEVAL
# ==========================================

def get_student_grades(student_external_id: str, course_id: str) -> List[Grade]:
    """
    Get all grades for a student in a specific course.
    
    Args:
        student_external_id: Student's external identifier
        course_id: Course UUID
    
    Returns:
        List of Grade objects ordered by graded_at descending
    """
    return list(
        Grade.objects.filter(
            student_external_id=student_external_id,
            course_id=course_id
        ).select_related(
            'assignment_submission__assignment',
            'quiz_attempt__quiz',
            'course'
        ).order_by('-graded_at')
    )


def get_course_grades(course_id: str, grade_type: Optional[str] = None) -> List[Grade]:
    """
    Get all grades for a course, optionally filtered by type.
    
    Args:
        course_id: Course UUID
        grade_type: Optional filter ('assignment' or 'quiz')
    
    Returns:
        List of Grade objects
    """
    queryset = Grade.objects.filter(course_id=course_id).select_related(
        'assignment_submission__assignment',
        'quiz_attempt__quiz'
    )
    
    if grade_type:
        queryset = queryset.filter(grade_type=grade_type)
    
    return list(queryset.order_by('student_external_id', '-graded_at'))


# ==========================================
# GRADE AGGREGATION
# ==========================================

def calculate_student_total(student_external_id: str, course_id: str) -> Dict:
    """
    Calculate total marks for a student in a course.
    
    Args:
        student_external_id: Student's external identifier
        course_id: Course UUID
    
    Returns:
        Dictionary containing:
        - total_marks: Sum of all earned marks
        - total_possible: Sum of all possible marks
        - percentage: Overall percentage
        - assignment_marks: Total from assignments
        - assignment_possible: Total possible from assignments
        - quiz_marks: Total from quizzes
        - quiz_possible: Total possible from quizzes
        - grade_count: Number of graded items
    """
    grades = Grade.objects.filter(
        student_external_id=student_external_id,
        course_id=course_id
    )
    
    # Overall totals
    overall = grades.aggregate(
        total_marks=Sum('marks'),
        total_possible=Sum('total_possible'),
        grade_count=Count('id')
    )
    
    # Assignment totals
    assignment_totals = grades.filter(grade_type='assignment').aggregate(
        assignment_marks=Sum('marks'),
        assignment_possible=Sum('total_possible')
    )
    
    # Quiz totals
    quiz_totals = grades.filter(grade_type='quiz').aggregate(
        quiz_marks=Sum('marks'),
        quiz_possible=Sum('total_possible')
    )
    
    total_marks = overall['total_marks'] or Decimal('0.00')
    total_possible = overall['total_possible'] or Decimal('0.00')
    
    percentage = None
    if total_possible > 0:
        percentage = (total_marks / total_possible) * 100
    
    return {
        'total_marks': total_marks,
        'total_possible': total_possible,
        'percentage': percentage,
        'assignment_marks': assignment_totals['assignment_marks'] or Decimal('0.00'),
        'assignment_possible': assignment_totals['assignment_possible'] or Decimal('0.00'),
        'quiz_marks': quiz_totals['quiz_marks'] or Decimal('0.00'),
        'quiz_possible': quiz_totals['quiz_possible'] or Decimal('0.00'),
        'grade_count': overall['grade_count'],
    }


def calculate_course_average(course_id: str) -> Dict:
    """
    Calculate average grade for all students in a course.
    
    Args:
        course_id: Course UUID
    
    Returns:
        Dictionary containing:
        - average_percentage: Average percentage across all students
        - student_count: Number of students with grades
        - total_grades: Total number of grade entries
    """
    from django.db.models import F, FloatField
    from django.db.models.functions import Cast
    
    grades = Grade.objects.filter(course_id=course_id)
    
    # Get unique students
    student_count = grades.values('student_external_id').distinct().count()
    
    # Calculate average percentage
    avg_data = grades.aggregate(
        avg_percentage=Avg(
            Cast(F('marks'), FloatField()) / Cast(F('total_possible'), FloatField()) * 100
        ),
        total_grades=Count('id')
    )
    
    return {
        'average_percentage': avg_data['avg_percentage'],
        'student_count': student_count,
        'total_grades': avg_data['total_grades'],
    }


def get_gradebook_summary(course_id: str) -> List[Dict]:
    """
    Get a summary of all student grades in a course.
    
    Args:
        course_id: Course UUID
    
    Returns:
        List of dictionaries, one per student, containing:
        - student_external_id
        - total_marks
        - total_possible
        - percentage
        - assignment_count
        - quiz_count
    """
    from django.db.models import Case, When, IntegerField
    
    students = Grade.objects.filter(
        course_id=course_id
    ).values('student_external_id').distinct()
    
    summary = []
    
    for student_data in students:
        student_id = student_data['student_external_id']
        totals = calculate_student_total(student_id, course_id)
        
        grades = Grade.objects.filter(
            student_external_id=student_id,
            course_id=course_id
        )
        
        assignment_count = grades.filter(grade_type='assignment').count()
        quiz_count = grades.filter(grade_type='quiz').count()
        
        summary.append({
            'student_external_id': student_id,
            'total_marks': totals['total_marks'],
            'total_possible': totals['total_possible'],
            'percentage': totals['percentage'],
            'assignment_count': assignment_count,
            'quiz_count': quiz_count,
        })
    
    # Sort by percentage descending
    summary.sort(key=lambda x: x['percentage'] if x['percentage'] else 0, reverse=True)
    
    return summary


# ==========================================
# BEST ATTEMPT SELECTION
# ==========================================

def get_best_assignment_grade(student_external_id: str, assignment_id: str) -> Optional[Grade]:
    """
    Get the highest grade for a student on a specific assignment across all attempts.
    
    Args:
        student_external_id: Student's external identifier
        assignment_id: Assignment UUID
    
    Returns:
        Grade object with highest percentage, or None if no grades exist
    """
    return Grade.objects.filter(
        student_external_id=student_external_id,
        assignment_submission__assignment_id=assignment_id,
        grade_type='assignment'
    ).order_by('-percentage').first()


def get_best_quiz_grade(student_external_id: str, quiz_id: str) -> Optional[Grade]:
    """
    Get the highest grade for a student on a specific quiz across all attempts.
    
    Args:
        student_external_id: Student's external identifier
        quiz_id: Quiz UUID
    
    Returns:
        Grade object with highest percentage, or None if no grades exist
    """
    return Grade.objects.filter(
        student_external_id=student_external_id,
        quiz_attempt__quiz_id=quiz_id,
        grade_type='quiz'
    ).order_by('-percentage').first()


# ==========================================
# BULK OPERATIONS
# ==========================================

@transaction.atomic
def bulk_grade_submissions(grading_data: List[Dict]) -> List[Grade]:
    """
    Grade multiple assignment submissions at once.
    
    Args:
        grading_data: List of dicts with 'submission_id' and 'marks' keys
    
    Returns:
        List of created/updated Grade objects
    
    Example:
        grading_data = [
            {'submission_id': 'uuid1', 'marks': 85.5},
            {'submission_id': 'uuid2', 'marks': 92.0},
        ]
    """
    grades = []
    
    for data in grading_data:
        try:
            grade = grade_assignment_submission(
                submission_id=data['submission_id'],
                marks=Decimal(str(data['marks']))
            )
            grades.append(grade)
        except Exception as e:
            # Log error but continue with other submissions
            print(f"Error grading submission {data['submission_id']}: {str(e)}")
            continue
    
    return grades
