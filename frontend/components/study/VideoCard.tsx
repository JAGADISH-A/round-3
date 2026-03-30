"use client";

import React from "react";
import { Play, Clock, BarChart3, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  id: string;
  title: string;
  duration: string;
  category: string;
  isActive: boolean;
  onClick: () => void;
}

export function VideoCard({ id, title, duration, category, isActive, onClick }: VideoCardProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-3xl border transition-all text-left group relative overflow-hidden",
        isActive 
          ? "bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_20px_rgba(0,255,255,0.1)]" 
          : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5"
      )}
    >
      {/* HUD Accent */}
      {isActive && (
        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_15px_cyan]" />
      )}

      <div className="flex gap-4 items-center">
        {/* Mock Thumbnail / Icon */}
        <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border relative transition-transform group-hover:scale-105",
            isActive ? "bg-cyan-500 border-cyan-400 text-black" : "bg-zinc-900 border-white/5 text-zinc-600"
        )}>
           <Play className={cn("w-6 h-6", isActive ? "fill-current" : "")} />
           <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded-md text-[8px] font-mono text-white/60">
             {duration}
           </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <span className={cn(
                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                isActive ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-white/5 border-white/10 text-zinc-500"
             )}>
                {category}
             </span>
             <span className="text-[10px] font-mono text-zinc-600 opacity-40">id://{id}</span>
          </div>
          <h4 className={cn(
            "text-[13px] font-nav font-bold leading-tight line-clamp-2 transition-colors",
            isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
          )}>
            {title}
          </h4>
          
          <div className="mt-3 flex items-center gap-4 text-[9px] font-mono tracking-widest text-zinc-600 opacity-60">
             <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {duration}
             </div>
             <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> NEURAL_LOAD_STABLE
             </div>
          </div>
        </div>

        <ChevronRight className={cn(
            "w-5 h-5 transition-all",
            isActive ? "text-cyan-500 translate-x-0" : "text-zinc-800 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
        )} />
      </div>
    </button>
  );
}
