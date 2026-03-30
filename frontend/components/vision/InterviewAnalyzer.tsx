"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
  Mic, 
  StopCircle, 
  Brain, 
  Zap, 
  Target, 
  Activity, 
  Loader2,
  Video,
  Smile,
  Meh,
  Frown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { motion, AnimatePresence } from "framer-motion";
import { speechController } from "@/lib/speechController";
import { ttsController } from "@/lib/ttsController";
import { useTTS } from "@/hooks/useTTS";

type InterviewStep = "setup" | "active";
type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface Metric {
  label: string;
  value: string | number;
  icon: React.ElementType;
}

export default function InterviewAnalyzer() {
  const { lang } = useLanguage();
  const t = useMemo(() => translations[lang], [lang]);
  const { speak, stop: stopTTS } = useTTS();

  const [step, setStep] = useState<InterviewStep>("setup");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [mode, setMode] = useState<"technical" | "scenario">("technical");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "professional">("intermediate");
  
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [emotion, setEmotion] = useState<{ face: string; voice: string }>({ face: "neutral", voice: "neutral" });
  const [confidence, setConfidence] = useState(0);
  const [clarity, setClarity] = useState(90);
  const [suggestion, setSuggestion] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatHistory = useRef<{ role: string; content: string }[]>([]);

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    speechController.stopListening();
    stopTTS();
  };

  const handleStartInterview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: false // SpeechController handles its own mic
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current?.play();
      }
      streamRef.current = stream;
      setStep("active");
      
      // Initial AI greeting
      await triggerAIQuestion("Greeting", true);
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Please allow camera access to start the interview.");
    }
  };

  const triggerAIQuestion = async (userText: string, isFirst = false) => {
    setVoiceState("processing");
    speechController.stopListening();

    try {
      const res = await fetch("/api/interview/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory.current,
          transcript: userText,
          mode,
          difficulty,
          face_metrics: { emotion: emotion.face, confidence }
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAiResponse(data.next_question);
      setSuggestion(data.suggestion || "");
      
      // Update history
      if (!isFirst) chatHistory.current.push({ role: "user", content: userText });
      chatHistory.current.push({ role: "assistant", content: data.next_question });
      
      setVoiceState("speaking");
      await speak(data.next_question, lang as "en" | "ta");
      
      if (step === "active") {
        startListening();
      }
    } catch (err) {
      console.error("AI Response error:", err);
      setVoiceState("idle");
    }
  };

  const startListening = () => {
    setVoiceState("listening");
    setTranscript("");
    
    speechController.register({
      onFinal: (text, _confidence, _detectedLang) => {
        setTranscript(text);
        triggerAIQuestion(text);
      },
      onInterim: (text) => setTranscript(text),
      onState: (listening) => {
        if (!listening && voiceState === "listening") {
          // Sync UI if internal state changes
        }
      }
    });
    speechController.startListening();
  };

  // --- Real-time Face Sampling (Native) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "active") {
      interval = setInterval(async () => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const img = canvasRef.current.toDataURL("image/jpeg", 0.6);
        
        try {
          const res = await fetch("/api/analyze/face", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: img })
          });
          const data = await res.json();
          if (data.face_emotion) setEmotion(prev => ({ ...prev, face: data.face_emotion }));
          if (data.confidence_score) setConfidence(data.confidence_score);
        } catch (e) {
          console.error("Face sampling failed", e);
        }
      }, 2000); // Sample every 2 seconds
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleStop = () => {
    stopEverything();
    setStep("setup");
    setAiResponse("");
    setTranscript("");
    chatHistory.current = [];
  };

  if (step === "setup") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-black text-white space-y-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <h1 className="text-6xl font-bebas tracking-tighter text-primary">AI INTERVIEWER</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.4em]">Select mode & initiate</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[40px] space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Target className="w-4 h-4" /> Interview Type
            </h3>
            <div className="space-y-3">
              {["technical", "scenario"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m as any)}
                  className={cn(
                    "w-full p-6 rounded-3xl border text-left transition-all",
                    mode === m ? "bg-primary text-black border-transparent" : "bg-white/5 border-white/5"
                  )}
                >
                  <span className="text-sm font-bold uppercase tracking-wider">{m}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[40px] space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Activity className="w-4 h-4" /> Difficulty
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {["beginner", "intermediate", "professional"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d as any)}
                  className={cn(
                    "p-4 rounded-3xl border text-left transition-all",
                    difficulty === d ? "bg-primary text-black border-transparent" : "bg-white/5 border-white/5"
                  )}
                >
                  <span className="text-xs font-bold uppercase tracking-widest">{d}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleStartInterview}
          className="w-full max-w-sm h-20 rounded-full bg-primary text-black font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_20px_60px_rgba(255,214,0,0.2)]"
        >
          START INTERVIEW
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-12 space-y-8 flex flex-col font-sans">
      {/* Header Status Bar */}
      <div className="flex items-center justify-between bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-[32px]">
        <div className="flex items-center gap-6 px-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse", 
              voiceState === "listening" ? "bg-red-500" : 
              voiceState === "processing" ? "bg-yellow-500" : 
              voiceState === "speaking" ? "bg-green-500" : "bg-zinc-700"
            )} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {voiceState.toUpperCase()}
            </span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">{mode} // {difficulty}</span>
        </div>
        
        <button onClick={handleStop} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-all">
          <StopCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1 items-start">
        {/* Main Center Area */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="relative aspect-video bg-zinc-900 rounded-[48px] border border-white/5 overflow-hidden shadow-2xl overflow-hidden">
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               muted 
               className="w-full h-full object-cover mirror" 
             />
             <canvas ref={canvasRef} className="hidden" width={320} height={240} />
             
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
             
             <div className="absolute bottom-8 left-8 flex items-center gap-3">
               <div className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
               </div>
             </div>
          </div>

          {/* Transcript & AI Response */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {voiceState === "listening" && transcript && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 bg-zinc-900/50 border border-white/5 rounded-[32px]">
                  <p className="text-zinc-400 text-lg font-medium italic">"{transcript}"</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-10 bg-zinc-900/50 border border-white/5 rounded-[40px] min-h-[160px] flex flex-col justify-center gap-4 relative">
              {voiceState === "processing" && (
                <div className="absolute top-6 right-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
              <div className="flex items-center gap-3 opacity-40">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Interviewer</span>
              </div>
              <p className="text-xl font-medium text-white leading-relaxed">
                {aiResponse || "Connecting..."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[40px] space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Analysis</h3>
            
            <div className="space-y-6">
              <MetricItem 
                label="Face Emotion" 
                value={emotion.face} 
                icon={emotion.face === 'happy' ? Smile : emotion.face === 'sad' ? Frown : Meh} 
              />
              <div className="h-px bg-white/5" />
              <MetricItem label="Confidence" value={`${confidence}%`} icon={Zap} />
              <div className="h-px bg-white/5" />
              <MetricItem label="Clarity" value={`${clarity}%`} icon={Activity} />
            </div>
          </div>

          <AnimatePresence>
            {suggestion && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-primary/5 border border-primary/10 rounded-[40px] space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Zap className="w-4 h-4" /> AI Suggestion
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed font-medium">"{suggestion}"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MetricItem({ label, value, icon: Icon }: Metric) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-bold uppercase text-white group-hover:text-primary transition-colors">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Global styles for mirror effect
const styles = `
  .mirror { transform: rotateY(180deg); }
`;
