from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the HIV Questionnaire API"}

# JSON files for categories 1..5
FILENAMES = [
    "HIV_evaluation_questionare_category_1.json",
    "HIV_evaluation_questionare_category_2.json",
    "HIV_evaluation_questionare_category_3.json",
    "HIV_evaluation_questionare_category_4.json",
    "HIV_evaluation_questionare_category_5.json",
]

questions_by_category = {}
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load each file into questions_by_category[i]
for i, filename in enumerate(FILENAMES, start=1):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: JSON file not found for category {i}: {filename}")
        questions_by_category[i] = []
        continue
    with open(path, "r") as f:
        questions_by_category[i] = json.load(f)


@app.get("/categories/{category_index}")
def get_all_questions_in_category(category_index: int):
    """
    Returns an array of all questions for category_index.
    """
    if category_index < 1 or category_index > 5:
        raise HTTPException(status_code=400, detail="Invalid category index.")
    
    questions_list = questions_by_category.get(category_index, [])
    
    # Build an array of question objects
    results = []
    for idx, q in enumerate(questions_list):
        results.append({
            "category": category_index,
            "question_index": idx,
            "question": q["question"],
            "true_answer": q["true_answer"]
        })
    return results

@app.get("/favicon.ico")
def favicon():
    return {"message": "No favicon available"}