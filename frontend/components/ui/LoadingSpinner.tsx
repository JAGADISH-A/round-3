"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-t-2 border-r-2 border-cyan-500 animate-spin shadow-[0_0_15px_rgba(0,255,255,0.4)]" />
        <div className="absolute inset-2 border-b-2 border-l-2 border-cyan-500/40 animate-[spin_1.5s_linear_infinite_reverse]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
        </div>
      </div>
      <div className="space-y-1 text-center">
        <p className="text-cyan-400 font-orbitron tracking-[0.3em] text-sm animate-pulse">INITIALIZING NEURAL UPLINK</p>
        <p className="text-cyan-500/40 font-tech text-[10px] tracking-widest uppercase italic">Decrypting carrier signals...</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#020406] flex items-center justify-center z-[100] backdrop-blur-sm">
        <div className="scanline" />
        {content}
      </div>
    );
  }

  return content;
}
