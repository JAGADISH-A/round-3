import { useState, useRef, useCallback } from "react";
import { useResumeStore } from "../store/useResumeStore";
import { ResumeAnalysis, JdMatch } from "../types/resume";
export type { ResumeAnalysis, JdMatch };

// ─── Types ────────────────────────────────────────────────────────────────────
// Using global types from @/types/resume

// ─── Scoring constants ────────────────────────────────────────────────────────
const ACTION_VERBS = new Set([
  "engineered","built","designed","optimized","led","developed","implemented",
  "architected","deployed","automated","reduced","improved","scaled","launched",
  "delivered","accelerated","created","transformed","managed","established",
  "integrated","migrated","refactored","streamlined","achieved","increased",
]);

// Keyword aliases: canonical → list of aliases to detect in text
const KEYWORD_ALIASES: Record<string, string[]> = {
  "aws":        ["aws","amazon web services","ec2","s3","lambda","cloudfront","rds"],
  "docker":     ["docker","containerization","container","dockerfile"],
  "kubernetes": ["kubernetes","k8s","eks","helm","pod","cluster"],
  "pytorch":    ["pytorch","torch"],
  "tensorflow": ["tensorflow","tf","keras"],
  "react":      ["react","reactjs","react.js","jsx"],
  "node":       ["node","nodejs","node.js","express"],
  "python":     ["python","py","django","flask","fastapi"],
  "sql":        ["sql","postgresql","mysql","postgres","relational database"],
  "ci/cd":      ["ci/cd","github actions","jenkins","gitlab ci","pipeline"],
  "redis":      ["redis","cache","caching"],
  "kafka":      ["kafka","message queue","event streaming","pub/sub"],
  "graphql":    ["graphql","gql"],
  "typescript": ["typescript","ts"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMatchLabel(score: number): string {
  if (score >= 75) return "Strong Match";
  if (score >= 55) return "Good Match";
  if (score >= 35) return "Moderate Match";
  return "Low Match";
}

/** Expand keyword to all its known aliases */
function getAliases(keyword: string): string[] {
  const lower = keyword.toLowerCase();
  return KEYWORD_ALIASES[lower] ?? [lower];
}

/** Check if bullet contains this keyword (by alias) */
function bulletContainsKeyword(bullet: string, keyword: string): boolean {
  const lowerBullet = bullet.toLowerCase();
  return getAliases(keyword).some((alias) => lowerBullet.includes(alias));
}

export interface BulletImpact {
  delta: number;
  newScore: number;
  newlyMatched: string[];
  breakdown: { reason: string; points: number }[];
  noImpact: boolean;
}

/** Client-side scoring engine with weighted + diminishing returns */
function computeBulletImpact(
  bullet: string,
  missingKeywords: string[],
  currentScore: number,
  usedKeywords: Set<string>
): BulletImpact {
  const lowerBullet = bullet.toLowerCase();
  const words = lowerBullet.split(/\s+/);
  const breakdown: { reason: string; points: number }[] = [];
  const newlyMatched: string[] = [];
  let baseScore = 0;

  // +3–5 per newly matched missing keyword (skip already-exploited ones)
  for (const kw of missingKeywords) {
    if (usedKeywords.has(kw)) continue;
    if (bulletContainsKeyword(bullet, kw)) {
      const pts = currentScore < 40 ? 5 : currentScore < 65 ? 4 : 3;
      baseScore += pts;
      newlyMatched.push(kw);
      breakdown.push({ reason: `+${pts} "${kw}" keyword`, points: pts });
    }
  }

  // +2 for strong action verb (check first word mainly)
  const firstWord = words[0]?.replace(/[^a-z]/g, "");
  if (firstWord && ACTION_VERBS.has(firstWord)) {
    baseScore += 2;
    breakdown.push({ reason: "+2 strong action verb", points: 2 });
  } else {
    // Also check any word in bullet
    const hasVerb = words.some((w) => ACTION_VERBS.has(w.replace(/[^a-z]/g, "")));
    if (hasVerb) {
      baseScore += 1;
      breakdown.push({ reason: "+1 action verb", points: 1 });
    }
  }

  // +3 for measurable metric (%, numbers, x improvement)
  const hasMetric = /\d+%|\d+x|\$\d+|\d+\s*(ms|seconds|hours|days|years|users|requests)/.test(lowerBullet);
  if (hasMetric) {
    baseScore += 3;
    breakdown.push({ reason: "+3 measurable metric", points: 3 });
  }

  // Diminishing returns: delta = baseScore * (1 - currentScore / 100)
  const diminishFactor = Math.max(0.15, 1 - currentScore / 100);
  let delta = Math.round(baseScore * diminishFactor);

  // Cap per bullet
  delta = Math.min(delta, 15);

  const newScore = Math.min(100, currentScore + delta);
  const noImpact = delta === 0;

  return { delta, newScore, newlyMatched, breakdown, noImpact };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface UseResumeAnalysisReturn {
  analysis: ResumeAnalysis | null;
  setInitialAnalysis: (data: ResumeAnalysis, jdText?: string) => void;
  applyBullet: (bullet: string, original?: string, skipUpdate?: boolean) => BulletImpact | null;
  isReanalyzing: boolean;
  jdText: string;
  history: ResumeAnalysis[];
  lastImpact: BulletImpact | null;
}

export function useResumeAnalysis(): UseResumeAnalysisReturn {
  const analysis = useResumeStore((state) => state.analysis) as ResumeAnalysis | null;
  const status = useResumeStore((state) => state.status);
  const jdText = useResumeStore((state) => state.jdText);
  const isReanalyzing = useResumeStore((state) => state.isReanalyzing);
  const lastImpact = useResumeStore((state) => state.lastImpact);
  
  const setAnalysisStore = useResumeStore((state) => state.setAnalysis);
  const setStatus = useResumeStore((state) => state.setStatus);
  const setResumeText = useResumeStore((state) => state.setResumeText);
  const setIsReanalyzing = useResumeStore((state) => state.setIsReanalyzing);
  const setLastImpact = useResumeStore((state) => state.setLastImpact);

  const history = useRef<ResumeAnalysis[]>([]);
  const usedKeywords = useRef<Set<string>>(new Set());

  const setInitialAnalysis = useCallback((data: ResumeAnalysis, jd?: string) => {
    // Sync with global store (CRITICAL)
    setAnalysisStore(data as any, jd);
    setResumeText(data.full_text || "");
    
    history.current = [];
    usedKeywords.current = new Set();
    setLastImpact(null);
    if (process.env.NODE_ENV === "development") {
      console.debug("Initial Analysis Set. Text Length:", data.full_text?.length);
    }
  }, [setAnalysisStore, setResumeText, setLastImpact]);

  const applyBullet = useCallback((bullet: string, original?: string, skipUpdate = false): BulletImpact | null => {
    if (!analysis?.jd_match) return null;

    const { jd_match_score, missing_keywords, missing_with_labels, matched_keywords, matched_with_labels } = analysis.jd_match;

    // 1. Compute impact
    const impact = computeBulletImpact(bullet, missing_keywords, jd_match_score, usedKeywords.current);
    setLastImpact(impact);

    // 2. Update Resume Text in Zustand Store (CRITICAL FIX)
    if (!skipUpdate) {
      setResumeText((prev: string) => {
        if (!prev) return bullet;
        if (original && prev.includes(original)) {
          return prev.replace(original, bullet);
        }
        return prev.trim() + "\n• " + bullet;
      });
    }

    // 3. Save history for undo
    history.current.push(structuredClone(analysis));

    // Mark newly matched keywords as used
    impact.newlyMatched.forEach((kw) => usedKeywords.current.add(kw));

    // Build updated keyword lists
    const newMissing = missing_keywords.filter((kw) => !impact.newlyMatched.includes(kw));
    const newMatched = [...matched_keywords, ...impact.newlyMatched];
    const newMissingWithLabels = (missing_with_labels ?? []).filter(
      (item) => !impact.newlyMatched.includes(item.keyword)
    );
    const newMatchedWithLabels = [
      ...(matched_with_labels ?? []),
      ...impact.newlyMatched.map((kw) => ({ keyword: kw, label: "Newly Added" })),
    ];

    // Show re-analyzing pulse for realism
    setIsReanalyzing(true);
    
    // Perform data merge
    const newAnalysis = structuredClone(analysis);
    if (newAnalysis?.jd_match) {
      newAnalysis.jd_match.jd_match_score = impact.newScore;
      newAnalysis.jd_match.match_label = getMatchLabel(impact.newScore);
      newAnalysis.jd_match.matched_keywords = newMatched;
      newAnalysis.jd_match.missing_keywords = newMissing;
      newAnalysis.jd_match.matched_with_labels = newMatchedWithLabels;
      newAnalysis.jd_match.missing_with_labels = newMissingWithLabels;
      newAnalysis.jd_match.tech_matched_count = newAnalysis.jd_match.tech_matched_count + impact.newlyMatched.length;
      
      setAnalysisStore(newAnalysis as any);
    }
    
    setTimeout(() => {
      setIsReanalyzing(false);
    }, 450);

    return impact;
  }, [analysis, setAnalysisStore, setResumeText, setIsReanalyzing, setLastImpact]);

  return {
    analysis,
    setInitialAnalysis,
    applyBullet,
    isReanalyzing,
    jdText,
    history: history.current,
    lastImpact,
  };
}
