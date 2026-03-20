"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
  Award,
  ArrowRight,
  Target,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/api-config";
import { RoadmapTimeline } from "@/components/roadmap/RoadmapTimeline";

interface Skill {
  name: string;
  completed: boolean;
}

interface RoadmapStage {
  phase: string;
  skills: Skill[];
}

interface RoadmapData {
  type: string;
  role: string;
  title: string;
  stages: RoadmapStage[];
  completed_count: number;
  next_recommended_skill: string;
  missing_skills: string[];
  mentor_note: string;
}

export default function RoadmapPage() {
  const [goal, setGoal] = useState<string>("");
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // 1. Initial Load: Detect Goal from Resume Analysis
    const resumeDataStr = localStorage.getItem("careerspark_last_resume");
    let detectedGoal = "Software Engineer";
    let resumeAnalysis = null;
    
    if (resumeDataStr) {
      try {
        resumeAnalysis = JSON.parse(resumeDataStr);
        detectedGoal = resumeAnalysis.confirmed_role || resumeAnalysis.inferred_role || "Software Engineer";
      } catch (e) {
        console.error("Failed to parse resume data", e);
      }
    }
    
    setGoal(detectedGoal);
    fetchRoadmap(detectedGoal, resumeAnalysis);
  }, []);

  const fetchRoadmap = async (targetGoal: string, resumeAnalysis: any = null) => {
    setLoading(true);
    setIsGenerating(true);
    setError(null);
    try {
      const analysis = resumeAnalysis || JSON.parse(localStorage.getItem("careerspark_last_resume") || "{}");
      
      const res = await fetch(ENDPOINTS.CAREER_ROADMAP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          role: targetGoal,
          resume_analysis: analysis
        })
      });

      if (!res.ok) throw new Error("Cloud synchronization failed while generating roadmap.");
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleGenerateCustom = () => {
    if (!goal.trim()) return;
    fetchRoadmap(goal);
  };

  if (loading && !data) {
    return (
      <div className="h-full bg-[#050505] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-[#00E6A8] animate-spin" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-[#00E6A8]/20 blur-2xl rounded-full"
          />
        </div>
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00E6A8]">AI Intelligence Service</p>
          <h2 className="text-2xl font-bebas tracking-widest text-white uppercase italic">Architecting Evolution...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#050505] text-white overflow-y-auto custom-scrollbar selection:bg-[#00E6A8]/30">
      <div className="max-w-[1400px] mx-auto p-6 md:p-12 space-y-20">
        
        {/* Top Navigation / Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00E6A8]/5 border border-[#00E6A8]/20 rounded-full text-[10px] font-black uppercase text-[#00E6A8] tracking-widest">
              <Sparkles className="w-3 h-3 animate-pulse" /> Dynamic Career Map v2.0
            </div>
            <h1 className="text-6xl md:text-8xl font-bebas tracking-tighter uppercase leading-[0.85] text-white">
              {data?.title.split(" ").map((word, i) => (
                <span key={i} className={cn(i === 0 ? "text-white" : i === 1 ? "text-[#00E6A8]" : "text-white/40 block md:inline")}>
                  {word}{" "}
                </span>
              ))}
            </h1>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-[0.3em] max-w-xl">
              Swiss-precise learning path enriched by Llama 3.3 Intelligence.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col sm:flex-row gap-4 md:items-end"
          >
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Refine Career Goal</label>
              <div className="flex gap-2">
                <input 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Senior DevOps Engineer"
                  className="bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#00E6A8]/50 transition-all w-full sm:w-[300px]"
                />
                <button 
                  onClick={handleGenerateCustom}
                  disabled={isGenerating}
                  className="p-4 bg-white text-black rounded-2xl hover:bg-[#00E6A8] transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Skills Mastered" 
            value={data?.completed_count || 0} 
            subValue={`of ${data?.stages.reduce((acc, s) => acc + s.skills.length, 0)} total nodes`}
            icon={<Award className="w-5 h-5 text-[#00E6A8]" />}
          />
          <StatCard 
            label="Target Goal" 
            value={data?.role || "Engineer"} 
            isText
            icon={<Target className="w-5 h-5 text-blue-500" />}
          />
          <StatCard 
            label="Next Strategic Move" 
            value={data?.next_recommended_skill || "Explore"} 
            isText
            highlight
            icon={<Zap className="w-5 h-5 text-yellow-500" />}
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Roadmap Container */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {data && (
                <motion.div
                  key={data.role}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <RoadmapTimeline stages={data.stages} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side Info Panel */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="liquid-glass p-8 rounded-[40px] border border-white/5 space-y-6 sticky top-8"
            >
              <h3 className="text-xl font-bebas tracking-widest uppercase flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#00E6A8]" /> AI Mentor Insight
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed italic">
                  "{data?.mentor_note}"
                </p>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Focus Gaps</p>
                  <div className="flex flex-wrap gap-2">
                    {data?.missing_skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-zinc-400 border border-white/5 uppercase tracking-tighter">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/resume" className="block w-full">
                <button className="w-full mt-6 flex items-center justify-between p-4 bg-[#00E6A8]/10 border border-[#00E6A8]/20 rounded-2xl group hover:bg-[#00E6A8] transition-all duration-500">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00E6A8] group-hover:text-black">Resume Assessment</span>
                  <ArrowRight className="w-4 h-4 text-[#00E6A8] group-hover:text-black group-hover:translate-x-1 transition-all" />
                </button>
              </Link>
            </motion.div>
          </div>
        </div>

        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest backdrop-blur-xl z-50">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon, isText, highlight }: { label: string, value: any, subValue?: string, icon: React.ReactNode, isText?: boolean, highlight?: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "glass p-8 rounded-[40px] border border-white/5 space-y-4 transition-all duration-500",
        highlight && "shadow-[0_0_40px_rgba(0,230,168,0.05)] border-[#00E6A8]/10"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
        <div className="p-2 bg-white/5 rounded-xl border border-white/5">{icon}</div>
      </div>
      <div>
        {isText ? (
          <p className="text-xl font-bebas uppercase tracking-tighter text-white truncate">{value}</p>
        ) : (
          <p className="text-5xl font-bebas text-white leading-none">{value}</p>
        )}
        {subValue && <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-2">{subValue}</p>}
      </div>
    </motion.div>
  );
}

function BrainCircuit(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4.5V4a2 2 0 0 0-4 0v.5" />
      <path d="M16 11V7a2 2 0 0 0-4 0v4" />
      <path d="M8 15V7a6 6 0 1 1 12 0v8" />
      <path d="M16 11V7" />
      <circle cx="12" cy="18" r="3" />
    </svg>
  );
}
