"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, History } from "lucide-react";

interface Improvement {
  type: string;
  description: string;
  impact: number;
}

interface ImprovementFeedPanelProps {
  improvements: Improvement[];
  totalImprovement: number;
}

const ImprovementFeedPanel = React.memo(({
  improvements,
  totalImprovement,
}: ImprovementFeedPanelProps) => {
  if (improvements.length === 0) return null;

  return (
    <div className="liquid-glass p-8 rounded-[40px] border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-bebas tracking-wide uppercase">
              Improvement <span className="text-primary">Log</span>
            </h4>
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
              Session Progress
            </p>
          </div>
        </div>

        {/* Total improvement badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-black",
            totalImprovement > 0
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : totalImprovement < 0
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-zinc-800 border-zinc-700 text-zinc-400"
          )}
        >
          {totalImprovement > 0 ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : totalImprovement < 0 ? (
            <TrendingDown className="w-3.5 h-3.5" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
          Total: {totalImprovement > 0 ? "+" : ""}{totalImprovement}
        </div>
      </div>

      {/* Feed list */}
      <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
        {improvements.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 px-4 py-3 bg-black/30 border border-white/5 rounded-2xl"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  item.impact > 0
                    ? "bg-emerald-400"
                    : item.impact < 0
                    ? "bg-red-400"
                    : "bg-zinc-600"
                )}
              />
              <p className="text-xs text-zinc-300 truncate">{item.description}</p>
            </div>

            <span
              className={cn(
                "text-xs font-black tabular-nums shrink-0",
                item.impact > 0
                  ? "text-emerald-400"
                  : item.impact < 0
                  ? "text-red-400"
                  : "text-zinc-500"
              )}
            >
              {item.impact > 0 ? "+" : ""}{item.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

ImprovementFeedPanel.displayName = "ImprovementFeedPanel";
export default ImprovementFeedPanel;
