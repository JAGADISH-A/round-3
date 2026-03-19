"""Intelligence Service — Aggregate career readiness from all analysis modules."""

from typing import List, Dict, Any
from app.services.resume_analyzer import calculate_technical_depth
from app.services.voice_analyzer import calculate_vocal_precision
from app.services.market_alignment import calculate_market_alignment


# Weights for MASTER SIGNAL computation
WEIGHTS = {
    "technical": 0.50,
    "vocal": 0.20,
    "market": 0.30,
}


def calculate_career_readiness(
    resume_analysis: Dict[str, Any],
    voice_history: List[Dict[str, Any]],
    voice_metrics: Dict[str, Any] | None = None,
    target_role: str | None = None,
) -> Dict[str, Any]:
    """
    Aggregate signals from resume, voice, and market modules to compute
    a unified MASTER SIGNAL career readiness score.
    """

    # Determine target role
    role = target_role or resume_analysis.get(
        "confirmed_role",
        resume_analysis.get("inferred_role", "backend developer"),
    )

    # Extract resume full text
    resume_text = resume_analysis.get("full_text", "") or resume_analysis.get("resume_text", "")
    if not resume_text:
        # Build text from skills arrays if text isn't stored directly
        skills = resume_analysis.get("detected_skills", [])
        resume_text = " ".join(skills) if skills else ""

    # --- SIGNAL 1: Technical Depth (from resume) ---
    tech_result = calculate_technical_depth(resume_text, role)
    technical_score = tech_result["technical_depth"]

    # Boost technical score if resume_analysis already has a strength_score
    existing_strength = resume_analysis.get("strength_score", 0)
    if existing_strength > 0:
        technical_score = round((technical_score * 0.6) + (existing_strength * 0.4))

    # --- SIGNAL 2: Vocal Precision (from voice history or explicit metrics) ---
    if voice_metrics:
        clarity = voice_metrics.get("clarity", 0)
        confidence = voice_metrics.get("confidence", 0)
        pacing = voice_metrics.get("pacing", 0)
        vocal_score = round((clarity + confidence + pacing) / 3)
        vocal_detail = {"clarity": clarity, "confidence": confidence, "pacing": pacing, "vocal_precision": vocal_score}
    else:
        vocal_detail = calculate_vocal_precision(voice_history)
        vocal_score = vocal_detail["vocal_precision"]

    # --- SIGNAL 3: Market Alignment ---
    market_result = calculate_market_alignment(resume_text, role)
    market_score = market_result["market_alignment"]

    # Boost from ATS if available
    ats_score = resume_analysis.get("ats_score", 0)
    if ats_score > 0:
        market_score = round((market_score * 0.6) + (ats_score * 0.4))

    # --- SIGNAL 4: Skill Signal (supplementary, not in master formula) ---
    skill_score = min(tech_result.get("total_keywords_found", 0) * 5, 100)

    # --- MASTER SIGNAL ---
    master_signal = round(
        (technical_score * WEIGHTS["technical"])
        + (vocal_score * WEIGHTS["vocal"])
        + (market_score * WEIGHTS["market"])
    )

    # --- Readiness Level ---
    if master_signal >= 80:
        readiness_level = "High Readiness"
    elif master_signal >= 60:
        readiness_level = "Moderate Readiness"
    elif master_signal >= 40:
        readiness_level = "Developing"
    else:
        readiness_level = "Early Stage"

    # --- Expert Insights ---
    insights = _generate_insights(
        technical_score, vocal_score, market_score, skill_score,
        tech_result, market_result, vocal_detail, role
    )

    return {
        "master_signal": master_signal,
        "aggregate_score": master_signal,
        "readiness_level": readiness_level,
        "primary_role": role,
        "signals": {
            "technical": technical_score,
            "vocal": vocal_score,
            "market": market_score,
        },
        "skill_signal": skill_score,
        "technical_depth": technical_score,
        "vocal_precision": vocal_score,
        "market_alignment": market_score,
        "missing_skills": tech_result.get("missing_skills", []),
        "missing_market_keywords": market_result.get("missing_market_keywords", []),
        "insights": insights,
    }


def _generate_insights(
    technical: int, vocal: int, market: int, skill: int,
    tech_result: Dict, market_result: Dict, vocal_detail: Dict, role: str,
) -> List[str]:
    """Generate contextual expert feedback based on computed scores."""
    insights = []

    # Technical insights
    missing = tech_result.get("missing_skills", [])
    if technical < 60 and missing:
        top_missing = ", ".join(missing[:4])
        insights.append(
            f"Your resume lacks critical skills for {role}: {top_missing}. "
            "Focus on adding hands-on project experience with these technologies."
        )
    elif technical < 80:
        insights.append(
            "Technical depth is moderate. Consider contributing to open-source projects "
            "or building side projects that demonstrate depth in your core stack."
        )

    # Vocal insights
    if vocal < 50:
        insights.append(
            "Your interview presence needs significant work. Practice structured responses "
            "using the STAR method and record yourself to improve pacing."
        )
    elif vocal < 70:
        pacing = vocal_detail.get("pacing", 0)
        if pacing < 60:
            insights.append(
                "Your vocal pacing indicates possible anxiety. Practice slow, deliberate responses. "
                "Aim for 120-150 words per minute."
            )
        else:
            insights.append(
                "Vocal presence is developing well. Focus on projecting confidence and "
                "eliminating filler words like 'um' and 'uh'."
            )

    # Market insights
    missing_market = market_result.get("missing_market_keywords", [])
    if market < 60 and missing_market:
        top_market = ", ".join(missing_market[:4])
        insights.append(
            f"Market alignment is low. High-demand skills you're missing: {top_market}. "
            "These are frequently listed in job postings for this role."
        )

    # Skill breadth
    if skill < 40:
        insights.append(
            "Your skill breadth is narrow. Broaden your toolkit by learning "
            "complementary technologies used alongside your primary stack."
        )

    # Positive reinforcement
    if not insights:
        insights.append(
            "Your career readiness signals are strong across all dimensions. "
            "Focus on advanced system design and leadership skills to reach the next level."
        )

    return insights
