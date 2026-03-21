/**
 * ttsController.ts — Production-grade TTS singleton with audio state machine.
 *
 * Root causes of English cut-off (Tamil is shorter so doesn't trigger these):
 *
 * BUG 1 — Chrome speechSynthesis 15s silent kill:
 *   Chrome's built-in WebSpeech engine silently stops utterances over ~15s.
 *   Fix: keepalive timer (pause+resume every 10s) while speaking.
 *
 * BUG 2 — audio.onended assignment race:
 *   In Chrome, assigning `audio.onended = fn` AFTER `audio.play()` can miss the
 *   event if the audio loads and ends very quickly (rare for English blobs but
 *   happens). Fix: use `addEventListener('ended', ...)` BEFORE `.play()`.
 *
 * BUG 3 — HTMLAudioElement 'ended' not firing for certain MP3 durations:
 *   Chrome sometimes silently drops the `ended` event for MP3s over ~30s or
 *   certain bitrate combinations. Fix: `ontimeupdate` safety net resolves the
 *   promise when `currentTime >= duration - 0.15`.
 *
 * BUG 4 — Mic resuming before last chunk completes:
 *   Any early mic resume can trigger recognition during playback of the last
 *   chunk. Fix: scheduleMicResume only fires AFTER _hardStop sets state=idle.
 *
 * Audio State Machine:
 *   idle ──→ speaking ──→ idle
 *                │
 *                └─[interrupted/stop]──→ idle
 */

const TTS_BASE_URL =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001")
    : "http://localhost:8001";

// ── Types ──────────────────────────────────────────────────────────────────────
export type AudioState = "idle" | "speaking";
type StateListener = (state: AudioState) => void;

// ── Constants ──────────────────────────────────────────────────────────────────
const MAX_CHUNK_CHARS       = 200;  // Sweet spot: enough for natural phrasing
const ECHO_GUARD_MS         = 500;  // Wait after final chunk before mic resumes
const INTERRUPT_DEBOUNCE_MS = 300;
const CONFIDENCE_THRESHOLD  = 0.70;
const KEEPALIVE_INTERVAL_MS = 10_000; // Chrome speechSynthesis 15s bug workaround

// ── Chunk splitter ─────────────────────────────────────────────────────────────
// (Removed as per user request to send single complete text)

// ── TTSController ──────────────────────────────────────────────────────────────
class TTSController {
  private audioState: AudioState = "idle";
  private listeners: Set<StateListener> = new Set();

  private audio: HTMLAudioElement | null = null;
  private abortCtrl: AbortController | null = null;

  /**
   * sequenceId increments on every new speak() and every stop().
   * In-flight chunk loops abort when they detect a mismatch.
   */
  private sequenceId = 0;

  private interruptTimer: ReturnType<typeof setTimeout> | null = null;

  private _pauseMic:  (() => void) | null = null;
  private _resumeMic: (() => void) | null = null;

  // ── State machine ────────────────────────────────────────────────────────────

  private transition(next: AudioState, reason: string) {
    if (this.audioState === next) return;
    console.debug(`[AudioState] ${this.audioState} → ${next} (${reason})`);
    this.audioState = next;
    this.listeners.forEach(fn => fn(next));
  }

  getAudioState(): AudioState { return this.audioState; }
  isSpeaking(): boolean { return this.audioState === "speaking"; }

  subscribe(fn: StateListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ── Mic controls ─────────────────────────────────────────────────────────────

  registerMicControls(pause: () => void, resume: () => void) {
    this._pauseMic  = pause;
    this._resumeMic = resume;
    console.debug("[TTS] Mic controls registered.");
  }

  unregisterMicControls() {
    this._pauseMic  = null;
    this._resumeMic = null;
  }

  private doPauseMic() {
    try { this._pauseMic?.(); } catch (_) {}
    console.debug("[TTS] Mic paused.");
  }

  private scheduleResumeMic() {
    setTimeout(() => {
      if (this.audioState !== "idle") {
        console.debug("[TTS] Mic resume skipped — still speaking.");
        return;
      }
      try { this._resumeMic?.(); } catch (_) {}
      console.debug("[TTS] Mic resumed.");
    }, ECHO_GUARD_MS);
  }

  // ── Stop / Interrupt ─────────────────────────────────────────────────────────

  stop() {
    if (this.interruptTimer) {
      clearTimeout(this.interruptTimer);
      this.interruptTimer = null;
    }
    this.sequenceId++;          // Invalidates ALL in-flight chunk loops
    this.hardStop("stop()");
  }

  private hardStop(reason: string) {
    this.abortCtrl?.abort();
    this.abortCtrl = null;

    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = "";
      this.audio = null;
    }

    // Cancel browser fallback TTS
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }

