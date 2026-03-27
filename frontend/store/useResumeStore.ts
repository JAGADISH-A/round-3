import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ResumeAnalysis, ResumeStatus } from '../types/resume';

export interface BulletImpact {
  delta: number;
  newScore: number;
  newlyMatched: string[];
  breakdown: { reason: string; points: number }[];
  noImpact: boolean;
}

export interface ImprovementEntry {
  id: number;
  delta: number;
  description: string;
  timestamp: number;
  score: number;
}

export interface TextSegment {
  text: string;
  score: number;
  label: 'weak' | 'moderate' | 'strong';
}

interface ResumeStoreState {
  // Data
  analysis: ResumeAnalysis | null;
  status: ResumeStatus;
  jdText: string;
  isEditMode: boolean;
  isRescoring: boolean;
  isReanalyzing: boolean; // Moved from hook
  lastImpact: BulletImpact | null; // Moved from hook
  
  // Live Editor State
  resumeText: string;
  score: number;
  delta: number;
  readiness: number;
  textSegments: TextSegment[];
  
  // Session Progress
  initialScore: number;
  bestScore: number;
  totalDelta: number;
  improvementCount: number;
  improvements: ImprovementEntry[]; 
  lastImprovement: {
    before: number;
    after: number;
    delta: number;
    keywordsAdded?: string[];
  } | null;
  debugInfo: {
    length: number;
    parserUsed: string;
    keywordsDetected: number;
    semanticScore: number;
  } | null;
  initialReadiness: number;
  
  // Undo Stack
  history: string[];

  // Actions
  setAnalysis: (analysis: ResumeAnalysis | null, jdText?: string) => void;
  setStatus: (status: ResumeStatus) => void;
  setResumeText: (value: string | ((prev: string) => string)) => void;
  setLiveScore: (score: number, delta: number, readiness: number, segments: TextSegment[]) => void;
  setIsEditMode: (isEditMode: boolean) => void;
  setIsRescoring: (isRescoring: boolean) => void;
  setIsReanalyzing: (isReanalyzing: boolean) => void;
  setLastImpact: (impact: BulletImpact | null) => void;
  
  // Improvement Tracking
  addImprovement: (desc: string, scoreImpact: number) => void;
  applyQuickFix: (suggested: string, original?: string, section?: string) => void;
  setLastImprovement: (data: ResumeStoreState['lastImprovement']) => void;
  
  // History Control
  undo: () => void;
  
  // Globals
  resetStore: () => void;
  updateResumeSection: (oldText: string, newText: string) => void;
  setHydrated: () => void;
  _hasHydrated: boolean;
}

