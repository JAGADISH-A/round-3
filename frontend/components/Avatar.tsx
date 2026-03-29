/**
 * Avatar.tsx — Premium AI Coach Avatar
 *
 * Features:
 * - Per-state animated glow auras (idle/listening/thinking/speaking)
 * - Speaking ripple ring animation
 * - Rive state machine with `state`, `breathe`, and `blink` inputs
 * - React blink fallback scheduler
 * - Dark mode compatible, TypeScript strict
 */
"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import "./avatar.css";

// ─── Types ────────────────────────────────────────────────────────
export type AvatarState = "idle" | "listening" | "speaking" | "thinking";
export type AvatarSize  = "sm" | "md" | "lg" | "xl";

export interface AvatarRef {
  setAvatarState: (state: AvatarState) => void;
}

// ─── Config ───────────────────────────────────────────────────────

// Rive state machine numeric values
const STATE_NUMBERS: Record<AvatarState, number> = {
  idle:      0,
  listening: 1,
  speaking:  2,
  thinking:  3,
};

// Community Rive fallback: timeline animation names per file per state
const TIMELINE_MAP: Record<string, Record<AvatarState, string>> = {
  "/mascot.riv":  { idle: "idle", listening: "emotion 1", thinking: "emotion 2", speaking: "demo lipsync" },
  "/rabbit.riv":  { idle: "Idle Loop",  listening: "Kedip",      thinking: "Pose 1 loop", speaking: "01 Wave 1"      },
  "/face.riv":    { idle: "strength0",  listening: "BlushOn",    thinking: "GlassesOff",  speaking: "GlassesOffOn"   },
  "/curious.riv": { idle: "Idle",       listening: "Big_Smile_Forward", thinking: "Look_up", speaking: "Timeline 1" },
};

// Responsive size Tailwind classes  
const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm:  "w-40  h-40",
  md:  "w-64  h-64",
  lg:  "w-96  h-96",
  xl:  "w-96  h-96  lg:w-[420px] lg:h-[420px]",
};

// Blink delays: random between min and max ms
const BLINK_MIN_MS = 2800;
const BLINK_MAX_MS = 5200;

// ─── Props ────────────────────────────────────────────────────────
interface AvatarProps {
  src: string;
  state?: AvatarState;
  size?: AvatarSize;
}

