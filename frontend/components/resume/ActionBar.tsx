"use client";

import React from "react";
import { Save, Download, Sparkles, MessageSquare, X, Eye, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  onApply: () => void;
  onDiscuss: () => void;
  onSave: () => void;
  onDownload: () => void;
  onExit?: () => void;
  isApplying?: boolean;
  isDiscussing?: boolean;
  isSaving?: boolean;
  isDownloading?: boolean;
  hasResume?: boolean;
  isEditMode?: boolean;
  targetRole?: string;
}

const ActionBar = ({
  onApply,
  onDiscuss,
  onSave,
  onDownload,
  onExit,
  isApplying,
  isDiscussing,
  isSaving,
  isDownloading,
  hasResume = true,
  isEditMode = false,
  targetRole,
}: ActionBarProps) => {
  return (
    <div className="sticky top-0 z-[100] w-full bg-black/60 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">BumbleBee AI</span>
          <span className="text-xs font-bold text-white uppercase tracking-wider">Optimizer</span>
        </div>
        
        <div className="h-8 w-px bg-white/5" />
        
        <div className="flex items-center gap-3">
          {/* ✨ IMPROVE (Sparkles) */}
          {hasResume && (
            <button
              onClick={onApply}
              disabled={isApplying}
              title="✨ Improve Resume"
              className={cn(
                "group relative flex items-center justify-center p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black transition-all duration-300 active:scale-90 disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_20px_rgba(255,214,0,0.1)]",
                isApplying && "animate-pulse border-primary ring-2 ring-primary/20"
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span className="sr-only">Improve</span>
            </button>
          )}

          {targetRole && (
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 transition-all duration-500 animate-in fade-in zoom-in-95">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Target</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider truncate max-w-[120px]">{targetRole}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onExit && (
          <button
            onClick={onExit}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 text-[10px] font-black uppercase tracking-widest",
              isEditMode 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                : "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
            )}
          >
            {isEditMode ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
            {isEditMode ? "Dashboard" : "Live Edit"}
          </button>
        )}

        <div className="h-6 w-px bg-white/5 mx-1" />
        {/* AUXILIARY: Save */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-zinc-400 text-[11px] font-bold uppercase tracking-widest hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200 active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? "Saving..." : "Save"}
        </button>

        {/* AUXILIARY: Download */}
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-zinc-400 text-[11px] font-bold uppercase tracking-widest hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>

        {onExit && (
          <>
            <div className="h-6 w-px bg-white/5 mx-1" />
            <button
              onClick={onExit}
              className="p-2 rounded-full border border-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionBar;
