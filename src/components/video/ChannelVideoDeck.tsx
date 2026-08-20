// oshift/src/components/video/ChannelVideoDeck.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Clock,
  Film,
  Zap,
} from 'lucide-react';
import {
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaFacebook,
  FaXTwitter,
  FaTiktok,
} from 'react-icons/fa6';
import type { VideoAsset, SocialAccount } from '@/types/entities';

interface ChannelVideoDeckProps {
  account: SocialAccount;
  videos?: VideoAsset[];
  onBack: () => void;
  onSelectVideo: (video: VideoAsset) => void;
  onAnalyzeNewVideo?: (url: string) => void;
}

function getPlatformIconEl(platform?: string | null) {
  switch ((platform || '').toLowerCase()) {
    case 'instagram':
      return <FaInstagram className="w-5 h-5 text-pink-500" />;
    case 'linkedin':
      return <FaLinkedin className="w-5 h-5 text-sky-400" />;
    case 'youtube':
      return <FaYoutube className="w-5 h-5 text-red-500" />;
    case 'facebook':
      return <FaFacebook className="w-5 h-5 text-blue-500" />;
    case 'tiktok':
      return <FaTiktok className="w-5 h-5 text-cyan-400" />;
    case 'x':
    case 'twitter':
      return <FaXTwitter className="w-5 h-5 text-white" />;
    default:
      return <Film className="w-5 h-5 text-zinc-400" />;
  }
}

// Cinematic neutral dark poster backgrounds — no orange
function getPosterBg(index: number) {
  const gradients = [
    'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #09090b 80%)',
    'radial-gradient(circle at 50% 30%, #291026 0%, #09090b 80%)',
    'radial-gradient(circle at 50% 30%, #14271e 0%, #09090b 80%)',
    'radial-gradient(circle at 50% 30%, #1e1f2e 0%, #09090b 80%)',
    'radial-gradient(circle at 50% 30%, #1a1a1a 0%, #09090b 80%)',
  ];
  return gradients[index % gradients.length];
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0m 45s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function ChannelVideoDeck({
  account,
  videos = [],
  onBack,
  onSelectVideo,
}: ChannelVideoDeckProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Filter to channel-specific videos
  const channelVideos = videos.filter((v) => {
    return (
      v.competitor_name?.toLowerCase().includes(account.handle.toLowerCase()) ||
      v.url.toLowerCase().includes(account.handle.toLowerCase()) ||
      (account.display_name &&
        v.competitor_name?.toLowerCase().includes(account.display_name.toLowerCase()))
    );
  });

  const displayedVideos = channelVideos.length > 0 ? channelVideos : videos;
  const total = displayedVideos.length;

  const handlePrev = () =>
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : Math.max(total - 1, 0)));
  const handleNext = () =>
    setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [total]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
      className="relative w-full flex flex-col gap-6 py-4"
    >
      {/* ── TOP CHANNEL HEADER & BACK BUTTON ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] hover:bg-[var(--item-hover)] text-[var(--text-primary)] transition-all cursor-pointer group"
            title="Back to All Channels"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)] flex items-center justify-center">
              {getPlatformIconEl(account.platform)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {account.display_name || `@${account.handle}`}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                <span>@{account.handle}</span>
                <span>·</span>
                <span>
                  {account.follower_count
                    ? `${Number(account.follower_count).toLocaleString()} Followers`
                    : 'Tracked Channel'}
                </span>
                <span>·</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {displayedVideos.length} Creatives
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {total > 1 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] hover:bg-[var(--item-hover)] text-[var(--text-primary)] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-[var(--text-secondary)] px-1 tabular-nums">
              {activeIndex + 1} / {total}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] hover:bg-[var(--item-hover)] text-[var(--text-primary)] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── CINEMATIC CARD DECK ── */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
          <div className="w-16 h-16 rounded-xl bg-[var(--card-bg-alt)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            No Creatives Analyzed Yet
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md">
            Paste a video link from this channel in the Analyze tab to get started.
          </p>
        </div>
      ) : (
        <div className="relative w-full py-8 min-h-[480px] flex items-center justify-center overflow-hidden">
          <div className="flex items-center justify-center gap-4 sm:gap-6" style={{ perspective: '1000px' }}>
            <AnimatePresence initial={false}>
              {displayedVideos.map((asset, idx) => {
                const offset = idx - activeIndex;
                const isCenter = offset === 0;
                const absOffset = Math.abs(offset);

                if (absOffset > 2) return null;

                const analysis = asset.analysis;
                const score =
                  analysis?.final_scores_out_of_100?.overall_viral_pattern_similarity_score ||
                  analysis?.final_scores_out_of_100?.hook_score ||
                  85;
                const scoreStar = (score / 10).toFixed(1);
                const hookText =
                  analysis?.hook || analysis?.hook_analysis?.hook_strength_explanation || '';

                const scale = isCenter ? 1.05 : 0.82 - absOffset * 0.04;
                const opacity = isCenter ? 1 : 0.42 - absOffset * 0.08;
                const zIndex = 30 - absOffset * 10;
                const rotateY = offset * -10;
                const translateX = offset * 22;

                return (
                  <motion.div
                    key={asset.id || idx}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{
                      opacity,
                      scale,
                      x: translateX,
                      rotateY,
                      zIndex,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.45, type: 'spring', stiffness: 180, damping: 26 }}
                    onClick={() => {
                      if (isCenter) {
                        onSelectVideo(asset);
                      } else {
                        setActiveIndex(idx);
                      }
                    }}
                    style={{
                      background: getPosterBg(idx),
                      zIndex,
                      position: 'absolute',
                    }}
                    className={`w-64 sm:w-72 md:w-76 aspect-[2/3] rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between p-5 select-none ${
                      isCenter
                        ? 'border-white/25 shadow-[0_24px_60px_rgba(0,0,0,0.6)]'
                        : 'border-white/8 hover:border-white/15'
                    }`}
                  >
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 pointer-events-none" />

                    {/* ── TOP: Platform icon (left) + Score (right) ── */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <div className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center">
                        {getPlatformIconEl(asset.platform || account.platform)}
                      </div>

                      <div className="flex items-baseline gap-0.5 text-white font-black text-2xl tracking-tight drop-shadow-md">
                        <span>{scoreStar}</span>
                        <span className="text-amber-400 text-base">★</span>
                      </div>
                    </div>

                    {/* ── CENTER: Play icon on active card ── */}
                    {isCenter && (
                      <div className="relative z-10 my-auto self-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 ml-0.5 fill-white" />
                        </div>
                      </div>
                    )}

                    {/* ── BOTTOM METADATA ── */}
                    <div className="relative z-10 flex flex-col gap-1.5">
                      <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                        {asset.title || analysis?.summary || asset.url}
                      </h3>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                        <span>
                          {asset.captured_at
                            ? new Date(asset.captured_at).getFullYear()
                            : '2026'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDuration(asset.duration_s)}
                        </span>
                      </div>

                      {/* Hook preview on active center card only */}
                      {isCenter && hookText && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="mt-1 p-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md"
                        >
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            <span>Hook</span>
                          </div>
                          <p className="text-[11px] text-zinc-300 italic line-clamp-2">
                            &ldquo;{hookText}&rdquo;
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Hint */}
      {total > 0 && (
        <div className="flex items-center justify-center text-[11px] text-[var(--text-secondary)]">
          Click the center card to open the full strategy breakdown · ← → to navigate
        </div>
      )}
    </motion.div>
  );
}
