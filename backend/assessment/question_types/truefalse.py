"""
True/False Question Type Handler

A specialized case of multiple choice with exactly two options.
"""
from typing import Dict, Any, Tuple
from decimal import Decimal
from .base import BaseQuestionType


class TrueFalseQuestionType(BaseQuestionType):
    """
    Handler for True/False questions.
    
    Expected response format:
    {
        "selected": "answer_uuid"  # Single answer ID (True or False)
    }
    
    Note: True/False is implemented as a multiple choice with 2 options.
    The question should have exactly 2 answers: one with fraction 1.0 (correct)
    and one with fraction 0.0 (incorrect).
    """

    def validate_response(self, question: Any, response: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate True/False response.
        
        Args:
            question: Question instance
            response: {"selected": answer_id}
            
        Returns:
            (is_valid, error_message)
        """
        if not isinstance(response, dict):
            return False, "Response must be a dictionary"
        
        if 'selected' not in response:
            return False, "Response must contain 'selected' key"
        
        selected = response['selected']
        
        if not isinstance(selected, str):
            return False, "'selected' must be a single answer ID string"
        
        if not selected:
            return False, "An answer must be selected"
        
        # Validate that selected ID exists for this question
        valid_answer_ids = set(str(ans.id) for ans in question.answers.all())
        
        if selected not in valid_answer_ids:
            return False, f"Invalid answer ID: {selected}"
        
        # Verify exactly 2 answers exist
        if len(valid_answer_ids) != 2:
            return False, "True/False questions must have exactly 2 answer options"
        
        return True, ""

    def grade(self, question: Any, response: Dict[str, Any]) -> Decimal:
        """
        Grade True/False response.
        
        Args:
            question: Question with answers prefetched
            response: {"selected": answer_id}
            
        Returns:
            Fraction 0.0 or 1.0
        """
        selected_id = str(response.get('selected', ''))
        
        if not selected_id:
            return Decimal('0.0')
        
        # Find the selected answer and return its fraction
        for answer in question.answers.all():
            if str(answer.id) == selected_id:
                return Decimal(str(answer.fraction))
        
        return Decimal('0.0')

    def get_correct_answer(self, question: Any) -> Dict[str, Any]:
        """
        Get correct answer for True/False.
        
        Returns:
            {
                "correct_id": answer_id with fraction 1.0,
                "correct_text": text of correct answer,
                "answers": [{id, text, is_correct}]
            }
        """
        correct_id = None
        correct_text = None
        all_answers = []
        
        for answer in question.answers.all():
            is_correct = answer.fraction == Decimal('1.0')
            
            answer_data = {
                'id': str(answer.id),
                'text': answer.answer_text,
                'is_correct': is_correct,
                'feedback': answer.feedback
            }
            all_answers.append(answer_data)
            
            if is_correct:
                correct_id = str(answer.id)
                correct_text = answer.answer_text
        
        return {
            'correct_id': correct_id,
            'correct_text': correct_text,
            'answers': all_answers
        }
