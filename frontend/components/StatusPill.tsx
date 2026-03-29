/**
 * StatusPill.tsx
 * Renders an animated pulse dot and text label matching a gamified chunky UI.
 */
"use client";

import { VoiceState } from "@/hooks/useVoiceState";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

interface StatusPillProps {
  status: VoiceState;
}

export default function StatusPill({ status }: StatusPillProps) {
  const { lang } = useLanguage();
  const t = translations[lang];

  const config = {
    idle: { text: t.interview.status.idle, dotColor: "bg-zinc-700", pingColor: "bg-zinc-700", pulse: false, border: "border-zinc-800", bg: "bg-zinc-900/40" },
    listening: { text: t.interview.status.listening, dotColor: "bg-emerald-500", pingColor: "bg-emerald-500", pulse: true, border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
    thinking: { text: t.interview.status.thinking, dotColor: "bg-amber-500", pingColor: "bg-amber-500", pulse: true, border: "border-amber-500/30", bg: "bg-amber-500/5" },
    speaking: { text: t.interview.status.speaking, dotColor: "bg-cyan-500", pingColor: "bg-cyan-500", pulse: true, border: "border-cyan-500/30", bg: "bg-cyan-500/5" },
    connecting: { text: t.interview.status.connecting, dotColor: "bg-amber-500", pingColor: "bg-amber-500", pulse: true, border: "border-amber-500/30", bg: "bg-amber-500/5" },
  };

  const current = config[status];

  return (
    <div className={`flex justify-center items-center gap-3 px-6 py-2.5 border transition-all duration-500 ${current.bg} ${current.border}`}
         style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}>
      {/* Pulse Animation Wrapper */}
      <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
        {current.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${current.pingColor} duration-1000`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dotColor}`}></span>
      </div>
      <span className="text-[10px] font-orbitron font-black tracking-[0.2em] text-cyan-50/80 uppercase min-w-[140px] text-center">
        {current.text}
      </span>
    </div>
  );
}
