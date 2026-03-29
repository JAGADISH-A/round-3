import re
import json
from typing import Dict, Any, List
from app.services.ai_config import llm, MODEL_NAME
from langchain.schema import SystemMessage, HumanMessage, AIMessage

class SoftSkillAnalyzer:
    """Game-engine for analyzing soft skills and providing 'Boss Encounter' feedback."""

    SCENARIOS = {
        # --- 💼 Professional Arena ---
        "skeptical_investor": {
            "title": "The Skeptical Investor",
            "context": "You are pitching your career growth plan to a skeptical investor. They are questioning your commitment and clarity.",
            "initial_message": "I've seen many plans like this. Why should I believe YOURS is worth the investment? What makes you different?",
            "victory_condition": "User demonstrates high confidence and clear value proposition.",
        },
        "strict_manager": {
            "title": "The Strict Manager",
            "context": "Your manager is focused purely on KPIs and is questioning your recent dip in metrics.",
            "initial_message": "Your numbers for this quarter are slightly below the benchmark. I need to know exactly why this happened and your immediate recovery plan.",
            "victory_condition": "User demonstrates high accountability and a structured recovery plan.",
        },
        "hr_round": {
            "title": "The HR Round",
            "context": "You are in a final behavioral interview with HR. They are digging into a gap in your resume.",
            "initial_message": "I noticed there's an 8-month gap between your last two roles. Could you walk me through what you were doing during that time?",
            "victory_condition": "User demonstrates positive reframing and clear, confident communication.",
        },
        "angry_client": {
            "title": "The Angry Client",
            "context": "A high-ticket client is furious because of a critical bug in the production deployment.",
            "initial_message": "This is entirely unacceptable! Our ops have been down for two hours because of your update. Who is going to pay for this downtime?!",
            "victory_condition": "User demonstrates extreme empathy (EQ) and de-escalation skills.",
        },

        # --- 🧠 Communication Arena ---
        "explain_complex": {
            "title": "Explain a Complex Topic",
            "context": "You must explain a highly technical concept (like an API or Machine Learning) to a non-technical stakeholder.",
            "initial_message": "I keep hearing the engineering team talk about 'Vector Databases'. I'm just the marketing lead—can you explain what that actually means in plain English?",
            "victory_condition": "User demonstrates high clarity, using analogies without jargon.",
        },
        "defend_decision": {
            "title": "Defend Your Decision",
            "context": "You made a controversial technical or strategic choice, and your peer is challenging it aggressively.",
            "initial_message": "I don't get it. Why did you choose to migrate to that new framework? It seems like a massive waste of time and resources.",
            "victory_condition": "User demonstrates logical structuring, confidence, and avoids defensiveness.",
        },
        "handle_criticism": {
            "title": "Handle Criticism",
            "context": "You are receiving harsh feedback on a project you poured your heart into.",
            "initial_message": "To be brutally honest, this design feels incredibly clunky. The user experience is confusing and it doesn't match our brand at all.",
            "victory_condition": "User demonstrates high EQ, listens to the feedback, and asks constructive follow-up questions.",
        },

        # --- ⚡ Pressure Arena ---
        "rapid_fire": {
            "title": "Rapid-Fire Questions",
            "context": "An interviewer is throwing quick, intense behavioral questions at you to test your mental agility.",
            "initial_message": "Alright, let's go quick: What's your biggest weakness, how do you handle failure, and why should we hire you? Go.",
            "victory_condition": "User demonstrates extreme clarity and conciseness under pressure.",
        },
        "time_limited": {
            "title": "Time-Limited Answers",
            "context": "You only have 30 seconds to deliver your elevator pitch to the CEO in an elevator.",
            "initial_message": "Hey! We haven't met. I'm getting off on the next floor—what exactly do you do here and why does it matter?",
            "victory_condition": "User demonstrates high confidence and extreme brevity.",
        },
        "ai_interruptions": {
            "title": "AI Interruptions",
            "context": "The AI interviewer will randomly interrupt you mid-sentence to challenge your train of thought.",
            "initial_message": "Tell me about a time you led a team through a difficult crisis. And please, be specific with the metrics.",
            "victory_condition": "User maintains composure and gracefully handles the aggressive conversational flow.",
        }
    }

    @staticmethod
    def compute_game_stats(text: str) -> Dict[str, int]:
        """Heuristic-based game stats for the HUD."""
        text_lower = text.lower()
        words = text_lower.split()
        word_count = len(words)

        # 1. Clarity (0-100)
        filler_words = ["um", "uh", "like", "you know", "actually", "basically", "literally"]
        filler_count = sum(text_lower.count(f) for f in filler_words)
        clarity = max(min(100 - (filler_count * 10) + (min(word_count, 50) // 2), 100), 10)

        # 2. Confidence (0-100)
        assertive = ["i built", "i led", "i delivered", "i will", "absolutely", "clearly"]
        hedging = ["maybe", "i think", "i guess", "probably", "sort of", "might"]
        assertive_count = sum(text_lower.count(a) for a in assertive)
        hedging_count = sum(text_lower.count(h) for h in hedging)
        confidence = max(min(70 + (assertive_count * 15) - (hedging_count * 15), 100), 5)

        # 3. EQ / Empathy (0-100)
        empathy_markers = ["i understand", "i hear you", "i agree", "thank you", "let's solve", "we can"]
        eq_count = sum(text_lower.count(e) for e in empathy_markers)
        eq = max(min(60 + (eq_count * 20), 100), 20)

        return {
            "clarity": int(clarity),
            "confidence": int(confidence),
            "eq": int(eq),
            "overall_hp": int((clarity + confidence + eq) / 3)
        }

    async def analyze_with_coach(self, scenario_id: str, history: List[Dict[str, str]], user_text: str) -> Dict[str, Any]:
        """LLM-enhanced coaching analysis for the 'Game'."""
        scenario = self.SCENARIOS.get(scenario_id, self.SCENARIOS["skeptical_investor"])
        
        stats = self.compute_game_stats(user_text)
        
        prompt = f"""
        You are the AI Soft Skill Coach in a high-stakes 'Mastery Arena' game.
        The user is currently in a scenario: {scenario['title']}.
        Context: {scenario['context']}
        
        User's latest response: "{user_text}"
        
        Your task is to provide:
        1. A 'Coach Tip' (Short, punchy advice like a game hint).
        2. Scenario Response (Continue the simulation as the character).
        3. Game Result (Did they 'Win' the turn, or 'Lose HP'?).
        
        Return ONLY a JSON object:
        {{
            "coach_tip": "string",
            "scenario_response": "string",
            "turn_result": "win | loss | neutral",
            "stat_delta": {{ "clarity": int, "confidence": int, "eq": int }}
        }}
        """
        
        try:
            langchain_messages = [
                SystemMessage(content=prompt),
                HumanMessage(content=user_text)
            ]
            response = llm.invoke(langchain_messages)
            raw = response.content.strip()
            # Basic cleanup for JSON
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            llm_result = json.loads(raw)
            
            return {
                "stats": stats,
                "coach_feedback": llm_result,
                "scenario": scenario
            }
        except Exception as e:
            print(f"[CoachEngine] Error: {e}")
            return {
                "stats": stats,
                "coach_feedback": {
                    "coach_tip": "Keep your head up and stay focused on the value you bring!",
                    "scenario_response": "I hear you, but let's see some data.",
                    "turn_result": "neutral",
                    "stat_delta": {"clarity": 0, "confidence": 0, "eq": 0}
                },
                "scenario": scenario
            }
