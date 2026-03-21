"""Model Router — Dispatches requests to specific LLM providers."""

from typing import List, Dict, Any
from app.providers.groq_provider import call_groq

def call_model(model_id: str, prompt: str, history: List[Dict[str, str]] = None, system_prompt: str = None) -> str:
    """Route to correct provider with system instructions."""
    
    if model_id == "llama33":
        return call_groq(prompt, history, system_prompt)
    
    # Placeholders for future providers
    elif model_id == "deepseek":
        return "DeepSeek Coder integration coming soon."
    elif model_id == "gpt4o":
        return "OpenAI integration coming soon."
    
    # Default to llama33 as the only active provider for now
    return call_groq(prompt, history)
