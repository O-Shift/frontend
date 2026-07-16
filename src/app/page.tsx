'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import PromptField from '@/components/PromptField';
import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from 'recharts';

// CSS variable helpers for inline styles
const C = {
  text: 'var(--text-primary)',
  sub: 'var(--text-secondary)',
  card: 'var(--card-bg-alt)',
  border: 'var(--border-color)',
  divider: 'rgba(0,0,0,0.06)',
} as const;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

const platformData: Record<string, any[]> = {
    all: months.map((m, i) => ({
        name: m, audience: [42, 68, 31, 55, 72, 38, 59, 81, 44, 63][i],
        projected: [45, 48, 50, 52, 54, 55, 57, 58, 60, 61][i],
        views: [310, 520, 180, 390, 560, 240, 430, 610, 280, 470][i],
        engagement: [4.8, 6.2, 3.1, 5.5, 7.0, 3.8, 5.4, 7.5, 4.0, 6.0][i]
    })),
    youtube: months.map((m, i) => ({
        name: m, audience: [32, 48, 22, 39, 51, 28, 42, 55, 30, 44][i],
        projected: [30, 32, 34, 36, 38, 39, 40, 41, 42, 43][i],
        views: [210, 340, 130, 260, 370, 170, 290, 390, 190, 310][i],
        engagement: [4.0, 5.2, 2.8, 4.6, 5.8, 3.2, 4.9, 6.1, 3.5, 5.0][i]
    })),
    tiktok: months.map((m, i) => ({
        name: m, audience: [52, 72, 38, 65, 80, 45, 68, 88, 50, 73][i],
        projected: [48, 51, 54, 57, 60, 63, 66, 68, 70, 72][i],
        views: [320, 520, 210, 460, 600, 280, 480, 650, 300, 510][i],
        engagement: [5.8, 7.5, 4.0, 6.8, 8.2, 4.5, 6.5, 8.5, 5.0, 7.2][i]
    })),
    instagram: months.map((m, i) => ({
        name: m, audience: [38, 52, 28, 47, 58, 32, 50, 62, 34, 48][i],
        projected: [35, 37, 39, 41, 43, 44, 45, 46, 47, 48][i],
        views: [240, 360, 160, 310, 420, 200, 340, 460, 220, 370][i],
        engagement: [4.4, 5.8, 3.2, 5.0, 6.2, 3.5, 5.2, 6.5, 3.8, 5.5][i]
    })),
    podcast: months.map((m, i) => ({
        name: m, audience: [22, 34, 16, 30, 38, 20, 32, 42, 24, 35][i],
        projected: [20, 22, 24, 26, 28, 29, 30, 31, 32, 33][i],
        views: [110, 190, 80, 170, 220, 100, 180, 250, 120, 200][i],
        engagement: [3.2, 4.6, 2.4, 4.0, 5.0, 2.8, 4.2, 5.4, 3.0, 4.5][i]
    }))
};

const opportunities = [
    { name: "Brand Deal — Nike", desc: "Product placement opportunity", value: 15, priority: "high", platform: "ig", expiresIn: 12, badge: false },
    { name: "Podcast Collab", desc: "The Joe Rogan Experience", value: 50, priority: "high", platform: "podcast", expiresIn: 5, badge: false },
    { name: "Sponsorship — Raycon", desc: "90-day exclusive offer", value: 8, priority: "medium", platform: "yt", expiresIn: 30, badge: true }
];

const perfItems = [
    { name: "Summer Creator Fund", metric: "+15%", progress: 64, target: "5M views", trend: "up", badge: false },
    { name: "Tech Reviewers Push", metric: "2.4M", progress: 100, target: "2.4M views", trend: "flat", badge: false },
    { name: "Podcast Sponsorships", metric: "-5%", progress: 30, target: "$20K revenue", trend: "down", badge: true }
];

