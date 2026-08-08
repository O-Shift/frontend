import { useState, useEffect } from 'react';
import { apiFetch, Workspace } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

export interface Member {
    id: string;
    workspace_id: string;
    user_id: string;
    email: string;
    status: string;
    roles: string[];
    invited_by: string | null;
}

export interface Competitor {
    name: string;
    logo?: string;
}

export interface ProfileData {
    name: string;
    company: string;
    workspaceRole: string;
    corporate: {
        company: string;
        workspaceRole: string;
        industry: string;
    };
    areasOfFocus: Array<{
        label: string;
        metric: string;
    }>;
    markets: {
        countries: string[];
        regions: string[];
        industries: string[];
    };
    competitors: Competitor[];
}

export function useProfile() {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const supabase = createClient();
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;
                if (!user) throw new Error("No user found");

                const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";

                const wsRes = await apiFetch<Workspace[]>("/core/workspaces");
                if (!wsRes.ok) throw new Error(wsRes.error);
                
                const workspaces = wsRes.data;
                if (!workspaces.length) {
                    setLoading(false);
                    return;
                }

                const workspaceId = sessionStorage.getItem('oshift.workspace_id');
                const activeWorkspace = workspaces.find(w => w.id === workspaceId) || workspaces[0];

                const membersRes = await apiFetch<Member[]>(`/core/workspaces/${activeWorkspace.id}/members`);
                if (!membersRes.ok) throw new Error(membersRes.error);

                const members = membersRes.data;
                const member = members.find(m => m.user_id === user.id || m.email === user.email);

                const compRes = await apiFetch<Competitor[]>('/competitors');
                const competitors = compRes.ok ? compRes.data : [];

                const partRes = await apiFetch<any[]>('/graph/partnerships');
                const partnershipsCount = partRes.ok ? partRes.data.length : 0;

                setProfileData({
                    name: userName,
                    company: activeWorkspace.name || 'OShift',
                    workspaceRole: member?.roles?.[0] || 'Member',
                    corporate: {
                        company: activeWorkspace.name || 'OShift',
                        workspaceRole: member?.roles?.[0] || 'Member',
                        industry: 'Competitive Intelligence & SaaS',
                    },
                    areasOfFocus: [
                        { label: 'Market Expansion', metric: '5 Active Markets' },
                        { label: 'Competitor Intel', metric: `${competitors.length} Live Watchlists` },
                        { label: 'Partnerships', metric: `${partnershipsCount} Alliances` },
                        { label: 'Product Innovation', metric: 'Q3 Roadmap Active' },
                    ],
                    markets: {
                        countries: ['Egypt', 'UAE', 'Saudi Arabia', 'Germany', 'UK'],
                        regions: ['MENA', 'Western Europe', 'North Africa'],
                        industries: ['EdTech', 'FinTech', 'E-Commerce', 'SaaS', 'Logistics'],
                    },
                    competitors: competitors.map(c => ({
                        name: c.name,
                        logo: c.logo || `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${c.name}.com&size=128`
                    }))
                });
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    return { profileData, loading, error };
}
