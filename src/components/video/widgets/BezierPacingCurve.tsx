// oshift/src/components/video/widgets/BezierPacingCurve.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, TrendingUp } from 'lucide-react';

interface BezierPacingCurveProps {
  score?: number; // Real DB retention_score (0-100)
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  curveColor?: string;
  dataPoints?: number[];
}

export default function BezierPacingCurve({
  score = 75,
  title = 'Visual Pacing',
  subtitle = 'Attention retention velocity across timeline',
  statusLabel,
  curveColor = '#f43f5e',
  dataPoints = [35, 60, 50, 75, 95, 80, 65, 75, 88, 80],
}: BezierPacingCurveProps) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const width = 240;
  const height = 70;
  const padding = 6;

  const minVal = Math.min(...dataPoints);
  const maxVal = Math.max(...dataPoints);
  const range = maxVal - minVal || 1;

  // Generate SVG bezier path from points
  const points = dataPoints.map((val, idx) => {
    const x = padding + (idx / Math.max(dataPoints.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
    return { x, y };
  });

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  const fillPath = `${d} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const isOptimal = normalizedScore >= 70;
  const label =
    statusLabel ||
    (normalizedScore >= 80
      ? 'Optimal Flow'
      : normalizedScore >= 60
      ? 'Standard Pacing'
      : 'Pacing Risk');

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between shadow-sm hover:border-white/20 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            {title}
          </span>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-secondary)]">
          {normalizedScore}/100 Retention
        </span>
      </div>

      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug line-clamp-1">
        {subtitle}
      </p>

      {/* Center: Big Metric + Smooth Bezier Line */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-2">
        <div>
          <span className="text-4xl font-black text-[var(--text-primary)] font-mono">
            {normalizedScore}
          </span>
          <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
            Retention Score
          </span>
        </div>

        {/* SVG Sparkline */}
        <div className="relative w-full h-[70px] overflow-visible">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="pacingArea" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={curveColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={curveColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Area */}
            <path d={fillPath} fill="url(#pacingArea)" />

            {/* Bezier Line */}
            <motion.path
              d={d}
              fill="none"
              stroke={curveColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />

            {/* Peak node */}
            {points.length > 3 && (
              <circle
                cx={points[Math.floor(points.length / 2)].x}
                cy={points[Math.floor(points.length / 2)].y}
                r={4}
                fill={curveColor}
                stroke="white"
                strokeWidth={1.5}
              />
            )}
          </svg>
        </div>
      </div>

      {/* Bottom Status Chip */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs">
        <span className="text-[11px] text-[var(--text-secondary)]">
          Pacing Quality
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
            isOptimal
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          {isOptimal ? (
            <Check className="w-3 h-3" />
          ) : (
            <AlertTriangle className="w-3 h-3" />
          )}
          <span>{label}</span>
        </span>
      </div>
    </div>
  );
}
