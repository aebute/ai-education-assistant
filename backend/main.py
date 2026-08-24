import os
import io
import re
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import PyPDF2

app = FastAPI(title="AI Education Assistant API", version="1.0.0")

# Allowed origins for development and production deployments
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Set to origins list or "*" for open API access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessResponse(BaseModel):
    summary: str
    age_group: str
    filename: Optional[str] = None
    status: str

@app.get("/")
def read_root():
    return {"status": "online", "message": "AI Education Assistant API running"}

@app.post("/api/process-document", response_model=ProcessResponse)
def process_document(
    file: Optional[UploadFile] = File(default=None),
    age_group: str = Form(default="beginner"),
    raw_text: Optional[str] = Form(default=None)
):
    extracted_text = ""

    # Synchronously parse PDF to keep processing off main async loop
    if file and file.filename:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
        try:
            contents = file.file.read()
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

    # Fallback to raw text if no PDF content was extracted
    if not extracted_text.strip() and raw_text:
        extracted_text = raw_text

    if not extracted_text.strip():
        raise HTTPException(
            status_code=400, 
            detail="No readable text found in upload or text input."
        )

    # Clean extracted text: remove newlines, fix bracket, punctuation, & letter collisions
    raw_preview = extracted_text[:350].replace("\n", " ").strip()
    
    # 1. Insert spaces around closing brackets, periods, colons
    cleaned = re.sub(r'([\)\]\.:])([A-Za-z])', r'\1 \2', raw_preview)
    # 2. Insert spaces between lowercase and uppercase letter collisions
    cleaned = re.sub(r'(?<=[a-z])(?=[A-Z])', r' ', cleaned)
    # 3. Collapse multiple whitespace characters into single spaces
    preview = re.sub(r'\s+', ' ', cleaned)
    # 4. Enforce bold uppercase **GOD** on every occurrence
    preview = re.sub(r'\bgod\b', '**GOD**', preview, flags=re.IGNORECASE)

    # Formatted output
    summary_output = (
        f"• Core Concept Breakdown:\n{preview}...\n\n"
        f"• Learning Level:\nTailored for {age_group.upper()} study track.\n\n"
        f"• Recommended Action:\nReview primary terms and test understanding using Quiz & Flashcards."
    )

    return ProcessResponse(
        summary=summary_output,
        age_group=age_group,
        filename=file.filename if file and file.filename else "Text Input",
        status="success"
    )
