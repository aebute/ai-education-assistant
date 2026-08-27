import os
import json
from typing import Literal, List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import pypdf

app = FastAPI(
    title="AI Education Assistant API",
    version="1.0.0",
    redirect_slashes=True
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str

class EducationalContent(BaseModel):
    summary: str
    key_points: List[str]
    quiz: List[QuizQuestion]

def extract_text_from_file(file: UploadFile) -> str:
    filename = file.filename.lower() if file.filename else ""
    if filename.endswith(".pdf"):
        pdf_reader = pypdf.PdfReader(file.file)
        extracted_text = ""
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
        return extracted_text
    else:
        content = file.file.read()
        return content.decode("utf-8", errors="ignore")

def process_text_with_groq(text: str, age_group: str) -> dict:
    prompt = f"""
    You are an expert AI educator. Analyze the following learning material provided for a target audience level of: '{age_group}'.

    Task:
    1. Provide a concise summary suitable for the target audience.
    2. Extract 3-5 main key points/takeaways.
    3. Generate 3 multiple-choice quiz questions based on the content. Each question must have 4 options and state the correct answer clearly.

    Respond ONLY with valid JSON using the following strict structure:
    {{
      "summary": "...",
      "key_points": ["...", "..."],
      "quiz": [
        {{
          "question": "...",
          "options": ["A", "B", "C", "D"],
          "answer": "A"
        }}
      ]
    }}

    Learning Material:
    {text[:4000]}
    """

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You output strictly JSON content."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/api/process-document", response_model=EducationalContent)
async def process_document(
    file: UploadFile = File(...),
    age_group: str = Form(...)
):
    try:
        extracted_text = extract_text_from_file(file)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Unable to extract text from provided file.")

        return process_text_with_groq(extracted_text, age_group)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))