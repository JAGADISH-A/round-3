"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLiveResume, TextSegment } from '@/hooks/useLiveResume';
import ReadinessScoreCard from './ReadinessScoreCard';
import ImprovementFeedPanel from './ImprovementFeedPanel';
import ScoreDeltaBadge from './ScoreDeltaBadge';
import { cn } from '@/lib/utils';
import {
  Edit3, Eye, EyeOff, Zap, Sparkles, Search,
  Save, Download, X, CheckCircle2, Info, TrendingUp
} from 'lucide-react';

interface LiveEditorProps {
  initialText: string;
  initialScore: number;
  jdText: string;
  onExit: () => void;
}

// ─── Simple toast state helper ────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const show = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return { toast, show };
}

export default function LiveEditor({ initialText, initialScore, jdText, onExit }: LiveEditorProps) {
  const { resumeText, updateResume, score, delta, readiness, textSegments, isAnalyzing } =
    useLiveResume(initialText, initialScore, jdText);

  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [hasEdited, setHasEdited] = useState(false);
  const [improvedReminder, setImprovedReminder] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { toast, show: showToast } = useToast();

  // Track first edit
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!hasEdited) setHasEdited(true);
    updateResume(e.target.value);
  }, [hasEdited, updateResume]);

  // Show save reminder when score improves
  useEffect(() => {
    if (delta > 0 && hasEdited) {
      setImprovedReminder(true);
      const t = setTimeout(() => setImprovedReminder(false), 6000);
      return () => clearTimeout(t);
    }
  }, [delta, hasEdited]);

  // Sync scroll overlay ↔ textarea
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // ── Save Draft ─────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(() => {
    try {
      localStorage.setItem('live_resume_draft', resumeText);
      localStorage.setItem('live_resume_draft_ts', new Date().toISOString());
      showToast('Draft saved successfully', 'success');
    } catch {
      showToast('Could not save draft', 'info');
    }
  }, [resumeText, showToast]);

  // ── Download as .txt ───────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const blob = new Blob([resumeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Resume downloaded', 'success');
  }, [resumeText, showToast]);

  // ── Heatmap rendering ──────────────────────────────────────────────────────
  const renderHeatmap = () => {
    if (!textSegments.length || !showHeatmap) return <span className="text-transparent">{resumeText}</span>;
    return textSegments.map((seg, i) => {
      const color =
        seg.label === 'strong' ? 'bg-emerald-500/20 border-b-2 border-emerald-500/50' :
        seg.label === 'moderate' ? 'bg-amber-500/10 border-b-2 border-amber-500/30' :
        'bg-red-500/10 border-b-2 border-red-500/30';
      return (
        <span key={i} className={cn('transition-all duration-500 px-0.5 rounded-sm', color)}>
          {seg.text}
        </span>
      );
    });
  };

  const readinessLabel =
    readiness >= 80 ? 'Strong Candidate' :
    readiness >= 60 ? 'Interview Ready' :
    readiness >= 40 ? 'Improving' : 'Beginner';

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] w-full overflow-hidden">

      {/* ── Global Toast ─────────────────────────────────────────────────── */}
      {toast && (
        <div className={cn(
          'fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl transition-all animate-in slide-in-from-top-4 duration-300',
          toast.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
            : 'bg-zinc-900/90 border-white/10 text-zinc-300'
        )}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* ── Improvement Reminder ─────────────────────────────────────────── */}
      {improvedReminder && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl border border-primary/30 bg-primary/10 shadow-[0_0_30px_rgba(255,214,0,0.15)] animate-in slide-in-from-bottom-4 duration-300">
          <TrendingUp className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-primary">Your resume improved — don&apos;t forget to save or download!</span>
        </div>
      )}

      {/* ── Main Editor Area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-5 overflow-hidden px-6 pt-4">

        {/* LEFT: Editor — 70% */}
        <div className="flex-[7] flex flex-col bg-zinc-950 rounded-3xl border border-white/5 overflow-hidden">
          
          {/* Editor Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-zinc-900/80 shrink-0">
            <div className="flex items-center gap-3">
              <Edit3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-white">Resume Editor</span>
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest hidden sm:block">
                · Optimizes content, not formatting or design
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isAnalyzing && (
                <span className="flex items-center gap-1.5 text-[10px] text-zinc-400 animate-pulse">
                  <Search className="w-3 h-3 animate-spin" />
                  Analyzing…
                </span>
              )}
              <button
                onClick={() => setShowHeatmap(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all',
                  showHeatmap
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'bg-zinc-800 border-white/5 text-zinc-500 hover:text-white'
                )}
              >
                <Zap className="w-3 h-3" />
                Heatmap
              </button>
            </div>
          </div>

          {/* Dual-layer text area */}
          <div className="relative flex-1 overflow-hidden">
            {/* Overlay */}
            <div
              ref={overlayRef}
              aria-hidden="true"
              className="absolute inset-0 px-7 py-6 text-sm leading-7 whitespace-pre-wrap break-words pointer-events-none select-none font-mono text-transparent overflow-auto scrollbar-hide z-0"
            >
              {renderHeatmap()}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={resumeText}
              onChange={handleChange}
              onScroll={handleScroll}
              spellCheck={false}
              placeholder={hasEdited ? '' : 'Paste or type your resume here…'}
              className="absolute inset-0 w-full h-full bg-transparent px-7 py-6 text-sm leading-7 text-zinc-300 focus:outline-none resize-none font-mono border-none z-10 selection:bg-primary/30"
            />

            {/* Empty state hint */}
            {!hasEdited && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-20">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/80 border border-white/5">
                  <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-[11px] text-zinc-500 font-medium">
                    Start editing your resume to see real-time improvements
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Analytics — 30% */}
        <div
          className={cn(
            'flex-[3] flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 transition-all duration-300',
            !showAnalytics && 'hidden'
          )}
        >
          {/* Analytics toggle label */}
          <button
            onClick={() => setShowAnalytics(false)}
            className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors font-mono uppercase tracking-widest"
          >
            <EyeOff className="w-3 h-3" /> Hide Insights
          </button>

          {/* Live Score */}
          <div className="bg-zinc-900/70 rounded-3xl p-5 border border-white/5 relative">
            <div className="absolute top-3 right-3">
              <ScoreDeltaBadge newScore={score} delta={delta} />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Live JD Score</p>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-bebas font-black text-white">{score}</span>
              <span className="text-xs text-zinc-600 mb-1 font-mono">/ 100</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-1000"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Readiness */}
          <ReadinessScoreCard readiness={readiness} label={readinessLabel} />

          {/* Improvement Feed */}
          {delta !== 0 && (
            <ImprovementFeedPanel
              improvements={[{
                type: 'score',
                description: delta > 0
                  ? `Score improved by ${delta} points`
                  : `Score dropped by ${Math.abs(delta)} points`,
                impact: delta
              }]}
              totalImprovement={delta}
            />
          )}
        </div>

        {/* Show insights when hidden */}
        {!showAnalytics && (
          <button
            onClick={() => setShowAnalytics(true)}
            className="flex items-center gap-2 px-3 py-8 border border-white/5 rounded-2xl text-[10px] text-zinc-600 hover:text-zinc-400 hover:border-white/10 transition-all font-mono uppercase tracking-widest writing-vertical"
            style={{ writingMode: 'vertical-rl' }}
          >
            <Eye className="w-3 h-3" /> Show Insights
          </button>
        )}
      </div>

      {/* ── Sticky Action Bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-t border-white/5 bg-zinc-950/90 backdrop-blur-md">
        
        {/* Left: disclaimer */}
        <div className="hidden md:flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
          <Info className="w-3 h-3 shrink-0" />
          This editor optimizes content, not formatting or design
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-800 border border-white/5 text-white text-xs font-bold hover:bg-zinc-700 hover:border-white/10 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-black text-xs font-black hover:brightness-110 active:scale-95 transition-all shadow-[0_6px_20px_rgba(255,214,0,0.25)]"
          >
            <Download className="w-3.5 h-3.5" />
            Download .txt
          </button>

          <button
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs font-bold hover:text-white hover:border-white/20 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
