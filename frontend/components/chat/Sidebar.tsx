"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  Map, 
  User,
  Mic2,
  MessageSquare,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  Power,
  Camera,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "AI Coach", icon: MessageSquare, href: "/chat" },
  { label: "Intelligence", icon: LayoutDashboard, href: "/intelligence" },
  { label: "Roadmap", icon: Map, href: "/roadmap" },
  { label: "Resume Builder", icon: FileText, href: "/resume" },
  { label: "Voice Practice", icon: Mic2, href: "/voice" },
  { label: "Face Analysis", icon: Camera, href: "/face-analysis" },
  { label: "Profile", icon: User, href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-[#050505] border-r border-white/5 flex flex-col py-6 shrink-0 z-50 transition-all duration-300",
        expanded ? "w-[200px] items-start" : "w-[72px] items-center"
      )}
    >
      {/* Logo + expand toggle */}
      <div className={cn("mb-10 flex items-center", expanded ? "px-4 w-full justify-between" : "justify-center")}>
        <Link href="/" className="group relative flex items-center gap-3">
          <div className="w-9 h-9 bg-[#00E6A8] rounded-xl flex items-center justify-center font-black text-black text-xs shadow-[0_0_20px_rgba(0,230,168,0.3)] transition-transform group-hover:scale-110 shrink-0">
            CS
          </div>
          {expanded && (
            <span className="text-white font-black text-sm uppercase tracking-widest whitespace-nowrap">
              CareerSpark
            </span>
          )}
        </Link>

        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "w-7 h-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all",
            !expanded && "mt-0"
          )}
          title={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className={cn("flex-1 flex flex-col gap-1 w-full", expanded ? "px-3" : "items-center px-0")}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative w-full",
                isActive
                  ? "bg-[#00E6A8]/10 text-[#00E6A8]"
                  : "text-zinc-500 hover:text-white hover:bg-white/5",
                !expanded && "justify-center"
              )}
            >
              {/* Active bar */}
              {isActive && (
                <div className="absolute -left-[3px] top-1/4 bottom-1/4 w-[3px] bg-[#00E6A8] rounded-r-full shadow-[0_0_10px_#00E6A8]" />
              )}

              <item.icon className={cn(
                "w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110",
                isActive ? "text-[#00E6A8]" : "text-zinc-500 group-hover:text-white"
              )} />

              {/* Label – shown when expanded */}
              {expanded && (
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-wider whitespace-nowrap",
                  isActive ? "text-[#00E6A8]" : "text-zinc-500 group-hover:text-white"
                )}>
                  {item.label}
                </span>
              )}

              {/* Tooltip – shown when collapsed */}
              {!expanded && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-900 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User identity footer */}
      <div className={cn("mt-auto w-full", expanded ? "px-3" : "flex justify-center")}>
        <div className={cn(
          "group relative flex items-center gap-3 cursor-pointer",
          expanded ? "px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all w-full" : "p-2"
        )}>
          <div className="w-8 h-8 rounded-full border-2 border-[#00E6A8]/30 group-hover:border-[#00E6A8] transition-colors shrink-0 flex items-center justify-center bg-zinc-900 text-[9px] font-black text-[#00E6A8]">
            JS
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-white">Jagan S.</p>
              <p className="text-[9px] text-[#00E6A8] uppercase tracking-wider">Identity Active</p>
            </div>
          )}
          {expanded && (
            <Power className="w-3.5 h-3.5 text-red-500/60 hover:text-red-400 transition-colors shrink-0" />
          )}

          {/* Tooltip when collapsed */}
          {!expanded && (
            <div className="absolute left-full ml-4 px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 min-w-[160px] shadow-xl">
              <p className="text-[10px] font-black text-white">Identity Active</p>
              <p className="text-[9px] text-zinc-500 mb-2">Jagan S.</p>
              <div className="h-[1px] bg-white/5 my-1.5" />
              <p className="text-[9px] text-red-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                <Power className="w-2.5 h-2.5" /> Terminate Session
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
