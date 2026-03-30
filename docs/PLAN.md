# PLAN: English Practice Arena Transformation

## Goal
Transform the legacy "Voice Lab" into a gamified, multi-mode "English Practice Arena" within the Hive OS dashboard.

## Orchestration Strategy
- **Project Planner**: Define the architecture and task breakdown.
- **Frontend Specialist**: Implement the HUD-style UI and mode management.
- **Backend Specialist**: Develop the AI-powered English services (Lessons, Quizzes, Evaluation).
- **Test Engineer**: Verify logic and data integrity.

## User Constraints
- **Preserve Existing Modules**: Do not modify or delete other dashboard features.
- **Selective Deletion**: Only the original "Voice Lab" code (`/voice`) may be replaced or modified.

## Proposed Architecture

### 1. English Practice Arena (Frontend)
- **Route**: `/arena` (Replacing or redirecting from `/voice`)
- **Modes**:
    - **Learn**: AI-generated interactive lessons on grammar, vocabulary, and usage.
    - **Test**: Dynamic quizzes (Jumbled Words, Missing Words, Buzzwords, Proverbs).
    - **Writing**: Practical drills for Email and Letter composition with real-time feedback.
    - **Speaking**: Integration of the existing voice analysis engine for pronunciation.

### 2. English Intelligence API (Backend)
- **Services**:
    - `EnglishService`: Wrapper for Gemini Pro to generate context-aware English content.
    - `LessonGenerator`: Logic for interactive learning paths.
    - `QuizEngine`: Logic for randomized, skill-specific quizzes.
    - `WritingEvaluator`: Semantic analysis of user-written content.

## Implementation Phases

### Phase 1: Foundation (Backend Services)
- Create `ai-service/intelligence-service/app/services/english_service.py`.
- Add endpoints to `main.py`.

### Phase 2: Core UI (Arena Hub)
- Create `frontend/app/(dashboard)/arena/page.tsx`.
- Implement mode-switcher and HUD layout.
- Update `Sidebar.tsx` and `translations.ts`.

### Phase 3: Mode Implementation
- Port voice analysis (Speaking mode).
- Implement Learn, Test, and Writing sections.

### Phase 4: Polish & Verification
- Add animations and "Neural Sync" visual feedback.
- Run security and linting checks.

## Task Breakdown
- [ ] Implement Backend `EnglishService`
- [ ] Implement `/api/english/lesson` endpoint
- [ ] Implement `/api/english/quiz` endpoint
- [ ] Implement `/api/english/writing` endpoint
- [ ] Build `/arena` Frontend Layout
- [ ] Build `LearnSection` component
- [ ] Build `TestSection` component
- [ ] Build `WritingSection` component
- [ ] Port `VoiceAnalysis` to `SpeakingSection`
- [ ] Update Navigation & Translations
- [ ] Run `checklist.py` and final verification

## Verification Plan
- **Automated**: `security_scan.py`, `lint_runner.py`.
- **Manual**: Test each mode for content accuracy and UI responsiveness.
