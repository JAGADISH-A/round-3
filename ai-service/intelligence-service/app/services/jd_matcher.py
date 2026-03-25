"""JD Matching Service — Compares a parsed resume against a Job Description."""
import re
from typing import List, Dict, Any, Optional
from math import sqrt, floor


# ── Stop Words (basic English filter) ─────────────────────────────────────────
_STOP = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "as", "is", "was", "are", "we", "i", "you", "they", "it",
    "this", "that", "be", "have", "do", "will", "not", "from", "by", "can",
    "our", "your", "their", "us", "me", "him", "her", "who", "which", "more"
}

# ── Tech keyword booster — these words matter more in JDs ────────────────────
_TECH_BOOST = {
    "python", "java", "javascript", "typescript", "react", "node", "fastapi",
    "django", "spring", "docker", "kubernetes", "aws", "gcp", "postgresql",
    "mongodb", "redis", "kafka", "graphql", "rest", "grpc", "llm", "ml",
    "pytorch", "tensorflow", "langchain", "microservices", "ci/cd", "agile"
}

# ── Action insight templates keyed by skill ────────────────────────────────────
_SKILL_INSIGHTS: Dict[str, Dict[str, str]] = {
    "docker":        {"type": "critical_skill", "message": "Add a project using Docker for containerization of your services."},
    "kubernetes":    {"type": "critical_skill", "message": "Mention Kubernetes orchestration in a deployment or DevOps project."},
    "microservices": {"type": "critical_skill", "message": "Highlight any service-oriented or distributed system work you have done."},
    "aws":           {"type": "critical_skill", "message": "Include any cloud deployment experience (EC2, S3, Lambda, ECS, etc.)."},
    "gcp":           {"type": "critical_skill", "message": "Mention Google Cloud Platform usage in a project or internship."},
    "kafka":         {"type": "resume_fix",     "message": "Add event-driven architecture or messaging queue experience."},
    "redis":         {"type": "resume_fix",     "message": "Mention caching strategies or Redis usage for performance optimization."},
    "typescript":    {"type": "resume_fix",     "message": "List TypeScript under your skills and highlight any typed JS projects."},
    "graphql":       {"type": "resume_fix",     "message": "Add a GraphQL API project or mention schema-first API design."},
    "llm":           {"type": "critical_skill", "message": "Highlight any GenAI, LLM integration, or NLP project experience."},
    "ml":            {"type": "critical_skill", "message": "Include machine learning projects, datasets, or model training work."},
    "pytorch":       {"type": "critical_skill", "message": "Add a deep learning or model training project using PyTorch."},
    "ci/cd":         {"type": "resume_fix",     "message": "Mention CI/CD pipelines (GitHub Actions, Jenkins, CircleCI, etc.)."},
    "agile":         {"type": "resume_fix",     "message": "Add experience with Agile/Scrum workflows or sprint-based delivery."},
    "postgresql":    {"type": "resume_fix",     "message": "List PostgreSQL in your skills and mention schema design or query optimization."},
    "mongodb":       {"type": "resume_fix",     "message": "Highlight NoSQL database design patterns or MongoDB Atlas usage."},
    "spring":        {"type": "critical_skill", "message": "Add a Spring Boot REST API or microservice project."},
    "fastapi":       {"type": "critical_skill", "message": "Include a FastAPI backend project with Pydantic models and async endpoints."},
    "react":         {"type": "critical_skill", "message": "Highlight React SPA projects with component architecture and state management."},
    "node":          {"type": "critical_skill", "message": "Add Node.js API or server-side JavaScript project experience."},
}

