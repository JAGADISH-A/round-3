from fastapi import APIRouter
from app.services.config_loader import get_models

router = APIRouter()

@router.get("/models")
def list_models():
    """Return list of available AI models from config."""
    return get_models()
