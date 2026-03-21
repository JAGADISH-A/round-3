"use client";

/**
 * useSpeech.ts — Thin React adapter over the speechController singleton.
 *
 * No recognition logic lives here. This hook:
 *  - Registers UI callbacks with speechController on mount.
 *  - Surfaces isListening, transcript, interimTranscript, detectedLang as state.
 *  - Exposes stable start/stop/setTranscript methods.
 *  - Syncs the lang prop to speechController without re-initializing.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { speechController } from "@/lib/speechController";

type SpeechLang = "en" | "ta";

export function useSpeech(
  lang: SpeechLang,
  onSpeechDetected?: (confidence: number) => void
) {
  const [isListening, setIsListening]           = useState(false);
  const [transcript, setTranscript]             = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [detectedLang, setDetectedLang]          = useState<SpeechLang | null>(null);

  // Keep speechController lang in sync without effect teardown
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
    speechController.setLang(lang);
  }, [lang]);

  // Register callbacks on mount; unregister on unmount
  useEffect(() => {
    speechController.register({
      onFinal: (fullTranscript, confidence, detLang) => {
        setTranscript(fullTranscript);
        setDetectedLang(detLang as SpeechLang);
        // Notify parent so it can confidence-gate TTS interruption
        onSpeechDetected?.(confidence);
      },
      onInterim: (interim) => {
        setInterimTranscript(interim);
      },
      onState: (listening) => {
        setIsListening(listening);
      },
    });

    return () => {
      // Use unregister instead of destroy to prevent accidentally 
      // killing the mic Recognition session during component re-renders.
      speechController.unregister();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startListening = useCallback(() => {
    speechController.clearSession();
    setTranscript("");
    setInterimTranscript("");
    setDetectedLang(null);
    speechController.startListening();
  }, []);

  const stopListening = useCallback(() => {
    speechController.stopListening();
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    detectedLang,
    startListening,
    stopListening,
    setTranscript,
  };
}
