'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import ChartSkeleton from '@/components/charts/ChartSkeleton';
import { TOKEN_PALETTE } from '@/components/charts/palette';
import { useDashboard, type Rail } from '@/hooks/use-dashboard';
import { apiFetch, updateOpportunityStatus, campaignThemes, campaignThumbnails, type Campaign, type SenseReview } from '@/lib/api';
import { extractDomain } from '@/lib/utils/domain';
import { getDeckArtwork, getDeckCardStyle } from '@/lib/campaign-artwork';
import { WidgetErrorBoundary } from '@/components/error/WidgetErrorBoundary';

// recharts is 340 KB and the analytics panel it draws is the last thing on the
// dashboard, below three cards of content. Loading it on its own chunk lets the
// rest of the page paint first. SSR stays on: the chart is deterministic from
// props and prerendering it costs nothing.
const AreaChartCard = dynamic(() => import('@/components/charts/AreaChartCard'), {
    loading: () => <ChartSkeleton />,
});

const brandColor1 = '#FF5A00';
const brandColor2 = '#64748b';

const SolidArrowUp = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
        <polygon points="12 3 4 11 10 11 10 21 14 21 14 11 20 11 12 3" />
    </svg>
);

const SolidArrowDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
        <polygon points="12 21 4 13 10 13 10 3 14 3 14 13 20 13 12 21" />
    </svg>
);

const StatusPill = ({ status }: { status: string }) => {
    return (
        <span className="text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
            {status}
        </span>
    );
};

// GET /company/analytics returns "YYYY-MM-DD" bucket starts. The XAxis wants the
// short label; parse the parts rather than `new Date(s)` so the bucket is not
// shifted a day by the viewer's timezone.
function monthLabel(timestamp: string): string {
    const [year, month] = timestamp.split('-').map(Number);
    if (!year || !month) return timestamp;
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
        month: 'short',
        timeZone: 'UTC',
    });
}

