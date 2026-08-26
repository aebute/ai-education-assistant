import io
import os
import json
from typing import List, Literal
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

# Initialize FastAPI App
app = FastAPI(
    title="AI Education Assistant API (Groq)",
    description="Backend engine utilizing Groq for document parsing and structured LLM output.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq Client
groq_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=groq_key) if groq_key else None


# -------------------------------------------------------------------
# Output Data Schemas
# -------------------------------------------------------------------

class Flashcard(BaseModel):
    front: str = Field(description="The question or concept.")
    back: str = Field(description="The explanation or answer.")

class QuizQuestion(BaseModel):
    question: str = Field(description="The multiple-choice question.")
    options: List[str] = Field(description="List of 4 choices.")
    correct_answer: str = Field(description="The exact correct choice.")
    explanation: str = Field(description="Explanation of why it is correct.")

class EducationalContent(BaseModel):
    summary: str = Field(description="Age-appropriate summary.")
    key_points: List[str] = Field(description="Main key takeaways.")
    flashcards: List[Flashcard] = Field(description="Set of flashcards.")
    quiz: List[QuizQuestion] = Field(description="Quiz items.")


# -------------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------------

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts raw text content from uploaded PDF bytes."""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
        return extracted_text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process PDF file: {str(e)}")


def get_system_prompt(age_group: str) -> str:
    """Provides clear schema rules for Groq JSON output mode."""
    schema_template = {
        "summary": "Detailed summary string",
        "key_points": ["Point 1", "Point 2"],
        "flashcards": [{"front": "Question/Term", "back": "Answer/Definition"}],
        "quiz": [{
            "question": "Question string?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A",
            "explanation": "Why Option A is correct"
        }]
    }

    base_prompt = (
        "You are an expert AI tutor. Analyze the provided study text and return a JSON object matching this schema:\n"
        f"{json.dumps(schema_template, indent=2)}\n\n"
        "Return ONLY the raw JSON object. Do not wrap it in markdown block quotes or extra text."
    )
    
    if age_group == "Primary (Ages 6-10)":
        adaptation = "\nTarget Audience: Primary Students (Ages 6-10). Use simple vocabulary and basic analogies."
    elif age_group == "Secondary (Ages 11-16)":
        adaptation = "\nTarget Audience: Secondary Students (Ages 11-16). Focus on core concepts and clear examples."
    else:
        adaptation = "\nTarget Audience: Adult / Higher Education. Keep content detailed, technical, and rigorous."
        
    return base_prompt + adaptation


# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------

@app.get("/")
def read_root():
    return {"status": "AI Engine active", "provider": "Groq"}


@app.post("/api/process-document", response_model=EducationalContent)
async def process_document(
    file: UploadFile = File(...),
    age_group: Literal["Primary (Ages 6-10)", "Secondary (Ages 11-16)", "Adult/Higher Ed"] = Form(...)
):
    if not client:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable is missing.")

    file_bytes = await file.read()
    filename = file.filename.lower() if file.filename else ""

    if filename.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(file_bytes)
    elif filename.endswith((".txt", ".md")):
        extracted_text = file_bytes.decode("utf-8").strip()
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Upload .pdf or .txt.")

    if not extracted_text:
        raise HTTPException(status_code=400, detail="Document contains no extractable text.")

    system_prompt = get_system_prompt(age_group)

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Document Text:\n\n{extracted_text[:12000]}"}
            ],
            temperature=0.2
        )
        
        raw_content = response.choices[0].message.content
        parsed_json = json.loads(raw_content)

        return EducationalContent(**parsed_json)

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Model returned invalid JSON format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
