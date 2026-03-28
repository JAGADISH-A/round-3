/**
 * StatusPill.tsx
 * Renders an animated pulse dot and text label matching a gamified chunky UI.
 */
"use client";

import { VoiceState } from "@/hooks/useVoiceState";

interface StatusPillProps {
  status: VoiceState;
}

export default function StatusPill({ status }: StatusPillProps) {
  const config = {
    idle: { text: "Ready to Start", dotColor: "bg-zinc-500", pingColor: "bg-zinc-500", pulse: false, border: "border-zinc-700", bg: "bg-zinc-800" },
    listening: { text: "Listening", dotColor: "bg-[#58CC02]", pingColor: "bg-[#58CC02]", pulse: true, border: "border-[#58CC02]/30", bg: "bg-[#58CC02]/10" },
    thinking: { text: "Thinking", dotColor: "bg-[#FFC800]", pingColor: "bg-[#FFC800]", pulse: true, border: "border-[#FFC800]/30", bg: "bg-[#FFC800]/10" },
    speaking: { text: "Speaking", dotColor: "bg-[#1CB0F6]", pingColor: "bg-[#1CB0F6]", pulse: true, border: "border-[#1CB0F6]/30", bg: "bg-[#1CB0F6]/10" },
  };

  const current = config[status];

  return (
    <div className={`flex justify-center items-center gap-3 px-6 py-3 rounded-2xl border-2 border-b-4 transition-all duration-300 ${current.bg} ${current.border}`}>
      {/* Pulse Animation Wrapper */}
      <div className="relative flex h-3.5 w-3.5 items-center justify-center shrink-0">
        {current.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 ${current.pingColor} duration-1000`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${current.dotColor}`}></span>
      </div>
      <span className="text-sm font-black tracking-wider text-white uppercase drop-shadow-sm min-w-[120px] text-center">
        {current.text}
      </span>
    </div>
  );
}
