"use client";

import { useEffect, useRef, useState } from "react";
import Avatar, { AvatarRef, AvatarState } from "@/components/Avatar";
import StatusPill from "@/components/StatusPill";
import SetupPanel, { Role, Difficulty, FocusArea } from "@/components/SetupPanel";
import { useVoiceState } from "@/hooks/useVoiceState";

type Coach = { id: string; name: string; file: string; icon: string; color: string };
const coaches: Coach[] = [
  { id: 'mascot', name: 'Mascot', file: '/mascot.riv', icon: '🐝', color: 'border-[#FF5722]' },
  { id: 'rabbit', name: 'Buster', file: '/rabbit.riv', icon: '🐰', color: 'border-[#1CB0F6]' },
  { id: 'face',   name: 'Alex',   file: '/face.riv',   icon: '👱‍♂️', color: 'border-[#58CC02]' },
  { id: 'curious',name: 'Zorbo',  file: '/curious.riv',icon: '👽', color: 'border-[#FFC800]' },
];

export default function InterviewProductPage() {
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
    <div className="min-h-full bg-[#09090b] text-white font-sans selection:bg-[#F5C518] selection:text-black">
      <div className="max-w-6xl mx-auto px-6 py-6 md:py-12">

        {/* ── Header ── */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#F5C518] to-[#FFC800] drop-shadow-lg">
              Voice Arena
            </h1>
            <p className="text-zinc-400 font-bold text-sm md:text-base max-w-xl">
              Level up your soft skills with real-time AI roleplay. Don't worry, mistakes mean you're learning!
            </p>
          </div>

          {/* ── Coach Selector ── */}
          <div className="bg-[#18181b] p-3 rounded-3xl border-2 border-zinc-800 border-b-4 flex gap-3 shadow-lg">
            {coaches.map((coach) => (
              <button
                key={coach.id}
                disabled={voice.isRunning}
                onClick={() => setSelectedCoach(coach)}
                className={`relative flex flex-col items-center justify-center w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl transition-all duration-200 border-2
                  ${selectedCoach.id === coach.id
                    ? `bg-[#27272a] ${coach.color} border-b-4 scale-105 shadow-md`
                    : 'bg-[#18181b] border-transparent hover:bg-[#27272a] hover:border-zinc-700 opacity-70 hover:opacity-100'
                  } ${voice.isRunning ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
              >
                <span className="text-2xl sm:text-3xl mb-1 drop-shadow-md">{coach.icon}</span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase text-zinc-300 tracking-wider hidden sm:block">{coach.name}</span>
                {selectedCoach.id === coach.id && (
                  <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black border-2 border-zinc-800 flex items-center justify-center ${coach.color.replace('border-', 'text-')}`}>✓</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

          {/* Left: Setup Panel */}
          <div className="lg:col-span-4 flex flex-col min-h-[550px]">
            <SetupPanel
              isActive={voice.isRunning}
              role={role}       setRole={setRole}
              difficulty={difficulty} setDifficulty={setDifficulty}
              focusArea={focusArea}   setFocusArea={setFocusArea}
              onToggleInterview={toggleInterview}
            />
          </div>

          {/* Right: Avatar Arena */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center bg-[#18181b] border-2 border-zinc-800 border-b-[8px] rounded-[32px] p-8 md:p-12 min-h-[550px] shadow-2xl relative overflow-hidden">

            {/* Ambient Glow */}
            <div className={`absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none transition-colors duration-1000 ${selectedCoach.color.replace('border-', 'bg-')}`}>
              <div className="w-[500px] h-[500px] rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full">
              <div key={selectedCoach.id} className="animate-in fade-in zoom-in-95 duration-500">
                <Avatar ref={avatarRef} src={selectedCoach.file} state={avatarState} size="xl" />
              </div>
              <div className="mt-8">
                <StatusPill status={voice.state === "connecting" ? "thinking" : voice.state} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
