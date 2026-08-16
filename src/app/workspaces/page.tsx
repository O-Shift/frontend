'use client';

import { useMemo, useState, useEffect, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiArrowRight, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import {
  apiFetch,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  clearActiveWorkspaceId,
} from '@/lib/api';
import { sigilStyle, sigilInitials } from '@/lib/logos';
import { EVENTS, setWorkspaceContext, track } from '@/lib/analytics';
import { createClient } from '@/utils/supabase/client';

type Workspace = {
  id: string;
  name: string;
  timezone: string;
  locale: string;
  plan: string;
  created_at: string;
};

function destinationAfterSelection(): string {
  if (typeof window === 'undefined') return '/';
  const requested = new URLSearchParams(window.location.search).get('next');
  if (!requested || !requested.startsWith('/') || requested.startsWith('//')) return '/';
  if (requested === '/workspaces' || requested.startsWith('/workspaces?')) return '/';
  return requested;
}

/** "today" / "yesterday" / "3 days ago" / "12 Mar 2026" — created_at is the
 *  only temporal signal the list API gives us, and recency is what tells two
 *  same-named workspaces apart. */
function createdLabel(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return 'created today';
  if (days === 1) return 'created yesterday';
  if (days < 30) return `created ${days} days ago`;
  return `created ${then.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

/**
 * The workspace the app is currently pointed at.
 *
 * sessionStorage is an external store, not React state, so it is read through
 * useSyncExternalStore rather than copied into state by an effect. There is
 * nothing to subscribe to — only this page's own handlers write the key, and
 * they navigate away immediately — so subscribe is a no-op and the snapshot is
 * read once per render. The server snapshot is null because sessionStorage does
 * not exist during SSR; returning null there keeps the markup identical on both
 * sides and lets the badge appear on hydration.
 */
const noopSubscribe = () => () => {};

function useActiveWorkspaceId(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    getActiveWorkspaceId,
    () => null,
  );
}

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [query, setQuery] = useState('');
  const [entering, setEntering] = useState<string | null>(null);
  const currentId = useActiveWorkspaceId();

  // Loads once on mount. `loading` and `error` already start in the right
  // state, so nothing is set before the first await — an effect that sets
  // state synchronously would render twice before the request even leaves.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const res = await apiFetch<Workspace[]>('/core/workspaces', {
        skipWorkspace: true,
      });
      if (cancelled) return;

      if (!res.ok) {
        setError(res.error);
        setWorkspaces([]);
        setLoading(false);
        return;
      }

      setWorkspaces(res.data);
      track(EVENTS.WORKSPACES_LOADED, { count: res.data.length });
      // One workspace means there is nothing to choose. Skip the page rather
      // than asking a question with a single answer — this also matches the
      // backend, which auto-resolves a lone membership in require_role.
      if (res.data.length === 1) {
        setActiveWorkspaceId(res.data[0].id);
        setWorkspaceContext(res.data[0].id);
        track(EVENTS.WORKSPACE_SELECTED, { workspace_id: res.data[0].id, automatic: true });
        router.replace(destinationAfterSelection());
        return;
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter((ws) => ws.name.toLowerCase().includes(q));
  }, [workspaces, query]);

  const selectWorkspace = (id: string) => {
    if (entering) return;
    setEntering(id);
    setActiveWorkspaceId(id);
    setWorkspaceContext(id);
    track(EVENTS.WORKSPACE_SELECTED, { workspace_id: id, automatic: false });
    router.replace(destinationAfterSelection());
  };

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    setError(null);
    const res = await apiFetch<Workspace>('/core/workspaces', {
      method: 'POST',
      skipWorkspace: true,
      body: JSON.stringify({ name }),
    });
    setCreating(false);
    if (!res.ok) {
      setError(res.error);
      track(EVENTS.WORKSPACE_CREATE_FAILED, { reason: res.error, status: res.status });
      return;
    }
    setActiveWorkspaceId(res.data.id);
    setWorkspaceContext(res.data.id);
    track(EVENTS.WORKSPACE_CREATED, {
      workspace_id: res.data.id,
      is_first_workspace: workspaces.length === 0,
    });
    router.push('/onboarding');
  };

  const signOut = async () => {
    // Captured before signOut so the event still belongs to the identified
    // person; the auth listener resets the PostHog identity right after.
    track(EVENTS.LOGGED_OUT, { source: 'workspaces' });
    const supabase = createClient();
    await supabase.auth.signOut();
    clearActiveWorkspaceId();
    router.push('/login');
  };

  return (
    <div className="ws-root">
      <div className="ws-shell">
        <Image
          src="/orange logo.png"
          alt="OShift"
          width={120}
          height={34}
          className="ws-logo"
          priority
        />

        <div>
          <h1 className="ws-title">Pick up where you left off</h1>
          <p className="ws-subtitle">
            Each workspace tracks its own competitors, signals, and reports. Nothing
            crosses between them.
          </p>
        </div>

        {error && (
          <div className="ws-error" role="alert">
            <FiAlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <ul className="ws-list">
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <div className="ws-skeleton-row">
                  <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 13 }} />
                  <div className="ws-skeleton-lines">
                    <div className="skeleton skeleton-line" style={{ width: `${52 - i * 8}%` }} />
                    <div className="skeleton skeleton-line-sm" style={{ width: `${34 - i * 5}%` }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* The filter earns its place only once scanning the list is work. */}
        {!loading && workspaces.length > 7 && (
          <div className="ws-filter">
            <span className="ws-filter-icon">
              <FiSearch size={15} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter workspaces"
              aria-label="Filter workspaces by name"
            />
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <ul className="ws-list">
            {filtered.map((ws, i) => (
              <li key={ws.id}>
                <button
                  type="button"
                  className="ws-row"
                  // Capped so a long list does not stagger for seconds.
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  onClick={() => selectWorkspace(ws.id)}
                  disabled={entering !== null}
                  aria-label={`Open workspace ${ws.name}`}
                >
                  <span className="ws-sigil" style={sigilStyle(ws.id)} aria-hidden="true">
                    {sigilInitials(ws.name)}
                  </span>
                  <span className="ws-row-body">
                    <span className="ws-row-name">{ws.name}</span>
                    <span className="ws-row-meta">
                      <span className={`ws-plan ${ws.plan}`}>{ws.plan}</span>
                      {ws.id === currentId && <span className="ws-current">Current</span>}
                      <span className="ws-meta-dot">·</span>
                      <span>{createdLabel(ws.created_at)}</span>
                      {ws.timezone && ws.timezone !== 'UTC' && (
                        <>
                          <span className="ws-meta-dot">·</span>
                          <span>{ws.timezone}</span>
                        </>
                      )}
                    </span>
                  </span>
                  <span className="ws-row-arrow" aria-hidden="true">
                    {entering === ws.id ? <span>…</span> : <FiArrowRight size={17} />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && workspaces.length === 0 && !error && (
          <div className="ws-empty">
            <strong>No workspaces yet</strong>
            Create one to start tracking competitors.
          </div>
        )}

        {!loading && workspaces.length > 0 && filtered.length === 0 && (
          <div className="ws-empty">
            <strong>No workspace matches “{query.trim()}”</strong>
            Check the spelling, or create a new workspace below.
          </div>
        )}

        {!loading &&
          (createOpen || workspaces.length === 0 ? (
            <form className="ws-create-form" onSubmit={createWorkspace}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Workspace name"
                aria-label="New workspace name"
                maxLength={100}
                autoFocus={createOpen}
                required
              />
              <button type="submit" className="ws-create-submit" disabled={creating}>
                {creating ? 'Creating…' : 'Create'}
              </button>
              {workspaces.length > 0 && (
                <button
                  type="button"
                  className="ws-create-toggle"
                  onClick={() => {
                    setCreateOpen(false);
                    setNewName('');
                  }}
                  aria-label="Cancel creating a workspace"
                >
                  <FiX size={15} />
                </button>
              )}
            </form>
          ) : (
            <button
              type="button"
              className="ws-create-toggle"
              onClick={() => setCreateOpen(true)}
            >
              <FiPlus size={15} />
              New workspace
            </button>
          ))}

        <div className="ws-footer">
          <span>Signed in to OShift</span>
          <button type="button" className="ws-signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