const campaigns = [
    {
        name: "Summer Creator Fund", date: "Jun 2026", metric: "+15% Engagement", status: "Active",
        color: "#8B5CF6", budget: 25, spent: 16, progress: 64, platforms: ["yt", "ig", "tiktok"],
        imgs: ['https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80'],
        platformMetrics: [
            { platform: "YouTube", views: "1.2M", engagement: "4.8%" },
            { platform: "Instagram", views: "850K", engagement: "5.2%" },
            { platform: "TikTok", views: "1.8M", engagement: "6.1%" }
        ]
    },
    {
        name: "Tech Reviewers Push", date: "May 2026", metric: "2.4M Views", status: "Completed",
        color: "#6366F1", budget: 15, spent: 14.2, progress: 100, platforms: ["yt"],
        imgs: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&q=80', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80', 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=300&q=80'],
        platformMetrics: [
            { platform: "YouTube", views: "2.4M", engagement: "3.2%" }
        ]
    },
    {
        name: "Podcast Sponsorships", date: "Apr 2026", metric: "-5% ROI", status: "Underperforming",
        color: "#A855F7", budget: 10, spent: 8, progress: 30, platforms: ["podcast"],
        imgs: ['https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&q=80', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&q=80', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&q=80'],
        platformMetrics: [
            { platform: "Podcast", views: "420K", engagement: "2.1%" }
        ]
    }
];

const gaps = [
    { title: "Gen-Z Reach", desc: "Low engagement compared to peers on TikTok.", severity: "high", action: "Launch short-form vertical video series targeting 18-24 demographic", benchmark: "Peers avg 2.3x higher" },
    { title: "Sponsorship ROI", desc: "Diminishing returns on major influencer campaigns.", severity: "medium", action: "Diversify into micro-influencer partnerships with higher conversion rates", benchmark: "Micro-influencers avg 3.5% higher ROI" },
    { title: "Sentiment Dip", desc: "Recent PR issues affected overall trust scores.", severity: "low", action: "Publish behind-the-scenes content and community AMA to rebuild trust", benchmark: "Trust scores down 12% vs last quarter" }
];

