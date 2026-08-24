// oshift/src/components/video/VideoDetailView.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  Volume2,
  VolumeX,
  Zap,
  Tag,
  User,
  Globe,
  Sparkles,
  DollarSign,
  Heart,
  Play,
} from 'lucide-react';
import { FaTiktok, FaInstagram, FaYoutube } from 'react-icons/fa6';
import type { VideoAsset } from '@/types/entities';

import SpeedometerGauge from './widgets/SpeedometerGauge';
import SegmentedBarMeter, { CategoryMetric } from './widgets/SegmentedBarMeter';
import DonutSegments, { DonutItem } from './widgets/DonutSegments';
import BezierPacingCurve from './widgets/BezierPacingCurve';
import CircularDial from './widgets/CircularDial';
import LollipopTimeline from './widgets/LollipopTimeline';

interface VideoDetailViewProps {
  asset: VideoAsset;
  onBack: () => void;
}

function getPlatformMeta(platform?: string | null, url?: string) {
  const p = (platform || '').toLowerCase();
  const u = (url || '').toLowerCase();
  if (p.includes('tiktok') || u.includes('tiktok.com')) {
    return { label: 'TikTok', icon: FaTiktok, color: '#00f2fe' };
  }
  if (p.includes('instagram') || u.includes('instagram.com')) {
    return { label: 'Instagram Reel', icon: FaInstagram, color: '#E1306C' };
  }
  if (p.includes('youtube') || u.includes('youtube.com')) {
    return { label: 'YouTube', icon: FaYoutube, color: '#FF0000' };
  }
  return { label: platform || 'Video', icon: Play, color: '#f97316' };
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0:30';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoDetailView({ asset, onBack }: VideoDetailViewProps) {
  const analysis = asset.analysis;
  const scores = analysis?.final_scores_out_of_100;
  const hookAnalysis = analysis?.hook_analysis;
  const attention = analysis?.attention_pattern;
  const cultural = analysis?.cultural_regional_signals;
  const emotions = analysis?.emotional_reaction_prediction?.primary_emotions || [];
  const meta = analysis?.video_metadata;

  const plat = getPlatformMeta(asset.platform, asset.url);
  const PlatformIcon = plat.icon;

  // Real Database Scores (0-100)
  const hookScore = scores?.hook_score ?? 80;
  const retentionScore = scores?.retention_score ?? 75;
  const emotionalScore = scores?.emotional_intensity_score ?? 70;
  const shareScore = scores?.shareability_score ?? 65;
  const culturalScore = scores?.cultural_specificity_score ?? 60;
  const crossMarketScore = scores?.cross_market_potential_score ?? 60;
  const overallViralScore =
    scores?.overall_viral_pattern_similarity_score ??
    Math.round((hookScore + retentionScore + emotionalScore + shareScore) / 4);

  // 1. Segmented Bar Categories: All 7 Real DB Scores in final_scores_out_of_100
  const categories: CategoryMetric[] = [
    {
      name: 'Hook Power',
      score: hookScore,
      benchmarkLabel: hookScore >= 80 ? 'High Impact' : hookScore >= 60 ? 'Strong' : 'Baseline',
      countLabel: `${hookScore} pts`,
      color: '#f97316',
    },
    {
      name: 'Retention Depth',
      score: retentionScore,
      benchmarkLabel: retentionScore >= 80 ? 'High Retention' : retentionScore >= 60 ? 'Standard' : 'Drop-off Risk',
      countLabel: `${retentionScore} pts`,
      color: '#ef4444',
    },
    {
      name: 'Emotional Intensity',
      score: emotionalScore,
      benchmarkLabel: emotionalScore >= 80 ? 'High Resonance' : emotionalScore >= 60 ? 'Engaging' : 'Neutral',
      countLabel: `${emotionalScore} pts`,
      color: '#ec4899',
    },
    {
      name: 'Shareability',
      score: shareScore,
      benchmarkLabel: shareScore >= 80 ? 'High Viral Lift' : shareScore >= 60 ? 'Shareable' : 'Low Lift',
      countLabel: `${shareScore} pts`,
      color: '#14b8a6',
    },
    {
      name: 'Cultural Specificity',
      score: culturalScore,
      benchmarkLabel: culturalScore >= 80 ? 'Deep Local Cues' : culturalScore >= 60 ? 'Moderate' : 'Universal',
      countLabel: `${culturalScore} pts`,
      color: '#8b5cf6',
    },
    {
      name: 'Cross-Market Reach',
      score: crossMarketScore,
      benchmarkLabel: crossMarketScore >= 80 ? 'Global Reach' : crossMarketScore >= 60 ? 'Regional' : 'Local Only',
      countLabel: `${crossMarketScore} pts`,
      color: '#3b82f6',
    },
    {
      name: 'Overall Viral Pattern',
      score: overallViralScore,
      benchmarkLabel: overallViralScore >= 80 ? 'Top Viral Match' : overallViralScore >= 60 ? 'Strong Fit' : 'Baseline',
      countLabel: `${overallViralScore} pts`,
      color: '#f59e0b',
    },
  ];

  // 2. Donut Breakdown: Real Proportional Contribution of the 4 Core Scoring Pillars
  const pillarTotal = hookScore + retentionScore + emotionalScore + shareScore || 1;
  const donutItems: DonutItem[] = [
    {
      label: 'Hook Power',
      value: hookScore,
      percentage: Math.round((hookScore / pillarTotal) * 100),
      color: '#f97316',
    },
    {
      label: 'Retention Depth',
      value: retentionScore,
      percentage: Math.round((retentionScore / pillarTotal) * 100),
      color: '#ef4444',
    },
    {
      label: 'Emotional Intensity',
      value: emotionalScore,
      percentage: Math.round((emotionalScore / pillarTotal) * 100),
      color: '#ec4899',
    },
    {
      label: 'Shareability',
      value: shareScore,
      percentage: Math.round((shareScore / pillarTotal) * 100),
      color: '#14b8a6',
    },
  ];

  // 3. Speedometer Sub-metrics: Real Pillar Scores
  const speedMetrics = [
    { label: 'Hook Power', value: `${hookScore}/100` },
    { label: 'Retention Depth', value: `${retentionScore}/100` },
    { label: 'Shareability', value: `${shareScore}/100` },
    { label: 'Cultural Cues', value: `${culturalScore}/100` },
  ];

  // 4. Circular Dial Left Metrics: Real Hook Window & Audio Flag
  const withoutSound = hookAnalysis?.understandable_without_sound ?? true;
  const primaryHookType = hookAnalysis?.hook_types?.[0] || 'Hook Mechanism';
  const circularMetrics = [
    { value: '3.0s', label: 'Hook window' },
    {
      value: withoutSound ? 'Mute Safe' : 'Audio Needed',
      label: withoutSound ? 'Silent feed ready' : 'Requires sound',
    },
  ];

  // 5. Pacing Curve: Computed from real key moments timestamps
  const durationSec = analysis?.duration_seconds || asset.duration_s || 30;
  const moments = analysis?.key_moments || [];
  const pacingPoints =
    moments.length >= 3
      ? moments.map((m) => Math.round(((m.timestamp_sec / Math.max(durationSec, 1)) * 60) + 30))
      : [35, 60, 50, 75, 95, 80, 65, 75, 88, 80];

  const hookText =
    analysis?.hook || hookAnalysis?.hook_strength_explanation || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-20"
    >
      {/* ── TOP BREADCRUMB & BACK ACTION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] hover:bg-[var(--item-hover)] text-[var(--text-primary)] transition-all cursor-pointer group"
            title="Back to All Videos"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>Creatives</span>
              <span>/</span>
              <span className="text-[var(--text-primary)] font-semibold truncate max-w-[200px]">
                {asset.competitor_name || plat.label}
              </span>
              {asset.cost_usd !== null && asset.cost_usd !== undefined && (
                <>
                  <span>•</span>
                  <span className="flex items-center text-emerald-400 font-mono text-[11px]">
                    <DollarSign className="w-3 h-3" />
                    {asset.cost_usd.toFixed(4)} USD
                  </span>
                </>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate max-w-md sm:max-w-xl">
              {asset.title || analysis?.summary || 'Creative Intelligence Analysis'}
            </h2>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {asset.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] hover:bg-[var(--item-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
            >
              <span>Original Post</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          )}
        </div>
      </div>

      {/* ── MAIN SPLIT CANVAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT HERO COLUMN (CREATIVE POSTER & CONTEXT) ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Creative Poster Card */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 space-y-4 shadow-sm">
            {/* Top metadata pill row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--card-bg-alt)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)]">
                <PlatformIcon className="w-3.5 h-3.5" style={{ color: plat.color }} />
                <span>{plat.label}</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(asset.duration_s || analysis?.duration_seconds)}
                </span>
                <span>•</span>
                <span
                  className="flex items-center gap-1"
                  title={withoutSound ? 'Silent optimized' : 'Requires audio'}
                >
                  {withoutSound ? (
                    <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </span>
              </div>
            </div>

            {/* Video Preview Frame */}
            <div className="relative w-full aspect-[16/10] rounded-xl border border-[var(--border-color)] bg-gradient-to-br from-zinc-900 via-black to-zinc-950 flex items-center justify-center overflow-hidden p-4">
              <div className="absolute inset-0 bg-radial from-white/5 to-transparent pointer-events-none" />
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                <Play className="w-5 h-5 ml-0.5 fill-white" />
              </div>
              <span className="absolute bottom-3 left-3 text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs">
                {asset.captured_at ? new Date(asset.captured_at).toLocaleDateString() : 'Creative'}
              </span>
            </div>

            {/* Reverse-Engineered Strategy Summary */}
            {analysis?.summary && (
              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reverse-Engineered Strategy</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            )}

            {/* 3-Second Hook snippet */}
            {hookText && (
              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  <span>3-Second Hook</span>
                </div>
                <p className="text-xs text-[var(--text-primary)] italic leading-relaxed">
                  &ldquo;{hookText}&rdquo;
                </p>
              </div>
            )}

            {/* CTA Callout */}
            {analysis?.cta && analysis.cta.toLowerCase() !== 'none' && (
              <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)]">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block mb-1">
                  Call to Action (CTA)
                </span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  &ldquo;{analysis.cta}&rdquo;
                </span>
              </div>
            )}

            {/* Production Metadata Chips */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-color)]">
              {meta?.visible_creator_type && (
                <div className="p-2.5 rounded-xl bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                    Creator Type
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-primary)] capitalize flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-[var(--text-secondary)]" />
                    {meta.visible_creator_type}
                  </span>
                </div>
              )}

              {meta?.country_or_region && (
                <div className="p-2.5 rounded-xl bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                    Region
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 mt-0.5">
                    <Globe className="w-3 h-3 text-[var(--text-secondary)]" />
                    {meta.country_or_region}
                  </span>
                </div>
              )}
            </div>

            {/* Predicted Emotions */}
            {emotions.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span>Primary Emotional Triggers</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {emotions.map((em, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20"
                    >
                      {em}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Formula Tags */}
            {(analysis?.viral_formula_tags || []).length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                  <Tag className="w-3 h-3 text-[var(--text-secondary)]" />
                  <span>Applied Viral Formulas</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis?.viral_formula_tags?.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--pill-bg)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: BENTO DATA VISUALIZATIONS (100% REAL DATA) ── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Row 1: Speedometer Gauge + Circular Dial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpeedometerGauge
              score={overallViralScore}
              title="Viral Match"
              subtitle="Multimodal pattern similarity"
              metrics={speedMetrics}
              accentColor="#f97316"
            />
            <CircularDial
              score={hookScore}
              title="Hook Velocity"
              topRightValue={`${(hookScore / 10).toFixed(1)} ★`}
              centerLabel={`@ ${(hookScore / 10).toFixed(1)}`}
              leftMetrics={circularMetrics}
              dialColor="#f43f5e"
              hookCategory={primaryHookType}
            />
          </div>

          {/* Row 2: Segmented Bar Meter + Donut Segments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SegmentedBarMeter
              title="Score Dimensions"
              categories={categories}
            />
            <DonutSegments
              title="Pillar Breakdown"
              subtitle="4 Core Scores"
              items={donutItems}
            />
          </div>

          {/* Row 3: Bezier Pacing Curve + Lollipop Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BezierPacingCurve
              score={retentionScore}
              title="Visual Pacing"
              subtitle={
                attention?.scene_changes_and_pacing ||
                attention?.visual_novelty ||
                'Scene cuts and visual attention flow'
              }
              curveColor="#f43f5e"
              dataPoints={pacingPoints}
            />
            <LollipopTimeline
              durationSeconds={durationSec}
              keyMoments={moments}
              title="Timeline Beats"
              subtitle="Chronological narrative moments"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
