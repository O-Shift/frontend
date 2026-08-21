// oshift/src/hooks/use-videos.ts
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  getVideoAssets,
  getVideoAsset,
  lookupVideo,
  collectVideo,
  downloadVideo as downloadVideoApi,
  getCompetitors,
  type Competitor,
} from '@/lib/api';
import type {
  VideoAsset,
  VideoCollectResult,
  VideoDownloadResponse,
} from '@/types/entities';

export type AnalysisStage =
  | 'idle'
  | 'validating'
  | 'downloading'
  | 'analyzing'
  | 'complete'
  | 'error';

export interface VideoStats {
  totalVideos: number;
  analyzedVideos: number;
  topViralPattern: string;
  topViralPatternCount: number;
  topViralPatternPct: number;
  topHookStrategy: string;
  topHookScore: number | null;
  topPerformer: VideoAsset | null;
  topPerformerScore: number | null;
  soundlessPct: number;
  sortedTags: Array<{ tag: string; count: number; pct: number }>;
  allTags: string[];
  topDropoffRisk: string | null;
}

export type VideoSortKey = 'newest' | 'hook_score' | 'retention_score' | 'viral_score' | 'duration';

export function useVideos() {
  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<VideoAsset | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>('idle');
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Filters and Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [competitorFilter, setCompetitorFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [minHookScore, setMinHookScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<VideoSortKey>('newest');

  // Load all assets and competitors
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assetsRes, compsRes] = await Promise.all([
        getVideoAssets(),
        getCompetitors(),
      ]);

      if (assetsRes.ok && Array.isArray(assetsRes.data)) {
        setAssets(assetsRes.data);
      } else if (!assetsRes.ok) {
        setAssets([]);
        setError(assetsRes.error);
      } else {
        setAssets([]);
        setError('Video library returned an invalid response');
      }

      if (compsRes.ok && Array.isArray(compsRes.data)) {
        setCompetitors(compsRes.data);
      } else if (!compsRes.ok && !assetsRes.ok) {
        setError(`${assetsRes.error}; ${compsRes.error}`);
      } else if (!compsRes.ok) {
        setError(compsRes.error);
      }
    } catch (err: unknown) {
      setAssets([]);
      setError(err instanceof Error ? err.message : 'Failed to load video library');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch; setState fires from async loader after awaits
    fetchData();
  }, [fetchData]);

  // Check if a video URL was already analyzed in this workspace
  const checkExistingVideo = useCallback(
    async (videoUrl: string): Promise<VideoAsset | null> => {
      const cleanUrl = videoUrl.trim().toLowerCase();
      // 1. First check in-memory loaded assets
      const localMatch = assets.find((a) => {
        const aUrl = a.url.toLowerCase();
        return aUrl === cleanUrl || (cleanUrl.length > 15 && aUrl.includes(cleanUrl)) || (aUrl.length > 15 && cleanUrl.includes(aUrl));
      });
      if (localMatch && localMatch.analysis) {
        return localMatch;
      }

      // 2. Query backend lookup
      try {
        const res = await lookupVideo(videoUrl);
        if (res.ok && res.data && res.data.exists && res.data.asset) {
          return res.data.asset;
        }
      } catch {
        // Fall through
      }
      return null;
    },
    [assets]
  );

  // Trigger analysis for a video URL
  const analyzeVideoUrl = useCallback(
    async (
      videoUrl: string,
      competitorId?: string,
      apiKey?: string,
      forceRefresh: boolean = false
    ): Promise<VideoCollectResult | null> => {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisStage('validating');
      setAnalysisProgress('Validating video URL & security policies...');

      try {
        setAnalysisStage('downloading');
        setAnalysisProgress('Extracting video stream (TikTok / Instagram / YouTube)...');

        setAnalysisStage('analyzing');
        setAnalysisProgress(
          forceRefresh
            ? 'Re-running Gemini Vision multimodal analysis from scratch...'
            : 'Gemini Vision inspecting audio, pacing, hooks & inferring brand signals...'
        );

        const res = await collectVideo({
          competitor_id: competitorId || undefined,
          video_url: videoUrl,
          api_key: apiKey,
          force_refresh: forceRefresh,
        });

        if (res.ok && res.data && res.data.status !== 'failed') {
          setAnalysisStage('complete');
          setAnalysisProgress('Analysis successfully completed and saved!');

          // Refresh the asset library
          await fetchData();

          if (res.data.asset_id) {
            const single = await getVideoAsset(res.data.asset_id);
            if (single.ok && single.data) {
              setSelectedAsset(single.data);
            }
          }
          return res.data;
        } else {
          setAnalysisStage('error');
          const errMsg = res.ok
            ? res.data?.error || 'Analysis failed'
            : res.error;
          setError(errMsg);
          setAnalysisProgress(`Failed: ${errMsg}`);
          return null;
        }
      } catch (err: unknown) {
        setAnalysisStage('error');
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errMsg);
        setAnalysisProgress(`Failed: ${errMsg}`);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [fetchData]
  );

  // Independent download helper
  const downloadVideo = useCallback(
    async (videoUrl: string): Promise<VideoDownloadResponse | null> => {
      try {
        const res = await downloadVideoApi({ video_url: videoUrl });
        if (res.ok && res.data) {
          return res.data;
        }
        setError(!res.ok ? res.error : 'Download failed');
        return null;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Download failed');
        return null;
      }
    },
    []
  );

  // Filtered & Sorted assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter((asset) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = asset.title?.toLowerCase().includes(q);
          const matchUrl = asset.url.toLowerCase().includes(q);
          const matchComp = asset.competitor_name?.toLowerCase().includes(q);
          const matchSummary =
            asset.analysis?.summary?.toLowerCase().includes(q);
          const matchHook = asset.analysis?.hook?.toLowerCase().includes(q);
          if (
            !matchTitle &&
            !matchUrl &&
            !matchComp &&
            !matchSummary &&
            !matchHook
          ) {
            return false;
          }
        }

        if (platformFilter !== 'all') {
          const plat = (asset.platform || '').toLowerCase();
          if (!plat.includes(platformFilter.toLowerCase())) return false;
        }

        if (competitorFilter !== 'all') {
          if (asset.competitor_id !== competitorFilter) return false;
        }

        if (tagFilter !== 'all') {
          const tags = asset.analysis?.viral_formula_tags || [];
          if (!tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase())) {
            return false;
          }
        }

        if (minHookScore > 0) {
          const score =
            asset.analysis?.final_scores_out_of_100?.hook_score || 0;
          if (score < minHookScore) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return (
            new Date(b.captured_at).getTime() -
            new Date(a.captured_at).getTime()
          );
        }
        if (sortBy === 'hook_score') {
          const sa = a.analysis?.final_scores_out_of_100?.hook_score || 0;
          const sb = b.analysis?.final_scores_out_of_100?.hook_score || 0;
          return sb - sa;
        }
        if (sortBy === 'retention_score') {
          const sa = a.analysis?.final_scores_out_of_100?.retention_score || 0;
          const sb = b.analysis?.final_scores_out_of_100?.retention_score || 0;
          return sb - sa;
        }
        if (sortBy === 'viral_score') {
          const sa =
            a.analysis?.final_scores_out_of_100
              ?.overall_viral_pattern_similarity_score || 0;
          const sb =
            b.analysis?.final_scores_out_of_100
              ?.overall_viral_pattern_similarity_score || 0;
          return sb - sa;
        }
        if (sortBy === 'duration') {
          return (b.duration_s || 0) - (a.duration_s || 0);
        }
        return 0;
      });
  }, [
    assets,
    searchQuery,
    platformFilter,
    competitorFilter,
    tagFilter,
    minHookScore,
    sortBy,
  ]);

  // Aggregate Strategic Intelligence & Viral Patterns
  const stats: VideoStats = useMemo(() => {
    const total = assets.length;
    const withAnalysis = assets.filter((a) => a.analysis);

    const tagCounts: Record<string, number> = {};
    let topPerformer: VideoAsset | null = null;
    let highestViralScore = -1;
    let highestHookAsset: VideoAsset | null = null;
    let highestHookScore = -1;
    let soundlessCount = 0;
    const allDropoffRisks: string[] = [];

    for (const a of withAnalysis) {
      const scores = a.analysis?.final_scores_out_of_100;
      const vScore =
        scores?.overall_viral_pattern_similarity_score ?? scores?.hook_score ?? 0;
      const hScore = scores?.hook_score ?? 0;

      if (vScore > highestViralScore) {
        highestViralScore = vScore;
        topPerformer = a;
      }

      if (hScore > highestHookScore) {
        highestHookScore = hScore;
        highestHookAsset = a;
      }

      if (a.analysis?.hook_analysis?.understandable_without_sound) {
        soundlessCount++;
      }

      for (const tag of a.analysis?.viral_formula_tags || []) {
        const clean = tag.trim();
        if (clean) {
          tagCounts[clean] = (tagCounts[clean] || 0) + 1;
        }
      }

      for (const r of a.analysis?.attention_pattern?.retention_risks || []) {
        if (r && !allDropoffRisks.includes(r)) allDropoffRisks.push(r);
      }
    }

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({
        tag,
        count,
        pct: withAnalysis.length ? Math.round((count / withAnalysis.length) * 100) : 0,
      }));

    let topTag = 'N/A';
    let maxTagCount = 0;
    if (sortedTags.length > 0) {
      topTag = sortedTags[0].tag;
      maxTagCount = sortedTags[0].count;
    }

    const hookTypes = (highestHookAsset as VideoAsset | null)?.analysis?.hook_analysis?.hook_types;
    const hookText = (highestHookAsset as VideoAsset | null)?.analysis?.hook;
    const topHookType =
      hookTypes && hookTypes.length > 0
        ? hookTypes[0]
        : hookText
          ? hookText.length > 40
            ? hookText.slice(0, 38) + '...'
            : hookText
          : 'Pattern Interrupt';

    const soundlessPct = withAnalysis.length
      ? Math.round((soundlessCount / withAnalysis.length) * 100)
      : 0;

    return {
      totalVideos: total,
      analyzedVideos: withAnalysis.length,
      topViralPattern: topTag,
      topViralPatternCount: maxTagCount,
      topViralPatternPct: withAnalysis.length
        ? Math.round((maxTagCount / withAnalysis.length) * 100)
        : 0,
      topHookStrategy: topHookType,
      topHookScore: highestHookScore >= 0 ? highestHookScore : null,
      topPerformer,
      topPerformerScore: highestViralScore >= 0 ? highestViralScore : null,
      soundlessPct,
      sortedTags,
      allTags: sortedTags.map((t) => t.tag),
      topDropoffRisk: allDropoffRisks[0] || null,
    };
  }, [assets]);

  return {
    assets,
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
    refetch: fetchData,
    analyzeVideoUrl,
    downloadVideo,
    checkExistingVideo,
  };
}
