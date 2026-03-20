"use client";

import React, { useState, useRef, useEffect } from "react";
import { Square, Loader2, Play, Volume2, History, TrendingUp, Award, AlertTriangle, CheckCircle2, RotateCcw, Activity, Shuffle, BrainCircuit, Users, ShieldCheck, MessageSquare } from "lucide-react";
import { ENDPOINTS } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { analyzeInterview } from "@/utils/interviewIntelligence";
import { getRandomQuestion } from "@/lib/questionGenerator";
import { saveSession, getSessions, clearSessions, getRecentQuestions, InterviewSession } from "@/lib/sessionManager";

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


const ROLE_DISPLAY_MAP: Record<string, string> = {
  default: "General / Unspecified",
  "Frontend Developer": "Frontend Developer",
  "Backend Developer": "Backend Developer",
  "Full Stack Developer": "Full Stack Developer",
  "DevOps Engineer": "DevOps Engineer",
  "ML Engineer": "ML Engineer",
};

export default function VoicePage() {
  const [status, setStatus] = useState<"idle" | "recording" | "analyzing" | "done" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [metrics, setMetrics] = useState<VoiceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<InterviewSession[]>([]);
  const [userRole, setUserRole] = useState<string>("default");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [skillFocus, setSkillFocus] = useState<"technical" | "behavioral">("technical");

  // Refs for Audio Waveform
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingStartRef = useRef<number>(0); // Track real recording duration for WPM

  const availableRoles = Object.keys(ROLE_DISPLAY_MAP);

  const refreshQuestion = (role: string) => {
    const recentQuestions = getRecentQuestions(5);
    setCurrentQuestion(getRandomQuestion(role, recentQuestions));
  };

  useEffect(() => {
    // Load persistent session history
    setSessionHistory(getSessions());

    // Detect role from resume data
    const resumeData = localStorage.getItem("careerspark_last_resume");
    let detectedRole = "default";
    if (resumeData) {
      try {
        const parsed = JSON.parse(resumeData);
        const raw = parsed.confirmed_role || parsed.inferred_role || "default";
        const matched = availableRoles.find(r => raw.toLowerCase().includes(r.toLowerCase().split(" ")[0]));
        if (matched) detectedRole = matched;
      } catch { /* ignore */ }
    }
    setUserRole(detectedRole);
    refreshQuestion(detectedRole);

    return () => { stopAudioVisualization(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cycleQuestion = (role: string) => {
    refreshQuestion(role);
  };

  const resetSession = () => {
    setStatus("idle");
    setTranscript("");
    setMetrics(null);
    setError(null);
    refreshQuestion(userRole);
  };

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
    } catch (err) { console.error("Audio access error:", err); }
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgba(255, 214, 0, ${dataArray[i] / 255 + 0.1})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
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
    recognition.onresult = (event: any) => {
      let current = "";
      for (let i = event.resultIndex; i < event.results.length; i++) { current += event.results[i][0].transcript; }
      setTranscript(current);
    };
    recognition.onerror = (err: any) => { console.error("Speech error", err); setError("Error during recognition."); stopRecording(); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    stopAudioVisualization();
    setStatus("analyzing");
    const durationSeconds = (Date.now() - recordingStartRef.current) / 1000;
    handleAnalyze(durationSeconds);
  };

  const fetchWithTimeout = async (url: string, options: any, timeout = 12000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Voice analysis timeout")), timeout)
      )
    ]) as Promise<Response>;
  };

  const handleAnalyze = async (durationSeconds = 60) => {
    if (!transcript) {
      setError("No speech detected. Please try again.");
      setStatus("idle");
      return;
    }

    // STEP 1: Run Local Analysis (Instant)
    const localResults = analyzeInterview(transcript, durationSeconds);
    
    // Construct initial metrics from local analysis
    const initialMetrics: VoiceMetrics = {
      filler_words: localResults.fillers.length,
      filler_list: Array.from(new Set(localResults.fillers)),
      pacing_wpm: localResults.wpm,
      pause_frequency: localResults.wordCount > 20 ? "Moderate" : "Low",
      clarity_score: 75,
      confidence_score: localResults.confidenceScore,
      professional_tone: localResults.professionalismScore,
      sentence_structure: localResults.structureScore,
      readiness_score: Math.round((localResults.confidenceScore + localResults.professionalismScore + localResults.structureScore) / 3),
      content_quality: localResults.contentQuality,
      professionalism_score: localResults.professionalismScore,
      issues_detected: localResults.issues,
      offensive_language_found: localResults.aggressiveWords.length > 0,
      transcript: transcript,
      feedback: "⚡ Instant analysis ready — AI coach generating deeper feedback...",
      strengths: localResults.strengths,
      improvements: localResults.issues,
      recommendations: ["AI coaching feedback loading in background..."]
    };

    setMetrics(initialMetrics);
    setStatus("done");

    // Save session immediately with local results
    const savedSession = saveSession({
      question: currentQuestion,
      transcript,
      readiness: initialMetrics.readiness_score,
      professionalism: localResults.professionalismScore,
      structure: localResults.structureScore,
      content: localResults.contentQuality,
      wpm: localResults.wpm,
      fillers: localResults.fillers.length,
      feedback: initialMetrics.feedback,
    });
    const updatedSessions = getSessions();
    setSessionHistory(updatedSessions);

    cycleQuestion(userRole);

    // STEP 2: Non-blocking AI Feedback
    try {
      const res = await fetchWithTimeout(ENDPOINTS.VOICE_ANALYZE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      }, 10000);
      
      if (!res.ok) throw new Error("AI analysis failed");
      const aiData = await res.json();
      
      if (aiData) {
        setMetrics(prev => {
          if (!prev) return aiData;
          return {
            ...prev,
            ...aiData,
            transcript,
            offensive_language_found: prev.offensive_language_found || (aiData.offensive_language_found ?? false)
          };
        });
      }
    } catch (err: any) {
      console.warn("Background AI analysis timed out or failed:", err);
      setMetrics(prev => {
        if (!prev) return null;
        return {
          ...prev,
          recommendations: ["AI feedback delayed — basic analysis shown."]
        };
      });
    }
  };

  const normalizedMetrics = {
    transcript: transcript || metrics?.transcript || "",
    words_per_minute: metrics?.pacing_wpm ?? 0,
    filler_words: metrics?.filler_words ?? 0,
    filler_list: metrics?.filler_list ?? [],
    confidence_score: metrics?.confidence_score ?? 50,
    clarity_score: metrics?.clarity_score ?? 50,
    readiness_score: metrics?.readiness_score ?? 50,
    professional_tone: metrics?.professional_tone ?? 50,
    sentence_structure: metrics?.sentence_structure ?? 50,
    content_quality: metrics?.content_quality ?? "N/A",
    professionalism_score: metrics?.professionalism_score ?? metrics?.professional_tone ?? 50,
    issues_detected: metrics?.issues_detected ?? [],
    offensive_language_found: metrics?.offensive_language_found ?? false,
    recommendations: metrics?.recommendations ?? metrics?.improvements ?? [],
    strengths: metrics?.strengths ?? [],
    improvements: metrics?.improvements ?? [],
    feedback: metrics?.feedback ?? "Analysis pending..."
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden">
      <header className="h-[64px] border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Voice Pro Analyzer</h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Speech Intelligence System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {metrics && (
            <div className="flex items-center gap-3 mr-4">
              <button 
                onClick={() => {
                  const context = {
                    type: "voice",
                    speech_speed: metrics.pacing_wpm,
                    filler_words: metrics.filler_words,
                    clarity_score: metrics.clarity_score,
                    confidence_score: metrics.confidence_score,
                    suggestions: metrics.recommendations
                  };
                  sessionStorage.setItem("careerspark_analysis_context", JSON.stringify(context));
                  window.location.href = "/chat?persona=voice_reviewer";
                }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,214,0,0.2)]"
              >
                <MessageSquare className="w-3 h-3" />
                Discuss Voice Feedback
              </button>
              <button 
                onClick={() => {
                  const context = {
                    type: "voice",
                    purpose: "soft_skills",
                    summary: "User wants to improve communication and confidence based on voice feedback.",
                    metrics: {
                      speed: metrics.pacing_wpm,
                      clarity: metrics.clarity_score,
                      confidence: metrics.confidence_score
                    },
                    suggestions: metrics.recommendations
                  };
                  sessionStorage.setItem("careerspark_analysis_context", JSON.stringify(context));
                  window.location.href = "/chat?persona=soft_skill_tutor";
                }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
                <TrendingUp className="w-3 h-3 text-primary" />
                Improve Communication
              </button>
            </div>
          )}
          <div className="flex flex-col items-end">
             <span className="text-[9px] uppercase text-zinc-500 font-bold">Persistence</span>
             <span className="text-[10px] text-primary font-mono">Session History Active</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          
          {/* Main Control Panel (1 fraction) */}
          <div className="w-full lg:w-[40%] space-y-6">
            
            {/* Role & Focus Selector */}
            <div className="liquid-glass p-6 rounded-[24px] border border-white/5 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-zinc-400">
                <BrainCircuit className="w-3.5 h-3.5 text-primary" /> Practice Config
              </h4>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] uppercase text-zinc-600 font-bold block mb-2 tracking-wider">Career Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => { setUserRole(e.target.value); refreshQuestion(e.target.value); }}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold appearance-none hover:border-primary/30 transition-all focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                  >
                    {availableRoles.map(r => <option key={r} value={r} className="bg-zinc-900">{ROLE_DISPLAY_MAP[r]}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase text-zinc-600 font-bold block mb-2 tracking-wider">Skill Focus</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setSkillFocus("technical"); refreshQuestion(userRole); }}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border transform hover:scale-[1.02] active:scale-95",
                        skillFocus === "technical" 
                          ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(255,214,0,0.2)]"
                          : "bg-black/40 border-white/10 text-zinc-500 hover:text-white hover:border-white/20"
                      )}
                    >
                      <BrainCircuit className="w-3.5 h-3.5 inline mr-1.5" /> Technical
                    </button>
                    <button
                      onClick={() => { setSkillFocus("behavioral"); refreshQuestion(userRole); }}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border transform hover:scale-[1.02] active:scale-95",
                        skillFocus === "behavioral"
                          ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(255,214,0,0.2)]"
                          : "bg-black/40 border-white/10 text-zinc-500 hover:text-white hover:border-white/20"
                      )}
                    >
                      <Users className="w-3.5 h-3.5 inline mr-1.5" /> Behavioral
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Practice Session Card */}
            <div className="liquid-glass p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-24 h-24" />
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bebas tracking-wider">Practice Session</h3>
                <button onClick={() => cycleQuestion(userRole)} title="Shuffle question" className="p-2 rounded-xl bg-white/5 hover:bg-primary/10 transition-all">
                  <Shuffle className="w-4 h-4 text-zinc-500 hover:text-primary" />
                </button>
              </div>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                Click start and answer: <br/>
                <span className="italic text-zinc-300">"{currentQuestion}"</span>
              </p>

              <div className="relative h-24 mb-8 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-full" width={400} height={100} />
                {status === "idle" && <Volume2 className="w-8 h-8 text-zinc-800 opacity-20" />}
                {status === "analyzing" && (
                    <div className="flex items-center gap-3 text-primary animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Processing...</span>
                    </div>
                )}
              </div>

              {status === "idle" || status === "done" || status === "error" ? (
                <button 
                  onClick={startRecording}
                  className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,214,0,0.2)]"
                >
                  <Play className="w-5 h-5 fill-current" /> Start Practice
                </button>
              ) : status === "recording" ? (
                <button 
                  onClick={stopRecording}
                  className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 animate-pulse hover:bg-red-700 transition-colors"
                >
                  <Square className="w-5 h-5 fill-current" /> Stop & Analyze
                </button>
              ) : (
                <div className="w-full py-4 bg-zinc-900 border border-white/5 text-zinc-400 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Voice...
                </div>
              )}

              {error && <p className="mt-4 text-[10px] text-red-500 font-mono uppercase text-center">{error}</p>}
            </div>

            {/* Session History Mini Chart */}
            <div className="liquid-glass p-6 rounded-[24px] border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <History className="w-3 h-3 text-primary" /> Session History
                </h4>
                <button 
                    onClick={() => { clearSessions(); setSessionHistory([]); }}
                    className="text-[8px] uppercase text-zinc-600 hover:text-red-500 transition-colors"
                >
                    Clear
                </button>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {sessionHistory.map((h, i) => (
                  <div 
                    key={i} 
                    title={`Readiness: ${h.readiness}%`}
                    style={{ height: `${h.readiness ?? 0}%` }} 
                    className="flex-1 bg-primary/10 hover:bg-primary/30 border-t border-primary/40 rounded-t-lg transition-colors cursor-help"
                  />
                ))}
                {sessionHistory.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center border border-dashed border-white/5 rounded-xl">
                        <p className="text-[9px] text-zinc-700 italic">No history yet</p>
                    </div>
                )}
              </div>
            </div>
          </div>


          {/* Analysis Results Display (1.5 fraction) */}
          <div className="w-full lg:w-[60%] space-y-6">
            {!metrics && status !== "analyzing" && (
              <div className="h-full min-h-[500px] bg-black/40 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-zinc-600 group hover:border-primary/10 transition-all duration-500">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
                  <div className="relative w-24 h-24 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(255,214,0,0.05)]">
                    <Volume2 className="w-10 h-10 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <p className="text-sm uppercase tracking-[0.3em] font-black group-hover:text-zinc-400 transition-colors">Waiting for Vocal Signal</p>
                <div className="flex items-center gap-2 mt-3 opacity-40 group-hover:opacity-100 transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] text-zinc-500 italic font-mono uppercase tracking-widest">Neural Link Offline</p>
                </div>
              </div>
            )}

            {metrics && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
                {/* Offensive Language Warning */}
                {normalizedMetrics.offensive_language_found && (
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[32px] flex items-center gap-6 animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider">Unprofessional Language Detected</h4>
                      <p className="text-xs text-red-400 opacity-80 mt-1">
                        Your response contained language that may be considered unprofessional in an interview setting. 
                        Focus on maintaining a respectful and constructive tone.
                      </p>
                    </div>
                  </div>
                )}

                {/* Score Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ScoreCard label="Readiness" value={normalizedMetrics.readiness_score} icon={<Award/>} color="#FFD600" />
                  <ScoreCard label="Professionalism" value={normalizedMetrics.professionalism_score} icon={<ShieldCheck className="w-4 h-4" />} color="#3b82f6" />
                  <ScoreCard label="Structure" value={normalizedMetrics.sentence_structure} icon={<BrainCircuit/>} color="#8b5cf6" />
                  <ScoreCard label="Content" value={normalizedMetrics.content_quality === "Excellent" ? 100 : (normalizedMetrics.content_quality === "Good" ? 75 : 40)} icon={<Award/>} color="#f59e0b" customValue={normalizedMetrics.content_quality} />
                </div>

                {/* Dashboard Main Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-[#0A0A0A] border border-white/5 p-10 rounded-[40px] space-y-8 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 blur-[80px] rounded-full" />
                    
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bebas tracking-wide">Speech Analytics Report</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-zinc-400">Gemini 1.5 Pro Analysis</span>
                      </div>
                    </div>

                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <span className="block text-[10px] uppercase text-zinc-500 mb-3 font-bold tracking-widest">Transcription Preview</span>
                        <p className="text-sm italic text-zinc-200 leading-relaxed font-serif">
                        "{normalizedMetrics.transcript}"
                        </p>
                      </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-5 bg-black/60 rounded-3xl border border-white/5 hover:border-primary/20 transition-colors">
                        <span className="block text-[10px] uppercase text-zinc-500 mb-2">Pacing</span>
                        <div className="text-2xl font-black">{normalizedMetrics.words_per_minute} <span className="text-[10px] text-zinc-600 font-mono">WPM</span></div>
                        <span className="text-[9px] text-zinc-600">Words/Min</span>
                      </div>
                      <div className="p-5 bg-black/60 rounded-3xl border border-white/5 hover:border-primary/20 transition-colors">
                        <span className="block text-[10px] uppercase text-zinc-500 mb-2">Fillers</span>
                        <div className="text-2xl font-black">{normalizedMetrics.filler_words} <span className="text-[10px] text-zinc-600 font-mono italic">
                          {normalizedMetrics.filler_list?.[0] || "None"}
                        </span></div>
                        <span className="text-[9px] text-zinc-600">Primary Filler</span>
                      </div>
                      <div className="p-5 bg-black/60 rounded-3xl border border-white/5 hover:border-primary/20 transition-colors">
                        <span className="block text-[10px] uppercase text-zinc-500 mb-2">Content</span>
                        <div className="text-xl font-black uppercase text-primary">{normalizedMetrics.content_quality}</div>
                        <span className="text-[9px] text-zinc-600">Quality Level</span>
                      </div>
                    </div>

                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl flex gap-5 items-start">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                         <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase text-zinc-400 mb-1 font-black">AI Interview Coach Feedback</span>
                        <p className="text-sm font-medium text-zinc-300 leading-relaxed">{normalizedMetrics.feedback}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Feedback */}
                  <div className="space-y-4">
                    <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[36px] hover:border-emerald-500/20 transition-colors">
                      <h4 className="text-[11px] font-black uppercase text-emerald-400 mb-5 flex items-center gap-2 tracking-[0.2em]">
                        <CheckCircle2 className="w-4 h-4" /> Strong Points
                      </h4>
                      <ul className="space-y-4">
                        {normalizedMetrics.strengths.slice(0, 3).map((s, i) => (
                          <li key={i} className="flex gap-3 text-xs text-emerald-200/60 items-start leading-tight">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mt-1 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[36px] hover:border-amber-500/20 transition-colors">
                      <h4 className="text-[11px] font-black uppercase text-amber-400 mb-5 flex items-center gap-2 tracking-[0.2em]">
                        <AlertTriangle className="w-4 h-4" /> Issues Detected
                      </h4>
                      <ul className="space-y-4">
                        {(normalizedMetrics.issues_detected.length > 0 ? normalizedMetrics.issues_detected : normalizedMetrics.improvements).slice(0, 4).map((s, i) => (
                          <li key={i} className="flex gap-3 text-xs text-amber-200/60 items-start leading-tight">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 mt-1 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <button 
                        onClick={resetSession}
                        className="w-full py-4 border border-white/5 hover:border-white/10 rounded-3xl text-[10px] uppercase font-black tracking-widest text-zinc-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-3 h-3" /> New Session
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, icon, color, customValue }: { label: string, value: number, icon: any, color: string, customValue?: string }) {
  return (
    <div className="liquid-glass p-6 rounded-3xl border border-white/5 hover:scale-[1.02] transition-all">
      <div className="flex items-center justify-between mb-4">
        <div style={{ color }} className="opacity-80 scale-110">{React.cloneElement(icon, { size: 18 })}</div>
        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{label}</span>
      </div>
      <div className="space-y-4">
        <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold font-bebas tracking-tighter">{customValue || value}</span>
            <span className="text-[10px] text-zinc-600 font-mono">{customValue ? "" : "%"}</span>
        </div>
        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-1000 ease-out" 
            style={{ width: `${value}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
