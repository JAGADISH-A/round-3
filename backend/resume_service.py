import os
import re
import json
import logging
from io import BytesIO
from typing import Dict, Any, List, Optional
from pypdf import PdfReader
import google.generativeai as genai
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, TimeoutError

# Import the taxonomy from jd_matcher
try:
    from backend.jd_matcher import extract_taxonomy_skills, SKILL_TAXONOMY
except ImportError:
    from jd_matcher import extract_taxonomy_skills, SKILL_TAXONOMY

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

# --- Constants for Scoring ---
IMPACT_VERBS = {
    "built", "developed", "engineered", "designed", "implemented", "optimized", "created",
    "spearheaded", "reduced", "increased", "improved", "led", "managed", "deployed", "scaled",
    "architected", "streamlined", "automated", "launched", "delivered", "mentored"
}

METRIC_PATTERNS = [
    r'\d+%',                          # 50%
    r'\d+\s*[xX]',                    # 10x, 2X
    r'[\$\£\€]\d+',                   # $100, €50
    r'\b\d+\s*[\+\-]',                # 5+, 10-
    r'\b\d+(?:\.\d+)?\s*[kKmMbB]\b',  # 10k, 5.5M, 1B
    r'\b\d+\s*(?:ms|sec|users|clients|customers|requests|records|data|profit|revenue|growth|employees|users|visits|downloads)\b'
]

SECTION_HEADERS = {
    "summary": r'\b(summary|profile|objective|about me|professional summary)\b',
    "skills": r'\b(skills|technical expertise|technologies|key skills|competencies)\b',
    "experience": r'\b(experience|work history|professional experience|employment history)\b',
    "projects": r'\b(projects|personal projects|notable projects|key projects|github)\b',
    "education": r'\b(education|academics|university|qualifications)\b'
}

def parse_pdf(file_content: bytes) -> str:
    """Extract raw text from PDF bytes."""
    try:
        reader = PdfReader(BytesIO(file_content))
        text = ""
        for page in reader.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"
        return text
    except Exception as e:
        logging.error(f"PDF Parsing error: {e}")
        return ""

def _split_into_bullets(text: str) -> List[str]:
    """Helper to extract bullet-point statements from resume text."""
    # Split by lines and clean
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    bullets = []
    bullet_chars = ('•', '-', '*', '●', '○', '■', '▪')
    
    for line in lines:
        # Check if line starts with a bullet char
        if line.startswith(bullet_chars):
            # Strip the bullet char and leading whitespace
            content = re.sub(r'^[•\-\*●○■▪]\s*', '', line)
            if len(content.split()) >= 2:
                bullets.append(content)
        # Fallback: if it's a reasonably long line starting with capital, it might be a bullet
        elif len(line.split()) >= 3 and line[0].isupper() and not line.endswith(':'):
            # Check it's not a common header
            if not any(re.search(pattern, line.lower()) for pattern in SECTION_HEADERS.values()):
                bullets.append(line)
                
    return bullets

