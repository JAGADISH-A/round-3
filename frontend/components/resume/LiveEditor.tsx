"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { jsPDF } from "jspdf";
import { useLiveResume, TextSegment } from '@/hooks/useLiveResume';
import { useResumeStore } from '@/store/useResumeStore';
import ReadinessScoreCard from './ReadinessScoreCard';
import ImprovementFeedPanel from './ImprovementFeedPanel';
import ScoreDeltaBadge from './ScoreDeltaBadge';
import { cn } from '@/lib/utils';
import {
  Edit3, Eye, EyeOff, Zap, Sparkles, Search,
  Save, Download, X, CheckCircle2, Info, TrendingUp, RotateCcw
} from 'lucide-react';

interface LiveEditorProps {
  initialText?: string;
  initialScore?: number;
  jdText?: string;
  onExit?: () => void;
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
  const resumeText = useResumeStore((s) => s.resumeText);
  const setResumeText = useResumeStore((s) => s.setResumeText);
  
  // Debug: Validate full resume is loaded
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.debug("Editor render:", resumeText?.length || 0);
    }
  }, [resumeText]);

  const { score, delta, readiness, textSegments, isAnalyzing } =
    useLiveResume(jdText ?? "", initialScore ?? 0);

  const [showHeatmap, setShowHeatmap] = useState(true);

  const [showAnalytics, setShowAnalytics] = useState(true);
  const [hasEdited, setHasEdited] = useState(false);
  const [improvedReminder, setImprovedReminder] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { toast, show: showToast } = useToast();

  // Track first edit
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!hasEdited) setHasEdited(true);
    setResumeText(e.target.value);
  };

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

  // ── Download as PDF ───────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!resumeText.trim()) {
      showToast('Resume is empty', 'info');
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("CURRICULUM VITAE", 105, 20, { align: "center" });
      
      // Divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 25, 190, 25);
      
      // Content
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      
      const lines = doc.splitTextToSize(resumeText, 170);
      doc.text(lines, 20, 35);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      doc.save(`resume_${dateStr}.pdf`);
      showToast('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('PDF Generation failed:', error);
      showToast('PDF generation failed', 'info');
    }
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
    <div className="flex flex-col h-[calc(100vh-72px)] w-full overflow-hidden font-nav">
      
      {/* ── Global Toast ─────────────────────────────────────────────────── */}
      {toast && (
        <div className={cn(
          'fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 border shadow-[0_0_30px_rgba(0,255,255,0.1)] transition-all animate-hud duration-300 font-orbitron text-[10px] tracking-[0.2em]',
          toast.type === 'success'
            ? 'bg-cyan-950/90 border-cyan-500/30 text-cyan-400'
            : 'bg-zinc-900/90 border-white/10 text-zinc-300'
        )}
        style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-bold">{toast.message.toUpperCase()}</span>
        </div>
      )}

      {/* ── Improvement Reminder ─────────────────────────────────────────── */}
      {improvedReminder && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-4 border border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_30px_rgba(0,255,255,0.2)] animate-hud duration-300 font-orbitron text-[10px] tracking-widest text-cyan-400"
        style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}>
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span className="font-bold">INTEGRITY_INCREASE_DETECTED // SAVE_DRAFT_RECOMMENDED</span>
        </div>
      )}

      {/* ── Main Editor Area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-6 overflow-hidden px-8 pt-6">

        {/* LEFT: Editor — 70% */}
        <div className="flex-[7] flex flex-col hud-panel overflow-hidden relative">
          <div className="scan-beam" />
          
          {/* Editor Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/10 bg-cyan-500/5 shrink-0 font-orbitron">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border border-cyan-500/30 flex items-center justify-center">
                 <Edit3 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-cyan-500/40 uppercase tracking-[0.3em]">Hardware_Module</span>
                <span className="text-sm font-bold text-white tracking-widest">RESUME_CORE_v1.0</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isAnalyzing && (
                <span className="flex items-center gap-2 text-[10px] text-cyan-500/60 font-tech tracking-[0.2em] animate-pulse">
                  <span className="w-3 h-3 animate-spin border-2 border-cyan-500 border-t-transparent rounded-none" />
                  ANALYZING_SEMANTICS...
                </span>
              )}
              <button
                onClick={() => setShowHeatmap(v => !v)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border transition-all text-[10px] font-bold uppercase tracking-[0.2em]',
                  showHeatmap
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.1)]'
                    : 'bg-black/40 border-cyan-500/10 text-cyan-500/40 hover:text-cyan-400'
                )}
                style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%, 0 35%)' }}
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
              className="absolute inset-0 px-8 py-8 text-sm leading-8 whitespace-pre-wrap break-words pointer-events-none select-none font-tech text-transparent overflow-auto custom-scrollbar z-0"
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
              placeholder={hasEdited ? '' : '>>> INJECT_RESUME_DATA_HERE...'}
              className="absolute inset-0 w-full h-full bg-transparent px-8 py-8 text-sm leading-8 text-cyan-50 focus:outline-none resize-none font-tech border-none z-10 selection:bg-cyan-500/30 placeholder:text-cyan-500/20"
            />

            {/* Empty state hint */}
            {!hasEdited && (
              <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none z-20">
                <div className="flex items-center gap-3 px-6 py-3 border border-cyan-500/10 bg-black/60 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-cyan-500/60 animate-pulse" />
                  <span className="text-[10px] text-cyan-500/40 font-orbitron uppercase tracking-[0.3em]">
                    Awaiting content verification signals...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Analytics — 30% */}
        <div
          className={cn(
            'flex-[3] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar transition-all duration-300',
            !showAnalytics && 'hidden'
          )}
        >
          {/* Analytics toggle label */}
          <button
            onClick={() => setShowAnalytics(false)}
            className="flex items-center justify-end gap-2 text-[9px] text-cyan-500/30 hover:text-cyan-400 transition-colors font-orbitron uppercase tracking-[0.4em]"
          >
            <EyeOff className="w-3 h-3" /> [ minimize_intel ]
          </button>

          {/* Live Score */}
          <div className="hud-panel p-6 relative group overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <ScoreDeltaBadge newScore={score} delta={delta} />
            </div>
            <p className="text-[10px] font-orbitron font-bold text-cyan-500/40 uppercase tracking-[0.4em] mb-4">LIVE_MATCH_COEFFICIENT</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-orbitron font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">{score}</span>
              <span className="text-sm text-cyan-500/30 mb-2 font-tech tracking-widest">/ 100%</span>
            </div>
            <div className="w-full bg-cyan-900/20 h-1 relative overflow-hidden">
              <div
                className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.8)] transition-all duration-1000"
                style={{ width: `${score}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[scan-move_2s_linear_infinite]" />
            </div>
          </div>

          {/* Readiness */}
          <ReadinessScoreCard readiness={readiness} label={readinessLabel.toUpperCase()} />

          {/* Improvement Feed */}
          {delta !== 0 && (
            <div className="animate-hud">
              <ImprovementFeedPanel
                improvements={[{
                  type: 'score',
                  description: delta > 0
                    ? `Integrity alignment increased by ${delta}%`
                    : `Neural mismatch detected: -${Math.abs(delta)}%`,
                  impact: delta
                }]}
                totalImprovement={delta}
              />
            </div>
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
      <div className="shrink-0 flex items-center justify-between gap-6 px-10 py-6 border-t border-cyan-500/10 bg-[#0c0c0e]/80 backdrop-blur-xl relative z-20 font-orbitron">
        
        {/* Left: disclaimer */}
        <div className="hidden lg:flex items-center gap-3 text-[9px] text-cyan-500/40 font-tech uppercase tracking-[0.2em]">
          <div className="w-4 h-4 border border-cyan-500/20 flex items-center justify-center">
            <Info className="w-2.5 h-2.5" />
          </div>
          System focuses on semantic payload optimization // Visual formatting disregarded
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-3 px-8 py-3 bg-black/40 border border-cyan-500/20 text-cyan-500 text-[10px] font-bold tracking-[0.2em] hover:bg-cyan-500/10 hover:text-cyan-400 transition-all"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}
          >
            <Save className="w-3.5 h-3.5" />
            SAVE_DRAFT
          </button>

          <button
            onClick={handleDownload}
            disabled={!resumeText.trim() || isAnalyzing}
            className="tactical-button px-10 py-3"
          >
            <span className="flex items-center gap-3">
              <Download className="w-3.5 h-3.5" />
              EXTRACT_PDF
            </span>
          </button>

          <button
            onClick={() => {
              if (onExit) onExit();
              else window.location.href = '/resume';
            }}
            className="flex items-center justify-center w-12 h-12 border border-red-500/20 text-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all"
            style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
