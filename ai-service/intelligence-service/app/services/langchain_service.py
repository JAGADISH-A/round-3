import os
import json
import re
from typing import List, Dict, Any, Optional
from pypdf import PdfReader
from io import BytesIO
from sentence_transformers import SentenceTransformer  # type: ignore
import chromadb  # type: ignore
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from app.services.ai_config import llm, voice_llm, MODEL_NAME
from app.services.intent_detector import detect_intent
from app.services.roadmap_generator import generate_personalized_roadmap, format_roadmap_to_markdown
from app.services.vector_db_service import retrieve_context
from app.services.tts_service import sanitize_for_tts, TTS_SPEECH_RULES
from dotenv import load_dotenv

load_dotenv()

import time

def _escape_braces(text: str) -> str:
    """Escape curly braces for LangChain templates."""
    return text.replace("{", "{{").replace("}", "}}")


def detect_language(text: str) -> str:
    """
    Ratio-based language detection: matches frontend detectLanguage() logic.
    Returns 'ta' if Tamil chars > 20% of all alphabetic chars, else 'en'.
    """
    tamil_chars = len(re.findall(r'[\u0B80-\u0BFF]', text))
    alpha_chars = len(re.findall(r'[A-Za-z\u0B80-\u0BFF]', text))
    if alpha_chars > 0 and tamil_chars / alpha_chars > 0.2:
        return "ta"
    return "en"

# Backwards-compat alias
def contains_tamil(text: str) -> bool:
    return detect_language(text) == "ta"


