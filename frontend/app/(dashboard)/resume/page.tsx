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
import { useResumeStore } from "@/store/useResumeStore";
import LiveEditor from "@/components/resume/LiveEditor";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, Zap, ShieldCheck, AlertCircle, CheckCircle2, Award, TrendingUp, Search, Layers, ClipboardList, RotateCcw, BrainCircuit, MessageSquare, History as HistoryIcon, Crosshair, Lightbulb, ArrowRight, Sparkles, MousePointerClick, Wand2, Edit3, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { ResumeAnalysis } from "@/types/resume";

export default function ResumePage() {
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
        if (process.env.NODE_ENV === "development") {
          console.debug("RECOVERY: Resume text exists but no analysis. Triggering...");
        }
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
      confirmed_role: analysis.confirmed_role || analysis.inferred_role || "Unknown Role"
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
      setRewriterBullet(`Worked with ${skill} in a project context`);
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
      { subject: 'Skills', A: normalizedAnalysis.strength_score, fullMark: 100 },
      { subject: 'ATS Score', A: normalizedAnalysis.ats_score, fullMark: 100 },
      { subject: 'Impact', A: normalizedAnalysis.experience_impact_score, fullMark: 100 },
      { subject: 'Readiness', A: normalizedAnalysis.readiness_score || (
          normalizedAnalysis.industry_readiness === "Strong Candidate" ? 95 : 
          normalizedAnalysis.industry_readiness === "Interview Ready" ? 80 : 
          normalizedAnalysis.industry_readiness === "Improving" ? 60 : 40
      ), fullMark: 100 },
      { subject: 'Projects', A: Math.min((normalizedAnalysis.projects?.length || 0) * 20, 100), fullMark: 100 },
    ];
  }, [normalizedAnalysis]);

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden">
      <ImpactBreakdownToast impact={lastImpact} visible={lastImpact !== null} />
      <FirstImprovementModal delta={firstImprovementDelta} visible={feedback.showFirstModal} onDismiss={feedback.dismissModal} />

      <header className="h-[64px] border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Resume Intelligence</h1>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Resume Analysis</p>
          </div>
        </div>
        {normalizedAnalysis && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => useResumeStore.getState().resetStore()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all mr-2"
              title="Clear session and start fresh"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>

            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                isEditMode 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_158px_rgba(245,158,11,0.2)]" 
                  : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
              )}
            >
              {isEditMode ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
              {isEditMode ? "View Dashboard" : "Live Edit Resume"}
            </button>

            <button 
              onClick={() => {
                sessionStorage.setItem("careerspark_analysis_context", JSON.stringify({ trigger: true }));
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

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
          
          {!_hasHydrated ? (
             <div className="flex-1 flex items-center justify-center">
               <div className="animate-pulse text-zinc-500 font-mono text-xs uppercase tracking-widest">Hydrating Session...</div>
             </div>
          ) : isEditMode && normalizedAnalysis ? (
            <LiveEditor 
              initialText={normalizedAnalysis.full_text}
              initialScore={normalizedAnalysis.jd_match?.jd_match_score ?? 0}
              jdText={jdText}
              onExit={() => setIsEditMode(false)}
            />
          ) : (
            <>
              {status === 'LOADING' && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center">
                  <ReanalyzeLoader visible={true} />
                </div>
              )}

              <section className={cn("transition-all duration-700", (analysis || status === 'LOADING') ? "opacity-0 h-0 overflow-hidden" : "opacity-100 mb-12")}>
                <div className="mb-6 text-center">
                  <p className="text-zinc-500 text-xs font-medium">Upload your PDF resume to get an instant AI-powered performance analysis.</p>
                </div>
                <ResumeUpload onAnalysisComplete={handleAnalysisComplete} />
              </section>

              {normalizedAnalysis && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  
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
                          <Radar isAnimationActive={false} name="Candidate" dataKey="A" stroke="#FFD600" fill="#FFD600" fillOpacity={0.15} strokeWidth={2} />
                          <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '16px' }} itemStyle={{ color: '#FFD600' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-5">
                        <h4 className="text-[11px] font-black uppercase text-amber-500 tracking-[0.2em] flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Detected Gaps
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {normalizedAnalysis.skill_gap.map((skill: string, i: number) => (
                            <span key={i} className="px-3 py-2 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-200/50 font-medium">{skill}</span>
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
                            <span key={i} className="px-3 py-2 bg-primary/5 border border-primary/10 rounded-xl text-xs text-primary/50 font-medium hover:scale-105 transition-transform cursor-default">{word}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {normalizedAnalysis.jd_match && (
                      <MetricCard 
                        label="JD Match Score" 
                        value={normalizedAnalysis.jd_match.jd_match_score || 0} 
                        icon={<Target />} 
                        color="#FFD600" 
                        desc={normalizedAnalysis.jd_match.match_label || "Analyzing..."}
                      />
                    )}

                    <div className="bg-zinc-900 overflow-hidden font-grotesk">
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
                    <>
                      <div ref={feedback.scoreRef} className={cn("lg:col-span-12 liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden transition-all", feedback.isHighlighting && "score-highlight")}>
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
                            <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1 inline-block font-grotesk", normalizedAnalysis.jd_match.jd_match_score >= 60 ? "bg-emerald-500/10 text-emerald-400" : normalizedAnalysis.jd_match.jd_match_score >= 30 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400")}>
                              {normalizedAnalysis.jd_match.match_label}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden mb-4">
                          <div className={cn("h-full transition-all duration-1000 ease-out rounded-full", normalizedAnalysis.jd_match.jd_match_score >= 60 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : normalizedAnalysis.jd_match.jd_match_score >= 30 ? "bg-gradient-to-r from-amber-600 to-amber-400" : "bg-gradient-to-r from-red-600 to-red-400")} style={{ width: `${normalizedAnalysis.jd_match.jd_match_score}%` }} />
                        </div>
                        <p className="text-[10px] font-mono text-zinc-600 mb-6 font-grotesk uppercase tracking-widest">Tech: {normalizedAnalysis.jd_match.tech_matched_count} / {normalizedAnalysis.jd_match.tech_required_count} matched</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <h4 className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.2em] flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Matched Keywords
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {normalizedAnalysis.jd_match.matched_keywords.map((word, i) => (
                                <div key={i} className={cn("px-2.5 py-1 text-[11px] font-mono rounded-md border backdrop-blur-sm transition-all duration-700", lastImpact?.newlyMatched.includes(word) ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300")}>{word}</div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-[11px] font-black uppercase text-red-400 tracking-[0.2em] flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" /> Missing Keywords
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {(normalizedAnalysis.jd_match.missing_with_labels || normalizedAnalysis.jd_match.missing_keywords.map(k => ({ keyword: k, label: "Critical Gap" }))).map((item: any, i: number) => (
                                <button key={i} onClick={() => handleSkillClick(item.keyword || item)} className="px-3 py-1.5 bg-red-500/5 border border-red-500/20 rounded-xl text-xs text-red-300/60 font-medium hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 transition-all cursor-pointer">{item.keyword || item}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {(normalizedAnalysis.jd_match.action_insights?.length ?? 0) > 0 && (
                        <div className="lg:col-span-12 liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                              <Lightbulb className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bebas tracking-wide uppercase">Action <span className="text-amber-400">Insights</span></h3>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {normalizedAnalysis.jd_match.action_insights!.map((insight: any, i: number) => (
                              <div key={i} className="flex items-start gap-4 p-5 bg-black/40 border border-white/5 rounded-3xl hover:border-amber-500/20 transition-all group">
                                 <div className={cn("w-8 h-8 rounded-2xl flex items-center justify-center text-xs shrink-0 mt-0.5", insight.type === "critical_skill" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400")}>
                                   {insight.type === "critical_skill" ? <AlertCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                 </div>
                                 <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">{insight.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(normalizedAnalysis.jd_match.suggested_bullets?.length ?? 0) > 0 && (
                        <div className="lg:col-span-12 liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                              <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bebas tracking-wide uppercase">Suggested <span className="text-sky-400">Bullets</span></h3>
                          </div>
                          <div className="space-y-3">
                            {normalizedAnalysis.jd_match.suggested_bullets!.map((b: string, i: number) => (
                              <div key={i} className="flex items-center justify-between gap-4 p-5 bg-black/40 border border-white/5 rounded-3xl hover:border-sky-500/20 transition-all group">
                                <p className="text-sm text-zinc-300 group-hover:text-white transition-colors flex-1">{b}</p>
                                 <button onClick={() => { setRewriterBullet(b); document.getElementById("bullet-rewriter-section")?.scrollIntoView({ behavior: "smooth" }); applyBullet(b); }} className="px-4 py-2 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-black uppercase tracking-widest hover:bg-sky-500/20 transition-all font-grotesk"><Wand2 className="w-3 h-3" /> Use this</button>
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
                    </>
                  )}

                  {!normalizedAnalysis.jd_match && normalizedAnalysis && (
                    <div className="lg:col-span-12" id="bullet-rewriter-section">
                      <BulletRewriter targetRole={normalizedAnalysis.confirmed_role || normalizedAnalysis.inferred_role} resumeText={normalizedAnalysis.full_text} onBulletAccepted={(text) => tracker.trackImprovement("bullet_update", "Enhanced resume content", 0)} />
                    </div>
                  )}

                  <div className="lg:col-span-12 liquid-glass p-12 rounded-[56px] border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:scale-[1.6] transition-transform duration-1000">
                        <HistoryIcon className="w-64 h-64 text-primary" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-10">
                          <div className="w-12 h-12 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><BrainCircuit className="w-6 h-6" /></div>
                          <div>
                            <h3 className="text-3xl font-bebas tracking-wide uppercase">Optimization <span className="text-primary">Protocol</span></h3>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-grotesk">
                          {normalizedAnalysis.improvement_checklist.slice(0, 4).map((item: any, i: number) => (
                            <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-3xl group/item hover:border-primary/20 transition-all">
                              <span className={cn("text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest", item.priority === "High" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary")}>{item.priority}</span>
                              <p className="text-sm font-medium text-zinc-300 mt-4">{item.task}</p>
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
    <div className="liquid-glass p-7 rounded-[40px] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden font-grotesk">
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
});

MetricCard.displayName = "MetricCard";
