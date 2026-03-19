"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/api-config";

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface ModelSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ModelSelector({ selectedId, onSelect }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch(ENDPOINTS.MODELS)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setModels(data);
      })
      .catch(err => console.error("Failed to fetch models", err));
  }, []);

  const selectedModel = Array.isArray(models) ? models.find(m => m.id === selectedId) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
      >
        <Cpu className="w-3.5 h-3.5 text-[#00E6A8]" />
        <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white uppercase tracking-wider">
          {selectedModel?.name || "Llama 3.3"}
        </span>
        <ChevronDown className={cn("w-3 h-3 text-zinc-500 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-2 space-y-1">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  selectedId === model.id
                    ? "bg-[#00E6A8]/10 text-[#00E6A8]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                {model.name}
                <span className="block text-[8px] opacity-40 font-mono mt-0.5">{model.provider}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
