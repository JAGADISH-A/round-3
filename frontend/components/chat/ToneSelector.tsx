"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Smile, Zap, BookOpen, Rocket, Ghost, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tone {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const TONES: Tone[] = [
  { id: "friendly", name: "Friendly", icon: <Smile className="w-3.5 h-3.5" /> },
  { id: "strict", name: "Strict", icon: <Zap className="w-3.5 h-3.5" /> },
  { id: "tutor", name: "Tutor", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: "motivational", name: "Motivational", icon: <Rocket className="w-3.5 h-3.5" /> },
  { id: "funny", name: "Funny", icon: <Ghost className="w-3.5 h-3.5" /> },
  { id: "mentor", name: "Mentor", icon: <GraduationCap className="w-3.5 h-3.5" /> },
];

interface ToneSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ToneSelector({ selectedId, onSelect }: ToneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedTone = TONES.find(t => t.id === selectedId) || TONES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
      >
        <span className="text-primary">{selectedTone.icon}</span>
        <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white uppercase tracking-wider">
          {selectedTone.name}
        </span>
        <ChevronDown className={cn("w-3 h-3 text-zinc-500 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-2 space-y-1">
            {TONES.map(tone => (
              <button
                key={tone.id}
                onClick={() => {
                  onSelect(tone.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                  selectedId === tone.id
                    ? "bg-primary/10 text-primary"
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                {tone.icon}
                {tone.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
