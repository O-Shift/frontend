import { useState, useEffect } from 'react';
import { apiFetch, InsightGap, SenseReview, Campaign, fetchGaps, fetchReviews, fetchCampaigns } from '@/lib/api';

export interface Competitor {
  id: string;
  workspace_id: string;
  name: string;
  website: string;
  description: string;
  founding_year: number;
  market_valuation_usd: number;
  industry: string;
  metadata?: any;
}

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface AggregatedMetrics {
  competitor_id: string;
  metric: string;
  range: string;
  granularity: string;
  points: MetricPoint[];
}

export function useCompany(domain: string) {
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<{
    share: AggregatedMetrics | null;
    engagement: AggregatedMetrics | null;
    time: AggregatedMetrics | null;
  }>({ share: null, engagement: null, time: null });

  const [gaps, setGaps] = useState<InsightGap[]>([]);
  const [reviews, setReviews] = useState<SenseReview[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<Competitor[]>('/competitors');
        if (!res.ok) throw new Error(res.error);
        
        let comp = res.data.find(c => c.website && c.website.toLowerCase().includes(domain.toLowerCase()));
        if (!comp) {
          setError('Not Found');
          setLoading(false);
          return;
        }
        
        if (comp) {
          setCompetitor(comp);
          const cid = comp.id;
          
          const [shareRes, engRes, scoreRes, gapsRes, reviewsRes, campRes] = await Promise.all([
            apiFetch<AggregatedMetrics>(`/competitors/${cid}/signals/aggregated?metric=market_share&range=6m&granularity=month`),
            apiFetch<AggregatedMetrics>(`/competitors/${cid}/signals/aggregated?metric=engagement&range=6m&granularity=month`),
            apiFetch<AggregatedMetrics>(`/competitors/${cid}/signals/aggregated?metric=score&range=6m&granularity=month`),
            fetchGaps({ competitor_id: cid, layer: 'gap' }),
            fetchReviews({ competitor_id: cid }),
            fetchCampaigns({ competitor_id: cid })
          ]);
          
          setMetrics({
            share: shareRes.ok ? shareRes.data : null,
            engagement: engRes.ok ? engRes.data : null,
            time: scoreRes.ok ? scoreRes.data : null,
          });
          
          if (gapsRes.ok) setGaps(gapsRes.data);
          if (reviewsRes.ok) setReviews(reviewsRes.data);
          if (campRes.ok) setCampaigns(campRes.data);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading company');
      } finally {
        setLoading(false);
      }
    }
    
    if (domain) {
      load();
    }
  }, [domain]);

  return { competitor, loading, error, metrics, gaps, reviews, campaigns };
}
