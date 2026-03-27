"""
JD Matcher — Semantic + Taxonomy Hybrid Engine
Scoring: 60% Sentence Transformer cosine similarity + 40% taxonomy keyword overlap
Fallback: Pure keyword matching if sentence-transformers is unavailable.
"""
import re
import logging
import numpy as np
from typing import List, Dict, Any, Set, Optional, Tuple

# ─── Skill Taxonomy ───────────────────────────────────────────────────────────
SKILL_TAXONOMY: Dict[str, List[str]] = {
    "Languages": [
        "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go",
        "Rust", "Kotlin", "Swift", "Scala", "R", "Dart", "PHP", "Ruby",
    ],
    "Frontend": [
        "React", "Angular", "Vue", "Next.js", "Svelte", "HTML", "CSS", "Sass",
        "Tailwind", "Redux", "Zustand", "Lucide", "Shadcn", "Vite", "Turborepo",
    ],
    "Backend": [
        "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "Bun",
        "Rails", "NestJS", "Laravel", "ASP.NET", "gRPC", "GraphQL", "REST API",
    ],
    "Database": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", "Prisma",
        "Firebase", "SQLite", "Oracle", "SQL Server", "Elasticsearch", "Supabase",
    ],
    "DevOps": [
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Jenkins", "Vercel",
        "GitHub Actions", "Ansible", "Linux", "CI/CD", "Nginx", "Helm", "Cloudflare",
    ],
    "AI/Agents": [
        "Pandas", "NumPy", "TensorFlow", "PyTorch", "Scikit-learn", "Hugging Face",
        "LangChain", "OpenAI", "Gemini", "Claude", "LLM", "RAG", "Vector DB",
        "Pinecone", "Milvus", "AutoGPT", "CrewAI", "Agentic Workflows",
    ],
    "Tools": [
        "Git", "GitHub", "GitLab", "Figma", "Postman", "JIRA", "Confluence",
        "Microservices", "Agile", "Scrum", "Swagger", "Unit Testing", "E2E",
    ],
}

# Flatten and build lookup sets
ALL_SKILLS: List[str] = [s for cat in SKILL_TAXONOMY.values() for s in cat]
_SKILL_LOWER_MAP: Dict[str, str] = {s.lower(): s for s in ALL_SKILLS}

# Category reverse map: skill → category
SKILL_CATEGORY_MAP: Dict[str, str] = {
    s: cat
    for cat, skills in SKILL_TAXONOMY.items()
    for s in skills
}

# Which categories are considered "tech" skills for tech_matched_count
TECH_CATEGORIES = {"Languages", "Frontend", "Backend", "Database", "DevOps", "Data/ML"}

# ─── Model Singleton ──────────────────────────────────────────────────────────
_model = None
_SENTENCE_TRANSFORMERS_AVAILABLE = True

def _get_model():
    """Load sentence-transformers model once, fallback gracefully."""
    global _model, _SENTENCE_TRANSFORMERS_AVAILABLE
    if _model is not None:
        return _model
    if not _SENTENCE_TRANSFORMERS_AVAILABLE:
        return None
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        logging.info("Sentence-transformers model loaded: all-MiniLM-L6-v2")
    except Exception as e:
        _SENTENCE_TRANSFORMERS_AVAILABLE = False
        logging.warning(f"Sentence-transformers unavailable, falling back to keyword-only: {e}")
        _model = None
    return _model


# ─── Core Functions ───────────────────────────────────────────────────────────

def extract_taxonomy_skills(text: str) -> Set[str]:
    """
    Extract skills present in the curated taxonomy using strict word-boundary regex.
    Prevents false positives: 'Go' won't match 'Google', 'R' won't match 'React'.
    """
    found: Set[str] = set()
    text_lower = text.lower()
    for skill in ALL_SKILLS:
        skill_lower = skill.lower()
        # Handle skills with special chars (C++, CI/CD, ASP.NET)
        escaped = re.escape(skill_lower)
        pattern = r"(?<![a-zA-Z0-9_#])" + escaped + r"(?![a-zA-Z0-9_#])"
        if re.search(pattern, text_lower):
            found.add(skill)
    return found


def compute_semantic_score(resume_text: str, jd_text: str) -> float:
    """Cosine similarity between sentence embeddings; returns 0–100."""
    model = _get_model()
    if model is None:
        return 0.0
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        embeddings = model.encode(
            [resume_text[:4096], jd_text[:4096]],
            show_progress_bar=False,
        )
        score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(min(max(score, 0.0), 1.0)) * 100
    except Exception as e:
        logging.error(f"Semantic scoring failed: {e}")
        return 0.0


def compute_keyword_score(resume_skills: Set[str], jd_skills: Set[str]) -> float:
    """Normalized keyword overlap: matched / total_jd_skills × 100."""
    if not jd_skills:
        return 0.0
    return (len(resume_skills & jd_skills) / len(jd_skills)) * 100


def _get_match_label(score: int) -> str:
    if score >= 80:
        return "Excellent Match"
    if score >= 65:
        return "Strong Match"
    if score >= 45:
        return "Good Match"
    if score >= 25:
        return "Moderate Match"
    return "Low Match"


def _get_benchmark_range(score: int) -> str:
    if score >= 80:
        return "Top 10% of Candidates"
    if score >= 65:
        return "Top 25% of Candidates"
    if score >= 45:
        return "Average Market Fit"
    return "Below Benchmark"


