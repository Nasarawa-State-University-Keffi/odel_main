"""
Multiple Choice Question Type Handler

Supports:
- Single correct answer
- Multiple correct answers
- Partial credit
- Negative marking
"""
from typing import Dict, Any, Tuple
from decimal import Decimal
from .base import BaseQuestionType


class MultipleChoiceQuestionType(BaseQuestionType):
    """
    Handler for multiple choice questions.
    
    Expected response format:
    {
        "selected": ["answer_uuid_1", "answer_uuid_2", ...]  # List of selected answer IDs
    }
    
    Grading logic:
    - Sums the fraction values of all selected answers
    - Clamps result between 0.0 and 1.0
    - Supports partial credit and negative marking
    """

    def validate_response(self, question: Any, response: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate multiple choice response.
        
        Args:
            question: Question instance
            response: {"selected": [answer_ids]}
            
        Returns:
            (is_valid, error_message)
        """
        if not isinstance(response, dict):
            return False, "Response must be a dictionary"
        
        if 'selected' not in response:
            return False, "Response must contain 'selected' key"
        
        selected = response['selected']
        
        if not isinstance(selected, list):
            return False, "'selected' must be a list of answer IDs"
        
        if not selected:
            return False, "At least one answer must be selected"
        
        # Validate that all selected IDs exist for this question
        valid_answer_ids = set(str(ans.id) for ans in question.answers.all())
        selected_ids = set(str(sid) for sid in selected)
        
        invalid_ids = selected_ids - valid_answer_ids
        if invalid_ids:
            return False, f"Invalid answer IDs: {invalid_ids}"
        
        return True, ""

    def grade(self, question: Any, response: Dict[str, Any]) -> Decimal:
        """
        Grade multiple choice response by summing fractions.
        
        Args:
            question: Question with answers prefetched
            response: {"selected": [answer_ids]}
            
        Returns:
            Fraction between 0.0 and 1.0
        """
        selected_ids = set(str(sid) for sid in response.get('selected', []))
        
        if not selected_ids:
            return Decimal('0.0')
        
        # Sum fractions of selected answers
        total_fraction = Decimal('0.0')
        for answer in question.answers.all():
            if str(answer.id) in selected_ids:
                total_fraction += Decimal(str(answer.fraction))
        
        # Clamp between 0.0 and 1.0
        return max(Decimal('0.0'), min(Decimal('1.0'), total_fraction))

    def get_correct_answer(self, question: Any) -> Dict[str, Any]:
        """
        Get correct answer(s) for multiple choice.
        
        Returns:
            {
                "correct_ids": [answer_ids with fraction 1.0],
                "partial_ids": [answer_ids with fraction between 0 and 1],
                "answers": [{id, text, fraction}]
            }
        """
        correct_ids = []
        partial_ids = []
        all_answers = []
        
        for answer in question.answers.all():
            answer_data = {
                'id': str(answer.id),
                'text': answer.answer_text,
                'fraction': float(answer.fraction),
                'feedback': answer.feedback
            }
            all_answers.append(answer_data)
            
            if answer.fraction == Decimal('1.0'):
                correct_ids.append(str(answer.id))
            elif answer.fraction > Decimal('0.0'):
                partial_ids.append(str(answer.id))
        
        return {
            'correct_ids': correct_ids,
            'partial_ids': partial_ids,
            'answers': all_answers
        }
