from quiz_engine import QuizEngine
import unittest

class TestQuizEngine(unittest.TestCase):
    
    def setUp(self):
        self.engine = QuizEngine()
        self.engine.load_questions('questions.json')

    def test_sample_questions(self):
        sample_questions = self.engine.sample(n=5)
        self.assertEqual(len(sample_questions), 5)
        for question in sample_questions:
            self.assertIn(question.id, [q.id for q in self.engine.questions])

    def test_grade_correct_answer(self):
        question = self.engine.questions[0]
        correct_answer = question.correct_answer
        result = self.engine.grade(question, correct_answer)
        self.assertTrue(result)

    def test_grade_incorrect_answer(self):
        question = self.engine.questions[0]
        incorrect_answer = (question.correct_answer + 1) % len(question.answers)
        result = self.engine.grade(question, incorrect_answer)
        self.assertFalse(result)

if __name__ == '__main__':
    unittest.main()