def _build_action_insights(
    missing_skills: Set[str],
    score: int,
) -> List[Dict[str, str]]:
    """Generate deterministic, actionable insights from skill gaps."""
    insights: List[Dict[str, str]] = []
    for skill in sorted(missing_skills)[:6]:
        category = SKILL_CATEGORY_MAP.get(skill, "Tools")
        if category in TECH_CATEGORIES:
            insight_type = "critical_skill"
            message = (
                f"Add '{skill}' to your skills section and reference it in at least one "
                f"bullet point to lift your JD alignment. This is a direct keyword gap."
            )
        else:
            insight_type = "recommended_skill"
            message = (
                f"Strengthen your profile by mentioning '{skill}' in a project or tool context. "
                f"Recruiters scan for this specifically."
            )
        insights.append({"skill": skill, "type": insight_type, "message": message})
    return insights


def _build_suggested_bullets(
    missing_skills: Set[str],
    role: str = "Software Engineer",
) -> List[str]:
    """Generate template bullet points that inject missing keywords."""
    templates = [
        "Architected and deployed {skill} infrastructure reducing operational costs by 30%",
        "Developed and maintained {skill}-based microservices serving 100K+ daily active users",
        "Integrated {skill} into CI/CD pipeline, improving deployment frequency by 2×",
        "Led migration to {skill}, improving system reliability from 98% to 99.9% uptime",
        "Optimized {skill} queries reducing average response time from 400ms to 80ms",
    ]
    bullets: List[str] = []
    for i, skill in enumerate(sorted(missing_skills)[:5]):
        template = templates[i % len(templates)]
        bullets.append(template.format(skill=skill))
    return bullets


# ─── Main Public Function ─────────────────────────────────────────────────────

def match_resume_to_jd(
    resume_text: str,
    jd_text: str,
    target_role: str = "Software Engineer",
) -> Dict[str, Any]:
    """
    Hybrid JD Matching:
      - 60% Semantic similarity (sentence-transformers cosine)
      - 40% Keyword overlap (taxonomy-only, no generic words)

    Returns all legacy keys + extended fields required by the new frontend.
    NEVER breaks existing API consumers.
    """
    # ── Guard: empty inputs ──────────────────────────────────────────────────
    if not resume_text or not jd_text:
        return {
            # Legacy keys (preserved)
            "jd_score": 0,
            "jd_match_score": 0,
            "semantic_score": 0,
            "keyword_score": 0,
            "matched_keywords": [],
            "missing_keywords": [],
            # Legacy aliases
            "matched_skills": [],
            "missing_skills": [],
            "match_label": "No JD Provided",
            # Extended fields
            "matched_with_labels": [],
            "missing_with_labels": [],
            "tech_matched_count": 0,
            "tech_required_count": 0,
            "benchmark_range": "No JD Provided",
            "action_insights": [],
            "suggested_bullets": [],
        }

    # ── 1. Semantic Score (60%) ──────────────────────────────────────────────
    semantic_score = compute_semantic_score(resume_text, jd_text)

    # ── 2. Keyword Overlap (40%) ─────────────────────────────────────────────
    resume_skills = extract_taxonomy_skills(resume_text)
    jd_skills = extract_taxonomy_skills(jd_text)
    matched_skills: Set[str] = resume_skills & jd_skills
    missing_skills: Set[str] = jd_skills - resume_skills
    keyword_score = compute_keyword_score(resume_skills, jd_skills)

    # ── 3. Blended Final Score ────────────────────────────────────────────────
    # If sentence-transformers unavailable, fall back to pure keyword
    if not _SENTENCE_TRANSFORMERS_AVAILABLE or semantic_score == 0:
        final_score = int(min(keyword_score, 100))
    else:
        final_score = int(min((semantic_score * 0.6) + (keyword_score * 0.4), 100))

    # ── 4. Build extended response fields ─────────────────────────────────────
    matched_with_labels = [
        {"keyword": s, "label": SKILL_CATEGORY_MAP.get(s, "Tool")}
        for s in sorted(matched_skills)
    ]
    missing_with_labels = [
        {"keyword": s, "label": SKILL_CATEGORY_MAP.get(s, "Tool")}
        for s in sorted(missing_skills)
    ]

    tech_matched = {s for s in matched_skills if SKILL_CATEGORY_MAP.get(s) in TECH_CATEGORIES}
    tech_required = {s for s in jd_skills if SKILL_CATEGORY_MAP.get(s) in TECH_CATEGORIES}

    action_insights = _build_action_insights(missing_skills, final_score)
    suggested_bullets = _build_suggested_bullets(missing_skills, target_role)

    return {
        # ── Legacy keys (NEVER removed) ──────────────────────────────────────
        "jd_score": final_score,          # original legacy alias
        "jd_match_score": final_score,    # primary frontend key
        "semantic_score": round(semantic_score, 1),
        "keyword_score": round(keyword_score, 1),
        "matched_keywords": sorted(matched_skills),   # original name
        "missing_keywords": sorted(missing_skills),   # original name
        "matched_skills": sorted(matched_skills),     # alias
        "missing_skills": sorted(missing_skills),     # alias
        "match_label": _get_match_label(final_score),

        # ── Extended fields required by upgraded frontend ────────────────────
        "matched_with_labels": matched_with_labels,
        "missing_with_labels": missing_with_labels,
        "tech_matched_count": len(tech_matched),
        "tech_required_count": len(tech_required),
        "benchmark_range": _get_benchmark_range(final_score),
        "action_insights": action_insights,
        "suggested_bullets": suggested_bullets,
    }
