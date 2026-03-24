"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";

interface BeforeAfterPanelProps {
  before: string;
  after: string;
  impactSummary?: string;
  improvements?: string[];
}

export default function BeforeAfterPanel({
  before,
  after,
  impactSummary,
  improvements = [],
}: BeforeAfterPanelProps) {
  if (!before || !after) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 mt-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
        <ArrowRight className="w-3 h-3" /> Before → After
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Before */}
        <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl space-y-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-red-400/60">
            Before
          </span>
          <p className="text-sm text-zinc-400 font-mono leading-relaxed">{before}</p>
        </div>

        {/* After */}
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/60">
            After
          </span>
          <p className="text-sm text-white font-medium leading-relaxed">{after}</p>
        </div>
      </div>

      {/* Impact summary */}
      {(impactSummary || improvements.length > 0) && (
        <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl space-y-2">
          {impactSummary && (
            <p className="text-xs text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
              {impactSummary}
            </p>
          )}
          {improvements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {improvements.map((imp, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                    i === 0
                      ? "bg-primary/10 text-primary/80"
                      : "bg-white/5 text-zinc-500"
                  )}
                >
                  {imp}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
