import json
import logging
from sqlalchemy.orm import Session
from typing import Optional, List, Dict

from app.core.config import settings
from app.models.ai_interaction import AIInteraction
from app.schemas.ai import (
    AISummaryResponse,
    AIKeyPointsResponse,
    AIQuizResponse,
    AIQuizQuestion,
    AIExplainResponse,
    AIChatResponse,
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
            prompt_input=prompt_input[:2000],
            ai_response=ai_response_str[:5000],
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        return interaction

    def _call_gemini(self, prompt: str) -> Optional[str]:
        """Call Gemini and return text, or None on failure."""
        if not self._gemini_initialized:
            return None
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            return None

    def summarize(self, db: Session, user_id: int, text_content: str, note_id: Optional[int] = None) -> AISummaryResponse:
        """Generates concise summary and key takeaway from student notes."""
        prompt = (
            f"You are a helpful study assistant. Summarize the following student note into a clear, "
            f"concise study summary (2-3 paragraphs) followed by one single sentence key takeaway.\n\n"
            f"Return ONLY valid JSON, no markdown fences:\n"
            f'{{"summary": "...", "key_takeaway": "..."}}\n\n'
            f"NOTE CONTENT:\n{text_content}"
        )
        raw = self._call_gemini(prompt)
        if raw:
            try:
                clean = raw.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean)
                summary = data.get("summary", "")
                key_takeaway = data.get("key_takeaway", "")
            except Exception as e:
                logger.error(f"JSON parse error in summarize: {e}")
                summary, key_takeaway = self._fallback_summarize(text_content)
        else:
            summary, key_takeaway = self._fallback_summarize(text_content)

        raw_result = json.dumps({"summary": summary, "key_takeaway": key_takeaway})
        interaction = self._record_interaction(
            db, user_id=user_id, operation="summarize",
            prompt_input=text_content, ai_response_str=raw_result, note_id=note_id
        )
        return AISummaryResponse(summary=summary, key_takeaway=key_takeaway, interaction_id=interaction.id)

    def extract_key_points(self, db: Session, user_id: int, text_content: str, note_id: Optional[int] = None) -> AIKeyPointsResponse:
        """Extracts bullet points of key concepts from note content."""
        prompt = (
            f"Extract 4 to 6 important key study points and definitions from this content.\n"
            f"Return ONLY valid JSON, no markdown fences:\n"
            f'{{"key_points": ["point 1", "point 2", ...]}}\n\n'
            f"CONTENT:\n{text_content}"
        )
        raw = self._call_gemini(prompt)
        if raw:
            try:
                clean = raw.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean)
                key_points = data.get("key_points", [])
            except Exception as e:
                logger.error(f"JSON parse error in key_points: {e}")
                key_points = self._fallback_key_points(text_content)
        else:
            key_points = self._fallback_key_points(text_content)

        raw_result = json.dumps({"key_points": key_points})
        interaction = self._record_interaction(
            db, user_id=user_id, operation="key_points",
            prompt_input=text_content, ai_response_str=raw_result, note_id=note_id
        )
        return AIKeyPointsResponse(key_points=key_points, interaction_id=interaction.id)

    def generate_quiz(
        self,
        db: Session,
        user_id: int,
        text_content: str,
        num_questions: int = 3,
        note_id: Optional[int] = None
    ) -> AIQuizResponse:
        """Generates MCQs for active recall practice, strictly based on the note content."""
        prompt = (
            f"You are a professor creating a quiz. Generate EXACTLY {num_questions} multiple choice questions "
            f"strictly based on the following study content. Each question must test a specific fact or concept "
            f"from the content. Do NOT generate generic questions.\n\n"
            f"Return ONLY valid JSON array (no markdown fences):\n"
            f'{{"questions": [{{"question": "...", "options": ["option A", "option B", "option C", "option D"], '
            f'"correct_answer": "option A", "explanation": "..."}}]}}\n\n'
            f"IMPORTANT: correct_answer must be the exact text of one of the options.\n\n"
            f"STUDY CONTENT:\n{text_content}"
        )
        raw = self._call_gemini(prompt)
        questions = []
        if raw:
            try:
                clean = raw.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean)
                questions_data = data.get("questions", [])
                for q in questions_data:
                    # Ensure correct_answer matches one of the options
                    opts = q.get("options", [])
                    ans = q.get("correct_answer", "")
                    if ans not in opts and opts:
                        ans = opts[0]
                    questions.append(AIQuizQuestion(
                        question=q.get("question", ""),
                        options=opts,
                        correct_answer=ans,
                        explanation=q.get("explanation", "")
                    ))
            except Exception as e:
                logger.error(f"JSON parse error in generate_quiz: {e}")
                questions = self._fallback_quiz(text_content, num_questions)
        else:
            questions = self._fallback_quiz(text_content, num_questions)

        raw_result = json.dumps([q.model_dump() for q in questions])
        interaction = self._record_interaction(
            db, user_id=user_id, operation="quiz_mcq",
            prompt_input=text_content, ai_response_str=raw_result, note_id=note_id
        )
        return AIQuizResponse(questions=questions, interaction_id=interaction.id)

    def explain_concept(
        self,
        db: Session,
        user_id: int,
        topic: str,
        context: Optional[str] = None
    ) -> AIExplainResponse:
        """Explains a complex student topic with examples."""
        prompt = (
            f"Explain the academic topic '{topic}' in clear, student-friendly terms with practical examples.\n"
            f"Context provided: {context or 'None'}\n"
            f"Return ONLY valid JSON, no markdown fences:\n"
            f'{{"explanation": "..."}}'
        )
        raw = self._call_gemini(prompt)
        if raw:
            try:
                clean = raw.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean)
                explanation = data.get("explanation", "")
            except Exception:
                explanation = f"Explanation of {topic}: This covers foundational principles and applications relevant to the topic."
        else:
            explanation = f"Explanation of {topic}: This covers foundational principles and applications relevant to the topic."

        raw_result = json.dumps({"topic": topic, "explanation": explanation})
        interaction = self._record_interaction(
            db, user_id=user_id, operation="study_qa",
            prompt_input=f"Topic: {topic} | Context: {context or ''}",
            ai_response_str=raw_result
        )
        return AIExplainResponse(topic=topic, explanation=explanation, interaction_id=interaction.id)

    def chat(
        self,
        db: Session,
        user_id: int,
        message: str,
        context: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> AIChatResponse:
        """Personal AI study assistant chat endpoint."""
        system_instruction = (
            "You are a personal AI study assistant for a student. "
            "Answer clearly, concisely, and in a helpful academic tone. "
            "If the student provides note content as context, use it to give more relevant answers. "
            "Do not use markdown fences in your reply. Keep replies under 300 words unless asked for more."
        )

        # Build the conversation prompt
        history_text = ""
        if history:
            for msg in history[-6:]:  # only last 6 messages
                role = "Student" if msg.get("role") == "user" else "Assistant"
                history_text += f"{role}: {msg.get('content', '')}\n"

        context_section = f"\n\nNote Content (for context):\n{context[:1000]}" if context else ""
        prompt = (
            f"{system_instruction}\n\n"
            f"{history_text}"
            f"{context_section}\n\n"
            f"Student: {message}\n"
            f"Assistant:"
        )

        raw = self._call_gemini(prompt)
        if raw:
            reply = raw.strip()
        else:
            reply = (
                "I'm your AI study assistant! I can help you understand concepts, "
                "clarify doubts, and summarise your notes. "
                "To enable full AI responses, please add your Gemini API key to the Render environment variables."
            )

        interaction = self._record_interaction(
            db, user_id=user_id, operation="chat",
            prompt_input=message, ai_response_str=reply
        )
        return AIChatResponse(reply=reply, interaction_id=interaction.id)

    # ── Local intelligent fallbacks ─────────────────────────────────────────
    def _fallback_summarize(self, text: str) -> tuple[str, str]:
        sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 5]
        summary_body = ". ".join(sentences[:4]) + "." if sentences else text[:300]
        key_takeaway = sentences[0] + "." if sentences else "Review the material carefully."
        return summary_body, key_takeaway

    def _fallback_key_points(self, text: str) -> List[str]:
        sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 8]
        if sentences:
            return [f"• {s}." for s in sentences[:5]]
        return ["Review core concepts", "Understand foundational principles", "Practice with examples"]

    def _fallback_quiz(self, text: str, count: int) -> List[AIQuizQuestion]:
        # Extract first few sentences to base questions on
        sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 8]
        questions = []
        for i in range(min(count, len(sentences))):
            q_text = sentences[i][:100] if i < len(sentences) else f"Concept {i+1} from the material"
            questions.append(AIQuizQuestion(
                question=f"What does this describe: '{q_text[:80]}...'?",
                options=[
                    "This is the correct concept as described",
                    "An unrelated process or definition",
                    "A contradictory statement",
                    "None of the above"
                ],
                correct_answer="This is the correct concept as described",
                explanation=f"Based on the study content: {q_text[:100]}."
            ))
        # Fill remaining if not enough sentences
        while len(questions) < count:
            questions.append(AIQuizQuestion(
                question=f"Review question {len(questions)+1}: What is the primary focus of this study material?",
                options=[
                    "The main topic as described in the notes",
                    "An unrelated subject",
                    "A secondary concept",
                    "None of the above"
                ],
                correct_answer="The main topic as described in the notes",
                explanation="Based on the overall content of the notes provided."
            ))
        return questions

ai_service = AIService()
