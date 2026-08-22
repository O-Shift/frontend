// oshift/src/hooks/use-workspaces.ts
'use client';

import { useCallback, useState } from 'react';
import { apiFetch, type ApiResult, type Workspace } from '@/lib/api';

/**
 * Workspace list state plus the writes /workspaces performs. Mirrors the
 * page's original semantics: the caller drives the initial `refetch` (the page
 * needs the result to auto-enter a lone workspace and fire load analytics),
 * a failed read empties the list and reports on `error`, and create is a
 * passthrough whose result the page turns into navigation or an error banner.
 */
export interface UseWorkspacesResult {
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  refetch: () => Promise<ApiResult<Workspace[]>>;
  createWorkspace: (name: string) => Promise<ApiResult<Workspace>>;
}

export function useWorkspaces(): UseWorkspacesResult {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<ApiResult<Workspace[]>> => {
    setIsLoading(true);
    setError(null);
    const res = await apiFetch<Workspace[]>('/core/workspaces', {
      skipWorkspace: true,
    });
    if (res.ok) {
      setWorkspaces(res.data);
    } else {
      setWorkspaces([]);
      setError(res.error);
    }
    setIsLoading(false);
    return res;
  }, []);

  const createWorkspace = useCallback(
    async (name: string): Promise<ApiResult<Workspace>> => {
      return apiFetch<Workspace>('/core/workspaces', {
        method: 'POST',
        skipWorkspace: true,
        body: JSON.stringify({ name }),
      });
    },
    []
  );

  return {
    workspaces,
    isLoading,
    error,
    setError,
    refetch,
    createWorkspace,
  };
}
