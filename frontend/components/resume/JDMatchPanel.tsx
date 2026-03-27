"use client";

import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { CheckCircle2, XCircle, BarChart3, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function JDMatchPanel() {
  const { analysis, score } = useResumeStore();
  const jdMatch = analysis?.jd_match;

  if (!jdMatch) return (
    <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
      <Info className="w-8 h-8 text-zinc-600" />
      <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
        No Job Description Analyzed
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Primary Score Card */}
      <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BarChart3 className="w-24 h-24 text-[#EAB308]" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#EAB308]">
              JD Alignment Protocol
            </h4>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-6xl font-black text-white">{jdMatch.jd_match_score}%</h3>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {jdMatch.match_label}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#EAB308] transition-all duration-1000 ease-out"
            style={{ width: `${jdMatch.jd_match_score}%` }}
          />
        </div>

        <div className="mt-4 flex justify-between items-center text-[10px] font-mono text-zinc-600">
          <span>SEMANTIC: {jdMatch.semantic_score}%</span>
          <span>KEYWORDS: {jdMatch.keyword_score}%</span>
        </div>
      </div>

      {/* Keyword Matching Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-black border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Matched Skills</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {jdMatch.matched_keywords.map(kw => (
              <span key={kw} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] text-emerald-500 font-bold uppercase">
                {kw}
              </span>
            ))}
            {jdMatch.matched_keywords.length === 0 && <span className="text-[9px] text-zinc-700 italic">No matches found</span>}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-black border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-rose-500">
            <XCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Critical Gaps</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {jdMatch.missing_keywords.map(kw => (
              <span key={kw} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] text-rose-500 font-bold uppercase">
                {kw}
              </span>
            ))}
            {jdMatch.missing_keywords.length === 0 && <span className="text-[9px] text-zinc-700 italic">No gaps identified</span>}
          </div>
        </div>
      </div>

      {/* ATS Breakdown Panel */}
      <div className="p-8 rounded-[32px] border border-white/5 space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">ATS Score Breakdown</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(analysis?.ats_breakdown || {}).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-mono uppercase">
                <span className="text-zinc-500">{key.replace('_', ' ')}</span>
                <span className="text-white">{val}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-700"
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
