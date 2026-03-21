"""Skill Gap Analyzer — Compares user skills with roadmap requirements."""

from typing import List, Dict, Any

def analyze_skill_gaps(user_skills: List[str], roadmap_phases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyzes which skills in the roadmap are already possessed by the user.
    Returns the enriched phases with completion status.
    """
    user_skills_lower = [s.lower().strip() for s in user_skills]
    
    enriched_phases = []
    
    for phase_data in roadmap_phases:
        phase_name = phase_data.get("phase", "Unknown Phase")
        skills = phase_data.get("skills", [])
        
        enriched_skills = []
        for skill in skills:
            skill_lower = skill.lower().strip()
            # Simple matching: exact or substring
            is_completed = any(
                skill_lower == u or skill_lower in u or u in skill_lower 
                for u in user_skills_lower
            )
            enriched_skills.append({
                "name": skill,
                "completed": is_completed
            })
            
        enriched_phases.append({
            **phase_data,
            "phase": phase_name,
            "skills": enriched_skills
        })
        
    return enriched_phases

def get_next_skills(enriched_phases: List[Dict[str, Any]], limit: int = 3) -> List[str]:
    """Identify the first few uncompleted skills in the roadmap."""
    next_skills = []
    for phase in enriched_phases:
        for skill in phase["skills"]:
            if not skill["completed"]:
                next_skills.append(skill["name"])
                if len(next_skills) >= limit:
                    return next_skills
    return next_skills
