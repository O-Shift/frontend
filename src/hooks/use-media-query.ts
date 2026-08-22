// frontend/src/hooks/use-media-query.ts
'use client';

import { useCallback } from 'react';
import { useSyncExternalStore } from 'react';

const mqlCache = new Map<string, MediaQueryList>();

function getMql(query: string): MediaQueryList {
  let mql = mqlCache.get(query);
  if (!mql) {
    mql = window.matchMedia(query);
    mqlCache.set(query, mql);
  }
  return mql;
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = getMql(query);
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => getMql(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
