import os
import json
import random
from typing import List, Dict, Any, Optional

class Question:
    def __init__(self, payload: Dict[str, Any]):
        # payload can be dict loaded from JSON
        self.id: Optional[str] = payload.get('id')
        self.question: str = payload.get('question', '')
        self.options: List[str] = payload.get('options', []) or []
        self.answer: Optional[int] = payload.get('answer')
        # keep explanation if provided in the JSON
        self.explanation: str = payload.get('explanation', '') or ''

    def as_dict(self) -> Dict[str, Any]:
        # don't include the correct answer or internal explanation when sending to clients
        return {
            'id': self.id,
            'question': self.question,
            'options': self.options,
        }

class QuizEngine:
    def __init__(self):
        self.questions: List[Question] = []

    def load_questions(self, filepath: str) -> None:
        """
        Load questions from a JSON file path (relative to this module or absolute).
        Keeps existing questions if loading fails.
        """
        if not os.path.isabs(filepath):
            base = os.path.dirname(__file__)
            filepath = os.path.join(base, filepath)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f) or {}
            raw = data.get('questions') if isinstance(data, dict) else data
            if not raw:
                print(f"[QuizEngine] No questions found in {filepath}.")
                return
            self.questions = [Question(q) for q in raw if isinstance(q, dict)]
            print(f"[QuizEngine] Loaded {len(self.questions)} questions from {filepath}.")
        except FileNotFoundError:
            print(f"[QuizEngine] Question file not found: {filepath}.")
        except json.JSONDecodeError:
            print(f"[QuizEngine] Failed to parse JSON in {filepath}. Ensure it contains valid JSON.")
        except Exception as e:
            print(f"[QuizEngine] Error loading questions: {e}")

    def sample(self, n: int) -> List[Question]:
        if not self.questions:
            return []
        return random.sample(self.questions, min(n, len(self.questions)))

    def grade(self, question: Question, selected: int) -> bool:
        try:
            return question.answer == selected
        except Exception:
            return False