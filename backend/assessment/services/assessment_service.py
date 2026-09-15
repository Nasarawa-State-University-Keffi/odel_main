"""Lifecycle rules for self-paced, auto-graded assessments."""

import random
from decimal import Decimal
from types import SimpleNamespace

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from assessment.models import (
    Assessment,
    AssessmentAttempt,
    AssessmentQuestion,
    AssessmentQuestionAttempt,
    Grade,
    Question,
)
from assessment.services.question_service import QuestionService


class AssessmentService:
    """Create, save, grade, and finish a student's assessment attempt."""

    @staticmethod
    def get_attempt_deadline(attempt: AssessmentAttempt):
        """Assessments are self-paced; only quizzes enforce a running clock."""
        return None

    @classmethod
    def is_attempt_expired(cls, attempt: AssessmentAttempt, *, now=None) -> bool:
        return False

    @classmethod
    def expire_attempt_if_needed(cls, attempt: AssessmentAttempt, *, now=None) -> bool:
        """Kept as a compatibility hook; assessments never auto-submit."""
        return False

    @staticmethod
    def _resume_legacy_timed_attempt(*, assessment: Assessment, user_external_id: str):
        """Restore an attempt that an earlier timed-assessment release auto-finished.

        Before assessments became self-paced, a timer could submit work that a
        student had not chosen to submit.  Those rows have a deadline and a
        completion timestamp at or after it.  Reopen only that specific legacy
        shape; normally submitted assessments remain final.
        """
        attempt = AssessmentAttempt.objects.select_for_update().filter(
            assessment=assessment,
            user_external_id=user_external_id,
            state='finished',
            deadline_at__isnull=False,
            finished_at__gte=F('deadline_at'),
        ).order_by('-attempt_number').first()
        if not attempt:
            return None

        Grade.objects.filter(assessment_attempt=attempt).delete()
        attempt.state = 'in_progress'
        attempt.finished_at = None
        attempt.total_score = None
        attempt.deadline_at = None
        attempt.save(update_fields=['state', 'finished_at', 'total_score', 'deadline_at'])
        return attempt

    @staticmethod
    def _question_snapshot(question: Question) -> dict:
        """Persist the question and answer key used for an attempt.

        Staff can safely improve a bank question after students begin an
        assessment; previous attempts must continue to use the version the
        student saw.
        """
        return {
            'id': str(question.id),
            'name': question.name,
            'qtype': question.qtype,
            'question_text': question.question_text,
            'general_feedback': question.general_feedback,
            'answers': [
                {
                    'id': str(answer.id),
                    'answer_text': answer.answer_text,
                    'fraction': str(answer.fraction),
                    'feedback': answer.feedback,
                    'order': answer.order,
                }
                for answer in question.answers.all()
            ],
        }

    @staticmethod
    def _question_from_snapshot(snapshot: dict) -> Question:
        """Build the small Question-shaped object QuestionService needs."""
        answers = [
            SimpleNamespace(
                id=answer['id'],
                answer_text=answer['answer_text'],
                fraction=Decimal(str(answer['fraction'])),
                feedback=answer.get('feedback', ''),
                order=answer.get('order', 0),
            )
            for answer in snapshot.get('answers', [])
        ]
        return SimpleNamespace(
            id=snapshot['id'],
            name=snapshot.get('name', ''),
            qtype=snapshot['qtype'],
            question_text=snapshot.get('question_text', ''),
            general_feedback=snapshot.get('general_feedback', ''),
            answers=SimpleNamespace(all=lambda: answers),
        )

    @staticmethod
    def _append_new_question_slots(*, attempt: AssessmentAttempt, question_slots: list[AssessmentQuestion]):
        """Make later additions available when a student resumes a draft.

        Existing question attempts remain untouched so saved answers, marks, and
        snapshots cannot change.  New slots are appended after that frozen set,
        which lets a lecturer extend a self-paced assessment without making an
        in-progress student lose work.
        """
        existing_question_ids = set(
            attempt.question_attempts.values_list('question_id', flat=True),
        )
        new_slots = [slot for slot in question_slots if slot.question_id not in existing_question_ids]
        if not new_slots:
            return

        next_display_order = max(
            attempt.question_attempts.values_list('display_order', flat=True),
            default=0,
        ) + 1
        AssessmentQuestionAttempt.objects.bulk_create([
            AssessmentQuestionAttempt(
                assessment_attempt=attempt,
                question=slot.question,
                display_order=next_display_order + index,
                max_mark=slot.max_mark,
                question_snapshot=AssessmentService._question_snapshot(slot.question),
                response={},
            )
            for index, slot in enumerate(new_slots)
        ])

    @staticmethod
    @transaction.atomic
    def start_attempt(*, assessment: Assessment, user_external_id: str) -> AssessmentAttempt:
        # Lock the assessment itself. Locking only matching attempts does not
        # protect the max-attempt count when two browser tabs start together.
        assessment = Assessment.objects.select_for_update().get(pk=assessment.pk)
        question_slots = list(
            AssessmentQuestion.objects.filter(assessment=assessment)
            .select_related('question')
            .prefetch_related('question__answers')
            .order_by('order', 'id')
        )
        if not question_slots:
            raise ValidationError('This assessment has no questions yet. Please contact your lecturer.')

        active_attempt = AssessmentAttempt.objects.select_for_update().filter(
            assessment=assessment,
            user_external_id=user_external_id,
            state='in_progress',
        ).first()
        if active_attempt:
            # An active assessment is a saved draft.  Starting again is how a
            # student resumes it from another device or a later session.
            if active_attempt.deadline_at:
                active_attempt.deadline_at = None
                active_attempt.save(update_fields=['deadline_at'])
            AssessmentService._append_new_question_slots(
                attempt=active_attempt,
                question_slots=question_slots,
            )
            return active_attempt

        legacy_attempt = AssessmentService._resume_legacy_timed_attempt(
            assessment=assessment,
            user_external_id=user_external_id,
        )
        if legacy_attempt:
            AssessmentService._append_new_question_slots(
                attempt=legacy_attempt,
                question_slots=question_slots,
            )
            return legacy_attempt

        now = timezone.now()
        if assessment.time_open and now < assessment.time_open:
            raise ValidationError(f'Assessment opens at {assessment.time_open}')

        attempt_count = AssessmentAttempt.objects.filter(
            assessment=assessment,
            user_external_id=user_external_id,
        ).count()
        if assessment.max_attempts > 0 and attempt_count >= assessment.max_attempts:
            raise ValidationError(f'Maximum attempts ({assessment.max_attempts}) reached for this assessment.')

        if assessment.shuffle_questions:
            random.shuffle(question_slots)

        attempt = AssessmentAttempt.objects.create(
            assessment=assessment,
            user_external_id=user_external_id,
            attempt_number=attempt_count + 1,
            grade_scale=assessment.max_grade,
            show_feedback=assessment.show_feedback,
        )
        AssessmentQuestionAttempt.objects.bulk_create([
            AssessmentQuestionAttempt(
                assessment_attempt=attempt,
                question=slot.question,
                display_order=display_order,
                max_mark=slot.max_mark,
                question_snapshot=AssessmentService._question_snapshot(slot.question),
                response={},
            )
            for display_order, slot in enumerate(question_slots, start=1)
        ])
        return attempt

    @staticmethod
    @transaction.atomic
    def submit_response(*, attempt: AssessmentAttempt, question: Question, response: dict) -> AssessmentQuestionAttempt:
        attempt = AssessmentAttempt.objects.select_for_update().select_related('assessment').get(pk=attempt.pk)
        if attempt.state != 'in_progress':
            raise ValidationError(f'Cannot submit to a {attempt.state} attempt.')

        question_attempt = AssessmentQuestionAttempt.objects.select_for_update().get(
            assessment_attempt=attempt,
            question=question,
        )
        if question_attempt.question_snapshot:
            frozen_question = AssessmentService._question_from_snapshot(question_attempt.question_snapshot)
        else:
            # Compatibility for attempts created before snapshots were added.
            frozen_question = Question.objects.prefetch_related('answers').get(pk=question.pk)

        is_valid, message = QuestionService.validate_response(frozen_question, response)
        if not is_valid:
            raise ValidationError(f'Invalid response: {message}')
        fraction, score = QuestionService.grade_question(frozen_question, response, question_attempt.max_mark)

        question_attempt.response = response
        question_attempt.fraction = fraction
        question_attempt.score = score
        question_attempt.graded_at = timezone.now()
        question_attempt.manually_graded = False
        question_attempt.feedback = QuestionService.get_feedback(frozen_question, response, fraction)
        question_attempt.save(update_fields=['response', 'fraction', 'score', 'graded_at', 'manually_graded', 'feedback'])
        return question_attempt

    @classmethod
    @transaction.atomic
    def manually_grade_question_attempt(
        cls,
        question_attempt: AssessmentQuestionAttempt,
        fraction: Decimal,
        feedback: str = '',
    ) -> AssessmentQuestionAttempt:
        """Record a staff mark for an essay and refresh a completed attempt's grade."""
        question_attempt = AssessmentQuestionAttempt.objects.select_for_update().select_related(
            'assessment_attempt__assessment', 'question',
        ).get(pk=question_attempt.pk)
        if question_attempt.question.qtype != 'essay':
            raise ValidationError('Only essay responses require manual assessment marking.')
        if question_attempt.assessment_attempt.state != 'finished':
            raise ValidationError('An essay can be marked after the student submits the assessment.')

        question_attempt.fraction = fraction
        question_attempt.score = (fraction * question_attempt.max_mark).quantize(Decimal('0.01'))
        question_attempt.feedback = feedback
        question_attempt.manually_graded = True
        question_attempt.graded_at = timezone.now()
        question_attempt.save(update_fields=[
            'fraction', 'score', 'feedback', 'manually_graded', 'graded_at',
        ])

        cls._sync_final_grade(question_attempt.assessment_attempt, graded_at=timezone.now())
        return question_attempt

    @classmethod
    def _has_pending_manual_grading(cls, attempt: AssessmentAttempt) -> bool:
        """Return whether the completed attempt still has an unmarked essay."""
        return attempt.question_attempts.filter(
            question__qtype='essay',
            manually_graded=False,
        ).exists()

    @classmethod
    def _sync_final_grade(cls, attempt: AssessmentAttempt, *, graded_at):
        """Persist a final grade only after every manually marked item is ready.

        Essays deliberately have no automatic score. Treating their ``None``
        score as zero would make a submitted response look like a failed one
        and could expose a provisional result when score release is enabled.
        """
        if cls._has_pending_manual_grading(attempt):
            if attempt.total_score is not None:
                attempt.total_score = None
                attempt.save(update_fields=['total_score'])
            Grade.objects.filter(assessment_attempt=attempt).delete()
            return None

        attempt.total_score = cls.calculate_final_grade(attempt)
        attempt.save(update_fields=['total_score'])
        Grade.objects.update_or_create(
            assessment_attempt=attempt,
            defaults={
                'student_external_id': attempt.user_external_id,
                'course': attempt.assessment.course,
                'grade_type': 'assessment',
                'marks': attempt.total_score,
                'total_possible': attempt.grade_scale,
                'graded_at': graded_at,
            },
        )
        return attempt.total_score

    @staticmethod
    def calculate_final_grade(attempt: AssessmentAttempt) -> Decimal:
        raw_score = sum(
            question_attempt.score or Decimal('0')
            for question_attempt in attempt.question_attempts.all()
        )
        total_possible = sum(
            question_attempt.max_mark
            for question_attempt in attempt.question_attempts.all()
        )
        if not total_possible:
            return Decimal('0.00')
        return (raw_score / total_possible * attempt.grade_scale).quantize(Decimal('0.01'))

    @staticmethod
    @transaction.atomic
    def finish_attempt(attempt: AssessmentAttempt) -> AssessmentAttempt:
        attempt = AssessmentAttempt.objects.select_for_update().select_related('assessment').get(pk=attempt.pk)
        # Finishing is intentionally idempotent: browsers may race a timer
        # with the student pressing Submit, or retry after a lost response.
        if attempt.state == 'finished':
            return attempt
        if attempt.state != 'in_progress':
            raise ValidationError(f'Attempt is already {attempt.state}.')

        attempt.state = 'finished'
        attempt.finished_at = timezone.now()
        attempt.save(update_fields=['state', 'finished_at'])
        AssessmentService._sync_final_grade(attempt, graded_at=attempt.finished_at)
        return attempt

    @classmethod
    def get_attempt_summary(cls, attempt: AssessmentAttempt) -> dict:
        question_attempts = attempt.question_attempts.all()
        deadline = cls.get_attempt_deadline(attempt)
        return {
            'attempt_id': str(attempt.id),
            'assessment_name': attempt.assessment.name,
            'attempt_number': attempt.attempt_number,
            'state': attempt.state,
            'started_at': attempt.started_at,
            'finished_at': attempt.finished_at,
            'deadline_at': deadline,
            'total_questions': question_attempts.count(),
            'answered_questions': question_attempts.exclude(response={}).count(),
            'total_score': float(attempt.total_score) if attempt.total_score is not None else None,
            'max_grade': float(attempt.grade_scale),
        }
