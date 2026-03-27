import os
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import services
try:
    from backend.resume_service import analyze_resume, analyze_resume_text, rewrite_bullet_with_gemini
    from backend.jd_matcher import match_resume_to_jd, extract_taxonomy_skills, _get_match_label
except ImportError:
    from resume_service import analyze_resume, analyze_resume_text, rewrite_bullet_with_gemini
    from jd_matcher import match_resume_to_jd, extract_taxonomy_skills, _get_match_label

app = FastAPI(title="BumbleBee AI — Resume Intelligence")

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class AnalyzeRoleRequest(BaseModel):
    full_text: str
    target_role: str
    jd_text: Optional[str] = None

class RewriteBulletRequest(BaseModel):
    bullet: str
    target_role: str = "Software Engineer"
    missing_keywords: List[str] = []
    jd_context: str = ""
    jd_text: str = ""  # Alternative: raw JD text for context injection

class RescoreRequest(BaseModel):
    updated_resume_text: str
    jd_text: str
    previous_score: float = 0
    role: str = "Software Engineer"

class GenerateBulletRequest(BaseModel):
    skill: str
    role: str = "Software Engineer"

# --- Endpoints ---

@app.get("/api/resume/health")
async def health():
    """Returns the service health and current pipeline mode."""
    # We check if Gemini API key exists to determine pipeline
    gemini_key = os.getenv("GOOGLE_API_KEY")
    return {
        "status": "ok",
        "pipeline": "gemini" if gemini_key else "local",
        "service": "BumbleBee AI Backend"
    }

@app.post("/api/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    jd_text: Optional[str] = Query(None)
):
    """Handle resume upload, parsing, and optional JD matching."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        content = await file.read()
        # Full analysis (Parsing + ATS Scoring)
        analysis = analyze_resume(content, jd_text)
        
        # Optional JD Match
        if jd_text:
            jd_match = match_resume_to_jd(analysis.get("full_text", ""), jd_text)
            analysis["jd_match"] = jd_match
        else:
            analysis["jd_match"] = None
            
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/analyze-role")
async def analyze_role(request: AnalyzeRoleRequest):
    """Re-analyze existing resume text against a specific target role."""
    try:
        analysis = analyze_resume_text(request.full_text, request.jd_text)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/rewrite-bullet")
async def rewrite_bullet(request: RewriteBulletRequest):
    """Rewrite a specific bullet point using AI."""
    try:
        result = rewrite_bullet_with_gemini(
            request.bullet,
            request.target_role,
            request.missing_keywords,
            request.jd_context or request.jd_text
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/resume/rescore")
async def rescore_resume(request: RescoreRequest):
    """
    Re-score the JD match after a bullet point has been applied.
    Returns score_delta, new_score, match_label, and readiness fields.
    """
    try:
        if not request.jd_text.strip():
            raise HTTPException(status_code=400, detail="jd_text is required for rescoring")

        jd_result = match_resume_to_jd(
            request.updated_resume_text,
            request.jd_text,
            target_role=request.role,
        )
        new_score = jd_result["jd_match_score"]
        score_delta = round(new_score - request.previous_score, 1)

        # Readiness label based on score
        if new_score >= 80:
            readiness_label = "Strong Candidate"
            resume_readiness = 90
        elif new_score >= 65:
            readiness_label = "Interview Ready"
            resume_readiness = 75
        elif new_score >= 45:
            readiness_label = "Improving"
            resume_readiness = 55
        else:
            readiness_label = "Beginner"
            resume_readiness = 35

        micro_feedback = (
            f"Score moved from {request.previous_score} → {new_score}"
            + (f" (+{score_delta} 🚀)" if score_delta > 0 else " (no change)")
        )

        return {
            **jd_result,
            "new_score": new_score,
            "score_delta": score_delta,
            "resume_readiness": resume_readiness,
            "readiness_label": readiness_label,
            "micro_feedback": micro_feedback,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/resume/generate-bullet-from-skill")
async def generate_bullet_from_skill(request: GenerateBulletRequest):
    """
    Generate a placeholder bullet point for a given missing skill.
    Used by the dashboard when user clicks on a missing keyword.
    """
    try:
        result = rewrite_bullet_with_gemini(
            bullet=f"Used {request.skill} in my projects",
            role=request.role,
            missing_keywords=[request.skill],
            context=(
                f"Generate a single, strong, impact-driven resume bullet point that highlights "
                f"experience with '{request.skill}' for a '{request.role}' role. "
                f"Start with an action verb. Include a realistic metric. Keep it one line."
            ),
        )
        return {
            "bullet": result.get("rewritten",
                f"Implemented {request.skill} integration, improving system performance by 25%"
            ),
            "skill": request.skill,
        }
    except Exception as e:
        # Graceful fallback — never crash the UI
        return {
            "bullet": f"Implemented {request.skill} integration, reducing latency by 30% and improving reliability.",
            "skill": request.skill,
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
