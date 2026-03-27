"use client";

import React from 'react';
import { 
  Radar, 
  RadarChart as ReChartsRadar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { useResumeStore } from '@/store/useResumeStore';

export default function RadarChart() {
  const { analysis, score, readiness } = useResumeStore();

  const data = [
    { subject: 'Skills', A: analysis?.ats_breakdown?.keyword_density ?? 0, fullMark: 100 },
    { subject: 'ATS Score', A: score || 0, fullMark: 100 },
    { subject: 'Projects', A: Math.min((analysis?.projects?.length || 0) * 20, 100), fullMark: 100 },
    { subject: 'Impact', A: analysis?.ats_breakdown?.impact_verbs ?? 0, fullMark: 100 },
    { subject: 'Readiness', A: readiness || 0, fullMark: 100 },
  ];

  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <ReChartsRadar cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#ffffff10" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            axisLine={false} 
            tick={false} 
          />
          <Radar
            name="Performance"
            dataKey="A"
            stroke="#EAB308"
            fill="#EAB308"
            fillOpacity={0.3}
          />
        </ReChartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
