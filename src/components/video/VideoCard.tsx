// oshift/src/components/video/VideoCard.tsx
'use client';

import React from 'react';
import {
  Film,
  ExternalLink,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Globe,
  User,
  Zap,
  Play,
  Share2,
} from 'lucide-react';
import type { VideoAsset } from '@/types/entities';

interface VideoCardProps {
  asset: VideoAsset;
  onSelect: (asset: VideoAsset) => void;
}

function getPlatformStyle(platform?: string | null) {
  const p = (platform || '').toLowerCase();
  if (p.includes('tiktok')) {
    return {
      label: 'TikTok',
      color: '#00f2fe',
      gradient: 'from-[#00f2fe]/20 via-[#fe0979]/10 to-transparent',
      bg: 'rgba(0, 242, 254, 0.12)',
      border: 'rgba(0, 242, 254, 0.3)',
    };
  }
  if (p.includes('instagram')) {
    return {
      label: 'Instagram Reel',
      color: '#E1306C',
      gradient: 'from-[#E1306C]/20 via-[#F77737]/10 to-transparent',
      bg: 'rgba(225, 48, 108, 0.12)',
      border: 'rgba(225, 48, 108, 0.3)',
    };
  }
  if (p.includes('youtube')) {
    return {
      label: 'YouTube',
      color: '#FF0000',
      gradient: 'from-[#FF0000]/20 via-amber-500/10 to-transparent',
      bg: 'rgba(255, 0, 0, 0.12)',
      border: 'rgba(255, 0, 0, 0.3)',
    };
  }
  return {
    label: platform || 'Video',
    color: '#FF5A00',
    gradient: 'from-[#FF5A00]/20 to-transparent',
    bg: 'rgba(255, 90, 0, 0.12)',
    border: 'rgba(255, 90, 0, 0.3)',
  };
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function getScoreColor(score: number) {
  if (score >= 90) return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
  if (score >= 75) return { text: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/15', border: 'border-[var(--accent)]/30' };
  if (score >= 60) return { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
  return { text: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' };
}

export default function VideoCard({ asset, onSelect }: VideoCardProps) {
  const analysis = asset.analysis;
  const platStyle = getPlatformStyle(asset.platform);
  const scores = analysis?.final_scores_out_of_100;
  const hookScore = scores?.hook_score ?? 0;
  const viralScore = scores?.overall_viral_pattern_similarity_score ?? hookScore;
  const scoreColors = getScoreColor(viralScore);

  const hookText =
    analysis?.hook ||
    analysis?.hook_analysis?.hook_strength_explanation ||
    '';
  const summaryText = analysis?.summary || asset.title || asset.url;
  const tags = analysis?.viral_formula_tags || [];
  const withoutSound =
    analysis?.hook_analysis?.understandable_without_sound ?? true;
  const region = analysis?.video_metadata?.country_or_region;
  const creatorType = analysis?.video_metadata?.visible_creator_type;

  return (
    <div
      onClick={() => onSelect(asset)}
      className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/90 backdrop-blur-md hover:border-[var(--accent)]/80 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Subtle top gradient glow based on platform */}
      <div
        className={`absolute top-0 inset-x-0 h-28 bg-gradient-to-b ${platStyle.gradient} pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      <div className="p-5 relative z-10 flex flex-col gap-3.5">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          {/* Platform & Duration */}
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-sm"
              style={{
                backgroundColor: platStyle.bg,
                color: platStyle.color,
                borderColor: platStyle.border,
              }}
            >
              <Film className="w-3 h-3" />
              {platStyle.label}
            </span>

            {asset.duration_s && asset.duration_s > 0 ? (
              <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--pill-bg)] px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                {formatDuration(asset.duration_s)}
              </span>
            ) : null}
          </div>

          {/* Viral Score Gauge */}
          {scores ? (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm ${scoreColors.bg} ${scoreColors.border}`}
            >
              <Sparkles className={`w-3 h-3 ${scoreColors.text}`} />
              <span className={`text-xs font-black ${scoreColors.text}`}>
                {viralScore}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">
                Score
              </span>
            </div>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] text-[var(--text-secondary)] bg-[var(--pill-bg)]">
              Pending
            </span>
          )}
        </div>

        {/* Competitor & Title */}
        <div>
          {asset.competitor_name && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-1">
              <span>{asset.competitor_name}</span>
            </div>
          )}
          <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--accent)] transition-colors">
            {asset.title || summaryText}
          </h3>
        </div>

        {/* 3-Second Hook Strategy Box */}
        {hookText ? (
          <div className="p-3.5 rounded-xl bg-[var(--card-bg-alt)] border border-[var(--border-color)] relative overflow-hidden group-hover:border-[var(--accent)]/40 transition-colors">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-primary)] mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>3-Second Hook Mechanism</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] italic line-clamp-2 leading-relaxed">
              &ldquo;{hookText}&rdquo;
            </p>
          </div>
        ) : null}

        {/* Applied Viral Formula Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--pill-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] group-hover:text-[var(--text-primary)] transition-colors"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-medium text-[var(--text-secondary)]">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3.5 border-t border-[var(--border-color)] bg-[var(--card-bg-alt)]/50 relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
          {region && (
            <span className="flex items-center gap-1 truncate max-w-[100px]" title={`Region: ${region}`}>
              <Globe className="w-3 h-3 text-[var(--text-secondary)]" />
              <span className="truncate">{region}</span>
            </span>
          )}

          <span
            className="flex items-center gap-1"
            title={withoutSound ? 'Works without sound (Strong visual hooks)' : 'Audio dependent'}
          >
            {withoutSound ? (
              <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-[var(--accent)] group-hover:translate-x-1 transition-transform">
          <span>View Strategy</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
