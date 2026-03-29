"use client";

import React, { useState, useEffect, useRef } from "react";
import { CoachHUD } from "@/components/coach/CoachHUD";
import { ChatInput } from "@/components/chat/ChatInput";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Sword, Shield, Zap, RefreshCw, Briefcase, Brain, Timer, ChevronDown, ChevronRight, Mic, MicOff, Volume2 } from "lucide-react";
import { useVoiceState } from "@/hooks/useVoiceState";
import { cn } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/api-config";
import { CallOverlay } from "@/components/coach/CallOverlay";

interface GameMessage {
  role: "user" | "ai" | "system";
  content: string;
  result?: "win" | "loss" | "neutral";
}

export default function CoachArenaPage() {
  const [scenarioId, setScenarioId] = useState("skeptical_investor");
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [stats, setStats] = useState({
    clarity: 50,
    confidence: 50,
    eq: 50,
    overall_hp: 100,
  });
  const [expandedCategory, setExpandedCategory] = useState<string>("professional");
  const [coachTip, setCoachTip] = useState<string>("");
  const [isThinking, setIsThinking] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [scenarioTitle, setScenarioTitle] = useState("The Skeptical Investor");
  const [scenarioData, setScenarioData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Vapi Realtime Stream (Bypassing custom WS)
  const voice = useVoiceState({
    systemPrompt: scenarioData 
      ? `You are playing the role: ${scenarioData.title}. Context: ${scenarioData.context}. Respond strictly in character, keep answers 1-2 sentences. Be emotional and reactive.` 
      : undefined,
    firstMessage: scenarioData?.initial_message,
    onTurnEnd: (text) => handleSend(text) // Auto-analyze stats when user finished talking
  });

  // Initial Scenario Setup
  useEffect(() => {
    setMessages([
      { role: "system", content: ">>> INITIALIZING VAPI_LINK_V6..." },
      { role: "system", content: ">>> STATUS: SECURE_LINE_READY..." }
    ]);
    startScenario("skeptical_investor");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, voice.transcript, voice.state]);

  const startScenario = async (id: string) => {
    if (voice.isRunning) voice.stop(); 
    setIsThinking(true);
    try {
      const res = await fetch(ENDPOINTS.COACH_SCENARIOS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const scenarios = await res.json();
      const current = scenarios[id];
      
      setScenarioId(id);
      setScenarioData(current);
      setScenarioTitle(current.title);
      setMessages([
        { role: "system", content: `>>> MISSION_START: ${current.context}` },
        { role: "ai", content: current.initial_message }
      ]);
      setStats({ clarity: 50, confidence: 50, eq: 50, overall_hp: 100 });
      setCoachTip("Ready for the first encounter? Focus on showing clear value.");
    } catch (err) {
      console.error("Failed to load scenario:", err);
      setMessages([
        { role: "system", content: ">>> ERROR: Neural Link Timeout. Backend unavailable." }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    if (voice.isRunning && !overrideText) {
        voice.stop();
        setMessages((prev) => [...prev, { role: "system", content: "LINK_TERMINATED" }]);
        return;
    }
    
    // If overrideText is provided (from Vapi turn end), use it.
    const textToSend = typeof overrideText === "string" ? overrideText : inputValue;
    if (!textToSend.trim()) return;

    if (!overrideText) setInputValue("");
    
    setMessages((prev) => [...prev, { role: "user", content: textToSend.trim() }]);
    setIsThinking(true);

    try {
      const res = await fetch(ENDPOINTS.COACH_ANALYZE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_id: scenarioId,
          user_text: textToSend.trim(),
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!res.ok) throw new Error("HUD Refresh Failed.");
      const data = await res.json();

      setStats((prev) => ({
        clarity: Math.min(100, Math.max(0, data.stats.clarity)),
        confidence: Math.min(100, Math.max(0, data.stats.confidence)),
        eq: Math.min(100, Math.max(0, data.stats.eq)),
        overall_hp: Math.min(100, Math.max(0, data.stats.overall_hp)),
      }));

      setCoachTip(data.coach_feedback.coach_tip);
      
      setMessages((prev) => [
        ...prev, 
        { 
          role: "ai", 
          content: data.coach_feedback.scenario_response,
          result: data.coach_feedback.turn_result 
        }
      ]);

    } catch (err) {
      console.error("Coach Analysis Error:", err);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[#020406] text-white p-4 gap-4 overflow-hidden relative">
      <div className="scanline" />
      
      {/* ── LEFT: GAME HUD ────────────────────────────── */}
      <div className="w-full lg:w-80 shrink-0">
        <CoachHUD 
          stats={stats} 
          coachTip={coachTip} 
          scenarioTitle={scenarioTitle}
        />
        
        {/* Scenario Selector */}
        <div className="mt-4 hud-panel p-4 bg-black/20 border-cyan-500/10 custom-scrollbar overflow-y-auto hidden lg:block" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <span className="text-[10px] font-orbitron text-cyan-500/60 block mb-4 uppercase tracking-widest border-b border-cyan-500/10 pb-2">
            Select_Encounter
          </span>
          
          <div className="flex flex-col gap-4">
            
            {/* --- Professional Arena --- */}
            <div className="space-y-2">
              <button 
                onClick={() => setExpandedCategory(expandedCategory === "professional" ? "" : "professional")}
                className="w-full flex items-center justify-between text-[9px] uppercase tracking-widest text-cyan-500 hover:text-cyan-400 font-orbitron py-1 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" /> Professional Arena
                </div>
                {expandedCategory === "professional" ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              
              <AnimatePresence>
                {expandedCategory === "professional" && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-2 overflow-hidden"
                  >
                    {[
                      { id: "skeptical_investor", label: "The Skeptical Investor" },
                      { id: "strict_manager", label: "The Strict Manager" },
                      { id: "hr_round", label: "The HR Round" },
                      { id: "angry_client", label: "The Angry Client" }
                    ].map(enc => (
                      <button 
                        key={enc.id}
                        onClick={() => startScenario(enc.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-[10px] font-nav uppercase tracking-wider border transition-all",
                          scenarioId === enc.id 
                            ? "bg-cyan-500/20 border-cyan-500 text-white shadow-[0_0_10px_rgba(0,255,255,0.2)]" 
                            : "bg-transparent border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                        )}
                      >
                        {enc.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* --- Communication Arena --- */}
            <div className="space-y-2">
              <button 
                onClick={() => setExpandedCategory(expandedCategory === "communication" ? "" : "communication")}
                className="w-full flex items-center justify-between text-[9px] uppercase tracking-widest text-emerald-500 hover:text-emerald-400 font-orbitron py-1 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3 h-3" /> Communication
                </div>
                {expandedCategory === "communication" ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              
              <AnimatePresence>
                {expandedCategory === "communication" && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-2 overflow-hidden"
                  >
                    {[
                      { id: "explain_complex", label: "Explain Complex Topic" },
                      { id: "defend_decision", label: "Defend Decision" },
                      { id: "handle_criticism", label: "Handle Criticism" }
                    ].map(enc => (
                      <button 
                        key={enc.id}
                        onClick={() => startScenario(enc.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-[10px] font-nav uppercase tracking-wider border transition-all",
                          scenarioId === enc.id 
                            ? "bg-emerald-500/20 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                            : "bg-transparent border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                        )}
                      >
                        {enc.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* --- Pressure Arena --- */}
            <div className="space-y-2">
              <button 
                onClick={() => setExpandedCategory(expandedCategory === "pressure" ? "" : "pressure")}
                className="w-full flex items-center justify-between text-[9px] uppercase tracking-widest text-amber-500 hover:text-amber-400 font-orbitron py-1 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3 h-3" /> Pressure Arena
                </div>
                {expandedCategory === "pressure" ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              
              <AnimatePresence>
                {expandedCategory === "pressure" && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-2 overflow-hidden"
                  >
                    {[
                      { id: "rapid_fire", label: "Rapid-Fire Questions" },
                      { id: "time_limited", label: "Time-Limited Answers" },
                      { id: "ai_interruptions", label: "AI Interruptions" }
                    ].map(enc => (
                      <button 
                        key={enc.id}
                        onClick={() => startScenario(enc.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-[10px] font-nav uppercase tracking-wider border transition-all",
                          scenarioId === enc.id 
                            ? "bg-amber-500/20 border-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                            : "bg-transparent border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                        )}
                      >
                        {enc.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>

      {/* ── RIGHT: MASTER ARENA CORE ──────────────────── */}
      <div className="flex-1 flex flex-col hud-panel bg-black/60 relative overflow-hidden h-full">
        {/* Header Decals */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        
        {/* Battle Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex flex-col gap-2",
                msg.role === "user" ? "items-end" : "items-start",
                msg.role === "system" && "items-center"
              )}
            >
              {msg.role === "system" ? (
                <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-1 rounded-full text-[10px] font-tech text-cyan-400 uppercase tracking-[0.2em] my-4">
                  {msg.content}
                </div>
              ) : (
                <div className={cn(
                  "max-w-[80%] p-4 rounded-xl text-sm leading-relaxed border relative overflow-hidden",
                  msg.role === "user" 
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-50 text-right font-nav rounded-tr-none" 
                    : "bg-zinc-900 border-white/10 text-white rounded-tl-none font-nav"
                )}>
                  {/* Status Indicator for turn result */}
                  {msg.result && (
                    <div className={cn(
                      "absolute top-0 right-0 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest",
                      msg.result === "win" ? "bg-green-500/20 text-green-400" : 
                      msg.result === "loss" ? "bg-red-500/20 text-red-500" : "bg-zinc-500/20 text-zinc-400"
                    )}>
                      {msg.result}
                    </div>
                  )}
                  {msg.content}
                </div>
              )}
            </motion.div>
          ))}
          {isThinking && !voice.isRunning && (
            <div className="flex gap-2 items-center text-cyan-500/60 animate-pulse font-tech text-[10px] uppercase tracking-widest ml-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing_Profile...
            </div>
          )}
          
          {/* Full Screen Call Protocol HUD Overlay */}
          <AnimatePresence>
            <CallOverlay 
              isOpen={voice.isRunning}
              onClose={voice.stop}
              scenarioTitle={scenarioTitle}
              scenarioData={scenarioData}
              state={voice.state}
              activeNode={voice.activeNode}
              transcript={voice.transcript}
            />

            {voice.isExhausted && (
               <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 border border-red-500/40 bg-red-500/5 rounded-xl p-8 text-center"
               >
                 <Zap className="w-8 h-8 text-red-500 mx-auto mb-4 animate-pulse" />
                 <h3 className="text-lg font-orbitron font-bold text-red-500 uppercase tracking-tighter mb-2">Neural Link Failed</h3>
                 <p className="text-white/40 text-[10px] uppercase tracking-widest mb-6">All 5 redundancy nodes are offline. Check bandwidth or Vapi credentials.</p>
                 <button 
                  onClick={() => voice.resetCluster()}
                  className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                 >
                   Reboot_Link_Cluster
                 </button>
               </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
             
             {/* Dynamic Call Button Override */}
             {voice.isRunning ? (
                 <button 
                  onClick={voice.stop}
                  className="w-full py-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-500 font-black tracking-widest uppercase text-[10px] hover:bg-red-500/40 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                 >
                     Hang Up Call
                 </button>
             ) : (
                <div className="flex-1 bg-black/40 border border-cyan-500/20 focus-within:border-cyan-500/50 transition-all rounded-lg overflow-hidden flex items-center p-1">
                    <button 
                      onClick={() => {
                        setMessages((prev) => [...prev, { role: "system", content: "DIALING_SECURE_LINE..." }]);
                        voice.start();
                      }}
                      className="p-3 transition-colors text-cyan-500 hover:text-cyan-300 flex items-center gap-2 bg-cyan-500/10 rounded-md shadow-sm ml-1"
                      title="Start Realtime Call"
                    >
                      <Mic className="w-5 h-5 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest pr-2">Call Boss</span>
                    </button>

                    <input 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="OR TRANSMIT_TEXT_OVERRIDE..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-cyan-100 text-sm p-3 font-nav placeholder:text-cyan-500/30"
                      disabled={voice.isRunning}
                    />
                    <button 
                      onClick={() => handleSend()}
                      className="p-3 text-cyan-500 hover:text-white transition-colors disabled:opacity-50"
                      disabled={voice.isRunning}
                    >
                      <Zap className={cn("w-5 h-5", (isThinking || voice.state === "thinking") && "animate-pulse")} />
                    </button>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
