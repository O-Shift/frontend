'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    addWatchlistItem,
    createWatchlist,
    fetchWatchlist,
    fetchWatchlists,
    removeWatchlistItem,
    resolveWorkspaceId,
    type WatchlistItem,
} from '@/lib/api';
import { extractDomain } from '@/lib/utils/domain';

/** Name given to the watchlist this provider creates on the first pin. */
const DEFAULT_WATCHLIST_NAME = 'Pinned competitors';

export interface PinnedCompetitor {
    /**
     * competitors.competitors.id. Every watchlist endpoint is keyed on this;
     * `domain` is only a display/route concern.
     */
    competitor_id: string;
    /** Bare hostname derived from the competitor's website. '' when it has none. */
    domain: string;
    name: string;
    logo: string;
    /**
     * Not backed by any column: nothing in the database records unread news per
     * competitor. Kept so the sidebar's badge markup still type-checks, and
     * pinned to false rather than given an invented value.
     */
    hasNews: boolean;
}

/**
 * Membership is keyed on `competitor_id`, never on `domain`.
 *
 * extractDomain() answers '' for a competitor with no website, so every
 * websiteless competitor in a workspace shares the key ''. Keyed on domain,
 * isPinned('') would report all of them pinned as soon as any one of them was,
 * and unpin('') would delete whichever happened to sit first in the array
 * rather than the one the user asked to remove. competitor_id is unique, and it
 * is already what pin() dedupes on and what every watchlist endpoint takes — so
 * keying on it removes a translation step instead of adding one. `domain` stays
 * on PinnedCompetitor as the display/route concern it is.
 */
interface PinnedContextType {
    pinned: PinnedCompetitor[];
    /** Persists to the watchlist. Resolves false when the write failed. */
    pin: (comp: PinnedCompetitor) => Promise<boolean>;
    /** Takes a competitor_id. Persists. Resolves false when the write failed. */
    unpin: (competitorId: string) => Promise<boolean>;
    /** Takes a competitor_id, not a domain. */
    isPinned: (competitorId: string) => boolean;
    loading: boolean;
    /** Last read/write failure. Never thrown — the sidebar must still render. */
    error: string | null;
}

const PinnedContext = createContext<PinnedContextType | undefined>(undefined);

function toPinned(item: WatchlistItem): PinnedCompetitor {
    const domain = extractDomain(item.website ?? '');
    return {
        competitor_id: item.competitor_id,
        domain,
        name: item.name || domain || 'Unnamed competitor',
        logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        hasNews: false,
    };
}

