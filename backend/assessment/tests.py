"""
Comprehensive tests for Moodle-style Quiz System

Tests cover:
- Question type plugins (multichoice, truefalse, shortanswer, essay)
- Question and Quiz services
- REST API endpoints
- Grading logic and partial credit
- Multiple attempts
- Manual grading

CORRECTED VERSION - All tests should pass
"""
import uuid
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from portal_auth.models import PortalUser
from courses.models import CourseCache, StudentRegisteredCourse, StaffAssignedCourse
from .models import (
    QuestionCategory, Question, QuestionAnswer,
    Quiz, QuizQuestion, QuizAttempt, QuestionAttempt,
    Assignment, AssignmentSubmission
)
from .services import QuizService, QuestionService
from .question_types import get_question_type_handler


class QuestionTypePluginTests(TestCase):
    """Test question type plugin system"""
    
    def setUp(self):
        """Create test course and category"""
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='TEST101'
        )
        self.category = QuestionCategory.objects.create(
            course=self.course,
            name='Test Category'
        )
    
    def test_multiple_choice_single_correct(self):
        """Test multiple choice with single correct answer"""
        question = Question.objects.create(
            category=self.category,
            qtype='multichoice',
            name='Python Variables',
            question_text='Which is a valid Python variable?',
            default_mark=Decimal('10.00')
        )
        
        # Create answers
        correct = QuestionAnswer.objects.create(
            question=question,
            answer_text='my_var',
            fraction=Decimal('1.0'),
            order=1
        )
        QuestionAnswer.objects.create(
            question=question,
            answer_text='2nd_var',
            fraction=Decimal('0.0'),
            order=2
        )
        
        handler = get_question_type_handler('multichoice')
        
        # Test correct answer
        response = {'selected': [str(correct.id)]}
        is_valid, _ = handler.validate_response(question, response)
        self.assertTrue(is_valid)
        
        fraction = handler.grade(question, response)
        self.assertEqual(fraction, Decimal('1.0'))
    
    def test_multiple_choice_partial_credit(self):
        """Test multiple choice with partial credit"""
        question = Question.objects.create(
            category=self.category,
            qtype='multichoice',
            name='Python Data Types',
            question_text='Which are mutable in Python?',
            default_mark=Decimal('10.00')
        )
        
        # Create answers with partial credit
        ans1 = QuestionAnswer.objects.create(
            question=question,
            answer_text='list',
            fraction=Decimal('0.5'),
            order=1
        )
        ans2 = QuestionAnswer.objects.create(
            question=question,
            answer_text='dict',
            fraction=Decimal('0.5'),
            order=2
        )
        QuestionAnswer.objects.create(
            question=question,
            answer_text='tuple',
            fraction=Decimal('0.0'),
            order=3
        )
        
        handler = get_question_type_handler('multichoice')
        
        # Test selecting one correct answer (50%)
        response = {'selected': [str(ans1.id)]}
        fraction = handler.grade(question, response)
        self.assertEqual(fraction, Decimal('0.5'))
        
        # Test selecting both correct answers (100%)
        response = {'selected': [str(ans1.id), str(ans2.id)]}
        fraction = handler.grade(question, response)
        self.assertEqual(fraction, Decimal('1.0'))
    
    def test_true_false_question(self):
        """Test true/false question type"""
        question = Question.objects.create(
            category=self.category,
            qtype='truefalse',
            name='Python Is Compiled',
            question_text='Python is a compiled language',
            default_mark=Decimal('5.00')
        )
        
        # Create True/False answers
        false_ans = QuestionAnswer.objects.create(
            question=question,
            answer_text='False',
            fraction=Decimal('1.0'),
            order=1
        )
        true_ans = QuestionAnswer.objects.create(
            question=question,
            answer_text='True',
            fraction=Decimal('0.0'),
            order=2
        )
        
        handler = get_question_type_handler('truefalse')
        
        # Test correct answer (False)
        response = {'selected': str(false_ans.id)}
        is_valid, _ = handler.validate_response(question, response)
        self.assertTrue(is_valid)
        fraction = handler.grade(question, response)
        self.assertEqual(fraction, Decimal('1.0'))
        
        # Test incorrect answer (True)
        response = {'selected': str(true_ans.id)}
        fraction = handler.grade(question, response)
        self.assertEqual(fraction, Decimal('0.0'))
    
    def test_short_answer_case_insensitive(self):
        """Test short answer with case-insensitive matching"""
        question = Question.objects.create(
            category=self.category,
            qtype='shortanswer',
            name='Capital of France',
            question_text='What is the capital of France?',
            default_mark=Decimal('5.00')
        )
        
        # Create acceptable answers
        QuestionAnswer.objects.create(
            question=question,
            answer_text='Paris',
            fraction=Decimal('1.0'),
            order=1
        )
        QuestionAnswer.objects.create(
            question=question,
            answer_text='paris',
            fraction=Decimal('1.0'),
            order=2
        )
        
        handler = get_question_type_handler('shortanswer')
        
        # Test various case variations
        for answer in ['Paris', 'PARIS', 'paris', 'PaRiS']:
            response = {'text': answer}
            is_valid, _ = handler.validate_response(question, response)
            self.assertTrue(is_valid)
            fraction = handler.grade(question, response)
            self.assertEqual(fraction, Decimal('1.0'), f'Failed for: {answer}')
        
        # Test incorrect answer
        response = {'text': 'London'}
        fraction = handler.grade(question, response)
        self.assertEqual(fraction, Decimal('0.0'))
    
    def test_essay_requires_manual_grading(self):
        """Test essay question returns None for auto-grading"""
        question = Question.objects.create(
            category=self.category,
            qtype='essay',
            name='Python Benefits',
            question_text='Explain the benefits of Python',
            default_mark=Decimal('20.00')
        )
        
        handler = get_question_type_handler('essay')
        
        response = {'text': 'Python is great because...'}
        is_valid, _ = handler.validate_response(question, response)
        self.assertTrue(is_valid)
        
        # Essay should return None (requires manual grading)
        fraction = handler.grade(question, response)
        self.assertIsNone(fraction)


