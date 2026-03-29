import React from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

interface ReadinessScoreCardProps {
  readiness: number;
  label: string;
  delta?: number;
}

const ReadinessScoreCard = React.memo(({ readiness, label, delta }: ReadinessScoreCardProps) => {
  const { lang } = useLanguage();
  const t = translations[lang];

  const upperLabel = label.toUpperCase();
  const colorClass = 
    upperLabel === "BEGINNER" ? "text-red-400 bg-red-500/10 border-red-500/20" :
    upperLabel === "IMPROVING" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
    upperLabel === "INTERVIEW READY" ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" :
    upperLabel === "STRONG CANDIDATE" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    "text-amber-400 bg-amber-500/10 border-amber-500/20";

  const barClass = 
    upperLabel === "BEGINNER" ? "from-red-900 to-red-500" :
    upperLabel === "IMPROVING" ? "from-amber-900 to-amber-500" :
    upperLabel === "INTERVIEW READY" ? "from-cyan-900 to-cyan-500" :
    upperLabel === "STRONG CANDIDATE" ? "from-emerald-900 to-emerald-500" :
    "from-amber-900 to-amber-500";

  const displayLabel = 
    upperLabel === "BEGINNER" ? t.resume.readiness.beginner :
    upperLabel === "IMPROVING" ? t.resume.readiness.improving :
    upperLabel === "INTERVIEW READY" ? t.resume.readiness.ready :
    upperLabel === "STRONG CANDIDATE" ? t.resume.readiness.strong :
    upperLabel;

  return (
    <div className="hud-panel p-6 space-y-5 animate-hud font-nav">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400"
               style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%)' }}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-orbitron font-bold uppercase tracking-[0.3em] text-cyan-500/40">
              {t.resume.readiness.title}
            </p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-orbitron font-black tracking-tighter text-white">
                {readiness}%
              </p>
              {delta !== undefined && delta !== 0 && (
                <span
                  className={cn(
                    "text-xs font-tech font-bold animate-in slide-in-from-left-2 duration-300",
                    delta > 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  [{delta > 0 ? "+" : ""}{delta}]
                </span>
              )}
            </div>
          </div>
        </div>

        <span
          className={cn(
            "text-[9px] font-orbitron font-bold uppercase tracking-[0.2em] px-4 py-2 border",
            colorClass
          )}
          style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}
        >
          {displayLabel}
        </span>
      </div>

      <div className="w-full h-1 bg-cyan-950/40 overflow-hidden relative">
        <div
          className={cn(
            "h-full bg-gradient-to-r transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,255,255,0.2)]",
            barClass
          )}
          style={{ width: `${readiness}%` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] animate-[scan-move_3s_linear_infinite]" />
      </div>
    </div>
  );
});

ReadinessScoreCard.displayName = "ReadinessScoreCard";
export default ReadinessScoreCard;
