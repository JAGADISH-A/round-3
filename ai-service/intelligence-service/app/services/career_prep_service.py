"""Career Preparation Service — RAG-powered interview questions and learning roadmaps."""

import re
import json
from typing import Dict, Any, List
from app.services.vector_db_service import retrieve_context


# ─── Generic fallback roadmap (used when RAG has no content) ──────────────────
FALLBACK_ROADMAP: Dict[str, List[Dict[str, Any]]] = {
    "default": [
        {"stage": "Foundations", "topics": ["Programming Basics", "Data Structures & Algorithms", "Version Control (Git)", "Command Line"]},
        {"stage": "Core Skills", "topics": ["Web Fundamentals", "REST APIs", "Databases", "Testing"]},
        {"stage": "Advanced", "topics": ["System Design", "Cloud Platforms", "CI/CD", "Monitoring"]},
        {"stage": "Job Preparation", "topics": ["Mock Interviews", "Portfolio Projects", "Open Source Contributions", "Networking"]},
    ],
}

# ─── Interview question extraction helpers ────────────────────────────────────
_QUESTION_PATTERN = re.compile(r"(?:^|\n)\s*[\-\*\d\.]+\s*(.+\?)", re.MULTILINE)


def _extract_questions_from_text(text: str) -> List[str]:
    """Pull question-like sentences from RAG retrieved text."""
    matches = _QUESTION_PATTERN.findall(text)
    # Also grab any sentence ending with ?
    for sentence in re.split(r"[.!]\s+", text):
        sentence = sentence.strip()
        if sentence.endswith("?") and len(sentence) > 20 and sentence not in matches:
            matches.append(sentence)
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for q in matches:
        q = q.strip().strip("- *")
        if q.lower() not in seen and len(q) > 15:
            seen.add(q.lower())
            unique.append(q)
    return unique[:15]  # cap at 15


def _extract_topics_from_text(text: str) -> List[str]:
    """Pull topic keywords and phrases from RAG retrieved roadmap text."""
    topics = set()
    for line in text.split("\n"):
        line = line.strip().strip("-*•").strip()
        if 3 < len(line) < 80 and not line.endswith("?"):
            topics.add(line)
    return list(topics)[:30]


def _classify_question(question: str) -> str:
    """Classify a question into technical, behavioral, or system_design."""
    q_lower = question.lower()
    if any(kw in q_lower for kw in ["design a", "architect", "scale", "system", "how would you design"]):
        return "system_design"
    if any(kw in q_lower for kw in ["tell me about", "describe a time", "how do you handle", "experience", "challenge", "conflict"]):
        return "behavioral"
    return "technical"


def _build_roadmap_from_topics(role: str, topics: List[str]) -> List[Dict[str, Any]]:
    """Organize flat topic list into staged roadmap."""
    foundation_kw = ["basic", "fundamental", "introduction", "beginner", "git", "command line", "html", "css"]
    core_kw = ["api", "database", "framework", "testing", "rest", "sql", "http", "authentication"]
    advanced_kw = ["system design", "microservice", "cloud", "docker", "kubernetes", "scaling", "architecture", "performance"]
    job_kw = ["interview", "portfolio", "resume", "mock", "project", "networking", "open source"]

    stages = {
        "Foundations": [],
        "Core Skills": [],
        "Advanced": [],
        "Job Preparation": [],
    }

    for topic in topics:
        t_lower = topic.lower()
        if any(kw in t_lower for kw in job_kw):
            stages["Job Preparation"].append(topic)
        elif any(kw in t_lower for kw in advanced_kw):
            stages["Advanced"].append(topic)
        elif any(kw in t_lower for kw in core_kw):
            stages["Core Skills"].append(topic)
        elif any(kw in t_lower for kw in foundation_kw):
            stages["Foundations"].append(topic)
        else:
            stages["Core Skills"].append(topic)

    result = []
    for stage_name, stage_topics in stages.items():
        if stage_topics:
            result.append({"stage": stage_name, "topics": stage_topics[:8]})

    return result if result else FALLBACK_ROADMAP["default"]


# ─── Main entry point ────────────────────────────────────────────────────────
def get_career_preparation(role: str) -> Dict[str, Any]:
    """
    Use RAG to find interview questions or roadmap content for the given role.
    Returns structured data for the frontend.
    """
    role_clean = role.strip() or "General Developer"

    # ── STEP 1: Try to find interview content ──
    interview_queries = [
        f"{role_clean} interview questions",
        f"{role_clean} interview preparation",
        f"{role_clean} technical interview",
    ]

    all_questions: List[str] = []
    for query in interview_queries:
        context, sources = retrieve_context(query, k=5)
        if context:
            extracted = _extract_questions_from_text(context)
            all_questions.extend(extracted)

    if len(all_questions) >= 3:
        # Classify questions into categories
        categorized: Dict[str, List[str]] = {"technical": [], "behavioral": [], "system_design": []}
        seen = set()
        for q in all_questions:
            if q.lower() not in seen:
                seen.add(q.lower())
                category = _classify_question(q)
                categorized[category].append(q)

        # Ensure each category has something
        if not categorized["technical"]:
            categorized["technical"].append(f"What are the core skills required for a {role_clean}?")
        if not categorized["behavioral"]:
            categorized["behavioral"].append("Tell me about a challenging project you worked on.")
        if not categorized["system_design"]:
            categorized["system_design"].append(f"How would you design a system relevant to {role_clean} work?")

        return {
            "type": "interview",
            "role": role_clean,
            "questions": {
                "technical": categorized["technical"][:5],
                "behavioral": categorized["behavioral"][:5],
                "system_design": categorized["system_design"][:5],
            },
        }

    # ── STEP 2: Try to find roadmap content ──
    roadmap_queries = [
        f"{role_clean} career roadmap",
        f"{role_clean} learning path",
        f"{role_clean} skills roadmap",
    ]

    all_topics: List[str] = []
    for query in roadmap_queries:
        context, sources = retrieve_context(query, k=5)
        if context:
            extracted = _extract_topics_from_text(context)
            all_topics.extend(extracted)

    if all_topics:
        stages = _build_roadmap_from_topics(role_clean, all_topics)
        return {
            "type": "roadmap",
            "role": role_clean,
            "stages": stages,
        }

    # ── STEP 3: Fallback ──
    return {
        "type": "roadmap",
        "role": role_clean,
        "stages": FALLBACK_ROADMAP["default"],
    }
