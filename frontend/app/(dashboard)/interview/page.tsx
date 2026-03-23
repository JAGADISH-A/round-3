"use client";

import InterviewAnalyzer from "@/components/vision/InterviewAnalyzer";
console.log("InterviewAnalyzer:", InterviewAnalyzer);
import { ShieldCheck, Zap, Activity, Users } from "lucide-react";

export default function InterviewPage() {
  return (
    <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* Header */}
      <header className="h-[64px] border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Interview Mode</h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Unified Multi-Modal Intelligence</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto pb-20">
          {/* Unified Analyzer Component */}
          <InterviewAnalyzer />
        </div>
      </div>
    </div>
  );
}
