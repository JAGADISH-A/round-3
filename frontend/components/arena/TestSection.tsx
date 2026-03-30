"use client";

import React, { useState } from "react";
import { Brain, CheckCircle, XCircle, ArrowRight, Activity, Terminal, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ENDPOINTS } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

export function TestSection() {
  const { lang } = useLanguage();
  const t = translations[lang].arena;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const fetchQuiz = async (category: string) => {
    setIsLoading(true);
    setQuestions([]);
    setSelectedCategory(category);
    setCurrentIdx(0);
    setAnswers({});
    setShowResult(false);
    setShowHint(false);

    try {
      const res = await fetch(ENDPOINTS.ENGLISH_QUIZ, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, lang, difficulty: "intermediate" }),
      });
      if (!res.ok) throw new Error("Failed to load quiz");
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (ans: string) => {
    setAnswers({ ...answers, [currentIdx]: ans });
  };

  const score = questions.filter((q, idx) => answers[idx] === q.answer).length;

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="hud-panel p-12 bg-black/40 border-cyan-500/20 text-center space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative">
             <div className="absolute inset-2 border border-cyan-500/10 rounded-full animate-ping" />
             <div className="text-4xl font-orbitron text-cyan-400">{Math.round((score / questions.length) * 100)}%</div>
          </div>
          <div>
            <h3 className="text-2xl font-orbitron text-white uppercase tracking-tighter">Neural_Sync_Complete</h3>
            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest mt-1 uppercase">Accuracy: {score}/{questions.length} Nodes Matched</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            {questions.map((q, idx) => (
                <div key={idx} className={cn(
                    "p-4 rounded-2xl border text-[11px] font-nav",
                    answers[idx] === q.answer ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-100" : "bg-red-500/5 border-red-500/20 text-red-100"
                )}>
                    <div className="flex gap-2 mb-2 items-center">
                        <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-mono">{idx + 1}</span>
                        <span className="font-bold opacity-80">{answers[idx]}</span>
                        {answers[idx] !== q.answer && <span className="text-emerald-500">→ {q.answer}</span>}
                    </div>
                    <p className="opacity-60 italic">"{q.explanation}"</p>
                </div>
            ))}
        </div>

        <button
          onClick={() => {
              setSelectedCategory(null);
              setShowHint(false);
          }}
          className="px-12 py-3 bg-cyan-500 text-black font-orbitron text-xs tracking-widest uppercase rounded-full hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all"
        >
          REBOOT_TEST_SEQUENCE
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(t.test.types).map(([key, label]: [string, any]) => (
          <button
            key={key}
            onClick={() => fetchQuiz(key)}
            className={cn(
              "p-6 rounded-3xl border text-center transition-all group relative overflow-hidden",
              selectedCategory === key
                ? "bg-cyan-500/10 border-cyan-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                : "bg-black/40 border-white/5 text-zinc-500 hover:border-cyan-500/30 hover:text-cyan-400"
            )}
          >
            <Terminal className={cn("w-6 h-6 mx-auto mb-3 transition-colors", selectedCategory === key ? "text-cyan-400" : "text-zinc-600 group-hover:text-cyan-500")} />
            <span className="text-[10px] font-orbitron uppercase tracking-widest">{label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[400px] relative">
        <AnimatePresence mode="wait">
          {!selectedCategory && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-cyan-500/10 rounded-[32px]">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-xs uppercase tracking-[0.2em] font-orbitron">Initialize Intelligence Scan...</p>
            </motion.div>
          )}

          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm rounded-[32px] z-10">
              <div className="w-16 h-16 border-t-2 border-cyan-500 rounded-full animate-spin" />
              <p className="mt-6 text-[10px] font-orbitron text-cyan-500 animate-pulse uppercase tracking-[0.3em]">SYNCHRONIZING_NODES...</p>
            </motion.div>
          )}

          {questions.length > 0 && (
            <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="flex justify-between items-center text-[10px] font-orbitron text-cyan-500/60 uppercase tracking-widest">
                <span>Signal_Node: {currentIdx + 1} / {questions.length}</span>
                <span className="px-3 py-1 bg-cyan-500/10 rounded-full">Score_Stream: {score}</span>
              </div>

              <div className="hud-panel p-10 bg-zinc-900/40 border-white/5 space-y-10">
                <div className="space-y-4 relative">
                    <div className="flex justify-between items-start">
                        <span className="inline-block px-3 py-1 bg-cyan-500/10 rounded-full text-[9px] font-bold text-cyan-500 uppercase tracking-wider mb-2">Target_Broadcast</span>
                        <button 
                            onClick={() => setShowHint(true)}
                            disabled={showHint}
                            className="px-6 py-2 bg-emerald-500 text-black border border-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                        >
                            <Sparkles className="w-4 h-4" />
                            GET_A_HINT_NOW
                        </button>
                    </div>
                    <h3 className="text-2xl font-nav text-white leading-tight">{questions[currentIdx].question}</h3>
                    
                    <AnimatePresence>
                        {showHint && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] text-emerald-400 font-mono italic"
                            >
                                <span className="font-black mr-2">{">>>"} CLUE:</span> {questions[currentIdx].hint}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {questions[currentIdx].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className={cn(
                        "p-5 text-left text-sm font-nav rounded-2xl border transition-all relative overflow-hidden",
                        answers[currentIdx] === opt
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                          : "bg-black/20 border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-200"
                      )}
                    >
                      {opt}
                      {answers[currentIdx] === opt && <Sparkles className="absolute top-2 right-2 w-4 h-4 text-cyan-500/30" />}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button
                        onClick={() => {
                            setCurrentIdx(Math.max(0, currentIdx - 1));
                            setShowHint(false);
                        }}
                        disabled={currentIdx === 0}
                        className="p-3 rounded-full border border-white/10 text-zinc-500 hover:text-white disabled:opacity-20"
                    >
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>

                    {currentIdx === questions.length - 1 ? (
                        <button
                            onClick={() => setShowResult(true)}
                            disabled={!answers[currentIdx]}
                            className="px-10 py-3 bg-cyan-500 text-black font-orbitron text-xs tracking-widest uppercase rounded-full shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] transition-all disabled:opacity-20"
                        >
                            UPLOAD_DATA_SET
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setCurrentIdx(currentIdx + 1);
                                setShowHint(false);
                            }}
                            disabled={!answers[currentIdx]}
                            className="px-10 py-3 bg-white/5 border border-white/10 text-white font-orbitron text-xs tracking-widest uppercase rounded-full hover:bg-white/10 transition-all disabled:opacity-20"
                        >
                            NEXT_NODE
                        </button>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
