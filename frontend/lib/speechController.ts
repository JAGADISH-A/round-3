/**
 * speechController.ts — Production-grade speech recognition controller.
 *
 * Responsibilities:
 *  - Owns the single SpeechRecognition instance (never recreated).
 *  - Enforces userIntent flag: transcript is only valid when intent=true.
 *  - Integrates with ttsController's audio state: blocks start if speaking.
 *  - Exposes stable register/unregister pattern for React hooks.
 *  - Logs all lifecycle events for debugging.
 */

import { ttsController, AudioState } from "./ttsController";
import { detectLanguage } from "./utils";

type SpeechLang = "en" | "ta";
type FinalResultCallback = (transcript: string, confidence: number, detectedLang: SpeechLang) => void;
type InterimCallback    = (interim: string) => void;
type StateCallback      = (isListening: boolean) => void;

class SpeechController {
  private recognition: any = null;
  private isListeningRef = false;   // User intent
  private isStartingRef  = false;   // Guard against double-start

  private lang: SpeechLang = "en";
  private sessionTranscript = "";

  /** Callbacks registered by the React hook */
  private onFinal:  FinalResultCallback | null = null;
  private onInterim: InterimCallback | null = null;
  private onState:   StateCallback | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this._init();
    }
  }

  private _init() {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[SpeechCtrl] SpeechRecognition not available.");
      return;
    }

    const r = new SpeechRecognition();
    r.continuous      = true;
    r.interimResults  = true;
    r.maxAlternatives = 1;
    r.lang            = "en-IN";

    r.onstart = () => {
      this.isStartingRef = false;
      this.onState?.(true);
      console.debug("[SpeechCtrl] Recognition started.");
    };

    r.onspeechstart = () => {
      console.debug("[SpeechCtrl] Speech sound detected.");
    };

    r.onend = () => {
      this.isStartingRef = false;
      console.debug("[SpeechCtrl] Recognition ended.");

      if (this.isListeningRef) {
        // Auto-restart after a small delay — but only if NOT speaking
        setTimeout(() => {
          if (!this.isListeningRef || this.isStartingRef) return;
          if (ttsController.getAudioState() !== "idle") {
            console.debug("[SpeechCtrl] Restart deferred — TTS speaking.");
            return;
          }
          r.lang = this._langCode();
          this.isStartingRef = true;
          try { r.start(); } catch (e) { this.isStartingRef = false; }
        }, 200);
      } else {
        this.onState?.(false);
      }
    };

    r.onerror = (event: any) => {
      this.isStartingRef = false;
      const { error } = event;
      console.debug("[SpeechCtrl] Error:", error);

      if (error === "not-allowed" || error === "service-not-allowed") {
        this.isListeningRef = false;
        this.onState?.(false);
        return;
      }
      // no-speech / audio-capture → non-fatal, onend will restart
    };

    r.onresult = (event: any) => {
      // CRITICAL GATE: Ignore results if user hasn't started listening
      // OR if TTS is speaking (echo protection)
      if (!this.isListeningRef) {
        console.debug("[SpeechCtrl] Result discarded (userIntent=false).");
        return;
      }
      if (ttsController.getAudioState() !== "idle") {
        console.debug("[SpeechCtrl] Result discarded (TTS speaking).");
        return;
      }

      let finalChunk = "";
      let maxConfidence = 0;

      // Only iterate from current result index
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        // ONLY PROCESS FINAL RESULTS (Per User Request)
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript;
          maxConfidence = Math.max(maxConfidence, event.results[i][0].confidence ?? 1);
        } else {
          // Provide interim feedback to UI but don't commit it to session
          const interimText = event.results[i][0].transcript;
          this.onInterim?.(interimText);
        }
      }

      if (finalChunk.trim()) {
        // Append to session - but only if it's new
        this.sessionTranscript = finalChunk.trim();
        
        const detectedLang = detectLanguage(this.sessionTranscript);

        // Dynamically switch recognition language in-place
        const target = detectedLang === "ta" ? "ta-IN" : "en-IN";
        if (r.lang !== target) {
          r.lang = target;
          console.debug("[SpeechCtrl] Language switched to", target);
        }

        // Notify UI of the final, complete message
        this.onFinal?.(this.sessionTranscript, maxConfidence, detectedLang);
        
        // CRITICAL: Clear session transcript immediately after emitting final result
        // This prevents "resending previous messages on pause" because if it 
        // stops and restarts, sessionTranscript starts fresh.
        this.sessionTranscript = "";
        this.onInterim?.(""); // Clear interim
      }
    };

    this.recognition = r;

    // Provide mic pause/resume to ttsController
    ttsController.registerMicControls(
      () => { // pauseMic
        if (!this.isListeningRef) return;
        try { r.stop(); } catch (_) {}
        console.debug("[SpeechCtrl] Mic paused by TTS.");
      },
      () => { // resumeMic
        if (!this.isListeningRef || this.isStartingRef) return;
        r.lang = this._langCode();
        this.isStartingRef = true;
        try { r.start(); } catch (_) { this.isStartingRef = false; }
        console.debug("[SpeechCtrl] Mic resumed after TTS.");
      }
    );
  }

  private _langCode(): string {
    return this.lang === "ta" ? "ta-IN" : "en-IN";
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /** React hook registers callbacks on mount */
  register(callbacks: {
    onFinal: FinalResultCallback;
    onInterim: InterimCallback;
    onState: StateCallback;
  }) {
    this.onFinal   = callbacks.onFinal;
    this.onInterim = callbacks.onInterim;
    this.onState   = callbacks.onState;
  }

  unregister() {
    this.onFinal   = null;
    this.onInterim = null;
    this.onState   = null;
    ttsController.unregisterMicControls();
  }

  setLang(lang: SpeechLang) {
    this.lang = lang;
  }

  startListening(): void {
    if (!this.recognition) return;
    if (this.isListeningRef || this.isStartingRef) return;

    // Block start while TTS is playing
    if (ttsController.getAudioState() !== "idle") {
      console.debug("[SpeechCtrl] Start blocked — TTS speaking.");
      return;
    }

    this.sessionTranscript = "";
    this.isListeningRef    = true;
    this.isStartingRef     = true;
    this.recognition.lang  = this._langCode();

    try {
      this.recognition.start();
      console.debug("[SpeechCtrl] Listening started.");
    } catch (err: any) {
      this.isStartingRef = false;
      if (err.name !== "InvalidStateError") {
        console.error("[SpeechCtrl] start() failed:", err);
        this.isListeningRef = false;
      }
    }
  }

  stopListening(): void {
    this.isListeningRef = false;
    this.isStartingRef  = false;
    this.sessionTranscript = "";

    try { this.recognition?.stop(); } catch (_) {}
    this.onState?.(false);
    this.onInterim?.("");
    console.debug("[SpeechCtrl] Listening stopped by user.");
  }

  clearSession() {
    this.sessionTranscript = "";
  }

  destroy() {
    this.isListeningRef = false;
    try { this.recognition?.abort(); } catch (_) {}
    this.unregister();
  }
}

// Module-level singleton
export const speechController = new SpeechController();
