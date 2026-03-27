"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Flame, TrendingUp, TrendingDown, Minus, RotateCcw, Activity } from 'lucide-react';
import type { SessionProgress, ImprovementEntry } from '@/hooks/useSessionProgress';

interface SessionSummaryPanelProps {
  progress: SessionProgress;
  onUndo?: () => void;
  canUndo?: boolean;
}

// Animated counter
function Counter({ target, className }: { target: number; className?: string }) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    prev.current = target;

    const duration = 600;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);

  return <span className={className}>{display}</span>;
}

function EntryRow({ entry }: { entry: ImprovementEntry }) {
  const isPos = entry.delta > 0;
  const isNeg = entry.delta < 0;
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/30 border border-white/5">
      <div className={cn(
        'w-1.5 h-1.5 rounded-full shrink-0',
        isPos ? 'bg-emerald-400' : isNeg ? 'bg-red-400' : 'bg-zinc-600'
      )} />
      <p className="text-[11px] text-zinc-400 flex-1 truncate">{entry.description}</p>
      <span className={cn(
        'text-[11px] font-black tabular-nums shrink-0',
        isPos ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-zinc-500'
      )}>
        {isPos ? '+' : ''}{entry.delta}
      </span>
    </div>
  );
}

export default function SessionSummaryPanel({ progress, onUndo, canUndo }: SessionSummaryPanelProps) {
  const { initialScore, currentScore, bestScore, totalDelta, improvementCount, entries, initialReadiness, currentReadiness } = progress;
  const isNewBest = currentScore > 0 && currentScore === bestScore && currentScore > initialScore;

  return (
    <div className="bg-zinc-900/70 rounded-3xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-xs font-black text-white uppercase tracking-widest">Session Progress</span>
        </div>
        {canUndo && onUndo && (
          <button
            onClick={onUndo}
            title="Undo last change"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold text-zinc-400 border border-white/5 hover:border-white/10 hover:text-white transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Undo
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-5 pb-4">
        {/* Total delta */}
        <div className="bg-black/30 rounded-2xl p-3 flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Total Δ</span>
          <span className={cn(
            'text-xl font-bebas font-black',
            totalDelta > 0 ? 'text-emerald-400' : totalDelta < 0 ? 'text-red-400' : 'text-zinc-500'
          )}>
            {totalDelta > 0 ? '+' : ''}<Counter target={totalDelta} />
          </span>
        </div>

        {/* Improvements count */}
        <div className="bg-black/30 rounded-2xl p-3 flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Improved</span>
          <span className="text-xl font-bebas font-black text-primary">
            <Counter target={improvementCount} />
            <span className="text-xs text-zinc-600 font-mono ml-1">×</span>
          </span>
        </div>

        {/* Best score */}
        <div className={cn(
          'rounded-2xl p-3 flex flex-col gap-1 transition-all duration-500',
          isNewBest ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-black/30'
        )}>
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-1">
            Best {isNewBest && <Flame className="w-3 h-3 text-amber-400" />}
          </span>
          <span className={cn('text-xl font-bebas font-black', isNewBest ? 'text-amber-400' : 'text-zinc-300')}>
            <Counter target={bestScore} />
          </span>
        </div>
      </div>

      {/* Readiness arc */}
      <div className="flex items-center gap-3 px-5 pb-4">
        <span className="text-[10px] text-zinc-600 font-mono">Readiness</span>
        <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-1000"
            style={{ width: `${currentReadiness}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-500">{initialReadiness}% → <span className="text-white font-bold">{currentReadiness}%</span></span>
      </div>

      {/* Timeline */}
      {entries.length > 0 && (
        <div className="border-t border-white/5 px-5 py-4 space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Timeline</span>
          {entries.map(e => <EntryRow key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  );
}
