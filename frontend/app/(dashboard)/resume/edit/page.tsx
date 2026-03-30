"use client";

import React from 'react';
import Link from 'next/link';
import { useResumeStore } from '@/store/useResumeStore';
import LiveEditor from '@/components/resume/LiveEditor';
import { ChevronLeft, Zap, Terminal } from 'lucide-react';

export default function ResumeEditPage() {
  const { analysis, _hasHydrated } = useResumeStore();

  if (!_hasHydrated) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white font-mono text-xs uppercase tracking-widest text-zinc-500">
        <div className="flex flex-col items-center gap-4">
          <Terminal className="w-8 h-8 opacity-20" />
          <p>No Active Session — Upload Resume to Initialize</p>
          <Link href="/resume" className="text-[#EAB308] border-b border-[#EAB308]/30 pb-1">
            Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 lg:p-8 space-y-6">
      <nav className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-6">
          <Link 
            href="/resume" 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-sm font-black uppercase tracking-[0.2em]">Neural Link Editor</h1>
            <p className="text-[9px] font-mono text-zinc-600 uppercase">Live Rescoring Protocol Active</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-black border border-white/5 rounded-2xl">
           <Zap className="w-3 h-3 text-[#EAB308]" />
           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
             Target: <span className="text-zinc-300">{analysis.inferred_role}</span>
           </span>
        </div>
      </nav>

      <LiveEditor />
    </main>
  );
}
