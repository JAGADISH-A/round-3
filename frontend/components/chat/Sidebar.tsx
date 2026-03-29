"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  MessageSquare, 
  FileText, 
  Video, 
  BookOpen, 
  Map, 
  User as UserIcon, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Globe,
  Mic
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import LogoutModal from "@/components/auth/LogoutModal";
import { useMemo } from "react";


export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { lang, setLang } = useLanguage();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const t = useMemo(() => translations[lang], [lang]);

  const menuItems = [
    { icon: MessageSquare, label: t.sidebar.chat, href: "/chat" },
    { icon: FileText, label: t.sidebar.resume_analyzer || "Resume Analyzer", href: "/resume" },
    { icon: Video, label: t.sidebar.voice, href: "/voice" },
    { icon: Mic, label: t.sidebar.interview || "Interview", href: "/interview" },
    { icon: BookOpen, label: t.sidebar.study_hub || "Study Hub", href: "/study", placeholder: true },
    { icon: Map, label: t.sidebar.roadmap, href: "/roadmap", placeholder: true },
  ];

  return (
    <>
      <aside 
        className={cn(
          "h-screen bg-black/80 border-r border-cyan-500/20 flex flex-col transition-all duration-500 ease-in-out relative z-20 shadow-[0_0_30px_rgba(0,255,255,0.1)]",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />

        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-12 w-8 h-8 bg-black border border-cyan-500/50 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_10px_rgba(0,255,255,0.2)] z-30"
          style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 20%)' }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Header / Logo */}
        <div className="p-8 flex items-center gap-4 overflow-hidden">
          <div className="relative w-10 h-10 flex-shrink-0 border border-cyan-500/30 p-1">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-500" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-cyan-500" />
            <Image src="/logo.png" alt="BumbleBee Logo" fill className="object-contain opacity-80" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-orbitron tracking-[0.3em] text-cyan-400 whitespace-nowrap">
              HIVE <span className="text-white opacity-50">OS</span>
            </span>
          )}
        </div>

        {/* Language Toggle UI */}
        {!isCollapsed && (
          <div className="px-8 mb-8">
            <div className="bg-cyan-500/5 p-1 border border-cyan-500/20 flex items-center justify-between" style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}>
              <button 
                onClick={() => setLang("en")}
                className={cn("px-4 py-1 text-[10px] font-orbitron transition-all", lang === "en" ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,255,255,0.4)]" : "text-cyan-500/50 hover:text-cyan-400")}
              >
                ENG
              </button>
              <button 
                onClick={() => setLang("ta")}
                className={cn("px-4 py-1 text-[10px] font-orbitron transition-all", lang === "ta" ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,255,255,0.4)]" : "text-cyan-500/50 hover:text-cyan-400")}
              >
                தமிழ்
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-6 space-y-3 py-4 custom-scrollbar overflow-y-auto font-nav">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.placeholder ? "#" : item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 transition-all group relative border-l-2",
                  isActive 
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.1)]" 
                    : "text-cyan-500/40 border-transparent hover:text-cyan-300 hover:bg-cyan-500/5 hover:border-cyan-500/30",
                  isCollapsed && "justify-center px-0 border-l-0",
                  item.placeholder && "opacity-30 cursor-not-allowed"
                )}
              >
                <div className={cn("absolute inset-0 bg-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100")} 
                     style={{ clipPath: 'polygon(0 0, 95% 0, 100% 20%, 100% 100%, 5% 100%, 0 80%)' }} />
                
                <item.icon size={20} className={cn("flex-shrink-0 transition-all duration-500", isActive ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" : "group-hover:text-cyan-400")} />
                
                {!isCollapsed && (
                  <span className="font-medium text-sm tracking-[0.1em] uppercase">{item.label}</span>
                )}
                
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1 h-1 bg-cyan-500 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Hub */}
        <div className="mt-auto p-6 space-y-4">
          {!isCollapsed && user && (
            <div className="p-4 bg-cyan-500/5 border-t border-b border-cyan-500/20 relative group overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50" />
               <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 border border-cyan-500/30 p-0.5 relative">
                  <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt={user.displayName || "User"} width={40} height={40} className="relative z-10 opacity-80" />
                  ) : (
                    <UserIcon size={20} className="text-cyan-400 relative z-10 mx-auto mt-2" />
                  )}
                </div>
                <div className="min-w-0 flex-1 font-tech">
                  <p className="text-[10px] uppercase tracking-tighter text-cyan-500/70">Agent Active</p>
                  <p className="text-xs font-bold text-cyan-400 truncate tracking-widest">{user.displayName || "BEE-USER"}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-1">
            <Link 
              href="/profile"
              className={cn(
                "flex items-center gap-4 px-4 py-2 text-cyan-500/60 hover:text-cyan-400 transition-colors font-nav uppercase tracking-widest text-xs",
                isCollapsed && "justify-center px-0"
              )}
            >
              <UserIcon size={16} />
              {!isCollapsed && <span>{t.sidebar.settings}</span>}
            </Link>
            <button 
              onClick={() => setIsLogoutOpen(true)}
              className={cn(
                "flex items-center gap-4 px-4 py-2 text-red-500/60 hover:text-red-400 transition-colors font-nav uppercase tracking-widest text-xs",
                isCollapsed && "justify-center px-0"
              )}
            >
              <LogOut size={16} />
              {!isCollapsed && <span>{t.sidebar.logout}</span>}
            </button>
          </div>
        </div>
      </aside>

      <LogoutModal 
        isOpen={isLogoutOpen} 
        onClose={() => setIsLogoutOpen(false)} 
        onConfirm={logout} 
      />
    </>
  );
}
