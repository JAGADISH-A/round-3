"use client";
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface RadarChartSectionProps {
  data: any[];
}

export default React.memo(function RadarChartSection({ data }: RadarChartSectionProps) {
  return (
    <div className="lg:col-span-8 liquid-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden min-h-[500px]">
      <div className="absolute top-10 left-10">
        <h3 className="text-3xl font-bebas tracking-wider uppercase mb-1 italic">Skill Performance <span className="text-primary">Radar</span></h3>
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Cross-Referenced Performance Metrics</p>
      </div>
      
      <div className="w-full h-full pt-12">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#ffffff08" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }} />
            <Radar isAnimationActive={false} name="Candidate" dataKey="A" stroke="#FFD600" fill="#FFD600" fillOpacity={0.15} strokeWidth={2} />
            <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '16px' }} itemStyle={{ color: '#FFD600' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
