"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic {
  name: string;
  completed: boolean;
}

interface RoadmapNodeProps {
  topic: Topic;
  index: number;
}

export function RoadmapNode({ topic, index }: RoadmapNodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500",
        topic.completed 
          ? "bg-[#00E6A8]/5 border-[#00E6A8]/30 shadow-[0_0_20px_rgba(0,230,168,0.05)]" 
          : "bg-zinc-900/50 border-white/5 hover:border-white/10"
      )}
    >
      <div className="relative shrink-0">
        {topic.completed ? (
          <CheckCircle2 className="w-5 h-5 text-[#00E6A8]" />
        ) : (
          <Circle className="w-5 h-5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
        )}
        
        {/* Glow effect for uncompleted skills that are "next" (simplified check) */}
        {!topic.completed && index === 0 && (
          <div className="absolute inset-0 bg-[#00E6A8]/20 blur-md rounded-full animate-pulse" />
        )}
      </div>

      <div className="flex flex-col">
        <span className={cn(
          "text-xs font-bold uppercase tracking-tight",
          topic.completed ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
        )}>
          {topic.name}
        </span>
      </div>

      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Zap className="w-3 h-3 text-[#00E6A8]/40" />
      </div>
    </motion.div>
  );
}
