"use client";

import React, { useState, useEffect } from "react";
import { Paperclip, SendHorizonal } from "lucide-react";
import PersonaSelector from "./PersonaSelector";
import ToneSelector from "./ToneSelector";
import { ChatInputSubmit, ChatInputTextArea } from "./ChatInput";
import { cn } from "@/lib/utils";

interface PromptBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (model: string, persona: string, tone: string) => void;
  loading: boolean;
  initialPersona?: string;
}

export default function PromptBar({ value, onChange, onSubmit, loading, initialPersona }: PromptBarProps) {
  const model = "llama33"; // Model is hidden for now as per requirements
  const [persona, setPersona] = useState("career_coach");
  const [tone, setTone] = useState("friendly");
  const [mounted, setMounted] = useState(false);

  // Sync with initialPersona or localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (initialPersona) {
      setPersona(initialPersona);
    } else {
      const savedPersona = localStorage.getItem("careerspark_persona");
      if (savedPersona) setPersona(savedPersona);
    }
    
    const savedTone = localStorage.getItem("careerspark_tone");
    if (savedTone) setTone(savedTone);
  }, [initialPersona]);

  // Save to localStorage whenever they change (only after mounting)
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("careerspark_persona", persona);
    localStorage.setItem("careerspark_tone", tone);
  }, [persona, tone, mounted]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(model, persona, tone);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] border-2 border-white/8 rounded-2xl focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all p-2 gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative z-10">
      
      {/* Top Controls: Persona and Tone Selectors */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 px-1">
        <PersonaSelector selectedId={persona} onSelect={setPersona} />
        <div className="w-[1px] h-3 bg-white/10 mx-1" />
        <ToneSelector selectedId={tone} onSelect={setTone} />
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-3 px-2 py-1">
        <button className="p-1.5 text-zinc-700 hover:text-[#FFD600] transition-colors shrink-0">
          <Paperclip className="w-4 h-4" />
        </button>
        
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about roadmaps, interviews, or careers..."
          rows={1}
          className="flex-1 bg-transparent text-white placeholder:text-zinc-700 py-1.5 text-[13px] font-mono leading-relaxed outline-none resize-none"
          disabled={loading}
        />

        <button
          onClick={() => onSubmit(model, persona, tone)}
          disabled={loading || !value.trim()}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0",
            loading || !value.trim() 
              ? "bg-zinc-800 text-zinc-600 grayscale" 
              : "bg-[#FFD600] text-black shadow-[0_0_20px_rgba(255,214,0,0.2)] hover:scale-105 active:scale-95"
          )}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <SendHorizonal className="w-4 h-4 font-black" />
          )}
        </button>
      </div>
    </div>
  );
}
