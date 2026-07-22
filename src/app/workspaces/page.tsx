'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

type Workspace = {
  id: string;
  name: string;
  timezone: string;
  locale: string;
  plan: string;
};

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<Workspace[]>('/core/workspaces', {
      skipWorkspace: true,
    });
    if (!res.ok) {
      setError(res.error);
      setWorkspaces([]);
    } else {
      setWorkspaces(res.data);
      if (res.data.length === 1) {
        sessionStorage.setItem('oshift.workspace_id', res.data[0].id);
        router.replace('/');
      }
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const selectWorkspace = (id: string) => {
    sessionStorage.setItem('oshift.workspace_id', id);
    router.push('/');
  };

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    const res = await apiFetch<Workspace>('/core/workspaces', {
      method: 'POST',
      skipWorkspace: true,
      body: JSON.stringify({ name: newName.trim() }),
    });
    setCreating(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    sessionStorage.setItem('oshift.workspace_id', res.data.id);
    router.push('/onboarding');
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    sessionStorage.removeItem('oshift.workspace_id');
    router.push('/login');
  };

  return (
    <div className="auth-root" style={{ minHeight: '100vh', alignItems: 'center' }}>
      <div className="auth-content" style={{ maxWidth: 480, width: '100%' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Your workspaces</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Choose a workspace or create one to get started.
        </p>

        {loading && <p>Loading…</p>}
        {error && (
          <p style={{ color: 'var(--accent)', marginBottom: '1rem' }} role="alert">
            {error}
          </p>
        )}

        {!loading && workspaces.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
            {workspaces.map((ws) => (
              <li key={ws.id} style={{ marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  className="auth-submit-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => selectWorkspace(ws.id)}
                >
                  {ws.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={createWorkspace}>
          <div className="auth-field">
            <div className="auth-input-wrapper">
              <input
                type="text"
                className="auth-input"
                placeholder="New workspace name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="auth-submit-btn" disabled={creating}>
            {creating ? 'Creating…' : 'Create workspace'}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          style={{ marginTop: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
