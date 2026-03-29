# Project Plan: AI Soft Skill Coaching Game

This plan transforms the coaching experience into a gamified "Mastery Arena" using Agile Sprints.

## 📋 Overview
- **Project Type**: FULL-STACK (Game-like UI + AI Analysis)
- **Objective**: Create an interactive coach that evaluates and trains soft skills through simulated "encounters."

## ✅ Success Criteria
- [ ] Users can enter a "Coaching Scenario."
- [ ] Real-time feedback HUD showing Clarity, EQ, and Confidence stats.
- [ ] Progress bar increases as the user provides better responses (Goal Gradient Effect).
- [ ] Post-session "XP" and "Skill Level" summary.

## 🛠️ Tech Stack
- **Frontend**: React/Next.js (HUD), Framer Motion (Animations), Zustand (Game State).
- **Backend**: FastAPI (Analysis), LangChain (Scenario Mgmt).
- **Game Logic**: Finite State Machine (FSM) for scenarios.

## 🏃 Sprint 1: The Arena Foundation [CURRENT]
**Goal**: Build the core interaction loop and HUD.

### [NEW] `ai-service/intelligence-service/app/services/coach_engine.py`
- Implements the "Skill Analyzer" (returns scores for 3 core markers).
- Manages the scenario prompt (FSM states).

### [NEW] `frontend/components/coach/CoachHUD.tsx`
- Futuristic UI with data-visualization "gauges."
- Progress bars using the Zeigarnik Effect (incomplete bars drive completion).

### [MODIFY] `frontend/app/(dashboard)/coach/page.tsx`
- The entry point for the "Mastery Arena."

## 📈 Agent Assignments
| Phase | Agent | Focus |
|---|---|---|
| Foundation | `backend-specialist` | Analysis API & Prompt Engineering |
| UI/UX | `frontend-specialist` | HUD Design & UX Psychology |
| Game Logic | `game-developer` | State Machine & Reward Logic |

## ✅ Phase X: Final Verification
- [ ] Test scenario: User navigates "The Skeptical Investor" successfully.
- [ ] Verification: Stats update correctly after each response.
- [ ] UX Audit: `scripts/ux_audit.py` passes for accessibility and feedback.
