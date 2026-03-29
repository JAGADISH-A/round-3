"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Target, 
  MessageSquare, 
  ChevronRight, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  Layout,
  Briefcase,
  Cpu,
  ShieldCheck,
  Zap,
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/api-config";

interface RoadmapStage {
  stage: string;
  topics: string[];
}

interface InterviewQuestions {
  technical: string[];
  behavioral: string[];
  system_design: string[];
}

interface PrepData {
  type: "interview" | "roadmap";
  role: string;
  questions?: InterviewQuestions;
  stages?: RoadmapStage[];
}

const AVAILABLE_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "ML Engineer",
  "Data Scientist",
  "System Architect"
];

export default function CareerPrepPage() {
  const [role, setRole] = useState<string>("General Developer");
  const [data, setData] = useState<PrepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial Role Detection
    const resumeData = localStorage.getItem("careerspark_last_resume");
    if (resumeData) {
      try {
        const parsed = JSON.parse(resumeData);
        const detectedRole = parsed.confirmed_role || parsed.inferred_role || "General Developer";
        setRole(detectedRole);
      } catch (e) {
        console.error("Failed to parse resume data", e);
      }
    }
  }, []);

  useEffect(() => {
    fetchPrepData();
  }, [role]);

  const fetchPrepData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.CAREER_PREP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });

      if (!res.ok) throw new Error("Failed to fetch preparation data");
      const prepResult = await res.json();
      setData(prepResult);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-white overflow-hidden">
      {/* Header */}
      <header className="h-[72px] border-b border-cyan-500/10 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-cyan-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-orbitron font-bold tracking-tight">CAREER_STRATEGY</h2>
            <p className="text-[10px] text-cyan-500/40 font-tech uppercase tracking-[0.2em]">Neural Roadmap Extraction</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-orbitron text-cyan-500/30 uppercase tracking-widest">Active Node</span>
            <span className="text-[10px] text-cyan-400 font-tech">{role.toUpperCase()}</span>
          </div>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-black/60 border border-cyan-500/20 px-4 py-2 text-[10px] font-tech uppercase tracking-wider focus:outline-none focus:border-cyan-500/50 transition-all text-cyan-400"
          >
            {AVAILABLE_ROLES.map(r => (
              <option key={r} value={r} className="bg-[#020406]">{r}</option>
            ))}
            {!AVAILABLE_ROLES.includes(role) && <option value={role} className="bg-[#020406]">{role}</option>}
          </select>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
          
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl animate-pulse" />
              </div>
              <p className="text-[10px] font-orbitron font-black uppercase tracking-[0.4em] animate-pulse">Synchronizing Knowledge Nodes...</p>
            </div>
          ) : error ? (
            <div className="py-40 flex flex-col items-center justify-center gap-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500/50" />
              <h3 className="text-xl font-orbitron tracking-widest uppercase">STRATEGIC_ERROR</h3>
              <p className="text-xs text-red-500/60 font-tech uppercase tracking-widest">{error}</p>
              <button 
                onClick={fetchPrepData}
                className="tactical-button"
              >
                [ RETRY_EXTRACTION ]
              </button>
            </div>
          ) : data ? (
            <>
              {/* Conditional Title Section */}
              <div className="flex flex-col items-center text-center space-y-6">
                <span className="inline-flex items-center gap-3 px-6 py-2 border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-[10px] font-orbitron tracking-[0.4em] uppercase">
                  <Sparkles className="w-3 h-3" /> {data.type === "interview" ? "INTERVIEW_READY_EXTRACT" : "GROWTH_LOG_SYNTHESIS"}
                </span>
                <h1 className="text-6xl md:text-8xl font-orbitron tracking-tighter leading-none">
                  {data.type === "interview" ? "PREP" : "PATHW"}<span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">AY</span> FOR <span className="text-cyan-400">{role.split(" ")[0].toUpperCase()}</span>
                </h1>
                <p className="text-xs text-cyan-500/40 font-nav uppercase tracking-[0.3em] max-w-xl leading-relaxed">
                  {data.type === "interview" 
                    ? "Targeted questions retrieved from production roadmaps and engineering interview databases."
                    : "Structured learning stages generated from industry standard roadmaps and skill requirements."}
                </p>
              </div>

              {data.type === "interview" && data.questions ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                  <QuestionSection 
                    title="TECHNICAL DEPTH" 
                    icon={<Cpu className="w-5 h-5" />} 
                    questions={data.questions.technical} 
                    color="#00E6A8"
                  />
                  <QuestionSection 
                    title="SYSTEM DESIGN" 
                    icon={<Network className="w-5 h-5" />} 
                    questions={data.questions.system_design} 
                    color="#3b82f6"
                  />
                  <QuestionSection 
                    title="BEHAVIORAL" 
                    icon={<MessageSquare className="w-5 h-5" />} 
                    questions={data.questions.behavioral} 
                    color="#f59e0b"
                  />
                </div>
              ) : data.stages ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {data.stages.map((stage, idx) => (
                    <RoadmapCard key={idx} stage={stage} index={idx} />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuestionSection({ title, icon, questions, color }: { title: string, icon: any, questions: string[], color: string }) {
  return (
    <div className="hud-panel p-8 space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-cyan-400">
            {icon}
          </div>
          <h3 className="text-[11px] font-orbitron font-black uppercase tracking-widest text-cyan-400">{title}</h3>
        </div>
        <span className="text-[10px] font-tech text-cyan-500/40 tracking-widest">{questions.length} DATA_POINTS</span>
      </div>

      <div className="space-y-4 flex-1">
        {questions.length > 0 ? questions.map((q, i) => (
          <div key={i} className="p-6 bg-cyan-500/5 border border-cyan-500/10 hover:border-cyan-500/30 transition-all relative group">
            <div className="absolute top-0 left-0 w-1 h-2 border-t border-l border-cyan-500" />
            <p className="text-sm font-medium text-cyan-50/80 leading-relaxed group-hover:text-white transition-colors">{q}</p>
          </div>
        )) : (
          <p className="text-[10px] text-zinc-600 font-mono uppercase italic p-4 text-center">No signals detected</p>
        )}
      </div>
    </div>
  );
}

function RoadmapCard({ stage, index }: { stage: RoadmapStage, index: number }) {
  const icons = [<ShieldCheck key="1" />, <Zap key="2" />, <Cpu key="3" />, <Network key="4" />];
  return (
    <div className="hud-panel p-8 space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 font-orbitron text-4xl text-cyan-500/5 tracking-tighter group-hover:text-cyan-500/10 transition-colors">
        0{index + 1}
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="w-12 h-12 border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-cyan-400">
          {icons[index % icons.length]}
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className="text-lg font-orbitron font-bold tracking-tight text-white">{stage.stage.toUpperCase()}</h3>
        <p className="text-[10px] font-tech uppercase text-cyan-500/40 tracking-widest">PHASE_0{index + 1}</p>
      </div>

      <div className="space-y-3 relative z-10">
        {stage.topics.map((topic, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-1 h-1 bg-cyan-500" />
            <span className="text-xs text-cyan-500/60 font-medium group-hover:text-cyan-400 transition-colors">{topic}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
