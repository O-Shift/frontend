// oshift/src/hooks/use-dashboard.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  fetchCampaigns,
  fetchGaps,
  fetchOpportunities,
  fetchReviews,
  fetchWorkspaces,
  type Campaign,
  type InsightGap,
  type Opportunity,
  type SenseReview,
  type Workspace,
} from '@/lib/api';

/**
 * Per-rail state. An empty list after a successful fetch is a valid state
 * (the pipeline just hasn't produced rows yet) — it is not an error.
 */
export interface Rail<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

const emptyRail = <T,>(): Rail<T> => ({ items: [], loading: true, error: null });

export interface DashboardUser {
  name: string;
  email: string | null;
}

export interface DashboardData {
  opportunities: Rail<Opportunity>;
  opportunitiesTotal: number;
  gaps: Rail<InsightGap>;
  reviews: Rail<SenseReview>;
  campaigns: Rail<Campaign>;
  workspace: Workspace | null;
  user: DashboardUser | null;
  refreshing: boolean;
  refresh: () => void;
}

export function useDashboard(): DashboardData {
  const [opportunities, setOpportunities] = useState<Rail<Opportunity>>(emptyRail);
  const [opportunitiesTotal, setOpportunitiesTotal] = useState(0);
  const [gaps, setGaps] = useState<Rail<InsightGap>>(emptyRail);
  const [reviews, setReviews] = useState<Rail<SenseReview>>(emptyRail);
  const [campaigns, setCampaigns] = useState<Rail<Campaign>>(emptyRail);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Display name comes from the Supabase session, not the API.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await createClient().auth.getUser();
      if (cancelled || !data.user) return;
      const meta = data.user.user_metadata ?? {};
      const name =
        (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
        (typeof meta.name === 'string' && meta.name.trim()) ||
        data.user.email?.split('@')[0] ||
        'Your workspace';
      setUser({ name, email: data.user.email ?? null });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setRefreshing(true);
      setOpportunities((r) => ({ ...r, loading: true }));
      setGaps((r) => ({ ...r, loading: true }));
      setReviews((r) => ({ ...r, loading: true }));
      setCampaigns((r) => ({ ...r, loading: true }));

      // Each rail settles independently — one failing endpoint must not blank
      // the whole dashboard.
      const [oppRes, gapRes, revRes, campRes, wsRes] = await Promise.all([
        fetchOpportunities({ limit: 8 }),
        fetchGaps({ limit: 12 }),
        fetchReviews({ limit: 40 }),
        fetchCampaigns({ limit: 8 }),
        fetchWorkspaces(),
      ]);

      if (cancelled) return;

      if (oppRes.ok) {
        setOpportunities({ items: oppRes.data?.items ?? [], loading: false, error: null });
        setOpportunitiesTotal(oppRes.data?.total ?? oppRes.data?.items?.length ?? 0);
      } else {
        setOpportunities({ items: [], loading: false, error: oppRes.error });
      }

      setGaps(
        gapRes.ok
          ? { items: gapRes.data ?? [], loading: false, error: null }
          : { items: [], loading: false, error: gapRes.error },
      );

      setReviews(
        revRes.ok
          ? { items: revRes.data ?? [], loading: false, error: null }
          : { items: [], loading: false, error: revRes.error },
      );

      setCampaigns(
        campRes.ok
          ? { items: campRes.data ?? [], loading: false, error: null }
          : { items: [], loading: false, error: campRes.error },
      );

      if (wsRes.ok && Array.isArray(wsRes.data)) {
        const activeId =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('oshift.workspace_id')
            : null;
        setWorkspace(wsRes.data.find((w) => w.id === activeId) ?? wsRes.data[0] ?? null);
      }

      setRefreshing(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return {
    opportunities,
    opportunitiesTotal,
    gaps,
    reviews,
    campaigns,
    workspace,
    user,
    refreshing,
    refresh,
  };
}
