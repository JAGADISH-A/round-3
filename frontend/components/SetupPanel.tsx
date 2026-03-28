/**
 * SetupPanel.tsx
 * Gamified Setup Panel for BumbleBee AI Interview Simulator.
 */
"use client";

import { Mic, MicOff, Target, Brain, Award } from "lucide-react";

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

  const roles: Role[] = ["Frontend Developer", "Backend Developer", "Product Manager", "HR Interview", "Communication Practice"];
  const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
  const focusAreas: FocusArea[] = ["Behavioral Questions", "Communication", "Confidence Building", "Technical Clarity"];

  return (
    <div className="bg-[#18181b] border-2 border-zinc-800 border-b-[8px] rounded-[32px] p-6 sm:p-8 flex flex-col space-y-8 shadow-2xl relative overflow-hidden transition-all duration-300 h-full">
      
      {/* Playful Header */}
      <div className="relative z-10 text-center">
        <h2 className="text-2xl font-black text-white tracking-widest uppercase pb-1 drop-shadow-md">Session Setup</h2>
        <p className="text-sm font-bold text-zinc-400">Choose your path to mastery.</p>
      </div>

      <div className="space-y-6 relative z-10 flex-1">
        {/* Role Selector */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-black text-zinc-500 uppercase flex items-center gap-2"><Target size={14} className="text-[#1CB0F6]" /> Target Role</label>
          <div className="relative">
            <select 
              disabled={isActive}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-[#27272a] border-2 border-zinc-700 border-b-4 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#1CB0F6] disabled:opacity-50 transition-all appearance-none cursor-pointer"
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-black text-zinc-500 uppercase flex items-center gap-2"><Brain size={14} className="text-[#FFC800]" /> Difficulty Level</label>
          <div className="relative">
            <select 
              disabled={isActive}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full bg-[#27272a] border-2 border-zinc-700 border-b-4 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#FFC800] disabled:opacity-50 transition-all appearance-none cursor-pointer"
            >
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Focus Area Selector */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-black text-zinc-500 uppercase flex items-center gap-2"><Award size={14} className="text-[#58CC02]" /> Core Focus</label>
          <div className="relative">
            <select 
              disabled={isActive}
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value as FocusArea)}
              className="w-full bg-[#27272a] border-2 border-zinc-700 border-b-4 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#58CC02] disabled:opacity-50 transition-all appearance-none cursor-pointer"
            >
              {focusAreas.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Chunky Gamified CTA Button */}
      <div className="pt-2 relative z-10 mt-auto">
        <button
          onClick={onToggleInterview}
          className={`w-full flex items-center justify-center gap-3 py-5 rounded-[24px] font-black text-[18px] uppercase tracking-wider transition-all duration-100 ease-in-out border-2
            ${isActive 
              ? "bg-red-500 text-white border-red-700 border-b-[6px] active:border-b-2 active:translate-y-[4px] shadow-[0_0_20px_rgba(239,68,68,0.4)]" 
              : "bg-[#F5C518] text-black border-[#b38e0b] border-b-[8px] active:border-b-2 active:translate-y-[6px] shadow-[0_0_25px_rgba(245,197,24,0.3)] hover:brightness-110"
            }`}
        >
          {isActive ? <MicOff className="w-6 h-6 shrink-0" /> : <Mic className="w-6 h-6 shrink-0" />}
          {isActive ? "End Practice" : "Start Practice!"}
        </button>
      </div>
    </div>
  );
}
