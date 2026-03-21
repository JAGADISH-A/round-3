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

def generate_roadmap_suggestions(goal: str, user_skills: List[str] = [], lang: str = "en") -> List[Dict[str, str]]:
    """Generates exactly 3 distinct roadmap options in a strict format."""
    context, _ = retrieve_context(f"roadmap levels and specializations for {goal}", k=5)
    
    lang_instruction = "Return ONLY in Tamil." if lang == "ta" else "Return ONLY in English."
    
    prompt = f"""You are a Career Architect. Based on the goal '{goal}', suggest exactly 3 distinct roadmap levels.
    {lang_instruction}
    
    CONTEXT:
    {context}
    
    REQUIRED LEVELS:
    1. Beginner: 0–1 years, focus on fundamentals and job-readiness.
    2. Advanced: 2+ years, focus on deep systems, architecture, and senior-level skills.
    3. Specialized: Focused domain (e.g., Cloud, Security, AI, Mobile) related to {goal}.
    
    RETURN ONLY a JSON list of 3 objects with these keys: "id", "title", "desc"
    """
    try:
        response = llm.invoke(prompt)
        suggestions = json.loads(re.sub(r"^```(?:json)?\s*|\s*```$", "", response.content.strip()))
        return suggestions
    except Exception as e:
        print(f"[RoadmapGenerator] Suggestion Error: {e}")
        return [
            {"id": "beginner", "title": f"🚀 Beginner {goal} Path", "desc": "0–1 years: Master core foundations."},
            {"id": "advanced", "title": f"🔥 Advanced {goal} Expert", "desc": "2+ years: Deep dive into systems."},
            {"id": "specialized", "title": f"💡 Specialized {goal} Track", "desc": "Focused domain: Modern niche tools."}
        ]

def generate_personalized_roadmap(goal: str, user_skills: List[str], level: str = "beginner", lang: str = "en") -> Dict[str, Any]:
    """
    Generates a high-quality, structured roadmap for a specific level with timelines and projects.
    """
    # 1. Map goal to base roadmap
    roadmap_type = find_best_roadmap(goal)
    base_data = load_roadmap_data(roadmap_type) or {"phases": []}
    
    # 2. Retrieve extra context from RAG (k=10 for maximum variety for planning)
    context, _ = retrieve_context(f"{level} career roadmap for {goal} tools, topics, and common real-world projects", k=10)
    
    # 3. Use AI to refine and personalize
    try:
        level_desc = {
            "beginner": "0-1 years experience, focusing on fundamental concepts and building a solid foundation.",
            "advanced": "2+ years experience, focusing on high-level architecture, optimization, and complex systems.",
            "specialized": "Expert-level focus on a modern, high-demand niche or advanced specialized tools."
        }.get(level, level)

        lang_instruction = (
            "LANGUAGE RULE: You MUST generate the entire roadmap ONLY in Tamil. "
            "All headings, descriptions, project names, and notes MUST be in Tamil. "
            "Do NOT use English words."
        ) if lang == "ta" else "LANGUAGE RULE: Generate ONLY in English."

        formatted_prompt = f"""You are CareerSpark AI — an expert Career Mentor and Technical Architect. 
Generate a comprehensive, structured career roadmap.

{lang_instruction}

USER GOAL: {goal}
TARGET LEVEL: {level.upper()} ({level_desc})
BASE STRUCTURE: {json.dumps(base_data)}
KNOWLEDGE CONTEXT: {context}

INSTRUCTIONS:
1. Title: Create a professional, bold title for the roadmap.
2. Sections: Group into 4-6 logical, sequential stages.
3. Bullet points: Use '⭕' symbol for each skill name.
4. For EACH Phase, you MUST include:
   - "phase": Name of the phase.
   - "skills": A list of specific skill strings.
   - "timeline": Realistic estimated time (e.g., "2-3 Weeks" or "1 Month").
   - "project": A specific, actionable mini-project to build at this stage.
   - "difficulty": Rate as "Easy", "Medium", or "Hard".
5. No Repetition: Do not repeat any skills or topics.
6. sequential: Ensure the user builds confidence step-by-step.

RETURN ONLY a JSON object:
{{
  "title": "Roadmap Title",
  "phases": [
    {{ 
      "phase": "Phase Name", 
      "skills": ["Skill 1", "Skill 2"],
      "timeline": "2 Weeks",
      "project": "Build a XYZ",
      "difficulty": "Medium"
    }}
  ],
  "mentor_note": "A short, encouraging 1-sentence note."
}}
"""
        response = llm.invoke(formatted_prompt)
        ai_data = json.loads(re.sub(r"^```(?:json)?\s*|\s*```$", "", response.content.strip()))
        
        # 4. Perform Skill Gap Analysis (preserves timeline, project, difficulty thanks to update)
        raw_phases = ai_data.get("phases", [])
        enriched_phases = analyze_skill_gaps(user_skills, raw_phases)
        next_skills = get_next_skills(enriched_phases)
        
        return {
            "type": "roadmap",
            "role": goal,
            "level": level,
            "title": ai_data.get("title", f"{goal} Roadmap"),
            "stages": enriched_phases,
            "completed_count": sum(1 for p in enriched_phases for s in p["skills"] if s["completed"]),
            "next_recommended_skill": next_skills[0] if next_skills else "Next Milestone",
            "missing_skills": next_skills,
            "mentor_note": ai_data.get("mentor_note", "Keep pushing forward!")
        }
        
    except Exception as e:
        print(f"[RoadmapGenerator] AI Error: {e}")
        # Final fallback using base data
        enriched_phases = analyze_skill_gaps(user_skills, base_data.get("phases", []))
        return {
            "type": "roadmap",
            "role": goal,
            "level": level,
            "title": f"{goal} Roadmap (Standard)",
            "stages": enriched_phases,
            "completed_count": 0,
            "next_recommended_skill": "Foundation",
            "missing_skills": [],
            "mentor_note": "Focus on the core foundations."
        }

def format_roadmap_to_markdown(roadmap: Dict[str, Any]) -> str:
    """Legacy helper for chatbot display — updated with timeline, project, and difficulty."""
    md = f"### {roadmap.get('title', 'Roadmap')}\n\n"
    for phase in roadmap.get('stages', []):
        md += f"#### {phase['phase']}\n"
        md += f"⏱️ **Timeline:** {phase.get('timeline', 'Variable')}\n"
        md += f"🛠️ **Project:** {phase.get('project', 'Build something cool!')}\n"
        md += f"🔥 **Difficulty:** {phase.get('difficulty', 'Medium')}\n\n"
        
        md += "**Skills:**\n"
        for skill in phase.get('skills', []):
            status = "✅" if skill.get('completed') else "⭕"
            md += f"- {status} {skill.get('name', 'Unknown')}\n"
        md += "\n"
    md += f"**Mentor Note:** {roadmap.get('mentor_note', '')}"
    return md
