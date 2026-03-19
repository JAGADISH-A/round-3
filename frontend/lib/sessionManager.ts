/**
 * Session Manager — Persistent localStorage-based session tracking for CareerSpark Voice Analyzer
 */

export interface InterviewSession {
  id: string;
  timestamp: number;
  question: string;
  transcript: string;
  readiness: number;
  professionalism: number;
  structure: number;
  content: string;
  wpm: number;
  fillers: number;
  feedback: string;
}

const STORAGE_KEY = "careerSparkSessions";
const MAX_SESSIONS = 20;

export function saveSession(session: Omit<InterviewSession, "id" | "timestamp">): InterviewSession {
  const newSession: InterviewSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    ...session,
  };

  const existing = getSessions();
  const updated = [newSession, ...existing].slice(0, MAX_SESSIONS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to save session:", e);
  }
  return newSession;
}

export function getSessions(): InterviewSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getRecentQuestions(count = 5): string[] {
  return getSessions().slice(0, count).map((s) => s.question);
}
