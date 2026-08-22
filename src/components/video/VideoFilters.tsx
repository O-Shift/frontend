// oshift/src/components/video/VideoFilters.tsx
'use client';

import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Building2,
  Sparkles,
  X,
} from 'lucide-react';
import type { Competitor } from '@/lib/api';
import type { VideoSortKey } from '@/hooks/use-videos';

interface VideoFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  platformFilter: string;
  setPlatformFilter: (platform: string) => void;
  competitorFilter: string;
  setCompetitorFilter: (comp: string) => void;
  tagFilter: string;
  setTagFilter: (tag: string) => void;
  minHookScore: number;
  setMinHookScore: (score: number) => void;
  sortBy: VideoSortKey;
  setSortBy: (sort: VideoSortKey) => void;
  competitors: Competitor[];
  allTags: string[];
  totalResults: number;
}

const PLATFORMS = [
  { id: 'all', label: 'All' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Reels' },
  { id: 'youtube', label: 'YouTube' },
];

const SCORE_THRESHOLDS = [
  { value: 0, label: 'Any Score' },
  { value: 60, label: '60+ Score' },
  { value: 75, label: '75+ High' },
  { value: 85, label: '85+ Elite' },
];

export default function VideoFilters({
  searchQuery,
  setSearchQuery,
  platformFilter,
  setPlatformFilter,
  competitorFilter,
  setCompetitorFilter,
  minHookScore,
  setMinHookScore,
  sortBy,
  setSortBy,
  competitors = [],
  totalResults = 0,
}: VideoFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    platformFilter !== 'all' ||
    competitorFilter !== 'all' ||
    minHookScore > 0 ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setPlatformFilter('all');
    setCompetitorFilter('all');
    setMinHookScore(0);
    setSortBy('newest');
  };

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* ── PINTEREST TOP SEARCH BAR ── */}
      <div className="relative w-full flex items-center">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--text-secondary)]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="w-full pl-11 pr-24 py-3 rounded-full border border-[var(--border-color)] bg-[var(--card-bg-alt)] hover:bg-[var(--card-bg)] focus:bg-[var(--card-bg)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-color)] transition-all shadow-inner"
        />

        <div className="absolute inset-y-0 right-3 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-full border transition-all cursor-pointer ${
              showFilters || hasActiveFilters
                ? 'border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--card-bg)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── EXPANDABLE INLINE FILTER POPOVER ── */}
      {showFilters && (
        <div className="p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-md flex flex-col gap-2.5 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Platform pills */}
            <div className="flex items-center gap-1">
              {PLATFORMS.map((p) => {
                const active = platformFilter === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatformFilter(p.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-[var(--text-primary)] text-[var(--card-bg)]'
                        : 'bg-[var(--pill-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Reset */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[var(--border-color)]">
            {/* Competitor Dropdown */}
            <div className="relative">
              <select
                value={competitorFilter}
                onChange={(e) => setCompetitorFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="all">All Competitors</option>
                {competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Score Dropdown */}
            <div className="relative">
              <select
                value={minHookScore}
                onChange={(e) => setMinHookScore(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs text-[var(--text-primary)] focus:outline-none"
              >
                {SCORE_THRESHOLDS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as VideoSortKey)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="hook_score">Hook Score</option>
                <option value="retention_score">Retention Rate</option>
                <option value="viral_score">Viral Match</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
