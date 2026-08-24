// oshift/src/components/video/widgets/LollipopTimeline.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';
import type { KeyMoment } from '@/types/entities';

interface LollipopTimelineProps {
  durationSeconds?: number;
  keyMoments?: KeyMoment[];
  title?: string;
  subtitle?: string;
}

function formatSecs(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function LollipopTimeline({
  durationSeconds = 30,
  keyMoments = [],
  title = 'Timeline Beats',
  subtitle = 'Chronological narrative moments',
}: LollipopTimelineProps) {
  const maxDur = Math.max(durationSeconds, 1);
  const moments = [...keyMoments].sort((a, b) => a.timestamp_sec - b.timestamp_sec);

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between shadow-sm hover:border-white/20 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-primary)] font-bold">
          <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="uppercase tracking-wider">{title}</span>
        </div>
        <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
          {formatSecs(durationSeconds)} Duration
        </span>
      </div>

      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
        {subtitle}
      </p>

      {/* Needle / Lollipop Chart Canvas */}
      <div className="relative w-full h-32 my-3 flex items-end">
        {/* Dashed 80% Benchmark Line */}
        <div className="absolute top-1/3 left-0 right-0 border-b border-dashed border-white/20 z-0">
          <span className="absolute -top-4 left-0 text-[9px] font-mono text-[var(--text-secondary)]">
            Attention Goal 80%
          </span>
        </div>

        {/* Spikes / Lollipops Placed at Real Timestamps */}
        <div className="relative w-full h-full flex items-end justify-between z-10 px-2">
          {moments.length > 0 ? (
            moments.slice(0, 7).map((m, idx) => {
              const pct = Math.min(Math.max((m.timestamp_sec / maxDur) * 100, 4), 96);
              const isHighlight = idx === 0 || idx === moments.length - 1;
              const heightPercent = isHighlight ? 85 : 45 + ((idx * 20) % 40);

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center group cursor-pointer h-full justify-end"
                  style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    transform: 'translateX(-50%)',
                  }}
                  title={`${formatSecs(m.timestamp_sec)}: ${m.description}`}
                >
                  {/* Circular node on top */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.06, duration: 0.3 }}
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center -mb-1 z-20 ${
                      isHighlight
                        ? 'bg-rose-500 ring-4 ring-rose-500/20'
                        : 'bg-zinc-400 group-hover:bg-white'
                    } transition-all`}
                  >
                    {isHighlight && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </motion.div>

                  {/* Vertical needle spike */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    className={`w-[1.5px] ${
                      isHighlight
                        ? 'bg-rose-500'
                        : 'bg-[var(--border-color)] group-hover:bg-zinc-400'
                    } transition-colors`}
                  />

                  {/* Time label below */}
                  <span className="text-[9px] font-mono text-[var(--text-secondary)] mt-1.5 block group-hover:text-[var(--text-primary)]">
                    {formatSecs(m.timestamp_sec)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center text-xs text-[var(--text-secondary)] py-8">
              No timestamped key moments recorded.
            </div>
          )}
        </div>
      </div>

      {/* Bottom info snippet with real description */}
      <div className="pt-2 border-t border-[var(--border-color)] text-xs flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3 h-3 text-rose-400 shrink-0" />
          <span className="truncate max-w-[220px]">
            {moments[0]?.description || 'Instant hook start'}
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-400 shrink-0">
          {moments.length} beats
        </span>
      </div>
    </div>
  );
}
