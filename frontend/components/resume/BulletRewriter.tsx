"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Wand2, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import BeforeAfterPanel from "./BeforeAfterPanel";
import ScoreDeltaBadge from "./ScoreDeltaBadge";

interface BulletRewriterProps {
  targetRole?: string;
  externalBullet?: string;
  jdText?: string;
  resumeText?: string;
  previousScore?: number;
  onScoreUpdate?: (delta: number, newScore: number, readiness: number, readinessLabel: string, micro: string) => void;
  onBulletAccepted?: (text: string) => void;
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
      setApplied(false);
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
    setApplied(false);

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

      // Trigger rescore only if JD context is available
      if (jdText && resumeText && !isRescoring.current) {
        isRescoring.current = true;
        try {
          const updatedResume = resumeText + "\n" + (data.after || data.rewritten);
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
        } catch {
          // Rescore is non-blocking — rewrite result still shown
        } finally {
          isRescoring.current = false;
        }
      }
    } catch {
      setRewritten("⚠️ Could not rewrite. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [bullet, targetRole, jdText, resumeText, previousScore, onScoreUpdate]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(rewritten);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [rewritten]);

  const handleApply = useCallback(() => {
    onBulletAccepted?.(rewritten);
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  }, [onBulletAccepted, rewritten]);

  return (
    <div className="liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-amber-400">
          <Wand2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bebas tracking-wide uppercase">Bullet <span className="text-amber-400">Rewriter</span></h3>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">AI-Powered Impact Statement Generator</p>
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
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Weak Bullet</label>
          <textarea
            value={bullet}
            onChange={(e) => setBullet(e.target.value)}
            placeholder={`e.g., "Developed APIs for the backend"`}
            rows={4}
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-zinc-300 placeholder:text-zinc-700 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
          <button
            onClick={handleRewrite}
            disabled={isLoading || !bullet.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isLoading ? "Rewriting..." : "Rewrite with AI"}
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
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Impact Statement</label>
          <div className={`relative min-h-[100px] bg-black/40 border rounded-2xl px-5 py-4 transition-all ${rewritten ? "border-primary/20" : "border-white/5"}`}>
            {rewritten ? (
              <>
                <p className="text-sm text-white font-medium leading-relaxed pr-20">{rewritten}</p>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleApply}
                    disabled={applied}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all",
                      applied 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                        : "bg-primary/10 hover:bg-primary/20 text-amber-400 border border-white/5"
                    )}
                  >
                    {applied ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    {applied ? "Applied" : "Apply to Resume"}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-amber-400 border border-white/5 transition-all"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-700 italic font-mono">
                {isLoading ? "AI is crafting your impact statement..." : "Your enhanced bullet will appear here"}
              </p>
            )}
          </div>

          {/* Improvements list */}
          {improvements.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> What was improved
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
              Optimized for: {targetRole} · ATS-ready · Action-verb led
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
