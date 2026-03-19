from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.config_loader import get_personas
from app.services.model_registry import get_model
from app.services.persona_prompt_builder import build_system_prompt, validate_persona_id
from app.services.model_router import call_model

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

@router.post("/chat")
def chat_mcp(request: ChatRequest):
    """
    Enhanced chat endpoint with Model Context Control (MCP).
    """
    # Force clear cache to ensure latest personas are loaded
    from app.services.config_loader import clear_config_cache
    clear_config_cache()

    # 1. Validation
    model_info = get_model(request.model)
    if not validate_persona_id(request.persona):
        raise HTTPException(status_code=400, detail=f"Invalid persona ID: {request.persona}")

    # 2. Build Prompt
    system_prompt = build_system_prompt(request.persona, request.tone, request.analysis_context)
    user_query = request.messages[-1].content
    
    # 3. Call Model via Router
    history = [{"role": m.role, "content": m.content} for m in request.messages[:-1]]
    
    try:
        response_text = call_model(
            model_id=request.model, 
            prompt=user_query, 
            history=history, 
            system_prompt=system_prompt
        )
        
        # 4. Return response with metadata
        personas = get_personas()
        persona_name = next((p["name"] for p in personas if p["id"] == request.persona), "Career Coach")
        
        return {
            "response": response_text,
            "model": model_info["name"],
            "persona": persona_name,
            "tone": request.tone,
            "intent": "general_chat"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
