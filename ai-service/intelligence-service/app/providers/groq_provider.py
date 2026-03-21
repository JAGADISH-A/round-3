"""Groq LLM Provider — Specialized logic for Groq/Llama models."""

from typing import List, Dict, Any
from app.services.ai_config import llm

def call_groq(prompt: str, history: List[Dict[str, str]] = None, system_prompt: str = None) -> str:
    """Invoke Llama 3 via Groq with system instruction and history."""
    messages = []
    
    if system_prompt:
        messages.append(("system", system_prompt))
        
    if history:
        for msg in history:
            messages.append((msg["role"], msg["content"]))
    
    messages.append(("human", prompt))
    
    response = llm.invoke(messages)
    return response.content
