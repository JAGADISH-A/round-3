"use client";

import React from "react";
import { motion } from "framer-motion";

interface NeuralOscillatorProps {
  isSpeaking: boolean;
  color?: string;
}

export function NeuralOscillator({ isSpeaking, color = "rgba(0, 255, 255, 0.6)" }: NeuralOscillatorProps) {
  const bars = Array.from({ length: 32 });

  return (
    <div className="flex items-center justify-center gap-[2px] h-12 w-full px-4 overflow-hidden mask-fade-edges">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: isSpeaking 
              ? [8, Math.random() * 40 + 10, 8] 
              : 4,
            opacity: isSpeaking ? [0.4, 1, 0.4] : 0.2
          }}
          transition={{
            duration: isSpeaking ? 0.6 + Math.random() * 0.4 : 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.02
          }}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
