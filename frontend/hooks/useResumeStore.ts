import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ResumeAnalysis } from '../lib/api';

interface ResumeStoreState {
  // Core Data
  analysis: ResumeAnalysis | null;
  jdText: string;
  resumeText: string;
  targetRole: string;
  
  // Live Scoring State
  score: number;
  readiness: number;
  delta: number;
  isEditMode: boolean;
  isRescoring: boolean;
  
  // History for Undo
  history: string[];

  // Actions
  setAnalysis: (analysis: ResumeAnalysis | null, jd?: string) => void;
  setResumeText: (text: string) => void;
  setJdText: (text: string) => void;
  setTargetRole: (role: string) => void;
  setIsEditMode: (mode: boolean) => void;
  setIsRescoring: (mode: boolean) => void;
  updateLiveScore: (score: number, readiness: number, delta: number) => void;
  undo: () => void;
  reset: () => void;
}

export const useResumeStore = create<ResumeStoreState>()(
  persist(
    (set, get) => ({
      analysis: null,
      jdText: "",
      resumeText: "",
      targetRole: "Software Engineer",
      score: 0,
      readiness: 0,
      delta: 0,
      isEditMode: false,
      isRescoring: false,
      history: [],

      setAnalysis: (analysis, jd) => {
        const state = get();
        const newScore = analysis?.ats_score || 0;
        const newReadiness = analysis?.ats_score || 0; // Initial readiness tied to ATS

        set({
          analysis,
          jdText: jd !== undefined ? jd : state.jdText,
          resumeText: analysis?.full_text || state.resumeText,
          targetRole: analysis?.inferred_role || state.targetRole,
          score: newScore,
          readiness: newReadiness,
          delta: 0,
        });
      },

      setResumeText: (text) => {
        const state = get();
        if (text === state.resumeText) return;
        
        // Keep up to 20 history states
        const newHistory = [state.resumeText, ...state.history].slice(0, 20);
        set({ resumeText: text, history: newHistory });
      },

      setJdText: (jdText) => set({ jdText }),
      setTargetRole: (targetRole) => set({ targetRole }),
      setIsEditMode: (isEditMode) => set({ isEditMode }),
      setIsRescoring: (isRescoring) => set({ isRescoring }),

      updateLiveScore: (score, readiness, delta) => {
        set({ score, readiness, delta });
      },

      undo: () => {
        const state = get();
        if (state.history.length === 0) return;
        const [prev, ...rest] = state.history;
        set({ resumeText: prev, history: rest });
      },

      reset: () => set({
        analysis: null,
        jdText: "",
        resumeText: "",
        score: 0,
        readiness: 0,
        delta: 0,
        isEditMode: false,
        history: []
      }),
    }),
    {
      name: 'bumblebee-resume-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
