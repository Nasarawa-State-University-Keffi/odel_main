"""
Question Service

Handles question validation and grading logic using the plugin system.
"""
from typing import Dict, Any, Tuple
from decimal import Decimal
from django.db import transaction
from ..models import Question, QuestionAttempt, QuizQuestion
from ..question_types import get_question_type_handler


class QuestionService:
    """
    Service for question-related operations.
    
    Responsibilities:
    - Validate question types
    - Grade responses using appropriate plugins
    - Calculate scores based on max_mark
    """

    @staticmethod
    def validate_question_type(qtype: str) -> bool:
        """
        Check if a question type is supported.
        
        Args:
            qtype: Question type identifier
            
        Returns:
            True if supported, False otherwise
        """
        try:
            get_question_type_handler(qtype)
            return True
        except ValueError:
            return False

    @staticmethod
    def validate_response(question: Question, response: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate a student response for a question.
        
        Args:
            question: Question instance
            response: Student response dictionary
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        handler = get_question_type_handler(question.qtype)
        return handler.validate_response(question, response)

    @staticmethod
    @transaction.atomic
    def grade_question(
        question: Question, 
        response: Dict[str, Any], 
        max_mark: Decimal = None
    ) -> Tuple[Decimal, Decimal]:
        """
        Grade a question response.
        
        Args:
            question: Question instance (with answers prefetched)
            response: Student response dictionary
            max_mark: Maximum marks for this question (uses question.default_mark if None)
            
        Returns:
            Tuple of (fraction, score)
            - fraction: Grade fraction 0.0-1.0 (None for manual grading)
            - score: Actual points earned (fraction × max_mark)
        
        Example:
            >>> grade_question(question, {"selected": ["answer_id"]}, Decimal('5.00'))
            (Decimal('1.0'), Decimal('5.00'))
        """
        if max_mark is None:
            max_mark = question.default_mark
        
        handler = get_question_type_handler(question.qtype)
        fraction = handler.grade(question, response)
        
        # Calculate score
        if fraction is None:
            # Manual grading required (e.g., essays)
            score = None
        else:
            score = fraction * max_mark
            # Round to 2 decimal places
            score = Decimal(str(round(float(score), 2)))
        
        return fraction, score

    @staticmethod
    def get_correct_answer(question: Question) -> Dict[str, Any]:
        """
        Get correct answer(s) for a question.
        
        Args:
            question: Question instance (with answers prefetched)
            
        Returns:
            Dictionary with correct answer information
        """
        handler = get_question_type_handler(question.qtype)
        return handler.get_correct_answer(question)

    @staticmethod
    def get_feedback(question: Question, response: Dict[str, Any], fraction: Decimal) -> str:
        """
        Generate feedback for a question response.
        
        Args:
            question: Question instance
            response: Student response
            fraction: Grade fraction achieved
            
        Returns:
            Feedback string
        """
        handler = get_question_type_handler(question.qtype)
        return handler.get_feedback(question, response, fraction)

    @staticmethod
    @transaction.atomic
    def manually_grade_attempt(
        question_attempt: QuestionAttempt,
        fraction: Decimal,
        feedback: str = ""
    ) -> QuestionAttempt:
        """
        Manually grade a question attempt (for essays or override).
        
        Args:
            question_attempt: QuestionAttempt instance
            fraction: Grade fraction (0.0-1.0)
            feedback: Instructor feedback
            
        Returns:
            Updated QuestionAttempt instance
        """
        from django.utils import timezone
        
        # Get max_mark from the quiz slot
        quiz_question = QuizQuestion.objects.get(
            quiz=question_attempt.quiz_attempt.quiz,
            question=question_attempt.question
        )
        
        max_mark = quiz_question.max_mark
        score = fraction * max_mark
        score = Decimal(str(round(float(score), 2)))
        
        question_attempt.fraction = fraction
        question_attempt.score = score
        question_attempt.feedback = feedback
        question_attempt.manually_graded = True
        question_attempt.graded_at = timezone.now()
        question_attempt.save()
        
        # Recalculate quiz attempt total
        # Avoid circular import by importing here
        from .quiz_service import QuizService
        quiz_attempt = question_attempt.quiz_attempt
        if quiz_attempt.state == 'finished':
            quiz_attempt.total_score = QuizService.calculate_final_grade(quiz_attempt)
            quiz_attempt.save(update_fields=['total_score'])
        
        return question_attempt
