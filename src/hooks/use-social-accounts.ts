// oshift/src/hooks/use-social-accounts.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
  SocialAccount,
  SocialAccountCreate,
  SocialAccountUpdate,
  CollectTriggerResponse,
  CollectOneResponse,
} from '@/types/entities';

export function useSocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectStats, setCollectStats] = useState<CollectTriggerResponse | CollectOneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts list
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    const res = await apiFetch<SocialAccount[]>('/social/accounts');
    if (res.ok) {
      setAccounts(res.data);
    } else {
      setError(res.error);
    }
    setIsLoading(false);
  }, []);

  // Create account
  const createAccount = useCallback(async (payload: SocialAccountCreate) => {
    setError(null);
    const res = await apiFetch<SocialAccount>('/social/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setAccounts((prev) => [res.data, ...prev]);
      return res.data;
    } else {
      setError(res.error);
      return null;
    }
  }, []);

  // Update account
  const updateAccount = useCallback(async (id: string, payload: SocialAccountUpdate) => {
    setError(null);
    const res = await apiFetch<SocialAccount>(`/social/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setAccounts((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      return res.data;
    } else {
      setError(res.error);
      return null;
    }
  }, []);

  // Delete account
  const deleteAccount = useCallback(async (id: string) => {
    setError(null);
    const res = await apiFetch<void>(`/social/accounts/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      return true;
    } else {
      setError(res.error);
      return false;
    }
  }, []);

  // Collect all social accounts
  const collectAll = useCallback(async (maxPosts = 50) => {
    setIsCollecting(true);
    setError(null);
    const res = await apiFetch<CollectTriggerResponse>(`/social/collect?max_posts=${maxPosts}`, {
      method: 'POST',
    });
    if (res.ok) {
      setCollectStats(res.data);
      setIsCollecting(false);
      return res.data;
    } else {
      setError(res.error);
      setIsCollecting(false);
      return null;
    }
  }, []);

  // Collect for single competitor
  const collectCompetitor = useCallback(async (competitorId: string, maxPosts = 50) => {
    setIsCollecting(true);
    setError(null);
    const res = await apiFetch<CollectOneResponse>(`/social/collect/${competitorId}?max_posts=${maxPosts}`, {
      method: 'POST',
    });
    if (res.ok) {
      setCollectStats(res.data);
      setIsCollecting(false);
      return res.data;
    } else {
      setError(res.error);
      setIsCollecting(false);
      return null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch; setState fires from async loader after awaits
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    isLoading,
    isCollecting,
    collectStats,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    collectAll,
    collectCompetitor,
    refreshAccounts: fetchAccounts,
  };
}