export const useResumeStore = create<ResumeStoreState>()(
  persist(
    (set, get) => ({
      analysis: null,
      status: 'IDLE',
      jdText: "",
      isEditMode: false,
      isRescoring: false,
      isReanalyzing: false,
      lastImpact: null,
      
      resumeText: "",
      score: 0,
      delta: 0,
      readiness: 0,
      textSegments: [],
      
      initialScore: 0,
      bestScore: 0,
      totalDelta: 0,
      improvementCount: 0,
      improvements: [],
      lastImprovement: null,
      debugInfo: null,
      initialReadiness: 0,
      
      history: [],

      _hasHydrated: false,
      setHydrated: () => set({ _hasHydrated: true }),

      setAnalysis: (analysis, jdText = "") => {
        const state = get();
        const jdScore = analysis?.jd_match?.score || analysis?.jd_match?.jd_match_score || 0;
        const readiness = analysis?.readiness_score || 0;
                          
        const newDebugInfo = analysis?.debug ? {
          length: analysis.debug.length || 0,
          parserUsed: analysis.debug.parser_used || "unknown",
          keywordsDetected: analysis.debug.keywords_detected || 0,
          semanticScore: analysis.semantic_score || 0
        } : null;

        set({
          analysis,
          status: analysis ? 'ANALYZED' : 'IDLE',
          jdText: jdText || state.jdText,
          isEditMode: false, // Reset edit mode on new analysis
          isRescoring: false,
          isReanalyzing: false,
          resumeText: state.resumeText || analysis?.full_text || "",
          score: jdScore,
          delta: 0,
          readiness,
          textSegments: [],
          initialScore: state.initialScore || jdScore,
          bestScore: Math.max(state.bestScore, jdScore),
          debugInfo: newDebugInfo,
          initialReadiness: state.initialReadiness || readiness,
        });
      },

      setStatus: (status) => set({ status }),
      setIsReanalyzing: (isReanalyzing) => set({ isReanalyzing }),
      setLastImpact: (lastImpact) => set({ lastImpact }),

      setResumeText: (value) => {
        const state = get();
        const currentText = state.resumeText;
        const text = typeof value === 'function' ? value(currentText) : value;
        
        if (text === currentText) return;
        
        // FIX 2: Relaxed safety check to avoid blocking valid updates
        if (currentText && text.length < 5 && currentText.length > 1000) {
          console.warn("REJECTED: setResumeText (potential partial overwrite). New length:", text.length, "Existing:", currentText.length);
          return;
        }

        // FIX 4: Add success log
        console.log("ACCEPTED: setResumeText. New Length:", text.length);

        // Update history before setting new text
        const newHistory = [currentText, ...state.history].slice(0, 30);
        
        set({ 
          resumeText: text,
          history: newHistory
        });
      },

      setLiveScore: (score, delta, readiness, segments) => {
        const state = get();
        
        // Deeply patch the analysis object so the dashboard UI components
        // (which read from analysis.jd_match and analysis.readiness_score) reflect the live score.
        let newAnalysis = state.analysis;
        if (newAnalysis) {
          const updatedReadiness = readiness || Math.min(100, Math.round(score * 0.9));
          const updatedLabel = updatedReadiness >= 86 ? "Strong Candidate" : 
                               updatedReadiness >= 66 ? "Interview Ready" : 
                               updatedReadiness >= 41 ? "Improving" : "Beginner";
                               
          newAnalysis = {
            ...newAnalysis,
            readiness_score: updatedReadiness,
            industry_readiness: updatedLabel,
            jd_match: newAnalysis.jd_match ? {
              ...newAnalysis.jd_match,
              score: score,
              jd_match_score: score,
              match_label: score >= 60 ? "Strong Match" : score >= 30 ? "Partial Match" : "Weak Match" // Simple mapping
            } : null
          };
        }

        set({
          score,
          delta,
          readiness: readiness || Math.min(100, Math.round(score * 0.9)),
          textSegments: segments,
          bestScore: Math.max(state.bestScore, score),
          analysis: newAnalysis
        });
      },

      addImprovement: (desc, scoreImpact) => {
        const state = get();
        const entry: ImprovementEntry = {
          id: Date.now(),
          delta: scoreImpact,
          description: desc,
          timestamp: Date.now(),
          score: state.score,
        };

        set({
          improvements: [entry, ...state.improvements].slice(0, 20),
          totalDelta: state.totalDelta + scoreImpact,
          improvementCount: scoreImpact > 0 ? state.improvementCount + 1 : state.improvementCount,
          bestScore: Math.max(state.bestScore, state.score),
        });
      },

      setLastImprovement: (data) => set({ lastImprovement: data }),

      applyQuickFix: (suggested, original, section) => {
        const state = get();
        const oldText = state.resumeText;
        let updatedText = oldText;

        if (original && oldText.includes(original)) {
          // Precise replacement
          updatedText = oldText.replace(original, suggested);
        } else if (oldText.trim()) {
          // Append if not found but text exists
          updatedText = `${oldText.trim()}\n- ${suggested}`;
        } else {
          // Initialize if empty
          updatedText = `- ${suggested}`;
        }
        
        set({
          resumeText: updatedText,
          history: [oldText, ...state.history].slice(0, 30),
          delta: 5, // Symbolic improvement impact
          improvementCount: state.improvementCount + 1,
        });
      },

      undo: () => {
        const state = get();
        if (state.history.length === 0) return;
        const [prev, ...rest] = state.history;
        set({
          history: rest,
          resumeText: prev
        });
      },

      setIsEditMode: (isEditMode) => set({ isEditMode }),
      setIsRescoring: (isRescoring) => set({ isRescoring }),

      updateResumeSection: (oldText, newText) => {
        const state = get();
        const current = state.resumeText;
        let updated = current;
        
        console.log("DEBUG: updateResumeSection called.", { 
          hasCurrent: !!current, 
          currentLength: current.length,
          oldTextDetected: current.includes(oldText),
          oldTextPreview: oldText.slice(0, 30) + "..."
        });

        if (oldText && current.includes(oldText)) {
          // Precise replacement
          updated = current.replace(oldText, newText);
          console.log("DEBUG: updateResumeSection -> REPLACED");
        } else {
          // Fallback: append instead of replacing entire resume
          updated = current.trim() + "\n• " + newText;
          console.log("DEBUG: updateResumeSection -> APPENDED");
        }

        get().setResumeText(updated);
      },

      resetStore: () => {
        set({
          status: 'IDLE',
          analysis: null,
          jdText: "",
          isEditMode: false,
          isRescoring: false,
          resumeText: "",
          score: 0,
          delta: 0,
          readiness: 0,
          textSegments: [],
          initialScore: 0,
          bestScore: 0,
          totalDelta: 0,
          improvementCount: 0,
          improvements: [],
          lastImprovement: null,
          debugInfo: null,
          initialReadiness: 0,
          history: [],
        });
      },
    }),
    {
      name: 'resume-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.setHydrated();
        
        // FORCE CLEANUP: Reset transient flags regardless of what's in storage
        state.setIsEditMode(false);
        state.setIsRescoring(false);
        state.setIsReanalyzing(false);

        // Recovery: if analysis exists but status is IDLE, mark as ANALYZED
        // Status is excluded from persist, so it always starts as IDLE.
        if (state.analysis && state.status === 'IDLE') {
          state.setStatus('ANALYZED');
        }
      },
      partialize: (state) => {
        const { 
          _hasHydrated, 
          isEditMode, 
          isRescoring, 
          isReanalyzing, 
          status,
          ...rest 
        } = state; 
        return rest;
      },
    }
  )
);
