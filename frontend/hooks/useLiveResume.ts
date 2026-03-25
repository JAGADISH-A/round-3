import { useState, useEffect, useRef, useCallback } from 'react';
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

export function useLiveResume(initialText: string, initialScore: number, jdText: string) {
  const [state, setState] = useState<LiveResumeState>({
    resumeText: initialText,
    score: initialScore,
    delta: 0,
    readiness: 0,
    textSegments: [],
    isAnalyzing: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  const updateResume = useCallback((text: string) => {
    setState((prev) => ({ ...prev, resumeText: text, isAnalyzing: true }));
  }, []);

  useEffect(() => {
    // If text is empty, reset
    if (!state.resumeText.trim()) {
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
        const response = await fetch('http://localhost:8001/resume/rescore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            updated_resume_text: state.resumeText,
            jd_text: jdText,
            previous_score: initialScore,
            role: "Software Engineer", // Can be dynamic if needed
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
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Ignore aborted requests
          return;
        }
        console.error('Live Rescore Error:', err);
        setState((prev) => ({ ...prev, isAnalyzing: false }));
      }
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [state.resumeText, jdText, initialScore]);

  return {
    ...state,
    updateResume,
  };
}
