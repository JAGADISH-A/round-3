"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Camera, CameraOff, ShieldCheck, Play, Square, MessageSquare, ArrowRight, Activity, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { setLatestMetrics } from "@/lib/vision-store";
import { ENDPOINTS } from "@/lib/api-config";
import { useRouter } from "next/navigation";

interface VisionMetrics {
  face_detected: boolean;
  faces: number;
  confidence_score: number;
  eye_contact: number;
  head_pose: string;
  engagement: number;
}

export function FaceAnalyzer() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [metrics, setMetrics] = useState<VisionMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // 1. Camera Controls
  const startAnalyzer = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsStreaming(true);
      setSessionCompleted(false);
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied.");
    }
  }, []);

  const stopAnalyzer = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setSessionCompleted(true);
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  // 2. Frame capture and analysis loop
  useEffect(() => {
    if (!isStreaming || !stream) return;

    const captureFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = 640;
        canvas.height = 480;
        context.drawImage(video, 0, 0, 640, 480);
        const base64Image = canvas.toDataURL("image/jpeg", 0.7);

        try {
          setIsAnalyzing(true);
          const visionResponse = await fetch(ENDPOINTS.VISION_ANALYZE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_base64: base64Image }),
          });

          if (!visionResponse.ok) throw new Error("Vision service unreachable");

          const visionData: VisionMetrics = await visionResponse.json();
          setMetrics(visionData);
          setLatestMetrics(visionData);
          setError(null);
        } catch (err) {
          setError("Vision AI Service Unreachable");
          stopAnalyzer();
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    const interval = setInterval(captureFrame, 2000);
    return () => clearInterval(interval);
  }, [isStreaming, stream, stopAnalyzer]);

  const sendToChat = () => {
    if (!metrics) return;
    
    const context = {
      eye_contact: metrics.eye_contact,
      engagement: metrics.engagement,
      head_pose: metrics.head_pose,
      confidence_score: metrics.confidence_score
    };

    sessionStorage.setItem("careerspark_analysis_context", JSON.stringify(context));
    router.push("/chat?persona=face_reviewer");
  };

  const overallScore = metrics 
    ? (metrics.eye_contact * 0.35 + metrics.engagement * 0.35 + metrics.confidence_score * 0.30).toFixed(0)
    : "0";

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto p-5 rounded-[32px] border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
      {/* Glow Effect */}
      <div className={cn(
        "absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] transition-all duration-1000",
        isStreaming ? "bg-emerald-500/10" : "bg-blue-500/10"
      )} />

      <div className="flex items-center justify-between px-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
          <Activity className="w-3 h-3 text-emerald-400" />
          Pro Vision Analyzer
        </h3>
        {isStreaming && (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live Stream</span>
          </div>
        )}
      </div>

      <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl group">
        {!isStreaming && !sessionCompleted && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all group-hover:bg-black/40">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-6">System Standby</p>
            <button
              onClick={startAnalyzer}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-black rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Analyzer
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover transition-all duration-1000",
            !isStreaming ? "opacity-20 blur-md grayscale" : "opacity-100 grayscale-0"
          )}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Streaming HUD */}
        {isStreaming && metrics && (
           <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none z-20">
              <div className="flex justify-between items-start">
                  <div className="px-3 py-1.5 bg-black/60 rounded-xl border border-white/10 backdrop-blur-md">
                     <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        Analyzing...
                     </span>
                  </div>
                  <div className="px-3 py-1.5 bg-black/60 rounded-xl border border-white/10 backdrop-blur-md">
                     <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">
                        {metrics.head_pose}
                     </span>
                  </div>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                 <div className="px-6 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full backdrop-blur-2xl">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">
                      {metrics.face_detected ? "Face Protocol Optimized" : "Detecting Subject..."}
                    </span>
                 </div>
                 
                 <button
                    onClick={stopAnalyzer}
                    className="pointer-events-auto flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                 >
                    <Square className="w-3 h-3 fill-current" />
                    Stop Analysis
                 </button>
              </div>
           </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center z-30">
            <CameraOff className="w-12 h-12 text-red-500/50 mb-4" />
            <p className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mb-6">{error}</p>
            <button 
              onClick={startAnalyzer}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Reset System
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="mt-2 space-y-4">
        {isStreaming ? (
          <div className="grid grid-cols-2 gap-4">
            <MetricBadge 
              label="Eye Contact" 
              value={metrics?.eye_contact ?? 0} 
              type="percentage"
              color="text-blue-400"
            />
            <MetricBadge 
              label="Engagement" 
              value={metrics?.engagement ?? 0} 
              type="level"
              color="text-emerald-400"
            />
          </div>
        ) : sessionCompleted && metrics ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Session Summary Card */}
            <div className="p-6 rounded-[24px] border border-white/10 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Session Results</h4>
                  <p className="text-lg font-black text-white uppercase tracking-tighter">Performance Summary</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black font-bebas text-emerald-400 tracking-wider transition-all">
                    {overallScore}%
                  </span>
                  <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest">Global Score</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                 <SummaryMiniBadge label="Eye" value={metrics.eye_contact} color="text-blue-400" />
                 <SummaryMiniBadge label="Engage" value={metrics.engagement} color="text-emerald-400" />
                 <SummaryMiniBadge label="Logic" value={metrics.confidence_score} color="text-zinc-400" />
              </div>

              <button
                onClick={sendToChat}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#00E6A8] transition-all group/btn"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                Get AI Coaching Feedback
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
            
            <button
               onClick={startAnalyzer}
               className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
            >
               Restart Analysis
            </button>
          </div>
        ) : (
          <div className="p-8 rounded-[24px] border border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center opacity-40">
             <Target className="w-8 h-8 text-white/20 mb-3" />
             <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Standby for analysis</p>
          </div>
        )}

        {/* Constant Metrics Visualization (Only when streaming) */}
        {isStreaming && (
          <div className="p-5 rounded-[24px] border border-white/5 bg-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Confidence Logic</span>
                </div>
                <span className="text-xs font-mono font-bold text-white/90">{metrics?.confidence_score ?? 0}%</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${metrics?.confidence_score ?? 0}%` }}
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBadge({ label, value, type, color }: { label: string, value: number, type: 'percentage' | 'level', color: string }) {
  const getStatus = (val: number, t: string) => {
    if (t === 'percentage') {
      if (val < 40) return "Poor";
      if (val < 75) return "Average";
      return "Excellent";
    }
    if (val < 30) return "Low";
    if (val < 70) return "Moderate";
    return "Active";
  };

  return (
    <div className="p-4 rounded-[20px] border border-white/5 bg-white/5 flex flex-col gap-2 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{label}</span>
        <span className={cn("text-[9px] font-black uppercase tracking-wider", color)}>
          {getStatus(value, type)}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black font-bebas tracking-wider text-white/90">{value}</span>
        <span className="text-[10px] text-white/20 font-bold">%</span>
      </div>
    </div>
  );
}

function SummaryMiniBadge({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center gap-1">
      <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">{label}</span>
      <span className={cn("text-xs font-black font-mono", color)}>{value}%</span>
    </div>
  );
}
