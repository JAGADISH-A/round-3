"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/chat/Sidebar";
import { ConnectivityGuard } from "@/components/chat/ConnectivityGuard";
import ThirukuralPopup from "@/components/ui/ThirukuralPopup";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = translations[lang];

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020406]">
        <div className="relative">
          <div className="animate-spin rounded-none h-16 w-16 border-t-2 border-r-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.3)]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-cyan-500/20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#020406] overflow-hidden relative font-nav">
      <div className="scanline" />
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden relative transition-all duration-500 ease-in-out flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto relative custom-scrollbar">
          {children}
        </div>

        {/* Tactical Status Footer */}
        <footer className="h-10 border-t border-cyan-500/20 bg-black/40 flex items-center justify-between px-8 font-tech text-[10px] text-cyan-500/50 uppercase tracking-[0.2em] relative z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
              <span>Node ID: 0x4F2A</span>
            </div>
            <span>{t.common.uplink}: {t.common.stable}</span>
          </div>
          <div className="flex items-center gap-6">
            <span>{t.common.terminal}: B-OS_v2.6.1-CYAN</span>
            <div className="w-24 h-1 bg-cyan-500/10 relative overflow-hidden">
               <div className="absolute inset-0 bg-cyan-500/40 animate-[scan-move_2s_linear_infinite]" />
            </div>
          </div>
        </footer>
      </main>
      <ThirukuralPopup />
      <ConnectivityGuard />
    </div>
  );
}
