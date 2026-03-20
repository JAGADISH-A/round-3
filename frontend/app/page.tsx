"use client";

import React from "react";
import { ArrowRight, Sparkles, Shield, Zap, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -ml-48 -mb-48 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image src="/logo.png" alt="BumbleBee Logo" fill className="object-contain" />
          </div>
          <span className="text-2xl font-bebas tracking-widest text-white">BumbleBee <span className="text-primary">AI</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-400 uppercase tracking-widest">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#about" className="hover:text-primary transition-colors">About</Link>
          </div>
          <Link href="/auth" className="px-6 py-2.5 bg-primary text-black rounded-xl font-bold text-sm tracking-wider hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,214,0,0.3)]">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 h-[calc(100vh-100px)] flex flex-col items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Next Gen Career Platform
          </div>

          <h1 className="text-7xl md:text-8xl font-bebas leading-[0.85] tracking-tight">
            YOUR AI-POWERED <br />
            <span className="text-primary italic">CAREER ASSISTANT</span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Master your interviews, build world-class resumes, and unlock your full potential <br className="hidden md:block" /> with the power of intelligent career coaching.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/auth" 
              className="group relative px-10 py-5 bg-primary text-black rounded-2xl font-bold text-lg flex items-center gap-3 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,214,0,0.2)]"
            >
              Let's Start 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/auth" 
              className="px-10 py-5 bg-zinc-900 border border-white/5 text-white rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all"
            >
              Watch Demo
            </Link>
          </div>
        </motion.div>

        {/* Floating Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-32 max-w-5xl w-full">
          {[
            { icon: Shield, label: "Secure Auth", desc: "Firebase Protected" },
            { icon: Zap, label: "RAG AI", desc: "Expert Context" },
            { icon: Globe, label: "Multilingual", desc: "English & Tamil" },
            { icon: Sparkles, label: "Vision Lab", desc: "AI Body Analysis" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm tracking-widest uppercase">{item.label}</h3>
                <p className="text-xs text-zinc-500 font-medium">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