# ─── Chat ─────────────────────────────────────────────────────────────────────
def get_chat_response(messages: List[Dict[str, str]], user_profile: Optional[Dict[str, Any]] = None, lang: str = "en") -> Dict[str, Any]:
    """Generate a smart, role-aware response as a Career Coach with user memory."""
    start_total = time.time()
    user_query = messages[-1]["content"]
    user_skills = user_profile.get("skills", []) if user_profile else []
    
    # Force language detection if not provided or to verify
    detected_lang = "ta" if contains_tamil(user_query) else lang
    print(f"[Chat] User Query: {user_query[:50]}... | Lang: {detected_lang}")

    # 1. Intent Detection
    intent_data = detect_intent(user_query)
    intent = intent_data.get("intent", "career_question")
    
    print(f"[Chat] Detected Intent: {intent} (Confidence: {intent_data.get('confidence')})")

    context = ""
    sources = []
    response_text = ""

    # 2. Routing Logic
    if intent == "roadmap_request":
        # Check if user already selected a level or sent a selection payload
        selected_level = None
        role = "Software Engineer"
        
        try:
            # Handle JSON payload from frontend
            if user_query.strip().startswith("{") and "roadmap_selection" in user_query:
                payload = json.loads(user_query)
                selected_level = payload.get("selected")
                role = payload.get("query", role)
        except:
            pass

        # Fallback to keyword detection if not JSON
        if not selected_level:
            low_query = user_query.lower()
            if "beginner" in low_query: selected_level = "beginner"
            elif "advanced" in low_query: selected_level = "advanced"
            elif "specialized" in low_query: selected_level = "specialized"

        # Extract role from query (rough heuristic)
        if not role or role == "Software Engineer":
            role_match = re.search(r"(?:become a|roadmap for|path to|as a) ([\w\s]+)", user_query.lower())
            role = role_match.group(1).strip() if role_match else "Software Engineer"
        
        if selected_level:
            # Phase 2: Generate detailed roadmap for selected level
            roadmap = generate_personalized_roadmap(role, user_skills, level=selected_level, lang=detected_lang)
            response_text = format_roadmap_to_markdown(roadmap)
            
            # Add Smart Suggestions for next steps
            next_steps = [
                {"id": "interview_prep", "title": "🎯 Interview Prep", "desc": f"Practice common {role} questions."},
                {"id": "study_plan", "title": "📚 Study Plan", "desc": "Convert this roadmap into a calendar."},
                {"id": "resume_review", "title": "📄 Resume Boost", "desc": f"Tailor your resume for {role} roles."}
            ]

            prefix = "இலக்கிற்கு வாழ்த்துகள்!" if detected_lang == "ta" else "Excellent choice!"
            
            full_response = f"{prefix} Here is your detailed **{selected_level.capitalize()}** roadmap for **{role}**:\n\n{response_text}"
            return {
                "response": full_response,
                "tts_text": sanitize_for_tts(full_response),
                "sources": [],
                "model": MODEL_NAME,
                "intent": intent,
                "roadmap_type": "detailed",
                "level": selected_level,
                "options": next_steps, # Use 'options' key for consistency with frontend interactive flow
                "lang": detected_lang
            }
        else:
            # Phase 1: Provide 3 distinct options (JSON Structure)
            from app.services.roadmap_generator import generate_roadmap_suggestions
            options = generate_roadmap_suggestions(role, user_skills=user_skills, lang=detected_lang)
            
            response_msg = "உங்கள் எதிர்காலப் பாதையை நான் ஆய்வு செய்துள்ளேன். எதைத் தேர்ந்தெடுக்க விரும்புகிறீர்கள்?" if detected_lang == "ta" else f"I've analyzed the best paths for **{role}**. Which one would you like to explore?"
            
            return {
                "response": response_msg,
                "tts_text": sanitize_for_tts(response_msg),
                "sources": [],
                "model": MODEL_NAME,
                "intent": intent,
                "type": "roadmap_options",
                "options": options,
                "query": role,
                "lang": detected_lang
            }
    
    elif intent in ["career_question", "salary_query"]:
        # Run RAG only for data-heavy intents
        context, sources = retrieve_context(user_query, k=5)
    
    # 3. Build Coach Prompt
    context_block = f"\n\nDATASET SIGNALS (Use if helpful):\n{context}" if context else ""
    
    # Personalization Logic
    user_context = ""
    if user_profile:
        goal = user_profile.get("goal", "career growth")
        skills = ", ".join(user_profile.get("skills", []))
        user_context = f"\nUSER INFO: Goal: {goal}, Known Skills: {skills}"

    # Dynamic Language Prompts
    if detected_lang == "ta":
        lang_instruction = (
            "LANGUAGE RULE: You MUST speak ONLY in Tamil. "
            "Do NOT use English words. Do NOT provide English translations. "
            "Use natural, professional, and supportive spoken Tamil. "
            "If the user asks a question, answer it fully in Tamil."
        )
    else:
        lang_instruction = "LANGUAGE RULE: Speak ONLY in English."

    system_prompt = (
        "You are CareerSpark AI — a friendly, proactive, and highly insightful Career Coach. "
        "Your goal is to guide the user step-by-step toward their career goals.\n\n"
        f"{lang_instruction}\n\n"
        f"COACHING RULES:\n"
        "1. Be conversational and supportive. Avoid sounding like a database.\n"
        "2. If the user's goal is broad, ask 1-2 clarifying questions.\n"
        "3. Refer to the user's career goal periodically to keep them motivated.\n"
        "4. If you don't have specific data, give expert general advice.\n"
        "5. Keep responses concise but actionable. Ensure every sentence is complete.\n"
        "6. CRITICAL: Never truncate your response. Finish your final thought completely."
        f"{user_context}"
        f"{context_block}"
        f"{TTS_SPEECH_RULES}"
    )
    system_prompt = _escape_braces(system_prompt)

    # 4. Build message list
    langchain_messages: List = [SystemMessage(content=system_prompt)]
    
    # Add history (last 5 turns for memory)
    for msg in messages[-6:-1]:
        if msg["role"] == "user":
            langchain_messages.append(HumanMessage(content=msg["content"]))
        else:
            langchain_messages.append(AIMessage(content=msg["content"]))
    
    langchain_messages.append(HumanMessage(content=user_query))

    print(f"[Chat] Model invocation started...")
    t_llm = time.time()
    # 5. Invoke LLM
    response = llm.invoke(langchain_messages)
    response_text = response.content
    print(f"[Chat] LLM invocation took {time.time() - t_llm:.2f}s")

    # 6. Strict Validation (Anti-Mixing)
    if detected_lang == "ta" and not contains_tamil(response_text):
        print("[Chat] Validation Failed: Expected Tamil but got English. Retrying...")
        retry_messages = langchain_messages + [
            AIMessage(content=response_text),
            HumanMessage(content="பெயர் தெரியாத மொழியில் பதில் சொல்ல வேண்டாம். தமிழில் மட்டும் பதில் சொல்லவும்.")
        ]
        response = llm.invoke(retry_messages)
        response_text = response.content

    print(f"[Chat] Response Preview: {response_text[:50]}...")
    print(f"[Chat] Total Processing took {time.time() - start_total:.2f}s")

    return {
        "response": response_text,          # Full markdown for chat UI renderer
        "tts_text": sanitize_for_tts(response_text),  # Clean prose for TTS engine
        "sources": sources,
        "model": MODEL_NAME,
        "intent": intent,
        "lang": detected_lang
    }


