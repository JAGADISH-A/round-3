"use client";

import React, { useState, useRef, useMemo } from "react";
import { Upload, X, CheckCircle, Loader2, Target, Briefcase, GraduationCap, Code2, AlertCircle, RefreshCcw, ChevronDown, Sparkles } from "lucide-react";
import { ENDPOINTS } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { ResumeAnalysis } from "@/types/resume";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { useResumeStore } from "@/store/useResumeStore";

interface ResumeUploadProps {
    onAnalysisComplete: (data: ResumeAnalysis, jdText?: string) => void;
}

const ResumeUpload = React.memo(({ onAnalysisComplete }: ResumeUploadProps) => {
  const { lang } = useLanguage();
  const t = translations[lang];
  const setStatus = useResumeStore((state) => state.setStatus);
  const setIsReanalyzingGlobal = useResumeStore((state) => state.setIsReanalyzing);
  
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [jdText, setJdText] = useState("");
  const [showJdInput, setShowJdInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const globalAnalysis = useResumeStore((state) => state.analysis);

  React.useEffect(() => {
    if (!globalAnalysis) {
      setAnalysis(null);
      setError(null);
      setShowJdInput(false);
    }
  }, [globalAnalysis]);

  const roles = useMemo(() => [
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "DevOps Engineer", "Data Engineer", "ML Engineer", "Android Developer",
    "iOS Developer", "QA Engineer", "Product Manager", "System Architect"
  ], []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus('LOADING');
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    
    // Safety check for relative URLs
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = new URL(ENDPOINTS.RESUME_UPLOAD, baseUrl);
    if (jdText.trim()) url.searchParams.set("jd_text", jdText.trim());

    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Neural Link Failed: Could not parse resume.");
      
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setStatus('ERROR');
        return;
      }
      setAnalysis(data);
      setSelectedRole(data.confirmed_role || data.inferred_role);
      onAnalysisComplete(data, jdText.trim());
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRoleReanalyze = async (newRole: string) => {
    if (!analysis) return;
    setIsReanalyzing(true);
    setIsReanalyzingGlobal(true);
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
      onAnalysisComplete(data);
    } catch (err: any) {
      setError("Failed to re-analyze for the new role.");
    } finally {
      setIsReanalyzing(false);
    }
  };

  const normalized = useMemo(() => {
    if (!analysis) return null;
    return {
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
  }, [analysis]);

  return (
    <div className="space-y-8 font-nav">
      {/* JD Paste Toggle */}
      {!analysis && (
        <div className="space-y-4">
          <button
            onClick={() => setShowJdInput(!showJdInput)}
            className={`w-full flex items-center justify-between px-6 py-4 border text-[10px] font-orbitron font-bold uppercase tracking-[0.3em] transition-all ${
              showJdInput
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                : "border-cyan-500/10 bg-transparent text-cyan-500/30 hover:border-cyan-500/30 hover:text-cyan-400"
            }`}
            style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0 100%)' }}
          >
            <span className="flex items-center gap-3">
              <div className={cn("w-1.5 h-1.5 bg-current animate-pulse", !showJdInput && "opacity-20")} />
              {showJdInput ? t.resume.upload.protocol_active : t.resume.upload.jd_override}
            </span>
            <span className="text-[9px] font-tech text-cyan-500/20">{showJdInput ? t.resume.upload.engine_ready : t.resume.upload.optional}</span>
          </button>
          
          {showJdInput && (
            <div className="animate-hud">
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder={t.resume.upload.placeholder}
                rows={6}
                className="w-full bg-cyan-950/20 border border-cyan-500/10 px-6 py-5 text-[11px] text-cyan-50 placeholder:text-cyan-500/20 font-tech resize-none focus:outline-none focus:border-cyan-500/40 transition-all custom-scrollbar"
                style={{ clipPath: 'polygon(0 0, 98% 0, 100% 15%, 100% 100%, 2% 100%, 0 85%)' }}
              />
              <div className="flex justify-between items-center mt-2 px-2 text-[8px] text-cyan-500/30 font-tech uppercase tracking-widest">
                <span>{t.resume.upload.buffer}: {jdText.length} // {t.resume.upload.signals}</span>
                <div className="flex gap-1">
                   <div className="w-1 h-1 bg-cyan-500/40" />
                   <div className="w-1 h-1 bg-cyan-500/20" />
                   <div className="w-1 h-1 bg-cyan-500/10" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!analysis && !isUploading && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-56 border border-cyan-500/10 bg-black/40 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/40 transition-all duration-500 overflow-hidden"
          style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 15%, 100% 85%, 95% 100%, 5% 100%, 0 85%, 0 15%)' }}
        >
            <div className="scan-beam" />
            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative w-20 h-20 mb-6 border border-cyan-500/20 flex items-center justify-center group-hover:border-cyan-400 group-hover:shadow-[0_0_25px_rgba(0,255,255,0.2)] transition-all bg-black">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500" />
                <Upload className="w-10 h-10 text-cyan-400 opacity-20 group-hover:opacity-100 transition-all group-hover:scale-110" />
            </div>

            <p className="text-[11px] font-orbitron font-bold uppercase tracking-[0.4em] text-cyan-500/40 group-hover:text-cyan-400 transition-colors">
              {t.resume.upload.inject}
            </p>
            <p className="text-[9px] text-cyan-500/20 font-tech mt-3 uppercase tracking-widest">
              {t.resume.upload.limit}
            </p>
            
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
        <div className="hud-panel h-56 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
             <div className="scan-beam" />
             <div className="relative w-16 h-16 border border-cyan-500/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-400 animate-ping" />
                </div>
             </div>
             <p className="text-[10px] font-orbitron font-bold text-cyan-400 uppercase tracking-[0.4em] animate-pulse">
               {t.resume.upload.mapping}
             </p>
        </div>
      )}

      {normalized && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-hud">
            {/* Metadata Selection */}
            <div className="hud-panel p-10 space-y-8 relative overflow-hidden group">
                <div className="scan-beam" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[9px] font-orbitron font-bold text-cyan-500/40 uppercase tracking-widest">{t.resume.upload.tuning}</p>
                          <h4 className="text-[11px] font-orbitron font-bold uppercase tracking-widest text-white">{t.resume.upload.role_protocol}</h4>
                        </div>
                    </div>
                    {isReanalyzing && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] text-cyan-500/60 font-tech uppercase tracking-widest bg-cyan-500/10 px-3 py-1 border-l-2 border-cyan-400">
                       <Sparkles className="w-3 h-3" />
                       {t.resume.upload.auto_inference}: {normalized.inferred_role}
                    </div>
                    <div className="relative group">
                        <select 
                            value={selectedRole}
                            onChange={(e) => handleRoleReanalyze(e.target.value)}
                            className="w-full bg-black/60 border border-cyan-500/20 px-6 py-4 text-xs font-orbitron font-bold appearance-none hover:border-cyan-500/40 transition-colors focus:outline-none text-cyan-50"
                        >
                            {roles.map(r => <option key={r} value={r} className="bg-black">{r.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/40 pointer-events-none" />
                    </div>
                    <p className="text-[9px] text-cyan-500/30 leading-relaxed font-tech uppercase tracking-widest">
                       {t.resume.upload.integrity}
                    </p>
                </div>

                <div className="pt-8 border-t border-cyan-500/10 space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                          <Code2 className="w-5 h-5" />
                        </div>
                        <h4 className="text-[11px] font-orbitron font-bold uppercase tracking-widest text-cyan-500/40">{t.resume.upload.core_skills}</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {normalized.skills.map((s: string, i: number) => (
                            <span key={i} 
                                  className="px-4 py-2 bg-cyan-500/5 border border-cyan-500/10 text-[10px] text-cyan-400 font-tech font-bold uppercase tracking-wider"
                                  style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}>
                                {s}
                            </span>
                        ))}
                        {normalized.skills.length === 0 && <p className="text-[10px] text-zinc-700 italic font-tech">{t.resume.upload.no_signals}</p>}
                    </div>
                </div>
            </div>

            {/* Quick Summary / Experience */}
            <div className="hud-panel p-10 space-y-8 relative overflow-hidden group">
                <div className="scan-beam" />
                <div className="absolute -top-10 -right-10 p-10 opacity-5 pointer-events-none">
                    <Briefcase className="w-48 h-48 text-cyan-500" />
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <h4 className="text-[11px] font-orbitron font-bold uppercase tracking-widest text-white">{t.resume.upload.impact_history}</h4>
                </div>

                <div className="space-y-6 max-h-[220px] overflow-y-auto pr-4 custom-scrollbar">
                    {normalized.experience.map((exp: any, i: number) => (
                        <div key={i} className="border-l-2 border-cyan-500/20 pl-6 py-2 bg-cyan-500/5 transition-all hover:bg-cyan-500/10 hover:border-cyan-400">
                            <p className="text-[11px] font-orbitron font-bold text-white tracking-widest">
                                {exp.title.toUpperCase()} 
                                <span className="text-cyan-500/40 font-tech text-[9px] ml-2">// {exp.company.toUpperCase()}</span>
                            </p>
                            <p className="text-[10px] text-cyan-500/40 mt-2 italic font-tech tracking-wide leading-relaxed">{exp.impact}</p>
                        </div>
                    ))}
                    {normalized.experience.length === 0 && <p className="text-[10px] text-zinc-700 italic font-tech uppercase tracking-widest">{t.resume.upload.empty_history}</p>}
                </div>

                 <div className="pt-8 flex items-center justify-between border-t border-cyan-500/10">
                      <div className="flex flex-col gap-1">
                         <span className="text-[9px] uppercase text-cyan-500/30 font-orbitron font-bold tracking-[0.3em]">{t.resume.upload.module_sync}</span>
                         <span className="text-sm font-orbitron font-bold text-white tracking-[0.2em]">{normalized.projects.length} {t.resume.upload.active_chunks}</span>
                      </div>
                      <button 
                         onClick={() => { 
                           useResumeStore.getState().resetStore();
                         }}
                         className="w-12 h-12 flex items-center justify-center border border-cyan-500/20 text-cyan-500/40 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all group"
                         style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%)' }}
                      >
                         <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                      </button>
                 </div>
            </div>
        </div>
      )}

      {error && (
        <div className="p-6 border border-red-500/20 bg-red-500/10 flex items-center gap-4 animate-hud"
             style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0 100%)' }}>
          <AlertCircle className="w-6 h-6 text-red-400" />
          <p className="text-[10px] font-orbitron font-bold uppercase text-red-400 tracking-[0.4em]">{error}</p>
        </div>
      )}
    </div>
  );
});

ResumeUpload.displayName = "ResumeUpload";
export default ResumeUpload;
