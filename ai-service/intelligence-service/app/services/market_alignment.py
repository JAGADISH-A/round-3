"""Market Alignment Engine — Compare resume skills with market demand for target roles."""

from typing import Dict, Any, List

# Role-specific market-demand keywords (high demand in 2025)
MARKET_DEMAND: Dict[str, List[str]] = {
    "backend developer": [
        "python", "java", "go", "rust", "node.js", "spring boot", "fastapi",
        "postgresql", "mongodb", "redis", "kafka", "docker", "kubernetes",
        "aws", "microservices", "ci/cd", "graphql", "rest api", "terraform",
        "observability", "grpc",
    ],
    "frontend developer": [
        "react", "next.js", "typescript", "tailwind", "vue.js", "svelte",
        "vite", "playwright", "cypress", "figma", "accessibility",
        "web performance", "pwa", "server components", "edge functions",
    ],
    "full stack developer": [
        "react", "next.js", "node.js", "typescript", "python", "postgresql",
        "mongodb", "redis", "docker", "aws", "vercel", "prisma",
        "rest api", "graphql", "ci/cd", "git",
    ],
    "devops engineer": [
        "docker", "kubernetes", "terraform", "aws", "azure", "gcp",
        "github actions", "argocd", "prometheus", "grafana", "linux",
        "ansible", "helm", "istio", "ci/cd", "observability",
    ],
    "ml engineer": [
        "python", "pytorch", "tensorflow", "langchain", "llm", "rag",
        "mlflow", "kubeflow", "docker", "aws sagemaker", "hugging face",
        "transformers", "vector database", "feature store", "mlops",
    ],
}


def calculate_market_alignment(resume_text: str, target_role: str = "backend developer") -> Dict[str, Any]:
    """Compare resume skills against current market demand for a target role."""
    role_key = target_role.lower()
    demand_skills = MARKET_DEMAND.get(role_key, MARKET_DEMAND.get("backend developer", []))
    
    text_lower = resume_text.lower()
    matched = [s for s in demand_skills if s in text_lower]
    missing = [s for s in demand_skills if s not in text_lower]
    
    match_ratio = len(matched) / max(len(demand_skills), 1)
    market_score = min(round(match_ratio * 100), 100)

    return {
        "market_alignment": market_score,
        "matched_market_skills": matched,
        "missing_market_keywords": missing[:10],
        "demand_coverage": f"{len(matched)}/{len(demand_skills)}",
    }
