"use client";

import React, { useEffect, useState } from "react";
import { X, Sparkles, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const THIRUKURALS = [
  { text: "கற்க கசடறக் கற்பவை கற்றபின் நிற்க அதற்குத் தக.", trans: "Learn deeply what you must learn; then live by its truth." },
  { text: "முயற்சி திருவினை ஆக்கும் முயற்றின்மை இன்மை புகுத்தி விடும்.", trans: "Effort yields success; its absence leads to poverty." },
];

export default function ThirukuralPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [kural, setKural] = useState(THIRUKURALS[0]);

  useEffect(() => {
    const hasShown = sessionStorage.getItem("kuralShown");
    if (!hasShown) {
      setTimeout(() => {
        setKural(THIRUKURALS[Math.floor(Math.random() * THIRUKURALS.length)]);
        setIsOpen(true);
      }, 1500);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("kuralShown", "true");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 2 }}
            className="relative w-full max-w-lg bg-zinc-900 border-2 border-primary/20 rounded-[40px] p-10 shadow-2xl overflow-hidden"
          >
            {/* Pattern */}
            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="relative space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                    <Sparkles size={10} /> Daily Wisdom
                  </div>
                  <h3 className="text-4xl font-bebas tracking-wider text-white">Thirukural</h3>
                </div>
                <button onClick={handleClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-10 py-4">
                <div className="space-y-4">
                  {kural.text.split(" ").reduce((acc: string[][], word, i) => {
                    if (i === 4) acc.push([]);
                    acc[acc.length - 1].push(word);
                    return acc;
                  }, [[]]).map((line, i) => (
                    <p key={i} className="text-3xl font-bold leading-relaxed text-primary font-grotesk text-center tracking-widest italic animate-fade-in">
                      {line.join(" ")}
                    </p>
                  ))}
                </div>
                <div className="h-px w-16 bg-white/10 mx-auto" />
                <p className="text-zinc-500 text-sm text-center font-medium leading-loose tracking-wide max-w-xs mx-auto italic">
                  {kural.trans}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-primary text-black h-14 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/10 active:scale-95"
                >
                  <Sparkles size={18} />
                  Explain this
                </button>
                <button
                  onClick={handleClose}
                  className="px-8 bg-[#111111] text-zinc-400 border border-white/5 h-14 rounded-2xl font-bold hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
