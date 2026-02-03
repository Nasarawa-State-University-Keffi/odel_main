"""
Moodle-style Quiz System Tests

Focused tests for core functionality that match the actual implementation.
"""
import uuid
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from portal_auth.models import PortalUser
from courses.models import CourseCache, StudentRegisteredCourse, StaffAssignedCourse
from .models import (
    QuestionCategory, Question, QuestionAnswer,
    Quiz, QuizQuestion, QuizAttempt, QuestionAttempt
)
from .services import QuizService, QuestionService
from .question_types import get_question_type_handler


class QuestionPluginTests(TestCase):
    """Test question type plugins work correctly"""
    
    def setUp(self):
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='TEST101'
        )
        self.category = QuestionCategory.objects.create(
            course=self.course,
            name='Test Category'
        )
    
    def test_multiple_choice_grading(self):
        """Test multiple choice question grading"""
        question = Question.objects.create(
            category=self.category,
            qtype='multichoice',
            name='Python Variables',
            question_text='Which is valid?',
            default_mark=Decimal('10.00')
        )
        
        correct = QuestionAnswer.objects.create(
            question=question,
            answer_text='my_var',
            fraction=Decimal('1.0'),
            order=1
        )
        wrong = QuestionAnswer.objects.create(
            question=question,
            answer_text='2nd_var',
            fraction=Decimal('0.0'),
            order=2
        )
        
        handler = get_question_type_handler('multichoice')
        
        # Test correct answer
        response = {'selected': [str(correct.id)]}
        fraction = handler.grade(question, response)
        self.assertEqual(fraction, Decimal('1.0'))
        
        # Test wrong answer  
        response = {'selected': [str(wrong.id)]}
        fraction = handler.grade(question, response)
        self.assertEqual(fraction, Decimal('0.0'))
    
    def test_short_answer_case_insensitive(self):
        """Test short answer matching is case insensitive"""
        question = Question.objects.create(
            category=self.category,
            qtype='shortanswer',
            name='Capital',
            question_text='Capital of France?',
            default_mark=Decimal('5.00')
        )
        
        QuestionAnswer.objects.create(
            question=question,
            answer_text='Paris',
            fraction=Decimal('1.0'),
            order=1
        )
        
        handler = get_question_type_handler('shortanswer')
        
        for text in ['Paris', 'paris', 'PARIS', 'PaRiS']:
            response = {'text': text}
            fraction = handler.grade(question, response)
            self.assertEqual(fraction, Decimal('1.0'), f'Failed for: {text}')


class QuizServiceTests(TestCase):
    """Test QuizService business logic"""
    
    def setUp(self):
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='TEST101'
        )
        self.category = QuestionCategory.objects.create(
            course=self.course,
            name='Test Category'
        )
        
        self.quiz = Quiz.objects.create(
            course=self.course,
            name='Test Quiz',
            max_grade=Decimal('100.00'),
            max_attempts=3
        )
        
        self.question = Question.objects.create(
            category=self.category,
            qtype='shortanswer',
            name='Addition',
            question_text='What is 2+2?',
            default_mark=Decimal('10.00')
        )
        
        QuestionAnswer.objects.create(
            question=self.question,
            answer_text='4',
            fraction=Decimal('1.0'),
            order=1
        )
        
        QuizQuestion.objects.create(
            quiz=self.quiz,
            question=self.question,
            order=1,
            max_mark=Decimal('10.00')
        )
    
    def test_start_attempt_creates_question_attempts(self):
        """Test that starting creates question attempts"""
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id='student@test.com'
        )
        
        self.assertEqual(attempt.state, 'in_progress')
        self.assertEqual(attempt.attempt_number, 1)
        self.assertEqual(attempt.question_attempts.count(), 1)
    
    def test_submit_and_grade_response(self):
        """Test submitting response and automatic grading"""
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id='student@test.com'
        )
        
        response = {'text': '4'}
        question_attempt = QuizService.submit_response(
            attempt=attempt,
            question=self.question,
            response=response
        )
        
        self.assertEqual(question_attempt.fraction, Decimal('1.0'))
        self.assertEqual(question_attempt.score, Decimal('10.00'))
        self.assertIsNotNone(question_attempt.graded_at)
    
    def test_finish_attempt_calculates_grade(self):
        """Test finishing attempt calculates total score"""
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id='student@test.com'
        )
        
        QuizService.submit_response(
            attempt=attempt,
            question=self.question,
            response={'text': '4'}
        )
        
        QuizService.finish_attempt(attempt)
        
        attempt.refresh_from_db()
        self.assertEqual(attempt.state, 'finished')
        self.assertIsNotNone(attempt.finished_at)
        # Score: 10 out of 10 possible = 100%, scaled to max_grade of 100
        self.assertEqual(attempt.total_score, Decimal('100.00'))


class QuizWorkflowIntegrationTest(TestCase):
    """Test complete quiz workflow end-to-end"""
    
    def test_complete_quiz_lifecycle(self):
        """Test full quiz workflow from creation to completion"""
        # Setup
        course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Math Course',
            course_code='MATH101'
        )
        
        category = QuestionCategory.objects.create(
            course=course,
            name='Arithmetic'
        )
        
        # Create quiz
        quiz = Quiz.objects.create(
            course=course,
            name='Math Quiz',
            max_grade=Decimal('100.00')
        )
        
        # Create question 1
        q1 = Question.objects.create(
            category=category,
            qtype='shortanswer',
            name='Addition',
            question_text='What is 2+2?',
            default_mark=Decimal('10.00')
        )
        QuestionAnswer.objects.create(
            question=q1,
            answer_text='4',
            fraction=Decimal('1.0'),
            order=1
        )
        
        # Create question 2
        q2 = Question.objects.create(
            category=category,
            qtype='multichoice',
            name='Even Numbers',
            question_text='Which are even?',
            default_mark=Decimal('10.00')
        )
        ans1 = QuestionAnswer.objects.create(
            question=q2,
            answer_text='2',
            fraction=Decimal('0.5'),
            order=1
        )
        ans2 = QuestionAnswer.objects.create(
            question=q2,
            answer_text='4',
            fraction=Decimal('0.5'),
            order=2
        )
        QuestionAnswer.objects.create(
            question=q2,
            answer_text='3',
            fraction=Decimal('0.0'),
            order=3
        )
        
        # Add questions to quiz
        QuizQuestion.objects.create(quiz=quiz, question=q1, order=1, max_mark=Decimal('10.00'))
        QuizQuestion.objects.create(quiz=quiz, question=q2, order=2, max_mark=Decimal('10.00'))
        
        # Student takes quiz
        attempt = QuizService.start_attempt(quiz=quiz, user_external_id='student@test.com')
        self.assertEqual(attempt.question_attempts.count(), 2)
        
        # Answer question 1 correctly
        QuizService.submit_response(attempt=attempt, question=q1, response={'text': '4'})
        
        # Answer question 2 partially
        QuizService.submit_response(attempt=attempt, question=q2, response={'selected': [str(ans1.id)]})
        
        # Finish quiz
        QuizService.finish_attempt(attempt)
        
        attempt.refresh_from_db()
        self.assertEqual(attempt.state, 'finished')
        # Score: 15 out of 20 possible = 75%, scaled to max_grade of 100
        self.assertEqual(attempt.total_score, Decimal('75.00'))


print("Quiz tests created successfully!")
print(f"{QuestionPluginTests.__name__}: 2 tests")
print(f"{QuizServiceTests.__name__}: 3 tests") 
print(f"{QuizWorkflowIntegrationTest.__name__}: 1 test")
print("Total: 6 core tests")