# ── Bullet templates for generate-from-skill ──────────────────────────────────
_SKILL_BULLETS: Dict[str, str] = {
    "docker":        "Used Docker to containerize {role} services for consistent deployments",
    "kubernetes":    "Deployed and managed containers using Kubernetes for scalable orchestration",
    "microservices": "Designed microservices-based backend architecture improving system scalability",
    "aws":           "Deployed cloud infrastructure on AWS using EC2, S3, and Lambda",
    "gcp":           "Leveraged Google Cloud Platform services for scalable application hosting",
    "kafka":         "Implemented event-driven communication using Apache Kafka message queues",
    "redis":         "Improved API response time using Redis caching for frequently accessed data",
    "typescript":    "Built type-safe frontend applications using TypeScript and React",
    "graphql":       "Designed GraphQL API schema enabling flexible client-driven data querying",
    "llm":           "Integrated LLM APIs to build AI-powered features for {role} application",
    "ml":            "Trained and deployed machine learning models for predictive analytics",
    "pytorch":       "Built deep learning models using PyTorch for classification tasks",
    "ci/cd":         "Set up CI/CD pipelines using GitHub Actions for automated testing and deployment",
    "agile":         "Delivered features in 2-week Agile sprints with daily standups and retrospectives",
    "postgresql":    "Designed normalized PostgreSQL database schema and optimized complex queries",
    "mongodb":       "Implemented schema-less data storage using MongoDB for flexible data modeling",
    "spring":        "Built RESTful microservices using Spring Boot with JWT authentication",
    "fastapi":       "Developed async REST APIs using FastAPI with Pydantic validation and OpenAPI docs",
    "react":         "Built responsive single-page application using React with component-based architecture",
    "node":          "Developed server-side Node.js API with Express handling concurrent requests",
}


def _tokenize(text: str) -> List[str]:
    """Clean, lowercase, tokenize, remove stop words."""
    tokens = re.findall(r"\b[a-z][a-z+#./\-]{1,30}\b", text.lower())
    return [t for t in tokens if t not in _STOP and len(t) > 1]


def _tf(tokens: List[str]) -> Dict[str, float]:
    """Compute term frequency with tech keyword boost."""
    freq: Dict[str, float] = {}
    for t in tokens:
        freq[t] = freq.get(t, 0) + (2.0 if t in _TECH_BOOST else 1.0)
    total = sum(freq.values()) or 1
    return {k: v / total for k, v in freq.items()}


