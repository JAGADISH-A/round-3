"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Play, Activity, TrendingUp, AlertTriangle, CheckCircle2, RotateCcw, MessageSquare, BrainCircuit, ShieldCheck, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ENDPOINTS } from "@/lib/api-config";
import { analyzeInterview } from "@/utils/interviewIntelligence";
import { getRandomQuestion } from "@/lib/questionGenerator";
import { saveSession, getSessions, clearSessions, getRecentQuestions, InterviewSession } from "@/lib/sessionManager";
import { cn } from "@/lib/utils";

interface VoiceMetrics {
  filler_words: number;
  filler_list: string[];
  pacing_wpm: number;
  pause_frequency: string;
  clarity_score: number;
  confidence_score: number;
  professional_tone: number;
  sentence_structure: number;
  readiness_score: number;
  content_quality?: string;
  professionalism_score?: number;
  issues_detected?: string[];
  offensive_language_found?: boolean;
  transcript?: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export function SpeakingSection() {
  const [status, setStatus] = useState<"idle" | "recording" | "analyzing" | "done" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [metrics, setMetrics] = useState<VoiceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingStartRef = useRef<number>(0);

  useEffect(() => {
    const recent = getRecentQuestions(5);
    setCurrentQuestion(getRandomQuestion("Backend Developer", recent));
    return () => stopAudioVisualization();
  }, []);

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      drawWaveform();
    } catch (err) { console.error("Audio error:", err); }
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      const barWidth = (canvasRef.current!.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvasRef.current!.height;
        ctx.fillStyle = `rgba(0, 255, 255, ${dataArray[i] / 255 + 0.2})`;
        ctx.fillRect(x, canvasRef.current!.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    render();
  };

  const startRecording = async () => {
    setError(null);
    setTranscript("");
    setStatus("recording");
    recordingStartRef.current = Date.now();
    await startAudioVisualization();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Speech recognition not supported."); setStatus("error"); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      let current = "";
      for (let i = e.resultIndex; i < e.results.length; i++) current += e.results[i][0].transcript;
      setTranscript(current);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    stopAudioVisualization();
    setStatus("analyzing");
    handleAnalyze((Date.now() - recordingStartRef.current) / 1000);
  };

  const handleAnalyze = async (duration: number) => {
    if (!transcript) { setError("No speech detected."); setStatus("idle"); return; }
    const local = analyzeInterview(transcript, duration);
    const initial: VoiceMetrics = {
      filler_words: local.fillers.length,
      filler_list: local.fillers,
      pacing_wpm: local.wpm,
      pause_frequency: "Moderate",
      clarity_score: 75,
      confidence_score: local.confidenceScore,
      professional_tone: local.professionalismScore,
      sentence_structure: local.structureScore,
      readiness_score: Math.round((local.confidenceScore + local.professionalismScore + local.structureScore) / 3),
      content_quality: local.contentQuality,
      feedback: "⚡ Instant analysis ready...",
      strengths: local.strengths,
      improvements: local.issues,
      recommendations: ["AI generation in progress..."]
    };
    setMetrics(initial);
    setStatus("done");

    saveSession({
      question: currentQuestion,
      transcript,
      readiness: initial.readiness_score,
      professionalism: local.professionalismScore,
      structure: local.structureScore,
      content: local.contentQuality,
      wpm: local.wpm,
      fillers: local.fillers.length,
      feedback: initial.feedback,
    });

    try {
      const res = await fetch(ENDPOINTS.VOICE_ANALYZE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (res.ok) {
        const aiData = await res.json();
        setMetrics(prev => prev ? { ...prev, ...aiData, transcript } : aiData);
      }
    } catch (e) { console.warn("AI analysis failed", e); }
  };

  return (
    <div className="space-y-6">
      <div className="hud-panel p-8 bg-black/40 border-white/5 relative group overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Mic className="w-40 h-40 text-cyan-500" />
        </div>
        
        <div className="mb-8">
            <h3 className="text-xl font-orbitron text-white uppercase tracking-tighter mb-2">Voice_Calibration_Scenario</h3>
            <p className="text-sm text-cyan-400 font-nav italic leading-relaxed">"{currentQuestion}"</p>
        </div>

        <div className="h-24 bg-zinc-950/80 rounded-2xl border border-cyan-500/20 mb-8 overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} width={600} height={100} className="w-full h-full" />
            {status === "idle" && <Activity className="w-8 h-8 text-cyan-900/40" />}
            {status === "analyzing" && <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />}
        </div>

        <div className="flex gap-4">
            {status === "recording" ? (
                <button 
                  onClick={stopRecording}
                  className="flex-1 py-4 bg-red-600 text-white font-orbitron text-xs tracking-[0.3em] rounded-2xl animate-pulse flex items-center justify-center gap-3"
                >
                    <Square className="w-4 h-4 fill-current" /> STOP_TRANSMISSION
                </button>
            ) : (
                <button 
                  onClick={startRecording}
                  className="flex-1 py-4 bg-cyan-500 text-black font-orbitron text-xs tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all"
                >
                    <Mic className="w-4 h-4" /> INITIALIZE_VOICE_LINK
                </button>
            )}
            <button 
                onClick={() => {
                    const recent = getRecentQuestions(5);
                    setCurrentQuestion(getRandomQuestion("Backend Developer", recent));
                }}
                className="p-4 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all"
            >
                <RotateCcw className="w-5 h-5" />
            </button>
        </div>
        {error && <p className="mt-4 text-[9px] text-red-500 font-mono text-center uppercase tracking-widest">{error}</p>}
      </div>

      <AnimatePresence>
        {metrics && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScoreMini label="Readiness" value={metrics.readiness_score} icon={<Award size={14}/>} color="#00ffff" />
                <ScoreMini label="Speed" value={metrics.pacing_wpm} icon={<TrendingUp size={14}/>} color="#0ea5e9" customValue={`${metrics.pacing_wpm} WPM`} />
                <ScoreMini label="Confidence" value={metrics.confidence_score} icon={<BrainCircuit size={14}/>} color="#8b5cf6" />
                <ScoreMini label="Tone" value={metrics.professional_tone} icon={<ShieldCheck size={14}/>} color="#10b981" />
            </div>

            <div className="hud-panel p-8 bg-zinc-900/40 border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Neural_Acoustic_Report</h4>
                    <span className="text-[8px] font-mono text-zinc-600">v4.2 // AGENT_ORCHESTRATED</span>
                </div>
                
                <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-xs text-zinc-400 font-serif italic leading-relaxed">"{transcript}"</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h5 className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-2">
                           <CheckCircle2 className="w-3 h-3" /> Core_Strengths
                        </h5>
                        <ul className="space-y-2">
                           {metrics.strengths.slice(0, 3).map((s, i) => (
                             <li key={i} className="text-[11px] text-zinc-400 font-nav border-l-2 border-emerald-500/20 pl-3">{s}</li>
                           ))}
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-2">
                           <AlertTriangle className="w-3 h-3" /> Growth_Needed
                        </h5>
                        <ul className="space-y-2">
                           {metrics.improvements.slice(0, 3).map((s, i) => (
                             <li key={i} className="text-[11px] text-zinc-400 font-nav border-l-2 border-amber-500/20 pl-3">{s}</li>
                           ))}
                        </ul>
                    </div>
                </div>

                <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                        <span className="block text-[9px] font-black text-cyan-500/60 uppercase tracking-widest mb-1">AI_Coach_Insight</span>
                        <p className="text-xs text-zinc-300 font-nav italic leading-relaxed">{metrics.feedback}</p>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreMini({ label, value, icon, color, customValue }: any) {
    return (
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">{label}</span>
                <div style={{ color }} className="opacity-40">{icon}</div>
            </div>
            <div className="text-xl font-orbitron text-white leading-none mb-2">{customValue || `${value}%`}</div>
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }} style={{ backgroundColor: color }} className="h-full opacity-40 shadow-[0_0_10px_currentColor]" />
            </div>
        </div>
    )
}
