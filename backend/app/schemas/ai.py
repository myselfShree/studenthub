from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any

# Requests
class AISummarizeRequest(BaseModel):
    note_id: Optional[int] = Field(None, description="ID of existing note to summarize")
    content: Optional[str] = Field(None, min_length=10, description="Raw text content if not using note_id")

class AIKeyPointsRequest(BaseModel):
    note_id: Optional[int] = None
    content: Optional[str] = Field(None, min_length=10)

class AIQuizRequest(BaseModel):
    note_id: Optional[int] = None
    content: Optional[str] = Field(None, min_length=10)
    num_questions: int = Field(3, ge=1, le=10, description="Number of MCQs to generate (1-10)")

class AIExplainRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200, examples=["Backpropagation in Neural Networks"])
    context: Optional[str] = Field(None, description="Optional background context or note snippet")

# Responses
class AISummaryResponse(BaseModel):
    summary: str
    key_takeaway: str
    interaction_id: Optional[int] = None

class AIKeyPointsResponse(BaseModel):
    key_points: List[str]
    interaction_id: Optional[int] = None

class AIQuizQuestion(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=2, max_length=4)
    correct_answer: str
    explanation: str

class AIQuizResponse(BaseModel):
    questions: List[AIQuizQuestion]
    interaction_id: Optional[int] = None

class AIExplainResponse(BaseModel):
    topic: str
    explanation: str
    interaction_id: Optional[int] = None

# Database Interaction History Record
class AIInteractionResponse(BaseModel):
    id: int
    user_id: int
    note_id: Optional[int] = None
    operation: str
    prompt_input: str
    ai_response: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
