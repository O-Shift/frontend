// oshift/src/hooks/use-competitors.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  apiFetch,
  deleteCompetitor as deleteCompetitorApi,
  getCompetitor,
  getCompetitorAggregatedMetrics,
  getCompetitorCampaigns,
  getCompetitors,
  getInsightsGaps,
  getSenseReviews,
  type ApiResult,
  type AggregatedMetricPoint,
  type Campaign,
  type Competitor,
  type CompetitorCreatePayload,
  type InsightGap,
  type SenseReview,
} from '@/lib/api';

/**
 * List-level competitor data plus the CRUD writes the /competitors grid needs.
 * Mirrors the page's original semantics exactly: a failed list read keeps any
 * previously loaded competitors and reports on `error`; a successful delete
 * filters the in-memory list without a refetch.
 */
export function useCompetitors() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await getCompetitors();
    if (res.ok) {
      setCompetitors(res.data);
    } else {
      setError(res.error || 'Failed to fetch competitors');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch; setState fires from async loader after awaits
    refetch();
  }, [refetch]);

  const createCompetitor = useCallback(
    async (input: CompetitorCreatePayload): Promise<ApiResult<Competitor>> => {
      return apiFetch<Competitor>('/competitors', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          website: input.website,
          description: input.description,
        }),
      });
    },
    []
  );

  const removeCompetitor = useCallback(
    async (id: string): Promise<ApiResult<void>> => {
      const res = await deleteCompetitorApi(id);
      if (res.ok) {
        setCompetitors((prev) => prev.filter((c) => c.id !== id));
      }
      return res;
    },
    []
  );

  return {
    competitors,
    isLoading,
    error,
    refetch,
    createCompetitor,
    removeCompetitor,
  };
}

/** Some endpoints answer either a bare array or `{ [key]: [...] }`. */
function unwrapList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data !== null && typeof data === 'object' && key in data) {
    const value = (data as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

export interface CompetitorMetrics {
  share: AggregatedMetricPoint[];
  engagement: AggregatedMetricPoint[];
  sentiment: AggregatedMetricPoint[];
}

export interface CompetitorDetail {
  competitor: Competitor | null;
  isLoading: boolean;
  error: string | null;
  metrics: CompetitorMetrics;
  gaps: InsightGap[];
  campaigns: Campaign[];
  reviews: SenseReview[];
  refetch: () => Promise<void>;
}

const EMPTY_METRICS: CompetitorMetrics = { share: [], engagement: [], sentiment: [] };

/**
 * Everything /competitors/[id] loads in one pass. Only a failed competitor
 * lookup surfaces on `error` — metric/gap/campaign/review failures silently
 * leave their arrays empty, matching the page's original handling.
 */
export function useCompetitorDetail(competitorId: string): CompetitorDetail {
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<CompetitorMetrics>(EMPTY_METRICS);
  const [gaps, setGaps] = useState<InsightGap[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [reviews, setReviews] = useState<SenseReview[]>([]);

  const refetch = useCallback(async () => {
    if (!competitorId) return;
    setIsLoading(true);
    setError(null);

    const [compRes, msRes, engRes, sentRes, gapsRes, campRes, revRes] = await Promise.all([
      getCompetitor(competitorId),
      getCompetitorAggregatedMetrics(competitorId, 'market_share', '6m', 'month'),
      getCompetitorAggregatedMetrics(competitorId, 'engagement', '6m', 'month'),
      getCompetitorAggregatedMetrics(competitorId, 'sentiment', '6m', 'month'),
      getInsightsGaps(competitorId),
      getCompetitorCampaigns(competitorId),
      getSenseReviews(competitorId),
    ]);

    if (!compRes.ok) {
      setError(compRes.error || 'Failed to load competitor');
      setIsLoading(false);
      return;
    }

    setCompetitor(compRes.data);

    if (msRes.ok) setMetrics((prev) => ({ ...prev, share: msRes.data.points || [] }));
    if (engRes.ok) setMetrics((prev) => ({ ...prev, engagement: engRes.data.points || [] }));
    if (sentRes.ok) setMetrics((prev) => ({ ...prev, sentiment: sentRes.data.points || [] }));

    if (gapsRes.ok) setGaps(unwrapList<InsightGap>(gapsRes.data, 'gaps'));
    if (campRes.ok) setCampaigns(unwrapList<Campaign>(campRes.data, 'campaigns'));
    if (revRes.ok) setReviews(unwrapList<SenseReview>(revRes.data, 'reviews'));

    setIsLoading(false);
  }, [competitorId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch; setState fires from async loader after awaits
    refetch();
  }, [refetch]);

  return {
    competitor,
    isLoading,
    error,
    metrics,
    gaps,
    campaigns,
    reviews,
    refetch,
  };
}
