import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface CurrentUser {
    /** Display name: user_metadata.full_name, else the local part of the email. */
    name: string;
    email: string;
    /** Uppercase initials for the avatar, derived from whichever name we resolved. */
    initials: string;
}

/** Shared so avatars elsewhere derive initials the same way, not their own way. */
export function deriveInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * The signed-in Supabase user, for chrome that needs to show who you are.
 *
 * `user` stays null until the session resolves and whenever there is no session,
 * so callers must render a placeholder rather than assume a value — showing a
 * stale or invented identity is worse than showing none.
 *
 * Subscribes to onAuthStateChange so a sign-out or a token refresh in another
 * tab updates this one instead of leaving the previous account's name on screen.
 */
export function useCurrentUser(): { user: CurrentUser | null; loading: boolean } {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        let active = true;

        const toCurrentUser = (
            authUser: { email?: string; user_metadata?: Record<string, unknown> } | null,
        ): CurrentUser | null => {
            if (!authUser) return null;
            const email = authUser.email ?? '';
            const rawFullName = authUser.user_metadata?.full_name;
            const fullName = typeof rawFullName === 'string' ? rawFullName.trim() : '';
            const name = fullName || email.split('@')[0] || 'User';
            return { name, email, initials: deriveInitials(name) };
        };

        supabase.auth
            .getUser()
            .then(({ data }) => {
                if (!active) return;
                setUser(toCurrentUser(data.user));
            })
            .catch(() => {
                // No session, or the network is down. Callers render the
                // placeholder; there is nothing truthful to show here.
                if (active) setUser(null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!active) return;
            setUser(toCurrentUser(session?.user ?? null));
            setLoading(false);
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    return { user, loading };
}
