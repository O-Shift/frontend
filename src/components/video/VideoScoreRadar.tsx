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
import type { FinalScores } from '@/types/entities';

interface VideoScoreRadarProps {
  scores?: FinalScores | null;
  className?: string;
}

export default function VideoScoreRadar({ scores, className = '' }: VideoScoreRadarProps) {
  if (!scores) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-sm text-[var(--text-secondary)] border border-[var(--border-color)] rounded-md bg-[var(--card-bg)]">
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Emerald
    if (score >= 60) return '#FF5A00'; // Accent Orange
    if (score >= 40) return '#F59E0B'; // Amber
    return '#EF4444'; // Rose
  };

  return (
    <div className={`flex flex-col gap-4 p-5 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)]  ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Viral Performance Scorecard
          </div>
          <div className="text-lg font-bold text-[var(--text-primary)]">
            Multimodal Strategy Radar
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1">
            <span
              className="text-2xl font-black"
              style={{ color: getScoreColor(overallScore) }}
            >
              {overallScore}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">/ 100</span>
          </div>
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            {overallScore >= 80 ? ' High Viral Potential' : overallScore >= 60 ? ' Strong Performer' : ' Baseline Engagement'}
          </span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="w-full h-64 relative -my-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <PolarGrid stroke="var(--border-color)" strokeOpacity={0.6} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
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
                backgroundColor: 'var(--dropdown-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
              formatter={(value: any) => [`${value}/100`, 'Score']}
            />
            <Radar
              name="Viral Score"
              dataKey="score"
              stroke="#FF5A00"
              fill="#FF5A00"
              fillOpacity={0.35}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Grid Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[var(--border-color)]">
        {data.map((item) => (
          <div
            key={item.subject}
            className="flex flex-col p-2 rounded-lg bg-[var(--item-hover)] border border-[var(--border-color)]"
          >
            <span className="text-[11px] text-[var(--text-secondary)] truncate">
              {item.subject}
            </span>
            <div className="flex items-center justify-between mt-1">
              <div className="w-full bg-[var(--pill-bg)] h-1.5 rounded-md overflow-hidden mr-2">
                <div
                  className="h-full rounded-md transition-all duration-500"
                  style={{
                    width: `${item.score}%`,
                    backgroundColor: getScoreColor(item.score),
                  }}
                />
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)] shrink-0">
                {item.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
