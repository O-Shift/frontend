// oshift/src/components/video/VideoFilters.tsx
'use client';

import React from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Tag,
  Sparkles,
  X,
} from 'lucide-react';
import type { Competitor } from '@/lib/api';

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
  sortBy: string;
  setSortBy: (sort: any) => void;
  competitors: Competitor[];
  allTags: string[];
  totalResults: number;
}

const PLATFORMS = [
  { id: 'all', label: 'All Platforms' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram Reels' },
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
  tagFilter,
  setTagFilter,
  minHookScore,
  setMinHookScore,
  sortBy,
  setSortBy,
  competitors = [],
  allTags = [],
  totalResults = 0,
}: VideoFiltersProps) {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    platformFilter !== 'all' ||
    competitorFilter !== 'all' ||
    tagFilter !== 'all' ||
    minHookScore > 0 ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setPlatformFilter('all');
    setCompetitorFilter('all');
    setTagFilter('all');
    setMinHookScore(0);
    setSortBy('newest');
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      {/* Top Filter Bar: Search, Competitor, Platform, Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hooks, topics, creators..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Competitor Selector */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <select
            value={competitorFilter}
            onChange={(e) => setCompetitorFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Competitors</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Min Score Selector */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <select
            value={minHookScore}
            onChange={(e) => setMinHookScore(Number(e.target.value))}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            {SCORE_THRESHOLDS.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="newest">Sort: Newest Captured</option>
            <option value="hook_score">Sort: Hook Power (High to Low)</option>
            <option value="retention_score">Sort: Retention Rate</option>
            <option value="viral_score">Sort: Overall Viral Score</option>
            <option value="duration">Sort: Longest Runtime</option>
          </select>
        </div>
      </div>

      {/* Second Row: Platform Tabs & Viral Tag Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
        {/* Platform Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {PLATFORMS.map((p) => {
            const active = platformFilter === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatformFilter(p.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--pill-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover-alt)]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Total Results & Reset button */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] ml-auto">
          <span>
            Showing <strong className="text-[var(--text-primary)]">{totalResults}</strong> videos
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-[var(--accent)] hover:underline cursor-pointer font-medium"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Viral Formula Tag Filters (if any exist) */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3" />
            Viral Formulas:
          </span>
          <button
            type="button"
            onClick={() => setTagFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 cursor-pointer ${
              tagFilter === 'all'
                ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40 font-bold'
                : 'bg-[var(--pill-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Tags
          </button>
          {allTags.map((tag) => {
            const active = tagFilter.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setTagFilter(active ? 'all' : tag)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40 font-bold'
                    : 'bg-[var(--pill-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
