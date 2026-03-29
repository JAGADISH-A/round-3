from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.coach_engine import SoftSkillAnalyzer

router = APIRouter(prefix="/coach", tags=["Coach"])
coach = SoftSkillAnalyzer()

class CoachAnalyzeRequest(BaseModel):
    scenario_id: str
    user_text: str
    history: List[Dict[str, str]] = []

@router.post("/analyze")
async def analyze_soft_skills(request: CoachAnalyzeRequest):
    """Analyze a single turn in the Soft Skill Mastery Arena."""
    try:
        result = await coach.analyze_with_coach(
            request.scenario_id,
            request.history,
            request.user_text
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scenarios")
def get_scenarios():
    """Get the list of available Mastery Arena scenarios."""
    return coach.SCENARIOS
