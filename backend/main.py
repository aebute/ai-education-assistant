from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="AI Education Assistant API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessRequest(BaseModel):
    text: str
    level: str = "Elementary / Beginner"

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str

class ProcessResponse(BaseModel):
    summary: str
    quiz: List[QuizQuestion]
    review_topics: List[str]

@app.get("/")
def read_root():
    return {"status": "online", "message": "AI Education Assistant API running"}

@app.post("/process", response_model=ProcessResponse)
def process_material(payload: ProcessRequest):
    text = payload.text.strip()
    
    # Extract topics or default if text is short
    topics = [line.strip() for line in text.split(".") if len(line.strip()) > 10]
    topic_1 = topics[0][:30] if len(topics) > 0 else "Core Concept Overview"
    topic_2 = topics[1][:30] if len(topics) > 1 else "Key Application"

    summary_text = (
        f"[{payload.level.upper()} SUMMARY]\n"
        f"Key takeaway from your material: {text[:200]}..." if len(text) > 200 else f"[{payload.level.upper()} SUMMARY]\n{text}"
    )

    generated_quiz = [
        QuizQuestion(
            question=f"Based on your notes, what is the main focus regarding: '{topic_1}'?",
            options=[
                f"Primary definition of {topic_1}",
                "Unrelated secondary process",
                "Historical background only"
            ],
            correct_answer=f"Primary definition of {topic_1}"
        ),
        QuizQuestion(
            question=f"Which statement best describes '{topic_2}'?",
            options=[
                "It has no practical application",
                f"It directly relates to {topic_2}",
                "It only applies to advanced theoretical models"
            ],
            correct_answer=f"It directly relates to {topic_2}"
        )
    ]

    gap_topics = [
        f"Review: {topic_1}",
        f"Review: {topic_2}"
    ]

    return ProcessResponse(
        summary=summary_text,
        quiz=generated_quiz,
        review_topics=gap_topics
    )
