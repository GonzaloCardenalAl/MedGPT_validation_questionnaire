from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load JSON files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_json_file(filename):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: JSON file not found: {filename}")
        return []
    with open(path, "r") as f:
        return json.load(f)

# Load all JSON files
general_info = load_json_file("general_info.json")
step1_questions = load_json_file("MedGPT_validation_step_1.json")
step2_questions = load_json_file("MedGPT_validation_step_2.json")
conclusion = load_json_file("conclusion.json")

# Create answers directory if it doesn't exist
os.makedirs('answers', exist_ok=True)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the MedGPT Validation Questionnaire API",
        "instructions": "Dear clinician,\n\n Welcome to the validation questionnaire for MedGPT and Clinical LLMs. As a brief introduction, MedGPT is a score that aims to evaluate the AI-generated responses in various aspects of clinical reasoning including reading comprehension, reasoning steps, knowledge recall, demographic bias and potential to cause harm. The medical questions presented focuses on HIV management.\n\n With your responses in this questionnaire you will help us validate our scoring scheme and the potential of LLMs for Curbside consults. In order to save your responses, you should arrive to the last screen and download the json file. During the attempt, we also record time so please do this as a single activity.\n\n In the following validation questionnaire you will find 4 steps:\n- General Information (3min): some general questions.\n- Step 1 MedGPT validation (10min): rating of the answers as physician evaluating other physicians responses.\n- Step 2 HIV Clinical Question-answering(25min): answering HIV clinical questions with the help of the AI responses.\n- Conclusion (5min): closing questions.\n\nThe total time should not exceed 45mins."
         }

@app.get("/general-info")
def get_general_info():
    return general_info

@app.get("/step1-intro")
def get_step1_intro():
    return {"message": "Now you are going to start with Step 1: Validation of MedGPT."}

@app.get("/step1-questions")
def get_step1_questions():
    return step1_questions

@app.get("/step2-questions")
def get_step2_questions():
    return step2_questions

@app.get("/conclusion")
def get_conclusion():
    return conclusion

@app.post("/submit-rating")
async def submit_rating(rating_data: dict):
    # Here you would typically save the rating data to a database
    # For now, we'll just return a success message
    return {"message": "Rating submitted successfully", "data": rating_data}

@app.post("/save-answers")
async def save_answers(answers: dict):
    try:
        # Get timestamp from the answers data
        timestamp = answers.get('timestamp', datetime.now().isoformat().replace(':', '-'))
        
        # Create filename with timestamp
        filename = f"answers/validation_answers_{timestamp}.json"
        
        # Save the answers to a JSON file
        with open(filename, 'w') as f:
            json.dump(answers, f, indent=2)
        
        return {"message": "Answers saved successfully", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/favicon.ico")
def favicon():
    return {"message": "No favicon available"}