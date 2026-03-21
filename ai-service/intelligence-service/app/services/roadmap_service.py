"""Roadmap Service — RAG-powered learning paths with resume skill gap analysis."""

from typing import Dict, Any, List
from app.services.vector_db_service import retrieve_context

def get_career_roadmap(role: str, resume_analysis: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """
    Generate a dynamic learning roadmap for a role.
    If resume_analysis is provided, it marks skills as completed/missing.
    """
    role_clean = role.strip() or "General Developer"
    
    # ── STEP 1: Retrieve Roadmap Content from RAG ──
    # We reuse some logic similar to career_prep but focused on structured topics
    roadmap_queries = [
        f"{role_clean} career roadmap",
        f"{role_clean} learning path",
        f"{role_clean} core skills and technologies",
    ]
    
    all_context = ""
    for query in roadmap_queries:
        context, _ = retrieve_context(query, k=3)
        if context:
            all_context += context + "\n"

    # ── STEP 2: Extract Topics ──
    raw_topics = set()
    for line in all_context.split("\n"):
        clean_line = line.strip().strip("-*•").strip()
        # Topic-like line: not too long, no questions, not a sentence
        if 2 < len(clean_line) < 60 and not clean_line.endswith("?") and not any(verb in clean_line.lower() for verb in ["explain", "how to", "describe"]):
            raw_topics.add(clean_line)
    
    topics_list = list(raw_topics)
    if not topics_list:
        # Fallback if RAG fails
        topics_list = ["HTML", "CSS", "JavaScript", "Python", "Git", "SQL", "Docker", "REST APIs", "Unit Testing", "System Design", "Cloud Basics"]

    # ── STEP 3: Skill Alignment (using Resume Analysis) ──
    user_skills = [s.lower() for s in resume_analysis.get("skills", [])] if resume_analysis else []
    
    enriched_topics = []
    completed_skills = []
    missing_skills = []
    
    for topic in topics_list:
        is_completed = any(user_skill in topic.lower() or topic.lower() in user_skill for user_skill in user_skills)
        topic_obj = {"name": topic, "completed": is_completed}
        enriched_topics.append(topic_obj)
        if is_completed:
            completed_skills.append(topic)
        else:
            missing_skills.append(topic)

    # ── STEP 4: Build Stages ──
    # Rough categorization logic
    stages_data = {
        "Foundations": [],
        "Core Development": [],
        "Advanced Concepts": [],
        "Next Steps": [],
    }
    
    # Simple heuristic-based sorting
    foundations_kw = ["basic", "intro", "git", "html", "css", "logic", "command", "bash"]
    advanced_kw = ["system", "microservice", "scale", "cloud", "docker", "kubernetes", "security", "architecture"]
    
    for item in enriched_topics:
        name_lower = item["name"].lower()
        if any(kw in name_lower for kw in foundations_kw):
            stages_data["Foundations"].append(item)
        elif any(kw in name_lower for kw in advanced_kw):
            stages_data["Advanced Concepts"].append(item)
        elif len(stages_data["Core Development"]) < 8:
            stages_data["Core Development"].append(item)
        else:
            stages_data["Next Steps"].append(item)

    stages = []
    for name, items in stages_data.items():
        if items:
            stages.append({"stage": name, "topics": items[:6]}) # Cap at 6 per stage

    # ── STEP 5: Next Recommended Skill ──
    next_skill = missing_skills[0] if missing_skills else "Cloud Architecture"

    return {
        "type": "roadmap",
        "role": role_clean,
        "stages": stages,
        "completed_skills": completed_skills[:10],
        "missing_skills": missing_skills[:10],
        "next_recommended_skill": next_skill
    }
