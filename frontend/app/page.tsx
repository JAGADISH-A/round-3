"use client";

import React from "react";
import { ArrowRight, Sparkles, Shield, Zap, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020406] text-cyan-50 relative overflow-hidden font-nav">
      {/* HUD Background Elements */}
      <div className="scanline" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff05_1px,transparent_1px),linear-gradient(to_bottom,#00ffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-10 max-w-7xl mx-auto font-orbitron">
        <div className="flex items-center gap-4 group">
          <div className="relative w-12 h-12 border border-cyan-500/30 p-1 transition-all group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-500" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-cyan-500" />
            <Image src="/logo.png" alt="BumbleBee Logo" fill className="object-contain opacity-80" />
          </div>
          <span className="text-2xl tracking-[0.4em] text-white">HIVE <span className="text-cyan-400">OS</span></span>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-8 text-[10px] tracking-[0.3em] font-bold text-cyan-500/50 uppercase">
            <Link href="#features" className="hover:text-cyan-400 transition-colors py-2 border-b border-transparent hover:border-cyan-400">Features</Link>
            <Link href="#intel" className="hover:text-cyan-400 transition-colors py-2 border-b border-transparent hover:border-cyan-400">Intelligence</Link>
          </div>
          <Link href="/auth" className="tactical-button">
            INITIALIZE
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-10 py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center space-y-12 max-w-5xl"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-[10px] font-orbitron tracking-[0.4em] uppercase animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> STRATEGIC CAREER INTERFACE
          </div>

          <h1 className="text-6xl md:text-8xl font-orbitron leading-[1.1] tracking-tighter">
            ELEVATE YOUR <br />
            <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">DIGITAL PERSONA</span>
          </h1>

          <p className="text-lg md:text-xl text-cyan-500/60 max-w-3xl mx-auto leading-relaxed font-nav tracking-wide font-medium">
            AI-powered interview simulation, semantic resume hardware, <br className="hidden md:block" /> and neural roadmap synthesis for the modern elite developer.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 font-orbitron">
            <Link 
              href="/auth" 
              className="group relative px-12 py-5 bg-cyan-500 text-black font-bold text-lg tracking-widest transition-all hover:scale-105 shadow-[0_0_40px_rgba(0,255,255,0.3)]"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
            >
              <span className="flex items-center gap-3">
                ENTER ARENA 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link 
              href="/auth" 
              className="px-12 py-5 border border-cyan-500/30 text-cyan-400 font-bold text-lg tracking-widest hover:bg-cyan-500/5 transition-all"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
            >
              MISSION DEMO
            </Link>
          </div>
        </motion.div>

        {/* HUD Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32 max-w-6xl w-full px-4">
          {[
            { icon: Shield, label: "Neural Auth", desc: "Firebase Core" },
            { icon: Zap, label: "RAG Engine", desc: "Expert Context" },
            { icon: Globe, label: "Multilingual", desc: "EN + TA Support" },
            { icon: Sparkles, label: "Vision Lab", desc: "AI Body Analysis" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
              className="hud-panel p-6 group cursor-default transition-all hover:border-cyan-500/50"
            >
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-14 h-14 bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                  <item.icon className="w-7 h-7 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-orbitron font-bold text-xs tracking-[0.2em] text-cyan-400">{item.label}</h3>
                  <p className="text-[10px] text-cyan-500/40 uppercase font-tech tracking-widest">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
