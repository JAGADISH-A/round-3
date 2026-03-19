"""Resume Service — Hybrid PDF parsing: local heuristics + LLM enhancement."""

import os
import json
import re
import concurrent.futures
from pypdf import PdfReader
from io import BytesIO
from typing import List, Dict, Any, Optional
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

llm = ChatGroq(
    temperature=0.1,
    model_name="llama-3.3-70b-versatile",
    groq_api_key=os.getenv("GROQ_API_KEY")
)

ROADMAPS_BASE = "careerspark_data_external/datasets/developer-roadmap/src/data/roadmaps"

# ─── Known Skills Database for Local Detection ─────────────────────────────────
KNOWN_SKILLS: Dict[str, List[str]] = {
    "languages": ["Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Kotlin", "Swift", "Scala", "R", "Dart"],
    "frontend": ["React", "Angular", "Vue", "Next.js", "Svelte", "HTML", "CSS", "Tailwind", "Bootstrap", "SASS", "Redux", "jQuery"],
    "backend": ["Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "Spring", "Rails", "ASP.NET", "NestJS", "Laravel"],
    "database": ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", "Firebase", "Supabase", "SQLite", "Oracle"],
    "devops": ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Jenkins", "GitHub Actions", "CI/CD", "Ansible", "Nginx", "Linux"],
    "data": ["Pandas", "NumPy", "TensorFlow", "PyTorch", "Scikit-learn", "Spark", "Kafka", "Airflow", "Hadoop", "Power BI", "Tableau"],
    "tools": ["Git", "REST", "GraphQL", "gRPC", "Microservices", "Agile", "Scrum", "JIRA", "Figma", "Postman"],
}

# Flatten for quick lookup
ALL_SKILLS = []
for category_skills in KNOWN_SKILLS.values():
    ALL_SKILLS.extend(category_skills)

# ─── Role Skill Requirements for Local Roadmap Comparison ──────────────────────
ROLE_REQUIREMENTS: Dict[str, Dict[str, List[str]]] = {
    "Frontend Developer": {
        "core": ["HTML", "CSS", "JavaScript", "React", "TypeScript"],
        "advanced": ["Next.js", "Redux", "Tailwind", "GraphQL", "Testing"],
        "tools": ["Git", "Figma", "REST", "CI/CD"]
    },
    "Backend Developer": {
        "core": ["Python", "Java", "SQL", "REST", "Git"],
        "advanced": ["Docker", "Microservices", "Redis", "PostgreSQL", "CI/CD"],
        "tools": ["Linux", "Nginx", "AWS", "Kubernetes"]
    },
    "Full Stack Developer": {
        "core": ["JavaScript", "React", "Node.js", "SQL", "Git"],
        "advanced": ["TypeScript", "Docker", "REST", "PostgreSQL", "CI/CD"],
        "tools": ["AWS", "Redis", "GraphQL", "Tailwind"]
    },
    "DevOps Engineer": {
        "core": ["Linux", "Docker", "Git", "CI/CD", "AWS"],
        "advanced": ["Kubernetes", "Terraform", "Ansible", "Jenkins", "Nginx"],
        "tools": ["Python", "Bash", "Prometheus", "Grafana"]
    },
    "Data Engineer": {
        "core": ["Python", "SQL", "Spark", "Airflow", "Git"],
        "advanced": ["Kafka", "Docker", "AWS", "PostgreSQL", "Redis"],
        "tools": ["Hadoop", "Tableau", "Power BI", "CI/CD"]
    },
    "ML Engineer": {
        "core": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "SQL"],
        "advanced": ["Docker", "Pandas", "NumPy", "Spark", "Git"],
        "tools": ["AWS", "Kubernetes", "MLflow", "Airflow"]
    },
}


def default_resume_schema() -> Dict[str, Any]:
    """Guaranteed schema — every field present with a safe default."""
    return {
        "full_text": "",
        "inferred_role": "Unknown",
        "confirmed_role": "Unknown",
        "skills": [],
        "education": [],
        "experience": [],
        "projects": [],
        "ats_score": 0,
        "strength_score": 0,
        "industry_readiness": "Beginner",
        "skill_gap": [],
        "keyword_suggestions": [],
        "improvement_checklist": [],
        "experience_impact_score": 0
    }


# ─── Local Computation Pipeline ────────────────────────────────────────────────

def _detect_skills_locally(text: str) -> List[str]:
    """Detect skills from resume text using keyword matching — instant."""
    lower_text = text.lower()
    detected = []
    for skill in ALL_SKILLS:
        # Match whole word boundaries to avoid false positives
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, lower_text):
            detected.append(skill)
    return detected


