"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReanalyzeLoaderProps {
  visible: boolean;
}

export default function ReanalyzeLoader({ visible }: ReanalyzeLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-xs font-mono text-zinc-400 transition-all duration-300",
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}
    >
      <Loader2 className="w-3 h-3 animate-spin text-primary" />
      Re-analyzing…
    </div>
  );
}
