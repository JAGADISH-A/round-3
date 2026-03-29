"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Wand2, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import BeforeAfterPanel from "./BeforeAfterPanel";
import ScoreDeltaBadge from "./ScoreDeltaBadge";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

interface BulletRewriterProps {
  targetRole?: string;
  externalBullet?: string;
  jdText?: string;
  resumeText?: string;
  previousScore?: number;
  onScoreUpdate?: (delta: number, newScore: number, readiness: number, readinessLabel: string, micro: string) => void;
  onBulletAccepted?: (text: string, original?: string, skipUpdate?: boolean) => void;
}

const BulletRewriter = React.memo(({
  targetRole = "Software Engineer",
  externalBullet = "",
  jdText = "",
  resumeText = "",
  previousScore = 0,
  onScoreUpdate,
  onBulletAccepted,
}: BulletRewriterProps) => {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [bullet, setBullet] = useState(externalBullet);
  const [rewritten, setRewritten] = useState("");
  const [improvements, setImprovements] = useState<string[]>([]);
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [impactSummary, setImpactSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  // Score feedback state
  const [scoreData, setScoreData] = useState<{
    newScore: number;
    delta: number;
    label: string;
  } | null>(null);
  const [inlineDelta, setInlineDelta] = useState<number | null>(null);
  const isRescoring = useRef(false);

  const { resumeText: storeResumeText } = useResumeStore();

  // Sync when parent sends a new bullet (from clickable skill)
  useEffect(() => {
    if (externalBullet && externalBullet !== bullet) {
      setBullet(externalBullet);
      setRewritten("");
      setImprovements([]);
      setBefore("");
      setAfter("");
      setImpactSummary("");
      setScoreData(null);
      setInlineDelta(null);
    }
  }, [externalBullet]);

  const handleRewrite = useCallback(async () => {
    if (!bullet.trim()) return;
    setIsLoading(true);
    setRewritten("");
    setImprovements([]);
    setBefore("");
    setAfter("");
    setImpactSummary("");
    setScoreData(null);
    setInlineDelta(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res = await fetch(`${apiUrl}/api/resume/rewrite-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet,
          role: targetRole,
          jd_text: jdText || undefined,
        }),
      });

      if (!res.ok) throw new Error("Rewrite failed");
      const data = await res.json();
      setRewritten(data.rewritten);
      setImprovements(data.improvements || []);
      setBefore(data.before || bullet);
      setAfter(data.after || data.rewritten);
      setImpactSummary(data.impact_summary || "");

      // Trigger rescore only if JD context is available to show potential impact
      if (jdText && storeResumeText && !isRescoring.current) {
        isRescoring.current = true;
        try {
          const updatedResume = storeResumeText + "\n" + (data.after || data.rewritten);
          const rescoreRes = await fetch(`${apiUrl}/api/resume/rescore`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              updated_resume_text: updatedResume,
              jd_text: jdText,
              previous_score: previousScore,
              role: targetRole,
            }),
          });
          if (rescoreRes.ok) {
            const rescoreData = await rescoreRes.json();
            setScoreData({
              newScore: rescoreData.new_score,
              delta: rescoreData.score_delta,
              label: rescoreData.match_label,
            });
            setInlineDelta(rescoreData.score_delta);
            onScoreUpdate?.(
              rescoreData.score_delta,
              rescoreData.new_score,
              rescoreData.resume_readiness,
              rescoreData.readiness_label,
              rescoreData.micro_feedback
            );
          }
        } catch (err) {
          console.error("Rescore failed:", err);
        } finally {
          isRescoring.current = false;
        }
      }
    } catch (err) {
      console.error("Rewrite failed:", err);
      setRewritten("⚠️ Could not rewrite. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [bullet, targetRole, jdText, storeResumeText, previousScore, onScoreUpdate]);

  const handleCopy = async () => {
    if (!rewritten.trim()) return;
    try {
      await navigator.clipboard.writeText(rewritten);
      setCopied(true);
      if (process.env.NODE_ENV === "development") {
        console.log("Copied to clipboard");
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-amber-400">
          <Wand2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bebas tracking-wide uppercase">{t.resume.rewriter.title} <span className="text-amber-400">{t.resume.rewriter.accent}</span></h3>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">{t.resume.rewriter.subtitle}</p>
        </div>

        {/* Score badge — shown after rescore */}
        {scoreData && (
          <div className="ml-auto">
            <ScoreDeltaBadge
              newScore={scoreData.newScore}
              delta={scoreData.delta}
              label={scoreData.label}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.resume.rewriter.weak_label}</label>
          <textarea
            value={bullet}
            onChange={(e) => setBullet(e.target.value)}
            placeholder={t.resume.rewriter.placeholder}
            rows={4}
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-zinc-300 placeholder:text-zinc-700 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
          <button
            onClick={handleRewrite}
            disabled={isLoading || !bullet.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isLoading ? t.resume.rewriter.rewriting : t.resume.rewriter.rewrite_btn}
          </button>

          {/* Inline delta feedback near button */}
          {inlineDelta !== null && (
            <p className={`text-[11px] font-bold text-center animate-in fade-in slide-in-from-bottom-2 duration-400 ${
              inlineDelta > 0 ? "text-emerald-400" :
              inlineDelta < 0 ? "text-red-400" :
              "text-amber-400"
            }`}>
              {inlineDelta > 0
                ? `+${inlineDelta} impact on JD Match`
                : inlineDelta < 0
                ? `${inlineDelta} score impact`
                : "This change did not affect your score. Try adding missing skills."}
            </p>
          )}
        </div>

        {/* Output */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.resume.rewriter.impact_label}</label>
          <div className={`relative min-h-[100px] bg-black/40 border rounded-2xl px-5 py-4 transition-all ${rewritten ? "border-primary/20" : "border-white/5"}`}>
            {rewritten ? (
              <>
                <p className="text-sm text-white font-medium leading-relaxed pr-20">{rewritten}</p>
                <div className="absolute top-3 right-3 text-right">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        const store = useResumeStore.getState();
                        store.updateResumeSection(bullet, rewritten);
                        setApplied(true);
                        setTimeout(() => setApplied(false), 2000);
                      }}
                      disabled={applied}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all shadow-lg",
                        applied 
                          ? "bg-emerald-500 text-white" 
                          : "bg-primary text-black hover:bg-amber-400"
                      )}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {applied ? t.resume.rewriter.applied : t.resume.rewriter.apply}
                    </button>
                    <button
                      onClick={handleCopy}
                      disabled={copied}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all shadow-lg",
                        copied 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          : "bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10"
                      )}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? t.resume.rewriter.copied : t.resume.rewriter.copy}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-700 italic font-mono">
                {isLoading ? t.resume.rewriter.loading : t.resume.rewriter.empty}
              </p>
            )}
          </div>

          {/* Improvements list */}
          {improvements.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> {t.resume.rewriter.improved}
              </p>
              {improvements.map((imp, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-1 h-1 rounded-full bg-primary/50" />
                  {imp}
                </div>
              ))}
            </div>
          )}

          {rewritten && !improvements.length && (
            <p className="text-[9px] text-zinc-700 font-mono">
              {t.resume.rewriter.optimized.replace('{role}', targetRole)}
            </p>
          )}
        </div>
      </div>

      {/* Before / After panel */}
      {before && after && (
        <BeforeAfterPanel
          before={before}
          after={after}
          impactSummary={impactSummary}
          improvements={improvements}
        />
      )}
    </div>
  );
});

BulletRewriter.displayName = "BulletRewriter";
export default BulletRewriter;
