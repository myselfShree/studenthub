import json
import logging
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.core.config import settings
from app.models.ai_interaction import AIInteraction
from app.schemas.ai import (
    AISummaryResponse,
    AIKeyPointsResponse,
    AIQuizResponse,
    AIQuizQuestion,
    AIExplainResponse
)

logger = logging.getLogger("studenthub.ai")

class AIService:
    def __init__(self):
        self._gemini_initialized = False
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY.strip())
                self.model = genai.GenerativeModel("gemini-1.5-flash")
                self._gemini_initialized = True
                logger.info("Gemini AI service initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini API: {e}. Falling back to heuristic generator.")
        else:
            logger.info("No GEMINI_API_KEY configured. Running AI service in local simulation mode.")

    def _record_interaction(
        self,
        db: Session,
        user_id: int,
        operation: str,
        prompt_input: str,
        ai_response_str: str,
        note_id: Optional[int] = None
    ) -> AIInteraction:
        """Persists AI generation event in database."""
        interaction = AIInteraction(
            user_id=user_id,
            note_id=note_id,
            operation=operation,
            prompt_input=prompt_input[:2000],  # Truncate if excessively long
            ai_response=ai_response_str
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        return interaction

    def summarize(self, db: Session, user_id: int, text_content: str, note_id: Optional[int] = None) -> AISummaryResponse:
        """Generates concise summary and key takeaway from student notes."""
        if self._gemini_initialized:
            try:
                prompt = (
                    f"You are a helpful study assistant. Summarize the following student note into a clear, "
                    f"concise study summary (2-3 paragraphs) followed by one single sentence key takeaway.\n\n"
                    f"JSON format required:\n"
                    f'{{"summary": "...", "key_takeaway": "..."}}\n\n'
                    f"NOTE CONTENT:\n{text_content}"
                )
                response = self.model.generate_content(prompt)
                clean_text = response.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
                summary = data.get("summary", "")
                key_takeaway = data.get("key_takeaway", "")
            except Exception as e:
                logger.error(f"Gemini summarization error: {e}. Using fallback.")
                summary, key_takeaway = self._fallback_summarize(text_content)
        else:
            summary, key_takeaway = self._fallback_summarize(text_content)

        raw_result = json.dumps({"summary": summary, "key_takeaway": key_takeaway})
        interaction = self._record_interaction(
            db, user_id=user_id, operation="summarize",
            prompt_input=text_content, ai_response_str=raw_result, note_id=note_id
        )

        return AISummaryResponse(
            summary=summary,
            key_takeaway=key_takeaway,
            interaction_id=interaction.id
        )

    def extract_key_points(self, db: Session, user_id: int, text_content: str, note_id: Optional[int] = None) -> AIKeyPointsResponse:
        """Extracts bullet points of key concepts from note content."""
        if self._gemini_initialized:
            try:
                prompt = (
                    f"Extract 4 to 6 important key study points and definitions from this content.\n"
                    f"Return JSON format:\n"
                    f'{{"key_points": ["point 1", "point 2", ...]}}\n\n'
                    f"CONTENT:\n{text_content}"
                )
                response = self.model.generate_content(prompt)
                clean_text = response.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
                key_points = data.get("key_points", [])
            except Exception as e:
                logger.error(f"Gemini key points error: {e}. Using fallback.")
                key_points = self._fallback_key_points(text_content)
        else:
            key_points = self._fallback_key_points(text_content)

        raw_result = json.dumps({"key_points": key_points})
        interaction = self._record_interaction(
            db, user_id=user_id, operation="key_points",
            prompt_input=text_content, ai_response_str=raw_result, note_id=note_id
        )

        return AIKeyPointsResponse(
            key_points=key_points,
            interaction_id=interaction.id
        )

    def generate_quiz(
        self,
        db: Session,
        user_id: int,
        text_content: str,
        num_questions: int = 3,
        note_id: Optional[int] = None
    ) -> AIQuizResponse:
        """Generates multiple-choice questions (MCQs) for active recall practice."""
        if self._gemini_initialized:
            try:
                prompt = (
                    f"Generate {num_questions} multiple choice questions (with 4 options, the exact correct answer text, and a brief explanation) based on this content.\n"
                    f"Return JSON format:\n"
                    f'{{"questions": [{{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "...", "explanation": "..."}}]}}\n\n'
                    f"CONTENT:\n{text_content}"
                )
                response = self.model.generate_content(prompt)
                clean_text = response.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
                questions_data = data.get("questions", [])
                questions = [AIQuizQuestion(**q) for q in questions_data]
            except Exception as e:
                logger.error(f"Gemini quiz error: {e}. Using fallback.")
                questions = self._fallback_quiz(text_content, num_questions)
        else:
            questions = self._fallback_quiz(text_content, num_questions)

        raw_result = json.dumps([q.model_dump() for q in questions])
        interaction = self._record_interaction(
            db, user_id=user_id, operation="quiz_mcq",
            prompt_input=text_content, ai_response_str=raw_result, note_id=note_id
        )

        return AIQuizResponse(
            questions=questions,
            interaction_id=interaction.id
        )

    def explain_concept(
        self,
        db: Session,
        user_id: int,
        topic: str,
        context: Optional[str] = None
    ) -> AIExplainResponse:
        """Explains a complex student topic with examples."""
        if self._gemini_initialized:
            try:
                prompt = (
                    f"Explain the academic topic '{topic}' in clear, student-friendly terms with practical examples.\n"
                    f"Context provided: {context or 'None'}\n"
                    f"Return JSON format:\n"
                    f'{{"explanation": "..."}}'
                )
                response = self.model.generate_content(prompt)
                clean_text = response.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
                explanation = data.get("explanation", "")
            except Exception as e:
                logger.error(f"Gemini explain error: {e}. Using fallback.")
                explanation = f"Explanation of {topic}: This core subject topic covers foundational principles and applications in modern computer science and engineering."
        else:
            explanation = f"Explanation of {topic}: This core subject topic covers foundational principles and applications in modern computer science and engineering."

        raw_result = json.dumps({"topic": topic, "explanation": explanation})
        interaction = self._record_interaction(
            db, user_id=user_id, operation="study_qa",
            prompt_input=f"Topic: {topic} | Context: {context or ''}",
            ai_response_str=raw_result
        )

        return AIExplainResponse(
            topic=topic,
            explanation=explanation,
            interaction_id=interaction.id
        )

    # Local Intelligent Fallbacks for testing and development environments
    def _fallback_summarize(self, text: str) -> tuple[str, str]:
        sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 5]
        summary_body = " ".join(sentences[:3]) + "." if sentences else text[:200]
        key_takeaway = sentences[0] + "." if sentences else "Key fundamental takeaway."
        return summary_body, key_takeaway

    def _fallback_key_points(self, text: str) -> List[str]:
        sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 5]
        if sentences:
            return [f"Key Concept {i+1}: {s}" for i, s in enumerate(sentences[:4])]
        return ["Core concept review", "Foundational study material", "Essential revision points"]

    def _fallback_quiz(self, text: str, count: int) -> List[AIQuizQuestion]:
        return [
            AIQuizQuestion(
                question=f"Which of the following is a primary characteristic discussed in the material (Concept {i+1})?",
                options=[
                    "It ensures high performance and reliable state handling",
                    "It operates without any data input",
                    "It is strictly an analog process",
                    "None of the above"
                ],
                correct_answer="It ensures high performance and reliable state handling",
                explanation="Based on the core principles discussed in the study text."
            ) for i in range(count)
        ]

ai_service = AIService()
