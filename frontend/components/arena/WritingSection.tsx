"use client";

import React, { useState } from "react";
import { PenTool, Target, Send, Sparkles, ChevronRight, CheckCircle, BarChart2, Loader2, RefreshCw, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ENDPOINTS } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

export function WritingSection() {
  const { lang } = useLanguage();
  const t = translations[lang].arena;
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [scaffold, setScaffold] = useState<any>(null);
  const [isScaffolding, setIsScaffolding] = useState(false);

  const fetchPrompt = async (type: string) => {
    setIsLoading(true);
    setScenario(null);
    setEvaluation(null);
    setScaffold(null);
    setUserInput("");
    setSelectedType(type);

    try {
      const res = await fetch(ENDPOINTS.ENGLISH_WRITING_PROMPT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_type: type, context: "corporate" }),
      });
      if (!res.ok) throw new Error("Failed to load prompt");
      const data = await res.json();
      setScenario(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScaffold = async () => {
    if (!scenario) return;
    setIsScaffolding(true);
    try {
      const res = await fetch(ENDPOINTS.ENGLISH_SCAFFOLD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_type: selectedType, scenario: scenario.scenario }),
      });
      if (!res.ok) throw new Error("Scaffold failed");
      const data = await res.json();
      setScaffold(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsScaffolding(false);
    }
  };

  const handleSubmit = async () => {
    if (!userInput || userInput.length < 20) return;
    setIsEvaluating(true);
    try {
      const res = await fetch(ENDPOINTS.ENGLISH_EVALUATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_text: userInput, scenario: scenario.scenario }),
      });
      if (!res.ok) throw new Error("Evaluation failed");
      const data = await res.json();
      setEvaluation(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(t.writing.types).map(([key, label]: [string, any]) => (
          <button
            key={key}
            onClick={() => fetchPrompt(key)}
            className={cn(
              "p-6 rounded-3xl border flex items-center justify-between transition-all group overflow-hidden relative",
              selectedType === key
                ? "bg-cyan-500/10 border-cyan-500 text-white"
                : "bg-black/40 border-white/5 text-zinc-500 hover:border-cyan-500/30 hover:text-cyan-400"
            )}
          >
            <div className="flex items-center gap-4">
                <PenTool className={cn("w-6 h-6", selectedType === key ? "text-cyan-400" : "text-zinc-600")} />
                <span className="text-[11px] font-orbitron uppercase tracking-widest">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      <div className="min-h-[500px] relative">
        <AnimatePresence mode="wait">
          {!selectedType && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-cyan-500/10 rounded-[32px]">
              <Target className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-xs uppercase tracking-[0.2em] font-orbitron">Initialize Neural Scripting Module...</p>
            </motion.div>
          )}

          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm rounded-[32px] z-10">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
              <p className="mt-6 text-[10px] font-orbitron text-cyan-500 animate-pulse uppercase tracking-[0.3em]">CONSTRUCTING_SCENARIO...</p>
            </motion.div>
          )}

          {scenario && !evaluation && (
            <motion.div key="scenario" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="hud-panel p-8 bg-black/40 border-white/5 relative">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-orbitron text-white uppercase tracking-tighter mb-1">{scenario.title}</h3>
                            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase">Target_Tone: {scenario.expected_tone}</p>
                        </div>
                        <button 
                            onClick={fetchScaffold}
                            disabled={isScaffolding}
                            className="px-6 py-2.5 bg-cyan-500 text-black border border-cyan-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                        >
                            {isScaffolding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            GET_WRITING_HELP_v2
                        </button>
                    </div>
                    
                    <p className="text-sm text-zinc-300 leading-relaxed font-nav mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                        {scenario.scenario}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {scenario.requirements.map((req: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">
                                {req}
                            </span>
                        ))}
                    </div>

                    <AnimatePresence>
                        {scaffold && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-6 pt-6 border-t border-white/5 space-y-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl">
                                        <h4 className="text-[9px] font-black text-cyan-500 uppercase mb-3 tracking-widest">Recommended Structure</h4>
                                        <div className="space-y-2">
                                            {scaffold.structure.map((s: any, i: number) => (
                                                <div key={i} className="flex gap-2 text-[10px]">
                                                    <span className="text-cyan-500 font-bold opacity-40">[{i+1}]</span>
                                                    <div>
                                                        <span className="text-zinc-200 font-bold">{s.section}:</span>
                                                        <span className="text-zinc-500 ml-1 italic">{s.tip}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-2xl">
                                        <h4 className="text-[9px] font-black text-zinc-400 uppercase mb-3 tracking-widest">Neural Prototyping (Starter)</h4>
                                        <p className="text-[10px] text-zinc-500 font-mono italic">"{scaffold.starter_template}"</p>
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {scaffold.key_vocabulary.map((v: string) => (
                                                <span key={v} className="px-2 py-0.5 bg-white/5 text-[8px] font-mono text-zinc-600 rounded uppercase">{v}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative group">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder=">>> ENTER_PROTOTYPE_DATA_STREAM_HERE..."
                        className="w-full h-80 bg-zinc-950/80 border border-cyan-500/20 rounded-[32px] p-8 text-sm font-nav text-zinc-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-zinc-800"
                    />
                    <div className="absolute bottom-6 right-6 flex items-center gap-4">
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Buffer_Length: {userInput.length} Tokens</span>
                        <button
                            onClick={handleSubmit}
                            disabled={userInput.length < 20 || isEvaluating}
                            className="px-8 py-3 bg-cyan-500 text-black font-orbitron text-xs tracking-widest uppercase rounded-full shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] transition-all disabled:opacity-20"
                        >
                            {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : "TRANSMIT_DATA"}
                        </button>
                    </div>
                </div>
            </motion.div>
          )}

          {evaluation && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="hud-panel p-10 bg-black/40 border-cyan-500/20 grid grid-cols-1 md:grid-cols-3 gap-10 relative">
                    <div className="col-span-1 border-r border-white/5 pr-10">
                        <div className="text-center mb-8">
                            <div className="relative w-28 h-28 mx-auto mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                                    <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray={314} strokeDashoffset={314 - (314 * evaluation.overall_score) / 100} className="text-cyan-500 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
                                </svg>
                                <div className="absolute inset-x-0 inset-y-0 m-auto flex flex-col items-center justify-center">
                                    <span className="text-3xl font-orbitron text-white leading-none">{evaluation.overall_score}</span>
                                    <span className="text-[9px] font-black text-cyan-500/60 uppercase">SYNC_INDEX</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Neural_Integrity_Report</p>
                        </div>

                        <div className="space-y-4">
                            {evaluation.scores && Object.entries(evaluation.scores).map(([key, val]: [string, any]) => (
                                <div key={key} className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-tighter">
                                        <span>{key}</span>
                                        <span className="text-cyan-500/80">{val}/25</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(val / 25) * 100}%` }} className="h-full bg-cyan-500/30" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-span-2 space-y-6 overflow-y-auto max-h-[600px] custom-scrollbar pr-4">
                        <div>
                            <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <span className="w-4 h-0.5 bg-cyan-500" /> Pedagogical_Feedback
                            </h4>
                            <p className="text-sm text-zinc-200 font-nav leading-relaxed italic border-l-2 border-cyan-500/20 pl-6">
                                "{evaluation.feedback}"
                            </p>
                        </div>

                        {evaluation.teaching_points && (
                             <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                                <h5 className="text-[10px] font-black text-cyan-400 uppercase mb-4 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Core_Teaching_Points
                                </h5>
                                <ul className="space-y-3">
                                    {evaluation.teaching_points.map((pt: string, idx: number) => (
                                        <li key={idx} className="flex gap-3 text-[11px] text-zinc-300 font-nav leading-snug">
                                            <div className="w-1 h-1 bg-cyan-500 rounded-full mt-1.5 shrink-0" />
                                            {pt}
                                        </li>
                                    ))}
                                </ul>
                             </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                <h5 className="text-[10px] font-black text-amber-500 uppercase mb-4 flex items-center gap-2">
                                   <Activity className="w-3 h-3" /> Structural_Critique
                                </h5>
                                <p className="text-[11px] text-zinc-400 font-nav leading-relaxed">
                                    {evaluation.structural_critique}
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                    <Send className="w-12 h-12 text-cyan-500" />
                                </div>
                                <h5 className="text-[10px] font-black text-emerald-500 uppercase mb-4">Refined_Transmission</h5>
                                <p className="text-[11px] text-zinc-300 font-mono leading-relaxed italic opacity-80">
                                    {evaluation.enhanced_version}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                setEvaluation(null);
                                setUserInput("");
                                setScenario(null);
                                setSelectedType(null);
                                setScaffold(null);
                            }}
                            className="w-full py-4 bg-zinc-900 border border-white/10 rounded-[20px] text-[10px] font-orbitron text-zinc-500 tracking-[0.3em] uppercase hover:bg-zinc-800 transition-all mt-4"
                        >
                            REBOOT_MISSION_PARAMETERS
                        </button>
                    </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
