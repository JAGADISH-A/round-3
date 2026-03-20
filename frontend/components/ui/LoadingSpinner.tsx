"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-primary font-bebas tracking-widest animate-pulse">BumbleBee is thinking...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[100]">
        {content}
      </div>
    );
  }

  return content;
}
