"""
Quiz Service

Handles quiz attempt lifecycle: starting, submitting responses, finishing, and grading.
"""
from datetime import timedelta
from typing import Dict, Any, Optional
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from ..models import Quiz, QuizAttempt, QuizQuestion, QuestionAttempt, Question
from .question_service import QuestionService
import random


class QuizService:
    """
    Service for quiz-related operations.
    
    Responsibilities:
    - Manage quiz attempts
    - Handle question responses
    - Calculate final grades
    - Enforce quiz rules (time limits, max attempts, etc.)
    """

    @staticmethod
    def get_attempt_deadline(attempt: QuizAttempt):
        """Return the earliest server-enforced deadline for an attempt."""
        deadlines = []
        if attempt.quiz.time_limit:
            deadlines.append(attempt.started_at + timedelta(seconds=attempt.quiz.time_limit))
        if attempt.quiz.time_close:
            deadlines.append(attempt.quiz.time_close)
        return min(deadlines) if deadlines else None

    @staticmethod
    def is_attempt_expired(attempt: QuizAttempt, *, now=None) -> bool:
        deadline = QuizService.get_attempt_deadline(attempt)
        return bool(deadline and (now or timezone.now()) >= deadline)

    @staticmethod
    def expire_attempt_if_needed(attempt: QuizAttempt, *, now=None) -> bool:
        """Finish an expired active attempt and report whether it was expired."""
        if attempt.state != 'in_progress' or not QuizService.is_attempt_expired(attempt, now=now):
            return False
        QuizService.finish_attempt(attempt)
        return True

    @staticmethod
    @transaction.atomic
    def start_attempt(quiz: Quiz, user_external_id: str) -> QuizAttempt:
        """
        Start a new quiz attempt for a user.
        
        Args:
            quiz: Quiz instance
            user_external_id: External user identifier
            
        Returns:
            New QuizAttempt instance
            
        Raises:
            ValidationError: If user has active attempt or exceeded max attempts
        """
        # Resolve the slot list before creating an attempt. A Quiz is a shell;
        # only its QuizQuestion slots make it answerable.
        question_list = list(
            QuizQuestion.objects.filter(quiz=quiz)
            .select_related('question')
            .order_by('order', 'id')
        )
        if not question_list:
            raise ValidationError(
                "This quiz has no linked questions yet. Please contact your lecturer."
            )

        # Check for active attempts
        active_attempt = QuizAttempt.objects.select_for_update().filter(
            quiz=quiz,
            user_external_id=user_external_id,
            state='in_progress'
        ).first()
        
        if active_attempt and QuizService.expire_attempt_if_needed(active_attempt):
            active_attempt = None

        if active_attempt:
            raise ValidationError(
                f"You already have an active attempt for this quiz (started {active_attempt.started_at})"
            )
        
        # Check max attempts limit
        if quiz.max_attempts > 0:
            attempt_count = QuizAttempt.objects.filter(
                quiz=quiz,
                user_external_id=user_external_id
            ).count()
            
            if attempt_count >= quiz.max_attempts:
                raise ValidationError(
                    f"Maximum attempts ({quiz.max_attempts}) reached for this quiz"
                )
        
        # Check quiz availability
        now = timezone.now()
        if quiz.time_open and now < quiz.time_open:
            raise ValidationError(f"Quiz opens at {quiz.time_open}")
        
        if quiz.time_close and now > quiz.time_close:
            raise ValidationError(f"Quiz closed at {quiz.time_close}")
        
        # Determine attempt number
        attempt_number = QuizAttempt.objects.filter(
            quiz=quiz,
            user_external_id=user_external_id
        ).count() + 1
        
        # Create attempt
        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            user_external_id=user_external_id,
            attempt_number=attempt_number,
            state='in_progress'
        )
        
        # Optionally shuffle questions
        if quiz.shuffle_questions:
            random.shuffle(question_list)
        
        for display_order, quiz_question in enumerate(question_list, start=1):
            QuestionAttempt.objects.create(
                quiz_attempt=attempt,
                question=quiz_question.question,
                display_order=display_order,
                response={}
            )
        
        return attempt

    @staticmethod
    @transaction.atomic
    def submit_response(
        attempt: QuizAttempt,
        question: Question,
        response: Dict[str, Any]
    ) -> QuestionAttempt:
        """
        Submit a response for a question in an attempt.
        
        Args:
            attempt: QuizAttempt instance
            question: Question instance
            response: Student response dictionary
            
        Returns:
            Updated QuestionAttempt instance
            
        Raises:
            ValidationError: If attempt is finished, question not in quiz, or response invalid
        """
        # Validate attempt state
        if attempt.state != 'in_progress':
            raise ValidationError(f"Cannot submit to {attempt.state} attempt")
        
        # Enforce both the per-attempt limit and the quiz closing time.
        if QuizService.expire_attempt_if_needed(attempt):
            raise ValidationError("The quiz deadline has passed and your attempt was submitted automatically")
        
        # Validate question belongs to quiz
        quiz_question = QuizQuestion.objects.filter(
            quiz=attempt.quiz,
            question=question
        ).first()
        
        if not quiz_question:
            raise ValidationError("Question does not belong to this quiz")
        
        # Validate response
        is_valid, error_msg = QuestionService.validate_response(question, response)
        if not is_valid:
            raise ValidationError(f"Invalid response: {error_msg}")
        
        # Get or create question attempt
        question_attempt, created = QuestionAttempt.objects.get_or_create(
            quiz_attempt=attempt,
            question=question,
            defaults={'response': response}
        )
        
        if not created:
            # Update existing response (idempotent)
            question_attempt.response = response
        
        # Grade the response immediately
        # Prefetch answers for efficient grading
        question_with_answers = Question.objects.prefetch_related('answers').get(pk=question.id)
        
        fraction, score = QuestionService.grade_question(
            question_with_answers,
            response,
            quiz_question.max_mark
        )
        
        question_attempt.fraction = fraction
        question_attempt.score = score
        question_attempt.graded_at = timezone.now() if fraction is not None else None
        question_attempt.save()
        
        return question_attempt

    @staticmethod
    @transaction.atomic
    def finish_attempt(attempt: QuizAttempt) -> QuizAttempt:
        """
        Finish a quiz attempt and calculate final grade.
        
        Args:
            attempt: QuizAttempt instance
            
        Returns:
            Updated QuizAttempt instance with final score
            
        Raises:
            ValidationError: If attempt is already finished
        """
        if attempt.state != 'in_progress':
            raise ValidationError(f"Attempt is already {attempt.state}")
        
        attempt.state = 'finished'
        attempt.finished_at = timezone.now()
        
        # Calculate final grade
        total_score = QuizService.calculate_final_grade(attempt)
        attempt.total_score = total_score
        
        attempt.save()
        
        return attempt

    @staticmethod
    def calculate_final_grade(attempt: QuizAttempt) -> Decimal:
        """
        Calculate the final grade for a quiz attempt.
        
        Sums all question attempt scores and scales to quiz max_grade.
        
        Args:
            attempt: QuizAttempt instance
            
        Returns:
            Final score (scaled to quiz.max_grade)
        """
        # Sum all graded question scores
        question_attempts = QuestionAttempt.objects.filter(
            quiz_attempt=attempt,
            score__isnull=False  # Only count graded questions
        )
        
        raw_score = sum(qa.score for qa in question_attempts)
        
        # Get total possible points from quiz questions
        quiz_questions = QuizQuestion.objects.filter(quiz=attempt.quiz)
        total_possible = sum(qq.max_mark for qq in quiz_questions)
        
        if total_possible == 0:
            return Decimal('0.0')
        
        # Scale to quiz max_grade
        percentage = raw_score / total_possible
        final_score = percentage * attempt.quiz.max_grade
        
        # Round to 2 decimal places
        return Decimal(str(round(float(final_score), 2)))

    @staticmethod
    def get_attempt_summary(attempt: QuizAttempt) -> Dict[str, Any]:
        """
        Get a summary of a quiz attempt with statistics.
        
        Args:
            attempt: QuizAttempt instance
            
        Returns:
            Dictionary with attempt statistics
        """
        question_attempts = QuestionAttempt.objects.filter(quiz_attempt=attempt)
        
        total_questions = question_attempts.count()
        answered_questions = question_attempts.exclude(response={}).count()
        graded_questions = question_attempts.filter(graded_at__isnull=False).count()
        pending_manual_grading = question_attempts.filter(
            graded_at__isnull=True,
            question__qtype='essay'
        ).count()
        
        # Calculate time taken
        if attempt.finished_at:
            time_taken = (attempt.finished_at - attempt.started_at).total_seconds()
        else:
            time_taken = (timezone.now() - attempt.started_at).total_seconds()
        
        return {
            'attempt_id': str(attempt.id),
            'quiz_name': attempt.quiz.name,
            'attempt_number': attempt.attempt_number,
            'state': attempt.state,
            'started_at': attempt.started_at,
            'finished_at': attempt.finished_at,
            'time_taken_seconds': int(time_taken),
            'total_questions': total_questions,
            'answered_questions': answered_questions,
            'graded_questions': graded_questions,
            'pending_manual_grading': pending_manual_grading,
            'total_score': float(attempt.total_score) if attempt.total_score else None,
            'max_grade': float(attempt.quiz.max_grade),
        }

    @staticmethod
    def can_view_results(attempt: QuizAttempt, user_external_id: str) -> bool:
        """
        Check if a user can view results for an attempt.
        
        Args:
            attempt: QuizAttempt instance
            user_external_id: User identifier
            
        Returns:
            True if user can view results
        """
        # User must own the attempt
        if attempt.user_external_id != user_external_id:
            return False
        
        # Attempt must be finished
        if attempt.state != 'finished':
            return False
        
        # Check quiz settings
        if not attempt.quiz.show_feedback:
            return False
        
        return True