class QuestionServiceTests(TestCase):
    """Test QuestionService business logic"""
    
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
    
    def test_validate_question_type(self):
        """Test question type validation"""
        self.assertTrue(QuestionService.validate_question_type('multichoice'))
        self.assertTrue(QuestionService.validate_question_type('truefalse'))
        self.assertTrue(QuestionService.validate_question_type('shortanswer'))
        self.assertTrue(QuestionService.validate_question_type('essay'))
        self.assertFalse(QuestionService.validate_question_type('invalid'))
    
    def test_grade_question(self):
        """Test question grading through service"""
        question = Question.objects.create(
            category=self.category,
            qtype='shortanswer',
            name='Test Question',
            question_text='What is 2+2?',
            default_mark=Decimal('10.00')
        )
        
        QuestionAnswer.objects.create(
            question=question,
            answer_text='4',
            fraction=Decimal('1.0'),
            order=1
        )
        
        response = {'text': '4'}
        fraction, score = QuestionService.grade_question(question, response)
        
        self.assertEqual(fraction, Decimal('1.0'))
        self.assertEqual(score, Decimal('10.00'))
    
    def test_get_correct_answer(self):
        """Test retrieving correct answer"""
        question = Question.objects.create(
            category=self.category,
            qtype='multichoice',
            name='Test Question',
            question_text='Select correct',
            default_mark=Decimal('10.00')
        )
        
        correct = QuestionAnswer.objects.create(
            question=question,
            answer_text='Correct Answer',
            fraction=Decimal('1.0'),
            order=1
        )
        
        result = QuestionService.get_correct_answer(question)
        # The service returns 'answers' not 'correct_answers'
        self.assertIn('answers', result)
        self.assertEqual(len(result['correct_ids']), 1)
        # Find the correct answer in the answers list
        correct_answer = [a for a in result['answers'] if a['fraction'] == 1.0][0]
        self.assertEqual(correct_answer['text'], 'Correct Answer')


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
        
        # Create quiz
        self.quiz = Quiz.objects.create(
            course=self.course,
            name='Test Quiz',
            time_limit=3600,
            max_grade=Decimal('100.00'),
            max_attempts=3
        )
        
        # Create question
        self.question = Question.objects.create(
            category=self.category,
            qtype='shortanswer',
            name='Test Question',
            question_text='What is 2+2?',
            default_mark=Decimal('10.00')
        )
        
        QuestionAnswer.objects.create(
            question=self.question,
            answer_text='4',
            fraction=Decimal('1.0'),
            order=1
        )
        
        # Link question to quiz
        QuizQuestion.objects.create(
            quiz=self.quiz,
            question=self.question,
            order=1,
            max_mark=Decimal('10.00')
        )
    
    def test_start_attempt(self):
        """Test starting a quiz attempt"""
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id='student_1'
        )
        
        self.assertIsNotNone(attempt)
        self.assertEqual(attempt.state, 'in_progress')
        self.assertEqual(attempt.attempt_number, 1)
        
        # Verify question attempts were created
        question_attempts = attempt.question_attempts.all()
        self.assertEqual(question_attempts.count(), 1)
    
    def test_max_attempts_enforcement(self):
        """Test that max attempts is enforced"""
        user_id = 'student@test.com'
        
        # Create and finish 3 attempts (must finish to allow new attempts)
        for i in range(3):
            attempt = QuizService.start_attempt(quiz=self.quiz, user_external_id=user_id)
            QuizService.finish_attempt(attempt)
        
        # 4th attempt should fail
        with self.assertRaises(ValidationError) as context:
            QuizService.start_attempt(quiz=self.quiz, user_external_id=user_id)
        
        self.assertIn('Maximum attempts', str(context.exception))
    
    def test_submit_response(self):
        """Test submitting a response"""
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id='student_1'
        )
        
        response = {'text': '4'}
        question_attempt = QuizService.submit_response(
            attempt=attempt,
            question=self.question,
            response=response
        )
        
        self.assertIsNotNone(question_attempt)
        self.assertEqual(question_attempt.fraction, Decimal('1.0'))
        self.assertEqual(question_attempt.score, Decimal('10.00'))
        self.assertIsNotNone(question_attempt.graded_at)
    
    def test_finish_attempt(self):
        """Test finishing a quiz attempt"""
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id='student_1'
        )
        
        # Submit response
        QuizService.submit_response(
            attempt=attempt,
            question=self.question,
            response={'text': '4'}
        )
        
        # Finish attempt
        QuizService.finish_attempt(attempt)
        
        attempt.refresh_from_db()
        self.assertEqual(attempt.state, 'finished')
        self.assertIsNotNone(attempt.finished_at)
        # Score: 10 out of 10 possible = 100%, scaled to max_grade of 100
        self.assertEqual(attempt.total_score, Decimal('100.00'))
    
    def test_calculate_final_grade(self):
        """Test final grade calculation"""
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id='student_1'
        )
        
        # Submit correct response
        QuizService.submit_response(
            attempt=attempt,
            question=self.question,
            response={'text': '4'}
        )
        
        # calculate_final_grade returns the score but doesn't save it
        final_score = QuizService.calculate_final_grade(attempt)
        
        # Score: 10 out of 10 possible = 100%, scaled to max_grade of 100
        self.assertEqual(final_score, Decimal('100.00'))
    
    def test_get_attempt_summary(self):
        """Test attempt summary statistics"""
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id='student_1'
        )
        
        QuizService.submit_response(
            attempt=attempt,
            question=self.question,
            response={'text': '4'}
        )
        
        summary = QuizService.get_attempt_summary(attempt)
        
        self.assertIn('total_questions', summary)
        self.assertIn('answered_questions', summary)
        self.assertIn('graded_questions', summary)
        self.assertIn('total_score', summary)
        self.assertEqual(summary['total_questions'], 1)
        self.assertEqual(summary['answered_questions'], 1)
        self.assertEqual(summary['graded_questions'], 1)


