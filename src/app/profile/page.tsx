'use client';
import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import Globe from '@/components/Globe';
import { useProfile } from '@/hooks/use-profile';
import { deriveInitials } from '@/hooks/use-current-user';

const rise = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
});

const IconGlobe = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
);
const IconEye = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);
const IconUsers = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);
const IconBuilding = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
);
const IconPlus = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);
const IconUpload = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
);
const IconCalendar = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);
const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);
const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

// Keyed by label, not index: areasOfFocus varies in length with what the
// company profile actually supplies, so an index map would shift the icons.
const FOCUS_ICONS: Record<string, ReactNode> = {
    'Industry Focus': (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
    ),
    'Competitor Intel': (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
    ),
    'Partnerships': (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    'Market Reach': (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
    ),
};

const FOCUS_ICON_FALLBACK = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
);

export default function ProfilePage() {
    const { profileData: PROFILE_DATA, loading, error } = useProfile();
    const [isEditing, setIsEditing] = useState(false);

    if (loading) return <div className="p-8 text-[var(--text-secondary)]">Loading profile...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
    if (!PROFILE_DATA) return null;

    // Market coverage lives only in company.metadata, so it is absent for most
    // workspaces. Say which of the three reasons applies instead of rendering
    // an unexplained blank panel.
    const noMarketData =
        PROFILE_DATA.companyProfileStatus === 'missing'
            ? 'Complete onboarding to record the markets you operate in.'
            : PROFILE_DATA.companyProfileStatus === 'unavailable'
                ? 'Company profile could not be loaded, so market coverage is unknown.'
                : 'No market coverage recorded on your company profile yet.';

    const industryValue =
        PROFILE_DATA.corporate.industry ??
        (PROFILE_DATA.companyProfileStatus === 'unavailable' ? 'Unavailable' : 'Not set');

    const industryHint = PROFILE_DATA.corporate.industry
        ? undefined
        : PROFILE_DATA.companyProfileStatus === 'missing'
            ? 'Complete onboarding to record your company profile.'
            : PROFILE_DATA.companyProfileStatus === 'unavailable'
                ? 'Company profile could not be loaded.'
                : 'No industry recorded on your company profile.';

    const snapshot = [
        {
            label: 'Active Markets',
            value: PROFILE_DATA.markets.countries.length ? String(PROFILE_DATA.markets.countries.length) : '—',
            hint: PROFILE_DATA.markets.countries.length ? undefined : noMarketData,
            Icon: IconGlobe,
        },
        { label: 'Live Watchlists', value: String(PROFILE_DATA.competitors.length), hint: undefined as string | undefined, Icon: IconEye },
        { label: 'Alliances', value: String(PROFILE_DATA.partnershipsCount), hint: undefined as string | undefined, Icon: IconUsers },
        {
            label: 'Target Industries',
            value: PROFILE_DATA.markets.industries.length ? String(PROFILE_DATA.markets.industries.length) : '—',
            hint: PROFILE_DATA.markets.industries.length ? undefined : noMarketData,
            Icon: IconBuilding,
        },
    ];

    return (
        <div className="page-container px-4 md:px-8 pt-8 pb-24">
            <div className="w-full max-w-[1320px] mx-auto">

                {/* ── HERO CARD ── */}
                <motion.div {...rise(0)} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 md:p-8 mb-6">
                    
                    {/* Top row: avatar + identity + actions */}
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10">
                        {/* Avatar. No avatar is stored for a user, so this is
                            initials rather than a stock photo of a stranger. */}
                        <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                            <div className="w-full h-full rounded-md border border-[var(--border-color)] shadow-sm bg-[var(--card-bg-alt)] flex items-center justify-center select-none">
                                <span className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                                    {deriveInitials(PROFILE_DATA.name)}
                                </span>
                            </div>
                        </div>

                        {/* Identity text */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight m-0">
                                    {PROFILE_DATA.name}
                                </h1>
                                <span className="text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded uppercase tracking-wider">
                                    {PROFILE_DATA.workspaceRole}
                                </span>
                            </div>
                            <div className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
                                {PROFILE_DATA.company}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0 items-start">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-xs font-semibold bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--item-hover)] transition-colors text-[var(--text-primary)] py-1.5 px-4 rounded-md flex items-center gap-2"
                            >
                                {isEditing ? <IconCheck /> : <IconEdit />}
                                {isEditing ? 'Save' : 'Edit Profile'}
                            </button>
                            <button className="text-xs font-semibold bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] transition-colors text-[var(--card-bg)] border border-[var(--border-color)] py-1.5 px-4 rounded-md flex items-center gap-2">
                                <IconPlus />
                                New Initiative
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-[1px] bg-[var(--border-color)] my-6" />

                    {/* 4 Stat blocks */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                        {snapshot.map((stat, i) => (
                            <div key={i} title={stat.hint} className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center gap-4">
                                <div className="w-10 h-10 rounded-md border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center text-[var(--text-primary)]">
                                    <stat.Icon />
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-[var(--text-primary)] tracking-tight leading-none">{stat.value}</div>
                                    <div className="text-xs text-[var(--text-secondary)] font-medium mt-1">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── 3-COLUMN LOWER GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* COL 1: Competitor Watchlist + Corporate Info */}
                    <div className="flex flex-col gap-6">
                        <motion.div {...rise(0.07)} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                            <div className="flex justify-between items-center mb-5">
                                <div className="flex items-center">
                                    <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Competitor Watchlist</span>
                                </div>
                                <span className="text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded">{PROFILE_DATA.competitors.length}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {PROFILE_DATA.competitors.map((comp, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] cursor-pointer hover:bg-[var(--item-hover)] transition-colors">
                                        <img src={comp.logo} alt={comp.name} className="w-5 h-5 rounded-md object-cover flex-shrink-0 grayscale" />
                                        <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">{comp.name}</span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div {...rise(0.11)} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                            <div className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-5">Corporate Info</div>
                            <div className="flex flex-col gap-4">
                                {[
                                    { label: 'Company', val: PROFILE_DATA.corporate.company, hint: undefined as string | undefined },
                                    { label: 'Industry', val: industryValue, hint: industryHint },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-start gap-3 text-xs">
                                        <span className="text-[var(--text-secondary)] font-medium flex-shrink-0">{item.label}</span>
                                        <span
                                            title={item.hint}
                                            className={`font-semibold text-right leading-tight ${item.hint ? 'text-[var(--text-secondary)] italic' : 'text-[var(--text-primary)]'}`}
                                        >
                                            {item.val}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div {...rise(0.15)} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                            <div className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-5">Quick Actions</div>
                            <div className="flex flex-col gap-2.5">
                                {[
                                    { label: 'Add Competitor', Icon: IconPlus },
                                    { label: 'Export Report', Icon: IconUpload },
                                    { label: 'Schedule Review', Icon: IconCalendar },
                                ].map((action, i) => (
                                    <button key={i} className="w-full flex items-center justify-start gap-3 p-2.5 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] cursor-pointer hover:bg-[var(--item-hover)] transition-colors text-xs font-semibold text-[var(--text-primary)]">
                                        <action.Icon />
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* COL 2: Focus Pillars */}
                    <div className="flex flex-col gap-6">
                        <motion.div {...rise(0.10)} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                            <div className="flex items-center mb-5">
                                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Focus Pillars</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {PROFILE_DATA.areasOfFocus.map((focus, idx) => (
                                    <div key={focus.label || idx} className="p-3.5 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-md border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center text-[var(--text-primary)]">
                                            {FOCUS_ICONS[focus.label] ?? FOCUS_ICON_FALLBACK}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-[var(--text-primary)]">{focus.label}</div>
                                            {focus.metric && (
                                                <div className="text-xs font-medium text-[var(--text-secondary)] mt-1">{focus.metric}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* COL 3: Globe + Markets + Industries */}
                    <div className="flex flex-col gap-6">
                        <motion.div {...rise(0.06)} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 overflow-hidden">
                            <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Global Market Reach</span>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {PROFILE_DATA.markets.regions.length === 0 ? (
                                        <span className="text-[10px] font-medium text-[var(--text-secondary)]" title={noMarketData}>No regions recorded</span>
                                    ) : PROFILE_DATA.markets.regions.map((reg, i) => (
                                        <span key={i} className="text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded uppercase tracking-wider">{reg}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[280px] w-full rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] relative overflow-hidden flex items-center justify-center">
                                <Globe className="profile-globe" countries={PROFILE_DATA.markets.countries} />
                                <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap z-10">
                                    {PROFILE_DATA.markets.countries.length === 0 ? (
                                        <span className="text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--card-bg)] border border-[var(--border-color)] px-2 py-0.5 rounded">
                                            {noMarketData}
                                        </span>
                                    ) : PROFILE_DATA.markets.countries.map((country, i) => (
                                        <span key={i} className="text-[10px] font-bold text-[var(--card-bg)] bg-[var(--text-primary)] px-2 py-0.5 rounded uppercase tracking-wider">
                                            {country}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div {...rise(0.13)} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                            <div className="flex items-center mb-4">
                                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Target Industries</span>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                                {PROFILE_DATA.markets.industries.length === 0 ? (
                                    <span className="text-xs text-[var(--text-secondary)]">{noMarketData}</span>
                                ) : PROFILE_DATA.markets.industries.map((ind, i) => (
                                    <span key={i} className="text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded uppercase tracking-wider">{ind}</span>
                                ))}
                            </div>
                            <div className="mt-6 border-t border-[var(--border-color)] pt-6">
                                <div className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">Active Markets</div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {PROFILE_DATA.markets.countries.length === 0 ? (
                                        <span className="text-xs text-[var(--text-secondary)]">{noMarketData}</span>
                                    ) : PROFILE_DATA.markets.countries.map((c, i) => (
                                        <span key={i} className="text-[10px] font-bold text-[var(--card-bg)] bg-[var(--text-primary)] px-2 py-0.5 rounded uppercase tracking-wider">{c}</span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
