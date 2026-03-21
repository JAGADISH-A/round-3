import re
import json
from typing import Dict, Any
from app.services.ai_config import llm

INTENT_PROMPT = """Analyze the following user message and classify it into exactly one intent.

SUPPORTED INTENTS:
- greeting: "hello", "hi", "how are you", "good morning"
- career_question: specific questions about jobs, skills, industries, or advice.
- salary_query: questions about pay, compensation, or money.
- roadmap_request: "how to become X", "learning path for Y", "roadmap for Z".
- interview_practice: "ask me questions", "startup interview", "test my skills".
- general_chat: non-career related talk or simple affirmations ("ok", "thanks").

USER MESSAGE: "{query}"

Return ONLY a JSON object:
{{
  "intent": "intent_name",
  "confidence": 0.0-1.0
}}"""

def detect_intent(query: str) -> Dict[str, Any]:
    """Detect user intent using LLM."""
    try:
        # Fast path for very short messages
        q = query.lower().strip()
        if q in ["hi", "hello", "hey", "howdy", "good morning", "good evening"]:
            return {"intent": "greeting", "confidence": 1.0}
        if q in ["thanks", "thank you", "ok", "cool", "nice"]:
            return {"intent": "general_chat", "confidence": 1.0}

        formatted_prompt = INTENT_PROMPT.format(query=query)
        response = llm.invoke(formatted_prompt)
        content = response.content.strip()
        
        # Extract JSON
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)
        
        return json.loads(content)
    except Exception as e:
        print(f"[IntentDetector] Error: {e}")
        return {"intent": "career_question", "confidence": 0.5} # Neutral fallback
