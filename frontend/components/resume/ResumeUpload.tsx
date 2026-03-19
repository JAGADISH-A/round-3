"use client";

import React, { useState, useRef } from "react";
import { Upload, X, CheckCircle, Loader2, Target, Briefcase, GraduationCap, Code2, AlertCircle, RefreshCcw, ChevronDown } from "lucide-react";
import { ENDPOINTS } from "@/lib/api-config";
import { cn } from "@/lib/utils";

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

interface ResumeUploadProps {
    onAnalysisComplete: (data: ResumeAnalysis) => void;
}

export default function ResumeUpload({ onAnalysisComplete }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roles = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "DevOps Engineer", "Data Engineer", "ML Engineer", "Android Developer",
    "iOS Developer", "QA Engineer", "Product Manager", "System Architect"
  ];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(ENDPOINTS.RESUME_UPLOAD, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Neural Link Failed: Could not parse resume.");
      
      const data = await res.json();
      setAnalysis(data);
      setSelectedRole(data.confirmed_role || data.inferred_role);
      localStorage.setItem("careerspark_last_resume", JSON.stringify(data));
      onAnalysisComplete(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRoleReanalyze = async (newRole: string) => {
    if (!analysis) return;
    setIsReanalyzing(true);
    setSelectedRole(newRole);

    try {
      const res = await fetch(ENDPOINTS.RESUME_ANALYZE_ROLE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           full_text: analysis.full_text,
           target_role: newRole
        }),
      });

      if (!res.ok) throw new Error("Re-analysis failed.");
      const data = await res.json();
      setAnalysis(data);
      localStorage.setItem("careerspark_last_resume", JSON.stringify(data));
      onAnalysisComplete(data);
    } catch (err: any) {
      setError("Failed to re-analyze for the new role.");
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!analysis && !isUploading && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-48 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:border-[#00E6A8]/20 hover:bg-[#00E6A8]/5 transition-all duration-500 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00E6A8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-[#00E6A8] opacity-40 group-hover:opacity-100" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">Inject Resume PDF</p>
            <p className="text-[10px] text-zinc-700 font-mono mt-2">Max 5MB • Neutral Extraction</p>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUpload} 
                className="hidden" 
                accept=".pdf"
            />
        </div>
      )}

      {isUploading && (
        <div className="h-48 border-2 border-white/5 rounded-[32px] flex flex-col items-center justify-center space-y-4">
             <div className="relative w-12 h-12">
                <Loader2 className="w-12 h-12 text-[#00E6A8] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#00E6A8] rounded-full animate-ping" />
                </div>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Scanning Neural Structures...</p>
        </div>
      )}

      {analysis && (() => {
        // Normalize analysis to prevent crashes on missing AI fields
        const n = {
          ...analysis,
          skills: analysis.skills ?? [],
          experience: analysis.experience ?? [],
          projects: analysis.projects ?? [],
          education: analysis.education ?? [],
          skill_gap: analysis.skill_gap ?? [],
          keyword_suggestions: analysis.keyword_suggestions ?? [],
          improvement_checklist: analysis.improvement_checklist ?? [],
          ats_score: analysis.ats_score ?? 0,
          strength_score: analysis.strength_score ?? 0,
          experience_impact_score: analysis.experience_impact_score ?? 0,
          industry_readiness: analysis.industry_readiness ?? "Beginner",
          confirmed_role: analysis.confirmed_role || analysis.inferred_role || "Unknown Role"
        };
        return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-700">
            {/* Metadata Selection */}
            <div className="liquid-glass p-8 rounded-[32px] border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-[#3b82f6]" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Target Role Tuning</h4>
                    </div>
                    {isReanalyzing && <Loader2 className="w-4 h-4 text-[#00E6A8] animate-spin" />}
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] text-zinc-500 font-mono italic">AI Inference: {n.inferred_role}</p>
                    <div className="relative group">
                        <select 
                            value={selectedRole}
                            onChange={(e) => handleRoleReanalyze(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm font-bold appearance-none hover:border-[#00E6A8]/30 transition-colors focus:outline-none focus:ring-1 focus:ring-[#00E6A8]/50"
                        >
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                    </div>
                    <p className="text-[9px] text-zinc-600 leading-relaxed font-mono">Selecting a role re-evaluates your ATS score and skill gaps against production roadmaps.</p>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                     <div className="flex items-center gap-3">
                        <Code2 className="w-5 h-5 text-[#00E6A8]" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Primary Skills</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {n.skills.map((s: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-[#00E6A8]/5 border border-[#00E6A8]/10 rounded-lg text-[10px] text-[#00E6A8] font-bold">
                                {s}
                            </span>
                        ))}
                        {n.skills.length === 0 && <p className="text-[10px] text-zinc-600 italic">No skills detected</p>}
                    </div>
                </div>
            </div>

            {/* Quick Summary / Experience */}
            <div className="liquid-glass p-8 rounded-[32px] border border-white/5 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Briefcase className="w-24 h-24" />
                </div>

                <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-amber-500" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Experience Impact</h4>
                </div>

                <div className="space-y-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {n.experience.map((exp: any, i: number) => (
                        <div key={i} className="border-l-2 border-amber-500/20 pl-4 py-1">
                            <p className="text-xs font-bold">{exp.title} <span className="text-zinc-600 font-mono text-[10px]">@ {exp.company}</span></p>
                            <p className="text-[10px] text-zinc-500 mt-1 italic">{exp.impact}</p>
                        </div>
                    ))}
                    {n.experience.length === 0 && <p className="text-xs text-zinc-600 italic">No professional experience detected</p>}
                </div>

                <div className="pt-4 flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-zinc-600 font-bold">Project Pulse</span>
                        <span className="text-sm font-bold text-white">{n.projects.length} Active Modules</span>
                     </div>
                     <button 
                        onClick={() => { setAnalysis(null); setError(null); }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all group"
                     >
                        <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                     </button>
                </div>
            </div>
        </div>
        );
      })()}

      {error && (
        <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-bounce">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">{error}</p>
        </div>
      )}
    </div>
  );
}
