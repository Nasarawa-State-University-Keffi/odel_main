"""
Base Question Type - Abstract Strategy Pattern

All question type handlers must inherit from this base class.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from decimal import Decimal


class BaseQuestionType(ABC):
    """
    Abstract base class for question type plugins.
    
    Implements the Strategy pattern for handling different question types.
    Each concrete implementation provides type-specific validation and grading logic.
    """

    @abstractmethod
    def validate_response(self, question: Any, response: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate a student's response for this question type.
        
        Args:
            question: Question model instance
            response: Student response dictionary
            
        Returns:
            Tuple of (is_valid, error_message)
            
        Example:
            >>> handler.validate_response(question, {"selected": ["answer_id"]})
            (True, "")
        """
        pass

    @abstractmethod
    def grade(self, question: Any, response: Dict[str, Any]) -> Decimal:
        """
        Grade a student's response and return fraction (0.0 to 1.0).
        
        Args:
            question: Question model instance with answers relationship loaded
            response: Student response dictionary
            
        Returns:
            Decimal fraction between 0.0 and 1.0
            
        Example:
            >>> handler.grade(question, {"selected": [correct_answer_id]})
            Decimal('1.0')
        """
        pass

    @abstractmethod
    def get_correct_answer(self, question: Any) -> Dict[str, Any]:
        """
        Extract the correct answer(s) for display after grading.
        
        Args:
            question: Question model instance
            
        Returns:
            Dictionary representing correct answer(s)
            
        Example:
            >>> handler.get_correct_answer(question)
            {"correct_ids": ["uuid1", "uuid2"], "correct_texts": ["Option A", "Option B"]}
        """
        pass

    def get_feedback(self, question: Any, response: Dict[str, Any], fraction: Decimal) -> str:
        """
        Generate feedback based on the response and grade.
        Can be overridden by specific question types.
        
        Args:
            question: Question model instance
            response: Student response
            fraction: Grade fraction achieved
            
        Returns:
            Feedback string
        """
        if fraction >= Decimal('1.0'):
            return "Correct! " + question.general_feedback
        elif fraction > Decimal('0.0'):
            return f"Partially correct ({float(fraction) * 100:.0f}%). " + question.general_feedback
        else:
            return "Incorrect. " + question.general_feedback