class QuizAPITests(APITestCase):
    """Test Quiz REST API endpoints"""
    
    def setUp(self):
        # Create test users
        self.instructor = PortalUser.objects.create(
            external_id='instructor_1',
            full_name='Instructor One',
            is_staff=True
        )
        self.student = PortalUser.objects.create(
            external_id='student_1',
            full_name='Student One'
        )
        
        # Create test data
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='TEST101'
        )
        
        # Setup enrollments
        StaffAssignedCourse.objects.create(
            staff_external_id=self.instructor.external_id,
            course=self.course,
            role='instructor'
        )
        StudentRegisteredCourse.objects.create(
            student_external_id=self.student.external_id,
            course=self.course,
            session='2025/2026',
            semester='First Semester'
        )
        
        self.category = QuestionCategory.objects.create(
            course=self.course,
            name='Test Category'
        )
        
        self.question = Question.objects.create(
            category=self.category,
            qtype='shortanswer',
            name='Test Question',
            question_text='What is 2+2?',
            default_mark=Decimal('10.00')
        )
        
        QuestionAnswer.objects.create(
            question=self.question,
            answer_text='4',
            fraction=Decimal('1.0'),
            order=1
        )
        
        self.quiz = Quiz.objects.create(
            course=self.course,
            name='Test Quiz',
            time_limit=3600,
            max_grade=Decimal('100.00'),
            max_attempts=3
        )
        
        QuizQuestion.objects.create(
            quiz=self.quiz,
            question=self.question,
            order=1,
            max_mark=Decimal('10.00')
        )
        
        self.client = APIClient()
    
    def test_list_quizzes(self):
        """Test listing quizzes"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/student/assessment/quizzes/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Quiz')
    
    def test_create_quiz_instructor_only(self):
        """Test that only instructors can create quizzes"""
        # Student should not be able to create
        self.client.force_authenticate(user=self.student)
        data = {
            'course_id': str(self.course.course_external_id),
            'name': 'New Quiz',
            'max_grade': '100.00'
        }
        response = self.client.post('/api/staff/assessment/quizzes/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Instructor should be able to create
        self.client.force_authenticate(user=self.instructor)
        response = self.client.post('/api/staff/assessment/quizzes/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_start_quiz_attempt(self):
        """Test starting a quiz attempt via API"""
        self.client.force_authenticate(user=self.student)
        
        data = {'user_external_id': self.student.external_id}
        response = self.client.post(
            f'/api/student/assessment/quizzes/{self.quiz.id}/start/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['state'], 'in_progress')
    
    def test_submit_response_via_api(self):
        """Test submitting a question response via API"""
        self.client.force_authenticate(user=self.student)
        
        # Start attempt
        start_response = self.client.post(
            f'/api/student/assessment/quizzes/{self.quiz.id}/start/',
            {'user_external_id': self.student.external_id},
            format='json'
        )
        attempt_id = start_response.data['id']
        
        # Submit response
        data = {
            'question_id': str(self.question.id),
            'response': {'text': '4'}
        }
        response = self.client.post(
            f'/api/student/assessment/quizzes/{self.quiz.id}/attempts/{attempt_id}/submit/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(float(response.data['fraction']), 1.0)
        self.assertEqual(float(response.data['score']), 10.0)
    
    def test_finish_quiz_attempt(self):
        """Test finishing a quiz attempt via API"""
        self.client.force_authenticate(user=self.student)
        
        # Start attempt
        start_response = self.client.post(
            f'/api/student/assessment/quizzes/{self.quiz.id}/start/',
            {'user_external_id': self.student.external_id},
            format='json'
        )
        attempt_id = start_response.data['id']
        
        # Submit response
        self.client.post(
            f'/api/student/assessment/quizzes/{self.quiz.id}/attempts/{attempt_id}/submit/',
            {
                'question_id': str(self.question.id),
                'response': {'text': '4'}
            },
            format='json'
        )
        
        # Finish attempt
        response = self.client.post(
            f'/api/student/assessment/quizzes/{self.quiz.id}/attempts/{attempt_id}/finish/',
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['state'], 'finished')
        self.assertIsNotNone(response.data['finished_at'])
    
    def test_list_quiz_attempts(self):
        """Test listing quiz attempts"""
        self.client.force_authenticate(user=self.student)
        
        # Create an attempt
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id=self.student.external_id
        )
        
        response = self.client.get('/api/student/assessment/attempts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], str(attempt.id))
    
    def test_manual_grading(self):
        """Test manual grading via API (instructor only)"""
        # Create essay question
        essay_question = Question.objects.create(
            category=self.category,
            qtype='essay',
            name='Essay Question',
            question_text='Explain Python',
            default_mark=Decimal('20.00')
        )
        
        QuizQuestion.objects.create(
            quiz=self.quiz,
            question=essay_question,
            order=2,
            max_mark=Decimal('20.00')
        )
        
        # Student starts attempt and submits essay
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id=self.student.external_id
        )
        
        question_attempt = QuizService.submit_response(
            attempt=attempt,
            question=essay_question,
            response={'text': 'Python is great because...'}
        )
        
        # Instructor grades the essay
        self.client.force_authenticate(user=self.instructor)
        data = {
            'fraction': '0.85',
            'feedback': 'Good work, but missing some points'
        }
        response = self.client.post(
            f'/api/staff/assessment/attempts/{attempt.id}/questions/{question_attempt.id}/grade/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(float(response.data['fraction']), 0.85)
    
    def test_student_cannot_manual_grade(self):
        """Test that students cannot manually grade"""
        attempt = QuizService.start_attempt(
            quiz=self.quiz,
            user_external_id=self.student.external_id
        )
        
        question_attempt = attempt.question_attempts.first()
        
        self.client.force_authenticate(user=self.student)
        data = {'fraction': '1.0', 'feedback': 'Perfect'}
        response = self.client.post(
            f'/api/staff/assessment/attempts/{attempt.id}/questions/{question_attempt.id}/grade/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class QuestionAPITests(APITestCase):
    """Test Question Bank API endpoints"""
    
    def setUp(self):
        self.instructor = PortalUser.objects.create(
            external_id='instructor_1',
            full_name='Instructor One',
            is_staff=True
        )
        self.student = PortalUser.objects.create(
            external_id='student_1',
            full_name='Student One'
        )
        
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='TEST101'
        )
        
        # Setup enrollments
        StaffAssignedCourse.objects.create(
            staff_external_id=self.instructor.external_id,
            course=self.course,
            role='instructor'
        )
        
        self.category = QuestionCategory.objects.create(
            course=self.course,
            name='Test Category'
        )
        
        self.client = APIClient()
    
    def test_create_question_with_answers(self):
        """Test creating a question with nested answers"""
        self.client.force_authenticate(user=self.instructor)
        
        data = {
            'category': str(self.category.id),
            'qtype': 'multichoice',
            'name': 'Python Variables',
            'question_text': 'Which are valid Python variables?',
            'default_mark': '10.00',
            'answers': [
                {'answer_text': 'my_var', 'fraction': '0.5', 'order': 1},
                {'answer_text': '_private', 'fraction': '0.5', 'order': 2},
                {'answer_text': '2nd_var', 'fraction': '0.0', 'order': 3}
            ]
        }
        
        response = self.client.post(
            '/api/staff/assessment/question-bank/questions/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify answers were created
        question_id = response.data['id']
        question = Question.objects.get(id=question_id)
        self.assertEqual(question.answers.count(), 3)
    
    def test_student_cannot_create_question(self):
        """Test that students cannot create questions"""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'category': str(self.category.id),
            'qtype': 'shortanswer',
            'name': 'Test',
            'question_text': 'Test?',
            'default_mark': '5.00'
        }
        
        response = self.client.post(
            '/api/staff/assessment/question-bank/questions/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_questions_filtered_by_category(self):
        """Test filtering questions by category"""
        self.client.force_authenticate(user=self.instructor)
        
        # Create questions in different categories
        category2 = QuestionCategory.objects.create(
            course=self.course,
            name='Category 2'
        )
        
        Question.objects.create(
            category=self.category,
            qtype='shortanswer',
            name='Q1',
            question_text='Test 1',
            default_mark=Decimal('5.00')
        )
        
        Question.objects.create(
            category=category2,
            qtype='shortanswer',
            name='Q2',
            question_text='Test 2',
            default_mark=Decimal('5.00')
        )
        
        # Filter by category
        response = self.client.get(
            f'/api/staff/assessment/question-bank/questions/?category={self.category.id}'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Q1')


class IntegrationTests(TestCase):
    """End-to-end integration tests"""
    
    def test_complete_quiz_workflow(self):
        """Test complete quiz workflow from creation to completion"""
        # Setup
        course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='TEST101'
        )
        
        category = QuestionCategory.objects.create(
            course=course,
            name='Math'
        )
        
        # Create multiple questions
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
        
        # Create quiz
        quiz = Quiz.objects.create(
            course=course,
            name='Math Quiz',
            max_grade=Decimal('100.00'),
            max_attempts=2
        )
        
        QuizQuestion.objects.create(
            quiz=quiz,
            question=q1,
            order=1,
            max_mark=Decimal('10.00')
        )
        
        QuizQuestion.objects.create(
            quiz=quiz,
            question=q2,
            order=2,
            max_mark=Decimal('10.00')
        )
        
        # Student starts quiz
        attempt = QuizService.start_attempt(
            quiz=quiz,
            user_external_id='student_1'
        )
        
        self.assertEqual(attempt.state, 'in_progress')
        self.assertEqual(attempt.question_attempts.count(), 2)
        
        # Student answers question 1 correctly
        qa1 = QuizService.submit_response(
            attempt=attempt,
            question=q1,
            response={'text': '4'}
        )
        self.assertEqual(qa1.fraction, Decimal('1.0'))
        self.assertEqual(qa1.score, Decimal('10.00'))
        
        # Student answers question 2 partially (only one correct)
        qa2 = QuizService.submit_response(
            attempt=attempt,
            question=q2,
            response={'selected': [str(ans1.id)]}
        )
        self.assertEqual(qa2.fraction, Decimal('0.5'))
        self.assertEqual(qa2.score, Decimal('5.00'))
        
        # Student finishes quiz
        QuizService.finish_attempt(attempt)
        
        attempt.refresh_from_db()
        self.assertEqual(attempt.state, 'finished')
        # Score: 15 out of 20 possible = 75%, scaled to max_grade of 100
        self.assertEqual(attempt.total_score, Decimal('75.00'))
        
        # Verify summary
        summary = QuizService.get_attempt_summary(attempt)
        self.assertEqual(summary['total_questions'], 2)
        self.assertEqual(summary['answered_questions'], 2)
        # Score is scaled to max_grade: 15/20 = 75%
        self.assertEqual(summary['total_score'], 75.0)


class ExportAPITests(APITestCase):
    """Test case for exporting assignment and quiz scores as CSV files."""
    
    def setUp(self):
        self.instructor = PortalUser.objects.create(
            external_id='instructor_1',
            full_name='Instructor One',
            is_staff=True
        )
        self.other_instructor = PortalUser.objects.create(
            external_id='instructor_2',
            full_name='Instructor Two',
            is_staff=True
        )
        self.student = PortalUser.objects.create(
            external_id='student_1',
            full_name='Student One',
            email='student1@test.com'
        )
        
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='TEST101'
        )
        
        # Instructor is assigned to course, but other_instructor is not.
        StaffAssignedCourse.objects.create(
            staff_external_id=self.instructor.external_id,
            course=self.course,
            role='instructor'
        )
        
        # Student is registered for course
        StudentRegisteredCourse.objects.create(
            student_external_id=self.student.external_id,
            course=self.course,
            session='2025/2026',
            semester='First Semester'
        )
        
        self.assignment = Assignment.objects.create(
            course=self.course,
            title='Test Assignment',
            description='Test Description',
            open_at=timezone.now(),
            due_at=timezone.now() + timezone.timedelta(days=1),
            max_marks=Decimal('10.00'),
            created_by=self.instructor
        )
        
        self.quiz = Quiz.objects.create(
            course=self.course,
            name='Test Quiz',
            max_grade=Decimal('100.00')
        )
        
        self.client = APIClient()

    def test_assignment_export_csv_authorized(self):
        """Test that an authorized instructor can download the assignment scores CSV."""
        # Create a submission for the student
        sub = AssignmentSubmission.objects.create(
            assignment=self.assignment,
            student_external_id=self.student.external_id,
            attempt_number=1,
            status='graded',
            marks=Decimal('8.50'),
            submitted_at=timezone.now(),
            graded_at=timezone.now()
        )
        
        self.client.force_authenticate(user=self.instructor)
        response = self.client.get(f'/api/staff/assessment/assignments/{self.assignment.id}/export/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn(f"attachment; filename=\"assignment_Test_Assignment_scores.csv\"", response['Content-Disposition'])
        
        # Check CSV content
        content = response.content.decode('utf-8')
        lines = content.split('\r\n')
        self.assertTrue(len(lines) >= 2)
        self.assertIn('Student ID,Student Name,Student Email,Submission Status,Attempt Number,Submitted At,Score,Max Marks,Percentage', lines[0])
        self.assertIn('student_1,Student One,student1@test.com,Graded,1', content)
        self.assertIn('8.5,10.0,85.0', content)

    def test_assignment_export_csv_unauthorized(self):
        """Test that students or unassigned instructors are forbidden to download the assignment scores CSV."""
        # Test student forbidden
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/staff/assessment/assignments/{self.assignment.id}/export/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test unassigned instructor forbidden
        self.client.force_authenticate(user=self.other_instructor)
        response = self.client.get(f'/api/staff/assessment/assignments/{self.assignment.id}/export/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_quiz_export_csv_authorized(self):
        """Test that an authorized instructor can download the quiz scores CSV."""
        # Create a quiz attempt for the student
        attempt = QuizAttempt.objects.create(
            quiz=self.quiz,
            user_external_id=self.student.external_id,
            attempt_number=1,
            state='finished',
            started_at=timezone.now(),
            finished_at=timezone.now(),
            total_score=Decimal('90.00')
        )
        
        self.client.force_authenticate(user=self.instructor)
        response = self.client.get(f'/api/staff/assessment/quizzes/{self.quiz.id}/export/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn(f"attachment; filename=\"quiz_Test_Quiz_scores.csv\"", response['Content-Disposition'])
        
        # Check CSV content
        content = response.content.decode('utf-8')
        lines = content.split('\r\n')
        self.assertTrue(len(lines) >= 2)
        self.assertIn('Student ID,Student Name,Student Email,Attempt State,Total Attempts,Best Attempt Number,Score,Max Grade,Percentage,Finished At', lines[0])
        self.assertIn('student_1,Student One,student1@test.com,Finished,1,1,90.0,100.0,90.0', content)

    def test_quiz_export_csv_unauthorized(self):
        """Test that students or unassigned instructors are forbidden to download the quiz scores CSV."""
        # Test student forbidden
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/staff/assessment/quizzes/{self.quiz.id}/export/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test unassigned instructor forbidden
        self.client.force_authenticate(user=self.other_instructor)
        response = self.client.get(f'/api/staff/assessment/quizzes/{self.quiz.id}/export/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
