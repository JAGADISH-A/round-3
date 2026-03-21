import json
import sys
import os

# Mock base_analysis and intelligence
base_analysis = {
    "skills": ["Python", "JavaScript"],
    "experience": [{"title": "Dev", "company": "Tech", "duration": "1 yr", "impact": "did things"}]
}

intelligence = {
    "ats_score": 85,
    "industry_readiness": "Intermediate"
}

def normalize(base, intel, role="Engineer"):
    return {
        "full_text": "mock text",
        "inferred_role": base.get("inferred_role", "Unknown Role"),
        "confirmed_role": role,
        "skills": base.get("skills", []),
        "education": base.get("education", []),
        "experience": base.get("experience", []),
        "projects": base.get("projects", []),
        "ats_score": intel.get("ats_score", 0),
        "strength_score": intel.get("strength_score", 0),
        "industry_readiness": intel.get("industry_readiness", "Beginner"),
        "skill_gap": intel.get("skill_gap", []),
        "keyword_suggestions": intel.get("keyword_suggestions", []),
        "improvement_checklist": intel.get("improvement_checklist", []),
        "experience_impact_score": intel.get("experience_impact_score", 0)
    }

result = normalize(base_analysis, intelligence)
print(json.dumps(result, indent=2))

# Check if all fields are present
required_fields = ["skills", "projects", "experience", "education", "ats_score", "strength_score", "industry_readiness", "skill_gap", "keyword_suggestions", "improvement_checklist", "experience_impact_score"]
missing = [f for f in required_fields if f not in result]
if not missing:
    print("SUCCESS: All required fields present.")
else:
    print(f"FAILURE: Missing fields: {missing}")