const reviews = [
    { user: "Karan", date: "1 week ago", text: "Incredible ecosystem integration. Nothing else comes close to this level of polish.", stars: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", responseStatus: "replied", sentiment: "positive" },
    { user: "Sarah", date: "3 weeks ago", text: "Prices keep going up but the core product hasn't improved much. Really frustrating.", stars: 2, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", responseStatus: "pending", sentiment: "critical" },
    { user: "Catherine", date: "10 days ago", text: "The new update completely fixed my workflow issues. They respond in a timely manner.", stars: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", responseStatus: "replied", sentiment: "positive" },
    { user: "Peter", date: "2 weeks ago", text: "Customer service took 3 days to respond to a critical billing error. Unacceptable.", stars: 1, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", responseStatus: "ignored", sentiment: "critical" },
    { user: "Maya", date: "5 days ago", text: "Good product but the mobile app needs work. Keeps crashing on iOS.", stars: 3, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", responseStatus: "pending", sentiment: "neutral" }
];

const brandColor1 = '#C4841D';
const brandColor2 = '#A16207';

const platformLabels: Record<string, string> = { yt: "YT", ig: "IG", tiktok: "TT", podcast: "PC" };
const platformFullLabels: Record<string, string> = { all: "All", youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", podcast: "Podcast" };

function Sparkline({ data, color, height = 20 }: { data: number[]; color: string; height?: number }) {
    const w = 60;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * height}`).join(' ');
    return (
        <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{ flexShrink: 0 }}>
            <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
        </svg>
    );
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'flat' }) {
    if (trend === 'flat') return <span style={{ color: '#a1a1aa', fontSize: 12 }}>&rarr;</span>;
    return <span style={{ color: '#a1a1aa', fontSize: 12 }}>{trend === 'up' ? '\u2191' : '\u2193'}</span>;
}

function PriorityDot({ level }: { level: string }) {
    const opacity: Record<string, string> = { high: '1', medium: '0.6', low: '0.3' };
    return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: brandColor1, opacity: opacity[level] || 0.3, marginRight: 6 }} />;
}

const dateRanges = ['1M', '3M', '6M', '1Y'];
const chartMetrics = ['audience', 'views', 'engagement'];
const chartTitles: Record<string, string> = { audience: 'Audience Growth (%)', views: 'Views (K)', engagement: 'Engagement Rate (%)' };
const chartColors: Record<string, string> = { audience: brandColor1, views: brandColor2, engagement: '#d4d4d8' };
const platforms = ['all', 'youtube', 'tiktok', 'instagram', 'podcast'];

const reviewFilters = ['All', 'Positive', 'Critical', 'Needs Reply'];

export default function DashboardPage() {
    const router = useRouter();

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

    const [activeChart, setActiveChart] = useState<string | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState('all');
    const [selectedRange, setSelectedRange] = useState('6M');
    const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);
    const [expandedOpp, setExpandedOpp] = useState<number | null>(null);
    const [expandedPerf, setExpandedPerf] = useState<number | null>(null);
    const [expandedGap, setExpandedGap] = useState<number | null>(null);
    const [reviewFilter, setReviewFilter] = useState('All');
    const [replyText, setReplyText] = useState<Record<number, string>>({});
    const [replyOpen, setReplyOpen] = useState<number | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const scrollList = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = 344;
            scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setDragStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
        scrollRef.current.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - dragStartX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
    };

    const gapsScrollRef = useRef<HTMLDivElement>(null);
    const [isGapsDragging, setIsGapsDragging] = useState(false);
    const [gapsDragStartX, setGapsDragStartX] = useState(0);
    const [gapsScrollLeft, setGapsScrollLeft] = useState(0);

    const scrollGaps = (dir: 'left' | 'right') => {
        if (gapsScrollRef.current) {
            const amount = 344;
            gapsScrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
        }
    };

    const handleGapsPointerDown = (e: React.PointerEvent) => {
        if (!gapsScrollRef.current) return;
        setIsGapsDragging(true);
        setGapsDragStartX(e.pageX - gapsScrollRef.current.offsetLeft);
        setGapsScrollLeft(gapsScrollRef.current.scrollLeft);
        gapsScrollRef.current.style.cursor = 'grabbing';
    };

    const handleGapsPointerMove = (e: React.PointerEvent) => {
        if (!isGapsDragging || !gapsScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - gapsScrollRef.current.offsetLeft;
        const walk = (x - gapsDragStartX) * 2;
        gapsScrollRef.current.scrollLeft = gapsScrollLeft - walk;
    };

    const handleGapsPointerUp = () => {
        setIsGapsDragging(false);
        if (gapsScrollRef.current) gapsScrollRef.current.style.cursor = 'grab';
    };

    const currentData = platformData[selectedPlatform] || platformData.all;
    const filteredReviews = reviews.filter(r => {
        if (reviewFilter === 'Positive') return r.sentiment === 'positive';
        if (reviewFilter === 'Critical') return r.sentiment === 'critical';
        if (reviewFilter === 'Needs Reply') return r.responseStatus === 'pending';
        return true;
    });

    return (
        <>
        <div className="main-content" style={{ overflowY: 'auto', paddingBottom: 60, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <style>{`
                @keyframes liveGradient {
                    0% { transform: scale(1) translate(0px, 0px); opacity: 0.35; }
                    33% { transform: scale(1.05) translate(2% , 2%); opacity: 0.5; }
                    66% { transform: scale(0.95) translate(-2%, -2%); opacity: 0.35; }
                    100% { transform: scale(1) translate(0px, 0px); opacity: 0.35; }
                }
            `}</style>

            <div style={{
                position: 'absolute', top: -150, left: 0, right: 0, height: '600px',
                background: `radial-gradient(circle at 30% 0%, ${brandColor1}, transparent 50%), radial-gradient(circle at 70% 20%, ${brandColor2}, transparent 50%)`,
                filter: 'blur(80px)', animation: 'liveGradient 15s ease-in-out infinite',
                pointerEvents: 'none', zIndex: 0
            }} />

            <div style={{ padding: '60px 40px', maxWidth: 1100, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div className="dash-logo-box" style={{ width: 88, height: 88, borderRadius: 20, background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={brandColor1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ fontSize: 36, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Vasil S.</h2>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 16, marginTop: 2, fontWeight: 500 }}>Creator & Founder &middot; Since 2024</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                        <div style={{ fontSize: 14, color: '#a1a1aa', fontWeight: 500 }}>Platform</div>
                        <div style={{ fontSize: 18, color: 'white', fontWeight: 600 }}>OShift</div>
                    </div>
                </div>

                {/* STATS BAR */}
                <div style={{ display: 'flex', marginBottom: 48, borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }} className="section-divider">
                    {[
                        { label: 'Total Followers', value: '847K', change: '+12%', trend: 'up' as const, data: [30, 35, 32, 40, 45, 42, 50, 55, 52, 60, 65, 62, 70] },
                        { label: 'Total Views', value: '12.4M', change: '+8%', trend: 'up' as const, data: [100, 120, 110, 140, 160, 150, 180, 200, 190, 220, 240, 230, 260] },
                        { label: 'Revenue (MTD)', value: '$24.5K', change: '+15%', trend: 'up' as const, data: [5, 8, 7, 10, 12, 11, 14, 16, 15, 18, 20, 19, 24.5] },
                        { label: 'Active Campaigns', value: '3', change: '0%', trend: 'flat' as const, data: [2, 2, 3, 3, 3, 4, 3, 3, 2, 3, 3, 3, 3] },
                        { label: 'Avg Engagement', value: '4.2%', change: '+0.3%', trend: 'up' as const, data: [3.5, 3.8, 3.6, 4.0, 4.2, 3.9, 4.1, 4.3, 4.0, 4.2, 4.5, 4.3, 4.2] },
                    ].map((stat, i) => (
                        <div key={i} className="skeleton-target" style={{
                            flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6,
                            borderRight: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                        }}>
                            <div className="stat-label" style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span className="stat-value" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{stat.value}</span>
                                <span className="stat-change" style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.change}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* OPPORTUNITIES + PERFORMANCE */}
                <div className="skeleton-target opp-perf-panel" style={{ display: 'flex', marginBottom: 60, border: '1px solid var(--border-color)', borderRadius: 12 }}>
                    <div style={{ flex: 1, padding: '24px 28px', borderRight: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>Opportunities</h3>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{opportunities.length} open</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {opportunities.map((item, i) => (
                                <div key={i}>
                                    <div
                                        onClick={() => setExpandedOpp(expandedOpp === i ? null : i)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                                            <PriorityDot level={item.priority} />
                                            <div>
                                                <div className="opp-item-name" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
                                                <div className="opp-item-meta" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span>${item.value}K &middot; {item.expiresIn}d left</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {item.badge && <span style={{ fontSize: 10, color: brandColor1, fontWeight: 600 }}>New</span>}
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" style={{ transform: expandedOpp === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {expandedOpp === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{ padding: '10px 14px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div className="opp-expanded-text" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.desc}</div>
                                                    <button style={{ background: brandColor1, border: 'none', color: 'white', fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 6, cursor: 'pointer' }}>Apply</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                        <div style={{ textAlign: 'right', marginTop: 8 }}>
                            <a style={{ color: '#a1a1aa', fontSize: 12, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>See More &rarr;</a>
                        </div>
                    </div>

                    <div style={{ flex: 1, padding: '24px 28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>Performance</h3>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{perfItems.length} active</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {perfItems.map((item, i) => (
                                <div key={i}>
                                    <div
                                        onClick={() => setExpandedPerf(expandedPerf === i ? null : i)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{item.name}</div>
                                            <div style={{ marginTop: 4 }}>
                                                <div className="progress-track" style={{ height: 2, background: 'var(--border-color)', borderRadius: 1, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${item.progress}%`, background: brandColor1, borderRadius: 1 }} />
                                                </div>
                                                <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 2 }}>{item.progress}% &middot; {item.target}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: brandColor1 }}>{item.metric}</span>
                                            {item.badge && <span style={{ fontSize: 10, color: brandColor1, fontWeight: 600 }}>New</span>}
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" style={{ transform: expandedPerf === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {expandedPerf === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{ padding: '10px 14px', marginBottom: 4 }}>
                                                    <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#d4d4d8' }}>
                                                        <span>Target: <strong style={{ color: 'white' }}>{item.target}</strong></span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                        <div style={{ textAlign: 'right', marginTop: 8 }}>
                            <a style={{ color: '#a1a1aa', fontSize: 12, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>See More &rarr;</a>
                        </div>
                    </div>
                </div>

                {/* CHARTS SECTION */}
                <div style={{ marginBottom: 60 }}>
                    {/* Chart toolbar */}
                    <div className="skeleton-target" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        <div className="chart-toolbar-pill" style={{ display: 'flex', gap: 4, background: 'var(--card-bg-alt)', padding: 3, borderRadius: 10, border: '1px solid var(--border-color)' }}>
                            {platforms.map(p => (
                                <button key={p} onClick={() => setSelectedPlatform(p)} style={{
                                    background: selectedPlatform === p ? brandColor1 : 'transparent', border: 'none', color: selectedPlatform === p ? 'white' : '#a1a1aa',
                                    fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s'
                                }}>{platformFullLabels[p]}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 4, background: '#18181b', padding: 3, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                            {dateRanges.map(r => (
                                <button key={r} onClick={() => setSelectedRange(r)} style={{
                                    background: selectedRange === r ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: selectedRange === r ? 'white' : '#a1a1aa',
                                    fontSize: 12, fontWeight: 500, padding: '5px 10px', borderRadius: 7, cursor: 'pointer'
                                }}>{r}</button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: activeChart ? '1fr 1fr' : '1fr 1fr 1fr', gap: 32 }}>
                        {chartMetrics.map((metric) => (
                            <div key={metric}
                                onClick={() => setActiveChart(activeChart === metric ? null : metric)}
                                className="skeleton-target"
                                style={{
                                    display: 'flex', flexDirection: 'column', cursor: 'pointer',
                                    gridColumn: activeChart === metric ? '1 / -1' : 'auto',
                                    order: activeChart === metric ? -1 : 0,
                                    height: activeChart === metric ? 380 : 220,
                                    transition: 'all 0.3s ease',
                                    background: activeChart === metric ? 'rgba(255,255,255,0.02)' : 'transparent',
                                    padding: activeChart === metric ? 24 : 0, borderRadius: 16
                                }}
                            >
                                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{chartTitles[metric]}</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={currentData}>
                                        <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#3f3f46' }} />
                                        <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#3f3f46' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} itemStyle={{ color: brandColor1 }} />
                                        {activeChart === metric && <ReferenceLine x="Apr" stroke="#a1a1aa" strokeDasharray="4 4" label={{ value: 'Campaign launch', fill: '#a1a1aa', fontSize: 10, position: 'insideTop' }} />}
                                        <Line type="linear" dataKey="projected" stroke="#52525b" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
                                        <Line type="linear" dataKey={metric} stroke={chartColors[metric]} strokeWidth={2} dot={{ r: 2.5, fill: chartColors[metric], stroke: 'none' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                                {activeChart === metric && (
                                    <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#a1a1aa' }}>
                                        <span><span style={{ color: chartColors[metric], fontWeight: 600 }}>&mdash;</span> Actual</span>
                                        <span><span style={{ color: '#52525b', fontWeight: 600 }}>&ndash; &ndash;</span> Projected</span>
                                        <span style={{ marginLeft: 'auto', color: brandColor1, fontWeight: 600 }}>Avg: +8.2% MoM</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* MY CAMPAIGNS */}
                <div style={{ marginBottom: 80 }}>
                    <div className="skeleton-target" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>My Campaigns</h3>
                        <div className="sort-pill" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)', background: 'var(--card-bg-alt)', padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border-color)' }}>
                            Sort by:
                            <span style={{ color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                Performance <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 36 }}>
                        {campaigns.map((camp, i) => (
                            <div key={i}>
                                <div 
                                    onClick={() => setExpandedCampaign(expandedCampaign === i ? null : i)} 
                                    onDoubleClick={() => router.push(`/campaigns/${i}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div className="scene" style={{ marginBottom: 16 }}>
                                            <div className="deck-wrapper" title={camp.name}>
                                                <div className="cards">
                                                    <div className="card card-left" style={{ backgroundImage: `url('${camp.imgs[0]}')` }}>
                                                      <div className="floating-bubble" style={{ bottom: 45, left: -20 }}>
                                                        <span style={{ color: '#0095ff', fontSize: 16 }}>✨</span> 20
                                                      </div>
                                                    </div>
                                                    
                                                    <div className="card card-right" style={{ backgroundImage: `url('${camp.imgs[1]}')` }}>
                                                      <div className="floating-bubble" style={{ top: 45, right: -25, width: 45, height: 45, borderRadius: '50%', justifyContent: 'center' }}>
                                                        Wen
                                                      </div>
                                                    </div>

                                                    <div className="card deck-front" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('${camp.imgs[2]}')` }}>
                                                        <div className="logo" style={{ fontSize: 13, lineHeight: 1.2, color: '#e4e4e7' }}>{camp.name}</div>
                                                    </div>
                                                </div>
                                                <div className="cord-ring" />
                                            </div>
                                        </div>
                                        <div className="camp-info-box" style={{ textAlign: 'center', background: 'var(--card-bg-alt)', padding: '14px 20px', borderRadius: 12, border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }}>
                                            <div className="camp-metric" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{camp.metric}</div>
                                            <div className="camp-meta" style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6, display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
                                                <span>{camp.date}</span>
                                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3f3f46' }}></span>
                                                <span style={{ color: camp.status === 'Active' ? brandColor1 : camp.status === 'Underperforming' ? '#a1a1aa' : '#d4d4d8' }}>{camp.status}</span>
                                            </div>
                                            <div style={{ marginTop: 8 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a1a1aa', marginBottom: 2 }}>
                                                    <span>Budget: ${camp.spent}K/${camp.budget}K</span>
                                                </div>
                                                <div className="progress-track" style={{ height: 3, background: 'var(--border-color)', borderRadius: 2, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${camp.progress}%`, background: brandColor1, borderRadius: 2 }} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                                                {camp.platforms.map(p => (
                                                    <span key={p} style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: brandColor1 }}>{platformLabels[p]}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {expandedCampaign === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 20 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Per-Platform Breakdown</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {camp.platformMetrics.map((pm, j) => (
                                                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: j < camp.platformMetrics.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', fontSize: 13 }}>
                                                            <span style={{ color: 'var(--text-secondary)' }}>{pm.platform}</span>
                                                            <div style={{ display: 'flex', gap: 20 }}>
                                                                <span style={{ color: 'var(--text-primary)' }}>{pm.views}</span>
                                                                <span style={{ color: brandColor1 }}>{pm.engagement}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GROWTH GAPS */}
                <div style={{ display: 'flex', gap: 60, width: '100%', overflow: 'hidden', padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="skeleton-target" style={{ flexShrink: 0, width: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ marginBottom: 24, opacity: 0.8 }}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h3 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 32, letterSpacing: '-0.02em' }}>Growth<br />Gaps<br /></h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button onClick={() => scrollGaps('left')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&larr;</button>
                            <div style={{ flex: 1, height: 2, background: '#27272a', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '30%', background: '#a1a1aa' }}></div>
                            </div>
                            <button onClick={() => scrollGaps('right')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&rarr;</button>
                        </div>
                    </div>

                    <div ref={gapsScrollRef} onPointerDown={handleGapsPointerDown} onPointerMove={handleGapsPointerMove} onPointerUp={handleGapsPointerUp} onPointerLeave={handleGapsPointerUp}
                        style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 24, scrollbarWidth: 'none', flex: 1, cursor: 'grab', alignItems: 'stretch' }}
                    >
                        {gaps.map((gap, i) => (
                            <div key={i} className="skeleton-target" style={{ minWidth: 320, width: 320, display: 'flex', flexDirection: 'column' }}>
                                <div onClick={() => setExpandedGap(expandedGap === i ? null : i)} className="gap-card" style={{
                                    background: 'var(--card-bg-alt)', borderRadius: 16, border: '1px solid var(--border-color)', padding: 28,
                                    display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', overflow: 'hidden', cursor: 'pointer'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: brandColor1, opacity: gap.severity === 'high' ? 0.8 : gap.severity === 'medium' ? 0.5 : 0.25 }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div className="gap-card-title" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{gap.title}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{gap.severity}</span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" style={{ transform: expandedGap === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
                                        </div>
                                    </div>
                                    <div className="gap-card-desc" style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{gap.desc}</div>
                                    <AnimatePresence>
                                        {expandedGap === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 12 }}>
                                                    <div style={{ marginBottom: 10 }}>
                                                        <div style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600, marginBottom: 4 }}>SUGGESTED ACTION</div>
                                                        <div style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.5 }}>{gap.action}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600, marginBottom: 4 }}>BENCHMARK</div>
                                                        <div style={{ fontSize: 13, color: '#a1a1aa' }}>{gap.benchmark}</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* REVIEWS */}
                <div style={{ display: 'flex', gap: 60, width: '100%', overflow: 'hidden', padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flexShrink: 0, width: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: 80, color: '#3f3f46', lineHeight: 0.8, marginBottom: 16, fontFamily: 'serif' }}>&ldquo;</div>
                        <h3 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 8, letterSpacing: '-0.02em' }}>What <br />customers are<br />saying</h3>
                        {/* Sentiment summary bar */}
                        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                            {(() => {
                                const pos = reviews.filter(r => r.sentiment === 'positive').length / reviews.length * 100;
                                const neu = reviews.filter(r => r.sentiment === 'neutral').length / reviews.length * 100;
                                const crit = reviews.filter(r => r.sentiment === 'critical').length / reviews.length * 100;
                                return (
                                    <div style={{ width: '100%', height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
                                        <div style={{ width: `${pos}%`, background: brandColor1 }} />
                                        <div style={{ width: `${neu}%`, background: '#a1a1aa' }} />
                                        <div style={{ width: `${crit}%`, background: '#3f3f46' }} />
                                    </div>
                                );
                            })()}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 24, fontSize: 11, color: '#a1a1aa' }}>
                            <span><span style={{ color: brandColor1, fontWeight: 600 }}>&#9632;</span> Positive</span>
                            <span><span style={{ color: '#a1a1aa', fontWeight: 600 }}>&#9632;</span> Neutral</span>
                            <span><span style={{ color: '#3f3f46', fontWeight: 600 }}>&#9632;</span> Critical</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button onClick={() => scrollList('left')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&larr;</button>
                            <div style={{ flex: 1, height: 2, background: '#27272a', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '30%', background: '#a1a1aa' }}></div>
                            </div>
                            <button onClick={() => scrollList('right')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&rarr;</button>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {/* Filter pills */}
                        <div className="skeleton-target filter-pill-group" style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--card-bg-alt)', padding: 3, borderRadius: 10, border: '1px solid var(--border-color)', width: 'fit-content' }}>
                            {reviewFilters.map(f => (
                                <button key={f} onClick={() => setReviewFilter(f)} style={{
                                    background: reviewFilter === f ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none',
                                    color: reviewFilter === f ? 'white' : '#a1a1aa', fontSize: 12, fontWeight: 500,
                                    padding: '5px 12px', borderRadius: 7, cursor: 'pointer'
                                }}>{f}</button>
                            ))}
                        </div>

                        <div ref={scrollRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
                            style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 24, scrollbarWidth: 'none', cursor: 'grab' }}
                        >
                            {filteredReviews.map((rev, i) => (
                                <div key={i} className="skeleton-target" style={{ minWidth: 320, width: 320 }}>
                                    <div className="review-card" style={{
                                        background: 'var(--card-bg-alt)', borderRadius: '24px', border: '1px solid var(--border-color)',
                                        padding: 28, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'
                                    }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: rev.stars > 3 ? brandColor1 : rev.stars > 2 ? '#f59e0b' : '#ef4444' }} />
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img src={rev.avatar} alt={rev.user} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                                                <div>
                                                    <div className="review-author" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>{rev.user}</div>
                                                    <div className="review-date" style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>{rev.date}</div>
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                                <div className="skeleton-target" style={{ display: 'flex', gap: 8, background: 'var(--card-bg)', padding: 6, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                                                    {Array.from({ length: 5 }).map((_, idx) => (
                                                        <svg key={idx} width="12" height="12" viewBox="0 0 24 24" fill={idx < rev.stars ? brandColor1 : "var(--border-color)"}>
                                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                                <div style={{
                                                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                                    background: rev.responseStatus === 'replied' ? 'rgba(196,132,29,0.15)' : rev.responseStatus === 'pending' ? 'rgba(196,132,29,0.1)' : 'var(--bg-main-alt)',
                                                    color: rev.responseStatus === 'replied' ? brandColor1 : rev.responseStatus === 'pending' ? brandColor1 : 'var(--text-secondary)',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    {rev.responseStatus === 'replied' ? 'Replied' : rev.responseStatus === 'pending' ? 'Pending' : 'Ignored'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="review-text" style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                                            &ldquo;{rev.text}&rdquo;
                                        </div>
                                        
                                        {rev.responseStatus === 'pending' && (
                                            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                                                <button onClick={() => setReplyOpen(replyOpen === i ? null : i)} style={{
                                                    background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600,
                                                    padding: '6px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s'
                                                }}>Reply</button>
                                            </div>
                                        )}
                                    </div>
                                    <AnimatePresence>
                                        {replyOpen === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                                    <input
                                                        value={replyText[i] || ''}
                                                        onChange={(e) => setReplyText({ ...replyText, [i]: e.target.value })}
                                                        placeholder="Write a reply..."
                                                        style={{
                                                            flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'white', outline: 'none'
                                                        }}
                                                    />
                                                    <button style={{ background: brandColor1, border: 'none', color: 'white', fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>Send</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <PromptField 
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            commandActive={commandActive}
            setCommandActive={setCommandActive}
            setSidebarCollapsed={setSidebarCollapsed}
            onSubmit={() => setIsThinking(true)}
        />
        </>
    );
}
