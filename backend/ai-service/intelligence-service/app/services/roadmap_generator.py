import re
import json
from typing import Dict, Any, List, Optional
from app.services.ai_config import llm
from app.services.vector_db_service import retrieve_context
from app.services.roadmap_data_service import find_best_roadmap, load_roadmap_data
from app.services.skill_gap_analyzer import analyze_skill_gaps, get_next_skills

ROADMAP_PROMPT = """You are CareerSpark AI — an expert Career Mentor. 
Generate a personalized career roadmap for the user based on their goal and current status.

USER GOAL: {goal}
CURRENT SKILLS: {skills}
BASE ROADMAP DATA: {base_roadmap}
EXTRA CONTEXT: {context}

INSTRUCTIONS:
1. Use the BASE ROADMAP DATA as a primary structure.
2. If the user's goal is more specific, add or refine phases using the EXTRA CONTEXT from our knowledge base.
3. Keep the JSON structure strict.
4. Each skill should just be a string.

RETURN ONLY a JSON object:
{{
  "title": "Clear Roadmap Title",
  "phases": [
    {{
      "phase": "Phase Name",
      "skills": ["Skill 1", "Skill 2"]
    }}
  ],
  "mentor_note": "A short, encouraging 1-sentence note about this specific path."
}}
"""

def generate_personalized_roadmap(goal: str, user_skills: List[str]) -> Dict[str, Any]:
    """
    Orchestrates the creation of a dynamic, AI-powered roadmap.
    """
    # 1. Map goal to base roadmap
    roadmap_type = find_best_roadmap(goal)
    base_data = load_roadmap_data(roadmap_type) or {"phases": []}
    
    # 2. Retrieve extra context from RAG
    context, _ = retrieve_context(f"learning path for {goal}", k=3)
    
    # 3. Use AI to refine and personalize
    try:
        formatted_prompt = ROADMAP_PROMPT.format(
            goal=goal,
            skills=", ".join(user_skills),
            base_roadmap=json.dumps(base_data),
            context=context
        )
        
        response = llm.invoke(formatted_prompt)
        ai_data = json.loads(re.sub(r"^```(?:json)?\s*|\s*```$", "", response.content.strip()))
        
        # 4. Perform Skill Gap Analysis on the AI-generated phases
        enriched_phases = analyze_skill_gaps(user_skills, ai_data.get("phases", []))
        next_skills = get_next_skills(enriched_phases)
        
        return {
            "type": "roadmap",
            "role": goal,
            "title": ai_data.get("title", f"{goal} Roadmap"),
            "stages": enriched_phases,
            "completed_count": sum(1 for p in enriched_phases for s in p["skills"] if s["completed"]),
            "next_recommended_skill": next_skills[0] if next_skills else "Expert Specialization",
            "missing_skills": next_skills,
            "mentor_note": ai_data.get("mentor_note", "Start your journey today!")
        }
        
    except Exception as e:
        print(f"[RoadmapGenerator] AI Error: {e}")
        # Fallback to base data with analysis
        enriched_phases = analyze_skill_gaps(user_skills, base_data.get("phases", []))
        next_skills = get_next_skills(enriched_phases)
        return {
            "type": "roadmap",
            "role": goal,
            "title": f"{goal} Roadmap (Standard)",
            "stages": enriched_phases,
            "completed_count": sum(1 for p in enriched_phases for s in p["skills"] if s["completed"]),
            "next_recommended_skill": next_skills[0] if next_skills else "Foundation",
            "missing_skills": next_skills,
            "mentor_note": "Focus on the core foundations first."
        }

def format_roadmap_to_markdown(roadmap: Dict[str, Any]) -> str:
    """Legacy helper for chatbot display."""
    md = f"### {roadmap.get('title', 'Roadmap')}\n\n"
    for phase in roadmap.get('stages', []):
        md += f"**{phase['phase']}**\n"
        for skill in phase.get('skills', []):
            status = "✅" if skill.get('completed') else "⭕"
            md += f"- {status} {skill.get('name', 'Unknown')}\n"
        md += "\n"
    md += f"**Mentor Note:** {roadmap.get('mentor_note', '')}"
    return md
