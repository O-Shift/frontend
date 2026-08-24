// oshift/src/components/video/widgets/SegmentedBarMeter.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

export interface CategoryMetric {
  name: string;
  score: number; // 0 - 100 (Real DB score)
  benchmarkLabel: string;
  countLabel: string;
  description?: string;
  color?: string;
}

interface SegmentedBarMeterProps {
  categories: CategoryMetric[];
  title?: string;
}

export default function SegmentedBarMeter({
  categories = [],
  title = 'Score Dimensions',
}: SegmentedBarMeterProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (categories.length === 0) return null;

  const current = categories[activeIdx % categories.length];
  const scoreVal = Math.min(Math.max(current.score, 0), 100);
  const totalBars = 28;
  const filledBars = Math.round((scoreVal / 100) * totalBars);
  const barColor = current.color || '#f97316';

  const handlePrev = () => {
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : categories.length - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev < categories.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between shadow-sm hover:border-white/20 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--text-primary)]">{title}</span>
          <Info className="w-3.5 h-3.5 opacity-60" />
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--pill-bg)] text-[var(--text-secondary)] border border-[var(--border-color)]">
          Dimension {activeIdx + 1}/{categories.length}
        </span>
      </div>

      {/* Main Metric & Real Benchmark Classification */}
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-3xl font-black text-[var(--text-primary)] font-mono">
          {scoreVal}
        </span>
        <span className="text-xs font-mono text-[var(--text-secondary)]">/ 100</span>
        <span
          className={`text-xs font-semibold ml-1 ${
            scoreVal >= 80
              ? 'text-emerald-400'
              : scoreVal >= 60
              ? 'text-amber-400'
              : 'text-zinc-400'
          }`}
        >
          {current.benchmarkLabel}
        </span>
      </div>

      {/* Segmented Vertical Bar Meter (Fills based on exact score) */}
      <div className="my-3 flex items-center justify-between gap-1 w-full h-8">
        {Array.from({ length: totalBars }).map((_, idx) => {
          const isFilled = idx < filledBars;
          return (
            <motion.div
              key={`${activeIdx}-${idx}`}
              initial={{ scaleY: 0.3, opacity: 0.5 }}
              animate={{
                scaleY: 1,
                opacity: 1,
              }}
              transition={{ duration: 0.25, delay: idx * 0.008 }}
              className="flex-1 h-full rounded-full transition-colors duration-300"
              style={{
                backgroundColor: isFilled ? barColor : 'var(--pill-bg)',
              }}
            />
          );
        })}
      </div>

      {/* Bottom Category Selector & Details */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)] text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[var(--text-primary)] truncate max-w-[140px]">
            {current.name}
          </span>
          <div className="flex items-center gap-0.5 border border-[var(--border-color)] rounded-lg bg-[var(--card-bg-alt)] p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded hover:bg-[var(--item-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded hover:bg-[var(--item-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 font-mono">
          <span>{current.countLabel}</span>
        </div>
      </div>
    </div>
  );
}