// ─── Component ────────────────────────────────────────────────────
const Avatar = forwardRef<AvatarRef, AvatarProps>(
  ({ src, state = "idle", size = "lg" }, ref) => {

    const { RiveComponent, rive } = useRive({
      src,
      stateMachines: "InterviewSM",
      autoplay: true,
    });

    const stateInput   = useStateMachineInput(rive, "InterviewSM", "state");
    const breatheInput = useStateMachineInput(rive, "InterviewSM", "breathe");
    const blinkInput   = useStateMachineInput(rive, "InterviewSM", "blink");

    const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);
    const pendingStateRef = useRef<AvatarState>("idle");
    // Looping interval for speaking animation (community files are one-shot)
    const speakLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Clear any active speaking loop
    const clearSpeakLoop = useCallback(() => {
      if (speakLoopRef.current) {
        clearInterval(speakLoopRef.current);
        speakLoopRef.current = null;
      }
    }, []);

    // Community file fallback: rAF-debounced stop/play
    // For speaking state, auto-loops the animation every 2.5s
    const playTimeline = useCallback((s: AvatarState) => {
      if (!rive) return;
      const map = TIMELINE_MAP[src];
      if (!map) return;
      const target = map[s];
      if (!target) return;

      // Always clear speaking loop when switching states
      clearSpeakLoop();

      // Cancel any pending rAF
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pendingStateRef.current = s;

      const doPlay = () => {
        if (!rive) return;
        if (process.env.NODE_ENV === "development") {
          console.debug(`[Avatar] Playing: "${target}" (State: ${s})`);
        }
        
        // Stop every animation in the map to ensure we don't have overlapping states
        // (Like lips moving while idle)
        Object.values(map).forEach(animName => {
          rive.stop(animName);
        });
        
        rive.play(target);
      };

      rafRef.current = requestAnimationFrame(() => {
        doPlay();
        rafRef.current = null;

        // If speaking, re-trigger the animation on a loop since community files are one-shot
        if (s === "speaking") {
          speakLoopRef.current = setInterval(() => {
            if (pendingStateRef.current === "speaking") {
              rive.stop(target);
              rive.play(target);
            } else {
              clearSpeakLoop();
            }
          }, 2200); // Re-trigger every 2.2s to keep lips moving
        }
      });
    }, [rive, src, clearSpeakLoop]);

    // ── Set avatar state via SM inputs OR timeline fallback
    const applyState = useCallback((s: AvatarState) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[Avatar] Transitioning to: ${s} (SM Input: ${!!stateInput})`);
      }
      if (stateInput) {
        stateInput.value = STATE_NUMBERS[s];
      } else {
        playTimeline(s);
      }
    }, [stateInput, playTimeline]);

    // ── Expose imperative handle for parent
    useImperativeHandle(ref, () => ({
      setAvatarState: (s: AvatarState) => applyState(s),
    }), [applyState]);

    // On Rive ready: enable breathe=true + force initial state
    useEffect(() => {
      if (!rive) return;
      if (breatheInput) breatheInput.value = true;

      // Only force 'idle' if we aren't already in another state (like speaking)
      const t = setTimeout(() => {
        if (state === "idle") {
          applyState("idle");
        } else {
          applyState(state);
        }
      }, 50);
      return () => clearTimeout(t);
    }, [rive, breatheInput, applyState, state]);

    // Cleanup rAF and speaking loop on unmount
    useEffect(() => {
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        clearSpeakLoop();
      };
    }, [clearSpeakLoop]);

    // ── React to external state prop
    useEffect(() => {
      applyState(state);
    }, [state, applyState]);

    // ── Blink scheduler (React fallback)
    const scheduleBlink = useCallback(() => {
      const delay = BLINK_MIN_MS + Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS);
      blinkTimerRef.current = setTimeout(() => {
        if (blinkInput) blinkInput.fire();
        scheduleBlink(); // reschedule
      }, delay);
    }, [blinkInput]);

    useEffect(() => {
      if (!blinkInput) return; // only run if SM has a blink input
      scheduleBlink();
      return () => {
        if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
      };
    }, [scheduleBlink, blinkInput]);

    return (
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-4">
        {/* ── Diagnostic HUD Frame ── */}
        <div className="hud-panel animate-hud w-full p-8 relative overflow-hidden group">
          {/* Subtle Scan Beam Overlay */}
          <div className="scan-beam" />
          
          {/* HUD Status Header */}
          <div className="flex justify-between items-center mb-6 font-tech px-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-cyan-500/50 uppercase tracking-tighter">System Diagnostic</span>
              <span className="text-sm text-cyan-400 tracking-widest font-bold">CORE_HEARTBEAT</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-cyan-500/50 uppercase tracking-tighter">Node ID</span>
              <span className="text-xs text-cyan-400 font-bold opacity-80">0x4F4A - BUZZ</span>
            </div>
          </div>

          <div className="relative flex justify-center items-center py-4">
            {/* HUD Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/40" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/40" />

            <div className={`avatar-wrapper ${SIZE_CLASSES[size]} relative transition-transform duration-700 group-hover:scale-105`}>
              {/* ── Glow Aura ── */}
              <div className={`avatar-glow avatar-glow--${state}`} />

              {/* ── Speaking Ripple Ring ── */}
              <div className={`avatar-ring avatar-ring--${state}`} />

              {/* ── Rive Canvas ── */}
              <RiveComponent
                className={`avatar-canvas avatar-canvas--${state} w-full h-full object-contain relative z-10`}
              />
            </div>
          </div>

          {/* HUD Status Footer */}
          <div className="mt-8 grid grid-cols-2 gap-4 px-2 font-tech">
            <div className="border border-cyan-500/10 bg-cyan-500/5 p-2 transition-all group-hover:bg-cyan-500/10">
              <p className="text-[9px] text-cyan-500/60 uppercase">Agent Process</p>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${state !== 'idle' ? 'bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.8)]' : 'bg-zinc-700'}`} />
                <p className="text-[11px] text-cyan-400 uppercase font-bold tracking-widest">{state}</p>
              </div>
            </div>
            <div className="border border-cyan-500/10 bg-cyan-500/5 p-2 transition-all group-hover:bg-cyan-500/10 text-right">
              <p className="text-[9px] text-cyan-500/60 uppercase">System Integrity</p>
              <p className="text-[11px] text-cyan-400 uppercase font-bold tracking-widest">NOMINAL</p>
            </div>
          </div>
          
          {/* Aesthetic Bracket Lines */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-cyan-500/20" />
        </div>
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
export default Avatar;
