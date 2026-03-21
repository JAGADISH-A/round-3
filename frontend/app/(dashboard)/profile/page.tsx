"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  ChevronRight, 
  Download, 
  ExternalLink, 
  MapPin, 
  Share2, 
  Zap,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  Target,
  Loader2,
  AlertCircle,
  Award
} from "lucide-react";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar,
  Tooltip
} from "recharts";
import { motion } from "framer-motion";
import { detectLanguage } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/api-config";

interface IdentityReport {
  archetype: string;
  strengths: string[];
  skill_gaps: string[];
  market_positioning: string;
  focus_areas: string[];
  trajectory: string;
}

const ACTIVITY_DATA = Array.from({ length: 365 }, (_, i) => ({
  date: i,
  level: Math.floor(Math.random() * 4),
}));

export default function ProfilePage() {
  const [report, setReport] = useState<IdentityReport | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileAndReport();
  }, []);

  const fetchProfileAndReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get Resume Data
      const resumeDataStr = localStorage.getItem("careerspark_last_resume");
      const resumeAnalysis = resumeDataStr ? JSON.parse(resumeDataStr) : null;
      setProfile(resumeAnalysis);

      // 2. Get Roadmap Data (for scores and skills)
      const role = resumeAnalysis?.confirmed_role || resumeAnalysis?.inferred_role || "General Developer";
      const roadmapRes = await fetch(ENDPOINTS.CAREER_ROADMAP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          role, 
          resume_analysis: resumeAnalysis,
          lang: detectLanguage(role)
        })
      });
      const roadmapData = roadmapRes.ok ? await roadmapRes.json() : null;

      // 3. Get Voice Sessions (for interview count)
      const sessionsStr = localStorage.getItem("careerspark_sessions");
      const sessions = sessionsStr ? JSON.parse(sessionsStr) : [];

      // 4. Generate AI Report
      const reportRes = await fetch(ENDPOINTS.DEVELOPER_REPORT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            name: "Jagan S.", // Placeholder or from profile
            role: role,
            completed_skills: roadmapData?.completed_skills || resumeAnalysis?.skills || [],
            remaining_skills: roadmapData?.missing_skills || [],
            projects: resumeAnalysis?.projects?.map((p: any) => p.name) || [],
            interview_count: sessions.length,
            readiness_score: resumeAnalysis?.strength_score || 0
          }
        })
      });

      if (!reportRes.ok) throw new Error("Analysis engine offline");
      const result = await reportRes.json();
      setReport(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const RADAR_DATA = [
    { subject: 'Communication', A: profile?.communication_score || 85, fullMark: 100 },
    { subject: 'Technical', A: profile?.ats_score || 90, fullMark: 100 },
    { subject: 'Problem Solving', A: profile?.problem_solving_score || 75, fullMark: 100 },
    { subject: 'System Design', A: profile?.system_design_score || 65, fullMark: 100 },
    { subject: 'Coding Ability', A: profile?.coding_score || 95, fullMark: 100 },
    { subject: 'Confidence', A: profile?.confidence_score || 80, fullMark: 100 },
  ];

  if (loading) {
    return (
      <div className="h-full bg-[#050505] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#00E6A8] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 text-center">
          Synthesizing Digital Identity...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#050505] text-white overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto p-8 lg:p-12 space-y-12">
        
        {/* Header Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
        >
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[32px] bg-gradient-to-br from-[#00E6A8] to-[#00A678] p-1 shadow-[0_0_40px_rgba(0,230,168,0.2)] group-hover:shadow-[0_0_60px_rgba(0,230,168,0.4)] transition-all">
                <div className="w-full h-full rounded-[28px] bg-zinc-900 flex items-center justify-center text-4xl lg:text-5xl font-bold text-[#00E6A8]">
                  JS
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#00E6A8] text-black p-1.5 rounded-xl border-4 border-[#050505] shadow-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight uppercase">Jagan S.</h1>
                <span className="px-3 py-1 rounded-full bg-[#00E6A8]/10 border border-[#00E6A8]/30 text-[#00E6A8] text-[10px] font-bold uppercase tracking-widest">
                  {report?.archetype || "Strategic Talent"}
                </span>
              </div>
              <p className="text-xl text-zinc-400 font-medium capitalize">
                {profile?.confirmed_role || profile?.inferred_role || "Software Engineer"}
              </p>
              <div className="flex items-center gap-6 text-sm text-zinc-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Global Access
                </div>
                <div className="flex items-center gap-1.5 text-[#00E6A8]">
                  <BrainCircuit className="w-3 h-3" /> Identity Report Active
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchProfileAndReport()}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all group"
            >
              <Zap className="w-4 h-4 text-[#00E6A8]" /> Regenerate Report
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-[#00E6A8] text-black rounded-2xl font-bold text-sm hover:emerald-glow transition-all">
              <Share2 className="w-4 h-4" /> Share Identity
            </button>
          </div>
        </motion.section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: AI Identity Report */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Archetype & Positioning Overview */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="liquid-glass p-10 rounded-[48px] border border-[#00E6A8]/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <Award className="w-16 h-16 text-[#00E6A8]/5" />
              </div>
              <div className="space-y-6 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#00E6A8] uppercase tracking-[0.3em] mb-2">Developer Archetype</span>
                  <h2 className="text-5xl font-bebas tracking-tighter uppercase text-white">{report?.archetype}</h2>
                </div>
                <div className="h-[1px] bg-white/5 w-full" />
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Market Positioning</span>
                  <p className="text-lg text-zinc-300 font-medium leading-relaxed italic">
                    "{report?.market_positioning}"
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Strengths & Trajectory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 px-2">Core Strengths</h3>
                <div className="space-y-3">
                  {report?.strengths.map((s, i) => (
                    <div key={i} className="p-5 rounded-3xl bg-zinc-900/50 border border-white/5 flex items-center gap-4 group hover:border-[#00E6A8]/30 transition-all">
                      <div className="w-2 h-2 rounded-full bg-[#00E6A8]" />
                      <span className="text-sm font-bold text-zinc-200">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 px-2">Career Trajectory</h3>
                <div className="liquid-glass p-8 rounded-[40px] border border-white/5 h-[calc(100%-1rem)] flex flex-col justify-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold tracking-tight text-white">{report?.trajectory}</p>
                    <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest">Target Next Role</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Focus Areas */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Recommended Focus</h3>
                <span className="text-[10px] text-[#00E6A8] font-mono">Q2 - Q3 2026</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {report?.focus_areas.map((area, i) => (
                  <div key={i} className="p-6 rounded-[32px] border border-white/5 bg-zinc-900/40 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-[#00E6A8] transition-all" />
                    </div>
                    <span className="text-4xl font-bebas text-zinc-800 mb-2 block">0{i+1}</span>
                    <p className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">{area}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Activity Heatmap */}
            <div className="glass p-8 rounded-[40px] space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-[#00E6A8]" /> Skill Acquisition Pulse
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5 opacity-50">
                {ACTIVITY_DATA.map((d, i) => (
                  <div 
                    key={i} 
                    className={`w-3 h-3 rounded-sm ${
                      d.level === 0 ? 'bg-zinc-800' :
                      d.level === 1 ? 'bg-[#00E6A8]/20' :
                      d.level === 2 ? 'bg-[#00E6A8]/50' :
                      'bg-[#00E6A8]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Readiness & Radar */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Experience Impact */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="glass p-8 rounded-[40px] border-t-4 border-t-[#00E6A8] space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#00E6A8]">Impact Score</h3>
                <TrendingUp className="w-4 h-4 text-[#00E6A8]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white">{profile?.experience_impact_score || 0}%</span>
                <span className="text-xs font-mono text-zinc-500 uppercase">Growth</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Your experience highlights significant technical leadership and optimization results.
              </p>
            </motion.div>

            {/* AI Readiness Score */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-10 rounded-[48px] flex flex-col items-center text-center space-y-8"
            >
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Industry Readiness</h3>
              
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="96" cy="96" r="88" className="stroke-zinc-800 fill-none" strokeWidth="12" />
                  <circle 
                    cx="96" cy="96" r="88" 
                    className="stroke-[#00E6A8] fill-none transition-all duration-1000" 
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - (profile?.strength_score || 0) / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-black text-[#00E6A8] text-glow">{profile?.strength_score || 0}%</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Verified</span>
                </div>
              </div>

              <div className="space-y-4 w-full pt-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500">Skill Gaps</span>
                  <span className="text-[10px] font-mono text-red-500">{report?.skill_gaps.length} Critical</span>
                </div>
                <div className="space-y-2">
                  {report?.skill_gaps.map((gap, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase bg-white/5 p-2 rounded-lg">
                      <AlertCircle className="w-3 h-3 text-red-500/50" /> {gap}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Competency Radar */}
            <div className="liquid-glass p-8 rounded-[48px] h-[400px] flex flex-col">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 px-2 tracking-widest">Competency Radar</h3>
              <div className="flex-1 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} />
                    <Radar
                      name="Skills"
                      dataKey="A"
                      stroke="#00E6A8"
                      fill="#00E6A8"
                      fillOpacity={0.2}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#00E6A8' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