def _cosine(a: Dict[str, float], b: Dict[str, float]) -> float:
    """Cosine similarity between two TF vectors."""
    common = set(a) & set(b)
    if not common:
        return 0.0
    dot = sum(a[k] * b[k] for k in common)
    mag_a = sqrt(sum(v ** 2 for v in a.values()))
    mag_b = sqrt(sum(v ** 2 for v in b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def generate_match_label(score: int) -> str:
    """Return human-readable match label for a given score."""
    if score >= 80:
        return "Excellent Match"
    if score >= 60:
        return "Strong Match"
    if score >= 30:
        return "Moderate Match"
    return "Low Match"


def generate_skill_label(skill: str, missing: bool) -> str:
    """Return a contextual label for a skill based on match status."""
    if missing:
        return "Critical Gap" if skill in _TECH_BOOST else "Needs Improvement"
    return "Good Fit"


def generate_benchmark_range(score: int) -> str:
    """Return a benchmark range string for the given score."""
    if score < 30:
        return "Top candidates: 65–80"
    if score < 60:
        return "Top candidates: 70–85"
    return "Top candidates: 80–90"


def generate_action_insights(missing_skills: List[str]) -> List[Dict[str, str]]:
    """
    Generate deterministic action insights for each missing skill.
    Uses templates; no LLM call needed for speed.
    """
    insights = []
    for skill in missing_skills[:6]:
        lower = skill.lower()
        if lower in _SKILL_INSIGHTS:
            insights.append({"skill": skill, **_SKILL_INSIGHTS[lower]})
        else:
            insights.append({
                "skill": skill,
                "type": "resume_fix",
                "message": f"Add '{skill}' to your skills section and demonstrate it in a project description."
            })
    # Add one general fix if score will be low
    if len(missing_skills) > 3:
        insights.append({
            "skill": "",
            "type": "general_fix",
            "message": "Rewrite project descriptions to use industry keywords found in the job description."
        })
    return insights


def generate_suggested_bullets(missing_skills: List[str], role: str = "Software Engineer") -> List[str]:
    """
    Generate starter bullet points for each missing skill.
    These are template-based (fast) — the user then sends them to /rewrite-bullet for AI polish.
    """
    bullets = []
    for skill in missing_skills[:5]:
        lower = skill.lower()
        template = _SKILL_BULLETS.get(lower, f"Worked with {skill} in a {role} project context")
        bullets.append(template.replace("{role}", role))
    return bullets


def match_resume_to_jd(resume_text: str, jd_text: str, role: str = "Software Engineer") -> Dict[str, Any]:
    """
    Compare resume text against a job description.
    Returns match_score, matched_keywords, missing_keywords, action_insights, suggested_bullets.
    """
    resume_tokens = _tokenize(resume_text)
    jd_tokens = _tokenize(jd_text)

    resume_tf = _tf(resume_tokens)
    jd_tf = _tf(jd_tokens)

    # ── Cosine Similarity (0-100) ────────────────────────────────────────────
    cosine_score = _cosine(resume_tf, jd_tf) * 100

    # ── Keyword Overlap Analysis ──────────────────────────────────────────────
    resume_set = set(resume_tokens)
    jd_set = set(jd_tokens)

    tech_jd = {t for t in jd_set if t in _TECH_BOOST}
    tech_matched = tech_jd & resume_set
    tech_missing = tech_jd - resume_set

    general_jd = {t for t in jd_set if len(t) > 3 and t not in _TECH_BOOST}
    general_matched = general_jd & resume_set
    general_missing = general_jd - resume_set

    all_matched = tech_matched | general_matched
    all_jd = tech_jd | general_jd
    keyword_overlap_score = (len(all_matched) / max(len(all_jd), 1)) * 100

    # ── Final Blended Score ───────────────────────────────────────────────────
    blended_score = int(min((cosine_score * 0.6 + keyword_overlap_score * 0.4), 100))

    # ── Priority Missing Keywords (tech first, then general) ─────────────────
    priority_missing_raw = sorted(tech_missing)[:8] + sorted(general_missing)[:4]
    priority_missing = list(dict.fromkeys(priority_missing_raw))[:10]  # dedupe
    priority_matched = sorted(all_matched, key=lambda k: k in _TECH_BOOST, reverse=True)[:10]

    # ── Labels & Insights ─────────────────────────────────────────────────────
    label = generate_match_label(blended_score)
    benchmark = generate_benchmark_range(blended_score)

    # Skill labels for matched and missing
    matched_with_labels = [
        {"keyword": k, "label": generate_skill_label(k, missing=False)}
        for k in priority_matched
    ]
    missing_with_labels = [
        {"keyword": k, "label": generate_skill_label(k, missing=True)}
        for k in priority_missing
    ]

    # Action insights (deterministic, fast)
    action_insights = generate_action_insights(priority_missing)

    # Suggested bullets (template, to be refined via /rewrite-bullet)
    suggested_bullets = generate_suggested_bullets(priority_missing, role=role)

    return {
        "jd_match_score": blended_score,
        "match_label": label,
        "benchmark_range": benchmark,
        "matched_keywords": priority_matched,
        "missing_keywords": priority_missing,
        "matched_with_labels": matched_with_labels,
        "missing_with_labels": missing_with_labels,
        "tech_matched_count": len(tech_matched),
        "tech_required_count": len(tech_jd),
        "cosine_score": round(float(cosine_score), 1),
        "keyword_overlap_score": round(float(keyword_overlap_score), 1),
        "action_insights": action_insights,
        "suggested_bullets": suggested_bullets,
    }


# ── Feedback Loop Helpers ─────────────────────────────────────────────────────

_ACTION_VERBS = {
    "built", "designed", "implemented", "engineered", "developed", "created",
    "deployed", "optimized", "reduced", "improved", "automated", "integrated",
    "spearheaded", "led", "managed", "launched", "delivered", "architected",
    "migrated", "scaled", "refactored", "streamlined", "accelerated", "drove"
}

_METRIC_PATTERN = re.compile(
    r'\b(\d+[kKmMbB%]?\+?\s*(ms|sec|seconds?|minutes?|hours?|days?|users?|requests?|endpoints?|services?|%)?)\b'
    r'|\b\d+x\b|\b(\d+\.\d+)%\b|\b\d{2,}[+]?\b',
    re.IGNORECASE
)

_EXPECTED_SECTIONS = {"experience", "education", "skills", "projects", "summary"}


def recalculate_score(updated_resume: str, jd_text: str, role: str = "Software Engineer") -> int:
    """Re-run JD matching and return the new blended score (0–100)."""
    result = match_resume_to_jd(updated_resume, jd_text, role=role)
    return result["jd_match_score"]


def compute_score_delta(old_score: int, new_score: int) -> Dict[str, Any]:
    """Compute score change between two JD match evaluations."""
    clamped_new = max(0, min(100, new_score))
    delta = max(-100, min(100, clamped_new - old_score))
    return {
        "previous_score": old_score,
        "new_score": clamped_new,
        "score_delta": delta,
        "match_label": generate_match_label(clamped_new),
    }


def generate_improvement_summary(before: str, after: str) -> Dict[str, Any]:
    """Detect improvements between original and rewritten bullet."""
    before_lower = before.lower()
    after_lower = after.lower()
    improvements = []

    # Detect new action verbs
    before_verbs = {v for v in _ACTION_VERBS if v in before_lower}
    after_verbs = {v for v in _ACTION_VERBS if v in after_lower}
    new_verbs = after_verbs - before_verbs
    if new_verbs:
        improvements.append(f"Added strong action verb: '{next(iter(new_verbs)).capitalize()}'")

    # Detect new metrics
    before_metrics = set(_METRIC_PATTERN.findall(before))
    after_metrics = set(_METRIC_PATTERN.findall(after))
    if len(after_metrics) > len(before_metrics):
        improvements.append("Added quantified metric or measurable outcome")

    # Detect new technical keywords
    before_tokens = set(_tokenize(before))
    after_tokens = set(_tokenize(after))
    new_tech = (after_tokens - before_tokens) & _TECH_BOOST
    if new_tech:
        improvements.append(f"Introduced technical keyword: '{next(iter(new_tech)).upper()}'")

    # Word count improvement
    if len(after.split()) > len(before.split()):
        improvements.append("Expanded detail and clarity")

    if not improvements:
        improvements.append("Refined language and flow")

    parts = []
    if new_verbs:
        parts.append("strong action verb")
    if len(after_metrics) > len(before_metrics):
        parts.append("measurable impact")
    if new_tech:
        parts.append("technical alignment")
    if not parts:
        parts.append("clarity")

    impact_summary = f"Improved {', '.join(parts)} in your bullet point"
    return {"impact_summary": impact_summary, "improvements": improvements}


def compute_readiness_score(
    jd_score: int,
    sections_present: Optional[List[str]] = None,
    skills_count: int = 0
) -> Dict[str, Any]:
    """Compute overall resume readiness score from multiple signals."""
    sections = [s.lower() for s in (sections_present or [])]
    section_completeness = len({s for s in sections} & _EXPECTED_SECTIONS) / len(_EXPECTED_SECTIONS)
    # Normalize skills: 10+ skills = 100%, scale linearly below
    skill_coverage = min(skills_count / 10.0, 1.0)

    readiness = (
        jd_score * 0.5
        + section_completeness * 100 * 0.3
        + skill_coverage * 100 * 0.2
    )
    readiness = int(max(0, min(100, floor(readiness))))

    if readiness >= 86:
        label = "Strong Candidate"
    elif readiness >= 66:
        label = "Interview Ready"
    elif readiness >= 41:
        label = "Improving"
    else:
        label = "Beginner"

    return {"resume_readiness": readiness, "readiness_label": label}


def segment_and_score_resume(text: str, jd_text: str) -> List[Dict[str, Any]]:
    """
    Split resume text into segments and score each based on rule-based criteria.
    Criteria: Tech Keyword (+40), Action Verb (+25), Metric (+35).
    """
    if not text.strip():
        return []

    # Robust segmentation: boundaries or line breaks
    import re
    segments_raw = re.split(r'(?<=[.!?])\s+|\n+', text)
    segments = [s.strip() for s in segments_raw if s.strip()]
    
    scored_segments = []
    jd_tokens = set(_tokenize(jd_text))

    for seg in segments:
        score = 0
        seg_lower = seg.lower()
        seg_tokens = set(_tokenize(seg))

        # 1. Tech Keyword (+40) - Matches JD or global tech boost
        matched_tech = seg_tokens & (jd_tokens | _TECH_BOOST)
        if matched_tech:
            score += 40

        # 2. Action Verb (+25)
        if any(verb in seg_lower for verb in _ACTION_VERBS):
            score += 25

        # 3. Metric (+35)
        if _METRIC_PATTERN.search(seg):
            score += 35

        score = min(score, 100)
        
        # Label Mapping
        if score < 30:
            label = "weak"
        elif score <= 70:
            label = "moderate"
        else:
            label = "strong"

        scored_segments.append({
            "text": seg,
            "score": score,
            "label": label
        })

    return scored_segments
