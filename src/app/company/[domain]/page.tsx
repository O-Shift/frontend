'use client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PromptField from '@/components/PromptField';
import { motion, AnimatePresence } from 'framer-motion';
import ChartSkeleton from '@/components/charts/ChartSkeleton';
import CompanyDetailSkeleton from '@/components/skeletons/CompanyDetailSkeleton';
import { TOKEN_PALETTE } from '@/components/charts/palette';
import { useCompany } from '@/hooks/use-company';
import { logoUrl as companyLogoUrl } from '@/lib/logos';
import { usePinned } from '@/context/PinnedContext';
import { extractDomain } from '@/lib/utils/domain';

// recharts is 340 KB and the trend card is below the fold on this page. Loading
// it on its own chunk keeps it off the route's initial download.
const LineChartCard = dynamic(() => import('@/components/charts/LineChartCard'), {
    loading: () => <ChartSkeleton />,
});



function getBrandColors(domain: string) {
    const knownBrands: Record<string, [string, string]> = {
        'amazon.com': ['#ff9900', '#ffb84d'],
        'tesla.com': ['#e82127', '#ff4d4d'],
        'apple.com': ['#ffffff', '#a1a1aa'],
        'nike.com': ['#ff6600', '#ff9933'],
        'spotify.com': ['#1db954', '#1ed760'],
        'stripe.com': ['#635bff', '#7a73ff'],
        'vercel.com': ['#ffffff', '#a1a1aa'],
        'google.com': ['#4285f4', '#ea4335'],
        'microsoft.com': ['#00a4ef', '#7fba00'],
        'meta.com': ['#0668e1', '#42b4ff'],
        'netflix.com': ['#e50914', '#ff4c4c']
    };

    const key = domain.toLowerCase();
    if (knownBrands[key]) return knownBrands[key];

    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
        hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return [`hsl(${hue}, 80%, 50%)`, `hsl(${(hue + 40) % 360}, 80%, 40%)`];
}

const SampleBadge = ({ title }: { title: string }) => (
    <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 border border-yellow-300 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
        {title}
    </span>
);

function CompanyPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const domain = typeof params.domain === 'string' ? params.domain : 'example.com';
    const { competitor, loading, error, metrics, gaps: backendGaps, reviews: backendReviews, campaigns: backendCampaigns } = useCompany(domain);

    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [commandActive, setCommandActive] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    
    useEffect(() => {
        document.body.classList.toggle('is-thinking-active', isThinking);
        return () => document.body.classList.remove('is-thinking-active');
    }, [isThinking]);

    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setCommandActive(false);
                setSidebarCollapsed(true);
            }
        };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, []);

    const reviewsScrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const scrollList = (dir: 'left' | 'right') => {
        if (reviewsScrollRef.current) {
            reviewsScrollRef.current.scrollBy({ left: dir === 'left' ? -344 : 344, behavior: 'smooth' });
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!reviewsScrollRef.current) return;
        setIsDragging(true);
        setDragStartX(e.pageX - reviewsScrollRef.current.offsetLeft);
        setScrollLeft(reviewsScrollRef.current.scrollLeft);
        reviewsScrollRef.current.style.cursor = 'grabbing';
    };
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !reviewsScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - reviewsScrollRef.current.offsetLeft;
        reviewsScrollRef.current.scrollLeft = scrollLeft - (x - dragStartX) * 2;
    };
    const handlePointerUp = () => {
        setIsDragging(false);
        if (reviewsScrollRef.current) reviewsScrollRef.current.style.cursor = 'grab';
    };

    const companyName = competitor?.name || (domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1));
    const [brandColor1, brandColor2] = getBrandColors(domain);
    const [logoUrl, setLogoUrl] = useState(companyLogoUrl(domain) ?? '');
    
    // Pin state is owned by PinnedContext, which is what the sidebar and the
    // competitors grid both read. This button used to hold its own useState, so
    // it lit up on click, persisted nothing, and disagreed with the pin icon on
    // /competitors for the same company.
    const { pin, unpin, isPinned } = usePinned();
    const [pinPending, setPinPending] = useState(false);
    const pinnedState = competitor ? isPinned(competitor.id) : false;

    const togglePin = async () => {
        if (!competitor || pinPending) return;
        setPinPending(true);
        try {
            if (pinnedState) {
                await unpin(competitor.id);
            } else {
                await pin({
                    competitor_id: competitor.id,
                    domain: extractDomain(competitor.website ?? '') || domain,
                    name: competitor.name || companyName,
                    logo: companyLogoUrl(domain) ?? '',
                    hasNews: false,
                });
            }
        } finally {
            setPinPending(false);
        }
    };

    const startX = searchParams.get('startX');
    const startY = searchParams.get('startY');
    const startW = searchParams.get('startW');
    const isRound = searchParams.get('round') === 'true';
    const [isMorphing, setIsMorphing] = useState(!!startX);
    const logoRef = useRef<HTMLDivElement>(null);
    const [morphStyle, setMorphStyle] = useState<any>({
        position: 'fixed',
        left: startX ? `${startX}px` : '0px',
        top: startY ? `${startY}px` : '0px',
        width: startW ? `${startW}px` : '0px',
        height: startW ? `${startW}px` : '0px',
        borderRadius: isRound ? '50%' : '6px',
        transition: 'none',
        zIndex: 9999,
    });
    const [c1, c2] = getBrandColors(domain);

    useEffect(() => {
        if (startX && startY && startW) {
            const sx = parseFloat(startX);
            const sy = parseFloat(startY);
            const sw = parseFloat(startW);
            setMorphStyle({ position: 'fixed', left: sx, top: sy, width: sw, height: sw, borderRadius: '6px', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 9999 });
            const raf = requestAnimationFrame(() => {
                if (logoRef.current) {
                    const rect = logoRef.current.getBoundingClientRect();
                    setMorphStyle({ position: 'fixed', left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: '6px', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 9999 });
                    setTimeout(() => setIsMorphing(false), 500);
                }
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [startX]);

    const chartData = useMemo(() => {
        if (!metrics.share?.points?.length && !metrics.engagement?.points?.length && !metrics.time?.points?.length) {
            return [];
        }
        const dateSet = new Set<string>();
        metrics.share?.points?.forEach(p => dateSet.add(p.timestamp.substring(0, 7)));
        metrics.engagement?.points?.forEach(p => dateSet.add(p.timestamp.substring(0, 7)));
        metrics.time?.points?.forEach(p => dateSet.add(p.timestamp.substring(0, 7)));
        
        const dates = Array.from(dateSet).sort();
        return dates.map(d => {
            const sharePoint = metrics.share?.points?.find(p => p.timestamp.startsWith(d));
            const engPoint = metrics.engagement?.points?.find(p => p.timestamp.startsWith(d));
            const timePoint = metrics.time?.points?.find(p => p.timestamp.startsWith(d));
            
            const dObj = new Date(d + '-01');
            const name = dObj.toLocaleString('en-US', { month: 'short' });

            return {
                name,
                share: sharePoint?.value ?? 0,
                engagement: engPoint?.value ?? 0,
                time: timePoint?.value ?? 0,
            };
        });
    }, [metrics]);

    // `confidence` is the only urgency signal a gap actually carries: severity is
    // a crises field, and layer is constant here because use-company only asks
    // for layer='gap'. Some rows store 0..1 and others 0..100.
    const displayGaps = backendGaps.map(g => ({
        id: g.id,
        title: g.title,
        desc: g.body || '',
        confidence: g.confidence === null ? null : Math.round(g.confidence <= 1 ? g.confidence * 100 : g.confidence),
        sources: g.sources ?? [],
    }));

    // `stars` stays null when no rating was captured: defaulting to 5 turned
    // every unrated review into a glowing one. sense_reviews stores no author
    // avatar, so there is nothing to show but the initial.
    const displayReviews = backendReviews.map(r => ({
        id: r.id,
        user: String(r.metadata?.author ?? "Anonymous"),
        date: r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : "Recently",
        text: r.body || "",
        stars: r.rating === null ? null : Math.round(r.rating),
    }));

    const displayCampaigns = backendCampaigns.map((c, i) => ({
        id: c.id,
        name: c.title,
        date: c.detected_at ? new Date(c.detected_at).toLocaleDateString() : "Active",
        metric: String(c.metadata?.metric ?? "N/A"),
        status: String(c.metadata?.status ?? "Active"),
        color: "#00A4EF",
        imgs: c.posts.map(p => p.url).filter(Boolean).slice(0, 3)
    }));


    const [activeChart, setActiveChart] = useState<string | null>(null);
    const [expandedGap, setExpandedGap] = useState<number | null>(null);

    const chevron = (rotated: boolean) => (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"
            style={{ transform: rotated ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );

    const quickStats = [
        { label: 'Peak Market Share', value: '70%', sub: 'Jul 2026' },
        { label: 'Peak Engagement', value: '550K', sub: 'Jul 2026' },
        { label: 'Avg Response Time', value: '51s', sub: 'across 10 mo.' },
    ];

    if (loading) {
        return <CompanyDetailSkeleton />;
    }

    if (error === 'Not Found') {
        return (
            <div className="page-container px-4 md:px-8 pt-8 pb-24 relative flex items-center justify-center min-h-[50vh]">
                <div className="text-center bg-[var(--card-bg)] border border-[var(--border-color)] p-8 rounded-xl">
                    <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Company Not Found</h2>
                    <p className="text-[var(--text-secondary)]">We couldn't find data for {domain}.</p>
                </div>
            </div>
        );
    }

    return (
        <>
        {/* Ambient Gradient - Fixed positioned behind content spanning full viewport to prevent sidebar clipping */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.4 }}>
            <style>{`
                @keyframes liveGradient {
                    0% { transform: scale(1) translate(0px, 0px); opacity: 0.35; }
                    33% { transform: scale(1.05) translate(2%, 2%); opacity: 0.5; }
                    66% { transform: scale(0.95) translate(-2%, -2%); opacity: 0.35; }
                    100% { transform: scale(1) translate(0px, 0px); opacity: 0.35; }
                }
            `}</style>
            <div className="absolute top-[-150px] left-0 right-0 h-[600px]" style={{
                background: `radial-gradient(circle at 30% 0%, ${c1}, transparent 50%), radial-gradient(circle at 70% 20%, ${c2}, transparent 50%)`,
                filter: 'blur(80px)', animation: 'liveGradient 15s ease-in-out infinite'
            }} />
        </div>

        {isMorphing && (
            <div style={{ ...morphStyle, background: 'var(--card-bg)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
        )}

        <div className="page-container px-4 md:px-8 pt-8 pb-24 relative z-10">
            <div className={`transition-all duration-500 w-full max-w-[1320px] mx-auto ${isMorphing ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0'}`}>

                {/* ── HERO CARD ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 md:p-8 mb-8 relative overflow-hidden"
                >
                    {/* Top row: logo + identity + stats */}
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10">
                        {/* Logo */}
                        <div ref={logoRef} className={`w-20 h-20 bg-[var(--card-bg-alt)] border border-[var(--border-color)] rounded-md flex items-center justify-center overflow-hidden flex-shrink-0 ${isMorphing ? 'opacity-0' : 'opacity-100'}`}>
                            <img
                                src={logoUrl}
                                alt={companyName}
                                className="w-full h-full object-contain"
                                onError={() => setLogoUrl(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`)}
                            />
                        </div>

                        {/* Company Identity */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight m-0">{companyName}</h1>
                                <span className="text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded uppercase tracking-wider">Technology</span>
                            </div>
                            <div className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
                                {competitor?.founding_year ? `Est. ${competitor.founding_year}` : 'Est. 1967'} &middot; {domain}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-4 max-w-[600px] mb-0">
                                {competitor?.description || 'No description captured yet.'}
                            </p>
                        </div>

                        {/* Right: Market info & Actions */}
                        <div className="flex flex-col gap-2 flex-shrink-0 text-left md:text-right">
                            <div className="flex md:justify-end gap-2 mb-2">
                                <button
                                    onClick={togglePin}
                                    disabled={!competitor || pinPending}
                                    aria-pressed={pinnedState}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        pinnedState
                                        ? 'bg-[var(--text-primary)] text-[var(--card-bg)] border-[var(--text-primary)]'
                                        : 'bg-[var(--card-bg-alt)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--item-hover)]'
                                    }`}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill={pinnedState ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                    </svg>
                                    {pinnedState ? 'Pinned' : 'Pin to Sidebar'}
                                </button>
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] font-medium">Market Valuation</div>
                            <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-none">{competitor?.market_valuation_usd ? `$${(competitor.market_valuation_usd / 1e9).toFixed(2)}B` : '$0.67B'}</div>
                            <div className="text-xs text-[var(--text-secondary)] font-medium mt-2">Industry</div>
                            <div className="flex md:justify-end">
                                <span className="text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded uppercase tracking-wider">{competitor?.industry || 'Technology'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-[1px] bg-[var(--border-color)] my-6 relative z-10" />

                    {/* Quick stats row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        {quickStats.map((stat, i) => (
                            <div key={i} className="p-4 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)]">
                                <div className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{stat.value}</div>
                                <div className="text-xs text-[var(--text-secondary)] font-medium mt-1">{stat.label}</div>
                                <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 opacity-70">{stat.sub}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── 2-COL: CHARTS | STRATEGIC GAPS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-8 items-start">
                    {/* CHARTS */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.07 }}
                        className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 min-w-0"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider m-0 flex items-center">
                                Performance Analytics
                            </h3>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded tracking-wider">CLICK TO EXPAND</span>
                        </div>

                        <div className="flex flex-col gap-6">
                            {[
                                { key: 'market', dataKey: 'share', label: 'Market Share (%)', color: brandColor1 },
                                { key: 'engagement', dataKey: 'engagement', label: 'Engagement (K)', color: brandColor2 },
                                { key: 'time', dataKey: 'time', label: 'Avg Response Time (s)', color: 'var(--text-secondary)' },
                            ].map(({ key, dataKey, label, color }) => (
                                <div
                                    key={key}
                                    onClick={() => setActiveChart(activeChart === key ? null : key)}
                                    className="skeleton-target cursor-pointer flex flex-col transition-all duration-300 min-w-0"
                                    style={{
                                        height: activeChart === key ? 300 : 140,
                                        background: activeChart === key ? 'var(--item-hover)' : 'transparent',
                                        padding: activeChart === key ? 16 : 0,
                                        borderRadius: 8
                                    }}
                                >
                                    <h4 className="m-0 mb-3 text-xs font-semibold text-[var(--text-primary)] tracking-wide">{label}</h4>
                                    <LineChartCard
                                        data={chartData}
                                        dataKey={dataKey}
                                        xKey="name"
                                        color={color}
                                        palette={TOKEN_PALETTE}
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* STRATEGIC GAPS */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.12 }}
                        className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider m-0 flex items-center flex-wrap gap-2">
                                Strategic Gaps
                            </h3>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded">{displayGaps.length}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {displayGaps.length === 0 && <div className="text-sm text-[var(--text-secondary)]">No gaps found.</div>}
                            {displayGaps.map((gap, i) => (
                                <div key={gap.id}>
                                    <div
                                        onClick={() => setExpandedGap(expandedGap === i ? null : i)}
                                        className="bg-[var(--card-bg-alt)] border border-[var(--border-color)] rounded-md p-3.5 flex flex-col gap-2 cursor-pointer hover:bg-[var(--item-hover)] transition-colors relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="text-sm font-semibold text-[var(--text-primary)]">{gap.title}</div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {gap.confidence !== null && (
                                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{gap.confidence}% conf.</span>
                                                )}
                                                {chevron(expandedGap === i)}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.desc}</div>
                                    </div>
                                    <AnimatePresence>
                                        {expandedGap === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-3 border-t border-[var(--border-color)] mt-1 bg-[var(--card-bg)]">
                                                    <div className="text-[10px] text-[var(--text-secondary)] font-bold mb-2 tracking-wider uppercase">
                                                        Evidence{gap.sources.length > 0 && ` · ${gap.sources.length}`}
                                                    </div>
                                                    {gap.sources.length === 0 ? (
                                                        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                            No signals were cited for this gap.
                                                        </div>
                                                    ) : (
                                                        <ul className="flex flex-col gap-1.5 m-0 p-0 list-none">
                                                            {gap.sources.map((s) => (
                                                                <li key={s.id} className="text-xs leading-relaxed">
                                                                    {s.url ? (
                                                                        <a
                                                                            href={s.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="text-[var(--text-primary)] font-medium hover:underline"
                                                                        >
                                                                            {s.title || s.url}
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-[var(--text-primary)] font-medium">{s.title || 'Untitled signal'}</span>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ── RECENT CAMPAIGNS (Simplified Deck) ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.17 }}
                    className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 mb-8"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider m-0 flex items-center flex-wrap gap-2">
                            Recent Campaigns
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-primary)] bg-[var(--card-bg-alt)] border border-[var(--border-color)] px-2 py-1 rounded tracking-wider uppercase hover:bg-[var(--item-hover)] transition-colors cursor-pointer">
                            View All
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {displayCampaigns.length === 0 && <div className="text-sm text-[var(--text-secondary)] col-span-full">No campaigns found.</div>}
                        {displayCampaigns.map((camp, i) => (
                            <div key={camp.id || i} onDoubleClick={() => { if (camp.id) router.push(`/campaigns/${camp.id}`); }} title={camp.id ? undefined : 'Campaign id missing — cannot open this campaign'} className={`flex flex-col items-center p-3 bg-[var(--card-bg-alt)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--item-hover)] transition-colors ${camp.id ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                <div className="scene mb-3 scale-90 origin-top">
                                    <div className="deck-wrapper" title={camp.name}>
                                        <div className="cards">
                                            {/* Simplified cards - NO floating bubbles */}
                                            <div className="card card-left" style={{ backgroundImage: `url('${camp.imgs[0]}')` }}></div>
                                            <div className="card card-right" style={{ backgroundImage: `url('${camp.imgs[1]}')` }}></div>
                                            <div className="card deck-front" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('${camp.imgs[2]}')` }}>
                                                <div className="logo text-[10px] font-bold uppercase tracking-wider text-zinc-200">{camp.name}</div>
                                            </div>
                                        </div>
                                        <div className="cord-ring" />
                                    </div>
                                </div>
                                <div className="text-center w-full">
                                    <div className="text-sm font-bold text-[var(--text-primary)]">{camp.metric}</div>
                                    <div className="text-[10px] text-[var(--text-secondary)] mt-1 flex justify-center gap-2 items-center font-bold uppercase tracking-wider">
                                        <span>{camp.date}</span>
                                        <span className="w-1 h-1 rounded-sm bg-[var(--border-color)]" />
                                        <span>{camp.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── CUSTOMER REVIEWS (Horizontal Scroll - Dashboard Style) ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.22 }}
                    className="flex flex-col md:flex-row gap-12 overflow-hidden items-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 mb-8"
                >
                    <div className="shrink-0 w-full md:w-48 flex flex-col justify-start">
                        <div className="text-6xl text-[var(--border-color)] leading-none mb-6 font-serif">&ldquo;</div>
                        <h3 className="text-base font-medium text-[var(--text-primary)] mb-8 flex items-center flex-wrap gap-2">
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
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        {displayReviews.length === 0 && <div className="text-sm text-[var(--text-secondary)]">No reviews captured yet.</div>}
                        {displayReviews.map((rev) => (
                            <div key={rev.id} className="min-w-[280px] md:min-w-[340px] snap-start">
                                <div className="flex flex-col h-full cursor-pointer hover:bg-[var(--bg-main-alt)] p-6 rounded-lg transition-colors border border-transparent hover:border-[var(--border-color)]">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 rounded-full border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] text-sm font-bold uppercase">
                                            {rev.user.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-[var(--text-primary)] text-sm font-medium">{rev.user}</div>
                                            <div className="text-[var(--text-secondary)] text-xs mt-1">{rev.date}</div>
                                        </div>
                                    </div>
                                    <div className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6 flex-1">
                                        &ldquo;{rev.text}&rdquo;
                                    </div>
                                    {rev.stars === null ? (
                                        <div className="text-[var(--text-secondary)] text-xs">No rating</div>
                                    ) : (
                                        (() => {
                                            // Bound to a const: the null check above does not narrow
                                            // `rev.stars` inside the map callback below.
                                            const stars = rev.stars;
                                            return (
                                                <div className="flex gap-1.5 text-[var(--text-primary)]">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <svg key={idx} width="16" height="16" viewBox="0 0 24 24" fill={idx < stars ? "currentColor" : "none"} stroke={idx < stars ? "none" : "currentColor"} strokeWidth="2" className={idx >= stars ? "opacity-20" : ""}>
                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
        <PromptField
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            commandActive={commandActive}
            setCommandActive={setCommandActive}
            setSidebarCollapsed={setSidebarCollapsed}
            onThinkingChange={setIsThinking}
        />
        </>
    );
}

export default function CompanyPage() {
    return (
        <Suspense fallback={<div className="page-container" />}>
            <CompanyPageContent />
        </Suspense>
    );
}
