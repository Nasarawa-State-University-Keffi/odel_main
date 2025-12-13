"""
Essay Question Type Handler

Essays require manual grading by instructors.
This handler validates the response but returns null for automatic grading.
"""
from typing import Dict, Any, Tuple
from decimal import Decimal
from .base import BaseQuestionType


class EssayQuestionType(BaseQuestionType):
    """
    Handler for essay questions.
    
    Expected response format:
    {
        "text": "long-form essay answer"
    }
    
    Grading logic:
    - Cannot be automatically graded
    - Returns None for fraction
    - Requires manual grading by instructor
    """

    def validate_response(self, question: Any, response: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate essay response.
        
        Args:
            question: Question instance
            response: {"text": "essay text"}
            
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
        
        # Allow empty essays (student may choose not to answer)
        # Validation just checks structure, not content quality
        
        return True, ""

    def grade(self, question: Any, response: Dict[str, Any]) -> Decimal:
        """
        Essay questions cannot be automatically graded.
        
        Args:
            question: Question instance
            response: {"text": "essay text"}
            
        Returns:
            None - indicates manual grading required
        """
        # Return None to indicate manual grading needed
        # This will be stored as NULL in the database
        return None

    def get_correct_answer(self, question: Any) -> Dict[str, Any]:
        """
        Essays don't have a single correct answer.
        Returns model answer or grading rubric if available.
        
        Returns:
            {
                "requires_manual_grading": True,
                "model_answer": answer_text from first answer (if exists),
                "grading_notes": feedback from answers
            }
        """
        # Essay questions may have a model answer stored as the first "answer"
        model_answer = None
        grading_notes = []
        
        for answer in question.answers.all():
            if not model_answer:
                model_answer = answer.answer_text
            if answer.feedback:
                grading_notes.append(answer.feedback)
        
        return {
            'requires_manual_grading': True,
            'model_answer': model_answer,
            'grading_notes': grading_notes,
            'max_mark': float(question.default_mark)
        }

    def get_feedback(self, question: Any, response: Dict[str, Any], fraction: Decimal) -> str:
        """
        Generate feedback for essay.
        """
        if fraction is None:
            return "Your essay has been submitted and is awaiting manual grading by your instructor."
        
        # If manually graded
        if fraction >= Decimal('1.0'):
            return f"Excellent work! Full marks. {question.general_feedback}"
        elif fraction >= Decimal('0.7'):
            return f"Good work ({float(fraction) * 100:.0f}%). {question.general_feedback}"
        elif fraction >= Decimal('0.5'):
            return f"Satisfactory ({float(fraction) * 100:.0f}%). {question.general_feedback}"
        else:
            return f"Needs improvement ({float(fraction) * 100:.0f}%). {question.general_feedback}"
