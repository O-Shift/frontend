// oshift/src/components/video/PinterestVideoCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Clock,
  Volume2,
  VolumeX,
  Zap,
  ChevronRight,
} from 'lucide-react';
import {
  FaTiktok,
  FaInstagram,
  FaYoutube,
} from 'react-icons/fa6';
import type { VideoAsset } from '@/types/entities';

interface PinterestVideoCardProps {
  asset: VideoAsset;
  onSelect: (video: VideoAsset) => void;
  aspectRatio?: 'vertical' | 'portrait' | 'standard';
  index?: number;
}

function getPlatformMeta(platform?: string | null, url?: string) {
  const p = (platform || '').toLowerCase();
  const u = (url || '').toLowerCase();
  if (p.includes('tiktok') || u.includes('tiktok.com')) {
    return {
      label: 'TikTok',
      icon: FaTiktok,
      iconColor: 'text-cyan-400',
    };
  }
  if (p.includes('instagram') || u.includes('instagram.com')) {
    return {
      label: 'Reel',
      icon: FaInstagram,
      iconColor: 'text-pink-400',
    };
  }
  if (p.includes('youtube') || u.includes('youtube.com') || u.includes('youtu.be')) {
    return {
      label: 'YouTube',
      icon: FaYoutube,
      iconColor: 'text-red-400',
    };
  }
  return {
    label: platform || 'Video',
    icon: Play,
    iconColor: 'text-zinc-300',
  };
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0:30';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatCleanTitle(asset: VideoAsset): { title: string; handle: string } {
  let handle = asset.competitor_name || '';

  // Parse URL if handle or title missing
  if (asset.url) {
    const match = asset.url.match(/@([a-zA-Z0-9_.-]+)/);
    if (match && !handle) {
      handle = `@${match[1]}`;
    }
  }

  let title = asset.title;
  if (!title || title.startsWith('http')) {
    if (asset.analysis?.summary) {
      title = asset.analysis.summary;
    } else if (handle) {
      title = `${handle} Creative Video`;
    } else {
      title = 'Video Creative';
    }
  }

  return { title, handle: handle || 'Channel' };
}

// Cinematic dark poster artwork gradients
function getCinematicPosterBg(index: number) {
  const gradients = [
    'linear-gradient(145deg, #18181f 0%, #0d0d12 50%, #121218 100%)',
    'linear-gradient(145deg, #161a22 0%, #0d0f14 50%, #11141a 100%)',
    'linear-gradient(145deg, #1f1719 0%, #0f0c0e 50%, #141013 100%)',
    'linear-gradient(145deg, #191c18 0%, #0c0e0b 50%, #121510 100%)',
    'linear-gradient(145deg, #1c1822 0%, #0d0b12 50%, #14111a 100%)',
  ];
  return gradients[index % gradients.length];
}

export default function PinterestVideoCard({
  asset,
  onSelect,
  aspectRatio = 'portrait',
  index = 0,
}: PinterestVideoCardProps) {
  const analysis = asset.analysis;
  const plat = getPlatformMeta(asset.platform, asset.url);
  const PlatformIcon = plat.icon;

  const hookScore = analysis?.final_scores_out_of_100?.hook_score ?? 78;
  const viralScore =
    analysis?.final_scores_out_of_100?.overall_viral_pattern_similarity_score ?? hookScore;
  const scoreFormatted = (viralScore / 10).toFixed(1);

  const hookText =
    analysis?.hook ||
    analysis?.hook_analysis?.hook_strength_explanation ||
    '';
  const { title: displayTitle, handle } = formatCleanTitle(asset);
  const tags = analysis?.viral_formula_tags || [];
  const withoutSound =
    analysis?.hook_analysis?.understandable_without_sound ?? true;

  const aspectClass =
    aspectRatio === 'vertical'
      ? 'aspect-[9/16]'
      : aspectRatio === 'standard'
      ? 'aspect-[4/3]'
      : 'aspect-[3/4]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onSelect(asset)}
      className="group relative flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:border-white/20 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden mb-4 break-inside-avoid"
    >
      {/* ── VIDEO POSTER / THUMBNAIL FRAME ── */}
      <div
        className={`relative w-full ${aspectClass} overflow-hidden flex flex-col justify-between p-3.5`}
        style={{ background: getCinematicPosterBg(index) }}
      >
        {/* Subtle dark film vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

        {/* Diagonal grain & pattern lines */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* ── TOP BADGES OVERLAY (CLEAN FROSTED GLASS) ── */}
        <div className="relative z-10 flex items-center justify-between gap-1.5 w-full">
          {/* Platform Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 border border-white/10 text-white backdrop-blur-md shadow-xs">
            <PlatformIcon className={`w-3 h-3 ${plat.iconColor}`} />
            <span className="tracking-wide">{plat.label}</span>
          </div>

          {/* Clean White Score Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-xs font-bold text-white backdrop-blur-md shadow-xs">
            <span>{scoreFormatted}</span>
            <span className="text-amber-400">★</span>
          </div>
        </div>

        {/* ── CENTER PLAY ACTION ON HOVER (FROSTED GLASS CIRCLE) ── */}
        <div className="relative z-10 flex items-center justify-center my-auto">
          <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 scale-85 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-xl">
            <Play className="w-5 h-5 ml-0.5 fill-white" />
          </div>
        </div>

        {/* ── BOTTOM OVERLAY ON THUMBNAIL ── */}
        <div className="relative z-10 flex items-end justify-between gap-2">
          {/* Channel Tag */}
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-zinc-300 bg-black/60 border border-white/10 backdrop-blur-md truncate max-w-[130px]">
            {handle}
          </span>

          {/* Duration & Sound status */}
          <div className="flex items-center gap-1.5">
            <span
              className="p-1 rounded-md bg-black/60 border border-white/10 text-zinc-400 backdrop-blur-md"
              title={withoutSound ? 'Silent optimized' : 'Requires sound'}
            >
              {withoutSound ? (
                <VolumeX className="w-3 h-3 text-emerald-400" />
              ) : (
                <Volume2 className="w-3 h-3 text-zinc-400" />
              )}
            </span>

            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 font-mono text-[10px] text-zinc-300 backdrop-blur-md">
              <Clock className="w-2.5 h-2.5 text-zinc-400" />
              <span>{formatDuration(asset.duration_s)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD BODY ── */}
      <div className="p-3.5 flex flex-col gap-2 flex-1 bg-[var(--card-bg)]">
        {/* Title in clean text */}
        <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:underline transition-colors">
          {displayTitle}
        </h4>

        {/* 3-Second Hook snippet (if present) */}
        {hookText ? (
          <div className="p-2.5 rounded-xl bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Hook</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] italic line-clamp-2 leading-relaxed">
              &ldquo;{hookText}&rdquo;
            </p>
          </div>
        ) : null}

        {/* Formula tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {tags.slice(0, 2).map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--pill-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] truncate max-w-[140px]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── CARD FOOTER ── */}
      <div className="px-3.5 py-2 border-t border-[var(--border-color)] bg-[var(--card-bg-alt)]/50 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
        <span>
          {asset.captured_at
            ? new Date(asset.captured_at).toLocaleDateString()
            : 'Creative'}
        </span>
        <div className="flex items-center gap-0.5 font-medium text-[var(--text-primary)] group-hover:translate-x-0.5 transition-transform">
          <span>View</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
}