# ─── Voice Analysis ───────────────────────────────────────────────────────────

# Filler word patterns for local detection
FILLER_PATTERNS = ["um", "uh", "like", "you know", "actually", "basically", "literally", "sort of", "kind of", "i mean"]
OFFENSIVE_WORDS = [
    "stupid", "idiot", "hate", "dumb", "useless", "incompetent", "garbage", "trash",
    "offensive", "toxic", "curse", "damn", "hell", "shit", "fuck", "bitch", "asshole"
]

def _detect_offensive_language(text: str) -> List[str]:
    """Detect offensive or unprofessional keywords."""
    text_lower = text.lower()
    detected = []
    for word in OFFENSIVE_WORDS:
        if re.search(rf"\b{word}\b", text_lower):
            detected.append(word)
    return detected

def _evaluate_structure(transcript: str) -> Dict[str, Any]:
    """Heuristic evaluation of interview answer structure (STAR method components)."""
    text_lower = transcript.lower()
    words = text_lower.split()
    
    # Heuristics for "Situation/Task", "Action", "Result"
    has_situation = any(w in text_lower for w in ["context", "situation", "task", "project", "when", "assigned"])
    has_action = any(w in text_lower for w in ["i built", "i led", "i designed", "i implemented", "i created", "i managed", "developed", "executed"])
    has_result = any(w in text_lower for w in ["result", "outcome", "consequently", "achieved", "delivered", "increased", "decreased", "saved", "improved"])
    
    score = 0
    if has_situation: score += 30
    if has_action: score += 40
    if has_result: score += 30
    
    # Length heuristic
    if len(words) < 20:
        score = min(score, 30) # Heavy penalty for very short answers
        
    quality = "Excellent" if score >= 90 else ("Good" if score >= 60 else "Needs Improvement")
    
    issues = []
    if len(words) < 30: issues.append("Answer is too short for a standard interview response.")
    if not has_situation: issues.append("Missing clear context/situation.")
    if not has_action: issues.append("Lacks specific actions taken by you.")
    if not has_result: issues.append("No clear result or outcome mentioned.")
    
    return {
        "structure_score": score,
        "content_quality": quality,
        "structure_issues": issues
    }

