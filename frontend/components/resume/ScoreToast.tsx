"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface ScoreToastProps {
  message: string;
  type: "positive" | "negative" | "neutral";
  visible: boolean;
}

export default function ScoreToast({ message, type, visible }: ScoreToastProps) {
  return (
    <div
      className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-500",
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-4 scale-95 pointer-events-none",
        type === "positive"
          ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10"
          : type === "negative"
          ? "bg-red-950/80 border-red-500/40 text-red-300 shadow-red-500/10"
          : "bg-amber-950/80 border-amber-500/40 text-amber-300 shadow-amber-500/10"
      )}
    >
      {type === "positive" ? (
        <TrendingUp className="w-5 h-5 shrink-0" />
      ) : type === "negative" ? (
        <TrendingDown className="w-5 h-5 shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 shrink-0" />
      )}
      <span className="text-sm font-bold tracking-wide">{message}</span>
    </div>
  );
}
