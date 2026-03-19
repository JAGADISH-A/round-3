"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoadmapNode } from "./RoadmapNode";

interface RoadmapStage {
  phase: string;
  skills: { name: string; completed: boolean }[];
}

interface RoadmapTimelineProps {
  stages: RoadmapStage[];
}

export function RoadmapTimeline({ stages }: RoadmapTimelineProps) {
  return (
    <div className="relative mt-12 pb-24">
      {/* Central Connector Line */}
      <div className="absolute left-[21px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#00E6A8]/40 via-white/5 to-transparent -translate-x-1/2" />

      <div className="space-y-32 relative">
        {stages.map((stage, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className={cn(
                "flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full",
                isEven ? "md:flex-row" : "md:flex-row-reverse"
              )}
            >
              {/* Content Card */}
              <div className={cn("flex-1 w-full md:w-auto", isEven ? "md:text-right" : "md:text-left")}>
                <div className={cn(
                  "liquid-glass p-8 rounded-[48px] border border-white/5 space-y-8 relative overflow-hidden group hover:border-[#00E6A8]/20 transition-all duration-700",
                  isEven ? "md:ml-auto" : "md:mr-auto"
                )}>
                  {/* Decorative number */}
                  <div className={cn(
                    "flex items-center gap-4",
                    isEven ? "md:flex-row-reverse" : "md:flex-row"
                  )}>
                    <span className="text-5xl font-bebas text-[#00E6A8]/10 group-hover:text-[#00E6A8]/20 transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-2xl font-bebas tracking-tight uppercase text-white group-hover:text-[#00E6A8] transition-colors">
                      {stage.phase}
                    </h3>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stage.skills.map((skill, sIdx) => (
                      <RoadmapNode key={sIdx} topic={skill} index={sIdx} />
                    ))}
                  </div>
                  
                  {/* Subtle hover background glow */}
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#00E6A8]/5 blur-[100px] rounded-full group-hover:bg-[#00E6A8]/10 transition-all duration-1000" />
                </div>
              </div>

              {/* Center Marker */}
              <div className="relative z-10 shrink-0">
                <div className="w-12 h-12 rounded-full bg-zinc-950 border-4 border-[#050505] shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center relative group">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-[#00E6A8]/10 border border-[#00E6A8]/20" 
                  />
                  <Flag className="w-5 h-5 text-[#00E6A8] relative z-10" />
                </div>
              </div>

              {/* Empty Space for alignment */}
              <div className="flex-1 hidden md:block" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
