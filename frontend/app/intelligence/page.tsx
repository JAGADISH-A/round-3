"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Award, 
  Zap, 
  Target, 
  ShieldCheck, 
  BrainCircuit, 
  Activity,
  History,
  LayoutDashboard,
  ChevronRight,
  Sparkles,
  BarChart3,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/api-config";

interface SignalData {
  aggregate_score: number;
  master_signal: number;
  readiness_level: string;
  primary_role: string;
  signals: {
    technical: number;
    vocal: number;
    market: number;
  };
  skill_signal: number;
  technical_depth: number;
  vocal_precision: number;
  market_alignment: number;
  missing_skills: string[];
  missing_market_keywords: string[];
  insights: string[];
}

export default function IntelligencePage() {
  const [signals, setSignals] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAggregate() {
      const rData = localStorage.getItem("careerspark_last_resume");
      const vHistory = JSON.parse(localStorage.getItem("careerSparkSessions") || "[]");
      
      if (!rData) {
        setLoading(false);
        return;
      }

      try {
        const resumeAnalysis = JSON.parse(rData);
        const targetRole = resumeAnalysis.confirmed_role || resumeAnalysis.inferred_role || undefined;

        const res = await fetch(ENDPOINTS.INTELLIGENCE_AGGREGATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_analysis: resumeAnalysis,
            voice_history: vHistory,
            target_role: targetRole,
          })
        });

        if (!res.ok) throw new Error("Data Sync Failed");
        const data = await res.json();
        setSignals(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAggregate();
  }, []);

  const chartData = signals ? [
    { name: 'Technical', value: signals.signals.technical },
    { name: 'Vocal', value: signals.signals.vocal },
    { name: 'Market', value: signals.signals.market },
    { name: 'Skills', value: signals.skill_signal },
  ] : [
    { name: 'Technical', value: 0 },
    { name: 'Vocal', value: 0 },
    { name: 'Market', value: 0 },
    { name: 'Skills', value: 0 },
  ];


  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-[#00E6A8] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Aggregating Global Signals...</p>
        </div>
    </div>
  );

  if (!signals && !error) return (
    <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-8 opacity-20">
            <BrainCircuit className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bebas tracking-wider mb-2">Data Sync Required</h3>
        <p className="text-xs text-zinc-600 max-w-xs leading-relaxed font-mono uppercase">
            No active resume signal detected. Please inject a resume profile to initialize Career Intelligence.
        </p>
    </div>
  );

  if (error) return (
    <div className="h-full flex items-center justify-center bg-[#050505]">
        <div className="flex items-center gap-3 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">{error}</p>
        </div>
    </div>
  );
  if (!signals) return null;

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden">
      <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#00E6A8]/10 border border-[#00E6A8]/20 flex items-center justify-center text-[#00E6A8]">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Career Intelligence</h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Aggregate Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Data Status</span>
                <span className="text-[10px] text-[#00E6A8] font-mono">Synced & Active</span>
             </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
          
          {/* Hero Section: Aggregate Readiness */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 liquid-glass p-12 rounded-[48px] border border-white/5 bg-gradient-to-br from-[#00E6A8]/5 via-transparent to-transparent relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="absolute top-0 left-0 p-10 opacity-5">
                    <Activity className="w-40 h-40" />
                </div>
                
                <div className="space-y-6 relative z-10 w-full md:w-auto">
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#00E6A8]/10 border border-[#00E6A8]/20 rounded-full text-[10px] font-black uppercase text-[#00E6A8] tracking-widest mb-4">
                            <Sparkles className="w-3 h-3" /> Readiness Peak
                        </span>
                        <h1 className="text-7xl font-bebas tracking-tighter leading-none mb-2">MASTER <span className="text-[#00E6A8]">SIGNAL</span></h1>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-[0.3em]">Aggregate Career Readiness Score</p>
                    </div>

                    <div className="flex gap-10">
                        <StatMini label="TECHNICAL" value={signals.signals.technical} color="#00E6A8" />
                        <StatMini label="VOCAL" value={signals.signals.vocal} color="#3b82f6" />
                        <StatMini label="MARKET" value={signals.signals.market} color="#f59e0b" />
                    </div>
                </div>

                <div className="relative shrink-0">
                    <div className="w-56 h-56 rounded-full border-[12px] border-white/5 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border-[12px] border-t-[#00E6A8] border-r-[#00E6A8]/40 border-b-transparent border-l-transparent animate-[spin_3s_linear_infinite]" />
                        <div className="flex flex-col items-center">
                            <span className="text-7xl font-black font-bebas tracking-tighter">{signals.aggregate_score}</span>
                            <span className="text-[10px] text-[#00E6A8] font-black uppercase tracking-widest mt-1">PERCENT</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-4 liquid-glass p-10 rounded-[48px] border border-white/5 flex flex-col justify-between">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Live Stability</h3>
                        <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                    </div>
                    <div className="h-40 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00E6A8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#00E6A8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#00E6A8" fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="pt-8 border-t border-white/5">
                    <p className="text-[10px] text-zinc-600 font-mono leading-relaxed italic uppercase">
                        Current Profile: <span className="text-white font-bold">{signals.primary_role}</span> · Matched against production roadmaps.
                    </p>
                </div>
            </div>
          </section>

          {/* Detailed Analytics Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <InsightCard 
                title="TECHNICAL DEPTH" 
                value={signals.signals.technical} 
                icon={<ShieldCheck className="w-6 h-6"/>} 
                color="#00E6A8"
                traits={["Code Integrity", "Architecture", "System Logic"]}
             />
             <InsightCard 
                title="VOCAL PRECISION" 
                value={signals.signals.vocal} 
                icon={<Zap className="w-6 h-6"/>} 
                color="#3b82f6"
                traits={["Clarity Sync", "Pacing Flow", "Tone Profile"]}
             />
             <InsightCard 
                title="MARKET ALIGNMENT" 
                value={signals.signals.market} 
                icon={<Target className="w-6 h-6"/>} 
                color="#f59e0b"
                traits={["ATS Optimization", "Role Precision", signals.readiness_level]}
             />
          </section>

          {/* Expert Insights Section */}
          <section className="liquid-glass p-12 rounded-[48px] border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                <BarChart3 className="w-64 h-64" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-12 items-start relative z-10">
                <div className="w-full md:w-1/3 space-y-6">
                    <h3 className="text-3xl font-bebas tracking-wider uppercase">Expert <br/> Feedback</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed font-mono italic">
                        Signals aggregated from all practiced sessions and profile scans.
                    </p>
                </div>

                <div className="flex-1 space-y-4 w-full">
                    {signals.insights.map((insight, i) => (
                        <div key={i} className="p-6 bg-zinc-950/50 border border-white/5 rounded-3xl flex gap-5 items-start group hover:border-[#00E6A8]/20 transition-all">
                            <div className="w-10 h-10 rounded-2xl bg-[#00E6A8]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-5 h-5 text-[#00E6A8]" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Analytics Insight {i+1}</h4>
                                <p className="text-sm font-medium text-zinc-300 leading-relaxed">{insight}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">{label}</span>
            <div className="flex items-center gap-3">
                <span className="text-2xl font-black font-bebas">{value}%</span>
                <div className="w-12 h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-current transition-all duration-1000" style={{ width: `${value}%`, color }} />
                </div>
            </div>
        </div>
    )
}

function InsightCard({ title, value, icon, color, traits }: { title: string, value: number, icon: any, color: string, traits: string[] }) {
    return (
        <div className="liquid-glass p-10 rounded-[48px] border border-white/5 hover:border-white/10 transition-all group">
            <div className="flex items-center justify-between mb-8">
                <div style={{ color }} className="opacity-40 group-hover:opacity-100 transition-all scale-110">
                    {icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{title}</span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-8">
                <span className="text-6xl font-bebas tracking-tighter">{value}</span>
                <span className="text-xs text-zinc-600 font-mono">%</span>
            </div>

            <div className="space-y-3">
                {traits.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                        <span className="text-[10px] text-zinc-500 font-mono uppercase truncate tracking-wider">{t}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
