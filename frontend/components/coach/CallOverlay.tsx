"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, MicOff, Mic, Settings, Volume2, ShieldCheck, Zap } from "lucide-react";
import { NeuralOscillator } from "./NeuralOscillator";
import { cn } from "@/lib/utils";

interface CallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioTitle: string;
  scenarioData?: any;
  state: "idle" | "listening" | "thinking" | "speaking" | "connecting";
  activeNode: number;
  transcript?: string;
}

export function CallOverlay({ 
  isOpen, 
  onClose, 
  scenarioTitle, 
  scenarioData, 
  state, 
  activeNode, 
  transcript 
}: CallOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 1.1, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-between p-12 bg-black/90 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] border border-cyan-500/20 shadow-[0_0_100px_rgba(0,255,255,0.1)]"
        >
          {/* Animated Background Grids */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1),transparent_70%)]" />
          </div>

          {/* Header Link Info */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="text-[10px] font-orbitron font-black text-cyan-400/60 uppercase tracking-widest block leading-none mb-1">Link_Secure</span>
                <span className="text-[9px] font-mono text-cyan-500/40 uppercase tracking-tighter">NODE_0{activeNode}_ARENA_COMM_v6.1</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-cyan-500/60 ml-2">Encrypted</span>
            </div>
          </div>

          {/* Center Identity Section */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative">
              {/* Soul Ring */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-[-40px] rounded-full bg-cyan-500 blur-2xl"
              />
              
              {/* Profile Avatar */}
              <div className="w-40 h-40 rounded-full bg-zinc-900 border-4 border-white/5 relative flex items-center justify-center p-1 group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 rounded-full border border-cyan-500/30 group-hover:border-cyan-500/60 transition-colors" />
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-2 border-white/10">
                   {/* This would be an image if we had persona avatars, for now it's a sleek icon placeholder */}
                   <span className="text-4xl">🤖</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-cyan-500 px-4 py-1 rounded-full shadow-[0_0_20px_rgba(0,255,255,0.4)] text-[10px] font-black uppercase text-black tracking-[0.2em] animate-in slide-in-from-bottom-2">
                {state}
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-orbitron font-black tracking-tighter uppercase text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {scenarioTitle}
              </h2>
              <p className="text-cyan-500/40 font-tech text-xs uppercase tracking-[0.3em]">
                NEURAL_LINK_ESTABLISHED
              </p>
            </div>
          </div>

          {/* Neural Oscillator Section */}
          <div className="relative z-10 w-full max-w-lg space-y-8">
            <NeuralOscillator isSpeaking={state === "speaking"} />
            
            {/* Live Transcript Bubble */}
            <div className="min-h-[60px] flex items-center justify-center px-12">
               <motion.p 
                key={transcript}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm font-nav text-cyan-100/60 italic leading-relaxed"
               >
                 {transcript ? `"${transcript}"` : state === "listening" ? "Waiting for response..." : "Linking connection nodes..."}
               </motion.p>
            </div>
          </div>

          {/* Tactical Bottom Controls */}
          <div className="relative z-10 w-full flex items-center justify-center gap-10 border-t border-white/5 pt-12">
            <ControlBtn icon={<Mic className="w-6 h-6" />} label="Mute" />
            
            <button 
              onClick={onClose}
              className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:scale-110 active:scale-95 transition-all group"
            >
              <PhoneOff className="w-8 h-8 group-hover:rotate-12 transition-transform" />
            </button>
            
            <ControlBtn icon={<Settings className="w-6 h-6" />} label="Setup" />
          </div>

          {/* Corner Decals */}
          <div className="absolute bottom-6 left-6 text-[8px] font-mono text-white/5 uppercase tracking-[1em]">
             Sector_Comm_V6
          </div>
          <div className="absolute top-6 right-6 flex gap-1 opacity-20">
             <div className="w-1 h-3 bg-cyan-400" />
             <div className="w-1 h-1 bg-cyan-400" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ControlBtn({ icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 group cursor-pointer">
      <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-white/10 group-hover:border-cyan-500/40 transition-all text-white/60 group-hover:text-cyan-400">
        {icon}
      </div>
      <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500 group-hover:text-cyan-500 transition-colors">{label}</span>
    </div>
  );
}
