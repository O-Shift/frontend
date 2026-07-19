'use client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, Suspense } from 'react';
import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import PromptField from '@/components/PromptField';

// BACKEND: signals.signals aggregated by day (e.g. SELECT date_trunc('day', created_at), sum(score) WHERE competitor_id = ?)
const mockChartData = [
    { name: 'Jan', share: 48, engagement: 340, time: 58 },
    { name: 'Feb', share: 32, engagement: 210, time: 72 },
    { name: 'Mar', share: 55, engagement: 410, time: 45 },
    { name: 'Apr', share: 38, engagement: 280, time: 63 },
    { name: 'May', share: 62, engagement: 480, time: 39 },
    { name: 'Jun', share: 44, engagement: 320, time: 55 },
    { name: 'Jul', share: 70, engagement: 550, time: 34 },
    { name: 'Aug', share: 51, engagement: 390, time: 48 },
    { name: 'Sep', share: 58, engagement: 440, time: 42 },
    { name: 'Oct', share: 35, engagement: 260, time: 68 }
];

// BACKEND: insights.insights_gaps — SELECT title, description WHERE competitor_id = ?
const gaps = [
    { title: "Gen-Z Reach", desc: "Low engagement compared to peers on TikTok." },
    { title: "Sponsorship ROI", desc: "Diminishing returns on major influencer campaigns." },
    { title: "Sentiment Dip", desc: "Recent PR issues affected overall trust scores." }
];

