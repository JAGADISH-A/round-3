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
  Globe
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
    { icon: BookOpen, label: t.sidebar.study_hub || "Study Hub", href: "/study", placeholder: true },
    { icon: Map, label: t.sidebar.roadmap, href: "/roadmap", placeholder: true },
  ];

  return (
    <>
      <aside 
        className={cn(
          "h-screen bg-zinc-950 border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out relative z-20 shadow-2xl",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg shadow-primary/20"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Header / Logo */}
        <div className="p-6 flex items-center gap-3 overflow-hidden">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/logo.png" alt="BumbleBee Logo" fill className="object-contain" />
          </div>
          {!isCollapsed && (
            <span className="text-2xl font-bebas tracking-[0.2em] text-primary whitespace-nowrap italic">
              BumbleBee <span className="text-white">AI</span>
            </span>
          )}
        </div>

        {/* Language Toggle UI */}
        {!isCollapsed && (
          <div className="px-6 mb-6">
            <div className="bg-black/50 p-1 rounded-xl border border-white/5 flex items-center justify-between">
              <button 
                onClick={() => setLang("en")}
                className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", lang === "en" ? "bg-primary text-black" : "text-zinc-500 hover:text-white")}
              >
                EN
              </button>
              <button 
                onClick={() => setLang("ta")}
                className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", lang === "ta" ? "bg-primary text-black" : "text-zinc-500 hover:text-white")}
              >
                தமிழ்
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 py-4 custom-scrollbar overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.placeholder ? "#" : item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative border",
                  isActive 
                    ? "bg-primary/15 text-primary border-primary/40 shadow-[0_0_15px_rgba(255,214,0,0.1)]" 
                    : "text-zinc-500 hover:text-white hover:bg-white/5 border-transparent",
                  isCollapsed && "justify-center px-0",
                  item.placeholder && "opacity-50 cursor-not-allowed"
                )}
              >
                <item.icon size={18} className={cn("flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3", isActive ? "text-primary" : "text-primary")} />
                {!isCollapsed && (
                  <span className="font-bold text-sm tracking-wide">{item.label}</span>
                )}
                {item.placeholder && !isCollapsed && (
                  <span className="absolute right-4 text-[8px] font-black bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-tighter">Soon</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Hub */}
        <div className="mt-auto p-4 border-t border-white/5 space-y-2">
          {!isCollapsed && user && (
            <div className="px-4 py-3 mb-2 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-3 animate-in slide-in-from-left-4 duration-500">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                {user.photoURL ? (
                  <Image src={user.photoURL} alt={user.displayName || "User"} width={40} height={40} />
                ) : (
                  <UserIcon size={20} className="text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user.displayName || "Bee User"}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          
          <Link 
            href="/profile"
            title={isCollapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all transform hover:scale-[1.02] active:scale-95",
              isCollapsed && "justify-center px-0"
            )}
          >
            <UserIcon size={18} className="text-primary" />
            {!isCollapsed && <span className="font-bold text-sm">{t.sidebar.settings}</span>}
          </Link>
          <button 
            onClick={() => setIsLogoutOpen(true)}
            title={isCollapsed ? "Logout" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all transform hover:scale-[1.02] active:scale-95",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut size={16} />
            {!isCollapsed && <span className="font-bold text-xs text-left">{t.sidebar.logout}</span>}
          </button>
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