def _compute_local_voice_metrics(transcript: str) -> Dict[str, Any]:
    """Compute voice metrics locally from transcript text — zero API dependency."""
    words = transcript.split()
    word_count = len(words)
    lower_text = transcript.lower()

    # Filler word detection
    filler_counts: Dict[str, int] = {}
    for filler in FILLER_PATTERNS:
        count = lower_text.count(filler)
        if count > 0:
            filler_counts[filler] = count
    total_fillers = sum(filler_counts.values())
    filler_list = list(filler_counts.keys())

    # Estimate WPM (assume ~30 seconds of speech per 75 words as baseline)
    # A typical spoken response in an interview lasts 30-90 seconds
    estimated_duration_sec = max(word_count / 2.5, 10)  # ~150 WPM baseline
    wpm = int((word_count / estimated_duration_sec) * 60) if estimated_duration_sec > 0 else 0
    wpm = min(max(wpm, 80), 220)  # Clamp to realistic range

    # Sentence analysis
    sentences = [s.strip() for s in re.split(r'[.!?]+', transcript) if s.strip()]
    sentence_count = max(len(sentences), 1)
    avg_sentence_len = word_count / sentence_count

    # Pause frequency (inferred from punctuation density)
    punctuation_density = sum(1 for c in transcript if c in '.,;:!?—-') / max(word_count, 1)
    pause_freq = "low" if punctuation_density < 0.03 else ("moderate" if punctuation_density < 0.08 else "high")

    # Clarity score: penalize fillers, reward structure
    filler_penalty = min(total_fillers * 5, 40)
    structure_bonus = min(sentence_count * 3, 20)
    clarity_score = max(min(85 - filler_penalty + structure_bonus, 100), 15)

    # Confidence score: penalize hedging words, reward assertive language
    hedge_words = ["maybe", "perhaps", "i think", "i guess", "probably", "not sure", "might"]
    hedge_count = sum(lower_text.count(h) for h in hedge_words)
    assertive_words = ["i built", "i led", "i designed", "i implemented", "i created", "i managed", "achieved", "delivered"]
    assertive_count = sum(lower_text.count(a) for a in assertive_words)
    confidence_score = max(min(70 - (hedge_count * 8) + (assertive_count * 10), 100), 15)

    # Professional tone
    casual_words = ["stuff", "things", "cool", "awesome", "gonna", "wanna", "kinda", "gotta"]
    casual_count = sum(lower_text.count(c) for c in casual_words)
    professional_tone = max(min(80 - (casual_count * 10), 100), 20)

    # Content & Safety Analysis (New)
    offensive_detected = _detect_offensive_language(transcript)
    if offensive_detected:
        professional_tone = max(0, professional_tone - 50)
    
    content_eval = _evaluate_structure(transcript)
    
    # Sentence structure score
    good_structure = 10 < avg_sentence_len < 25
    sentence_structure = 80 if good_structure else (60 if avg_sentence_len < 35 else 45)

    # Overall readiness (weighted composite)
    readiness_score = int(
        clarity_score * 0.20 +
        confidence_score * 0.20 +
        professional_tone * 0.20 +
        sentence_structure * 0.20 +
        content_eval["structure_score"] * 0.20
    )

    # Generate local strengths and improvements
    strengths: List[str] = []
    improvements: List[str] = []

    if total_fillers <= 2:
        strengths.append("Minimal filler word usage")
    else:
        improvements.append(f"Reduce filler words ({total_fillers} detected: {', '.join(filler_list[:3])})")

    if confidence_score >= 70:
        strengths.append("Confident, assertive communication style")
    else:
        improvements.append("Use more assertive language — replace 'I think' with 'I believe' or 'In my experience'")

    if score := content_eval["structure_score"] >= 70:
        strengths.append("Strong STAR method structure detected")
    
    improvements.extend(content_eval["structure_issues"])
    
    if offensive_detected:
        improvements.append(f"WARNING: Potential unprofessional language detected ('{', '.join(offensive_detected)}')")

    feedback = improvements[0] if improvements else "Strong delivery overall — maintain this level of clarity and confidence."

    return {
        "filler_words": total_fillers,
        "filler_list": filler_list,
        "pacing_wpm": wpm,
        "pause_frequency": pause_freq,
        "clarity_score": clarity_score,
        "confidence_score": confidence_score,
        "professional_tone": professional_tone,
        "sentence_structure": sentence_structure,
        "readiness_score": readiness_score,
        "content_quality": content_eval["content_quality"],
        "professionalism_score": professional_tone,
        "issues_detected": improvements,
        "offensive_language_found": len(offensive_detected) > 0,
        "feedback": feedback,
        "strengths": strengths[:3],
        "improvements": improvements[:3],
        "recommendations": improvements
    }


