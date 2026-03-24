import { useState, useRef, useCallback } from "react";

interface ScoreFeedbackState {
  toastDelta: number | null;
  toastMessage: string;
  toastType: "positive" | "negative" | "neutral";
  isHighlighting: boolean;
  showFirstModal: boolean;
}

export function useScoreFeedback() {
  const [state, setState] = useState<ScoreFeedbackState>({
    toastDelta: null,
    toastMessage: "",
    toastType: "neutral",
    isHighlighting: false,
    showFirstModal: false,
  });

  const hasShownModal = useRef(false);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = useCallback((delta: number) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);

    let message: string;
    let type: "positive" | "negative" | "neutral";

    if (delta > 10) {
      message = `🔥 Strong improvement (+${delta})`;
      type = "positive";
    } else if (delta > 0) {
      message = `✅ Score increased (+${delta})`;
      type = "positive";
    } else if (delta === 0) {
      message = "⚠️ No score change";
      type = "neutral";
    } else {
      message = `❌ Score decreased (${delta})`;
      type = "negative";
    }

    setState((prev) => ({
      ...prev,
      toastDelta: delta,
      toastMessage: message,
      toastType: type,
    }));

    toastTimer.current = setTimeout(() => {
      setState((prev) => ({ ...prev, toastDelta: null, toastMessage: "" }));
    }, 2500);
  }, []);

  const triggerScrollToScore = useCallback(() => {
    scoreRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const triggerHighlight = useCallback(() => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current);

    setState((prev) => ({ ...prev, isHighlighting: true }));
    highlightTimer.current = setTimeout(() => {
      setState((prev) => ({ ...prev, isHighlighting: false }));
    }, 1800);
  }, []);

  const trackFirstImprovement = useCallback((delta: number) => {
    if (delta > 0 && !hasShownModal.current) {
      hasShownModal.current = true;
      setState((prev) => ({ ...prev, showFirstModal: true }));
    }
  }, []);

  const dismissModal = useCallback(() => {
    setState((prev) => ({ ...prev, showFirstModal: false }));
  }, []);

  const triggerAll = useCallback(
    (delta: number) => {
      triggerToast(delta);
      triggerScrollToScore();
      triggerHighlight();
      trackFirstImprovement(delta);
    },
    [triggerToast, triggerScrollToScore, triggerHighlight, trackFirstImprovement]
  );

  return {
    ...state,
    scoreRef,
    triggerToast,
    triggerScrollToScore,
    triggerHighlight,
    trackFirstImprovement,
    dismissModal,
    triggerAll,
  };
}
