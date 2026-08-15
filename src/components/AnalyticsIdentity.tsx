'use client';

import { useEffect } from 'react';
import { identifyUser, resetIdentity, setWorkspaceContext } from '@/lib/analytics';
import { createClient } from '@/utils/supabase/client';

const WORKSPACE_STORAGE_KEY = 'oshift.workspace_id';

/**
 * Keeps the PostHog person in sync with the Supabase session for the whole app.
 * Renders nothing; mounted once from the root layout.
 */
export default function AnalyticsIdentity() {
  useEffect(() => {
    // Analytics must never be able to break rendering.
    try {
      const workspaceId = sessionStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (workspaceId) {
        setWorkspaceContext(workspaceId);
      }

      const supabase = createClient();
      // Emits INITIAL_SESSION immediately, which covers visitors who are
      // already signed in when they land on a page.
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          resetIdentity();
          return;
        }

        const user = session?.user;
        if (!user) return;

        const metadata = user.user_metadata ?? {};
        identifyUser(user.id, {
          email: user.email,
          full_name: metadata.full_name,
          job_role: metadata.job_role,
          signed_up_at: user.created_at,
        });
      });

      return () => data.subscription.unsubscribe();
    } catch (error) {
      console.error('Analytics identity setup failed', error);
    }
  }, []);

  return null;
}
