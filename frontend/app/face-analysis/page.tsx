"use client";

import React from "react";
import { 
  Camera, 
  Sparkles, 
  Activity,
  ShieldCheck,
  Zap,
  Cpu,
  RefreshCw
} from "lucide-react";
import { FaceAnalyzer } from "@/components/vision/FaceAnalyzer";

export default function FaceAnalysisPage() {
  return (
    <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden">
      <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Vision Intelligence</h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Live Face Analysis System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Vision Status</span>
                <span className="text-[10px] text-blue-400 font-mono">Stream Active</span>
             </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
          
          {/* Hero Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 liquid-glass p-12 rounded-[48px] border border-white/5 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="absolute top-0 left-0 p-10 opacity-5">
                    <Activity className="w-40 h-40" />
                </div>
                
                <div className="space-y-6 relative z-10 w-full md:w-auto">
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase text-blue-400 tracking-widest mb-4">
                            <Sparkles className="w-3 h-3" /> Real-time Tracking
                        </span>
                        <h1 className="text-7xl font-bebas tracking-tighter leading-none mb-2">VISION <span className="text-blue-400">CORE</span></h1>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-[0.3em]">AI-Powered Facial Behavior Analysis</p>
                    </div>

                    <div className="flex gap-10">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Protocol</span>
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                Encrypted
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Engine</span>
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-blue-400" />
                                Haar-Vision
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Latency</span>
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                {`< 50ms`}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative shrink-0 w-full md:w-auto flex justify-center">
                    <FaceAnalyzer />
                </div>
            </div>

            <div className="lg:col-span-4 liquid-glass p-10 rounded-[48px] border border-white/5 flex flex-col justify-between overflow-hidden">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Analysis Logs</h3>
                        <RefreshCw className="w-3 h-3 text-blue-400 animate-spin-slow" />
                    </div>
                    
                    <div className="space-y-4">
                        <p className="text-[11px] text-zinc-400 font-mono leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                          The Vision AI module uses OpenCV Haar Cascades for initial detection. 
                          It monitors facial posture and presence to provide behavioral feedback during virtual sessions.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <span className="block text-[9px] text-zinc-500 uppercase font-black mb-1">Status</span>
                            <span className="text-xs font-bold text-emerald-400 uppercase">Calibrated</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <span className="block text-[9px] text-zinc-500 uppercase font-black mb-1">Version</span>
                            <span className="text-xs font-bold text-white uppercase font-mono">v1.2-MVP</span>
                          </div>
                        </div>
                    </div>
                </div>
                <div className="pt-8 border-t border-white/5">
                    <p className="text-[10px] text-zinc-600 font-mono leading-relaxed italic uppercase">
                        Capturing frames at 0.5Hz frequency to maintain optimal CPU stability.
                    </p>
                </div>
            </div>
          </section>

          {/* Vision Insight Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
             <div className="liquid-glass p-10 rounded-[48px] border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest mb-3">Privacy Shield</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-mono">
                  All image processing occurs strictly on your local AI service. No video data or frames are ever uploaded to external cloud servers.
                </p>
             </div>
             <div className="liquid-glass p-10 rounded-[48px] border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest mb-3">Modular Engine</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-mono">
                  The Vision Service runs as an independent microservice on port 8002, isolating CPU-intensive tasks from the main application logic.
                </p>
             </div>
             <div className="liquid-glass p-10 rounded-[48px] border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest mb-3">Future Signals</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-mono">
                  Upcoming updates will include gaze tracking, sentiment analysis, and body language posture correction to enhance interview readiness.
                </p>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
}
