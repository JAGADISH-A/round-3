"use client";

import { Rocket, ArrowRight } from "lucide-react";

interface FirstImprovementModalProps {
  delta: number;
  visible: boolean;
  onDismiss: () => void;
}

export default function FirstImprovementModal({
  delta,
  visible,
  onDismiss,
}: FirstImprovementModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md mx-4 p-8 bg-zinc-950 border border-emerald-500/30 rounded-[32px] shadow-[0_0_60px_rgba(16,185,129,0.15)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Glow */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-emerald-500/20 blur-2xl" />

        <div className="flex flex-col items-center text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bebas tracking-wider uppercase">
              Your resume just <span className="text-emerald-400">improved</span> 🚀
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your changes increased your job match score by{" "}
              <span className="text-emerald-400 font-black">+{delta}</span> points.
              Keep going to reach Interview Ready status!
            </p>
          </div>

          <button
            onClick={onDismiss}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/25 active:scale-95 transition-all"
          >
            Continue Improving
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