def analyze_voice_transcript(transcript: str) -> Dict[str, Any]:
    """Hybrid voice analysis: local computation (instant) + LLM enhancement (6s timeout)."""
    print(f"[VoiceService] Analysis started for transcript: {transcript[:50]}...")
    
    # Step 1: Always compute local metrics (instant, reliable)
    local_metrics = _compute_local_voice_metrics(transcript)

    # Step 2: Try LLM enhancement with timeout
    if not voice_llm:
        print("[VoiceService] LLM not configured, returning local metrics")
        return local_metrics

    prompt = f"""You are an expert voice and speech coach specialising in interview preparation.

Analyze the following spoken interview response transcript for both speech quality and content professionalism.

TRANSCRIPT:
\"\"\"{transcript}\"\"\"

Return ONLY a strict JSON object with exactly these keys:
{{
  "filler_words": {local_metrics['filler_words']},
  "filler_list": {json.dumps(local_metrics['filler_list'])},
  "pacing_wpm": {local_metrics['pacing_wpm']},
  "pause_frequency": "{local_metrics['pause_frequency']}",
  "clarity_score": <int 0-100>,
  "confidence_score": <int 0-100>,
  "professional_tone": <int 0-100>,
  "sentence_structure": <int 0-100>,
  "readiness_score": <int 0-100>,
  "content_quality": "<Excellent | Good | Needs Improvement>",
  "professionalism_score": <int 0-100>,
  "issues_detected": ["<issue 1>", "<issue 2>"],
  "feedback": "<concise summary>",
  "strengths": ["<strength 1>"],
  "improvements": ["<improvement 1>"],
  "recommendations": ["<rec 1>"]
}}"""

    try:
        import concurrent.futures
        import json
        import re
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(voice_llm.invoke, prompt)
            response = future.result(timeout=6)
        
        raw = response.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        llm_result = json.loads(raw)

        print("[VoiceService] LLM enhancement successful")
        merged = {**local_metrics}
        
        # Merge policies
        for key in ["feedback", "strengths", "improvements", "recommendations", "issues_detected", "content_quality"]:
            if key in llm_result and llm_result[key]:
                merged[key] = llm_result[key]
        
        # Average numeric scores
        for key in ["clarity_score", "confidence_score", "professional_tone", "professionalism_score", "sentence_structure", "readiness_score"]:
            if key in llm_result and isinstance(llm_result[key], (int, float)):
                merged[key] = int((local_metrics.get(key, llm_result[key]) + llm_result[key]) / 2)

        print("[VoiceService] Analysis finished")
        return merged

    except Exception as e:
        print(f"[VoiceService] LLM Error/Timeout: {e} — returning local metrics")
        return local_metrics

# ─── Vision Feedback ──────────────────────────────────────────────────────────

def get_vision_coaching_feedback(metrics: Dict[str, Any]) -> str:
    """Generate concise AI coaching feedback based on facial behavioral metrics."""
    eye_contact = metrics.get("eye_contact", 0)
    engagement = metrics.get("engagement", 0)
    head_pose = metrics.get("head_pose", "unknown")
    confidence = metrics.get("confidence_score", 0)

    prompt = f"""You are an AI interview coach.

Analyze the candidate's facial behavior during a mock interview.

Metrics:
- Eye Contact: {eye_contact}%
- Engagement: {engagement}%
- Head Pose: {head_pose}
- Confidence Score: {confidence}%

Provide constructive advice on how the candidate can improve their interview presence.
Keep the feedback concise and actionable.

{TTS_SPEECH_RULES}"""

    try:
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        print(f"[VisionFeedback] LLM Error: {e}")
        return "Focus on maintaining consistent eye contact with the camera and keeping a steady, centered head posture to project confidence."
