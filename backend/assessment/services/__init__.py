"""
Assessment Services

Service layer for quiz, question, assignment management, and grading.
Implements business logic separate from views and models.
"""
from .quiz_service import QuizService
from .question_service import QuestionService
from .assignment_service import (
    create_submission, 
    submit_submission,
    upload_assignment_content,
    upload_submission_file
)
from .grading_service import (
    grade_assignment_submission,
    regrade_assignment_submission,
    grade_quiz_attempt,
    auto_grade_quiz_attempt,
    get_student_grades,
    get_course_grades,
    calculate_student_total,
    calculate_course_average,
    get_gradebook_summary,
    get_best_assignment_grade,
    get_best_quiz_grade,
    bulk_grade_submissions
)

__all__ = [
    'QuizService', 
    'QuestionService', 
    'create_submission', 
    'submit_submission',
    'upload_assignment_content',
    'upload_submission_file',
    'grade_assignment_submission',
    'regrade_assignment_submission',
    'grade_quiz_attempt',
    'auto_grade_quiz_attempt',
    'get_student_grades',
    'get_course_grades',
    'calculate_student_total',
    'calculate_course_average',
    'get_gradebook_summary',
    'get_best_assignment_grade',
    'get_best_quiz_grade',
    'bulk_grade_submissions',
]
