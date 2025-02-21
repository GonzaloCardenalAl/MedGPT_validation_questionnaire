from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json

app = FastAPI()

# Load questions from JSON file
with open("questions.json", "r") as f:
    questions = json.load(f)

# In-memory storage for answers
answers = []

class Answer(BaseModel):
    text: str

@app.get("/questions/{question_index}")
def get_question(question_index: int):
    """
    Returns a single question by its index in the `questions` list.
    """
    if 0 <= question_index < len(questions):
        return questions[question_index]
    else:
        raise HTTPException(
            status_code=404,
            detail="No question found at this index."
        )

@app.post("/submit_answer/{question_index}")
def submit_answer(question_index: int, answer: Answer):
    """
    Receives clinician feedback for a given question index and appends it to the in-memory list.
    """
    if question_index < 0 or question_index >= len(questions):
        raise HTTPException(
            status_code=404,
            detail="Invalid question index."
        )
    
    # Store the answer in memory
    answers.append({
        "question_index": question_index,
        "answer": answer.text
    })

    # Optional: Write answers to a file for persistence
    # with open("answers.json", "w") as f:
    #     json.dump(answers, f)

    return {"message": "Answer submitted successfully."}