from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.config_loader import get_personas
from app.services.model_registry import get_model
from app.services.persona_prompt_builder import build_system_prompt, validate_persona_id
from app.services.model_router import call_model
from app.services.tts_service import sanitize_for_tts

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "llama33"
    persona: str = "career_coach"
    tone: str = "friendly"
    session_id: Optional[str] = None
    analysis_context: Optional[Dict[str, Any]] = None
    lang: str = "en"
    intent: Optional[str] = None
    user_profile: Optional[Dict[str, Any]] = None
    stream_audio: bool = False

@router.post("/chat")
async def chat_mcp(request: ChatRequest, background_tasks: BackgroundTasks):
    """
    Enhanced chat endpoint with Model Context Control (MCP) and Smart Intent Routing.
    """
    from app.services.config_loader import clear_config_cache
    from app.services.intent_detector import detect_intent
    from app.services.roadmap_generator import generate_roadmap_suggestions, generate_personalized_roadmap, format_roadmap_to_markdown
    import json
    import re

    clear_config_cache()

    # Server-side language safety net — detect Tamil in user message
    import re as _re
    last_content = request.messages[-1].content if request.messages else ""
    tamil_chars = len(_re.findall(r'[\u0B80-\u0BFF]', last_content))
    alpha_chars = len(_re.findall(r'[A-Za-z\u0B80-\u0BFF]', last_content))
    if alpha_chars > 0 and tamil_chars / alpha_chars > 0.2:
        request = request.model_copy(update={"lang": "ta"})

    # 1. Validation
    model_info = get_model(request.model)
    if not validate_persona_id(request.persona):
        raise HTTPException(status_code=400, detail=f"Invalid persona ID: {request.persona}")

    user_query = request.messages[-1].content
    user_profile = request.user_profile or {}
    user_skills = user_profile.get("skills", [])

    # 2. Intent Detection
    intent_data = detect_intent(user_query)
    intent = request.intent or intent_data.get("intent", "career_question")

    # 3. Smart Routing (Roadmaps)
    options = None
    if intent == "roadmap_request":
        selected_level = None
        role = "Software Engineer"
        
        try:
            if user_query.strip().startswith("{") and "roadmap_selection" in user_query:
                payload = json.loads(user_query)
                selected_level = payload.get("selected")
                role = payload.get("query", role)
        except: pass

        if not selected_level:
            low_query = user_query.lower()
            if "beginner" in low_query: selected_level = "beginner"
            elif "advanced" in low_query: selected_level = "advanced"
            elif "specialized" in low_query: selected_level = "specialized"

        if not role or role == "Software Engineer":
            role_match = re.search(r"(?:become a|roadmap for|path to|as a) ([\w\s]+)", user_query.lower())
            role = role_match.group(1).strip() if role_match else "Software Engineer"
        
        if selected_level:
            roadmap = generate_personalized_roadmap(role, user_skills, level=selected_level, lang=request.lang)
            response_text = format_roadmap_to_markdown(roadmap)
            pref = "இலக்கிற்கு வாழ்த்துகள்! " if request.lang == "ta" else "Excellent choice! "
            final_response = f"{pref}Here is your detailed **{selected_level.capitalize()}** roadmap for **{role}**:\n\n{response_text}"
            
            # Next Steps Icons
            options = [
                {"id": "interview_prep", "title": "🎯 Interview Prep", "desc": f"Practice {role} questions."},
                {"id": "study_plan", "title": "📚 Study Plan", "desc": "Convert this to a calendar."},
                {"id": "resume_review", "title": "📄 Resume Boost", "desc": f"Tailor your resume."}
            ]
            
            return {
                "response": final_response,
                "tts_text": sanitize_for_tts(final_response),
                "model": model_info["name"],
                "persona": request.persona,
                "tone": request.tone,
                "intent": intent,
                "options": options,
                "lang": request.lang
            }
        else:
            options = generate_roadmap_suggestions(role, user_skills=user_skills, lang=request.lang)
            resp_msg = "உங்கள் எதிர்காலப் பாதையை நான் ஆய்வு செய்துள்ளேன். எதைத் தேர்ந்தெடுக்க விரும்புகிறீர்கள்?" if request.lang == "ta" else f"I've analyzed the best paths for **{role}**. Which one would you like to explore?"
            return {
                "response": resp_msg,
                "tts_text": sanitize_for_tts(resp_msg),
                "model": model_info["name"],
                "persona": request.persona,
                "tone": request.tone,
                "intent": intent,
                "options": options,
                "roadmapQuery": role,
                "type": "roadmap_options",
                "lang": request.lang
            }

    # 4. Standard Chat Flow
    system_prompt = build_system_prompt(
        request.persona, 
        request.tone, 
        request.analysis_context, 
        request.lang, 
        intent,
        user_profile=request.user_profile
    )
    
    history = [{"role": m.role, "content": m.content} for m in request.messages[:-1]]
    
    try:
        response_text = call_model(
            model_id=request.model, 
            prompt=user_query, 
            history=history, 
            system_prompt=system_prompt
        )
        
        personas = get_personas()
        persona_name = next((p["name"] for p in personas if p["id"] == request.persona), "Career Coach")
        
        audio_url = None
        if request.stream_audio:
            try:
                from app.services.tts_service import tts_service
                import os, uuid, tempfile

                # Use sanitized text for speech
                speech_text = sanitize_for_tts(response_text)
                if len(speech_text) > 400:
                    speech_text = speech_text[:400] + "..."
                speech_lang = request.lang

                # Pre-generate the filename so we can return the URL immediately
                temp_dir = os.path.join(tempfile.gettempdir(), "bumblebee_tts")
                os.makedirs(temp_dir, exist_ok=True)
                audio_filename = f"{uuid.uuid4()}.mp3"
                audio_path = os.path.join(temp_dir, audio_filename)
                audio_url = f"/api/audio/{audio_filename}"

                # Generate audio in the background — response is not blocked
                async def _generate_audio():
                    try:
                        import edge_tts
                        voices = {"en": "en-IN-PrabhatNeural", "ta": "ta-IN-PallaviNeural"}
                        voice = voices.get(speech_lang, voices["en"])
                        communicate = edge_tts.Communicate(speech_text, voice)
                        await communicate.save(audio_path)
                    except Exception as bg_err:
                        print(f"[TTS Background] Error: {bg_err}")

                background_tasks.add_task(_generate_audio)
                print(f"[TTS] Queued background audio: {audio_filename} (lang={speech_lang})")
            except Exception as e:
                print(f"[TTS] Setup error (non-fatal): {e}")
                audio_url = None
                
        return {
            "response": response_text,
            "tts_text": sanitize_for_tts(response_text),
            "model": model_info["name"],
            "persona": persona_name,
            "tone": request.tone,
            "intent": intent,
            "audio_url": audio_url,
            "lang": request.lang
        }
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
