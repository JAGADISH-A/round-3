"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Maximize, SkipBack, SkipForward, Settings, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VideoTheaterProps {
  src: string;
  title: string;
  onEnded?: () => void;
}

export function VideoTheater({ src, title, onEnded }: VideoTheaterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);
    
    // Auto-reset when src changes
    setIsPlaying(false);
    setProgress(0);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, [src, onEnded]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <div 
      className="relative w-full aspect-video bg-black rounded-[40px] overflow-hidden border border-white/5 group shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* OVERLAY: THEATER HUD */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent space-y-4"
          >
            {/* Title / Status */}
            <div className="flex justify-between items-end mb-4">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]" />
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Neural_Broadcasting_Active</span>
                  </div>
                  <h2 className="text-xl font-orbitron text-white uppercase tracking-tighter">{title}</h2>
               </div>
               <div className="text-[10px] font-mono text-cyan-400 opacity-60 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> BUFFER_SYNC_v3.2
               </div>
            </div>

            {/* Custom Progress Bar */}
            <div className="relative h-1.5 bg-white/10 rounded-full group/progress cursor-pointer">
              <input 
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="absolute inset-y-0 left-0 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan]" 
                style={{ width: `${progress}%` }} 
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-transform scale-0 group-hover/progress:scale-100 z-0"
                style={{ left: `${progress}%` }}
              />
            </div>

            {/* Hub Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-colors">
                  {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6" />}
                </button>
                <div className="flex items-center gap-4 text-white/40">
                   <SkipBack className="w-4 h-4 hover:text-white cursor-pointer" />
                   <SkipForward className="w-4 h-4 hover:text-white cursor-pointer" />
                </div>
                <div className="text-[11px] font-mono text-white/60 tracking-widest">
                  {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Volume2 className="w-5 h-5 text-white/40 hover:text-white cursor-pointer" />
                <Settings className="w-5 h-5 text-white/40 hover:text-white cursor-pointer" />
                <Maximize className="w-5 h-5 text-white/40 hover:text-white cursor-pointer" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTRAL PLAY BUTTON (Large) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <motion.button 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-500/5 backdrop-blur-sm group/btn"
          >
            <Play className="w-10 h-10 text-cyan-400 fill-cyan-400/20 group-hover/btn:scale-110 transition-transform" />
          </motion.button>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => v.toString().padStart(2, "0")).slice(h > 0 ? 0 : 1).join(":");
}
