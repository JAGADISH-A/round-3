import random
import logging
import time
import json
import re
from typing import Optional, Dict, Any, List
from app.services.langchain_service import get_chat_response

# Configure logging
logger = logging.getLogger(__name__)

# Global session store for interview practice
# Structure: {user_id: {"mode": str, "personality": str, "question_index": int, "current_question": str, "history": [], "memory": {}}}
user_sessions: Dict[int, Dict[str, Any]] = {}

# Phase 3: Personality System
PERSONALITY_MODES = {
    "technical": {
        "name": "Senior Technical Lead",
        "tone": "professional, precise, and practical",
        "focus": "code quality, optimization, and edge cases",
        "questions": [
            "Explain a backend system you built and the challenges you faced.",
            "How do you handle database concurrency and race conditions?",
            "Describe how you would implement a distributed locking mechanism.",
            "What's your approach to optimizing slow database queries?",
            "How do you ensure your APIs are secure and resilient?"
        ]
    },
    "hr": {
        "name": "HR Manager",
        "tone": "warm, empathetic, and behavioral-focused",
        "focus": "teamwork, conflict resolution, and culture fit",
        "questions": [
            "Tell me about yourself and your career journey.",
            "Describe a time you had a conflict with a team member.",
            "What are your biggest strengths as a collaborator?",
            "How do you handle tight deadlines and pressure?",
            "Where do you see yourself in five years?"
        ]
    },
    "system": {
        "name": "System Architect",
        "tone": "strategic, high-level, and scaling-focused",
        "focus": "scalability, trade-offs, and architecture patterns",
        "questions": [
            "How would you design a system to handle 100k requests per second?",
            "What are the trade-offs between SQL and NoSQL for a messaging app?",
            "Explain how you would implement a global CDN or caching strategy.",
            "How do you design for high availability and disaster recovery?",
            "Describe your experience with microservices vs monolithic architecture."
        ]
    }
}

# Phase 4: Template-based Transitions
TRANSITION_TEMPLATES = [
    "Interesting, let's go deeper.",
    "Got it. Now consider this...",
    "Alright, moving forward...",
    "Makes sense. Let's pivot slightly.",
    "Good point. I'd like to explore another area.",
    "That's clear. Let's step up the complexity."
]

