"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, UserSquare2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/api-config";

interface Persona {
  id: string;
  name: string;
}

interface PersonaSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function PersonaSelector({ selectedId, onSelect }: PersonaSelectorProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch(ENDPOINTS.PERSONAS)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPersonas(data);
      })
      .catch(err => console.error("Failed to fetch personas", err));
  }, []);

  const selectedPersona = Array.isArray(personas) ? personas.find(p => p.id === selectedId) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
      >
        <UserSquare2 className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white uppercase tracking-wider">
          {selectedPersona?.name || "Career Coach"}
        </span>
        <ChevronDown className={cn("w-3 h-3 text-zinc-500 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-52 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-2 space-y-1">
            {personas.map(persona => (
              <button
                key={persona.id}
                onClick={() => {
                  onSelect(persona.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  selectedId === persona.id
                    ? "bg-primary/10 text-primary"
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                {persona.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
