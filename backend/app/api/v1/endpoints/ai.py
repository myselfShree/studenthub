from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.ai_interaction import AIInteraction
from app.services.ai_service import ai_service
from app.services.note_service import note_service
from app.schemas.ai import (
    AISummarizeRequest,
    AISummaryResponse,
    AIKeyPointsRequest,
    AIKeyPointsResponse,
    AIQuizRequest,
    AIQuizResponse,
    AIExplainRequest,
    AIExplainResponse,
    AIChatRequest,
    AIChatResponse,
    AIInteractionResponse
)

router = APIRouter()

def resolve_study_content(db: Session, user_id: int, note_id: Optional[int], raw_content: Optional[str]) -> tuple[str, Optional[int]]:
    """Helper to extract text from a note_id or fallback to raw content."""
    if note_id:
        note = note_service.get_by_id(db, note_id=note_id, user_id=user_id)
        if not note:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found or does not belong to you")
        return f"{note.title}\n\n{note.content}", note.id
    
    if raw_content and len(raw_content.strip()) >= 10:
        return raw_content.strip(), None
    
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either a valid note_id or at least 10 characters of content must be provided")

@router.post("/summarize", response_model=AISummaryResponse)
def summarize_study_material(
    request: AISummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Summarize student study notes into concise paragraphs and a key takeaway."""
    content, note_id = resolve_study_content(db, current_user.id, request.note_id, request.content)
    return ai_service.summarize(db, user_id=current_user.id, text_content=content, note_id=note_id)

@router.post("/key-points", response_model=AIKeyPointsResponse)
def extract_key_points(
    request: AIKeyPointsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Extract key concepts and bullet points from note content."""
    content, note_id = resolve_study_content(db, current_user.id, request.note_id, request.content)
    return ai_service.extract_key_points(db, user_id=current_user.id, text_content=content, note_id=note_id)

@router.post("/generate-quiz", response_model=AIQuizResponse)
def generate_practice_quiz(
    request: AIQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate multiple-choice practice questions (MCQs) strictly based on the note content."""
    content, note_id = resolve_study_content(db, current_user.id, request.note_id, request.content)
    return ai_service.generate_quiz(
        db,
        user_id=current_user.id,
        text_content=content,
        num_questions=request.num_questions,
        note_id=note_id
    )

@router.post("/explain", response_model=AIExplainResponse)
def explain_topic(
    request: AIExplainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Explain a complex concept or topic with clear analogies and examples."""
    return ai_service.explain_concept(
        db,
        user_id=current_user.id,
        topic=request.topic,
        context=request.context
    )

@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Personal AI study assistant — ask any academic question."""
    return ai_service.chat(
        db,
        user_id=current_user.id,
        message=request.message,
        context=request.context,
        history=request.history,
    )

@router.get("/history", response_model=List[AIInteractionResponse])
def get_ai_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List past AI study assistant interactions for the current student."""
    return db.query(AIInteraction).filter(
        AIInteraction.user_id == current_user.id
    ).order_by(AIInteraction.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/status")
def get_ai_status(current_user: User = Depends(get_current_active_user)):
    """Check whether Gemini AI is connected and active."""
    return ai_service.get_status()


# ── Public Gemini AI diagnostic (NO auth required for quick verification) ────

@router.get("/debug-gemini")
def debug_gemini_public(prompt: str = "Hello, reply in one short sentence."):
    """
    PUBLIC endpoint (no login needed) — calls Gemini API directly with a test prompt
    and returns the exact response or error details.

    Usage: GET /api/v1/ai/debug-gemini
    """
    import httpx

    key = ai_service.get_api_key()
    if not key:
        return {
            "success": False,
            "status": "missing_api_key",
            "error": "GEMINI_API_KEY environment variable is NOT configured on Render.",
            "fix": (
                "1. Go to Google AI Studio: https://aistudio.google.com/app/apikey "
                "2. Click 'Create API key' → copy the key (starts with AIzaSy...) "
                "3. In Render Dashboard → backend service → Environment tab → "
                "add GEMINI_API_KEY=<your_key> → click Save Changes."
            )
        }

    key_preview = f"{key[:6]}...{key[-4:]}" if len(key) >= 10 else "***"
    models_to_test = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-pro-latest"]
    attempts = []

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 100}
    }

    with httpx.Client(timeout=15.0) as client:
        for model in models_to_test:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            try:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])
                    reply_text = parts[0].get("text", "").strip() if parts else ""
                    return {
                        "success": True,
                        "working_model": model,
                        "key_length": len(key),
                        "key_preview": key_preview,
                        "test_prompt": prompt,
                        "ai_reply": reply_text,
                        "message": "Gemini AI is working perfectly on this backend!"
                    }
                else:
                    attempts.append({
                        "model": model,
                        "status_code": resp.status_code,
                        "error": resp.text[:200].replace("\n", " ")
                    })
            except Exception as exc:
                attempts.append({
                    "model": model,
                    "error": str(exc)
                })

    return {
        "success": False,
        "status": "all_models_failed",
        "key_length": len(key),
        "key_preview": key_preview,
        "attempts": attempts,
        "fix": (
            "If error is 400/API_KEY_INVALID: Generate a new key at https://aistudio.google.com/app/apikey. "
            "If error is 429: You have hit the Google AI quota limit, wait a few minutes or create a fresh key."
        )
    }

