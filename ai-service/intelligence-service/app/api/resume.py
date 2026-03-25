"""Resume API router — JD matching, bullet rewriting, and full career analysis."""
import os
import re
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from app.services.resume_service import parse_resume
from app.services.jd_matcher import (
    match_resume_to_jd,
    generate_suggested_bullets,
    recalculate_score,
    compute_score_delta,
    generate_improvement_summary,
    compute_readiness_score,
)

router = APIRouter(prefix="/resume", tags=["Resume"])


# ─── Models ───────────────────────────────────────────────────────────────────

class JDMatchRequest(BaseModel):
    resume_text: str
    jd_text: str
    role: Optional[str] = "Software Engineer"


class BulletRewriteRequest(BaseModel):
    bullet: str
    role: Optional[str] = "Software Engineer"
    context: Optional[str] = None
    jd_text: Optional[str] = None


class SkillBulletRequest(BaseModel):
    skill: str
    role: Optional[str] = "Backend Developer"


class ScoreUpdateRequest(BaseModel):
    updated_resume_text: str
    jd_text: str
    previous_score: int
    role: Optional[str] = "Software Engineer"
    sections_present: Optional[List[str]] = []
    skills_count: Optional[int] = 0


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_and_analyze(
    file: UploadFile = File(...),
    target_role: Optional[str] = None,
    jd_text: Optional[str] = None,
):
    """Upload PDF resume → Full analysis + optional JD match with action insights."""
    content = await file.read()
    analysis = parse_resume(content, target_role=target_role)

    if jd_text and jd_text.strip():
        resume_text = analysis.get("full_text", "")
        role = target_role or analysis.get("inferred_role", "Software Engineer")
        jd_match = match_resume_to_jd(resume_text, jd_text, role=role)
        analysis["jd_match"] = jd_match
    else:
        analysis["jd_match"] = None

    return analysis


@router.post("/jd-match")
async def jd_match(request: JDMatchRequest):
    """Match resume text against a JD. Returns full action engine output."""
    if not request.resume_text.strip():
        raise HTTPException(status_code=400, detail="resume_text cannot be empty")
    if not request.jd_text.strip():
        raise HTTPException(status_code=400, detail="jd_text cannot be empty")

    result = match_resume_to_jd(request.resume_text, request.jd_text, role=request.role or "Software Engineer")
    return result


@router.post("/generate-bullet-from-skill")
async def generate_bullet_from_skill(request: SkillBulletRequest):
    """
    Generate a weak starter bullet for a missing skill.
    The user can then send this to /rewrite-bullet for AI polish.
    """
    if not request.skill.strip():
        raise HTTPException(status_code=400, detail="skill cannot be empty")

    bullets = generate_suggested_bullets(
        [request.skill],
        role=request.role or "Backend Developer"
    )
    return {
        "skill": request.skill,
        "role": request.role,
        "bullet": bullets[0] if bullets else f"Worked with {request.skill} in a project context",
    }


@router.post("/rescore")
async def rescore_resume(request: ScoreUpdateRequest):
    """Re-evaluate JD match score after resume modification. Returns score delta + readiness."""
    if not request.updated_resume_text.strip():
        raise HTTPException(status_code=400, detail="updated_resume_text cannot be empty")
    if not request.jd_text.strip():
        raise HTTPException(status_code=400, detail="jd_text cannot be empty")

    role = request.role or "Software Engineer"
    new_score = recalculate_score(request.updated_resume_text, request.jd_text, role=role)
    delta_data = compute_score_delta(request.previous_score, new_score)
    readiness_data = compute_readiness_score(
        jd_score=new_score,
        sections_present=request.sections_present or [],
        skills_count=request.skills_count or 0,
    )
    
    # Live Heatmap Segments
    from app.services.jd_matcher import segment_and_score_resume
    text_segments = segment_and_score_resume(request.updated_resume_text, request.jd_text)

    delta = delta_data["score_delta"]
    if delta > 10:
        micro_feedback = "Strong improvement in job alignment"
    elif delta > 0:
        micro_feedback = "Good improvement in resume quality"
    elif delta == 0:
        micro_feedback = "No significant impact from this change"
    else:
        micro_feedback = "This change reduced alignment with the job"

    return {
        **delta_data,
        **readiness_data,
        "micro_feedback": micro_feedback,
        "text_segments": text_segments,
    }


@router.post("/rewrite-bullet")
async def rewrite_bullet(request: BulletRewriteRequest):
    """
    AI-powered bullet point rewriter.
    Returns the rewritten bullet + list of improvements made.
    """
    from app.services.ai_config import llm

    if not request.bullet.strip():
        raise HTTPException(status_code=400, detail="bullet cannot be empty")

    context_hint = f"at {request.context}" if request.context else ""
    jd_hint = f"\nTarget Job Description keywords: {request.jd_text[:300]}" if request.jd_text else ""

    prompt = f"""You are an elite resume coach specializing in ATS optimization and recruiter psychology.

Transform this weak resume bullet point into a powerful, impact-driven statement:

Original: "{request.bullet}"
Role: {request.role} {context_hint}{jd_hint}

Rules:
1. Start with a strong action verb (Designed, Engineered, Drove, Spearheaded, etc.)
2. Add a specific metric or outcome (e.g., "reducing latency by 40%", "handling 10k+ requests/day")
3. Mention the technology or tool used if implied
4. Keep it under 25 words
5. Return your response in EXACTLY this format (two lines only):

BULLET: <the rewritten bullet>
IMPROVEMENTS: <comma-separated list of 2-4 improvements you made>

Example:
BULLET: Engineered a FastAPI microservice processing 15K requests/day with 99.9% uptime
IMPROVEMENTS: Added measurable impact, Used strong action verb, Aligned with backend role expectations"""

    try:
        response = llm.invoke(prompt)
        raw = response.content.strip()

        # Parse structured response
        bullet_match = re.search(r"BULLET:\s*(.+)", raw, re.IGNORECASE)
        improvements_match = re.search(r"IMPROVEMENTS:\s*(.+)", raw, re.IGNORECASE)

        rewritten = bullet_match.group(1).strip().strip('"\'') if bullet_match else raw.split("\n")[0].strip().strip('"\'')
        rewritten = re.sub(r'^(Rewritten bullet:|Result:|Output:|BULLET:)\s*', '', rewritten, flags=re.IGNORECASE)

        improvements = []
        if improvements_match:
            improvements = [imp.strip() for imp in improvements_match.group(1).split(",") if imp.strip()]
        else:
            improvements = ["Added measurable impact", "Used strong action verb"]

        return {
            "original": request.bullet,
            "rewritten": rewritten,
            "role": request.role,
            "improvements": improvements,
            "before": request.bullet,
            "after": rewritten,
            **generate_improvement_summary(request.bullet, rewritten),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rewrite failed: {e}")