// --- Helper Functions from current ---
function relativeTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return '—';
    const diff = Date.now() - t;
    const day = 86_400_000;
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
    if (diff < day) return `${Math.round(diff / 3_600_000)}h ago`;
    if (diff < 7 * day) return `${Math.round(diff / day)}d ago`;
    if (diff < 30 * day) return `${Math.round(diff / (7 * day))}w ago`;
    if (diff < 365 * day) return `${Math.round(diff / (30 * day))}mo ago`;
    return `${Math.round(diff / (365 * day))}y ago`;
}
function shortDate(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
function daysUntil(iso: string | null | undefined): number | null {
    if (!iso) return null;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return null;
    return Math.ceil((t - Date.now()) / 86_400_000);
}
function priorityBucket(score: number | string | null | undefined): 'high' | 'medium' | 'low' {
    const n = typeof score === 'string' ? Number(score) : score;
    if (typeof n !== 'number' || Number.isNaN(n)) return 'low';
    if (n >= 70) return 'high';
    if (n >= 40) return 'medium';
    return 'low';
}
function normalizeSentiment(rev: SenseReview): 'positive' | 'neutral' | 'critical' {
    const s = (rev.sentiment ?? '').toLowerCase();
    if (s === 'positive' || s === 'pos' || s === 'good') return 'positive';
    if (s === 'negative' || s === 'critical' || s === 'neg' || s === 'bad') return 'critical';
    if (s === 'neutral' || s === 'mixed') return 'neutral';
    const r = rev.rating ?? 0;
    if (r >= 4) return 'positive';
    if (r > 0 && r <= 2) return 'critical';
    return 'neutral';
}
function reviewAuthor(rev: SenseReview): string {
    const meta = rev.metadata as Record<string, unknown> | null | undefined;
    for (const key of ['author', 'author_name', 'reviewer', 'reviewer_name', 'user', 'username']) {
        const v = meta?.[key];
        if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return 'Anonymous';
}
function hashString(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}
function deckGradient(seed: string, layer: number): string {
    const h = (hashString(seed) + layer * 43) % 360;
    return `linear-gradient(145deg, hsl(${h} 42% 24%), hsl(${(h + 45) % 360} 48% 13%))`;
}
function deckCardBg(thumbnailUrl: string | undefined, seed: string, layer: number, darkOverlay = false): string {
    const fallback = deckGradient(seed, layer);
    if (!thumbnailUrl) {
        return darkOverlay ? `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%), ${fallback}` : fallback;
    }
    if (darkOverlay) {
        return `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%), url('${thumbnailUrl}'), ${fallback}`;
    }
    return `linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%), url('${thumbnailUrl}'), ${fallback}`;
}
function campaignDate(c: Campaign): string {
    const dr = c.metadata?.date_range;
    if (typeof dr === 'string' && dr.trim()) return dr;
    if (dr && typeof dr === 'object') {
        const s = shortDate(dr.start);
        const e = shortDate(dr.end);
        if (s && e) return s === e ? s : `${s} – ${e}`;
        if (s ?? e) return (s ?? e) as string;
    }
    return shortDate(c.detected_at) ?? '—';
}
function campaignPostCount(c: Campaign): number {
    const n = c.metadata?.post_count;
    if (typeof n === 'number') return n;
    return c.posts?.length ?? 0;
}
function confidenceLabel(c: number | null | undefined): string {
    if (typeof c !== 'number') return 'Not scored';
    if (c >= 70) return 'High confidence';
    if (c >= 40) return 'Medium confidence';
    return 'Low confidence';
}

interface Competitor {
    id: string;
    name: string;
    website: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [activeChart, setActiveChart] = useState<'views' | 'engagement' | null>('views');
    const [campaignIdx, setCampaignIdx] = useState(0);
    const [direction, setDirection] = useState(1);
    const reviewsScrollRef = useRef<HTMLDivElement>(null);

    const { opportunities, opportunitiesTotal, gaps, reviews, campaigns, analytics, company, workspace, user, refreshing, refresh } = useDashboard();

    // Gaps carry competitor_id, not a website. The watchlist is the only place
    // that maps one to the other, so it is fetched once for gap navigation.
    const [competitors, setCompetitors] = useState<Competitor[]>([]);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            const res = await apiFetch<Competitor[]>('/competitors');
            if (!cancelled && res.ok && Array.isArray(res.data)) {
                setCompetitors(res.data);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const competitorDomains = useMemo(() => {
        const byId = new Map<string, string>();
        for (const c of competitors) {
            const domain = extractDomain(c.website);
            if (domain) byId.set(c.id, domain);
        }
        return byId;
    }, [competitors]);

    // Nulls are carried through as null, never coalesced to 0: the endpoint sends
    // null for "no snapshot recorded this metric", and Recharts draws a gap for it
    // (connectNulls is unset). Zero-filling would render a collection outage as
    // real zero traffic.
    const chartData = useMemo(
        () =>
            analytics.items.map((point) => ({
                name: monthLabel(point.timestamp),
                views: point.views,
                engagement: point.engagement_rate,
            })),
        [analytics.items],
    );

    // A series whose every bucket is null was never recorded — the chart frame
    // would otherwise be empty with no explanation of why.
    const seriesRecorded = useMemo(
        () => ({
            views: analytics.items.some((p) => p.views !== null),
            engagement: analytics.items.some((p) => p.engagement_rate !== null),
        }),
        [analytics.items],
    );

    const analyticsEmptyNote = company.missing
        ? 'Complete onboarding to start collecting analytics for your company.'
        : 'No analytics snapshots collected yet.';

    const scrollList = (dir: 'left' | 'right') => {
        if (reviewsScrollRef.current) {
            reviewsScrollRef.current.scrollBy({ left: dir === 'left' ? -344 : 344, behavior: 'smooth' });
        }
    };

    const nextCampaign = () => {
        if (campaigns.items.length === 0) return;
        setDirection(1);
        setCampaignIdx((prev) => (prev + 1) % campaigns.items.length);
    };

    const prevCampaign = () => {
        if (campaigns.items.length === 0) return;
        setDirection(-1);
        setCampaignIdx((prev) => (prev - 1 + campaigns.items.length) % campaigns.items.length);
    };

    const containerVariants: Variants = {
        hidden: (dir: number) => ({}),
        visible: { transition: { staggerChildren: 0.1 } },
        exit: (dir: number) => ({ transition: { staggerChildren: 0.05, staggerDirection: -1 } })
    };

    const childVariants: Variants = {
        hidden: (dir: number) => ({ opacity: 0, x: dir > 0 ? 30 : -30 }),
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
        exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -30 : 30, transition: { duration: 0.2 } })
    };

    const stats = useMemo(() => {
        const rated = reviews.items.filter((r) => typeof r.rating === 'number' && r.rating > 0);
        const avgRating = rated.length ? (rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length) : 0;
        const highPriority = opportunities.items.filter((o) => priorityBucket(o.priority_score) === 'high').length;
        const urgentGaps = gaps.items.filter((g) => g.layer === 'alarm_for_us').length;
        
        return [
            { label: 'Open Opportunities', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>, value: opportunities.loading ? '—' : String(opportunitiesTotal), change: `${highPriority} high priority`, trend: 'up', context: 'across all sources' },
            { label: 'Growth Gaps', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, value: gaps.loading ? '—' : String(gaps.items.length), change: `${urgentGaps} urgent`, trend: 'down', context: 'requires action' },
            { label: 'Avg Rating', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, value: reviews.loading ? '—' : avgRating.toFixed(1), change: `${rated.length} rated`, trend: 'up', context: 'from tracked sources' },
        ];
    }, [opportunities, opportunitiesTotal, gaps, campaigns, reviews]);

    const activeCamp = campaigns.items[campaignIdx];
    const safeCampIdx = campaigns.items.length > 0 ? campaignIdx : 0;

    return (
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden p-6 md:p-10 pb-24 flex flex-col items-center justify-start relative bg-[var(--bg-main-alt)]">
            <div className="w-full max-w-6xl flex flex-col gap-6">
                
                {/* ── HEADER ── */}
                <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="flex justify-between items-center mb-2"
                >
                    <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Dashboard</h1>
                    <button
                        onClick={refresh}
                        disabled={refreshing}
                        className={`bg-[var(--card-bg-alt)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] text-xs font-semibold py-1.5 px-3 rounded-md transition-colors ${refreshing ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                    >
                        {refreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                </motion.div>

                {/* ── GRID: INVERTED PYRAMID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* ── TOP LEFT (Span 2): LATEST CAMPAIGN HERO ── */}
                    <div className="col-span-1 lg:col-span-2 h-full">
                    <WidgetErrorBoundary
                        title="Campaign Performance Unavailable"
                        message="An error occurred while rendering the latest campaign performance card."
                        resetKeys={[activeCamp?.id, campaignIdx]}
                    >
                    <motion.div 
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
                        className="flex flex-col bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 h-full min-h-[380px]"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-base font-medium text-[var(--text-primary)]">Latest campaign performance</span>
                            {campaigns.items.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <button onClick={prevCampaign} className="w-8 h-8 flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--item-hover)] shadow-sm rounded-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>
                                    <button onClick={nextCampaign} className="w-8 h-8 flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--item-hover)] shadow-sm rounded-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 relative">
                            {campaigns.loading ? (
                                <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">Loading campaigns...</div>
                            ) : campaigns.items.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">No campaigns detected yet.</div>
                            ) : (
                            <AnimatePresence mode="wait" custom={direction} initial={false}>
                                <motion.div 
                                    key={safeCampIdx}
                                    custom={direction}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="flex flex-col md:flex-row gap-8 items-start h-full cursor-pointer"
                                    onClick={() => router.push(`/campaigns/${activeCamp.id}`)}
                                >
                                    <div className="w-full md:w-48 h-48 md:h-full flex items-center justify-center flex-shrink-0 relative overflow-visible mt-2">
                                        <div className="scene">
                                            <div className="deck-wrapper" style={{ transform: 'scale(0.65)' }}>
                                                {(() => {
                                                    const [leftImg, rightImg, frontImg] = getDeckArtwork(activeCamp);
                                                    return (
                                                        <div className="cards">
                                                            <motion.div variants={childVariants} custom={direction} className="absolute inset-0 z-10">
                                                                <div className="card card-left" style={getDeckCardStyle(leftImg, activeCamp.id, 1, false)}></div>
                                                            </motion.div>
                                                            <motion.div variants={childVariants} custom={direction} className="absolute inset-0 z-10">
                                                                <div className="card card-right" style={getDeckCardStyle(rightImg, activeCamp.id, 2, false)}></div>
                                                            </motion.div>
                                                            <motion.div variants={childVariants} custom={direction} className="absolute inset-0 z-30">
                                                                <div className="card card-center deck-front" style={getDeckCardStyle(frontImg, activeCamp.id, 0, true)}>
                                                                    <div className="logo flex items-center gap-2 mt-auto text-[#e4e4e7] z-10">
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brandColor1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                                                                        </svg>
                                                                        <span className="text-xs truncate font-semibold drop-shadow-md">{activeCamp.title}</span>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col flex-1 justify-between h-full w-full">
                                        <motion.div variants={childVariants} custom={direction} className="mb-6">
                                            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] mb-1">{activeCamp.title}</h2>
                                            <p className="text-sm text-[var(--text-secondary)]">Detected {relativeTime(activeCamp.detected_at)}</p>
                                        </motion.div>
                                        
                                        <div className="grid grid-cols-3 gap-6">
                                            <motion.div variants={childVariants} custom={direction} className="flex flex-col">
                                                <span className="text-xs text-[var(--text-secondary)] mb-1.5">Total Posts</span>
                                                <span className="text-xl font-medium tracking-tight text-[var(--text-primary)]">{campaignPostCount(activeCamp)}</span>
                                                <div className="flex items-center gap-1 text-xs font-medium mt-1.5 text-emerald-500">
                                                    <SolidArrowUp /> Tracked
                                                </div>
                                            </motion.div>
                                            <motion.div variants={childVariants} custom={direction} className="flex flex-col">
                                                <span className="text-xs text-[var(--text-secondary)] mb-1.5">Confidence</span>
                                                <span className="text-xl font-medium tracking-tight text-[var(--text-primary)]">{activeCamp.confidence}%</span>
                                                <div className={`flex items-center gap-1 text-xs font-medium mt-1.5 ${activeCamp.confidence >= 70 ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
                                                    {activeCamp.confidence >= 70 ? <SolidArrowUp /> : null} {activeCamp.confidence >= 70 ? 'High' : 'Tentative'}
                                                </div>
                                            </motion.div>
                                            <motion.div variants={childVariants} custom={direction} className="flex flex-col">
                                                <span className="text-xs text-[var(--text-secondary)] mb-1.5">Themes</span>
                                                <span className="text-xl font-medium tracking-tight text-[var(--text-primary)] capitalize truncate" title={campaignThemes(activeCamp).join(', ')}>
                                                    {campaignThemes(activeCamp)[0] ?? '—'}
                                                </span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                            )}
                        </div>
                    </motion.div>
                    </WidgetErrorBoundary>
                    </div>

                    {/* ── TOP RIGHT (Span 1): HIGH-LEVEL KPIs ── */}
                    <div className="col-span-1 h-full">
                    <WidgetErrorBoundary
                        title="KPI Summary Unavailable"
                        message="An error occurred while computing key performance indicators."
                    >
                    <motion.div 
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
                        className="flex flex-col gap-4 h-full"
                    >
                        {stats.map((kpi, i) => (
                            <div key={i} className="flex items-center justify-between bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex-1">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-1 text-[var(--text-secondary)]">
                                        {kpi.icon}
                                        <span className="text-base font-medium text-[var(--text-primary)]">{kpi.label}</span>
                                    </div>
                                    <span className="text-xl font-medium tracking-tight text-[var(--text-primary)]">{kpi.value}</span>
                                </div>
                                <div className={`flex flex-col items-end text-xs font-bold ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    <div className="flex items-center gap-1 text-sm">
                                        {kpi.trend === 'up' ? <SolidArrowUp /> : <SolidArrowDown />}
                                        {kpi.change}
                                    </div>
                                    <span className="text-[10px] text-[var(--text-secondary)] font-medium mt-1">{kpi.context}</span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                    </WidgetErrorBoundary>
                    </div>

                    {/* ── BOTTOM LEFT (Span 2): PERFORMANCE CHARTS ── */}
                    <div className="col-span-1 lg:col-span-2">
                    <WidgetErrorBoundary
                        title="Analytics Chart Unavailable"
                        message="An error occurred while rendering the historical analytics chart."
                        resetKeys={[activeChart, chartData.length]}
                    >
                    <motion.div 
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }} 
                        className="flex flex-col bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center">
                                <h3 className="text-base font-medium text-[var(--text-primary)]">Historical analytics</h3>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Last 6 months</span>
                        </div>
                        <div className="flex flex-col gap-14">
                            {([
                                { key: 'views', dataKey: 'views', label: 'Total Views', color: brandColor1 },
                                { key: 'engagement', dataKey: 'engagement', label: 'Engagement Rate (%)', color: brandColor2 },
                            ] as const).map(({ key, dataKey, label, color }) => (
                                <div
                                    key={key}
                                    onClick={() => setActiveChart(activeChart === key ? null : key)}
                                    className={`flex flex-col cursor-pointer transition-all duration-300 ${activeChart === key ? 'h-[280px]' : 'h-[100px] opacity-60 hover:opacity-100'}`}
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-[2px] rounded-full" style={{ backgroundColor: color }} />
                                        <h4 className="text-sm font-medium text-[var(--text-primary)]">{label}</h4>
                                    </div>
                                    <div className="flex-1 w-full h-full min-h-0 relative -left-4">
                                        {analytics.loading ? (
                                            <div className="flex items-center h-full pl-4 text-sm text-[var(--text-secondary)]">Loading analytics...</div>
                                        ) : analytics.error ? (
                                            <div className="flex items-center h-full pl-4 text-sm text-[var(--text-secondary)]">Analytics unavailable: {analytics.error}</div>
                                        ) : chartData.length === 0 ? (
                                            <div className="flex items-center h-full pl-4 text-sm text-[var(--text-secondary)]">{analyticsEmptyNote}</div>
                                        ) : !seriesRecorded[key] ? (
                                            <div className="flex items-center h-full pl-4 text-sm text-[var(--text-secondary)]">Not recorded in any snapshot for this period.</div>
                                        ) : (
                                        <AreaChartCard
                                            data={chartData}
                                            dataKey={dataKey}
                                            xKey="name"
                                            color={color}
                                            palette={TOKEN_PALETTE}
                                            gradientId={`gradient-${key}`}
                                            showAxes={activeChart === key}
                                        />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    </WidgetErrorBoundary>
                    </div>

                    {/* ── BOTTOM RIGHT (Span 1): ACTION CENTERS ── */}
                    <div className="col-span-1">
                    <WidgetErrorBoundary
                        title="Action Center Unavailable"
                        message="An error occurred while loading action items."
                        resetKeys={[gaps.items.length, opportunities.items.length]}
                    >
                    <motion.div 
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} 
                        className="flex flex-col gap-6"
                    >
                        <div className="flex flex-col bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
                            <h3 className="text-base font-medium text-[var(--text-primary)] mb-5">Action center</h3>
                            
                            <div className="flex flex-col gap-4">
                                {gaps.items.slice(0, 1).map(gap => {
                                    const gapDomain = gap.competitor_id ? competitorDomains.get(gap.competitor_id) : undefined;
                                    return (
                                    <div key={gap.id} className="flex flex-col bg-[var(--card-bg)] border border-red-500/20 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Growth Gap</span>
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--text-primary)] mb-3 leading-tight truncate">{gap.title}</span>
                                        <button
                                            onClick={gapDomain ? () => router.push(`/company/${gapDomain}`) : undefined}
                                            disabled={!gapDomain}
                                            title={gapDomain ? undefined : 'No competitor linked to this gap — nothing to review'}
                                            className={`text-xs font-semibold transition-colors py-1.5 px-4 rounded-md w-fit ${
                                                gapDomain
                                                    ? 'bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--card-bg)] cursor-pointer'
                                                    : 'border border-[var(--border-color)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            Review Gap
                                        </button>
                                    </div>
                                    );
                                })}

                                {opportunities.items.slice(0, 2).map(opp => (
                                    <div key={opp.id} className="flex flex-col bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 relative">
                                        <div className="flex justify-between items-start mb-1 mt-1">
                                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Opportunity</span>
                                            {opp.status === 'new' && (
                                                <span className="text-[10px] text-[var(--accent)] font-bold border border-[var(--accent)]/30 px-2 py-0.5 rounded uppercase tracking-wider">New</span>
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--text-primary)] mb-3 leading-tight truncate">{opp.title}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => router.push('/opportunities')} className="text-xs font-medium border border-[var(--border-color)] hover:bg-[var(--item-hover)] transition-colors text-[var(--text-primary)] py-1.5 px-4 rounded-md w-fit">View details</button>
                                            <button 
                                                onClick={async () => {
                                                    await updateOpportunityStatus(opp.id, 'in_progress');
                                                    refresh();
                                                }}
                                                className="text-xs font-medium border border-[var(--border-color)] bg-[var(--text-primary)] text-[var(--card-bg)] hover:bg-[var(--text-secondary)] transition-colors py-1.5 px-4 rounded-md w-fit"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {gaps.items.length === 0 && opportunities.items.length === 0 && (
                                    <div className="text-sm text-[var(--text-secondary)] p-4 text-center">No urgent actions required.</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                    </WidgetErrorBoundary>
                    </div>

                </div>

                {/* ── CUSTOMER REVIEWS (Horizontal Scroll) ── */}
                <WidgetErrorBoundary
                    title="Customer Sentiment Unavailable"
                    message="An error occurred while loading customer reviews."
                    resetKeys={[reviews.items.length]}
                >
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.25 }}
                    className="flex flex-col md:flex-row gap-12 overflow-hidden items-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 mt-2"
                >
                    <div className="shrink-0 w-full md:w-48 flex flex-col justify-start">
                        <div className="text-6xl text-[var(--border-color)] leading-none mb-6 font-serif">&ldquo;</div>
                        <h3 className="text-base font-medium text-[var(--text-primary)] mb-8">
                            Customer sentiment
                        </h3>
                        <div className="flex items-center gap-4">
                            <button onClick={() => scrollList('left')} className="w-8 h-8 flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--item-hover)] shadow-sm rounded-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                            </button>
                            <button onClick={() => scrollList('right')} className="w-8 h-8 flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--item-hover)] shadow-sm rounded-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                        </div>
                    </div>

                    <div
                        ref={reviewsScrollRef}
                        className="flex gap-10 overflow-x-auto flex-1 snap-x snap-mandatory hide-scrollbar scroll-smooth px-2 pb-4"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {reviews.loading ? (
                            <div className="text-sm text-[var(--text-secondary)]">Loading reviews...</div>
                        ) : reviews.items.length === 0 ? (
                            <div className="text-sm text-[var(--text-secondary)]">No reviews tracked yet.</div>
                        ) : reviews.items.map((rev, i) => (
                            <div key={rev.id || i} className="min-w-[280px] md:min-w-[340px] snap-start">
                                <div className="flex flex-col h-full cursor-pointer hover:bg-[var(--bg-main-alt)] p-6 rounded-lg transition-colors border border-transparent hover:border-[var(--border-color)]">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 rounded-full border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] text-sm font-bold uppercase">
                                            {reviewAuthor(rev).charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-[var(--text-primary)] text-sm font-medium">{reviewAuthor(rev)}</div>
                                            <div className="text-[var(--text-secondary)] text-xs mt-1">{relativeTime(rev.reviewed_at)}</div>
                                        </div>
                                        <div className="ml-auto">
                                            <StatusPill status={normalizeSentiment(rev)} />
                                        </div>
                                    </div>
                                    <div className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                                        &ldquo;{rev.body}&rdquo;
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-1.5 text-[var(--text-primary)]">
                                            {[...Array(5)].map((_, idx) => (
                                                 <svg key={idx} width="16" height="16" viewBox="0 0 24 24" fill={idx < (rev.rating || 0) ? "currentColor" : "none"} stroke={idx < (rev.rating || 0) ? "none" : "currentColor"} strokeWidth="2" className={idx >= (rev.rating || 0) ? "opacity-20" : ""}>
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
                </WidgetErrorBoundary>

                {/* ── MY CAMPAIGNS (Horizontal Scroll) ── */}
                <WidgetErrorBoundary
                    title="My Campaigns Unavailable"
                    message="An error occurred while displaying your campaigns."
                    resetKeys={[campaigns.items.length]}
                >
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.3 }}
                    className="flex flex-col gap-6 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 mt-2"
                >
                    <h3 className="text-base font-medium text-[var(--text-primary)]">My Campaigns</h3>
                    <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {campaigns.loading ? (
                            <div className="text-sm text-[var(--text-secondary)]">Loading campaigns...</div>
                        ) : campaigns.items.length === 0 ? (
                            <div className="text-sm text-[var(--text-secondary)]">No active campaigns.</div>
                        ) : campaigns.items.map((camp) => (
                            <div key={camp.id} className="min-w-[280px] p-5 rounded-lg border border-[var(--border-color)] flex flex-col cursor-pointer hover:border-[var(--text-primary)] transition-colors" role="button" tabIndex={0} onClick={() => router.push(`/campaigns/${camp.id}`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/campaigns/${camp.id}`); } }}>
                                <span className="text-sm font-semibold text-[var(--text-primary)] mb-2 truncate">{camp.title}</span>
                                <div className="text-xs text-[var(--text-secondary)] mb-4">{campaignDate(camp)}</div>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-xs font-medium text-[var(--text-primary)]">{campaignPostCount(camp)} Posts</span>
                                    <span className="text-xs font-medium text-emerald-500">{camp.confidence}% Conf.</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
                </WidgetErrorBoundary>

            </div>
        </div>
    );
}
