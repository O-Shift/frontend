// oshift/src/components/video/widgets/DonutSegments.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

export interface DonutItem {
  label: string;
  value: number; // Real score points (e.g. 85)
  percentage: number; // Real calculated percentage proportion
  color: string;
}

interface DonutSegmentsProps {
  title?: string;
  subtitle?: string;
  items: DonutItem[];
}

export default function DonutSegments({
  title = 'Strategy Pillar Breakdown',
  subtitle = '4 Core Pillars',
  items = [],
}: DonutSegmentsProps) {
  if (items.length === 0) return null;

  const size = 110;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between shadow-sm hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--text-primary)]">{title}</span>
          <Info className="w-3.5 h-3.5 opacity-60" />
        </div>
        <span className="text-xs font-mono text-[var(--text-secondary)]">
          {subtitle}
        </span>
      </div>

      {/* Donut Chart + Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* SVG Donut */}
        <div className="flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth={strokeWidth}
            />

            {/* Segment arcs */}
            {items.map((item, idx) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.percentage;

              return (
                <motion.circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray }}
                  transition={{ duration: 0.8, delay: idx * 0.12, ease: 'easeOut' }}
                />
              );
            })}
          </svg>
        </div>

        {/* Legend Table */}
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[var(--text-secondary)] truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 font-mono">
                <span className="font-bold text-[var(--text-primary)]">
                  {item.value}
                </span>
                <span className="text-[var(--text-secondary)] text-[11px] w-8 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
