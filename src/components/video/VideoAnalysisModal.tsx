// oshift/src/components/video/VideoAnalysisModal.tsx
'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Film,
  Sparkles,
  Zap,
  Clock,
  ExternalLink,
  Volume2,
  VolumeX,
  Globe,
  User,
  Heart,
  Copy,
  Check,
  Tag,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import VideoScoreRadar from './VideoScoreRadar';
import VideoTimeline from './VideoTimeline';
import { useMounted } from '@/hooks/use-mounted';
import type { VideoAsset } from '@/types/entities';

interface VideoAnalysisModalProps {
  asset: VideoAsset | null;
  onClose: () => void;
}

type ModalTab = 'overview' | 'hook_pacing' | 'cultural' | 'timeline' | 'raw_json';

export default function VideoAnalysisModal({ asset, onClose }: VideoAnalysisModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  const [copiedJson, setCopiedJson] = useState(false);
  const mounted = useMounted();

  if (!mounted || !asset) return null;

  const analysis = asset.analysis;
  const scores = analysis?.final_scores_out_of_100;
  const hookAnalysis = analysis?.hook_analysis;
  const attention = analysis?.attention_pattern;
  const cultural = analysis?.cultural_regional_signals;
  const emotions = analysis?.emotional_reaction_prediction?.primary_emotions || [];
  const meta = analysis?.video_metadata;

  const handleCopyJson = () => {
    if (analysis) {
      navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border-color)] bg-[var(--card-bg-alt)] shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0 mt-0.5">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {asset.competitor_name && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                    {asset.competitor_name}
                  </span>
                )}
                {asset.platform && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--pill-bg)] capitalize">
                    {asset.platform}
                  </span>
                )}
                {asset.duration_s && asset.duration_s > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                    <Clock className="w-3 h-3" />
                    {asset.duration_s}s
                  </span>
                ) : null}
                {asset.cost_usd !== null && asset.cost_usd !== undefined && (
                  <span className="flex items-center text-[10px] text-emerald-400 font-mono">
                    <DollarSign className="w-2.5 h-2.5" />
                    {asset.cost_usd.toFixed(4)} USD
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-[var(--text-primary)] line-clamp-1">
                {asset.title || analysis?.summary || asset.url}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors"
              title="Open Original Video URL"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 border-b border-[var(--border-color)] bg-[var(--card-bg)] shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Overview & Scorecard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hook_pacing')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'hook_pacing'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Hook & Attention Pacing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cultural')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'cultural'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Cultural & Psychological Triggers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'timeline'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Key Moments Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw_json')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'raw_json'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Raw Analysis JSON
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & SCORECARD */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Executive Summary Card */}
              {analysis?.summary && (
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--item-hover)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Viral Strategy Reverse-Engineered</span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>
              )}

              {/* Strategy Radar Chart */}
              <VideoScoreRadar scores={scores} />

              {/* CTA & Format Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CTA Callout */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)]">
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Call to Action (CTA)
                  </div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {analysis?.cta && analysis.cta.toLowerCase() !== 'none'
                      ? `"${analysis.cta}"`
                      : 'None detected (Soft brand impression / entertainment)'}
                  </div>
                </div>

                {/* Creator & Regional Metadata */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex flex-col justify-between gap-2">
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Audience & Production Metadata
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-primary)]">
                    {meta?.visible_creator_type && (
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <strong className="capitalize">{meta.visible_creator_type}</strong>
                      </span>
                    )}
                    {meta?.country_or_region && (
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>{meta.country_or_region}</span>
                      </span>
                    )}
                    {meta?.genre && (
                      <span className="capitalize px-2 py-0.5 rounded bg-[var(--pill-bg)]">
                        {meta.genre}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Viral Formula Tags */}
              {(analysis?.viral_formula_tags || []).length > 0 && (
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Applied Viral Formulas</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis?.viral_formula_tags?.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HOOK & ATTENTION PACING */}
          {activeTab === 'hook_pacing' && (
            <div className="flex flex-col gap-6">
              {/* 3-Second Hook Card */}
              <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      The 3-Second Hook Mechanism
                    </h3>
                  </div>
                  {scores?.hook_score !== undefined && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {scores.hook_score}/100 Strength
                    </span>
                  )}
                </div>

                {hookAnalysis?.hook_strength_explanation ? (
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed mb-4">
                    {hookAnalysis.hook_strength_explanation}
                  </p>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--border-color)]">
                  {/* Hook Types */}
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                      Hook Classification
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(hookAnalysis?.hook_types || []).map((ht, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--pill-bg)] text-[var(--text-primary)] border border-[var(--border-color)]"
                        >
                          {ht}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sound Independence */}
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                      Audio Dependency
                    </div>
                    <div className="flex items-center gap-2">
                      {hookAnalysis?.understandable_without_sound ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                          <VolumeX className="w-4 h-4" />
                          <span>Works without sound (Strong on muted feeds)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                          <Volume2 className="w-4 h-4" />
                          <span>Requires audio to understand narrative</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attention & Pacing Dynamics */}
              {attention && (
                <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Visual Pacing & Attention Architecture
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {attention.scene_changes_and_pacing && (
                      <div className="p-3 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                          Scene Cuts & Speed
                        </span>
                        <p className="text-xs text-[var(--text-primary)] mt-1">
                          {attention.scene_changes_and_pacing}
                        </p>
                      </div>
                    )}

                    {attention.visual_novelty && (
                      <div className="p-3 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                          Visual Novelty Factor
                        </span>
                        <p className="text-xs text-[var(--text-primary)] mt-1">
                          {attention.visual_novelty}
                        </p>
                      </div>
                    )}

                    {attention.text_overlays && (
                      <div className="p-3 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                          Text Overlays & Captions
                        </span>
                        <p className="text-xs text-[var(--text-primary)] mt-1">
                          {attention.text_overlays}
                        </p>
                      </div>
                    )}

                    {attention.audio_changes && (
                      <div className="p-3 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                          Audio Cues & Music
                        </span>
                        <p className="text-xs text-[var(--text-primary)] mt-1">
                          {attention.audio_changes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CULTURAL & PSYCHOLOGICAL SIGNALS */}
          {activeTab === 'cultural' && (
            <div className="flex flex-col gap-6">
              {/* Primary Emotions */}
              {emotions.length > 0 && (
                <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Predicted Emotional Reactions
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {emotions.map((emotion, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/25 text-rose-300"
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cultural & Regional Signals */}
              {cultural && (
                <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Cultural Nuances & Meme Resonance
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cultural.humor_style && (
                      <div className="p-3 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                          Humor Style
                        </span>
                        <p className="text-xs text-[var(--text-primary)] mt-1">
                          {cultural.humor_style}
                        </p>
                      </div>
                    )}

                    {cultural.social_norms_observed && (
                      <div className="p-3 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                          Social Behaviors & Norms
                        </span>
                        <p className="text-xs text-[var(--text-primary)] mt-1">
                          {cultural.social_norms_observed}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Local & Meme References */}
                  {(cultural.local_references?.length > 0 ||
                    cultural.egyptian_arab_meme_references?.length > 0) && (
                    <div className="p-3.5 rounded-lg bg-[var(--item-hover)] border border-[var(--border-color)]">
                      <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase block mb-2">
                        Local Cues & Memes Detected
                      </span>
                      <ul className="text-xs text-[var(--text-primary)] space-y-1">
                        {[
                          ...(cultural.local_references || []),
                          ...(cultural.egyptian_arab_meme_references || []),
                        ].map((ref, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[var(--accent)]">•</span>
                            <span>{ref}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Regional Portability */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      Cross-Market Portability:
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {cultural.travels_outside_local_audience
                        ? '✅ High (Appeals across international regions)'
                        : '📍 Local Specific (Tailored strictly to regional audience)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TIMELINE */}
          {activeTab === 'timeline' && (
            <VideoTimeline
              durationSeconds={analysis?.duration_seconds || asset.duration_s || 0}
              keyMoments={analysis?.key_moments || []}
              emotionalPeaks={attention?.emotional_peaks || []}
              retentionRisks={attention?.retention_risks || []}
            />
          )}

          {/* TAB 5: RAW JSON */}
          {activeTab === 'raw_json' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">
                  Complete structured payload parsed from Gemini 2.5 Flash Vision.
                </span>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--pill-bg)] hover:bg-[var(--item-hover)] text-[var(--text-primary)] border border-[var(--border-color)] transition-colors cursor-pointer"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-xl border border-[var(--border-color)] bg-[#0d0d11] text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-96 leading-relaxed">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--border-color)] bg-[var(--card-bg-alt)] shrink-0">
          <div className="text-xs text-[var(--text-secondary)]">
            Asset ID: <span className="font-mono text-[11px]">{asset.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[var(--pill-bg)] hover:bg-[var(--item-hover)] text-[var(--text-primary)] border border-[var(--border-color)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
