"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreDeltaBadgeProps {
  newScore: number;
  delta: number;
  label?: string;
}

function useAnimatedCounter(target: number, duration: number = 500) {
  const [display, setDisplay] = useState(target);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    const start = display;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    const step = (t: number) => {
      const elapsed = t - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      }
    };
    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [target, duration]);

  return display;
}

export default function ScoreDeltaBadge({ newScore, delta, label }: ScoreDeltaBadgeProps) {
  const [visible, setVisible] = useState(false);
  const animatedScore = useAnimatedCounter(newScore, 600);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [newScore, delta]);

  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const sign = isPositive ? "+" : "";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
        isPositive
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : isNegative
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : "bg-zinc-800 border-zinc-700 text-zinc-400"
      )}
    >
      {isPositive ? (
        <TrendingUp className="w-4 h-4" />
      ) : isNegative ? (
        <TrendingDown className="w-4 h-4" />
      ) : (
        <Minus className="w-4 h-4" />
      )}

      <span className="text-white font-black tabular-nums">
        {animatedScore}
        <span className="text-zinc-500 font-normal">&nbsp;/ 100</span>
      </span>

      <span
        className={cn(
          "text-xs font-black px-2 py-0.5 rounded-full animate-in zoom-in duration-300",
          isPositive
            ? "bg-emerald-500/20 text-emerald-300"
            : isNegative
            ? "bg-red-500/20 text-red-300"
            : "bg-zinc-700 text-zinc-400"
        )}
      >
        {sign}{delta}
      </span>

      {label && (
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          {label}
        </span>
      )}
    </div>
  );
}