// BACKEND: sense.sense_reviews WHERE competitor_id = ?
const reviews = [
    { user: "Karan", date: "1 week ago", text: "Incredible ecosystem integration. Nothing else comes close to this level of polish.", stars: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
    { user: "Sarah", date: "3 weeks ago", text: "Prices keep going up but the core product hasn't improved much. Really frustrating.", stars: 2, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
    { user: "Catherine", date: "10 days ago", text: "The new update completely fixed my workflow issues. They respond in a timely manner.", stars: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
    { user: "Peter", date: "2 weeks ago", text: "Customer service took 3 days to respond to a critical billing error. Unacceptable.", stars: 1, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
];

// BACKEND: ⚠️ NO EQUIVALENT — campaigns table doesn't exist
const campaigns = [
    {
        name: "Summer Creator Fund", date: "Jun 2026", metric: "+15% Engagement", status: "Active",
        color: "#FF6700",
        imgs: [
            'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80',
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80'
        ]
    },
    {
        name: "Tech Reviewers Push", date: "May 2026", metric: "2.4M Views", status: "Completed",
        color: "#00A4EF",
        imgs: [
            'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&q=80',
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80',
            'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=300&q=80'
        ]
    },
    {
        name: "Podcast Sponsorships", date: "Apr 2026", metric: "-5% ROI", status: "Underperforming",
        color: "#34A853",
        imgs: [
            'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&q=80',
            'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&q=80',
            'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&q=80'
        ]
    }
];

function getBrandColors(domain: string) {
    const knownBrands: Record<string, [string, string]> = {
        'amazon.com': ['#ff9900', '#ffb84d'], // Amazon Orange
        'tesla.com': ['#e82127', '#ff4d4d'], // Tesla Red
        'apple.com': ['#ffffff', '#a1a1aa'], // Apple Silver/White
        'nike.com': ['#ff6600', '#ff9933'], // Nike Orange
        'spotify.com': ['#1db954', '#1ed760'], // Spotify Green
        'stripe.com': ['#635bff', '#7a73ff'], // Stripe Blurple
        'vercel.com': ['#ffffff', '#a1a1aa'], // Vercel White
        'google.com': ['#4285f4', '#ea4335'], // Google Blue/Red
        'microsoft.com': ['#00a4ef', '#7fba00'], // Microsoft Blue/Green
        'meta.com': ['#0668e1', '#42b4ff'], // Meta Blue
        'netflix.com': ['#e50914', '#ff4c4c'] // Netflix Red
    };

    const key = domain.toLowerCase();
    if (knownBrands[key]) {
        return knownBrands[key];
    }

    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
        hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return [`hsl(${hue}, 80%, 50%)`, `hsl(${(hue + 40) % 360}, 80%, 40%)`];
}

function CompanyPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
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

    const [mountNode, setMountNode] = useState<{ x: number, y: number, w: number } | null>(null);
    const [animationState, setAnimationState] = useState<'idle' | 'entering' | 'entered'>('idle');
    const [activeChart, setActiveChart] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const scrollList = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = 344; // Card width + gap
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

    const domain = typeof params.domain === 'string' ? params.domain : 'example.com';
    const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    const [brandColor1, brandColor2] = getBrandColors(domain);

    const [logoUrl, setLogoUrl] = useState(`https://logo.clearbit.com/${domain}`);

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
        borderRadius: isRound ? '50%' : '16px',
        transition: 'none',
        zIndex: 9999,
        pointerEvents: 'none'
    });

    useEffect(() => {
        if (startX && logoRef.current) {
            const rect = logoRef.current.getBoundingClientRect();

            const raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setMorphStyle({
                        position: 'fixed',
                        left: `${rect.left}px`,
                        top: `${rect.top}px`,
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                        borderRadius: '20px',
                        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                        zIndex: 9999,
                        pointerEvents: 'none'
                    });

                    setTimeout(() => {
                        setIsMorphing(false);
                    }, 650);
                });
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [startX]);

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

            {/* Subtle Live Gradient */}
            <div style={{
                position: 'absolute',
                top: -150, left: 0, right: 0,
                height: '600px',
                background: `radial-gradient(circle at 30% 0%, ${brandColor1}, transparent 50%), radial-gradient(circle at 70% 20%, ${brandColor2}, transparent 50%)`,
                filter: 'blur(80px)',
                animation: 'liveGradient 15s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {isMorphing && (
                <div style={{ ...morphStyle, background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            )}

            <div style={{
                padding: '60px 40px',
                maxWidth: 1100,
                margin: '0 auto',
                width: '100%',
                position: 'relative',
                zIndex: 1,
                opacity: isMorphing ? 0 : 1,
                transform: isMorphing ? 'translateY(20px)' : 'translateY(0)',
                transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s'
            }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 50 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div ref={logoRef} className="company-logo-box" style={{
                            width: 88, height: 88, borderRadius: 20, background: 'var(--card-bg-alt)',
                            border: '1px solid var(--border-color)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                            opacity: isMorphing ? 0 : 1
                        }}>
                            <img
                                src={logoUrl}
                                alt={companyName}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={() => setLogoUrl(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`)}
                            />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 36, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{companyName}</h2>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 16, marginTop: 4, fontWeight: 500 }}>Since 1967</div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                        <div style={{ fontSize: 20, color: 'var(--text-primary)', fontWeight: 600 }}>
                            <span style={{ color: 'var(--text-secondary)', marginRight: 12, fontWeight: 500 }}>Market Val:</span>
                            0.67$
                        </div>
                        <div style={{ fontSize: 20, color: 'var(--text-primary)', fontWeight: 600 }}>
                            <span style={{ color: 'var(--text-secondary)', marginRight: 12, fontWeight: 500 }}>Industry:</span>
                            Technology
                        </div>
                    </div>
                </div>

                {/* Description Box */}
                <div className="company-desc-box skeleton-target" style={{
                    border: '1px solid var(--border-color)',
                    padding: 40,
                    borderRadius: 16,
                    marginBottom: 60,
                    background: 'var(--card-bg)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    fontSize: 17,
                    boxShadow: '0 8px 32px var(--shadow-color)'
                }}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </div>

                {/* Charts Section */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: activeChart ? '1fr 1fr' : '1fr 1fr 1fr',
                    gap: 48,
                    marginBottom: 80
                }}>
                    <div
                        onClick={() => setActiveChart(activeChart === 'market' ? null : 'market')}
                        className="skeleton-target"
                        style={{
                            display: 'flex', flexDirection: 'column',
                            cursor: 'pointer',
                            gridColumn: activeChart === 'market' ? '1 / -1' : 'auto',
                            order: activeChart === 'market' ? -1 : 0,
                            height: activeChart === 'market' ? 360 : 220,
                            transition: 'all 0.3s ease',
                            background: activeChart === 'market' ? 'rgba(255,255,255,0.02)' : 'transparent',
                            padding: activeChart === 'market' ? 24 : 0,
                            borderRadius: 16
                        }}
                    >
                        <h3 style={{ margin: '0 0 24px 0', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Market Share (%)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockChartData}>
                                <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#3f3f46' }} />
                                <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#3f3f46' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} itemStyle={{ color: brandColor1 }} />
                                <Line type="linear" dataKey="share" stroke={brandColor1} strokeWidth={2} dot={{ r: 2.5, fill: brandColor1, stroke: 'none' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div
                        onClick={() => setActiveChart(activeChart === 'engagement' ? null : 'engagement')}
                        className="skeleton-target"
                        style={{
                            display: 'flex', flexDirection: 'column',
                            cursor: 'pointer',
                            gridColumn: activeChart === 'engagement' ? '1 / -1' : 'auto',
                            order: activeChart === 'engagement' ? -1 : 0,
                            height: activeChart === 'engagement' ? 360 : 220,
                            transition: 'all 0.3s ease',
                            background: activeChart === 'engagement' ? 'rgba(255,255,255,0.02)' : 'transparent',
                            padding: activeChart === 'engagement' ? 24 : 0,
                            borderRadius: 16
                        }}
                    >
                        <h3 style={{ margin: '0 0 24px 0', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Engagement (K)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockChartData}>
                                <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#3f3f46' }} />
                                <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#3f3f46' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} itemStyle={{ color: brandColor2 }} />
                                <Line type="linear" dataKey="engagement" stroke={brandColor2} strokeWidth={2} dot={{ r: 2.5, fill: brandColor2, stroke: 'none' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div
                        onClick={() => setActiveChart(activeChart === 'time' ? null : 'time')}
                        className="skeleton-target"
                        style={{
                            display: 'flex', flexDirection: 'column',
                            cursor: 'pointer',
                            gridColumn: activeChart === 'time' ? '1 / -1' : 'auto',
                            order: activeChart === 'time' ? -1 : 0,
                            height: activeChart === 'time' ? 360 : 220,
                            transition: 'all 0.3s ease',
                            background: activeChart === 'time' ? 'rgba(255,255,255,0.02)' : 'transparent',
                            padding: activeChart === 'time' ? 24 : 0,
                            borderRadius: 16
                        }}
                    >
                        <h3 style={{ margin: '0 0 24px 0', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Avg Response Time (67s)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockChartData}>
                                <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#3f3f46' }} />
                                <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#3f3f46' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} itemStyle={{ color: brandColor1 }} />
                                <Line type="linear" dataKey="time" stroke={brandColor1} strokeWidth={2} dot={{ r: 2.5, fill: brandColor1, stroke: 'none' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Campaigns Section (Full Width) */}
                <div style={{ marginBottom: 80 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>Recent Campaigns</h3>
                        <div className="company-sort-pill" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)', background: 'var(--card-bg-alt)', padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border-color)' }}>
                            Sort by:
                            <span style={{ color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                Performance <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 40, paddingTop: 16 }}>
                        {campaigns.map((camp, i) => (
                            <div 
                                key={i} 
                                onDoubleClick={() => router.push(`/campaigns/${i}`)}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <div className="scene" style={{ marginBottom: 20 }}>
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
                                    <div style={{ textAlign: 'center', background: 'var(--card-bg-alt)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }} className="company-camp-info">
                                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {camp.metric}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4, display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
                                            <span>{camp.date}</span>
                                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border-color)' }}></span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{camp.status}</span>
                                        </div>
                                    </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Strategic Gaps Carousel (Full Width) */}
                <div style={{ display: 'flex', gap: 60, width: '100%', overflow: 'hidden', padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Left Column */}
                    <div style={{ flexShrink: 0, width: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ marginBottom: 24, opacity: 0.8 }}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h3 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 32, letterSpacing: '-0.02em' }}>Strategic<br />Gaps<br /></h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button onClick={() => scrollGaps('left')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&larr;</button>
                            <div style={{ flex: 1, height: 2, background: 'var(--border-color)', position: 'relative' }} className="scroll-track">
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '30%', background: '#a1a1aa' }}></div>
                            </div>
                            <button onClick={() => scrollGaps('right')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&rarr;</button>
                        </div>
                    </div>

                    {/* Right Column (Scrollable) */}
                    <div
                        ref={gapsScrollRef}
                        onPointerDown={handleGapsPointerDown}
                        onPointerMove={handleGapsPointerMove}
                        onPointerUp={handleGapsPointerUp}
                        onPointerLeave={handleGapsPointerUp}
                        style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 24, scrollbarWidth: 'none', flex: 1, cursor: 'grab', alignItems: 'center' }}
                    >
                        {gaps.map((gap, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320, width: 320, height: '100%' }}>
                                <div className="company-gap-card" style={{
                                    background: 'var(--card-bg-alt)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-color)',
                                    padding: 32,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#3f3f46', opacity: 0.8 }}></div>
                                    <div className="company-gap-title" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{gap.title}</div>
                                    <div className="company-gap-desc" style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                                        {gap.desc}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Comments Section (Full Width) */}
                <div style={{ display: 'flex', gap: 60, width: '100%', overflow: 'hidden', padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Left Column */}
                    <div className="skeleton-target" style={{ flexShrink: 0, width: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: 80, color: '#3f3f46', lineHeight: 0.8, marginBottom: 24, fontFamily: 'serif' }}>“</div>
                        <h3 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 32, letterSpacing: '-0.02em' }}>What <br />customers are<br />saying</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button onClick={() => scrollList('left')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&larr;</button>
                            <div style={{ flex: 1, height: 2, background: 'var(--border-color)', position: 'relative' }} className="scroll-track">
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '30%', background: '#a1a1aa' }}></div>
                            </div>
                            <button onClick={() => scrollList('right')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&rarr;</button>
                        </div>
                    </div>

                    {/* Right Column (Scrollable) */}
                    <div
                        ref={scrollRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 24, scrollbarWidth: 'none', flex: 1, cursor: 'grab' }}
                    >
                        {reviews.map((rev, i) => (
                            <div key={i} className="skeleton-target" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320, width: 320 }}>
                                <div className="company-review-card" style={{
                                    background: 'var(--card-bg-alt)',
                                    borderRadius: '24px',
                                    border: '1px solid var(--border-color)',
                                    padding: '28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: rev.stars > 3 ? '#10b981' : rev.stars > 2 ? '#f59e0b' : '#ef4444' }} />
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <img src={rev.avatar} alt={rev.user} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                                            <div>
                                                <div className="review-author" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>{rev.user}</div>
                                                <div className="review-date" style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{rev.date}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 2, background: 'var(--card-bg)', padding: '6px 10px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                                            {Array.from({ length: 5 }).map((_, idx) => (
                                                <svg key={idx} width="14" height="14" viewBox="0 0 24 24" fill={idx < rev.stars ? "#10b981" : "var(--border-color)"} xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="company-review-text" style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                                        "{rev.text}"
                                    </div>
                                </div>
                            </div>
                        ))}
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

export default function CompanyPage() {
    return (
        <Suspense fallback={<div className="main-content" />}>
            <CompanyPageContent />
        </Suspense>
    );
}
