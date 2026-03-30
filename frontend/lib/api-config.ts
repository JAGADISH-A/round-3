// API Configuration for CareerSpark AI
// Hybrid Architecture: Pointing to Java Gateway (Port 8080) for production-like flow
// AI Service (Python): Port 8000 (direct)

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"; 
export const VISION_BASE_URL = process.env.NEXT_PUBLIC_VISION_URL || "http://localhost:8002";

export const ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  VISION_HEALTH: `${VISION_BASE_URL}/health`,
  CHAT: `${API_BASE_URL}/chat`,
  MCP_CHAT: `${API_BASE_URL}/api/chat`,
  MODELS: `${API_BASE_URL}/api/models`,
  PERSONAS: `${API_BASE_URL}/api/personas`,
  VOICE_ANALYZE: `${API_BASE_URL}/voice/analyze`,
  RESUME_UPLOAD: `${API_BASE_URL}/api/resume/upload`,
  RESCORE: `${API_BASE_URL}/api/resume/rescore`,
  RESUME_ANALYZE_ROLE: `${API_BASE_URL}/api/resume/analyze-role`,
  INTELLIGENCE_AGGREGATE: `${API_BASE_URL}/intelligence/aggregate`,
  COLLECTIONS: `${API_BASE_URL}/collections`,
  CAREER_PREP: `${API_BASE_URL}/career-prep`,
  CAREER_ROADMAP: `${API_BASE_URL}/career-roadmap`,
  DEVELOPER_REPORT: `${API_BASE_URL}/developer-report`,
  VISION_ANALYZE: `${VISION_BASE_URL}/vision/analyze`,
  VISION_FEEDBACK: `${API_BASE_URL}/ai/vision-feedback`,
  COACH_SCENARIOS: `${API_BASE_URL}/api/coach/scenarios`,
  COACH_ANALYZE: `${API_BASE_URL}/api/coach/analyze`,
  ENGLISH_LESSON: `${API_BASE_URL}/api/english/lesson`,
  ENGLISH_QUIZ: `${API_BASE_URL}/api/english/quiz`,
  ENGLISH_WRITING_PROMPT: `${API_BASE_URL}/api/english/writing-prompt`,
  ENGLISH_EVALUATE: `${API_BASE_URL}/api/english/evaluate-writing`,
  ENGLISH_SCAFFOLD: `${API_BASE_URL}/api/english/scaffold`,
};
