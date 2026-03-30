"use client";

import React, { useState } from "react";
import { BookOpen, Terminal, PenTool, Mic, Brain, Activity, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LearnSection } from "@/components/arena/LearnSection";
import { TestSection } from "@/components/arena/TestSection";
import { WritingSection } from "@/components/arena/WritingSection";
import { SpeakingSection } from "@/components/arena/SpeakingSection";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

type Mode = "learn" | "test" | "writing" | "speaking";

const MODES: { id: Mode; icon: any; label_key: string; description_key: string; color: string }[] = [
  { id: "learn", icon: BookOpen, label_key: "learn", description_key: "Learn", color: "#00ffff" },
  { id: "test", icon: Terminal, label_key: "test", description_key: "Test", color: "#0ea5e9" },
  { id: "writing", icon: PenTool, label_key: "writing", description_key: "Writing", color: "#8b5cf6" },
  { id: "speaking", icon: Mic, label_key: "speaking", description_key: "Speaking", color: "#10b981" },
];

export default function ArenaPage() {
  const { lang } = useLanguage();
  const t = translations[lang].arena;
  const [activeMode, setActiveMode] = useState<Mode>("learn");

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HUD HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Brain className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-bebas tracking-wider text-white uppercase">{t.title}</h1>
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse ml-2 block sm:inline-block">
                Coaching_Mode_v2.0_Active
              </div>
            </div>
            <p className="text-xs text-cyan-500/60 font-mono tracking-[0.2em] font-bold uppercase">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-8 text-[10px] font-orbitron text-zinc-500 uppercase tracking-widest hidden lg:flex">
             <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                <span>Uplink_Secure</span>
             </div>
             <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Neural_Sync: {Math.floor(Math.random() * 20) + 80}%</span>
             </div>
             <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>System_Stable</span>
             </div>
          </div>
        </header>

        {/* MODE SWITCHER HUD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={cn(
                "p-8 rounded-[40px] border transition-all group relative overflow-hidden flex flex-col items-center text-center",
                activeMode === mode.id
                  ? "bg-cyan-500/5 border-cyan-500/40 text-white shadow-[0_0_30px_rgba(0,255,255,0.05)]"
                  : "bg-black/40 border-white/5 text-zinc-600 hover:border-cyan-500/20 hover:text-zinc-400"
              )}
            >
              <div 
                className={cn(
                  "p-4 rounded-2xl mb-4 transition-all duration-500",
                  activeMode === mode.id ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,255,255,0.4)]" : "bg-zinc-900 group-hover:bg-cyan-500/20"
                )}
              >
                <mode.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-orbitron tracking-[0.3em] font-black uppercase mb-1">{t.modes[mode.id]}</span>
              <span className="text-[9px] font-mono opacity-40 uppercase tracking-tighter">Module_0{MODES.indexOf(mode) + 1}</span>
              
              {activeMode === mode.id && (
                <motion.div 
                    layoutId="active-nav"
                    className="absolute -bottom-1 inset-x-0 h-1 bg-cyan-500"
                />
              )}
            </button>
          ))}
        </div>

        {/* MAIN ARENA AREA */}
        <main className="min-h-[600px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {activeMode === "learn" && <LearnSection />}
              {activeMode === "test" && <TestSection />}
              {activeMode === "writing" && <WritingSection />}
              {activeMode === "speaking" && <SpeakingSection />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* HUD FOOTER */}
        <footer className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-6 rounded-full border border-white/20 bg-black flex items-center px-1">
                <div className="w-4 h-4 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_cyan]" />
            </div>
            <span className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase">Global_FFMPEG_Link_Stable</span>
          </div>
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">© 2026 BumbleBee AI // Neural_OS_v4.5.2_Standard_Edition</p>
        </footer>
      </div>
    </div>
  );
}