    this.transition("idle", reason);
  }

  interruptIfSpeaking(confidence: number = 1) {
    if (!this.isSpeaking()) return;

    if (confidence < CONFIDENCE_THRESHOLD) {
      console.debug(`[TTS] Interrupt suppressed (conf=${confidence.toFixed(2)} < ${CONFIDENCE_THRESHOLD})`);
      return;
    }

    if (this.interruptTimer) clearTimeout(this.interruptTimer);
    this.interruptTimer = setTimeout(() => {
      this.interruptTimer = null;
      console.debug(`[TTS] Interrupted (conf=${confidence.toFixed(2)})`);
      this.stop();
    }, INTERRUPT_DEBOUNCE_MS);
  }

  // ── Primary speak entry point ─────────────────────────────────────────────────

  async speak(text: string, lang: "en" | "ta"): Promise<void> {
    if (!text.trim()) return;

    this.stop(); // Cancel any current audio and increment sequenceId

    const mySeq = this.sequenceId;
    this.doPauseMic();
    this.transition("speaking", "speak()");

    console.debug(`[TTS] Single complete text, lang=${lang}: "${text.slice(0, 60)}..."`);
    
    // Process the entire text as a single request (no chunking)
    const ok = await this.playFullAudio(text, lang, mySeq);

    if (this.sequenceId === mySeq) {
      if (ok) {
        console.debug("[TTS] Playback complete.");
      } else {
        console.debug("[TTS] Playback failed or aborted.");
      }
      this.hardStop("audio done");
      this.scheduleResumeMic();
    }
  }

  // ── Playback via backend edge-tts (Full Audio) ───────────────────────────────

  private async playFullAudio(
    text: string,
    lang: "en" | "ta",
    seqId: number
  ): Promise<boolean> {
    this.abortCtrl = new AbortController();

    try {
      const res = await fetch(`${TTS_BASE_URL}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
        signal: this.abortCtrl.signal,
      });

      if (!res.ok) throw new Error(`TTS API ${res.status}`);

      const blob = await res.blob();

      if (this.sequenceId !== seqId) return false; // Aborted while fetching

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.audio = audio;

      return await new Promise<boolean>(resolve => {
        let resolved = false;
        let watchdogTimer: ReturnType<typeof setInterval> | null = null;
        let lastTime = 0;
        let stallCount = 0;

        const done = (result: boolean) => {
          if (resolved) return;
          resolved = true;
          if (watchdogTimer) clearInterval(watchdogTimer);
          URL.revokeObjectURL(url);
          this.audio = null;
          resolve(result && this.sequenceId === seqId);
        };

        // Watchdog: Ensure audio is actually playing and hasn't stalled
        watchdogTimer = setInterval(() => {
          if (resolved) return;
          
          if (!audio.paused && !audio.ended) {
            if (audio.currentTime === lastTime && audio.currentTime > 0) {
              stallCount++;
              if (stallCount > 4) { // ~2 seconds of stall
                console.warn("[TTS] Watchdog detected stall, attempting resume...");
                audio.play().catch(() => {});
                stallCount = 0;
              }
            } else {
              stallCount = 0;
              lastTime = audio.currentTime;
            }
          }
        }, 500);

        audio.addEventListener("ended", () => {
          console.debug("[TTS] Audio ended naturally.");
          done(true);
        }, { once: true });

        audio.addEventListener("error", (e) => {
          console.error("[TTS] Audio error:", (e as any)?.error ?? e);
          done(false);
        }, { once: true });

        // Safety net — resolve if playback reaches near the end
        audio.addEventListener("timeupdate", () => {
          if (!resolved && audio.duration > 0 && audio.currentTime >= audio.duration - 0.15) {
            console.debug("[TTS] Safety net fired (near end of audio).");
            done(true);
          }
        });

        if (this.sequenceId !== seqId) {
          audio.src = "";
          URL.revokeObjectURL(url);
          resolve(false);
          return;
        }

        audio.play().catch((err) => {
          console.error("[TTS] play() failed:", err);
          done(false);
        });
      });
    } catch (err: any) {
      if (err.name === "AbortError") return false;

      console.warn("[TTS] Backend unavailable — falling back to speechSynthesis:", err.message);
      return this.fallbackChunk(text, lang, seqId); // Fallback still uses "fallbackChunk" which is fine for single text
    }
  }

  // ── Browser speechSynthesis fallback ─────────────────────────────────────────
  // BUG FIX 1: Chrome 15s kill + proper sequential chaining

  private fallbackChunk(
    text: string,
    lang: "en" | "ta",
    seqId: number
  ): Promise<boolean> {
    return new Promise(resolve => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve(false);
        return;
      }
      if (this.sequenceId !== seqId) { resolve(false); return; }

      // Cancel any previous speech BEFORE starting new chunk
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      // English: use en-US for maximum browser voice support
      utterance.lang  = lang === "ta" ? "ta-IN" : "en-US";
      utterance.rate  = 0.90;
      utterance.pitch = 1.0;

      // Select the best matching voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        utterance.lang === "ta-IN"
          ? v.lang.includes("ta")
          : v.lang.startsWith("en") && !v.name.includes("Google")  // Google voices cut off
      ) || voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2))) || null;
      utterance.voice = preferred;

      console.debug(`[TTS] Fallback utterance: lang=${utterance.lang} voice=${utterance.voice?.name ?? "default"}`);

      let keepAlive: ReturnType<typeof setInterval> | null = null;
      let resolved = false;

      const finish = (ok: boolean) => {
        if (resolved) return;
        resolved = true;
        if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
        resolve(ok && this.sequenceId === seqId);
      };

      utterance.onstart = () => {
        console.debug(`[TTS] SpeechSynthesis started: "${text.slice(0, 40)}"`);
        // BUG FIX 1: Keep Chrome from killing long utterances (pause/resume every 10s)
        keepAlive = setInterval(() => {
          if (!resolved && window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
            console.debug("[TTS] speechSynthesis keepalive ping.");
          }
        }, KEEPALIVE_INTERVAL_MS);
      };

      utterance.onend   = () => { console.debug("[TTS] SpeechSynthesis onend."); finish(true); };
      utterance.onerror = (e) => { console.error("[TTS] SpeechSynthesis error:", e.error); finish(false); };

      window.speechSynthesis.speak(utterance);

      // Safety net: if speechSynthesis.speaking is false after 1s (race), resolve
      setTimeout(() => {
        if (!resolved && !window.speechSynthesis.speaking) {
          console.debug("[TTS] Safety net: speechSynthesis not speaking after 1s.");
          finish(false);
        }
      }, 1000);
    });
  }
}

// Module-level singleton
export const ttsController = new TTSController();
