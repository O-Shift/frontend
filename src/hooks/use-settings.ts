'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export interface Member {
  id: string;
  workspace_id: string;
  user_id: string;
  email: string;
  status: string;
  roles: string[];
}

export interface Invitation {
  id: string;
  workspace_id: string;
  email: string;
  role_name: string;
  status: string;
}

export interface UnifiedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  access: string;
  status: string;
}

export interface Rail<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

const emptyRail = <T,>(): Rail<T> => ({ items: [], loading: true, error: null });

export interface FeatureFlag {
  name: string;
  enabled: boolean;
}

export interface SettingsData {
  users: Rail<UnifiedUser>;
  featureFlags: Rail<FeatureFlag>;
  refreshing: boolean;
  refresh: () => void;
  updateFeatureFlag: (name: string, enabled: boolean) => Promise<{ error?: string }>;
}

export async function fetchMembers(workspaceId: string) {
  return apiFetch<Member[]>(`/core/workspaces/${workspaceId}/members`);
}

export async function fetchInvitations(workspaceId: string) {
  return apiFetch<Invitation[]>(`/core/workspaces/${workspaceId}/invitations`);
}

export async function fetchFeatureFlags(workspaceId: string) {
  return apiFetch<FeatureFlag[]>(`/core/workspaces/${workspaceId}/feature-flags`);
}

export function useSettings(): SettingsData {
  const [users, setUsers] = useState<Rail<UnifiedUser>>(emptyRail);
  const [featureFlags, setFeatureFlags] = useState<Rail<FeatureFlag>>(emptyRail);
  const [refreshing, setRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const updateFeatureFlag = useCallback(async (name: string, enabled: boolean) => {
    const workspaceId = typeof window !== 'undefined' ? sessionStorage.getItem('oshift.workspace_id') : null;
    if (!workspaceId) return { error: 'No workspace' };
    const res = await apiFetch<void>(`/core/workspaces/${workspaceId}/feature-flags/${name}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled })
    });
    if (res.ok) {
      refresh();
      return {};
    }
    return { error: res.error || 'Failed to update feature flag' };
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const workspaceId = typeof window !== 'undefined' ? sessionStorage.getItem('oshift.workspace_id') : null;
      if (!workspaceId) {
        if (!cancelled) {
          setUsers({ items: [], loading: false, error: 'No workspace selected' });
        }
        return;
      }

      setRefreshing(true);
      setUsers((r) => ({ ...r, loading: true }));
      setFeatureFlags((r) => ({ ...r, loading: true }));

      const [membersRes, invitesRes, flagsRes] = await Promise.all([
        fetchMembers(workspaceId),
        fetchInvitations(workspaceId),
        fetchFeatureFlags(workspaceId)
      ]);

      if (cancelled) return;

      if (!membersRes.ok && !invitesRes.ok) {
        setUsers({ items: [], loading: false, error: membersRes.error || invitesRes.error || 'Failed to fetch users' });
      }

      if (flagsRes.ok) {
        setFeatureFlags({ items: flagsRes.data || [], loading: false, error: null });
      } else {
        setFeatureFlags({ items: [], loading: false, error: flagsRes.error || 'Failed to fetch Feature flags' });
      }

      const unified: UnifiedUser[] = [];

      if (membersRes.ok && membersRes.data) {
        for (const m of membersRes.data) {
          const role = m.roles && m.roles.length > 0 ? m.roles[0] : 'Member';
          unified.push({
            id: m.id,
            name: m.email.split('@')[0],
            email: m.email,
            role: role.charAt(0).toUpperCase() + role.slice(1),
            access: role === 'owner' || role === 'admin' ? 'All Pages' : 'Dashboard Only',
            status: m.status === 'active' ? 'Active' : 'Pending'
          });
        }
      }

      if (invitesRes.ok && invitesRes.data) {
        for (const i of invitesRes.data) {
          unified.push({
            id: i.id,
            name: i.email.split('@')[0],
            email: i.email,
            role: i.role_name.charAt(0).toUpperCase() + i.role_name.slice(1),
            access: i.role_name === 'admin' ? 'All Pages' : 'Dashboard Only',
            status: 'Pending'
          });
        }
      }

      setUsers({ items: unified, loading: false, error: null });
      setRefreshing(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return {
    users,
    featureFlags,
    refreshing,
    refresh,
    updateFeatureFlag
  };
}
