class Assistant:
    def __init__(self):
        self.explanations = {
            # Example question explanations
            "What is the capital of France?": "The capital of France is Paris.",
            "What is 2 + 2?": "2 + 2 equals 4.",
            # Add more explanations as needed
        }

    def get_explanation(self, question):
        return self.explanations.get(question, "No explanation available.")