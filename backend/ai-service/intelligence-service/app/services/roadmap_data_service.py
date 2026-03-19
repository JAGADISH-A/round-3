"""Roadmap Data Service — Loads local roadmap JSON datasets."""

import os
import json
from typing import Dict, Any, List, Optional

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "roadmaps")

def get_available_roadmaps() -> List[str]:
    """List all available roadmap JSON files (without extension)."""
    if not os.path.exists(DATA_PATH):
        return []
    return [f.replace(".json", "") for f in os.listdir(DATA_PATH) if f.endswith(".json")]

def load_roadmap_data(roadmap_type: str) -> Optional[Dict[str, Any]]:
    """Load a specific roadmap JSON file."""
    file_path = os.path.join(DATA_PATH, f"{roadmap_type}.json")
    if not os.path.exists(file_path):
        return None
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[RoadmapData] Error loading {roadmap_type}: {e}")
        return None

def find_best_roadmap(goal: str) -> str:
    """Map a user goal to the closest available roadmap."""
    roadmaps = get_available_roadmaps()
    if not roadmaps:
        return ""
    
    goal_lower = goal.lower()
    
    # Simple keyword matching
    if "frontend" in goal_lower: return "frontend"
    if "backend" in goal_lower: return "backend"
    if "devops" in goal_lower or "sre" in goal_lower or "cloud" in goal_lower: return "devops"
    
    # Default to the first one or generic logic
    return roadmaps[0]