export function PinnedProvider({ children }: { children: ReactNode }) {
    const [pinned, setPinned] = useState<PinnedCompetitor[]>([]);
    const [watchlistId, setWatchlistId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Guards against two rapid pins each creating a watchlist before the first
    // POST has resolved and populated `watchlistId`.
    const creating = useRef<Promise<string | null> | null>(null);

    const loadWatchlist = useCallback(async () => {
        const workspaceId = await resolveWorkspaceId();
        if (!workspaceId) {
            setLoading(false);
            return;
        }

        const listRes = await fetchWatchlists();
        if (!listRes.ok) {
            // Unauthenticated state on cold-start is normal before login / session init;
            // do not display a fatal banner unless an explicit action failed.
            if (listRes.status !== 401 && listRes.error !== 'Not signed in') {
                setError(listRes.error);
            }
            setLoading(false);
            return;
        }

        setError(null);
        const list = listRes.data?.[0] ?? null;
        if (!list) {
            setPinned([]);
            setWatchlistId(null);
            setLoading(false);
            return;
        }

        setWatchlistId(list.id);

        const detailRes = await fetchWatchlist(list.id);
        if (!detailRes.ok) {
            if (detailRes.status !== 401 && detailRes.error !== 'Not signed in') {
                setError(detailRes.error);
            }
            setLoading(false);
            return;
        }

        setPinned((detailRes.data?.items ?? []).map(toPinned));
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadWatchlist();

        const supabase = createClient();
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event: string, session: { access_token?: string } | null) => {
            if (event === 'SIGNED_OUT') {
                setPinned([]);
                setWatchlistId(null);
                setError(null);
                setLoading(false);
            } else if (session?.access_token) {
                void loadWatchlist();
            }
        });

        const handleWorkspaceChange = () => {
            void loadWatchlist();
        };

        window.addEventListener('oshift:workspace-changed', handleWorkspaceChange);
        window.addEventListener('storage', handleWorkspaceChange);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('oshift:workspace-changed', handleWorkspaceChange);
            window.removeEventListener('storage', handleWorkspaceChange);
        };
    }, [loadWatchlist]);

    /** Resolves the default watchlist id, finding or creating the row on first use. */
    const ensureWatchlist = useCallback(async (): Promise<string | null> => {
        if (watchlistId) return watchlistId;
        if (!creating.current) {
            creating.current = (async () => {
                // First verify if a watchlist already exists in the backend
                const listRes = await fetchWatchlists();
                if (listRes.ok && listRes.data && listRes.data.length > 0) {
                    const existingId = listRes.data[0].id;
                    setWatchlistId(existingId);
                    return existingId;
                }

                const res = await createWatchlist(DEFAULT_WATCHLIST_NAME);
                if (!res.ok) {
                    setError(res.error);
                    return null;
                }
                const id = res.data?.id ?? null;
                setWatchlistId(id);
                return id;
            })();
        }
        try {
            return await creating.current;
        } finally {
            creating.current = null;
        }
    }, [watchlistId]);

    const pin = useCallback(
        async (comp: PinnedCompetitor): Promise<boolean> => {
            if (pinned.some(p => p.competitor_id === comp.competitor_id)) return true;

            // Optimistic: the sidebar updates now, and rolls back below if the
            // write fails, so it never shows a pin the server does not hold.
            setPinned(prev =>
                prev.some(p => p.competitor_id === comp.competitor_id)
                    ? prev
                    : [...prev, { ...comp, hasNews: false }],
            );
            setError(null);

            const rollback = () =>
                setPinned(prev => prev.filter(p => p.competitor_id !== comp.competitor_id));

            const listId = await ensureWatchlist();
            if (!listId) {
                rollback();
                return false;
            }

            const res = await addWatchlistItem(listId, comp.competitor_id);
            if (!res.ok) {
                setError(res.error);
                rollback();
                return false;
            }
            return true;
        },
        [pinned, ensureWatchlist],
    );

    const unpin = useCallback(
        async (competitorId: string): Promise<boolean> => {
            const index = pinned.findIndex(p => p.competitor_id === competitorId);
            if (index === -1) return true;
            const target = pinned[index];

            setPinned(prev => prev.filter(p => p.competitor_id !== target.competitor_id));
            setError(null);

            // Awaits an in-flight create so an unpin issued right after the very
            // first pin still deletes; it never creates a watchlist itself.
            const listId = watchlistId ?? (await creating.current);
            // Nothing was ever persisted, so there is nothing to delete.
            if (!listId) return true;

            const res = await removeWatchlistItem(listId, target.competitor_id);
            // 404 means the row is already gone, which is the state we wanted.
            if (!res.ok && res.status !== 404) {
                setError(res.error);
                // Restore at its old position: a failed delete that leaves the
                // item hidden looks like data loss that never happened.
                setPinned(prev => {
                    if (prev.some(p => p.competitor_id === target.competitor_id)) return prev;
                    const next = [...prev];
                    next.splice(Math.min(index, next.length), 0, target);
                    return next;
                });
                return false;
            }
            return true;
        },
        [pinned, watchlistId],
    );

    const isPinned = useCallback(
        (competitorId: string) => pinned.some(p => p.competitor_id === competitorId),
        [pinned],
    );

    const value = useMemo(
        () => ({ pinned, pin, unpin, isPinned, loading, error }),
        [pinned, pin, unpin, isPinned, loading, error],
    );

    return <PinnedContext.Provider value={value}>{children}</PinnedContext.Provider>;
}

export function usePinned() {
    const context = useContext(PinnedContext);
    if (context === undefined) {
        throw new Error('usePinned must be used within a PinnedProvider');
    }
    return context;
}
