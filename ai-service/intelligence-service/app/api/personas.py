from fastapi import APIRouter
from app.services.config_loader import get_personas

router = APIRouter()

@router.get("/personas")
def list_personas():
    """Return list of available AI personas from config."""
    return get_personas()
