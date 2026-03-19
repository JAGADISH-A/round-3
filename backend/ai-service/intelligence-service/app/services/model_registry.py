"""Model Registry — Validates and retrieves model information."""

from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.services.config_loader import get_models

def get_model(model_id: str) -> Dict[str, Any]:
    """Retrieve model info by ID or raise 400."""
    models = get_models()
    for m in models:
        if m["id"] == model_id:
            return m
    
    raise HTTPException(
        status_code=400, 
        detail=f"Invalid model ID: {model_id}. Available: {[m['id'] for m in models]}"
    )

def validate_model_id(model_id: str) -> bool:
    """Check if model_id is valid."""
    models = get_models()
    return any(m["id"] == model_id for m in models)
