// oshift/src/components/video/VideoScoreRadar.tsx
'use client';

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Sparkles } from 'lucide-react';
import type { FinalScores } from '@/types/entities';

interface VideoScoreRadarProps {
  scores?: FinalScores | null;
  className?: string;
}

export default function VideoScoreRadar({ scores, className = '' }: VideoScoreRadarProps) {
  if (!scores) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-sm text-[var(--text-secondary)] border border-[var(--border-color)] rounded-2xl bg-[var(--card-bg)]">
        No score breakdown available for this video.
      </div>
    );
  }

  const data = [
    { subject: 'Hook Power', score: scores.hook_score ?? 0, fullMark: 100 },
    { subject: 'Retention', score: scores.retention_score ?? 0, fullMark: 100 },
    { subject: 'Emotional', score: scores.emotional_intensity_score ?? 0, fullMark: 100 },
    { subject: 'Shareability', score: scores.shareability_score ?? 0, fullMark: 100 },
    { subject: 'Cultural Cues', score: scores.cultural_specificity_score ?? 0, fullMark: 100 },
    { subject: 'Cross-Market', score: scores.cross_market_potential_score ?? 0, fullMark: 100 },
    { subject: 'Viral Pattern', score: scores.overall_viral_pattern_similarity_score ?? 0, fullMark: 100 },
  ];

  const overallScore =
    scores.overall_viral_pattern_similarity_score ||
    Math.round(
      ((scores.hook_score ?? 0) +
        (scores.retention_score ?? 0) +
        (scores.shareability_score ?? 0) +
        (scores.emotional_intensity_score ?? 0)) /
        4
    );

  return (
    <div className={`flex flex-col gap-3 p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm hover:border-white/20 transition-all ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Multimodal Strategy Radar (7-Axis)
          </h4>
        </div>
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-base font-black text-[var(--text-primary)]">
            {overallScore}
          </span>
          <span className="text-[11px] text-[var(--text-secondary)]">/ 100 PTS</span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="w-full h-64 relative -my-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <PolarGrid stroke="var(--border-color)" strokeOpacity={0.6} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
              stroke="var(--border-color)"
              strokeOpacity={0.4}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
              formatter={(value) => [`${value}/100`, 'Score']}
            />
            <Radar
              name="Strategy Score"
              dataKey="score"
              stroke="#f97316"
              fill="#f97316"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick 7-Score Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--border-color)]">
        {data.slice(0, 4).map((item) => (
          <div
            key={item.subject}
            className="flex items-center justify-between p-2 rounded-xl bg-[var(--card-bg-alt)] border border-[var(--border-color)] text-xs"
          >
            <span className="text-[11px] text-[var(--text-secondary)] truncate">
              {item.subject}
            </span>
            <span className="font-bold text-[var(--text-primary)] font-mono ml-1">
              {item.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
