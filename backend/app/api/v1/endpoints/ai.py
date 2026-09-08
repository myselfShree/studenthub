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
    """
    Summarize student study notes into concise paragraphs and a key takeaway.
    """
    content, note_id = resolve_study_content(db, current_user.id, request.note_id, request.content)
    return ai_service.summarize(db, user_id=current_user.id, text_content=content, note_id=note_id)

@router.post("/key-points", response_model=AIKeyPointsResponse)
def extract_key_points(
    request: AIKeyPointsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Extract key concepts and bullet points from note content.
    """
    content, note_id = resolve_study_content(db, current_user.id, request.note_id, request.content)
    return ai_service.extract_key_points(db, user_id=current_user.id, text_content=content, note_id=note_id)

@router.post("/generate-quiz", response_model=AIQuizResponse)
def generate_practice_quiz(
    request: AIQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate multiple-choice practice questions (MCQs) with explanations.
    """
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
    """
    Explain a complex concept or topic with clear analogies and examples.
    """
    return ai_service.explain_concept(
        db,
        user_id=current_user.id,
        topic=request.topic,
        context=request.context
    )

@router.get("/history", response_model=List[AIInteractionResponse])
def get_ai_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List past AI study assistant interactions for the current student.
    """
    return db.query(AIInteraction).filter(
        AIInteraction.user_id == current_user.id
    ).order_by(AIInteraction.created_at.desc()).offset(skip).limit(limit).all()
