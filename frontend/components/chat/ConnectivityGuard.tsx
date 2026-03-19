"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { ENDPOINTS } from "@/lib/api-config";
import { cn } from "@/lib/utils";

export function ConnectivityGuard() {
  const [intelligenceStatus, setIntelligenceStatus] = useState<"checking" | "online" | "offline">("checking");
  const [visionStatus, setVisionStatus] = useState<"checking" | "online" | "offline">("checking");

  const checkConnectivity = async () => {
    setIntelligenceStatus("checking");
    setVisionStatus("checking");

    // Check Intelligence Service
    try {
      const res = await fetch(ENDPOINTS.HEALTH, { cache: "no-store" });
      if (res.ok) setIntelligenceStatus("online");
      else setIntelligenceStatus("offline");
    } catch {
      setIntelligenceStatus("offline");
    }

    // Check Vision Service
    try {
      const res = await fetch(ENDPOINTS.VISION_HEALTH, { cache: "no-store" });
      if (res.ok) setVisionStatus("online");
      else setVisionStatus("offline");
    } catch {
      setVisionStatus("offline");
    }
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  if (intelligenceStatus === "online" && visionStatus === "online") return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 animate-in slide-in-from-right-10 duration-500">
      {intelligenceStatus !== "online" && (
        <StatusCard 
          title="AI Intelligence Offline"
          message="Core brain unreachable on port 8001"
          onRetry={checkConnectivity}
          status={intelligenceStatus}
        />
      )}
      {visionStatus !== "online" && (
        <StatusCard 
          title="Vision Service Offline"
          message="Facial Analysis unavailable on port 8002"
          onRetry={checkConnectivity}
          status={visionStatus}
        />
      )}
    </div>
  );
}

function StatusCard({ title, message, onRetry, status }: any) {
  return (
    <div className="w-[320px] bg-black/80 backdrop-blur-2xl border border-red-500/20 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-black uppercase tracking-widest text-red-500 mb-1">{title}</h4>
          <p className="text-[10px] text-white/50 leading-relaxed font-medium">{message}</p>
        </div>
      </div>
      
      <div className="flex gap-2 h-9">
        <button 
          onClick={onRetry}
          disabled={status === "checking"}
          className="flex-1 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {status === "checking" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Check Connectivity
        </button>
      </div>
    </div>
  );
}
