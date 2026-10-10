import json
import logging
import os
import re
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

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

import httpx

logger = logging.getLogger("studenthub.ai")

DEFAULT_CANDIDATE_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-3.8-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]


class AIService:
    """
    Gemini-backed AI study assistant using direct REST API calls with
    dynamic model discovery, multi-model fallback, and fast timeouts.
    """

    def __init__(self):
        self._active_model_name = None
        self._discovered_models: List[str] = []
        self._last_error = None

    def get_api_key(self) -> str:
        """Find Gemini API key from multiple possible env var names."""
        for var_name in ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GEMINI_KEY", "GOOGLE_GEMINI_API_KEY"]:
            val = os.environ.get(var_name)
            if val and val.strip():
                return val.strip().strip("'\" \t\r\n")
        
        cfg_val = getattr(settings, "GEMINI_API_KEY", None)
        if cfg_val and str(cfg_val).strip():
            return str(cfg_val).strip().strip("'\" \t\r\n")
        
        return ""

    def _discover_models(self, api_key: str) -> List[str]:
        """Dynamically fetch supported generateContent models from Gemini API."""
        if self._discovered_models:
            return self._discovered_models
        
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
            with httpx.Client(timeout=4.0) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    models = []
                    for m in data.get("models", []):
                        methods = m.get("supportedGenerationMethods", [])
                        name = m.get("name", "").replace("models/", "")
                        # Exclude non-text/TTS audio models
                        if "generateContent" in methods and "gemini" in name:
                            if "-tts" not in name and "embed" not in name:
                                models.append(name)
                    
                    # Sort so flash-latest and general text models come first
                    def rank(m_name: str) -> int:
                        n = m_name.lower()
                        if "flash-latest" in n:
                            return 1
                        if "flash-lite-latest" in n:
                            return 2
                        if "flash" in n and "preview" not in n:
                            return 3
                        if "pro" in n and "preview" not in n:
                            return 4
                        return 10

                    models.sort(key=rank)
                    if models:
                        self._discovered_models = models
                        logger.info(f"Discovered and prioritized {len(models)} Gemini models: {models}")
                        return models
        except Exception as exc:
            logger.debug(f"Dynamic model discovery failed: {exc}")
        
        return ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-1.5-flash-latest", "gemini-pro-latest"]

    def _call_gemini_resilient(self, prompt: str) -> Optional[str]:
        """Tries discovered/candidate models in order using direct REST requests."""
        api_key = self.get_api_key()
        if not api_key:
            self._last_error = "GEMINI_API_KEY is not configured in environment variables."
            return None

        models_to_try = self._discover_models(api_key)
        if not models_to_try:
            models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

        # Limit to top 5 sorted text models
        models_to_try = models_to_try[:5]

        last_errors = []
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2048,
            }
        }

        with httpx.Client(timeout=15.0) as client:
            for model_name in models_to_try:
                clean_model = model_name.replace("models/", "")
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={api_key}"
                try:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts and "text" in parts[0]:
                                text = parts[0]["text"]
                                if text and text.strip():
                                    self._active_model_name = clean_model
                                    self._last_error = None
                                    return text.strip()
                        last_errors.append(f"{clean_model}: empty candidate text")
                    else:
                        err_summary = resp.text[:120].replace("\n", " ")
                        last_errors.append(f"{clean_model} (HTTP {resp.status_code}): {err_summary}")
                        logger.warning(f"Model {clean_model} HTTP {resp.status_code}: {err_summary}")
                except Exception as exc:
                    err_msg = str(exc)[:80]
                    last_errors.append(f"{clean_model}: {err_msg}")
                    continue

        self._last_error = " | ".join(last_errors[:3])
        logger.error(f"All Gemini models failed. Errors: {self._last_error}")
        return None

    def get_status(self) -> Dict[str, Any]:
        """Diagnostic status for the AI service."""
        key = self.get_api_key()
        return {
            "has_key": bool(key),
            "key_prefix": f"{key[:6]}..." if key else "none",
            "active_model": self._active_model_name or "none",
            "last_error": self._last_error,
            "discovered_models": self._discovered_models[:6] if self._discovered_models else DEFAULT_CANDIDATE_MODELS[:4],
            "mode": "live_gemini" if bool(key) else "heuristic_fallback"
        }

    def _record_interaction(
        self,
        db: Session,
        user_id: int,
        operation: str,
        prompt_input: str,
        ai_response_str: str,
        note_id: Optional[int] = None,
    ) -> AIInteraction:
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

    def _extract_json_block(self, text: str) -> Optional[Dict[str, Any]]:
        """Safely extract and parse JSON from LLM output."""
        try:
            clean = text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

        # Try regex search for first outer {...}
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        return None

    # ── Public API methods ────────────────────────────────────────────────────

    def summarize(
        self,
        db: Session,
        user_id: int,
        text_content: str,
        note_id: Optional[int] = None,
    ) -> AISummaryResponse:
        """Summarise student note into clear paragraphs + a memorable key takeaway."""
        prompt = (
            "You are an expert academic study tutor. Read the following student note and produce a comprehensive "
            "and well-structured study summary.\n\n"
            "Format your reply as valid JSON with exactly two fields:\n"
            '{"summary": "A clear, well-written 2 to 3 paragraph summary explaining the key concepts, definitions, and applications.", '
            '"key_takeaway": "One single punchy, memorable sentence capturing the core thesis or most important lesson."}\n\n'
            f"STUDY NOTE CONTENT:\n{text_content}"
        )
        raw = self._call_gemini_resilient(prompt)
        summary = ""
        key_takeaway = ""

        if raw:
            data = self._extract_json_block(raw)
            if data and isinstance(data, dict):
                summary = str(data.get("summary", "")).strip()
                key_takeaway = str(data.get("key_takeaway", "")).strip()
            else:
                # If JSON parsing failed, use the raw response as the summary
                summary = raw.strip()
                key_takeaway = "Master the foundational concepts outlined in this study material."

        if not summary:
            summary, key_takeaway = self._fallback_summarize(text_content)

        raw_result = json.dumps({"summary": summary, "key_takeaway": key_takeaway})
        interaction = self._record_interaction(
            db, user_id=user_id, operation="summarize",
            prompt_input=text_content, ai_response_str=raw_result, note_id=note_id,
        )
        return AISummaryResponse(summary=summary, key_takeaway=key_takeaway, interaction_id=interaction.id)

    def extract_key_points(
        self,
        db: Session,
        user_id: int,
        text_content: str,
        note_id: Optional[int] = None,
    ) -> AIKeyPointsResponse:
        """Extract 5 bullet-point key concepts from the note."""
        prompt = (
            "You are an academic study tutor. Extract the 5 most critical study points and key definitions "
            "from the note below. Each point must be a distinct, complete, high-value insight.\n\n"
            "Format your response as valid JSON:\n"
            '{"key_points": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]}\n\n'
            f"STUDY NOTE CONTENT:\n{text_content}"
        )
        raw = self._call_gemini_resilient(prompt)
        key_points = []

        if raw:
            data = self._extract_json_block(raw)
            if data and isinstance(data, dict) and isinstance(data.get("key_points"), list):
                key_points = [str(p).strip() for p in data.get("key_points", []) if str(p).strip()]
            else:
                # Split lines
                lines = [line.strip("-*• 1234567890.").strip() for line in raw.split("\n") if len(line.strip()) > 10]
                key_points = lines[:5]

        if not key_points:
            key_points = self._fallback_key_points(text_content)

        raw_result = json.dumps({"key_points": key_points})
        interaction = self._record_interaction(
            db, user_id=user_id, operation="key_points",
            prompt_input=text_content, ai_response_str=raw_result, note_id=note_id,
        )
        return AIKeyPointsResponse(key_points=key_points, interaction_id=interaction.id)

    def generate_quiz(
        self,
        db: Session,
        user_id: int,
        text_content: str,
        num_questions: int = 3,
        note_id: Optional[int] = None,
    ) -> AIQuizResponse:
        """Generate MCQs strictly based on the note content."""
        prompt = (
            f"You are a university professor creating an exam revision quiz.\n"
            f"Generate exactly {num_questions} multiple-choice questions based STRICTLY on the facts, "
            f"definitions, and examples in the note below. Do not generate generic questions.\n\n"
            f"Format response as valid JSON:\n"
            f'{{"questions": [{{"question": "What is...", "options": ["A", "B", "C", "D"], "correct_answer": "A", "explanation": "Why this is correct"}}]}}\n\n'
            f"IMPORTANT: The correct_answer must exactly match one of the items in options.\n\n"
            f"STUDY NOTE CONTENT:\n{text_content}"
        )
        raw = self._call_gemini_resilient(prompt)
        questions: List[AIQuizQuestion] = []

        if raw:
            data = self._extract_json_block(raw)
            if data and isinstance(data, dict):
                raw_q_list = data.get("questions", [])
                for item in raw_q_list:
                    opts = [str(o).strip() for o in item.get("options", []) if str(o).strip()]
                    ans = str(item.get("correct_answer", "")).strip()
                    if opts and ans not in opts:
                        ans = opts[0]
                    if len(opts) >= 2 and item.get("question"):
                        questions.append(AIQuizQuestion(
                            question=str(item.get("question")).strip(),
                            options=opts[:4],
                            correct_answer=ans,
                            explanation=str(item.get("explanation", "Based on the study note material.")).strip()
                        ))

        if not questions:
            questions = self._fallback_quiz(text_content, num_questions)

        raw_result = json.dumps([q.model_dump() for q in questions])
        interaction = self._record_interaction(
            db, user_id=user_id, operation="quiz_mcq",
            prompt_input=text_content, ai_response_str=raw_result, note_id=note_id,
        )
        return AIQuizResponse(questions=questions, interaction_id=interaction.id)

    def explain_concept(
        self,
        db: Session,
        user_id: int,
        topic: str,
        context: Optional[str] = None,
    ) -> AIExplainResponse:
        """Explain an academic concept clearly with intuitive analogies and practical examples."""
        context_part = f"\nRelevant student note context:\n{context}\n" if context else ""
        prompt = (
            f"You are a friendly academic mentor. Explain the concept '{topic}' in clear, student-friendly terms.\n"
            f"Break it down into:\n"
            f"1. Core definition and why it matters\n"
            f"2. A real-world analogy to make it easy to understand\n"
            f"3. Practical application or example\n"
            f"{context_part}\n"
            f"Format as valid JSON:\n"
            f'{{"explanation": "..."}}'
        )
        raw = self._call_gemini_resilient(prompt)
        explanation = ""

        if raw:
            data = self._extract_json_block(raw)
            if data and isinstance(data, dict):
                explanation = str(data.get("explanation", "")).strip()
            else:
                explanation = raw.strip()

        if not explanation:
            explanation = (
                f"**{topic}** is a core academic concept. It establishes the theoretical foundation "
                f"for understanding key systems, methodologies, and problem-solving techniques in this field."
            )

        raw_result = json.dumps({"topic": topic, "explanation": explanation})
        interaction = self._record_interaction(
            db, user_id=user_id, operation="study_qa",
            prompt_input=f"Topic: {topic} | Context: {context or ''}",
            ai_response_str=raw_result,
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
        """Personal AI study assistant chat."""
        context_section = f"\n[Active Student Note for reference]:\n{context[:1500]}\n" if context else ""
        history_text = ""
        if history:
            for msg in history[-8:]:
                role = "Student" if msg.get("role") == "user" else "Assistant"
                history_text += f"{role}: {msg.get('content', '')}\n"

        prompt = (
            "You are a friendly, highly capable personal AI study assistant for a university student.\n"
            "Answer questions clearly, accurately, and encouragingly. Use the student's note content when relevant.\n"
            "Keep answers concise, direct, and well-structured.\n\n"
            f"{context_section}\n"
            f"{history_text}"
            f"Student: {message}\n"
            "Assistant:"
        )
        raw = self._call_gemini_resilient(prompt)
        reply = raw.strip() if raw else (
            "I'm here to help with your studies! If you need live AI responses, please ensure your "
            "GEMINI_API_KEY environment variable is configured in Render."
        )

        interaction = self._record_interaction(
            db, user_id=user_id, operation="chat",
            prompt_input=message, ai_response_str=reply,
        )
        return AIChatResponse(reply=reply, interaction_id=interaction.id)

    # ── Heuristic fallbacks (clean academic extraction, never raw headers) ────

    def _clean_content_lines(self, text: str) -> List[str]:
        """Filters out headers and short labels to extract meaningful study text."""
        lines = []
        for line in text.split("\n"):
            line = line.strip()
            # Skip empty lines, markdown headers, and short tags
            if len(line) < 15:
                continue
            if line.startswith("#") or line.isupper() or line.lower().startswith("chapter"):
                continue
            lines.append(line.lstrip("-*• 1234567890.").strip())
        return lines

    def _fallback_summarize(self, text: str) -> tuple[str, str]:
        meaningful = self._clean_content_lines(text)
        if meaningful:
            summary = " ".join(meaningful[:4])
            if not summary.endswith("."):
                summary += "."
            key_takeaway = meaningful[0]
            if not key_takeaway.endswith("."):
                key_takeaway += "."
        else:
            summary = "This note contains key academic concepts and definitions essential for course review."
            key_takeaway = "Review the core definitions and practical applications covered in this topic."
        return summary, key_takeaway

    def _fallback_key_points(self, text: str) -> List[str]:
        meaningful = self._clean_content_lines(text)
        if meaningful:
            return [m if m.endswith(".") else f"{m}." for m in meaningful[:5]]
        return [
            "Understand the fundamental definition and purpose of the topic.",
            "Identify the key characteristics and operational steps.",
            "Compare primary use cases with real-world applications.",
            "Review core advantages, limitations, and performance metrics."
        ]

    def _fallback_quiz(self, text: str, count: int) -> List[AIQuizQuestion]:
        meaningful = self._clean_content_lines(text)
        questions = []
        for i in range(min(count, len(meaningful))):
            fact = meaningful[i]
            questions.append(AIQuizQuestion(
                question=f"Which statement correctly reflects the concept discussed in the study note?",
                options=[
                    fact[:80] + ("..." if len(fact) > 80 else ""),
                    "It has no practical relation to the subject matter",
                    "It operates in complete opposition to standard guidelines",
                    "None of the above"
                ],
                correct_answer=fact[:80] + ("..." if len(fact) > 80 else ""),
                explanation=f"Based on the study note: {fact[:120]}."
            ))
        while len(questions) < count:
            questions.append(AIQuizQuestion(
                question="What is the central learning objective of this study module?",
                options=[
                    "Mastering the fundamental concepts and practical workflows",
                    "Memorizing isolated terminology without context",
                    "Ignoring standard system configurations",
                    "None of the above"
                ],
                correct_answer="Mastering the fundamental concepts and practical workflows",
                explanation="The study material emphasizes core principles and practical workflows."
            ))
        return questions


ai_service = AIService()
