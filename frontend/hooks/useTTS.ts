"use client";

/**
 * useTTS.ts — Thin React adapter over the ttsController singleton.
 */

import { useState, useCallback, useEffect } from "react";
import { ttsController } from "@/lib/ttsController";

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Subscribe to TTS state changes for React UI
  useEffect(() => {
    const unsub = ttsController.subscribe((state) => {
      setIsSpeaking(state === "speaking");
    });
    return unsub;
  }, []);

  const speak = useCallback(async (text: string, lang: "en" | "ta") => {
    await ttsController.speak(text, lang);
  }, []);

  const stop = useCallback(() => {
    ttsController.stop();
  }, []);

  const interruptIfSpeaking = useCallback((confidence: number = 1) => {
    ttsController.interruptIfSpeaking(confidence);
  }, []);

  return { speak, stop, interruptIfSpeaking, isSpeaking };
}