class InterviewEngine:
    """
    Deterministic Adaptive Interview Engine.
    Emphasizes stability, low latency, and bot-controlled flow.
    """

    @staticmethod
    def get_session(user_id: int) -> Dict[str, Any]:
        """Retrieve or initialize a user session."""
        if user_id not in user_sessions:
            user_sessions[user_id] = {
                "mode": "chat",
                "personality": "technical",
                "question_index": 0,
                "current_question": "",
                "is_follow_up": False,
                "history": [],
                "memory": {
                    "avg_score": 0,
                    "scores": [],
                    "strengths": [],
                    "weaknesses": []
                }
            }
        return user_sessions[user_id]

    @staticmethod
    def start_interview(user_id: int, personality: str = "technical") -> str:
        """Initialize interview session with a specific personality."""
        logger.info(f"[INTERVIEW] started for user {user_id} with personality: {personality}")
        
        if personality not in PERSONALITY_MODES:
            personality = "technical"
            
        session = InterviewEngine.get_session(user_id)
        session["mode"] = "interview"
        session["personality"] = personality
        session["question_index"] = 0
        session["is_follow_up"] = False
        session["history"] = []
        session["memory"] = {
            "avg_score": 0,
            "scores": [],
            "strengths": [],
            "weaknesses": []
        }
        
        first_q = PERSONALITY_MODES[personality]["questions"][0]
        session["current_question"] = first_q
        return first_q

    @staticmethod
    def process_interaction(user_id: int, user_answer: str) -> Dict[str, Any]:
        """
        Main driver: Evaluates answer and generates next step phrasing in ONE LLM call.
        Phases 1, 2, 7.
        """
        start_time = time.time()
        session = InterviewEngine.get_session(user_id)
        current_q = session["current_question"]
        personality_config = PERSONALITY_MODES[session["personality"]]
        
        logger.info(f"[INTERVIEW] processing interaction for user {user_id}")

        # Combined LLM Prompt for Evaluation + Wording Options
        prompt = (
            f"You are a {personality_config['name']}. Your tone is {personality_config['tone']}.\n"
            f"Your focus is on {personality_config['focus']}.\n\n"
            f"Question:\n{current_q}\n\n"
            f"Candidate Answer:\n{user_answer}\n\n"
            "TASK:\n"
            "1. Evaluate the answer (Score 1-10).\n"
            "2. Identify 1 key strength and 1 key weakness.\n"
            "3. Generate ONE short clarification follow-up (if the answer was weak).\n"
            "4. Generate ONE short 'deep-dive' follow-up (if the answer was strong).\n\n"
            "Return STRICT JSON format:\n"
            "{\n"
            "  \"score\": int,\n"
            "  \"strengths\": \"...\",\n"
            "  \"weaknesses\": \"...\",\n"
            "  \"advice\": \"...\",\n"
            "  \"clarification_wording\": \"...\",\n"
            "  \"deep_dive_wording\": \"...\"\n"
            "}\n\n"
            "Rules:\n"
            "- Wording must be conversational and TTS-friendly (max 2 sentences).\n"
            "- Evaluation must be professional."
        )

        try:
            # Phase 7: Combined LLM call
            result = get_chat_response([{"role": "user", "content": prompt}])
            raw_response = result.get("response", "{}")
            
            # Extract JSON from response if it has markdown or extra text
            json_match = re.search(r"\{.*\}", raw_response, re.DOTALL)
            if json_match:
                eval_data = json.loads(json_match.group())
            else:
                eval_data = {"score": 5, "advice": "Please expand on your answer."}
            
            try:
                score = int(eval_data.get("score", 5))
            except (ValueError, TypeError):
                score = 5
            
            # Phase 5: Update Performance Memory
            session["memory"]["scores"].append(score)
            session["memory"]["avg_score"] = sum(session["memory"]["scores"]) / len(session["memory"]["scores"])
            if eval_data.get("strengths"): session["memory"]["strengths"].append(eval_data["strengths"])
            if eval_data.get("weaknesses"): session["memory"]["weaknesses"].append(eval_data["weaknesses"])

            # Phase 1: Deterministic Decision Engine (Bot controlled)
            next_text = ""
            is_follow_up = False
            
            if score <= 5:
                # Follow-up: Clarification
                next_text = eval_data.get("clarification_wording", "Could you explain that in more detail?")
                is_follow_up = True
            elif score <= 7:
                # Follow-up: Medium/Refinement (Use deep dive wording)
                next_text = eval_data.get("deep_dive_wording", "That's interesting. How would you handle trade-offs there?")
                is_follow_up = True
            else:
                # High score: Move to next question or deeper tech
                # For simplicity, if we haven't followed up on this question yet, maybe one deep dive
                if not session.get("is_follow_up", False) and random.random() > 0.5:
                    next_text = eval_data.get("deep_dive_wording", "Impressive. How does this scale?")
                    is_follow_up = True
                else:
                    # Move to next question
                    next_topic_q = InterviewEngine._get_next_topic_question(user_id)
                    if next_topic_q:
                        transition = random.choice(TRANSITION_TEMPLATES)
                        next_text = f"{transition} {next_topic_q}"
                        is_follow_up = False
                    else:
                        # End interview
                        next_text = InterviewEngine.end_interview(user_id)
                        return {
                            "evaluation": eval_data,
                            "next_text": next_text,
                            "is_end": True,
                            "latency": time.time() - start_time
                        }

            session["current_question"] = next_text
            session["is_follow_up"] = is_follow_up
            
            return {
                "evaluation": eval_data,
                "next_text": next_text,
                "is_end": False,
                "latency": time.time() - start_time
            }

        except Exception as e:
            logger.error(f"[INTERVIEW] interaction failed: {e}")
            return {
                "evaluation": {"score": 5, "advice": "I had a minor hiccup. Let's continue."},
                "next_text": "Let's try that again. Could you explain the main idea one more time?",
                "is_end": False,
                "latency": time.time() - start_time
            }

    @staticmethod
    def _get_next_topic_question(user_id: int) -> Optional[str]:
        """Move to the next question in the set."""
        session = InterviewEngine.get_session(user_id)
        personality_qs = PERSONALITY_MODES[session["personality"]]["questions"]
        
        session["question_index"] += 1
        if session["question_index"] < len(personality_qs):
            return personality_qs[session["question_index"]]
        return None

    @staticmethod
    def end_interview(user_id: int) -> str:
        """
        Phase 6 & 7: Summary Engine (Hybrid).
        """
        session = InterviewEngine.get_session(user_id)
        avg_score = session["memory"]["avg_score"]
        
        # Qualitative feedback generated by LLM based on memory
        summary_prompt = (
            f"You have just finished interviewing a candidate for a {session['personality']} role.\n"
            f"Summarize their performance based on these notes:\n"
            f"Strengths: {', '.join(session['memory']['strengths'][:3])}\n"
            f"Weaknesses: {', '.join(session['memory']['weaknesses'][:3])}\n\n"
            "Provide 1 major strength, 2 areas for improvement, and actionable advice.\n"
            "Keep it very concise and conversational (max 3 sentences)."
        )
        
        try:
            result = get_chat_response([{"role": "user", "content": summary_prompt}])
            llm_summary = result.get("response", "You did a solid job overall.")
        except:
            llm_summary = "You performed well across all topics. Continue practicing your core technical articulation."

        final_score = int(avg_score)
        
        summary = (
            f"Interview Complete! 🏁\n\n"
            f"*Overall Performance Score: {final_score}/10*\n\n"
            f"{llm_summary}\n\n"
            "You can type /practice for a new session or /coach for general chat."
        )
        
        # Reset session
        session["mode"] = "chat"
        session["question_index"] = 0
        
        return summary

    @staticmethod
    def is_interview_mode(user_id: int) -> bool:
        return InterviewEngine.get_session(user_id).get("mode") == "interview"
