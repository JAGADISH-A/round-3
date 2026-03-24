import React from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck, TrendingUp } from "lucide-react";

interface ReadinessScoreCardProps {
  readiness: number;
  label: string;
  delta?: number;
}

const LABEL_COLORS: Record<string, string> = {
  "Beginner": "text-red-400 bg-red-500/10 border-red-500/20",
  "Improving": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Interview Ready": "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "Strong Candidate": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const BAR_COLORS: Record<string, string> = {
  "Beginner": "from-red-700 to-red-500",
  "Improving": "from-amber-700 to-amber-400",
  "Interview Ready": "from-sky-700 to-sky-400",
  "Strong Candidate": "from-emerald-700 to-emerald-400",
};

const ReadinessScoreCard = React.memo(({ readiness, label, delta }: ReadinessScoreCardProps) => {
  const colorClass = LABEL_COLORS[label] ?? LABEL_COLORS["Improving"];
  const barClass = BAR_COLORS[label] ?? BAR_COLORS["Improving"];

  return (
    <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-4 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Resume Readiness
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bebas font-black tracking-wider">
                {readiness}%
              </p>
              {delta !== undefined && delta !== 0 && (
                <span
                  className={cn(
                    "text-xs font-black animate-in slide-in-from-left-2 duration-300",
                    delta > 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  ({delta > 0 ? "+" : ""}{delta})
                </span>
              )}
            </div>
          </div>
        </div>

        <span
          className={cn(
            "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border",
            colorClass
          )}
        >
          {label}
        </span>
      </div>

      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out",
            barClass
          )}
          style={{ width: `${readiness}%` }}
        />
      </div>
    </div>
  );
});

ReadinessScoreCard.displayName = "ReadinessScoreCard";
export default ReadinessScoreCard;
