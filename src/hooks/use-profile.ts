import { useState, useEffect } from 'react';
import { apiFetch, fetchCompany, Company, Workspace } from '@/lib/api';
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

/**
 * 'missing' is a 404 from GET /company — the workspace has no company row, so
 * onboarding has not run. 'unavailable' is a real failure (network, 5xx); the
 * profile still renders, only the company-sourced fields are unknown.
 */
export type CompanyProfileStatus = 'ok' | 'missing' | 'unavailable';

/**
 * Sourced from company.metadata. No table or endpoint stores market coverage,
 * so empty arrays mean "nothing recorded" — never a fabricated default.
 */
export interface ProfileMarkets {
    countries: string[];
    regions: string[];
    industries: string[];
}

export interface ProfileData {
    name: string;
    company: string;
    workspaceRole: string;
    corporate: {
        company: string;
        workspaceRole: string;
        industry: string | null;
    };
    areasOfFocus: Array<{
        label: string;
        metric: string;
    }>;
    markets: ProfileMarkets;
    competitors: Competitor[];
    partnershipsCount: number;
    companyProfileStatus: CompanyProfileStatus;
}

function toStringList(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .filter((v): v is string => typeof v === 'string')
            .map((v) => v.trim())
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
    return [];
}

// company.metadata is a free-form jsonb blob, so market coverage may sit at the
// top level or nested under a "markets" object depending on who wrote the row.
function readMarkets(metadata: Record<string, unknown> | null | undefined): ProfileMarkets {
    const meta = metadata ?? {};
    const nestedValue = meta.markets;
    const nested: Record<string, unknown> =
        nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)
            ? (nestedValue as Record<string, unknown>)
            : {};

    const pick = (...keys: string[]): string[] => {
        for (const key of keys) {
            const list = toStringList(nested[key] ?? meta[key]);
            if (list.length) return list;
        }
        return [];
    };

    return {
        countries: pick('countries', 'target_countries'),
        regions: pick('regions', 'target_regions'),
        industries: pick('industries', 'target_industries'),
    };
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

                // The company profile is supplementary: a missing or unreachable
                // row narrows what we can show, it does not fail the page.
                const companyRes = await fetchCompany();
                const company: Company | null = companyRes.ok ? companyRes.data : null;
                const companyProfileStatus: CompanyProfileStatus = companyRes.ok
                    ? 'ok'
                    : companyRes.status === 404
                        ? 'missing'
                        : 'unavailable';

                const markets = readMarkets(company?.metadata);
                const industry = company?.industry?.trim() || null;

                const areasOfFocus = [
                    ...(industry ? [{ label: 'Industry Focus', metric: industry }] : []),
                    { label: 'Competitor Intel', metric: `${competitors.length} Live Watchlists` },
                    { label: 'Partnerships', metric: `${partnershipsCount} Alliances` },
                    ...(markets.countries.length
                        ? [{ label: 'Market Reach', metric: `${markets.countries.length} Active Markets` }]
                        : []),
                ];

                setProfileData({
                    name: userName,
                    company: activeWorkspace.name || 'OShift',
                    workspaceRole: member?.roles?.[0] || 'Member',
                    corporate: {
                        company: activeWorkspace.name || 'OShift',
                        workspaceRole: member?.roles?.[0] || 'Member',
                        industry,
                    },
                    areasOfFocus,
                    markets,
                    competitors: competitors.map(c => ({
                        name: c.name,
                        logo: c.logo || `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${c.name}.com&size=128`
                    })),
                    partnershipsCount,
                    companyProfileStatus,
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
