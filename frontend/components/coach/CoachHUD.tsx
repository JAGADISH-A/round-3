"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StatProps {
  label: string;
  value: number;
  color: string;
  icon?: string;
}

const StatBar = ({ label, value, color, icon }: StatProps) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] font-orbitron tracking-tighter text-cyan-400/80 uppercase">
        {icon} {label}
      </span>
      <span className="text-[12px] font-tech text-white glow-sm">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-cyan-950/30 overflow-hidden relative border border-cyan-500/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full ${color} shadow-[0_0_10px_rgba(0,255,255,0.3)]`}
      />
      {/* Glitch Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-full scan-beam opacity-20" />
    </div>
  </div>
);

interface CoachHUDProps {
  stats: {
    clarity: number;
    confidence: number;
    eq: number;
    overall_hp: number;
  };
  coachTip?: string;
  scenarioTitle?: string;
}

export const CoachHUD = ({ stats, coachTip, scenarioTitle }: CoachHUDProps) => {
  return (
    <div className="hud-panel p-6 w-full lg:w-80 flex flex-col gap-6 animate-hud bg-black/40 backdrop-blur-md border-cyan-500/30">
      {/* Header */}
      <div className="border-b border-cyan-500/20 pb-4">
        <h3 className="text-xs text-cyan-500/60 font-orbitron mb-1 tracking-widest">
          SYSTEM.COACH_READY
        </h3>
        <h2 className="text-lg font-orbitron text-white glow-md truncate">
          {scenarioTitle || "MASTERY_ARENA"}
        </h2>
      </div>

      {/* HP GAUGE */}
      <div className="relative pt-2">
        <div className="flex justify-between items-end mb-2">
           <span className="text-[10px] font-orbitron text-red-500 glow-sm tracking-widest">HP / PROFICIENCY</span>
           <span className="text-xl font-orbitron text-white leading-none">{stats.overall_hp}%</span>
        </div>
        <div className="h-4 w-full bg-red-950/20 border border-red-500/20 relative overflow-hidden">
          <motion.div
            animate={{ width: `${stats.overall_hp}%` }}
            className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        </div>
      </div>

      {/* DETAILED STATS */}
      <div className="mt-4">
        <StatBar label="Clarity" value={stats.clarity} color="bg-cyan-400" icon="◈" />
        <StatBar label="Confidence" value={stats.confidence} color="bg-blue-500" icon="▲" />
        <StatBar label="EQ / Empathy" value={stats.eq} color="bg-indigo-500" icon="❤" />
      </div>

      {/* COACH TIP (GAME HINT) */}
      <AnimatePresence mode="wait">
        {coachTip && (
          <motion.div
            key={coachTip}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="mt-auto pt-4 border-t border-cyan-500/20"
          >
            <div className="flex gap-2">
              <div className="w-1 h-full bg-cyan-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-orbitron text-cyan-500/80 mb-1">COACH_ADVICE_LOG</span>
                <p className="text-[11px] font-nav text-cyan-100/90 leading-relaxed italic capitalize">
                  "{coachTip}"
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYSTEM DECORATION */}
      <div className="absolute bottom-2 right-2 opacity-20 pointer-events-none">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <path d="M0 0h10v2H2v8H0V0zm30 0h10v10h-2V2h-8V0zM0 30v10h10v-2H2v-8H0zm40 0v10H30v-2h8v-8h2z" fill="currentColor" className="text-cyan-500" />
        </svg>
      </div>
    </div>
  );
};
