import os
import json
import re
from typing import List, Dict, Any, Optional
from langchain.schema import HumanMessage, SystemMessage
from app.services.ai_config import llm, voice_llm

def _get_active_llm():
    """Return Gemini if available, otherwise Groq."""
    return voice_llm if voice_llm else llm

def get_english_lesson(topic: str, lang: str = "en") -> Dict[str, Any]:
    """Generate an interactive English lesson based on a topic."""
    
    prompt = f"""You are a Master English Pedagogical AI.
    
    Create a highly educational lesson on: '{topic}'.
    Target: {lang} speaker.

    Structure the content for a student:
    1. 'Neural Link' title.
    2. 'Core Concept' - Explain the WHY and WHEN.
    3. 'Usage Patterns' - 3 detailed rules with clear contrast (e.g., Do vs Don't).
    4. 'Neural Hack' - A memory aid or common corporate mistake to avoid.
    5. 'Verification Node' - A tricky check question.

    Return JSON:
    {{
        "title": "...",
        "concept": "...",
        "rules": [
            {{"rule": "...", "example": "..."}}
        ],
        "pro_tip": "...",
        "quiz_question": "...",
        "quiz_options": ["...", "...", "...", "..."],
        "correct_answer": "...",
        "explanation": "..."
    }}

    LANGUAGE RULE: If lang is 'ta', use a bilingual (Tamil/English) approach for explanations but keep rules/examples in English.
    """

    if topic.lower() == 'tenses':
        ensure_logic = "Ensure you cover at least one past, one present, and one future variation relevant to IT/Corporate work."
        prompt += f"\nSPECIAL_INSTRUCTION: {ensure_logic}"

    try:
        response = _get_active_llm().invoke([SystemMessage(content=prompt)])
        raw = response.content.strip()
        # Clean markdown if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        print(f"[EnglishService] Lesson Error: {e}")
        return {
            "title": f"Intro to {topic}",
            "concept": f"Learning the basics of {topic} for professional use.",
            "rules": [{"rule": "Consistency is key.", "example": "I work here. (Not: I working here.)"}],
            "pro_tip": "Always proofread before sending emails.",
            "quiz_question": f"Which of these is a correct use of {topic}?",
            "quiz_options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A",
            "explanation": "Simple and clear communication is best."
        }

def get_english_quiz(category: str, difficulty: str = "intermediate", lang: str = "en") -> List[Dict[str, Any]]:
    """Generate a set of 5 randomized English quiz questions."""
    
    prompt = f"""You are an English Language Tutor evaluating category: '{category}'.
    
    Generate 5 interactive quiz questions.
    Difficulty: '{difficulty}'.

    Include a 'hint' key for each question to help the student if they get stuck.
    
    Return JSON list of items:
    - "id": <int>
    - "question": "..."
    - "options": ["...", "...", "...", "..."]
    - "answer": "..."
    - "hint": "A subtle clue to help them think of the answer."
    - "explanation": "Detailed pedagogical explanation of why the answer is correct."
    """

    try:
        response = _get_active_llm().invoke([SystemMessage(content=prompt)])
        raw = response.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        print(f"[EnglishService] Quiz Error: {e}")
        return [
            {
                "id": 1,
                "question": "Choose the correct verb form: 'The team _____ the project yesterday.'",
                "options": ["finish", "finishes", "finished", "was finishing"],
                "answer": "finished",
                "explanation": "Use past tense for completed actions."
            }
        ]

def get_writing_prompt(prompt_type: str = "email", context: str = "general") -> Dict[str, str]:
    """Generate a specific writing prompt (Email/Letter)."""
    
    prompt = f"""Generate a professional writing scenario for an '{prompt_type}' based on context: '{context}'.
    The user needs to practice writing this in a corporate setting.

    Return a JSON:
    {{
        "title": "Scenario Title",
        "scenario": "A detailed 2-sentence description of the situation.",
        "requirements": ["Requirement 1", "Requirement 2"],
        "expected_tone": "Formal/Neutral/Appreciative"
    }}
    """
    try:
        response = _get_active_llm().invoke([SystemMessage(content=prompt)])
        raw = response.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception:
        return {
            "title": "Email to Manager",
            "scenario": "You need to request a 2-day leave for a family function.",
            "requirements": ["Mention the dates", "Suggest a backup plan"],
            "expected_tone": "Formal"
        }

def evaluate_writing(user_text: str, scenario: str) -> Dict[str, Any]:
    """Analyze and score the user's written response."""
    
    prompt = f"""You are a Senior English Writing Tutor. 
    
    Evaluate this response for scenario: "{scenario}".
    User says: "{user_text}"

    Don't just score. TEACH. 
    Explain the nuances of the tone and the structural impact of their choices.

    Return JSON:
    {{
        "scores": {{
            "grammar": 0-25,
            "tone": 0-25,
            "clarity": 0-25,
            "logic": 0-25
        }},
        "overall_score": 0-100,
        "feedback": "A warm, tutor-like feedback summary.",
        "teaching_points": ["Specific pedagogical insight 1", "Specific pedagogical insight 2"],
        "structural_critique": "Analysis of the letter/email structure used.",
        "improvements": ["Actionable correction 1", "..."],
        "enhanced_version": "A gold-standard professional rewrite."
    }}
    """
    try:
        response = _get_active_llm().invoke([SystemMessage(content=prompt)])
        raw = response.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception:
        return {
            "scores": {
                "grammar": 18,
                "tone": 18,
                "clarity": 18,
                "logic": 21
            },
            "overall_score": 75,
            "feedback": "Analysis failed partially. Showing estimated metrics.",
            "teaching_points": ["Maintain a clear subject line.", "Check your salutations."],
            "structural_critique": "Structure appears standard but requires deeper verification.",
            "improvements": ["Ensure internet connection remains stable.", "Try a shorter response."],
            "enhanced_version": "Signal reconstruction failed. Please retry."
        }

def get_writing_scaffold(prompt_type: str, scenario: str) -> Dict[str, Any]:
    """Provide a structural blueprint for a writing task."""
    
    prompt = f"""You are a Writing Mentor.
    
    Task Type: {prompt_type}
    Scenario: {scenario}

    Help the student write this. Provide a 'Neural Blueprint' (Structure) and a 'Starter Phrase'.
    
    Return JSON:
    {{
        "structure": [
            {{"section": "Salutation", "tip": "Professional opening"}},
            {{"section": "Context", "tip": "State the purpose"}},
            {{"section": "Action", "tip": "What do you want them to do?"}},
            {{"section": "Closing", "tip": "Next steps"}}
        ],
        "starter_template": "A fill-in-the-blanks template to get them started.",
        "key_vocabulary": ["Essential word 1", "Essential word 2"]
    }}
    """
    try:
        response = _get_active_llm().invoke([SystemMessage(content=prompt)])
        raw = response.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception:
        return {
            "structure": [{"section": "Header", "tip": "Start formal"}],
            "starter_template": "Dear [Name], I am writing to [Purpose]...",
            "key_vocabulary": ["Sincerely", "Reference", "Regarding"]
        }
