// oshift/src/app/videos/page.tsx
'use client';

import React, { useState } from 'react';
import PinterestVideoCard from '@/components/video/PinterestVideoCard';
import VideoAnalyzerInput from '@/components/video/VideoAnalyzerInput';
import VideoFilters from '@/components/video/VideoFilters';
import VideoAnalysisModal from '@/components/video/VideoAnalysisModal';
import SocialAccountsTab from '@/components/video/SocialAccountsTab';
import ChannelVideoDeck from '@/components/video/ChannelVideoDeck';
import { useVideos } from '@/hooks/use-videos';
import type { SocialAccount } from '@/types/entities';

type TabView = 'all' | 'analyze' | 'channels';

export default function VideosPage() {
  const [activeTab, setActiveTab] = useState<TabView>('all');
  const [selectedChannel, setSelectedChannel] = useState<SocialAccount | null>(null);

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
    <div className="flex-1 overflow-y-auto min-h-0 relative px-4 sm:px-6 lg:px-8 py-5 space-y-4">
      {/* ── TOP PINTEREST SEARCH BAR (NO HEADER TEXT CLUTTER) ── */}
      <div className="max-w-7xl mx-auto w-full">
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
      </div>

      {/* ── PINTEREST-STYLE MINIMAL TEXT TABS ── */}
      <div className="max-w-7xl mx-auto w-full border-b border-[var(--border-color)]">
        <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSelectedChannel(null);
            }}
            className={`pb-2.5 text-sm sm:text-base transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-b-2 border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
                : 'border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('analyze');
              setSelectedChannel(null);
            }}
            className={`pb-2.5 text-sm sm:text-base transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'analyze'
                ? 'border-b-2 border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
                : 'border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            Analyze Video
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('channels');
              setSelectedChannel(null);
            }}
            className={`pb-2.5 text-sm sm:text-base transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'channels'
                ? 'border-b-2 border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
                : 'border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            Track Channels
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="max-w-7xl mx-auto w-full pb-16">
        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: ALL VIDEOS (PURE PINTEREST MASONRY GRID) */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'all' && (
          <div className="space-y-4 pt-1">
            {isLoading ? (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="h-80 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 animate-pulse flex flex-col justify-between break-inside-avoid"
                  >
                    <div className="space-y-3">
                      <div className="w-full h-44 rounded-xl bg-[var(--pill-bg)]" />
                      <div className="w-3/4 h-4 rounded bg-[var(--pill-bg)]" />
                    </div>
                    <div className="w-full h-6 rounded bg-[var(--pill-bg)]" />
                  </div>
                ))}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {searchQuery || platformFilter !== 'all' ? 'No matching videos' : 'No videos found'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Try another search query or paste a URL in the Analyze tab.
                </p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
                {filteredAssets.map((asset, idx) => (
                  <PinterestVideoCard
                    key={asset.id || idx}
                    asset={asset}
                    onSelect={(selected) => setSelectedAsset(selected)}
                    aspectRatio={idx % 3 === 0 ? 'vertical' : idx % 2 === 0 ? 'portrait' : 'standard'}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: ANALYZE VIDEO (URL BANNER + PINTEREST GRID BELOW) */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'analyze' && (
          <div className="space-y-6 pt-1">
            {/* Clean Rounded URL Input Container */}
            <VideoAnalyzerInput
              isAnalyzing={isAnalyzing}
              analysisStage={analysisStage}
              analysisProgress={analysisProgress}
              error={error}
              onAnalyze={analyzeVideoUrl}
              checkExistingVideo={checkExistingVideo}
              onSelectExistingAsset={(asset) => setSelectedAsset(asset)}
            />

            {/* Pinterest Grid of Previously Analyzed Videos */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-80 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 animate-pulse flex flex-col justify-between break-inside-avoid"
                    >
                      <div className="space-y-3">
                        <div className="w-full h-44 rounded-xl bg-[var(--pill-bg)]" />
                        <div className="w-3/4 h-4 rounded bg-[var(--pill-bg)]" />
                      </div>
                      <div className="w-full h-6 rounded bg-[var(--pill-bg)]" />
                    </div>
                  ))}
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-[var(--text-secondary)]">
                  Paste a link above to analyze your first video.
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
                  {filteredAssets.map((asset, idx) => (
                    <PinterestVideoCard
                      key={asset.id || idx}
                      asset={asset}
                      onSelect={(selected) => setSelectedAsset(selected)}
                      aspectRatio={idx % 3 === 0 ? 'vertical' : idx % 2 === 0 ? 'portrait' : 'standard'}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: TRACK CHANNELS (CHANNEL URL BANNER + CHANNELS / DECK) */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'channels' && (
          <div className="space-y-6 pt-1">
            {selectedChannel ? (
              <ChannelVideoDeck
                account={selectedChannel}
                videos={filteredAssets}
                onBack={() => setSelectedChannel(null)}
                onSelectVideo={(asset) => setSelectedAsset(asset)}
              />
            ) : (
              <SocialAccountsTab
                onAddSuccess={() => refetch()}
                onSelectAccount={(account) => setSelectedChannel(account)}
              />
            )}
          </div>
        )}

        {/* ── MODAL INSPECTOR ── */}
        <VideoAnalysisModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      </div>
    </div>
  );
}
