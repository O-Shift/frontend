// oshift/src/components/video/widgets/CircularDial.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface CircularDialProps {
  score?: number; // Real DB score 0 - 100
  title?: string;
  topRightValue?: string;
  centerLabel?: string;
  leftMetrics?: { value: string; label: string }[];
  dialColor?: string;
  hookCategory?: string;
}

export default function CircularDial({
  score = 80,
  title = 'Hook Velocity',
  topRightValue = '8.0 ★',
  centerLabel = '@ 8.0',
  leftMetrics = [],
  dialColor = '#f43f5e',
  hookCategory = 'Curiosity Gap',
}: CircularDialProps) {
  const normalized = Math.min(Math.max(score, 0), 100);
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // 240 degree sweep arc
  const arcLength = (240 / 360) * circumference;
  const strokeDashoffset = arcLength - (arcLength * normalized) / 100;

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between shadow-sm hover:border-white/20 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-primary)] font-bold">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="uppercase tracking-wider">{title}</span>
        </div>
        <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
          {topRightValue}
        </span>
      </div>

      {/* Center content: Left stats + Right Dial */}
      <div className="grid grid-cols-2 gap-2 items-center my-3">
        {/* Left Stats (Real Data) */}
        <div className="flex flex-col gap-2">
          {leftMetrics.map((m, i) => (
            <div key={i}>
              <span className="text-sm sm:text-base font-black text-[var(--text-primary)] font-mono block truncate">
                {m.value}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] block truncate">
                {m.label}
              </span>
            </div>
          ))}
        </div>

        {/* Right Circular Dial */}
        <div className="relative flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="rotate-[150deg] overflow-visible"
          >
            {/* Background Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />

            {/* Filled Progress Arc */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={dialColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              initial={{ strokeDashoffset: arcLength }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </svg>

          {/* Center Label in dial */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-black text-[var(--text-primary)] font-mono">
              {centerLabel}
            </span>
            <span className="text-[9px] text-[var(--text-secondary)]">
              Score
            </span>
          </div>
        </div>
      </div>

      {/* Footer (Real Hook Classification) */}
      <div className="pt-2 border-t border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
        <span className="truncate max-w-[140px]">{hookCategory}</span>
        <span className="text-emerald-400 font-semibold font-mono">
          {normalized >= 80 ? 'Top Tier' : normalized >= 60 ? 'Strong' : 'Baseline'}
        </span>
      </div>
    </div>
  );
}
