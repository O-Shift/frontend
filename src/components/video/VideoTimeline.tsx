// oshift/src/components/video/VideoTimeline.tsx
'use client';

import React from 'react';
import { Clock, Film, Sparkles, AlertCircle } from 'lucide-react';
import type { KeyMoment } from '@/types/entities';

interface VideoTimelineProps {
  durationSeconds?: number;
  keyMoments?: KeyMoment[];
  emotionalPeaks?: string[];
  retentionRisks?: string[];
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoTimeline({
  durationSeconds = 0,
  keyMoments = [],
  emotionalPeaks = [],
  retentionRisks = [],
  className = '',
}: VideoTimelineProps) {
  const sortedMoments = [...keyMoments].sort((a, b) => a.timestamp_sec - b.timestamp_sec);

  return (
    <div className={`flex flex-col gap-4 p-5 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-[var(--accent)]" />
          <h4 className="text-sm font-bold text-[var(--text-primary)]">
            Chronological Moments & Pacing Timeline
          </h4>
        </div>
        {durationSeconds > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--pill-bg)] text-xs text-[var(--text-secondary)] font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(durationSeconds)} Total Runtime</span>
          </div>
        )}
      </div>

      {/* Visual Timeline Track */}
      {durationSeconds > 0 && (
        <div className="relative w-full h-8 flex items-center px-3 my-1 rounded-lg bg-[var(--item-hover)] border border-[var(--border-color)]">
          {/* Progress Bar background */}
          <div className="absolute left-3 right-3 h-1.5 bg-[var(--border-color)] rounded-md overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--accent)] via-amber-500 to-emerald-500 rounded-md w-full opacity-60" />
          </div>

          {/* Moment Nodes on Bar */}
          {sortedMoments.map((km, idx) => {
            const pct = Math.min(Math.max((km.timestamp_sec / Math.max(durationSeconds, 1)) * 100, 2), 98);
            return (
              <div
                key={idx}
                className="absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                style={{ left: `${pct}%` }}
                title={`${formatTime(km.timestamp_sec)}: ${km.description}`}
              >
                <div className="w-3.5 h-3.5 rounded-md bg-[var(--card-bg)] border-2 border-[var(--accent)] group-hover:scale-125 transition-transform" />
                <div className="absolute -bottom-5 text-[10px] font-mono text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] whitespace-nowrap">
                  {formatTime(km.timestamp_sec)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timestamped Moment Cards */}
      <div className="flex flex-col gap-2.5 mt-2">
        {sortedMoments.length === 0 ? (
          <div className="text-xs text-[var(--text-secondary)] text-center py-4">
            No timestamped key moments detected in this video analysis.
          </div>
        ) : (
          sortedMoments.map((moment, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] hover:border-[var(--accent)] transition-colors"
            >
              <span className="shrink-0 px-2 py-0.5 rounded font-mono text-xs font-bold text-[var(--accent)] bg-[var(--pill-bg)] border border-[var(--border-color)]">
                {formatTime(moment.timestamp_sec)}
              </span>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed flex-1">
                {moment.description}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Emotional Peaks & Retention Risks Highlights */}
      {(emotionalPeaks.length > 0 || retentionRisks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[var(--border-color)]">
          {emotionalPeaks.length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Emotional Peaks</span>
              </div>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                {emotionalPeaks.map((peak, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500">•</span>
                    <span>{peak}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {retentionRisks.length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Retention Drop-off Risks</span>
              </div>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                {retentionRisks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-500">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
