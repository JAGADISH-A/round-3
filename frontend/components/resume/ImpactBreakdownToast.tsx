"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertTriangle, Zap } from "lucide-react";
import type { BulletImpact } from "@/hooks/useResumeAnalysis";

interface ImpactBreakdownToastProps {
  impact: BulletImpact | null;
  visible: boolean;
}

const ImpactBreakdownToast = React.memo(({ impact, visible }: ImpactBreakdownToastProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible && impact) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 3500);
      return () => clearTimeout(t);
    } else {
      setShow(false);
    }
  }, [visible, impact]);

  if (!impact) return null;

  const isPositive = impact.delta > 0;
  const isNegative = impact.delta < 0;

  return (
    <div
      className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-[100] min-w-[280px] max-w-xs",
        "rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-500",
        show ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-5 scale-95 pointer-events-none",
        isPositive
          ? "bg-emerald-950/90 border-emerald-500/40 shadow-emerald-500/10"
          : impact.noImpact
          ? "bg-amber-950/90 border-amber-500/40 shadow-amber-500/10"
          : "bg-red-950/90 border-red-500/40 shadow-red-500/10"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        {isPositive ? (
          <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : impact.noImpact ? (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-400 shrink-0" />
        )}
        <span className={cn(
          "text-sm font-black",
          isPositive ? "text-emerald-300" : impact.noImpact ? "text-amber-300" : "text-red-300"
        )}>
          {isPositive
            ? `+${impact.delta} Score Increase`
            : impact.noImpact
            ? "No JD match impact"
            : `${impact.delta} Score Change`}
        </span>
      </div>

      {/* Breakdown lines */}
      {impact.breakdown.length > 0 && (
        <div className="px-5 pb-4 space-y-1 border-t border-white/5 pt-3">
          {impact.breakdown.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
              <Zap className="w-3 h-3 text-emerald-500/60 shrink-0" />
              {b.reason}
            </div>
          ))}
        </div>
      )}

      {/* No-impact hint */}
      {impact.noImpact && (
        <p className="px-5 pb-4 text-xs text-amber-400/70 border-t border-white/5 pt-3">
          Try adding missing skills or metrics to improve alignment.
        </p>
      )}
    </div>
  );
});

ImpactBreakdownToast.displayName = "ImpactBreakdownToast";
export default ImpactBreakdownToast;
