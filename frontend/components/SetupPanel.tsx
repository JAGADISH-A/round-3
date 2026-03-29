/**
 * SetupPanel.tsx
 * Gamified Setup Panel for BumbleBee AI Interview Simulator.
 */
"use client";

import { Mic, MicOff, Target, Brain, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export type Role = "Frontend Developer" | "Backend Developer" | "Product Manager" | "HR Interview" | "Communication Practice";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type FocusArea = "Behavioral Questions" | "Communication" | "Confidence Building" | "Technical Clarity";

interface SetupPanelProps {
  isActive: boolean;
  role: Role;
  setRole: (r: Role) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  focusArea: FocusArea;
  setFocusArea: (f: FocusArea) => void;
  onToggleInterview: () => void;
}

export default function SetupPanel({
  isActive, role, setRole, difficulty, setDifficulty, focusArea, setFocusArea, onToggleInterview
}: SetupPanelProps) {
  const { lang } = useLanguage();
  const t = translations[lang];

  const roles: Role[] = ["Frontend Developer", "Backend Developer", "Product Manager", "HR Interview", "Communication Practice"];
  const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
  const focusAreas: FocusArea[] = ["Behavioral Questions", "Communication", "Confidence Building", "Technical Clarity"];

  // Mapping internal keys to translation tokens
  const roleMap: Record<Role, string> = {
    "Frontend Developer": t.setup.roles.frontend,
    "Backend Developer": t.setup.roles.backend,
    "Product Manager": t.setup.roles.product,
    "HR Interview": t.setup.roles.hr,
    "Communication Practice": t.setup.roles.communication
  };

  const difficultyMap: Record<Difficulty, string> = {
    "Beginner": t.setup.difficulties.beginner,
    "Intermediate": t.setup.difficulties.intermediate,
    "Advanced": t.setup.difficulties.advanced
  };

  const focusAreaMap: Record<FocusArea, string> = {
    "Behavioral Questions": t.setup.focus_areas.behavioral,
    "Communication": t.setup.focus_areas.communication,
    "Confidence Building": t.setup.focus_areas.confidence,
    "Technical Clarity": t.setup.focus_areas.technical
  };

  return (
    <div className="hud-panel p-6 sm:p-8 flex flex-col space-y-8 relative overflow-hidden transition-all duration-300 h-full bg-black/40">
      
      {/* HUD Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-3 bg-cyan-500 animate-pulse" />
          <h2 className="text-xl font-orbitron font-black text-white tracking-widest uppercase">{t.setup.title}</h2>
        </div>
        <p className="text-[10px] font-tech text-cyan-500/40 uppercase tracking-[0.2em]">{t.setup.subtitle}</p>
      </div>

      <div className="space-y-6 relative z-10 flex-1">
        {/* Role Selector */}
        <div className="flex flex-col space-y-2">
          <label className="text-[10px] font-orbitron font-black text-cyan-500/60 uppercase flex items-center gap-2 tracking-widest">
            <Target size={12} className="text-cyan-400" /> {t.setup.target}
          </label>
          <div className="relative">
            <select 
              disabled={isActive}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-none pl-4 pr-10 py-3 text-xs font-orbitron text-cyan-100 focus:outline-none focus:border-cyan-400 focus:bg-cyan-500/10 disabled:opacity-50 transition-all appearance-none cursor-pointer tracking-wider"
            >
              {roles.map(r => <option key={r} value={r} className="bg-zinc-950 text-cyan-100">{roleMap[r].toUpperCase()}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-500/40">
              <div className="w-2 h-2 border-b-2 border-r-2 border-current rotate-45" />
            </div>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex flex-col space-y-2">
          <label className="text-[10px] font-orbitron font-black text-cyan-500/60 uppercase flex items-center gap-2 tracking-widest">
            <Brain size={12} className="text-amber-400" /> {t.setup.difficulty}
          </label>
          <div className="relative">
            <select 
              disabled={isActive}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-none pl-4 pr-10 py-3 text-xs font-orbitron text-cyan-100 focus:outline-none focus:border-amber-400 focus:bg-amber-500/5 disabled:opacity-50 transition-all appearance-none cursor-pointer tracking-wider"
            >
              {difficulties.map(d => <option key={d} value={d} className="bg-zinc-950 text-cyan-100">{difficultyMap[d].toUpperCase()}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500/40">
              <div className="w-2 h-2 border-b-2 border-r-2 border-current rotate-45" />
            </div>
          </div>
        </div>

        {/* Focus Area Selector */}
        <div className="flex flex-col space-y-2">
          <label className="text-[10px] font-orbitron font-black text-cyan-500/60 uppercase flex items-center gap-2 tracking-widest">
            <Award size={12} className="text-emerald-400" /> {t.setup.focus}
          </label>
          <div className="relative">
            <select 
              disabled={isActive}
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value as FocusArea)}
              className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-none pl-4 pr-10 py-3 text-xs font-orbitron text-cyan-100 focus:outline-none focus:border-emerald-400 focus:bg-emerald-500/5 disabled:opacity-50 transition-all appearance-none cursor-pointer tracking-wider"
            >
              {focusAreas.map(f => <option key={f} value={f} className="bg-zinc-950 text-cyan-100">{focusAreaMap[f].toUpperCase()}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500/40">
              <div className="w-2 h-2 border-b-2 border-r-2 border-current rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-2 relative z-10 mt-auto">
        <button
          onClick={onToggleInterview}
          className={cn(
            "tactical-button w-full h-16 text-sm font-orbitron",
            isActive ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : ""
          )}
        >
          {isActive ? (
            <div className="flex items-center justify-center gap-2">
              <MicOff className="w-5 h-5" /> 
              <span>{t.setup.stop}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Mic className="w-5 h-5" />
              <span>{t.setup.start}</span>
            </div>
          )}
        </button>
      </div>

      {/* Decorative Accents */}
      <div className="absolute bottom-0 right-0 w-24 h-24 opacity-5 pointer-events-none">
         <div className="absolute bottom-4 right-4 border-b-2 border-r-2 border-cyan-500 w-8 h-8" />
      </div>
    </div>
  );
}
