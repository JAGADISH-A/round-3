"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function FontWrapper({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  return (
    <div className={lang === "ta" ? "font-tamil" : "font-sans"}>
      {children}
    </div>
  );
}
