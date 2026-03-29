"use client";

import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { CheckCircle2, XCircle, BarChart3, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function JDMatchPanel() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const { analysis } = useResumeStore();
  const jdMatch = analysis?.jd_match;

  if (!jdMatch) return (
    <div className="hud-panel p-10 flex flex-col items-center justify-center text-center space-y-4 font-orbitron">
      <div className="w-12 h-12 border border-cyan-500/10 flex items-center justify-center">
        <Info className="w-6 h-6 text-cyan-500/20" />
      </div>
      <p className="text-cyan-500/40 text-[10px] uppercase tracking-[0.4em]">
        {t.resume.jd_match.no_data}
      </p>
    </div>
  );

  return (
    <div className="space-y-8 font-nav">
      {/* Primary Score Card */}
      <div className="hud-panel p-10 relative overflow-hidden group">
        <div className="scan-beam" />
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <BarChart3 className="w-32 h-32 text-cyan-500" />
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-500 animate-pulse" />
            <h4 className="text-[10px] font-orbitron font-bold uppercase tracking-[0.4em] text-cyan-400">
              {t.resume.jd_match.protocol}
            </h4>
          </div>
          <div className="flex items-baseline gap-4">
            <h3 className="text-7xl font-orbitron font-black text-white drop-shadow-[0_0_20px_rgba(0,255,255,0.4)]">
              {jdMatch.jd_match_score}%
            </h3>
            <span className="text-[11px] font-tech font-bold text-cyan-500/40 uppercase tracking-[0.2em]">
              [{jdMatch.match_label}]
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 w-full h-1 bg-cyan-950/40 relative overflow-hidden">
          <div 
            className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.8)] transition-all duration-1000 ease-out"
            style={{ width: `${jdMatch.jd_match_score}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[scan-move_2s_linear_infinite]" />
        </div>

        <div className="mt-6 flex justify-between items-center text-[10px] font-tech text-cyan-500/40 tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-cyan-500/40" />
            <span>{t.resume.jd_match.semantic}: {jdMatch.semantic_score}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-cyan-500/40" />
            <span>{t.resume.jd_match.density}: {jdMatch.keyword_score}%</span>
          </div>
        </div>
      </div>

      {/* Keyword Matching Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 border border-emerald-500/10 bg-emerald-500/5 space-y-6"
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)' }}>
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-orbitron font-bold uppercase tracking-[0.3em]">{t.resume.jd_match.sync_matched}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {jdMatch.matched_keywords.map(kw => (
              <span key={kw} 
                    className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-tech font-bold uppercase tracking-wider"
                    style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}>
                {kw}
              </span>
            ))}
            {jdMatch.matched_keywords.length === 0 && <span className="text-[10px] text-zinc-700 italic font-tech uppercase tracking-widest">{t.resume.jd_match.no_signals}</span>}
          </div>
        </div>

        <div className="p-8 border border-rose-500/10 bg-rose-500/5 space-y-6"
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 5% 100%, 0 90%)' }}>
          <div className="flex items-center gap-3 text-rose-400">
            <XCircle className="w-4 h-4" />
            <span className="text-[10px] font-orbitron font-bold uppercase tracking-[0.3em]">{t.resume.jd_match.gap_detected}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {jdMatch.missing_keywords.map(kw => (
              <span key={kw} 
                    className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-[9px] text-rose-400 font-tech font-bold uppercase tracking-wider"
                    style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}>
                {kw}
              </span>
            ))}
            {jdMatch.missing_keywords.length === 0 && <span className="text-[10px] text-zinc-700 italic font-tech uppercase tracking-widest">{t.resume.jd_match.perfect}</span>}
          </div>
        </div>
      </div>

      {/* ATS Breakdown Panel */}
      <div className="p-10 border border-cyan-500/10 bg-black/20 space-y-6">
        <h4 className="text-[10px] font-orbitron font-bold uppercase tracking-[0.4em] text-cyan-500/40">{t.resume.jd_match.hardware}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {Object.entries(analysis?.ats_breakdown || {}).map(([key, val]) => (
            <div key={key} className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-tech uppercase tracking-widest">
                <span className="text-cyan-500/40">{key.replace('_', ' ')}</span>
                <span className="text-cyan-400">{val}%</span>
              </div>
              <div className="w-full h-1 bg-cyan-950/20 relative overflow-hidden">
                <div 
                  className="h-full bg-cyan-500/60 transition-all duration-1000"
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
