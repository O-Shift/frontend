'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import ChartSkeleton from '@/components/charts/ChartSkeleton';
import CompetitorDetailSkeleton from '@/components/skeletons/CompetitorDetailSkeleton';
import { ZINC_PALETTE } from '@/components/charts/palette';
import PromptField, { type AttachedContextNode } from '@/components/PromptField';
import { triggerCompetitorScrape, type SenseReview } from '@/lib/api';
import { stringToHue } from '@/lib/colors';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useCompetitorDetail } from '@/hooks/use-competitors';
import { useMediaQuery } from '@/hooks/use-media-query';

// Three charts on this page, one 340 KB dependency behind all of them, and all
// three sit below the header and stat cards. One dynamic import covers them.
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
    'netflix.com': ['#e50914', '#ff4c4c'],
  };

  const key = domain.toLowerCase();
  if (knownBrands[key]) {
    return knownBrands[key];
  }

  const hue = stringToHue(domain);
  return [`hsl(${hue}, 80%, 50%)`, `hsl(${(hue + 40) % 360}, 80%, 40%)`];
}

function formatValuation(val?: number | null): string {
  if (!val) return 'N/A';
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}

function metaString(metadata: SenseReview['metadata'], key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : undefined;
}

function CompetitorDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const competitorId = typeof params.id === 'string' ? params.id : '';

  // Fetch all competitor details & data feeds
  const {
    competitor,
    isLoading: loading,
    error,
    metrics,
    gaps,
    campaigns,
    reviews,
    refetch: loadData,
  } = useCompetitorDetail(competitorId);
  const scoreData = metrics.share;
  const volumeData = metrics.engagement;
  const engagementData = metrics.sentiment;

  // Scrape trigger state
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);

  // PromptField & UI state
  const [selectedNode, setSelectedNode] = useState<AttachedContextNode | null>(null);
  const [commandActive, setCommandActive] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [activeChart, setActiveChart] = useState<string | null>(null);

  // Charts grid and carousels collapse to a single stacked column below mobile
  const isWide = useMediaQuery('(min-width: 640px)');

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

  const handleTriggerScrape = async () => {
    if (!competitorId || scraping) return;
    setScraping(true);
    setScrapeMessage('Scraping site & running AI gap analysis...');
    const res = await triggerCompetitorScrape(competitorId);
    if (res.ok) {
      const counts = res.data?.counts;
      let msg = 'Scrape & AI Analysis complete! Strategic gaps updated.';
      if (counts) {
        if (counts.ok > 0) {
          msg = `Scrape & AI Analysis complete: ${counts.ok} new page(s) captured & strategic gaps updated!`;
        } else if (counts.skipped > 0 && counts.failed === 0) {
          msg = `Scrape & AI Analysis complete: Site content up-to-date & strategic gaps refreshed!`;
        } else if (counts.failed > 0) {
          msg = `Scrape finished with ${counts.failed} warning(s). Strategic gaps updated.`;
        }
      }
      setScrapeMessage(msg);
      await loadData();
      setTimeout(() => {
        setScrapeMessage(null);
      }, 4000);
    } else {
      setScrapeMessage(`Scrape failed: ${res.error}`);
    }
    setScraping(false);
  };



  // Drag-scroll carousels: reviews list and strategic gaps
  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const gapsScrollRef = useRef<HTMLDivElement>(null);
  const reviewsScroll = useDragScroll(reviewsScrollRef);
  const gapsScroll = useDragScroll(gapsScrollRef);

  const scrollList = reviewsScroll.scrollBy;
  const scrollGaps = gapsScroll.scrollBy;

  const domain = competitor?.website
    ? competitor.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : 'example.com';
  const companyName = competitor?.name || 'Competitor Detail';
  const [brandColor1, brandColor2] = getBrandColors(domain);
  const [logoUrl, setLogoUrl] = useState(`https://logo.clearbit.com/${domain}`);

  if (loading) {
    return <CompetitorDetailSkeleton />;
  }

  if (error || !competitor) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Competitor Not Found</div>
          <div style={{ fontSize: 15, marginBottom: 24 }}>{error || 'Unable to locate competitor with this ID.'}</div>
          <button
            onClick={() => router.push('/competitors')}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to Competitors List
          </button>
        </div>
      </div>
    );
  }

  const formatChartDate = (ts: string) => {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? ts : d.toLocaleDateString('en-US', { month: 'short' });
  };

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

        {/* Live Gradient */}
        <div style={{
          position: 'absolute',
          top: -150, left: 0, right: 0,
          height: '600px',
          background: `radial-gradient(circle at 30% 0%, ${brandColor1}, transparent 50%), radial-gradient(circle at 70% 20%, ${brandColor2}, transparent 50%)`,
          filter: 'blur(80px)',
          animation: 'liveGradient 15s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div style={{
          padding: '60px 40px',
          maxWidth: 1100,
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div className="company-logo-box" style={{
                width: 88, height: 88, borderRadius: 20, background: 'var(--card-bg-alt)',
                border: '1px solid var(--border-color)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
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
                <div style={{ color: 'var(--text-secondary)', fontSize: 16, marginTop: 4, fontWeight: 500 }}>
                  {competitor.founding_year ? `Founded ${competitor.founding_year}` : competitor.website}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ fontSize: 20, color: 'var(--text-primary)', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)', marginRight: 12, fontWeight: 500 }}>Market Val:</span>
                {formatValuation(competitor.market_valuation_usd)}
              </div>
              <div style={{ fontSize: 20, color: 'var(--text-primary)', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)', marginRight: 12, fontWeight: 500 }}>Industry:</span>
                {competitor.industry || 'Technology'}
              </div>
            </div>
          </div>

          {/* Description & Manual Scrape Trigger Box */}
          <div className="company-desc-box" style={{
            border: '1px solid var(--border-color)',
            padding: 40,
            borderRadius: 16,
            marginBottom: 60,
            background: 'var(--card-bg)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            fontSize: 17,
            boxShadow: '0 8px 32px var(--shadow-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 24,
          }}>
            <div style={{ flex: 1 }}>
              {competitor.description || `${companyName} is a tracked competitive entity in your workspace.`}
            </div>
            <div style={{ flexShrink: 0 }}>
              <button
                onClick={handleTriggerScrape}
                disabled={scraping}
                style={{
                  background: scraping ? 'var(--card-bg-alt)' : brandColor1,
                  color: '#fff',
                  border: '1px solid var(--border-color)',
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: scraping ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                }}
              >
                {scraping ? (
                  <span>Dispatching...</span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                    <span>Trigger Scrape</span>
                  </>
                )}
              </button>
              {scrapeMessage && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, textAlign: 'right' }}>
                  {scrapeMessage}
                </div>
              )}
            </div>
          </div>

          {/* Time-Series Charts Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isWide ? (activeChart ? '1fr 1fr' : '1fr 1fr 1fr') : '1fr',
            gap: 48,
            marginBottom: 80,
          }}>
            {/* Chart 1: Signal Score / Share */}
            <div
              onClick={() => setActiveChart(activeChart === 'score' ? null : 'score')}
              style={{
                display: 'flex', flexDirection: 'column',
                cursor: 'pointer',
                gridColumn: activeChart === 'score' ? '1 / -1' : 'auto',
                order: activeChart === 'score' ? -1 : 0,
                height: activeChart === 'score' ? 360 : 220,
                transition: 'all 0.3s ease',
                background: activeChart === 'score' ? 'rgba(255,255,255,0.02)' : 'transparent',
                padding: activeChart === 'score' ? 24 : 0,
                borderRadius: 16,
              }}
            >
              <h3 style={{ margin: '0 0 24px 0', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Market Share (%)</h3>
              {scoreData.length > 0 ? (
                <LineChartCard
                  data={scoreData}
                  dataKey="value"
                  xKey="timestamp"
                  color={brandColor1}
                  palette={ZINC_PALETTE}
                  xTickFormatter={formatChartDate}
                  dotRadius={2.5}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13, border: '1px dashed var(--border-color)', borderRadius: 8 }}>
                  No market share history yet
                </div>
              )}
            </div>

            {/* Chart 2: Social Media Engagement */}
            <div
              onClick={() => setActiveChart(activeChart === 'volume' ? null : 'volume')}
              style={{
                display: 'flex', flexDirection: 'column',
                cursor: 'pointer',
                gridColumn: activeChart === 'volume' ? '1 / -1' : 'auto',
                order: activeChart === 'volume' ? -1 : 0,
                height: activeChart === 'volume' ? 360 : 220,
                transition: 'all 0.3s ease',
                background: activeChart === 'volume' ? 'rgba(255,255,255,0.02)' : 'transparent',
                padding: activeChart === 'volume' ? 24 : 0,
                borderRadius: 16,
              }}
            >
              <h3 style={{ margin: '0 0 24px 0', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Social Media Engagement</h3>
              {volumeData.length > 0 ? (
                <LineChartCard
                  data={volumeData}
                  dataKey="value"
                  xKey="timestamp"
                  color={brandColor2}
                  palette={ZINC_PALETTE}
                  xTickFormatter={formatChartDate}
                  dotRadius={2.5}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13, border: '1px dashed var(--border-color)', borderRadius: 8 }}>
                  No engagement data available
                </div>
              )}
            </div>

            {/* Chart 3: Brand Sentiment */}
            <div
              onClick={() => setActiveChart(activeChart === 'engagement' ? null : 'engagement')}
              style={{
                display: 'flex', flexDirection: 'column',
                cursor: 'pointer',
                gridColumn: activeChart === 'engagement' ? '1 / -1' : 'auto',
                order: activeChart === 'engagement' ? -1 : 0,
                height: activeChart === 'engagement' ? 360 : 220,
                transition: 'all 0.3s ease',
                background: activeChart === 'engagement' ? 'rgba(255,255,255,0.02)' : 'transparent',
                padding: activeChart === 'engagement' ? 24 : 0,
                borderRadius: 16,
              }}
            >
              <h3 style={{ margin: '0 0 24px 0', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Brand Sentiment Score</h3>
              {engagementData.length > 0 ? (
                <LineChartCard
                  data={engagementData}
                  dataKey="value"
                  xKey="timestamp"
                  color={brandColor1}
                  palette={ZINC_PALETTE}
                  xTickFormatter={formatChartDate}
                  dotRadius={2.5}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13, border: '1px dashed var(--border-color)', borderRadius: 8 }}>
                  No sentiment index data
                </div>
              )}
            </div>

          </div>

          {/* Active Campaigns Section */}
          <div style={{ marginBottom: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>Active Campaigns</h3>
            </div>

            {campaigns.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                {campaigns.map((camp) => (
                  <div key={camp.id} style={{ background: 'var(--card-bg-alt)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{camp.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
                      {camp.description || 'No campaign description provided.'}
                    </div>
                    {camp.posts && camp.posts.length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {camp.posts.map((p) => (
                          <span key={p.id} style={{ background: 'var(--card-bg)', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                            {p.platform || 'social'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', background: 'var(--card-bg-alt)', borderRadius: 16, border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 14 }}>
                No active competitor campaigns detected yet.
              </div>
            )}
          </div>

          {/* Strategic Gaps Carousel */}
          <div style={{ display: 'flex', flexDirection: isWide ? 'row' : 'column', gap: 60, width: '100%', overflow: 'hidden', padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ flexShrink: 0, width: isWide ? 220 : '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ marginBottom: 24, opacity: 0.8 }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 32, letterSpacing: '-0.02em' }}>Strategic<br />Gaps</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => scrollGaps('left')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&larr;</button>
                <div style={{ flex: 1, height: 2, background: 'var(--border-color)', position: 'relative' }} className="scroll-track">
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '30%', background: '#a1a1aa' }}></div>
                </div>
                <button onClick={() => scrollGaps('right')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&rarr;</button>
              </div>
            </div>

            <div
              ref={gapsScrollRef}
              {...gapsScroll.handlers}
              style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 24, scrollbarWidth: 'none', flex: 1, cursor: 'grab', alignItems: 'center' }}
            >
              {gaps.length > 0 ? (
                gaps.map((gap) => (
                  <div key={gap.id} style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320, width: 320, height: '100%' }}>
                    <div className="company-gap-card" style={{
                      background: 'var(--card-bg-alt)',
                      borderRadius: '16px',
                      border: '1px solid var(--border-color)',
                      padding: 32,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: brandColor1, opacity: 0.8 }} />
                      <div className="company-gap-title" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{gap.title}</div>
                      <div className="company-gap-desc" style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                        {gap.body || 'No detailed gap description.'}
                      </div>

                      {gap.sources && gap.sources.length > 0 && (
                        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Verified Sources
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {gap.sources.map((src, idx) => (
                              <a
                                key={src.id || idx}
                                href={src.url || competitor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: 12,
                                  color: '#a1a1aa',
                                  background: 'var(--card-bg)',
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  border: '1px solid var(--border-color)',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <span>🌐 {src.source || 'web'}</span>
                                <span style={{ fontSize: 10, opacity: 0.7 }}>↗</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: 32, color: 'var(--text-secondary)', fontSize: 14 }}>
                  No strategic gaps flagged for this competitor yet.
                </div>
              )}
            </div>
          </div>

          {/* Customer Voice / Reviews Section */}
          <div style={{ display: 'flex', flexDirection: isWide ? 'row' : 'column', gap: 60, width: '100%', overflow: 'hidden', padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ flexShrink: 0, width: isWide ? 220 : '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 80, color: '#3f3f46', lineHeight: 0.8, marginBottom: 24, fontFamily: 'serif' }}>“</div>
              <h3 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 32, letterSpacing: '-0.02em' }}>What<br />customers are<br />saying</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => scrollList('left')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&larr;</button>
                <div style={{ flex: 1, height: 2, background: 'var(--border-color)', position: 'relative' }} className="scroll-track">
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '30%', background: '#a1a1aa' }}></div>
                </div>
                <button onClick={() => scrollList('right')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0, fontSize: 20 }}>&rarr;</button>
              </div>
            </div>

            <div
              ref={reviewsScrollRef}
              {...reviewsScroll.handlers}
              style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 24, scrollbarWidth: 'none', flex: 1, cursor: 'grab' }}
            >
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev.id} style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320, width: 320 }}>
                    <div className="company-review-card" style={{
                      background: 'var(--card-bg-alt)',
                      borderRadius: '24px',
                      border: '1px solid var(--border-color)',
                      padding: '28px',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '4px',
                        background: (rev.rating || 3) > 3 ? '#10b981' : (rev.rating || 3) > 2 ? '#f59e0b' : '#ef4444',
                      }} />
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {metaString(rev.metadata, 'avatar_url') && (
                            <img src={metaString(rev.metadata, 'avatar_url')} alt="Avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          <div>
                            <div className="review-author" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>
                              {metaString(rev.metadata, 'author_name') || (rev.platform ? rev.platform.toUpperCase() : 'Review')}
                            </div>
                            <div className="review-date" style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                              {rev.reviewed_at ? new Date(rev.reviewed_at).toLocaleDateString() : 'Recent'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 2, background: 'var(--card-bg)', padding: '6px 10px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <svg key={idx} width="14" height="14" viewBox="0 0 24 24" fill={idx < (rev.rating || 5) ? "#10b981" : "var(--border-color)"} xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="company-review-text" style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                        &ldquo;{rev.body || rev.title || 'No review body'}&rdquo;
                      </div>
                      {rev.url && (
                        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                          <a
                            href={rev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: brandColor1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              textDecoration: 'none',
                            }}
                          >
                            <span>View Original Source</span>
                            <span style={{ fontSize: 11 }}>↗</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: 32, color: 'var(--text-secondary)', fontSize: 14 }}>
                  No customer reviews mined yet for this competitor.
                </div>
              )}
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
        onThinkingChange={setIsThinking}
      />
    </>
  );
}

export default function CompetitorDetailPage() {
  return (
    <Suspense fallback={<div className="main-content" />}>
      <CompetitorDetailPageContent />
    </Suspense>
  );
}
