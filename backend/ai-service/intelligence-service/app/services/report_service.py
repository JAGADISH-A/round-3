"""Developer Identity Service — AI-powered professional analysis and reporting."""

import json
import re
from typing import Dict, Any, List
from app.services.ai_config import llm

REPORT_PROMPT = """You are an expert software engineering career analyst.
Analyze the following developer data and generate a **Developer Identity Report**.

DEVELOPER DATA:
Name: {name}
Role Goal: {role}
Completed Skills: {completed_skills}
Remaining Skills: {remaining_skills}
Projects: {projects}
Interview Sessions: {interview_count}
Readiness Score: {readiness_score}%

Your output must be a strict JSON object with these fields:
{{
  "archetype": "Short label (e.g., API Architect)",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "skill_gaps": ["Gap 1", "Gap 2"],
  "market_positioning": "How they compare to others",
  "focus_areas": ["Focus 1", "Focus 2", "Focus 3"],
  "trajectory": "Predicted next-stage roles"
}}

Tone: Professional, insightful, confident, and constructive."""

def generate_developer_report(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an AI report based on developer activity and profile.
    """
    try:
        formatted_prompt = REPORT_PROMPT.format(
            name=data.get("name", "Developer"),
            role=data.get("role", "Software Engineer"),
            completed_skills=", ".join(data.get("completed_skills", [])),
            remaining_skills=", ".join(data.get("remaining_skills", [])),
            projects=", ".join(data.get("projects", [])),
            interview_count=data.get("interview_count", 0),
            readiness_score=data.get("readiness_score", 0)
        )

        response = llm.invoke(formatted_prompt)
        content = response.content.strip()
        
        # Extract JSON
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)
        
        return json.loads(content)
    except Exception as e:
        print(f"[ReportService] Error generating report: {e}")
        # Fallback structured data
        return {
            "archetype": "Emerging Engineer",
            "strengths": ["Core Language Proficiency", "Project Execution", "Technical Curiosity"],
            "skill_gaps": ["System Design at Scale", "Advanced Infrastructure"],
            "market_positioning": "Strong potential with a solid foundation in core development practices.",
            "focus_areas": ["Deepen Database Internal knowledge", "Explore Distributed Systems", "Master CI/CD pipelines"],
            "trajectory": "Software Engineer II / Backend Specialist"
        }
