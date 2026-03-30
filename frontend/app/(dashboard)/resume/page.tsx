"use client";

import React, { useState, useRef, useMemo } from "react";
import ResumeUpload from "@/components/resume/ResumeUpload";
import BulletRewriter from "@/components/resume/BulletRewriter";
import ReadinessScoreCard from "@/components/resume/ReadinessScoreCard";
import ImprovementFeedPanel from "@/components/resume/ImprovementFeedPanel";
import ImpactBreakdownToast from "@/components/resume/ImpactBreakdownToast";
import ReanalyzeLoader from "@/components/resume/ReanalyzeLoader";
import FirstImprovementModal from "@/components/resume/FirstImprovementModal";
import { useImprovementTracker } from "@/hooks/useImprovementTracker";
import { useScoreFeedback } from "@/hooks/useScoreFeedback";
import { useResumeAnalysis } from "@/hooks/useResumeAnalysis";
import { ResumeAnalysis } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";
import LiveResumeEditor from "@/components/resume/LiveEditor";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, Zap, ShieldCheck, AlertCircle, CheckCircle2, Award, TrendingUp, Search, Layers, ClipboardList, RotateCcw, BrainCircuit, MessageSquare, History as HistoryIcon, Crosshair, Lightbulb, ArrowRight, Sparkles, MousePointerClick, Wand2, Edit3, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export default function ResumePage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const { 
    analysis, 
    setInitialAnalysis, 
    applyBullet, 
    isReanalyzing, 
    lastImpact,
    jdText
  } = useResumeAnalysis();

  const status = useResumeStore((state) => state.status);
  const setStatus = useResumeStore((state) => state.setStatus);
  const resumeText = useResumeStore((state) => state.resumeText);
  const _hasHydrated = useResumeStore((state) => state._hasHydrated);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [rewriterBullet, setRewriterBullet] = useState("");

  const [readiness, setReadiness] = useState<{ score: number; label: string; delta?: number } | null>(null);
  const [firstImprovementDelta, setFirstImprovementDelta] = useState(0);

  const tracker = useImprovementTracker(0);
  const feedback = useScoreFeedback();
  const currentScoreRef = useRef(0);

  const handleAnalysisComplete = (data: ResumeAnalysis, jdText?: string) => {
    setInitialAnalysis(data, jdText);
    const jdScore = data.jd_match?.jd_match_score ?? data.jd_match?.score ?? 0;
    currentScoreRef.current = jdScore;
    tracker.resetSession(jdScore);
    setReadiness(null);
    setFirstImprovementDelta(0);
  };

  // ─── Recovery Logic ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!_hasHydrated) return;
    
    const triggerRecovery = async () => {
      if (resumeText && !analysis && status === 'IDLE') {
        setStatus('LOADING');
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
          const res = await fetch(`${apiUrl}/api/resume/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              text: resumeText,
              jd_text: jdText || "" 
            }),
          });
          const data = await res.json();
          if (data.error) {
            console.error("Recovery analysis failed:", data.error);
            useResumeStore.getState().resetStore();
            return;
          }
          handleAnalysisComplete(data, jdText);
        } catch (err) {
          console.error("Recovery failed:", err);
          setStatus('IDLE');
        }
      }
    };

    triggerRecovery();
  }, [_hasHydrated, resumeText, analysis, status, jdText, setStatus]);

  const handleScoreUpdate = React.useCallback((
    delta: number,
    newScore: number,
    readinessScore: number,
    readinessLabel: string,
    micro: string
  ) => {
    currentScoreRef.current = newScore;
    tracker.trackImprovement("bullet_update", micro, delta);
    setReadiness((prev) => ({ 
      score: readinessScore, 
      label: readinessLabel, 
      delta: prev ? readinessScore - prev.score : undefined 
    }));
    if (delta > 0) setFirstImprovementDelta(delta);
    feedback.triggerAll(delta);
  }, [tracker, feedback]);

  const normalizedAnalysis = useMemo(() => {
    if (!analysis) return null;
    return {
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
      readiness_score: analysis.readiness_score ?? 0,
      confirmed_role: analysis.confirmed_role || analysis.inferred_role || t.resume.unknown_role
    };
  }, [analysis]);

  const handleSkillClick = React.useCallback(async (skill: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res = await fetch(`${apiUrl}/api/resume/generate-bullet-from-skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, role: normalizedAnalysis?.confirmed_role || normalizedAnalysis?.inferred_role || "Software Engineer" }),
      });
      const data = await res.json();
      setRewriterBullet(data.bullet);
      document.getElementById("bullet-rewriter-section")?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setRewriterBullet(t.resume.skill_context.replace('{skill}', skill));
    }
  }, [normalizedAnalysis]);

  const onBulletAccepted = React.useCallback((text: string, original?: string, skipUpdate?: boolean) => {
    const impact = applyBullet(text, original, skipUpdate);
    if (impact) {
      handleScoreUpdate(
        impact.delta,
        impact.newScore,
        readiness?.score ?? 0,
        readiness?.label ?? "",
        `${impact.newlyMatched.length} keywords improved`
      );
      feedback.triggerAll(impact.delta);
    }
  }, [applyBullet, handleScoreUpdate, readiness, feedback]);

  const radarData = useMemo(() => {
    if (!normalizedAnalysis) return [];
    return [
      { subject: t.resume.radar.subjects.skills, A: normalizedAnalysis.strength_score, fullMark: 100 },
      { subject: t.resume.radar.subjects.ats, A: normalizedAnalysis.ats_score, fullMark: 100 },
      { subject: t.resume.radar.subjects.impact, A: normalizedAnalysis.experience_impact_score, fullMark: 100 },
      { subject: t.resume.radar.subjects.readiness, A: normalizedAnalysis.readiness_score || (
          normalizedAnalysis.industry_readiness === "Strong Candidate" ? 95 : 
          normalizedAnalysis.industry_readiness === "Interview Ready" ? 80 : 
          normalizedAnalysis.industry_readiness === "Improving" ? 60 : 40
      ), fullMark: 100 },
      { subject: t.resume.radar.subjects.projects, A: Math.min((normalizedAnalysis.projects?.length || 0) * 20, 100), fullMark: 100 },
    ];
  }, [normalizedAnalysis, t]);

  return (
    <div className="h-full flex flex-col bg-transparent text-white overflow-hidden">
      <ImpactBreakdownToast impact={lastImpact} visible={lastImpact !== null} />
      <FirstImprovementModal delta={firstImprovementDelta} visible={feedback.showFirstModal} onDismiss={feedback.dismissModal} />

      <header className="h-[64px] border-b border-cyan-500/10 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-cyan-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-orbitron font-bold tracking-tight">{t.resume.title}</h1>
            <p className="text-[10px] text-cyan-500/40 font-tech uppercase tracking-[0.2em]">{t.resume.subtitle}</p>
          </div>
        </div>
        {normalizedAnalysis && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => useResumeStore.getState().resetStore()}
              className="flex items-center gap-2 px-4 py-1.5 border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] font-orbitron uppercase tracking-widest hover:bg-red-500/10 transition-all mr-2"
              title="Clear session and start fresh"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}
            >
              <RotateCcw className="w-3 h-3" />
              {t.resume.reset}
            </button>

            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 text-[10px] font-orbitron uppercase tracking-widest transition-all border",
                isEditMode 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]" 
                  : "bg-cyan-500/5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
              )}
              style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}
            >
              {isEditMode ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
              {isEditMode ? t.resume.dashboard_view : t.resume.edit_stream}
            </button>

            <button 
              onClick={() => {
                sessionStorage.setItem("careerspark_analysis_context", JSON.stringify({ trigger: true }));
                window.location.href = "/chat?persona=resume_reviewer";
              }}
              className="tactical-button h-8 px-6 text-[10px]"
            >
              <MessageSquare className="w-3 h-3 mr-2 inline" />
              {t.resume.consult_ai}
            </button>
            <div className="flex items-center gap-3 px-4 py-1.5 border border-cyan-500/10 bg-cyan-500/5">
              <span className="text-[10px] font-orbitron text-cyan-500/30 uppercase tracking-widest">{t.resume.target_node}</span>
              <span className="text-[10px] font-bold text-cyan-400 uppercase font-tech tracking-wider">{normalizedAnalysis.confirmed_role}</span>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.02),transparent)]">
        <div className="max-w-[1600px] mx-auto p-8 lg:p-12">
          {!_hasHydrated ? (
             <div className="h-[60vh] flex items-center justify-center">
               <div className="animate-pulse text-cyan-500 font-tech text-xs uppercase tracking-[0.4em]">{t.resume.hydrating}</div>
             </div>
          ) : !normalizedAnalysis ? (
            <div className="max-w-4xl mx-auto py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
               <div className="text-center space-y-2 mb-12">
                 <h2 className="text-3xl font-orbitron tracking-widest uppercase">{t.resume.initializing}</h2>
                 <p className="text-xs text-cyan-500/40 font-tech uppercase tracking-[0.3em]">{t.resume.awaiting_stream}</p>
               </div>
               <ResumeUpload onAnalysisComplete={handleAnalysisComplete} />
            </div>
          ) : (
            <>
              {isEditMode ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-500 h-full">
                  <div className="lg:col-span-12 h-[calc(100vh-160px)]">
                    <LiveResumeEditor 
                      initialText={normalizedAnalysis.full_text} 
                      initialScore={normalizedAnalysis.jd_match?.jd_match_score}
                      jdText={jdText}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  
                  <div className="lg:col-span-8 hud-panel p-10 relative overflow-hidden min-h-[500px]">
                    <div className="absolute top-10 left-10">
                      <h3 className="text-3xl font-orbitron tracking-tighter uppercase mb-1">{t.resume.radar.title} <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">{t.resume.radar.accent}</span></h3>
                      <p className="text-[10px] text-cyan-500/40 font-tech uppercase tracking-[0.2em]">{t.resume.radar.subtitle}</p>
                    </div>
                    
                    <div className="w-full h-full pt-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#00ffff10" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#00ffff60', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-tech-mono)' }} />
                          <Radar isAnimationActive={false} name="Candidate" dataKey="A" stroke="#00FFFF" fill="#00FFFF" fillOpacity={0.15} strokeWidth={2} />
                          <Tooltip contentStyle={{ backgroundColor: '#020406', borderColor: '#00ffff30', borderRadius: '0' }} itemStyle={{ color: '#00FFFF', fontFamily: 'var(--font-tech-mono)' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-orbitron font-black uppercase text-amber-500 tracking-[0.2em] flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> {t.resume.gap_detected}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {normalizedAnalysis.skill_gap.map((skill: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-500/60 font-tech uppercase tracking-tighter">{skill}</span>
                          ))}
                          {normalizedAnalysis.skill_gap.length === 0 && <p className="text-[10px] text-cyan-500/30 font-tech uppercase italic">{t.resume.no_gaps}</p>}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-orbitron font-black uppercase text-cyan-400 tracking-[0.2em] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> {t.resume.growth_nodes}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {normalizedAnalysis.keyword_suggestions.map((word: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-cyan-500/5 border border-cyan-500/20 text-[10px] text-cyan-400 font-tech uppercase tracking-tighter hover:bg-cyan-500/10 cursor-default transition-colors">{word}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="hud-panel p-6 overflow-hidden">
                       <ReadinessScoreCard 
                        readiness={readiness?.score || normalizedAnalysis.readiness_score || (
                          normalizedAnalysis.industry_readiness === "Strong Candidate" ? 95 : 
                          normalizedAnalysis.industry_readiness === "Interview Ready" ? 80 : 60
                        )} 
                        label={readiness?.label || normalizedAnalysis.industry_readiness} 
                        delta={readiness?.delta}
                      />
                    </div>
                  </div>

                  {normalizedAnalysis.jd_match && (
                    <div ref={feedback.scoreRef} className={cn("lg:col-span-12 hud-panel p-10 relative overflow-hidden transition-all", feedback.isHighlighting && "shadow-[0_0_30px_rgba(34,197,94,0.3)]")}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center text-emerald-400">
                          <Crosshair className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-orbitron tracking-tighter uppercase">{t.resume.jd_match.title} <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">{t.resume.jd_match.accent}</span></h3>
                          <p className="text-[10px] text-cyan-500/40 font-tech uppercase tracking-[0.3em]">{t.resume.jd_match.subtitle}</p>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-orbitron font-black text-emerald-400">{normalizedAnalysis.jd_match.jd_match_score}</span>
                            <span className="text-xs text-cyan-500/40 font-tech">/ 100</span>
                          </div>
                          <span className={cn("text-[10px] font-orbitron font-black uppercase tracking-widest px-3 py-1 mt-1 inline-block border", (normalizedAnalysis.jd_match.jd_match_score ?? 0) >= 60 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : (normalizedAnalysis.jd_match.jd_match_score ?? 0) >= 30 ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
                             {t.resume.analyzing_label}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1 bg-cyan-500/10 overflow-hidden mb-4">
                        <div className={cn("h-full transition-all duration-1000 ease-out", (normalizedAnalysis.jd_match.jd_match_score ?? 0) >= 60 ? "bg-emerald-500" : (normalizedAnalysis.jd_match.jd_match_score ?? 0) >= 30 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${normalizedAnalysis.jd_match.jd_match_score}%` }} />
                      </div>
                      <p className="text-[10px] font-tech text-cyan-500/30 mb-8 uppercase tracking-widest">{t.resume.jd_match.signal_lock}: {normalizedAnalysis.jd_match.tech_matched_count} / {normalizedAnalysis.jd_match.tech_required_count} {t.resume.jd_match.nodes_matched}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-orbitron font-black uppercase text-emerald-400 tracking-[0.2em] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> {t.resume.jd_match.matched_kws}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {normalizedAnalysis.jd_match.matched_keywords.map((word: string, i: number) => (
                              <div key={i} className={cn("px-2.5 py-1 text-[10px] font-tech border transition-all duration-700 uppercase tracking-tighter", lastImpact?.newlyMatched.includes(word) ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-300/60")}>{word}</div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-orbitron font-black uppercase text-red-400 tracking-[0.2em] flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {t.resume.jd_match.gap_injection}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(normalizedAnalysis.jd_match.missing_with_labels || normalizedAnalysis.jd_match.missing_keywords.map((k: string) => ({ keyword: k, label: t.resume.insights.critical }))).map((item: any, i: number) => (
                              <button key={i} onClick={() => handleSkillClick(item.keyword || item)} className="px-3 py-1.5 bg-red-500/5 border border-red-500/20 text-[10px] text-red-300/40 font-tech uppercase tracking-tighter hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 transition-all cursor-pointer">{item.keyword || item}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {normalizedAnalysis.jd_match && (normalizedAnalysis.jd_match.action_insights?.length ?? 0) > 0 && (
                    <div className="lg:col-span-12 hud-panel p-10 relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 border border-amber-500/20 bg-amber-500/5 flex items-center justify-center text-amber-400">
                          <Lightbulb className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-orbitron tracking-tighter uppercase">{t.resume.insights.title}</h3>
                          <p className="text-[10px] text-cyan-500/40 font-tech uppercase tracking-[0.3em]">{t.resume.insights.subtitle}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {normalizedAnalysis.jd_match.action_insights!.map((insight: any, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-5 bg-black/40 border border-cyan-500/10 hover:border-amber-500/30 transition-all group relative">
                             <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20" />
                             <div className={cn("w-8 h-8 flex items-center justify-center text-xs shrink-0 mt-0.5", insight.type === "critical_skill" ? "text-red-400" : "text-amber-400")}>
                               {insight.type === "critical_skill" ? <AlertCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                             </div>
                             <p className="text-sm text-cyan-50/70 font-nav group-hover:text-white transition-colors leading-relaxed">{insight.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {normalizedAnalysis.jd_match && (normalizedAnalysis.jd_match.suggested_bullets?.length ?? 0) > 0 && (
                    <div className="lg:col-span-12 hud-panel p-10 relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 border border-sky-500/20 bg-sky-500/5 flex items-center justify-center text-sky-400">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-orbitron tracking-tighter uppercase">{t.resume.bullets.title}</h3>
                          <p className="text-[10px] text-cyan-500/40 font-tech uppercase tracking-[0.3em]">{t.resume.bullets.subtitle}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {normalizedAnalysis.jd_match.suggested_bullets!.map((b: string, i: number) => (
                          <div key={i} className="flex items-center justify-between gap-4 p-5 bg-black/40 border border-cyan-500/10 hover:border-sky-500/30 transition-all group">
                            <p className="text-sm text-cyan-50/80 font-nav group-hover:text-white transition-colors flex-1 leading-relaxed">{b}</p>
                             <button onClick={() => { setRewriterBullet(b); document.getElementById("bullet-rewriter-section")?.scrollIntoView({ behavior: "smooth" }); applyBullet(b); }} className="px-4 py-2 border border-sky-500/20 bg-sky-500/10 text-sky-300 text-[10px] font-orbitron uppercase tracking-widest hover:bg-sky-500/20 transition-all"><Wand2 className="w-4 h-4 mr-2 inline" /> {t.resume.bullets.use_node}</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tracker.improvements.length > 0 && (
                    <div className="lg:col-span-12">
                      <ImprovementFeedPanel improvements={tracker.improvements} totalImprovement={tracker.totalImprovement} />
                    </div>
                  )}

                  <div className="lg:col-span-12" id="bullet-rewriter-section">
                    <BulletRewriter targetRole={normalizedAnalysis.confirmed_role || normalizedAnalysis.inferred_role} externalBullet={rewriterBullet} jdText={jdText} resumeText={normalizedAnalysis.full_text} previousScore={currentScoreRef.current} onScoreUpdate={handleScoreUpdate} onBulletAccepted={onBulletAccepted} />
                  </div>

                  <div className="lg:col-span-12 hud-panel p-12 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:scale-[1.6] transition-transform duration-1000">
                        <HistoryIcon className="w-64 h-64 text-cyan-500" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-10">
                          <div className="w-12 h-12 border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-cyan-400"><BrainCircuit className="w-6 h-6" /></div>
                          <div>
                            <h3 className="text-3xl font-orbitron tracking-tighter uppercase">{t.resume.protocol.title}</h3>
                            <p className="text-[10px] text-cyan-500/40 font-tech uppercase tracking-[0.3em]">{t.resume.protocol.subtitle}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-nav">
                          {normalizedAnalysis.improvement_checklist.slice(0, 4).map((item: any, i: number) => (
                            <div key={i} className="p-6 bg-black/40 border border-cyan-500/10 group/item hover:border-cyan-500/30 transition-all relative">
                              <div className="absolute top-0 left-0 w-1 h-2 bg-cyan-500/40" />
                              <span className={cn("text-[9px] font-orbitron font-black px-2 py-0.5 border uppercase tracking-widest", item.priority === "High" ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400")}>{item.priority}</span>
                              <p className="text-sm font-medium text-cyan-50/70 mt-4 group-hover/item:text-white transition-colors">{item.task}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const MetricCard = React.memo(({ label, value, icon, color, isScore = true, desc }: { label: string, value: any, icon: any, color: string, isScore?: boolean, desc?: string }) => {
  return (
    <div className="hud-panel p-7 hover:bg-cyan-500/5 transition-all group relative overflow-hidden">
      <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity text-cyan-500">
        {React.cloneElement(icon, { size: 80 })}
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="text-cyan-400 opacity-60 scale-110">
          {React.cloneElement(icon, { size: 18 })}
        </div>
        <span className="text-[10px] font-orbitron font-black uppercase tracking-[0.2em] text-cyan-500/40">{label}</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black font-orbitron tracking-tighter text-white">
            {isScore ? value : <span className="text-2xl">{value}</span>}
          </span>
          {isScore && <span className="text-xs text-cyan-500/40 font-tech">%</span>}
        </div>
        <p className="text-[10px] text-cyan-500/30 italic font-tech uppercase tracking-wider">{desc}</p>
        {isScore && (
          <div className="w-full h-1 bg-cyan-500/10 overflow-hidden mt-4">
            <div 
              className="h-full bg-cyan-500 transition-all duration-1000 ease-out" 
              style={{ width: `${value}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

MetricCard.displayName = "MetricCard";
