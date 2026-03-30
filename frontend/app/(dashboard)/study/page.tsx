"use client";

import React, { useState } from "react";
import { BookOpen, Monitor, Library, Zap, Activity, Info, Sparkles, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoTheater } from "@/components/study/VideoTheater";
import { VideoCard } from "@/components/study/VideoCard";
import { cn } from "@/lib/utils";

const VIDEOS = [
  { id: 'v1', title: 'Mastering Conflict Management', src: '/video/conflict management.mp4', duration: '4:15', category: 'Soft Skills', advice: "De-escalation starts with active listening. Mirror the problem, not the emotion to maintain neural alignment during high-friction cycles." },
  { id: 'v2', title: 'Winning Interview Strategies', src: '/video/interview.mp4', duration: '3:45', category: 'Career', advice: "Confidence is 90% preparation. Re-scan your JD match scores and ensure your Impact Points are synchronized before the uplink." },
  { id: 'v3', title: 'Appreciation & Recognition', src: '/video/recognition.mp4', duration: '3:20', category: 'Management', advice: "Acknowledge the effort, not just the result. Immediate feedback is 4x more impactful for reinforcing mission-critical behaviors." },
  { id: 'v4', title: 'The Art of Saying No', src: '/video/saying no.mp4', duration: '2:55', category: 'Personal Growth', advice: "A 'No' to others is a 'Yes' to your focus. Protect your bandwidth like a core mission to avoid system-wide burnout." },
];

export default function StudyPage() {
  const [activeVideo, setActiveVideo] = useState(VIDEOS[0]);
  const [showAdvice, setShowAdvice] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 animate-in fade-in duration-700 relative">
      
      {/* NEURAL ADVICE OVERLAY */}
      <AnimatePresence>
        {showAdvice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-xl bg-zinc-900 border border-cyan-500/30 rounded-[40px] p-10 relative overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.15)]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_15px_cyan]" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-orbitron text-white uppercase tracking-tighter">Neural_Advice_Detected</h3>
                  <p className="text-[10px] text-cyan-500/40 font-tech tracking-[0.3em] uppercase">Module_Conclusion_Feedback / v1.0</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-lg font-nav text-zinc-300 leading-relaxed italic border-l-4 border-cyan-500/40 pl-6 py-2">
                  "{activeVideo.advice}"
                </p>
                
                <button 
                  onClick={() => setShowAdvice(false)}
                  className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,255,255,0.2)]"
                >
                  ACKNOWLEDGE_PROTOCOL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HUD HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Library className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-bebas tracking-wider text-white uppercase tracking-tighter">Neural_Library</h1>
            </div>
            <p className="text-xs text-cyan-500/60 font-mono tracking-[0.2em] font-bold uppercase">Archive_System / Education_Node</p>
          </div>

          <div className="flex items-center gap-8 text-[10px] font-orbitron text-zinc-500 uppercase tracking-widest hidden lg:flex">
             <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-500" />
                <span>Theater_Active</span>
             </div>
             <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Premium_Courseware: Unlocked</span>
             </div>
             <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
                <Zap className="w-4 h-4" />
                <span>Neural_Sync: Online</span>
             </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* THEATER VIEW */}
          <div className="lg:col-span-2 space-y-8">
            <VideoTheater 
                src={activeVideo.src} 
                title={activeVideo.title} 
                onEnded={() => setShowAdvice(true)}
            />

            {/* Video Info Panel */}
            <div className="hud-panel p-8 bg-zinc-900/40 border-white/5 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div>
                        <span className="inline-block px-3 py-1 bg-cyan-500/10 rounded-full text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-3">
                          {activeVideo.category}
                        </span>
                        <h2 className="text-2xl font-orbitron text-white uppercase tracking-tighter">{activeVideo.title}</h2>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 text-[11px] font-nav leading-relaxed text-zinc-400">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-white/40 uppercase tracking-widest text-[9px] font-black">
                            <Info className="w-3 h-3" /> Core_Objective
                        </div>
                        <p className="border-l-2 border-cyan-500/20 pl-4 py-1 italic shadow-[0_0_20px_rgba(0,255,255,0.02)]">
                           Accelerate professional growth through neural-linked educational broadcasting. This module provides tactical insights into {activeVideo.category.toLowerCase()} dynamics.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-white/40 uppercase tracking-widest text-[9px] font-black">
                            <Clock className="w-3 h-3" /> Duration_Report
                        </div>
                        <p className="border-l-2 border-emerald-500/20 pl-4 py-1">
                           Neural session duration: {activeVideo.duration} mins. Estimated retention: 94%.
                        </p>
                    </div>
                </div>
            </div>
          </div>

          {/* SELECTION LIST */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Available_Archive</h4>
                <span className="text-[8px] font-mono text-zinc-600">Archive_Sync_Stable // v4.0</span>
            </div>
            
            <div className="space-y-4 custom-scrollbar max-h-[700px] overflow-y-auto pr-2">
              {VIDEOS.map((video) => (
                <VideoCard 
                  key={video.id}
                  {...video}
                  isActive={activeVideo.id === video.id}
                  onClick={() => setActiveVideo(video)}
                />
              ))}
            </div>

            {/* System Status Display */}
            <div className="p-6 bg-black/40 border border-white/5 rounded-[30px] space-y-4 mt-6">
                <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase tracking-tighter">
                    <span>Neural_Load</span>
                    <span className="text-cyan-500">OPTIMAL</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]" />
                </div>
                <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-600">
                    <Activity className="w-3 h-3 text-cyan-500" />
                    SYSTEM_LINK_ACTIVE_NO_ERRORS_DETECTED
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