def _infer_role(skills: List[str]) -> str:
    """Infer the most likely target role from detected skills."""
    best_role = "Backend Developer"
    best_match = 0
    skills_lower = [s.lower() for s in skills]

    for role, reqs in ROLE_REQUIREMENTS.items():
        core_match = sum(1 for s in reqs["core"] if s.lower() in skills_lower)
        advanced_match = sum(1 for s in reqs["advanced"] if s.lower() in skills_lower)
        total = core_match * 2 + advanced_match  # Core skills weighted higher
        if total > best_match:
            best_match = total
            best_role = role

    return best_role


def _compute_local_analysis(full_text: str, target_role: Optional[str] = None) -> Dict[str, Any]:
    """Full local resume analysis — no API calls."""
    result = default_resume_schema()
    result["full_text"] = full_text

    # Skill detection
    skills = _detect_skills_locally(full_text)
    result["skills"] = skills

    # Role inference
    inferred = _infer_role(skills)
    result["inferred_role"] = inferred
    role = target_role if target_role else inferred
    result["confirmed_role"] = role

    # Roadmap comparison — skill gap
    role_reqs = ROLE_REQUIREMENTS.get(role, ROLE_REQUIREMENTS.get("Backend Developer", {}))
    if role_reqs:
        all_required = role_reqs.get("core", []) + role_reqs.get("advanced", [])
        skills_lower = [s.lower() for s in skills]
        missing = [s for s in all_required if s.lower() not in skills_lower]
        result["skill_gap"] = missing[:8]

    # ATS score — based on skill coverage
    if role_reqs:
        core_required = role_reqs.get("core", [])
        core_match = sum(1 for s in core_required if s.lower() in [sk.lower() for sk in skills])
        total_required = len(role_reqs.get("core", [])) + len(role_reqs.get("advanced", []))
        total_match = sum(1 for s in all_required if s.lower() in [sk.lower() for sk in skills])
        result["ats_score"] = min(int((total_match / max(total_required, 1)) * 100), 100)
    else:
        result["ats_score"] = min(len(skills) * 10, 85)

    # Experience detection (pattern-based)
    exp_patterns = re.findall(
        r'(?:(?:Software|Senior|Junior|Lead|Full[\s-]?Stack|Frontend|Backend|DevOps|Data|ML|AI|Cloud|Product|Project|QA|Test)[\s]*'
        r'(?:Engineer|Developer|Analyst|Architect|Manager|Intern|Designer|Consultant))',
        full_text, re.IGNORECASE
    )
    exp_count = len(set(exp_patterns))

    # Experience impact score
    impact_keywords = ["increased", "reduced", "improved", "built", "led", "designed", "deployed",
                       "managed", "achieved", "delivered", "optimized", "automated", "scaled"]
    impact_count = sum(1 for k in impact_keywords if k in full_text.lower())
    result["experience_impact_score"] = min(impact_count * 12, 100)

    # Strength score (composite)
    result["strength_score"] = min(
        len(skills) * 8 + impact_count * 5 + exp_count * 10,
        100
    )

    # Industry readiness
    score = result["ats_score"]
    result["industry_readiness"] = (
        "Expert" if score >= 85 else
        "Advanced" if score >= 65 else
        "Intermediate" if score >= 40 else
        "Beginner"
    )

    # Keyword suggestions (skills from the role roadmap that the candidate should add)
    result["keyword_suggestions"] = result["skill_gap"][:5]

    # Improvement checklist
    checklist = []
    if result["ats_score"] < 60:
        checklist.append({"task": f"Add core {role} skills to your resume: {', '.join(result['skill_gap'][:3])}", "priority": "High"})
    if impact_count < 3:
        checklist.append({"task": "Add measurable achievements (e.g., 'Improved API response time by 40%')", "priority": "High"})
    if exp_count < 2:
        checklist.append({"task": "Include more relevant work experience or internship details", "priority": "Medium"})
    if len(skills) < 5:
        checklist.append({"task": "Expand your technical skills section with relevant technologies", "priority": "Medium"})
    if not checklist:
        checklist.append({"task": "Profile looks strong — consider adding open source contributions", "priority": "Low"})
    result["improvement_checklist"] = checklist

    return result


# ─── Roadmap File Loader ───────────────────────────────────────────────────────

