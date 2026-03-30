"use client";

import React, { useState } from "react";
import { BookOpen, Sparkles, CheckCircle, ArrowRight, Brain, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ENDPOINTS } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

export function LearnSection() {
  const { lang } = useLanguage();
  const t = translations[lang].arena;
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const fetchLesson = async (topic: string) => {
    setIsLoading(true);
    setLesson(null);
    setSelectedTopic(topic);
    setQuizAnswer(null);
    setShowExplanation(false);
    
    try {
      const res = await fetch(ENDPOINTS.ENGLISH_LESSON, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, lang }),
      });
      if (!res.ok) throw new Error("Failed to load lesson");
      const data = await res.json();
      setLesson(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-3">
        {t.learn.topics.map((topic: any) => (
          <button
            key={topic.key}
            onClick={() => fetchLesson(topic.key)}
            className={cn(
              "px-6 py-2 rounded-full border text-[10px] font-orbitron tracking-widest uppercase transition-all",
              selectedTopic === topic.key
                ? "bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                : "bg-black/40 border-cyan-500/20 text-cyan-500/60 hover:border-cyan-500/50 hover:text-cyan-400"
            )}
          >
            {topic.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px] relative">
        <AnimatePresence mode="wait">
          {!selectedTopic && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-cyan-500/10 rounded-[32px]"
            >
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-xs uppercase tracking-[0.2em] font-orbitron">{t.learn.placeholder}</p>
            </motion.div>
          )}

          {isLoading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm rounded-[32px] z-10"
            >
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full" />
                <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin" />
                <Brain className="absolute inset-x-0 inset-y-0 m-auto w-8 h-8 text-cyan-500 animate-pulse" />
              </div>
              <p className="mt-6 text-[10px] font-orbitron text-cyan-500 animate-pulse uppercase tracking-widest">Hydrating_Neural_Patterns...</p>
            </motion.div>
          )}

          {lesson && (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Lesson Card */}
              <div className="hud-panel p-8 bg-cyan-950/10 border-cyan-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles className="w-32 h-32" />
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-orbitron text-cyan-400 tracking-tight uppercase">{lesson.title}</h3>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Module_Active // Level: {lang === 'ta' ? 'தமிழ்' : 'Normal'}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> Core Concept
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed font-nav">{lesson.concept}</p>
                  </section>

                  <section className="grid md:grid-cols-2 gap-4">
                    {lesson.rules.map((rule: any, idx: number) => (
                      <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded-xl group hover:border-cyan-500/30 transition-all">
                        <p className="text-[11px] font-bold text-cyan-350 mb-2 uppercase tracking-wide">{rule.rule}</p>
                        <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg">
                           <p className="text-xs text-zinc-400 font-mono italic">"{rule.example}"</p>
                        </div>
                      </div>
                    ))}
                  </section>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-amber-500/60 tracking-widest">Neural_Hack // Pro-Tip</span>
                      <p className="text-xs text-amber-100/80">{lesson.pro_tip}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Knowledge Check */}
              <div className="hud-panel p-8 bg-zinc-900/40 border-white/5 space-y-6">
                <h4 className="text-sm font-orbitron text-white uppercase tracking-widest flex items-center gap-3">
                   <Brain className="w-5 h-5 text-cyan-500" /> Knowledge_Sync_Test
                </h4>
                
                <p className="text-lg font-nav text-zinc-200">{lesson.quiz_question}</p>
                
                <div className="grid md:grid-cols-2 gap-3">
                  {lesson.quiz_options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setQuizAnswer(opt);
                        setShowExplanation(true);
                      }}
                      disabled={showExplanation}
                      className={cn(
                        "p-4 text-left text-xs font-nav rounded-xl border transition-all",
                        quizAnswer === opt 
                          ? (opt === lesson.correct_answer ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-red-500/20 border-red-500 text-red-500")
                          : (showExplanation && opt === lesson.correct_answer ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-black/20 border-white/10 text-zinc-500 hover:border-white/30")
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {showExplanation && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={cn(
                        "p-6 rounded-2xl border",
                        quizAnswer === lesson.correct_answer ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                       {quizAnswer === lesson.correct_answer ? (
                         <CheckCircle className="w-4 h-4 text-emerald-500" />
                       ) : (
                         <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">!</div>
                       )}
                       <span className="text-[10px] font-black uppercase tracking-widest">
                          {quizAnswer === lesson.correct_answer ? "SYNC_SUCCESS" : "CALIBRATION_NEEDED"}
                       </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">"{lesson.explanation}"</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
