// oshift/src/components/video/widgets/SpeedometerGauge.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SpeedometerGaugeProps {
  score: number; // Real DB score 0 - 100
  title?: string;
  subtitle?: string;
  metrics?: { label: string; value: string | number }[];
  accentColor?: string;
}

export default function SpeedometerGauge({
  score = 75,
  title = 'Viral Performance',
  subtitle = 'Multimodal pattern match',
  metrics = [],
  accentColor = '#f97316',
}: SpeedometerGaugeProps) {
  const normalized = Math.min(Math.max(score, 0), 100);

  // Semicircle gauge parameters
  const radius = 70;
  const strokeWidth = 14;
  const cx = 100;
  const cy = 90;
  const arcLength = Math.PI * radius;
  const strokeDashoffset = arcLength - (arcLength * normalized) / 100;

  // Needle angle (-90deg to +90deg)
  const needleAngle = -90 + (normalized / 100) * 180;

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between shadow-sm hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            {title}
          </h4>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-secondary)]">
          {normalized >= 80
            ? 'High Viral Match'
            : normalized >= 60
            ? 'Strong Performer'
            : 'Baseline'}
        </span>
      </div>

      {/* Main Content: Left stats + Right Semicircular Gauge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center mt-2">
        {/* Left Metrics (Real Sub-Scores) */}
        <div className="flex flex-col gap-1.5 justify-center">
          {metrics.length > 0 ? (
            metrics.map((m, i) => (
              <div
                key={i}
                className="text-xs text-[var(--text-secondary)] flex items-center justify-between sm:justify-start gap-2.5"
              >
                <span className="font-bold text-[var(--text-primary)] font-mono">
                  {m.value}
                </span>
                <span className="truncate">{m.label}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Gauge */}
        <div className="relative flex flex-col items-center justify-center">
          <svg viewBox="0 0 200 115" className="w-full max-w-[180px] overflow-visible">
            <defs>
              <linearGradient id="speedoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor={accentColor} />
              </linearGradient>
            </defs>

            {/* Background Arc */}
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Filled Progress Arc */}
            <motion.path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="url(#speedoGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={arcLength}
              initial={{ strokeDashoffset: arcLength }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />

            {/* Needle Pivot & Line */}
            <g transform={`translate(${cx}, ${cy}) rotate(${needleAngle})`}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={-radius + 8}
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="0" cy="0" r="5" fill="white" />
              <circle cx="0" cy="0" r="2.5" fill={accentColor} />
            </g>
          </svg>

          {/* Center Score readout */}
          <div className="text-center -mt-3">
            <span className="text-2xl font-black text-[var(--text-primary)] font-mono">
              {normalized}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] ml-1 font-bold">
              / 100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
