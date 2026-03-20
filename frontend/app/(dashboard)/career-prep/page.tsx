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
    <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* Header */}
      <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#00E6A8]/10 border border-[#00E6A8]/20 flex items-center justify-center text-[#00E6A8]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Career Preparation</h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">RAG Powered Strategy</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Focus</span>
            <span className="text-[10px] text-[#00E6A8] font-mono">{role}</span>
          </div>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-[#00E6A8]/50 transition-all text-zinc-300"
          >
            {AVAILABLE_ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
            {!AVAILABLE_ROLES.includes(role) && <option value={role}>{role}</option>}
          </select>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
          
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-[#00E6A8] animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Consulting Knowledge Base...</p>
            </div>
          ) : error ? (
            <div className="py-40 flex flex-col items-center justify-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500/50" />
              <h3 className="text-xl font-bebas tracking-wider uppercase">Strategic Error</h3>
              <p className="text-xs text-zinc-500 font-mono uppercase">{error}</p>
              <button 
                onClick={fetchPrepData}
                className="mt-4 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Retry Extraction
              </button>
            </div>
          ) : data ? (
            <>
              {/* Conditional Title Section */}
              <div className="flex flex-col items-center text-center space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#00E6A8]/10 border border-[#00E6A8]/20 rounded-full text-[10px] font-black uppercase text-[#00E6A8] tracking-widest">
                  <Sparkles className="w-3 h-3" /> {data.type === "interview" ? "Interview Readiness" : "Growth Roadmap"}
                </span>
                <h1 className="text-6xl font-bebas tracking-tighter leading-none">
                  {data.type === "interview" ? "PREP" : "PATHWAY"} FOR <span className="text-[#00E6A8]">{role.toUpperCase()}</span>
                </h1>
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-[0.3em] max-w-xl leading-relaxed">
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
    <div className="liquid-glass p-8 rounded-[42px] border border-white/5 space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div style={{ backgroundColor: `${color}10`, color }} className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/5">
            {icon}
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest">{title}</h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-600">{questions.length} Qs</span>
      </div>

      <div className="space-y-4 flex-1">
        {questions.length > 0 ? questions.map((q, i) => (
          <div key={i} className="p-6 bg-zinc-950/40 border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
            <p className="text-sm font-medium text-zinc-300 leading-relaxed group-hover:text-white transition-colors">{q}</p>
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
    <div className="liquid-glass p-8 rounded-[42px] border border-white/5 space-y-8 relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00E6A8]/5 blur-3xl rounded-full group-hover:bg-[#00E6A8]/10 transition-all" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-[#00E6A8]">
          {icons[index % icons.length]}
        </div>
        <span className="text-2xl font-bebas text-zinc-800 tracking-tighter">0{index + 1}</span>
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className="text-lg font-bold tracking-tight">{stage.stage}</h3>
        <p className="text-[10px] font-mono uppercase text-zinc-600 tracking-widest">Phase {index + 1}</p>
      </div>

      <div className="space-y-3 relative z-10">
        {stage.topics.map((topic, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-1 h-1 rounded-full bg-[#00E6A8]" />
            <span className="text-xs text-zinc-400 font-medium">{topic}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
