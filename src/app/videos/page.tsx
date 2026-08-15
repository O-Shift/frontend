// oshift/src/app/videos/page.tsx
'use client';

import React from 'react';
import {
  Film,
  Sparkles,
  Zap,
  Clock,
  TrendingUp,
  RefreshCw,
  Layers,
  AlertCircle,
  Play,
  Tag,
  Flame,
  Globe,
  Share2,
  Video as VideoIcon,
  Bot,
} from 'lucide-react';
import VideoCard from '@/components/video/VideoCard';
import VideoAnalyzerInput from '@/components/video/VideoAnalyzerInput';
import VideoFilters from '@/components/video/VideoFilters';
import VideoAnalysisModal from '@/components/video/VideoAnalysisModal';
import { useVideos } from '@/hooks/use-videos';

export default function VideosPage() {
  const {
    filteredAssets,
    competitors,
    selectedAsset,
    setSelectedAsset,
    isLoading,
    isAnalyzing,
    analysisStage,
    analysisProgress,
    error,
    stats,
    searchQuery,
    setSearchQuery,
    platformFilter,
    setPlatformFilter,
    competitorFilter,
    setCompetitorFilter,
    tagFilter,
    setTagFilter,
    minHookScore,
    setMinHookScore,
    sortBy,
    setSortBy,
    refetch,
    analyzeVideoUrl,
    checkExistingVideo,
  } = useVideos();

  return (
    <div className="flex-1 overflow-y-auto min-h-0 relative p-6 sm:p-8 lg:p-10 space-y-8">
      {/* Ambient background glow */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-20 -z-10"
        style={{
          background: 'radial-gradient(circle, #FF5A00 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/3 left-0 w-80 h-80 rounded-full pointer-events-none blur-3xl opacity-15 -z-10"
        style={{
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto w-full space-y-8 pb-16">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
              </span>
              <span>Multimodal Vision Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              Video & Creative Viral Analysis
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              Automated video tracking across TikTok, Instagram Reels, and YouTube.
              Inspect 3-second hooks, attention pacing, retention drop-off risks, and cultural meme signals powered by Gemini 3.7 Flash Vision.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--item-hover)] text-xs font-bold text-[var(--text-primary)] transition-all hover:border-[var(--accent)] cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Library</span>
            </button>
          </div>
        </div>

        {/* Strategic Intelligence & Viral Pattern KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Breakout Viral Pattern */}
          <div
            onClick={() => {
              if (stats.topViralPattern !== 'N/A') setTagFilter(stats.topViralPattern);
            }}
            className={`relative p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/80 backdrop-blur-md shadow-sm hover:border-[var(--accent)]/60 transition-all overflow-hidden group ${
              stats.topViralPattern !== 'N/A' ? 'cursor-pointer' : ''
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/5 rounded-full blur-xl group-hover:bg-[var(--accent)]/15 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Breakout Viral Formula
              </span>
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-base font-black text-[var(--text-primary)] capitalize truncate group-hover:text-[var(--accent)] transition-colors">
                {stats.topViralPattern !== 'N/A' ? stats.topViralPattern : 'Analyzing library...'}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {stats.topViralPatternPct > 0 ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--accent)]/15 text-[var(--accent)]">
                    {stats.topViralPatternPct}% of creatives
                  </span>
                ) : (
                  <span className="text-[11px] text-[var(--text-secondary)]">Pattern discovery</span>
                )}
                <span className="text-[11px] text-[var(--text-secondary)] truncate">
                  Dominant competitor angle
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Top Hook Strategy */}
          <div className="relative p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/80 backdrop-blur-md shadow-sm hover:border-amber-500/60 transition-colors overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/15 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Winning Hook Strategy
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-base font-black text-[var(--text-primary)] truncate">
                {stats.topHookStrategy}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {stats.topHookScore ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400">
                    Peak {stats.topHookScore}/100 Power
                  </span>
                ) : (
                  <span className="text-[11px] text-[var(--text-secondary)]">First 3s Benchmark</span>
                )}
                <span className="text-[11px] text-[var(--text-secondary)] truncate">
                  Fastest attention lock
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Top Viral Outlier */}
          <div
            onClick={() => {
              if (stats.topPerformer) setSelectedAsset(stats.topPerformer);
            }}
            className={`relative p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/80 backdrop-blur-md shadow-sm hover:border-emerald-500/60 transition-all overflow-hidden group ${
              stats.topPerformer ? 'cursor-pointer' : ''
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/15 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Top Outlier Creative
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-base font-black text-[var(--text-primary)] truncate group-hover:text-emerald-400 transition-colors">
                {stats.topPerformer?.title || stats.topPerformer?.competitor_name || (stats.analyzedVideos > 0 ? 'Inspected Outlier' : 'Awaiting creatives')}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {stats.topPerformerScore ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                    {stats.topPerformerScore}/100 Viral Match
                  </span>
                ) : (
                  <span className="text-[11px] text-[var(--text-secondary)]">Highest similarity</span>
                )}
                <span className="text-[11px] text-[var(--text-secondary)] truncate">
                  Click to inspect breakdown
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Format & Pacing Shift */}
          <div className="relative p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/80 backdrop-blur-md shadow-sm hover:border-sky-500/60 transition-colors overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/15 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Format & Pacing Shift
              </span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-base font-black text-[var(--text-primary)] truncate">
                {stats.analyzedVideos > 0 ? `${stats.soundlessPct}% Silent-Optimized` : 'Sound-Independent'}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400">
                  Visual First
                </span>
                <span className="text-[11px] text-[var(--text-secondary)] truncate">
                  No sound required to convert
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live URL Analyzer Command Bar */}
        <VideoAnalyzerInput
          isAnalyzing={isAnalyzing}
          analysisStage={analysisStage}
          analysisProgress={analysisProgress}
          error={error}
          onAnalyze={analyzeVideoUrl}
          checkExistingVideo={checkExistingVideo}
          onSelectExistingAsset={(asset) => setSelectedAsset(asset)}
        />

        {/* Filter and Search Bar */}
        <VideoFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
          competitorFilter={competitorFilter}
          setCompetitorFilter={setCompetitorFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          minHookScore={minHookScore}
          setMinHookScore={setMinHookScore}
          sortBy={sortBy}
          setSortBy={setSortBy}
          competitors={competitors}
          allTags={stats.allTags}
          totalResults={filteredAssets.length}
        />

        {/* Trending Viral Formulas & Strategy Strip */}
        {stats.sortedTags.length > 0 && (
          <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/60 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Discovered Viral Formulas ({stats.sortedTags.length})
                </span>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Click any strategy to isolate creatives matching this psychological archetype
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTagFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  tagFilter === 'all'
                    ? 'bg-[var(--accent)] text-white shadow-sm font-bold'
                    : 'bg-[var(--pill-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)]'
                }`}
              >
                All Angles
              </button>
              {stats.sortedTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(tagFilter.toLowerCase() === tag.toLowerCase() ? 'all' : tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize flex items-center gap-1.5 transition-all cursor-pointer ${
                    tagFilter.toLowerCase() === tag.toLowerCase()
                      ? 'bg-[var(--accent)] text-white shadow-sm font-bold'
                      : 'bg-[var(--pill-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] border border-transparent hover:border-[var(--border-color)]'
                  }`}
                >
                  <span>{tag}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      tagFilter.toLowerCase() === tag.toLowerCase()
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--card-bg)] text-[var(--text-primary)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video Cards Grid / Empty States */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-28 h-6 rounded-full bg-[var(--pill-bg)]" />
                  <div className="w-3/4 h-5 rounded bg-[var(--pill-bg)]" />
                  <div className="w-full h-16 rounded-xl bg-[var(--pill-bg)]" />
                </div>
                <div className="w-full h-8 rounded bg-[var(--pill-bg)]" />
              </div>
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-4">
              <Film className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              No Tracked Video Creatives Yet
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-md leading-relaxed">
              Videos discovered during automated social crawls or analyzed directly via the URL bar above will automatically appear here with full strategic breakdowns.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssets.map((asset) => (
              <VideoCard
                key={asset.id}
                asset={asset}
                onSelect={(selected) => setSelectedAsset(selected)}
              />
            ))}
          </div>
        )}

        {/* Modal Inspector */}
        <VideoAnalysisModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      </div>
    </div>
  );
}
