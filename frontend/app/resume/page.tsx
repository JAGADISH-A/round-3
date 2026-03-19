"use client";

import React, { useState } from "react";
import ResumeUpload from "@/components/resume/ResumeUpload";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, Zap, ShieldCheck, AlertCircle, CheckCircle2, Award, TrendingUp, Search, Layers, ClipboardList, RotateCcw, BrainCircuit, MessageSquare, History as HistoryIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ResumeAnalysis {
  full_text: string;
  inferred_role: string;
  confirmed_role?: string;
  skills: string[];
  education: { degree: string; institution: string; year: string }[];
  experience: { title: string; company: string; duration: string; impact: string }[];
  projects: { name: string; tech_stack: string[]; description: string }[];
  ats_score: number;
  strength_score: number;
  industry_readiness: string;
  skill_gap: string[];
  keyword_suggestions: string[];
  improvement_checklist: { task: string; priority: string }[];
  experience_impact_score: number;
}

export default function ResumePage() {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  // Normalization layer to prevent UI crashes on partial AI data
  const normalizedAnalysis = analysis ? {
    ...analysis,
    skills: analysis.skills ?? [],
    projects: analysis.projects ?? [],
    experience: analysis.experience ?? [],
    education: analysis.education ?? [],
    skill_gap: analysis.skill_gap ?? [],
    keyword_suggestions: analysis.keyword_suggestions ?? [],
    improvement_checklist: analysis.improvement_checklist ?? [],
    ats_score: analysis.ats_score ?? 0,
    strength_score: analysis.strength_score ?? 0,
    experience_impact_score: analysis.experience_impact_score ?? 0,
    industry_readiness: analysis.industry_readiness ?? "Beginner",
    confirmed_role: analysis.confirmed_role || analysis.inferred_role || "Unknown Role"
  } : null;

  const radarData = normalizedAnalysis ? [
    { subject: 'Skills', A: normalizedAnalysis.strength_score, fullMark: 100 },
    { subject: 'ATS Score', A: normalizedAnalysis.ats_score, fullMark: 100 },
    { subject: 'Impact', A: normalizedAnalysis.experience_impact_score, fullMark: 100 },
    { subject: 'Readiness', A: normalizedAnalysis.industry_readiness === "Expert" ? 100 : 
                               normalizedAnalysis.industry_readiness === "Advanced" ? 80 : 
                               normalizedAnalysis.industry_readiness === "Intermediate" ? 60 : 40, fullMark: 100 },
    { subject: 'Projects', A: Math.min((normalizedAnalysis.projects?.length || 0) * 20, 100), fullMark: 100 },
  ] : [];

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden">
      <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#00E6A8]/10 border border-[#00E6A8]/20 flex items-center justify-center text-[#00E6A8]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Resume Intelligence</h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Resume Analysis</p>
          </div>
        </div>
        {normalizedAnalysis && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const context = {
                  type: "resume",
                  role: normalizedAnalysis.confirmed_role,
                  summary: "Resume analyzed for " + normalizedAnalysis.confirmed_role,
                  strengths: normalizedAnalysis.skills.slice(0, 5),
                  weaknesses: normalizedAnalysis.skill_gap,
                  suggestions: normalizedAnalysis.improvement_checklist.map(i => i.task)
                };
                sessionStorage.setItem("careerspark_analysis_context", JSON.stringify(context));
                window.location.href = "/chat?persona=resume_reviewer";
              }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00E6A8] text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,230,168,0.2)]"
            >
              <MessageSquare className="w-3 h-3" />
              Discuss Resume with AI
            </button>
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#00E6A8]/5 border border-[#00E6A8]/10">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Role</span>
              <span className="text-[10px] font-bold text-[#00E6A8] uppercase tracking-wider">{normalizedAnalysis.confirmed_role}</span>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
          
          {/* Upload Section */}
          <section className={cn("transition-all duration-700", analysis ? "opacity-100" : "opacity-100")}>
            <ResumeUpload onAnalysisComplete={(data) => setAnalysis(data)} />
          </section>

          {normalizedAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              
              {/* Radar Performance Chart */}
              <div className="lg:col-span-8 liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden min-h-[500px]">
                <div className="absolute top-10 left-10">
                  <h3 className="text-3xl font-bebas tracking-wider uppercase mb-1 italic">Skill Performance <span className="text-[#00E6A8]">Radar</span></h3>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Cross-Referenced Performance Metrics</p>
                </div>
                
                <div className="w-full h-full pt-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#ffffff08" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }} />
                      <Radar
                        name="Candidate"
                        dataKey="A"
                        stroke="#00E6A8"
                        fill="#00E6A8"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '16px' }}
                        itemStyle={{ color: '#00E6A8' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Core Meters Side Panel */}
              <div className="lg:col-span-4 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-5">
                    <h4 className="text-[11px] font-black uppercase text-amber-500 tracking-[0.2em] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Detected Gaps
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {normalizedAnalysis.skill_gap.map((skill: string, i: number) => (
                        <span key={i} className="px-3 py-2 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-200/50 font-medium">
                          {skill}
                        </span>
                      ))}
                      {normalizedAnalysis.skill_gap.length === 0 && <p className="text-xs text-zinc-600 italic">No major skill gaps identified</p>}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h4 className="text-[11px] font-black uppercase text-[#00E6A8] tracking-[0.2em] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Growth Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {normalizedAnalysis.keyword_suggestions.map((word: string, i: number) => (
                        <span key={i} className="px-3 py-2 bg-[#00E6A8]/5 border border-[#00E6A8]/10 rounded-xl text-xs text-[#00E6A8]/50 font-medium">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimization Protocol - Full Width */}
              <div className="lg:col-span-12 liquid-glass p-12 rounded-[56px] border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:scale-[1.6] transition-transform duration-1000">
                    <HistoryIcon className="w-64 h-64 text-[#00E6A8]" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-3xl bg-[#00E6A8]/10 border border-[#00E6A8]/20 flex items-center justify-center text-[#00E6A8]">
                        <BrainCircuit className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bebas tracking-wide uppercase">Optimization <span className="text-[#00E6A8]">Protocol</span></h3>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">Actionable Profile Enhancements</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {normalizedAnalysis.improvement_checklist.slice(0, 4).map((item: any, i: number) => (
                        <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-3xl group/item hover:border-[#00E6A8]/20 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                              item.priority === "High" ? "bg-red-500/10 text-red-500" :
                              item.priority === "Medium" ? "bg-amber-500/10 text-amber-500" :
                              "bg-[#00E6A8]/10 text-[#00E6A8]"
                            )}>
                              {item.priority}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-zinc-300 leading-relaxed group-hover/item:text-white transition-colors">{item.task}</p>
                        </div>
                      ))}
                      {normalizedAnalysis.improvement_checklist.length === 0 && (
                         <div className="col-span-full py-10 flex flex-col items-center justify-center opacity-30">
                            <CheckCircle2 className="w-10 h-10 mb-4" />
                            <p className="text-[10px] uppercase font-black tracking-widest">Profile Optimized</p>
                         </div>
                      )}
                    </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, isScore = true, desc }: { label: string, value: any, icon: any, color: string, isScore?: boolean, desc?: string }) {
  return (
    <div className="liquid-glass p-7 rounded-[40px] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
      <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {React.cloneElement(icon, { size: 80 })}
      </div>
      <div className="flex items-center justify-between mb-6">
        <div style={{ color }} className="opacity-60 scale-110">
          {React.cloneElement(icon, { size: 18 })}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{label}</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black font-bebas tracking-tighter">
            {isScore ? value : <span className="text-2xl">{value}</span>}
          </span>
          {isScore && <span className="text-xs text-zinc-700 font-mono">%</span>}
        </div>
        <p className="text-[10px] text-zinc-500 italic font-mono uppercase tracking-wider">{desc}</p>
        {isScore && (
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-4">
            <div 
              className="h-full transition-all duration-1000 ease-out" 
              style={{ width: `${value}%`, backgroundColor: color }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
