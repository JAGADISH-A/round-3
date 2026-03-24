import { useState, useCallback } from "react";

interface Improvement {
  type: string;
  description: string;
  impact: number;
}

interface TrackerState {
  initialScore: number;
  currentScore: number;
  improvements: Improvement[];
}

export function useImprovementTracker(startingScore: number = 0) {
  const [state, setState] = useState<TrackerState>({
    initialScore: startingScore,
    currentScore: startingScore,
    improvements: [],
  });

  const trackImprovement = useCallback(
    (type: string, description: string, delta: number) => {
      setState((prev) => ({
        ...prev,
        currentScore: Math.max(0, Math.min(100, prev.currentScore + delta)),
        improvements: [
          { type, description, impact: delta },
          ...prev.improvements,
        ],
      }));
    },
    []
  );

  const resetSession = useCallback((newStartingScore?: number) => {
    setState({
      initialScore: newStartingScore ?? 0,
      currentScore: newStartingScore ?? 0,
      improvements: [],
    });
  }, []);

  const totalImprovement = state.currentScore - state.initialScore;

  return { ...state, totalImprovement, trackImprovement, resetSession };
}
