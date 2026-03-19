"use client";

import React from "react";
import { ArrowRight, Rocket, Target, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8">
          <Zap className="w-3 h-3" /> Alpha Access
        </div>
        <h1 className="text-6xl font-bold font-bebas tracking-tight mb-6 text-white leading-[0.9]">
          Elevate Your <span className="text-blue-500">Career</span> With Intelligence
        </h1>
        <p className="text-xl text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto">
          The ultimate AI platform for students to master interview skills, analyze resumes, and discover their ideal career path.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Link href="/chat" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            Start AI Coaching <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/voice" className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold border border-white/5 transition-all">
            Voice Analysis
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-24">
          {[
            { icon: Rocket, label: "Fast Growth", desc: "Accelerate your career trajectory" },
            { icon: Target, label: "Precision", desc: "Expert guidance tailored to you" },
            { icon: Zap, label: "Real-time", desc: "Instant feedback on your performance" },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                <feature.icon className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">{feature.label}</h3>
                <p className="text-sm text-zinc-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
