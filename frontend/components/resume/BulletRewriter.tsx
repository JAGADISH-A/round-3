"use client";

import React, { useState, useEffect } from "react";
import { Wand2, Loader2, Copy, Check, Sparkles } from "lucide-react";

interface BulletRewriterProps {
  targetRole?: string;
  externalBullet?: string;
  jdText?: string;
}

export default function BulletRewriter({
  targetRole = "Software Engineer",
  externalBullet = "",
  jdText = "",
}: BulletRewriterProps) {
  const [bullet, setBullet] = useState(externalBullet);
  const [rewritten, setRewritten] = useState("");
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync when parent sends a new bullet (from clickable skill)
  useEffect(() => {
    if (externalBullet && externalBullet !== bullet) {
      setBullet(externalBullet);
      setRewritten("");
      setImprovements([]);
    }
  }, [externalBullet]);

  const handleRewrite = async () => {
    if (!bullet.trim()) return;
    setIsLoading(true);
    setRewritten("");
    setImprovements([]);

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
    } catch {
      setRewritten("⚠️ Could not rewrite. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rewritten);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <Wand2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bebas tracking-wide uppercase">Bullet <span className="text-violet-400">Rewriter</span></h3>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">AI-Powered Impact Statement Generator</p>
        </div>
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
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-zinc-300 placeholder:text-zinc-700 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
          <button
            onClick={handleRewrite}
            disabled={isLoading || !bullet.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-black uppercase tracking-widest hover:bg-violet-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isLoading ? "Rewriting..." : "Rewrite with AI"}
          </button>
        </div>

        {/* Output */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Impact Statement</label>
          <div className={`relative min-h-[100px] bg-black/40 border rounded-2xl px-5 py-4 transition-all ${rewritten ? "border-violet-500/20" : "border-white/5"}`}>
            {rewritten ? (
              <>
                <p className="text-sm text-white font-medium leading-relaxed">{rewritten}</p>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-all"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
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
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> What was improved
              </p>
              {improvements.map((imp, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-1 h-1 rounded-full bg-violet-500/50" />
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
    </div>
  );
}
