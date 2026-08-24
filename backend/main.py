from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pypdf
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process")
async def process_material(
    level: str = Form("Elementary / Beginner"),
    text: str = Form(None),
    file: UploadFile = File(None)
):
    extracted_text = ""

    if file:
        contents = await file.read()
        if file.filename.lower().endswith(".pdf"):
            try:
                pdf_reader = pypdf.PdfReader(io.BytesIO(contents))
                for page in pdf_reader.pages:
                    extracted_text += (page.extract_text() or "") + "\n"
            except Exception as e:
                return {"error": f"Failed to parse PDF file: {str(e)}"}
        else:
            extracted_text = contents.decode("utf-8", errors="ignore")
    elif text:
        extracted_text = text

    if not extracted_text.strip():
        return {"error": "No readable text content found."}

    # Clean extracted text lines
    clean_text = " ".join(extracted_text.split())

    # Replace with your actual LLM processing call
    summary = f"[{level.upper()} SUMMARY]\n\n" + clean_text[:600] + "..."
    
    quiz = [
        {
            "question": "What is the primary theme of the uploaded material?",
            "options": ["A core subject theme", "Unrelated secondary detail", "Option C"],
            "correct_answer": "A core subject theme"
        }
    ]
    
    review_topics = [
        f"Review: Key themes in {file.filename if file else 'Provided Material'}",
        "Review: Key Application"
    ]

    return {
        "summary": summary,
        "quiz": quiz,
        "review_topics": review_topics
    }