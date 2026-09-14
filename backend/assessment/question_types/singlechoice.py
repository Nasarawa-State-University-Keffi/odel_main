"""Strict one-answer multiple-choice questions."""
from decimal import Decimal
from typing import Any, Dict, Tuple

from .base import BaseQuestionType


class SingleChoiceQuestionType(BaseQuestionType):
    """A radio-button question with at least two options and one correct answer."""

    def _answers_are_valid(self, question: Any) -> bool:
        answers = list(question.answers.all())
        fractions = [Decimal(str(answer.fraction)) for answer in answers]
        return len(answers) >= 2 and fractions.count(Decimal('1')) == 1 and all(
            fraction in {Decimal('0'), Decimal('1')} for fraction in fractions
        )

    def validate_response(self, question: Any, response: Dict[str, Any]) -> Tuple[bool, str]:
        if not isinstance(response, dict):
            return False, 'Response must be a dictionary'
        selected = response.get('selected')
        if not isinstance(selected, str) or not selected:
            return False, "'selected' must be one answer ID"
        if selected not in {str(answer.id) for answer in question.answers.all()}:
            return False, 'Selected answer does not belong to this question'
        if not self._answers_are_valid(question):
            return False, 'Single choice questions need at least two options with exactly one correct answer'
        return True, ''

    def grade(self, question: Any, response: Dict[str, Any]) -> Decimal:
        selected = str(response.get('selected', ''))
        for answer in question.answers.all():
            if str(answer.id) == selected:
                return Decimal('1') if Decimal(str(answer.fraction)) == Decimal('1') else Decimal('0')
        return Decimal('0')

    def get_correct_answer(self, question: Any) -> Dict[str, Any]:
        answers = [
            {
                'id': str(answer.id),
                'text': answer.answer_text,
                'is_correct': Decimal(str(answer.fraction)) == Decimal('1'),
                'feedback': answer.feedback,
            }
            for answer in question.answers.all()
        ]
        correct = next((answer for answer in answers if answer['is_correct']), None)
        return {
            'correct_id': correct['id'] if correct else None,
            'correct_text': correct['text'] if correct else None,
            'answers': answers,
        }
