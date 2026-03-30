"""Persona Prompt Builder — Generates role-specific system prompts with tone modifiers."""

from app.services.config_loader import get_personas
from app.services.tts_service import TTS_SPEECH_RULES

BASE_IDENTITY = "You are CareerSpark AI, an intelligent career coaching assistant."

PERSONA_ROLES = {
    "career_coach": "You are acting as a Career Coach helping users plan skills, navigate transitions, and build long-term career paths.",
    "programming_tutor": "You are acting as a patient Programming Tutor explaining technical concepts step-by-step.",
    "technical_interviewer": "You are acting as a Technical Interviewer evaluating coding ability and problem solving.",
    "soft_skill_tutor": "You are acting as a Soft Skill Tutor (Communication Coach) helping users improve interview answers, storytelling, and confidence.",
    "resume_reviewer": "You are acting as a Resume Reviewer helping improve technical resumes.",
    "voice_reviewer": "You are acting as a Voice Reviewer (Communication Coach) focusing on vocal delivery metrics like pacing and clarity.",
    "face_reviewer": "You are acting as an Interview Presentation Coach focusing on non-verbal communication."
}

TONE_STYLES = {
    "friendly": "Friendly: Use relaxed conversational language. Allow informal greetings and humor.",
    "strict": "Strict: Maintain a professional and challenging tone but remain respectful.",
    "tutor": "Tutor: Explain concepts step-by-step and guide the user patiently.",
    "motivational": "Motivational: Encourage the user and provide supportive feedback.",
    "funny": "Fun: Use witty and lighthearted language. Crack occasional jokes, use puns, and keep the user engaged with high energy.",
    "mentor": "Mentor: Share industry secrets, professional anecdotes, and deep strategic advice. Be encouraging but wise.",
    "strict": "Strict: High-pressure, no-nonsense coaching. Focus on hard skills, gaps, and rigorous preparation."
}

UNIVERSAL_RULES = [
    "1. Always maintain the selected persona role.",
    "2. Always respect the selected tone.",
    "3. Tone must never be overridden by persona.",
    "4. Do not reject informal greetings unless tone is Strict.",
    "5. When tone is Friendly or Motivational, allow casual conversation and humor.",
    "6. If analysis context exists, assume the analysis has already been performed and do not ask the user to upload the data again."
]

def build_system_prompt(persona_id: str, tone_id: str = "friendly", analysis_context: dict = None, lang: str = "en", intent: str = None, user_profile: dict = None) -> str:
    """
    Constructs a structured system prompt following the design requirement:
    BASE IDENTITY -> PERSONA ROLE -> COMMUNICATION TONE -> USER MEMORY -> ANALYSIS CONTEXT -> UNIVERSAL RULES
    """
    role = PERSONA_ROLES.get(persona_id, PERSONA_ROLES["career_coach"])
    
    # Intent Overrides
    if intent == "devops_roadmap":
        role = "You are a DevOps Engineering Expert. Your goal is to provide a highly technical and structured DevOps roadmap."
    elif intent == "frontend_roadmap":
        role = "You are a Frontend Engineering Expert. Your goal is to provide a structured Frontend development roadmap."
    elif intent == "backend_roadmap":
        role = "You are a Backend Engineering Expert. Your goal is to provide a structured Backend development roadmap."
    elif intent == "general_roadmap":
        role = "You are a Career Mentor. Your goal is to provide a comprehensive and structured career roadmap."

    tone = TONE_STYLES.get(tone_id.lower(), TONE_STYLES["friendly"])
    
    sections = [
        BASE_IDENTITY,
        f"\nROLE\n{role}",
    ]

    # Intent-specific formatting rules
    if intent and "roadmap" in intent:
        sections.append("\nROADMAP FORMATTING RULES")
        sections.append("1. Title: Clear and bold.")
        sections.append("2. Sections: Group related topics.")
        sections.append("3. Bullet points: Use '⭕' symbol for each item.")
        sections.append("4. No Repetition: Do not repeat previous sections or information.")
        sections.append("5. Fresh Intent: Focus accurately on the latest user request, ignoring conflicting previous context.")
        sections.append("6. Structured: Ensure the steps are logical and sequential.")

    sections.append(f"\nCOMMUNICATION STYLE\nThe conversation tone is {tone}")

    # Language Instruction
    if lang == "ta":
        sections.append("\nRESPONSE LANGUAGE\nAlways respond in Tamil (தமிழ்).")
    else:
        sections.append("\nRESPONSE LANGUAGE\nAlways respond in English.")
    
    if user_profile:
        sections.append("\nUSER MEMORY (PERSISTENCE)")
        sections.append(f"The user has the following profile:")
        if user_profile.get("goal"): sections.append(f"- Career Goal: {user_profile['goal']}")
        if user_profile.get("skills"): sections.append(f"- Known Skills: {', '.join(user_profile['skills']) if isinstance(user_profile['skills'], list) else user_profile['skills']}")
        if user_profile.get("level"): sections.append(f"- Current Level: {user_profile['level']}")
        sections.append("Use this memory to personalize your advice and refer to their goals periodically.")

    if analysis_context:
        ctx_type = analysis_context.get("type", "general")
        sections.append(f"\nCONTEXT\nThe user recently completed a {ctx_type} analysis. The following results are available:\n{analysis_context}")
    
    sections.append("\nBEHAVIOR RULES\n" + "\n".join(UNIVERSAL_RULES))
    
    # Inject Tool Usage Rules
    sections.append(TOOL_INSTRUCTIONS)
    
    # Inject TTS Speech Rules
    sections.append(TTS_SPEECH_RULES)
    
    return "\n".join(sections)

def validate_persona_id(persona_id: str) -> bool:
    """Check if persona_id is valid based on config."""
    personas = get_personas()
    return any(p["id"] == persona_id for p in personas)
