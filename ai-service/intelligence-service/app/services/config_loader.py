"""Config Loader Service — Cached access to JSON configuration files."""

import os
import json
from functools import lru_cache
from typing import List, Dict, Any

CONFIG_DIR = os.path.join(os.path.dirname(__file__), "..", "config")

@lru_cache(maxsize=1)
def get_models() -> List[Dict[str, Any]]:
    """Load and cache models.json."""
    path = os.path.join(CONFIG_DIR, "models.json")
    try:
        with open(path, "r") as f:
            data = json.load(f)
            return data.get("models", [])
    except Exception as e:
        print(f"[ConfigLoader] Error loading models: {e}")
        return []

@lru_cache(maxsize=1)
def get_personas() -> List[Dict[str, Any]]:
    """Load and cache personas.json."""
    path = os.path.join(CONFIG_DIR, "personas.json")
    try:
        with open(path, "r") as f:
            data = json.load(f)
            return data.get("personas", [])
    except Exception as e:
        print(f"[ConfigLoader] Error loading personas: {e}")
        return []

def clear_config_cache():
    """Clear the cached configs."""
    get_models.cache_clear()
    get_personas.cache_clear()
