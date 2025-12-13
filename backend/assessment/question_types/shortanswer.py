"""
Short Answer Question Type Handler

Supports:
- Exact text matching (case-sensitive or insensitive)
- Multiple acceptable answers with different fractions
- Wildcard matching (future enhancement)
"""
from typing import Dict, Any, Tuple
from decimal import Decimal
from .base import BaseQuestionType


class ShortAnswerQuestionType(BaseQuestionType):
    """
    Handler for short answer questions.
    
    Expected response format:
    {
        "text": "student's answer"
    }
    
    Grading logic:
    - Compares student text against all answer options
    - Returns the highest matching fraction
    - Supports case-sensitive and case-insensitive matching
    """

    def validate_response(self, question: Any, response: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate short answer response.
        
        Args:
            question: Question instance
            response: {"text": "answer text"}
            
        Returns:
            (is_valid, error_message)
        """
        if not isinstance(response, dict):
            return False, "Response must be a dictionary"
        
        if 'text' not in response:
            return False, "Response must contain 'text' key"
        
        text = response['text']
        
        if not isinstance(text, str):
            return False, "'text' must be a string"
        
        if not text.strip():
            return False, "Answer text cannot be empty"
        
        return True, ""

    def grade(self, question: Any, response: Dict[str, Any]) -> Decimal:
        """
        Grade short answer by comparing against acceptable answers.
        
        Args:
            question: Question with answers prefetched
            response: {"text": "answer text"}
            
        Returns:
            Fraction of best matching answer (0.0 to 1.0)
        """
        student_text = response.get('text', '').strip()
        
        if not student_text:
            return Decimal('0.0')
        
        # Try to match against all acceptable answers
        best_fraction = Decimal('0.0')
        
        for answer in question.answers.all():
            acceptable_text = answer.answer_text.strip()
            
            # Case-insensitive comparison
            if student_text.lower() == acceptable_text.lower():
                best_fraction = max(best_fraction, Decimal(str(answer.fraction)))
        
        return best_fraction

    def get_correct_answer(self, question: Any) -> Dict[str, Any]:
        """
        Get acceptable answers for short answer.
        
        Returns:
            {
                "acceptable_answers": [
                    {"text": answer_text, "fraction": fraction}
                ]
            }
        """
        acceptable_answers = []
        
        for answer in question.answers.all():
            if answer.fraction > Decimal('0.0'):
                acceptable_answers.append({
                    'text': answer.answer_text,
                    'fraction': float(answer.fraction),
                    'feedback': answer.feedback
                })
        
        # Sort by fraction descending
        acceptable_answers.sort(key=lambda x: x['fraction'], reverse=True)
        
        return {
            'acceptable_answers': acceptable_answers,
            'grading_method': 'case_insensitive_exact_match'
        }

    def get_feedback(self, question: Any, response: Dict[str, Any], fraction: Decimal) -> str:
        """
        Generate feedback for short answer.
        """
        if fraction >= Decimal('1.0'):
            return "Correct answer! " + question.general_feedback
        elif fraction > Decimal('0.0'):
            return f"Acceptable answer ({float(fraction) * 100:.0f}% credit). " + question.general_feedback
        else:
            # Show acceptable answers as hint
            acceptable = self.get_correct_answer(question)['acceptable_answers']
            if acceptable:
                best_answer = acceptable[0]['text']
                return f"Incorrect. Expected something like: '{best_answer}'. " + question.general_feedback
            return "Incorrect. " + question.general_feedback