def calculate_ats_score(text: str, sections: Dict[str, Any], resume_skills: List[str], jd_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Improved ATS Scoring Model (Weighted 25/35/20/20):
    1. Section Completeness (25%)
    2. Keyword Density (35%) - Cross-ref with JD if present
    3. Impact Verbs (20%) - Bullet analysis
    4. Quantified Metrics (20%) - Bullet analysis
    """
    text_lower = text.lower()
    bullets = _split_into_bullets(text)
    total_bullets = len(bullets)
    
    # 1. Section Completeness (25%)
    expected = ["summary", "skills", "experience", "projects", "education"]
    present = [s for s in expected if sections.get(s)]
    completeness_score = (len(present) / len(expected)) * 100
    
    # 2. Keyword Density (35%)
    if jd_text:
        jd_skills = extract_taxonomy_skills(jd_text)
        if jd_skills:
            matched_skills = set(resume_skills) & jd_skills
            density_score = (len(matched_skills) / len(jd_skills)) * 100
        else:
            density_score = min((len(resume_skills) / 15) * 100, 100)
    else:
        # Fallback to richness: 20+ skills = 100%
        density_score = min((len(resume_skills) / 20) * 100, 100)
    
    # 3. Impact Verbs (20%)
    if total_bullets > 0:
        bullets_with_verbs = 0
        for b in bullets:
            b_lower = b.lower()
            if any(v in b_lower for v in IMPACT_VERBS):
                bullets_with_verbs += 1
        verb_score = (bullets_with_verbs / total_bullets) * 100
    else:
        verb_score = 0
        
    # 4. Quantified Metrics (20%)
    if total_bullets > 0:
        bullets_with_metrics = 0
        combined_metrics = re.compile('|'.join(METRIC_PATTERNS), re.IGNORECASE)
        for b in bullets:
            if combined_metrics.search(b):
                bullets_with_metrics += 1
        metric_score = (bullets_with_metrics / total_bullets) * 100
    else:
        metric_score = 0
    
    final_score = (
        (completeness_score * 0.25) +
        (density_score * 0.35) +
        (verb_score * 0.20) +
        (metric_score * 0.20)
    )
    
    return {
        "score": int(final_score),
        "breakdown": {
            "section_completeness": int(completeness_score),
            "keyword_density": int(density_score),
            "impact_score": int(verb_score),
            "metrics_score": int(metric_score)
        }
    }

def local_parser(text: str) -> Dict[str, Any]:
    """Basic extraction using regex if Gemini fails."""
    sections = {}
    lines = text.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        found_header = False
        for sec, pattern in SECTION_HEADERS.items():
            if re.search(pattern, line.lower()):
                current_section = sec
                sections[current_section] = []
                found_header = True
                break
        
        if not found_header and current_section:
            sections[current_section].append(line)
            
    # Format sections
    formatted_sections = {k: "\n".join(v) for k, v in sections.items()}
    skills = list(extract_taxonomy_skills(text))
    
    return {
        "inferred_role": "Software Engineer",
        "skills": skills,
        "sections": formatted_sections,
        "education": [],
        "experience": [],
        "projects": [],
        "pipeline": "local"
    }

def gemini_parser(text: str) -> Dict[str, Any]:
    """AI-Enhanced extraction using Gemini 1.5 Flash."""
    if not model:
        raise Exception("Gemini API not configured")

    prompt = """
    You are a resume parser. Extract information from this resume.
    Return ONLY a valid JSON object with no markdown, no explanation, no code fences.
    Format your response EXACTLY like this:
    {
      "inferred_role": "str",
      "skills": ["str"],
      "education": [{"institution": "str", "degree": "str", "year": "str"}],
      "experience": [{"company": "str", "title": "str", "duration": "str", "impact": "str"}],
      "projects": [{"name": "str", "tech_stack": ["str"], "description": "str"}],
      "sections": {
        "summary": "str",
        "skills": "str",
        "experience": "str",
        "projects": "str",
        "education": "str"
      }
    }
    """
    
    response = model.generate_content(
        f"{prompt}\n\nRESUME TEXT:\n{text[:8000]}",
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,
            max_output_tokens=2048,
        )
    )
    
    try:
        # Strip potential markdown fences if Gemini ignored instructions
        raw_json = response.text.strip()
        if raw_json.startswith("```json"):
            raw_json = raw_json[7:-3].strip()
        elif raw_json.startswith("```"):
            raw_json = raw_json[3:-3].strip()
        
        parsed = json.loads(raw_json)
        parsed["pipeline"] = "gemini"
        return parsed
    except Exception as e:
        logging.error(f"Gemini output parsing failed: {e}")
        raise

def _run_pipeline(raw_text: str, jd_text: Optional[str] = None) -> Dict[str, Any]:
    """Shared logic: run Gemini or local parser, then score."""
    try:
        with ThreadPoolExecutor() as executor:
            future = executor.submit(gemini_parser, raw_text)
            result = future.result(timeout=10)
    except (TimeoutError, Exception) as e:
        logging.warning(f"Gemini pipeline failed or timed out: {e}. Falling back to local.")
        result = local_parser(raw_text)

    result["skills"] = list(extract_taxonomy_skills(raw_text))
    ats_data = calculate_ats_score(raw_text, result.get("sections", {}), result["skills"], jd_text)
    result["ats_score"] = ats_data["score"]
    result["ats_breakdown"] = ats_data["breakdown"]
    result["full_text"] = raw_text

    # Count quantified metrics (combined pattern)
    combined_pattern = re.compile('|'.join(METRIC_PATTERNS), re.IGNORECASE)
    result["impact_metrics"] = len(combined_pattern.findall(raw_text.lower()))

    return result

def analyze_resume(file_content: bytes, jd_text: Optional[str] = None) -> Dict[str, Any]:
    """Orchestrate the parsing pipeline from a PDF file."""
    raw_text = parse_pdf(file_content)
    if not raw_text:
        return {"error": "Could not read PDF content"}
    return _run_pipeline(raw_text, jd_text)

def analyze_resume_text(full_text: str, jd_text: Optional[str] = None) -> Dict[str, Any]:
    """Orchestrate the parsing pipeline from raw text (used by analyze-role endpoint)."""
    if not full_text.strip():
        return {"error": "Empty resume text provided"}
    return _run_pipeline(full_text, jd_text)

def rewrite_bullet_with_gemini(bullet: str, role: str, missing_keywords: List[str], context: str) -> Dict[str, Any]:
    """Call Gemini to rewrite a resume bullet point."""
    if not model:
        return {"rewritten": f"Worked with {', '.join(missing_keywords)} in a {role} context", "improvement_summary": "API offline fallback", "keywords_added": []}

    prompt = f"""
    You are a senior tech recruiter. Rewrite this resume bullet to be stronger, more impact-driven, and naturally incorporate these keywords: {missing_keywords}.
    Keep it one line, start with a strong action verb, include a metric if possible.
    Target Role: {role}
    JD Context: {context}
    Original: {bullet}
    
    Return ONLY a JSON object: {{"rewritten": "...", "improvement_summary": "...", "keywords_added": [...]}}
    """
    
    try:
        response = model.generate_content(prompt)
        raw_json = response.text.strip()
        # Cleanup markdown fences
        if raw_json.startswith("```"):
            raw_json = re.sub(r'```(?:json)?\s*|\s*```', '', raw_json)
        return json.loads(raw_json)
    except Exception as e:
        logging.error(f"Bullet rewrite failed: {e}")
        return {"rewritten": bullet, "improvement_summary": "Optimization failed", "keywords_added": []}
