"""
Question Type Plugin System

This module implements a plugin architecture for different question types.
Each question type implements validation, grading, and answer extraction logic.
"""
from .base import BaseQuestionType
from .multichoice import MultipleChoiceQuestionType
from .truefalse import TrueFalseQuestionType
from .shortanswer import ShortAnswerQuestionType
from .essay import EssayQuestionType

# Plugin Registry
QUESTION_TYPE_REGISTRY = {
    'multichoice': MultipleChoiceQuestionType(),
    'truefalse': TrueFalseQuestionType(),
    'shortanswer': ShortAnswerQuestionType(),
    'essay': EssayQuestionType(),
}


def get_question_type_handler(qtype: str) -> BaseQuestionType:
    """
    Get the handler for a specific question type.
    
    Args:
        qtype: Question type identifier
        
    Returns:
        BaseQuestionType instance
        
    Raises:
        ValueError: If question type is not registered
    """
    if qtype not in QUESTION_TYPE_REGISTRY:
        raise ValueError(f"Unknown question type: {qtype}")
    return QUESTION_TYPE_REGISTRY[qtype]


__all__ = [
    'BaseQuestionType',
    'QUESTION_TYPE_REGISTRY',
    'get_question_type_handler',
]
