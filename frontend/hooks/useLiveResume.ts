import { useState, useEffect, useRef, useCallback } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { ENDPOINTS } from '../lib/api-config';
import { ResumeAnalysis } from './useResumeAnalysis';

export interface TextSegment {
  text: string;
  score: number;
  label: 'weak' | 'moderate' | 'strong';
}

export interface LiveResumeState {
  resumeText: string;
  score: number;
  delta: number;
  readiness: number;
  textSegments: TextSegment[];
  isAnalyzing: boolean;
}

export function useLiveResume(jdText: string, initialScore: number) {
  const resumeText = useResumeStore((state) => state.resumeText);
  const analysis = useResumeStore((state) => state.analysis);
  
  const [state, setState] = useState<Omit<LiveResumeState, 'resumeText'>>({
    score: initialScore,
    delta: 0,
    readiness: 0,
    textSegments: [],
    isAnalyzing: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    // If text is empty, reset
    if (!resumeText.trim()) {
      setState(prev => ({
        ...prev,
        score: 0,
        delta: 0,
        readiness: 0,
        textSegments: [],
        isAnalyzing: false
      }));
      return;
    }

    const debounceTimer = setTimeout(async () => {
      const currentRequestId = ++requestIdRef.current;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(ENDPOINTS.RESCORE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            updated_resume_text: resumeText,
            jd_text: jdText,
            previous_score: initialScore,
            role: analysis?.confirmed_role || "Software Engineer",
            skills_count: analysis?.skills?.length || 0,
            sections_present: analysis?.sections || [],
          }),
        });

        if (!response.ok) throw new Error('Failed to rescore');
        
        const data = await response.json();

        // Only update if it's the latest request
        if (currentRequestId === requestIdRef.current) {
          setState((prev) => ({
            ...prev,
            score: data.new_score,
            delta: data.score_delta,
            readiness: data.resume_readiness,
            textSegments: data.text_segments || [],
            isAnalyzing: false,
          }));
          
          // Sync with global store so Dashboard and Chat receive updates
          useResumeStore.getState().setLiveScore(
            data.new_score,
            data.score_delta,
            data.resume_readiness,
            data.text_segments || []
          );
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Live Rescore Error:', err);
        setState((prev) => ({ ...prev, isAnalyzing: false }));
      }
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [resumeText, jdText, initialScore]);

  return {
    ...state,
  };
}
