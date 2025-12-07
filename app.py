from flask import Flask, render_template, jsonify, request
from quiz_engine import QuizEngine
from assistant import Assistant
import os

app = Flask(__name__)
engine = QuizEngine()
assistant = Assistant()

# Load custom questions from a JSON file (relative to module)
questions_path = os.path.join(os.path.dirname(__file__), 'questions.json')
try:
    engine.load_questions(questions_path)
    print(f"[app] questions loaded: {len(engine.questions)} (path: {questions_path})")
except Exception as e:
    engine.questions = []
    print(f"[app] failed to load questions from {questions_path}: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/status')
def status():
    return jsonify({
        'questions_loaded': len(engine.questions),
        'has_questions': bool(engine.questions)
    })

@app.route('/api/sample')
def sample():
    if not engine.questions:
        return jsonify({'error': 'no questions loaded'}), 500
    try:
        n = int(request.args.get('n', 20))
    except Exception:
        n = 20
    # clamp n to available questions
    n = max(1, min(n, len(engine.questions)))
    qs = engine.sample(n=n)
    return jsonify([q.as_dict() for q in qs])

@app.route('/api/grade', methods=['POST'])
def grade():
    payload = request.json or {}
    qid = payload.get('id')
    try:
        selected = int(payload.get('selected'))
    except Exception:
        return jsonify({'error': 'invalid payload'}), 400

    q = next((x for x in engine.questions if x.id == qid), None)
    if not q:
        return jsonify({'error': 'question not found'}), 404

    correct = engine.grade(q, selected)

    # prefer question-provided explanation (hint); otherwise leave null
    explanation = None
    if getattr(q, 'explanation', None):
        explanation = q.explanation
    # If you want automated explanations when incorrect, call assistant here
    # e.g. if not correct: explanation = assistant.explain(q.question, q.options, selected)

    return jsonify({'correct': correct, 'explanation': explanation})

if __name__ == '__main__':
    app.run(debug=True, port=5000)