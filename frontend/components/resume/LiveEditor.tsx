"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLiveResume, TextSegment } from '@/hooks/useLiveResume';
import ReadinessScoreCard from './ReadinessScoreCard';
import ImprovementFeedPanel from './ImprovementFeedPanel';
import ScoreDeltaBadge from './ScoreDeltaBadge';
import { cn } from '@/lib/utils';
import { Edit3, Eye, Zap, Sparkles, AlertCircle, CheckCircle2, Search } from 'lucide-react';

interface LiveEditorProps {
  initialText: string;
  initialScore: number;
  jdText: string;
  onExit: () => void;
}

export default function LiveEditor({ initialText, initialScore, jdText, onExit }: LiveEditorProps) {
  const { resumeText, updateResume, score, delta, readiness, textSegments, isAnalyzing } = useLiveResume(initialText, initialScore, jdText);
  const [showHeatmap, setShowHeatmap] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Map segments to the text
  const renderHeatmap = () => {
    if (!textSegments.length) return resumeText;

    return textSegments.map((segment, i) => {
      let colorClass = "";
      if (segment.label === 'strong') colorClass = "bg-emerald-500/20 border-emerald-500/30 text-emerald-400";
      else if (segment.label === 'moderate') colorClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
      else colorClass = "bg-red-500/10 border-red-500/20 text-red-100";

      return (
        <span 
          key={i} 
          className={cn(
            "inline transition-all duration-300 border-b-2 px-0.5 rounded-sm",
            showHeatmap ? colorClass : "bg-transparent border-transparent"
          )}
        >
          {segment.text}
        </span>
      );
    });
  };

  return (
    <div className="flex h-[calc(100vh-120px)] w-full gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* LEFT: Editor */}
      <div className="flex-[3] flex flex-col bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden relative">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Edit3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Resume Editor</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Interactive Feedback</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAnalyzing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full animate-pulse">
                <Search className="w-3 h-3 text-primary animate-spin" />
                <span className="text-[10px] text-zinc-400 font-medium">Analyzing changes...</span>
              </div>
            )}
            
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border",
                showHeatmap 
                  ? "bg-primary/20 border-primary/30 text-primary" 
                  : "bg-zinc-800 border-white/5 text-zinc-500 hover:text-white"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Heatmap</span>
            </button>
            
            <button 
              onClick={onExit}
              className="px-4 py-1.5 bg-zinc-800 text-white text-xs font-bold rounded-xl hover:bg-zinc-700 transition-colors border border-white/5"
            >
              Exit Editor
            </button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-black/20 group">
          {/* Overlay Layer (Heatmap) */}
          <div 
            ref={overlayRef}
            className="absolute inset-0 p-8 text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none select-none font-medium z-0 overflow-auto scrollbar-hide text-transparent"
            aria-hidden="true"
          >
            {renderHeatmap()}
          </div>

          {/* Input Layer (Textarea) */}
          <textarea
            ref={textareaRef}
            value={resumeText}
            onChange={(e) => updateResume(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            className="absolute inset-0 w-full h-full bg-transparent p-8 text-sm leading-relaxed text-zinc-300 focus:outline-none resize-none z-10 whitespace-pre-wrap break-words border-none font-medium selection:bg-primary/30"
            placeholder="Paste or type your resume content here..."
          />
          
          <div className="absolute bottom-4 left-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-zinc-600 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary/50" />
              AI feedback updates as you type
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: Live Analytics */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Live Score Card */}
        <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden group font-grotesk">
          <div className="absolute top-0 right-0 p-4">
             <ScoreDeltaBadge delta={delta} newScore={score} />
          </div>
          
          <div className="relative z-10">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Live Performance</h4>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-bebas font-black text-white tracking-wider">{score}</span>
              <span className="text-sm font-bold text-zinc-500 mb-2">/ 100</span>
            </div>
            
            <div className="w-full bg-zinc-800 h-2 rounded-full mt-4 overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-primary to-amber-500 shadow-[0_0_20px_rgba(255,214,0,0.3)] transition-all duration-1000 ease-out"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Readiness Card */}
        <div className="font-grotesk">
          <ReadinessScoreCard 
            readiness={readiness} 
            label={readiness >= 80 ? "Strong Candidate" : readiness >= 60 ? "Interview Ready" : readiness >= 40 ? "Improving" : "Beginner"} 
          />
        </div>

        {/* Insights Panel */}
        <div className="flex-1 font-grotesk overflow-hidden">
          <ImprovementFeedPanel 
            improvements={[
              { type: "score", description: delta > 0 ? `Score increased by ${delta} points` : delta < 0 ? `Score decreased by ${Math.abs(delta)} points` : "Content update analyzed", impact: delta }
            ]}
            totalImprovement={delta}
          />
        </div>
      </div>
    </div>
  );
}
