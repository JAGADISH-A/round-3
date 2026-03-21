"""Resume Analyzer — Extract keywords and compute technical depth from resume text."""

from typing import Dict, Any, List
import re

# Role-specific critical skill clusters
ROLE_SKILL_MAP: Dict[str, List[str]] = {
    "backend developer": [
        "python", "java", "node.js", "express", "fastapi", "django", "flask", "spring boot",
        "sql", "postgresql", "mysql", "mongodb", "redis", "kafka", "rabbitmq",
        "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "microservices",
        "rest api", "graphql", "grpc", "load balancer", "nginx", "api gateway",
    ],
    "frontend developer": [
        "react", "angular", "vue.js", "svelte", "next.js", "nuxt.js", "typescript",
        "javascript", "html", "css", "tailwind", "sass", "webpack", "vite",
        "redux", "mobx", "jest", "cypress", "playwright", "figma", "d3.js",
        "responsive design", "accessibility", "web performance",
    ],
    "full stack developer": [
        "react", "next.js", "node.js", "express", "python", "django", "fastapi",
        "typescript", "postgresql", "mongodb", "redis", "docker", "aws",
        "rest api", "graphql", "ci/cd", "git", "jest", "cypress",
    ],
    "devops engineer": [
        "docker", "kubernetes", "terraform", "ansible", "jenkins", "github actions",
        "aws", "azure", "gcp", "linux", "bash", "prometheus", "grafana",
        "ci/cd", "helm", "argocd", "nginx", "load balancer", "monitoring",
    ],
    "ml engineer": [
        "python", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
        "mlflow", "kubeflow", "docker", "aws", "gcp", "jupyter",
        "deep learning", "nlp", "computer vision", "feature engineering",
        "model deployment", "a/b testing", "data pipeline",
    ],
}

# Flatten all skills for general matching
ALL_SKILLS = set()
for skills in ROLE_SKILL_MAP.values():
    ALL_SKILLS.update(s.lower() for s in skills)


def extract_keywords(resume_text: str) -> List[str]:
    """Extract technical keywords from resume text."""
    text_lower = resume_text.lower()
    found = []
    for skill in sorted(ALL_SKILLS, key=len, reverse=True):
        if skill in text_lower:
            found.append(skill)
    return list(set(found))


def compare_with_role_skills(resume_text: str, target_role: str) -> Dict[str, Any]:
    """Compare resume skills against target role requirements."""
    role_key = target_role.lower()
    role_skills = ROLE_SKILL_MAP.get(role_key, ROLE_SKILL_MAP.get("backend developer", []))
    
    found_keywords = extract_keywords(resume_text)
    matched = [s for s in role_skills if s.lower() in [k.lower() for k in found_keywords]]
    missing = [s for s in role_skills if s.lower() not in [k.lower() for k in found_keywords]]
    
    match_ratio = len(matched) / max(len(role_skills), 1)
    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "match_ratio": round(match_ratio, 2),
    }


def calculate_technical_depth(resume_text: str, target_role: str = "backend developer") -> Dict[str, Any]:
    """Calculate technical depth score from resume against a target role."""
    comparison = compare_with_role_skills(resume_text, target_role)
    keywords = extract_keywords(resume_text)
    
    # Score: weighted combination of match ratio + total keyword breadth
    match_score = comparison["match_ratio"] * 100
    breadth_bonus = min(len(keywords) * 2, 30)  # up to 30 bonus points for breadth
    
    technical_depth = min(round(match_score * 0.7 + breadth_bonus), 100)
    
    return {
        "technical_depth": technical_depth,
        "matched_skills": comparison["matched_skills"],
        "missing_skills": comparison["missing_skills"][:10],  # Top 10 missing
        "total_keywords_found": len(keywords),
    }