def _get_roadmap_content(role: str) -> str:
    """Find and read the most relevant roadmap file."""
    role_slug = role.lower().replace(" ", "-").replace(".", "")
    mappings = {
        "frontend": "frontend/frontend.md",
        "backend": "backend/backend.md",
        "devops": "devops/devops.md",
        "full-stack": "full-stack/full-stack.md",
        "data-engineer": "data-engineer/data-engineer.md",
        "machine-learning": "machine-learning/machine-learning.md",
        "android": "android/android.md",
        "ios": "ios/ios.md",
        "qa": "qa/qa.md",
    }
    roadmap_path = None
    for key, path in mappings.items():
        if key in role_slug:
            roadmap_path = os.path.join(ROADMAPS_BASE, path)
            break
    if not roadmap_path or not os.path.exists(roadmap_path):
        roadmap_path = os.path.join(ROADMAPS_BASE, "backend/backend.md")
    try:
        with open(roadmap_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return ""


# ─── Main Pipeline ─────────────────────────────────────────────────────────────

def parse_resume(file_content: bytes, target_role: Optional[str] = None) -> dict:
    """Hybrid resume pipeline: local analysis (instant) + LLM enhancement (with timeout)."""
    
    # Step 1: Extract text from PDF
    try:
        reader = PdfReader(BytesIO(file_content))
        full_text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                full_text += extracted + "\n"
    except Exception as e:
        # If PDF parsing fails, try treating input as raw text
        try:
            full_text = file_content.decode("utf-8")
        except Exception:
            print(f"[ResumeService] PDF parsing failed: {e}")
            result = default_resume_schema()
            result["improvement_checklist"] = [{"task": "Could not parse PDF. Please ensure it's a valid PDF file.", "priority": "High"}]
            return result

    if not full_text.strip():
        result = default_resume_schema()
        result["improvement_checklist"] = [{"task": "No text could be extracted from the PDF. Try a text-based PDF.", "priority": "High"}]
        return result

    # Step 2: Local analysis (instant, reliable)
    local_result = _compute_local_analysis(full_text, target_role)

    # Step 3: Try LLM enhancement (with timeout)
    def _llm_enhance():
        role_to_use = target_role if target_role else local_result["inferred_role"]
        roadmap_content = _get_roadmap_content(role_to_use)

        extraction_prompt = f"""You are a senior recruiter and ATS specialist.
Analyze the following resume text and extract structured information.

RESUME TEXT:
\"\"\"{full_text[:4000]}\"\"\"

Return ONLY a strict JSON object:
{{
  "inferred_role": "{role_to_use}",
  "skills": ["<skill 1>", "<skill 2>"],
  "education": [{{"degree": "", "institution": "", "year": ""}}],
  "experience": [{{"title": "", "company": "", "duration": "", "impact": ""}}],
  "projects": [{{"name": "", "tech_stack": [""], "description": ""}}],
  "ats_score": <integer 0-100>,
  "strength_score": <integer 0-100>,
  "industry_readiness": "<Beginner | Intermediate | Advanced | Expert>",
  "skill_gap": ["<missing skill 1>"],
  "keyword_suggestions": ["<keyword 1>"],
  "improvement_checklist": [{{"task": "<actionable improvement>", "priority": "High|Medium|Low"}}],
  "experience_impact_score": <integer 0-100>
}}"""

        response = llm.invoke(extraction_prompt)
        raw = response.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)

    try:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(_llm_enhance)
            llm_result = future.result(timeout=8)  # 8-second hard timeout

        # Merge: LLM enriches local results
        merged = {**local_result}

        # LLM provides better structured data for these fields
        for key in ["education", "experience", "projects"]:
            if key in llm_result and llm_result[key] and len(llm_result[key]) > 0:
                merged[key] = llm_result[key]

        # Merge skills (union of local + LLM detected)
        if "skills" in llm_result and llm_result["skills"]:
            local_skills_lower = [s.lower() for s in merged["skills"]]
            for skill in llm_result["skills"]:
                if skill.lower() not in local_skills_lower:
                    merged["skills"].append(skill)

        # For numeric scores, take the average
        for key in ["ats_score", "strength_score", "experience_impact_score"]:
            if key in llm_result and isinstance(llm_result[key], (int, float)):
                merged[key] = int((local_result[key] + llm_result[key]) / 2)

        # Prefer LLM qualitative outputs
        for key in ["industry_readiness", "improvement_checklist", "skill_gap", "keyword_suggestions"]:
            if key in llm_result and llm_result[key]:
                merged[key] = llm_result[key]

        merged["confirmed_role"] = target_role if target_role else merged["inferred_role"]
        return merged

    except concurrent.futures.TimeoutError:
        print("[ResumeService] LLM timeout after 8s — returning local analysis")
        return local_result
    except json.JSONDecodeError:
        print("[ResumeService] LLM returned invalid JSON — returning local analysis")
        return local_result
    except Exception as e:
        print(f"[ResumeService] LLM error: {e} — returning local analysis")
        return local_result
