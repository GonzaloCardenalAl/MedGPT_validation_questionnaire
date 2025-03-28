from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
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
    return HTMLResponse(content="""
    <html>
      <body>
        <h2>Welcome to the MedGPT Validation Questionnaire API</h2>

        <p>Dear Clinician,</p>

        <p>Welcome, and thank you for taking part in our "HIV & LLM" questionnaire.</p>

        <p>This study explores how large language models can support HIV clinical management. We are assessing their current capabilities, identifying strengths and limitations, and aiming to develop recommendations for improvement.</p>

        <p>Your responses will help us validate two key aspects of our research: (1) The relevance of the metrics we use to evaluate AI-generated answers. (2) The benefits and drawbacks of using AI-generated clinical responses in clinical consultations.</p>

        <p>The questionnaire consists of 4 sections:</p>
        <div style="padding-left: 20px;">
          <ol>
            <li>General information – approx. 3 minutes</li>
            <li>Evaluation of AI-generated answers – approx. 10 minutes</li>
            <li>HIV clinical Q&amp;A – approx. 25 minutes</li>
            <li>Closing questions – approx. 5 minutes</li>
          </ol>
        </div>

        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Please complete the questionnaire in one sitting, without interruption.</li>
          <li>You may use tools you normally rely on during clinical consults (e.g., UpToDate, guidelines, references, etc.). It's important to answer the questions as you would in real-life clinical practice, as your natural approach is what we are aiming to evaluate.</li>
          <li>
            <span style="color: red;">To save your responses, make sure to reach the final screen and download your response file.</span>
          </li>
        </ul>

        <p>We truly appreciate your time and contribution to this research.</p>
      </body>
    </html>
    """)

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

@app.get("/evaluation-criteria")
async def get_evaluation_criteria():
    return FileResponse(
        "./assets/Criterion.jpg",
        media_type="image/jpeg",
        filename="evaluation_criteria.jpg"
    )