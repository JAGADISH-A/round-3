"use client";

import { useEffect, useRef, useState } from "react";
import Avatar, { AvatarRef, AvatarState } from "@/components/Avatar";
import StatusPill from "@/components/StatusPill";
import SetupPanel, { Role, Difficulty, FocusArea } from "@/components/SetupPanel";
import { useVoiceState } from "@/hooks/useVoiceState";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

type Coach = { id: string; name: string; file: string; icon: string; color: string };

export default function InterviewProductPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const coaches: Coach[] = [
    { id: 'mascot', name: t.interview.coaches.mascot, file: '/mascot.riv', icon: '🐝', color: 'border-[#FF5722]' },
    { id: 'rabbit', name: t.interview.coaches.buster, file: '/rabbit.riv', icon: '🐰', color: 'border-[#1CB0F6]' },
    { id: 'face',   name: t.interview.coaches.alex,   file: '/face.riv',   icon: '👱‍♂️', color: 'border-[#58CC02]' },
    { id: 'curious',name: t.interview.coaches.zorbo,  file: '/curious.riv',icon: '👽', color: 'border-[#FFC800]' },
  ];

  const [role,       setRole]       = useState<Role>("Frontend Developer");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [focusArea,  setFocusArea]  = useState<FocusArea>("Behavioral Questions");
  const [selectedCoach, setSelectedCoach] = useState<Coach>(coaches[0]);
  const avatarRef = useRef<AvatarRef>(null);

  const voice = useVoiceState({
    apiKey:      process.env.NEXT_PUBLIC_VAPI_API_KEY      || "",
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "",
    role,
    difficulty,
    focusArea,
    lang, // Pass language to the voice hook
  });

  // Map connecting → thinking for clean AvatarState typing
  const avatarState: AvatarState =
    voice.state === "connecting" ? "thinking" :
    voice.state === "idle"       ? "idle"      :
    voice.state;

  // Sync avatar state via imperative ref
  useEffect(() => {
    avatarRef.current?.setAvatarState(avatarState);
  }, [avatarState]);

  const toggleInterview = () => voice.isRunning ? voice.stop() : voice.start();

  return (
    <div className="min-h-full bg-transparent text-white font-nav selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-7xl mx-auto px-6 py-6 md:py-12">

        {/* ── Header ── */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-cyan-500/20 bg-cyan-500/5 text-[10px] font-orbitron text-cyan-400 uppercase tracking-[0.3em]">
              <Sparkles className="w-3 h-3 animate-pulse" /> {t.interview.module}
            </div>
            <h1 className="text-4xl md:text-6xl font-orbitron font-black tracking-tighter uppercase leading-none">
                {t.interview.title.includes('_') 
                  ? <>{t.interview.title.split('_')[0]}_<span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">{t.interview.title.split('_')[1]}</span></>
                  : <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">{t.interview.title}</span>
                }
            </h1>
            <p className="text-cyan-500/40 font-tech text-xs uppercase tracking-widest max-w-xl">
              {t.interview.subtitle}
            </p>
          </div>

          {/* ── Coach Selector ── */}
          <div className="hud-panel p-2 flex gap-2">
            {coaches.map((coach) => (
              <button
                key={coach.id}
                disabled={voice.isRunning}
                onClick={() => setSelectedCoach(coach)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-[64px] h-[64px] transition-all duration-300 border",
                  selectedCoach.id === coach.id
                    ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.2)] opacity-100"
                    : "bg-black/40 border-cyan-500/10 opacity-40 hover:opacity-100 hover:border-cyan-500/30"
                )}
                style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
              >
                <span className="text-xl mb-1">{coach.icon}</span>
                <span className="text-[8px] font-orbitron font-black uppercase tracking-tighter text-cyan-400">{coach.name}</span>
                {selectedCoach.id === coach.id && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rotate-45" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

          {/* Left: Setup Panel */}
          <div className="lg:col-span-4 flex flex-col min-h-[550px]">
             <div className="hud-panel p-8 h-full"> 
                <SetupPanel
                  isActive={voice.isRunning}
                  role={role}       setRole={setRole}
                  difficulty={difficulty} setDifficulty={setDifficulty}
                  focusArea={focusArea}   setFocusArea={setFocusArea}
                  onToggleInterview={toggleInterview}
                />
             </div>
          </div>

          {/* Right: Avatar Arena */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center hud-panel p-8 md:p-12 min-h-[550px] relative overflow-hidden bg-black/40">

            {/* Ambient Glow */}
            <div className={`absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none transition-colors duration-1000 ${selectedCoach.color.replace('border-', 'bg-')}`}>
              <div className="w-[600px] h-[600px] rounded-full blur-[180px]" />
            </div>

            {/* Scanline Effect Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center w-full">
              <div key={selectedCoach.id} className="animate-in fade-in zoom-in-95 duration-500 drop-shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                <Avatar ref={avatarRef} src={selectedCoach.file} state={avatarState} size="xl" />
              </div>
              <div className="mt-12 scale-110">
                <StatusPill status={voice.state === "connecting" ? "thinking" : voice.state} />
              </div>
            </div>

            {/* Decorative HUD Elements */}
            <div className="absolute bottom-8 left-8 flex gap-4 opacity-20">
               <div className="w-12 h-1 bg-cyan-500/40" />
               <div className="w-4 h-1 bg-cyan-500/40" />
               <div className="w-1 h-1 bg-cyan-500/40" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
