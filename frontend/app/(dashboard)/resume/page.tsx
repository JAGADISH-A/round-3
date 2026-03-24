"use client";

import React, { useState } from "react";
import ResumeUpload from "@/components/resume/ResumeUpload";
import BulletRewriter from "@/components/resume/BulletRewriter";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, Zap, ShieldCheck, AlertCircle, CheckCircle2, Award, TrendingUp, Search, Layers, ClipboardList, RotateCcw, BrainCircuit, MessageSquare, History as HistoryIcon, Crosshair, Lightbulb, ArrowRight, Sparkles, MousePointerClick, Wand2 } from "lucide-react";
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
  jd_match?: {
    jd_match_score: number;
    match_label: string;
    benchmark_range?: string;
    matched_keywords: string[];
    missing_keywords: string[];
    matched_with_labels?: { keyword: string; label: string }[];
    missing_with_labels?: { keyword: string; label: string }[];
    tech_matched_count: number;
    tech_required_count: number;
    action_insights?: { skill: string; type: string; message: string }[];
    suggested_bullets?: string[];
  } | null;
}

export default function ResumePage() {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [rewriterBullet, setRewriterBullet] = useState("");
  const [storedJdText, setStoredJdText] = useState("");

  const handleAnalysisComplete = (data: ResumeAnalysis, jdText?: string) => {
    setAnalysis(data);
    if (jdText) setStoredJdText(jdText);
  };

  const handleSkillClick = async (skill: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res = await fetch(`${apiUrl}/api/resume/generate-bullet-from-skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, role: normalizedAnalysis?.confirmed_role || normalizedAnalysis?.inferred_role || "Software Engineer" }),
      });
      const data = await res.json();
      setRewriterBullet(data.bullet);
      // Scroll to rewriter
      document.getElementById("bullet-rewriter-section")?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setRewriterBullet(`Worked with ${skill} in a project context`);
    }
  };

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
      <header className="h-[64px] border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
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
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,214,0,0.2)]"
            >
              <MessageSquare className="w-3 h-3" />
              Discuss Resume with AI
            </button>
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Role</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{normalizedAnalysis.confirmed_role}</span>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
          
          {/* Upload Section */}
          <section className={cn("transition-all duration-700", analysis ? "opacity-100" : "opacity-100")}>
            <div className="mb-6 text-center">
              <p className="text-zinc-500 text-xs font-medium">Upload your PDF resume to get an instant AI-powered performance analysis.</p>
            </div>
            <ResumeUpload onAnalysisComplete={(data) => setAnalysis(data)} />
          </section>

          {normalizedAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              
              {/* Radar Performance Chart */}
              <div className="lg:col-span-8 liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden min-h-[500px]">
                <div className="absolute top-10 left-10">
                  <h3 className="text-3xl font-bebas tracking-wider uppercase mb-1 italic">Skill Performance <span className="text-primary">Radar</span></h3>
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
                        stroke="#FFD600"
                        fill="#FFD600"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '16px' }}
                        itemStyle={{ color: '#FFD600' }}
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
                    <h4 className="text-[11px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Growth Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {normalizedAnalysis.keyword_suggestions.map((word: string, i: number) => (
                        <span key={i} className="px-3 py-2 bg-primary/5 border border-primary/10 rounded-xl text-xs text-primary/50 font-medium hover:scale-105 transition-transform cursor-default">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ GUIDED JD MATCH FLOW ═══ */}
              {normalizedAnalysis.jd_match && (
                <>
                  {/* STEP 1: Score Overview */}
                  <div className="lg:col-span-12 liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Crosshair className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bebas tracking-wide uppercase">JD <span className="text-emerald-400">Match Score</span></h3>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">Job Description Alignment Analysis</p>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bebas font-black text-emerald-400">{normalizedAnalysis.jd_match.jd_match_score}</span>
                          <span className="text-sm text-zinc-600 font-mono">/ 100</span>
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1 inline-block",
                          normalizedAnalysis.jd_match.jd_match_score >= 60 ? "bg-emerald-500/10 text-emerald-400" :
                          normalizedAnalysis.jd_match.jd_match_score >= 30 ? "bg-amber-500/10 text-amber-400" :
                          "bg-red-500/10 text-red-400"
                        )}>
                          {normalizedAnalysis.jd_match.match_label}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden mb-4">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000 ease-out rounded-full",
                          normalizedAnalysis.jd_match.jd_match_score >= 60 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" :
                          normalizedAnalysis.jd_match.jd_match_score >= 30 ? "bg-gradient-to-r from-amber-600 to-amber-400" :
                          "bg-gradient-to-r from-red-600 to-red-400"
                        )}
                        style={{ width: `${normalizedAnalysis.jd_match.jd_match_score}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-mono text-zinc-600 mb-6">
                      {normalizedAnalysis.jd_match.benchmark_range || "Top candidates: 65–80"}
                      &nbsp;·&nbsp; Tech: {normalizedAnalysis.jd_match.tech_matched_count} / {normalizedAnalysis.jd_match.tech_required_count} matched
                    </p>

                    {/* Keywords Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.2em] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Matched Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(normalizedAnalysis.jd_match.matched_with_labels || normalizedAnalysis.jd_match.matched_keywords.map(k => ({ keyword: k, label: "Good Fit" }))).map((item: any, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-300/70 font-medium group relative">
                              {typeof item === 'string' ? item : item.keyword}
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-800 text-[9px] text-emerald-400 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{typeof item === 'string' ? 'Good Fit' : item.label}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-black uppercase text-red-400 tracking-[0.2em] flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Missing Keywords
                          <span className="text-zinc-600 text-[9px] normal-case tracking-normal ml-1 flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> click to fix</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(normalizedAnalysis.jd_match.missing_with_labels || normalizedAnalysis.jd_match.missing_keywords.map(k => ({ keyword: k, label: "Critical Gap" }))).map((item: any, i: number) => (
                            <button
                              key={i}
                              onClick={() => handleSkillClick(typeof item === 'string' ? item : item.keyword)}
                              className="px-3 py-1.5 bg-red-500/5 border border-red-500/20 rounded-xl text-xs text-red-300/60 font-medium hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 transition-all cursor-pointer group relative"
                            >
                              {typeof item === 'string' ? item : item.keyword}
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-800 text-[9px] text-red-400 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{typeof item === 'string' ? 'Critical Gap' : item.label}</span>
                            </button>
                          ))}
                          {normalizedAnalysis.jd_match.missing_keywords.length === 0 && (
                            <p className="text-xs text-zinc-600 italic">No critical gaps detected</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: Why Score is Low — Action Insights */}
                  {(normalizedAnalysis.jd_match.action_insights?.length ?? 0) > 0 && (
                    <div className="lg:col-span-12 liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <Lightbulb className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bebas tracking-wide uppercase">Action <span className="text-amber-400">Insights</span></h3>
                          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">Exactly what to fix on your resume</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {normalizedAnalysis.jd_match.action_insights!.map((insight: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-4 p-5 bg-black/40 border border-white/5 rounded-3xl hover:border-amber-500/20 transition-all group"
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-2xl flex items-center justify-center text-xs shrink-0 mt-0.5",
                              insight.type === "critical_skill" ? "bg-red-500/10 text-red-400" :
                              insight.type === "general_fix" ? "bg-blue-500/10 text-blue-400" :
                              "bg-amber-500/10 text-amber-400"
                            )}>
                              {insight.type === "critical_skill" ? <AlertCircle className="w-4 h-4" /> :
                               insight.type === "general_fix" ? <Sparkles className="w-4 h-4" /> :
                               <ArrowRight className="w-4 h-4" />}
                            </div>
                            <div className="space-y-1">
                              {insight.skill && (
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{insight.skill}</p>
                              )}
                              <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">{insight.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: How to Fix — Suggested Bullets */}
                  {(normalizedAnalysis.jd_match.suggested_bullets?.length ?? 0) > 0 && (
                    <div className="lg:col-span-12 liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bebas tracking-wide uppercase">Suggested <span className="text-sky-400">Bullets</span></h3>
                          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">AI-generated starters — click &ldquo;Use this&rdquo; to refine with AI</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {normalizedAnalysis.jd_match.suggested_bullets!.map((b: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-4 p-5 bg-black/40 border border-white/5 rounded-3xl hover:border-sky-500/20 transition-all group"
                          >
                            <p className="text-sm text-zinc-300 group-hover:text-white transition-colors flex-1">{b}</p>
                            <button
                              onClick={() => {
                                setRewriterBullet(b);
                                document.getElementById("bullet-rewriter-section")?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-black uppercase tracking-widest hover:bg-sky-500/20 transition-all"
                            >
                              <Wand2 className="w-3 h-3" /> Use this
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Instant Action — Bullet Rewriter */}
                  <div className="lg:col-span-12" id="bullet-rewriter-section">
                    <BulletRewriter
                      targetRole={normalizedAnalysis.confirmed_role || normalizedAnalysis.inferred_role}
                      externalBullet={rewriterBullet}
                      jdText={storedJdText}
                    />
                  </div>
                </>
              )}

              {/* Standalone Bullet Rewriter (when no JD was provided) */}
              {!normalizedAnalysis.jd_match && normalizedAnalysis && (
                <div className="lg:col-span-12" id="bullet-rewriter-section">
                  <BulletRewriter targetRole={normalizedAnalysis.confirmed_role || normalizedAnalysis.inferred_role} />
                </div>
              )}

              {/* Optimization Protocol - Full Width */}
              <div className="lg:col-span-12 liquid-glass p-12 rounded-[56px] border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:scale-[1.6] transition-transform duration-1000">
                    <HistoryIcon className="w-64 h-64 text-primary" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <BrainCircuit className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bebas tracking-wide uppercase">Optimization <span className="text-primary">Protocol</span></h3>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">Actionable Profile Enhancements</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {normalizedAnalysis.improvement_checklist.slice(0, 4).map((item: any, i: number) => (
                        <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-3xl group/item hover:border-primary/20 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                              item.priority === "High" ? "bg-red-500/10 text-red-500" :
                              item.priority === "Medium" ? "bg-amber-500/10 text-amber-500" :
                              "bg-primary/10 text-primary"
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
