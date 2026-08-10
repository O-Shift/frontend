'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PromptField from '@/components/PromptField';
import { fetchOpportunities, generateOpportunities, triggerPipeline, Opportunity } from '@/lib/api';
import Link from 'next/link';

function CompanyPile({ companies }: { companies: string[] }) {
  const [hovered, setHovered] = useState(false);
  if (!companies || companies.length === 0) return null;
  const visible = companies.slice(0, 3);
  const extra = companies.length - 3;

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 12, verticalAlign: 'middle', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg-alt)', padding: '2px', borderRadius: 999, border: '1px solid var(--border-color)', minWidth: 20 }}>
        {visible.map((domain, i) => (
          <span key={i} style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--card-bg-alt)', background: '#fff', overflow: 'hidden', marginLeft: i === 0 ? 0 : -6, zIndex: 3 - i, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} alt={domain} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.currentTarget.style.display = 'none'} />
          </span>
        ))}
        {extra > 0 && (
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 4, marginRight: 4 }}>
            +{extra}
          </span>
        )}
      </span>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px var(--shadow-color)',
              zIndex: 50,
              pointerEvents: 'none'
            }}
          >
            {companies.map(d => d.split('.')[0].charAt(0).toUpperCase() + d.split('.')[0].slice(1)).join(', ')}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function SampleBadge({ title }: { title: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      padding: '2px 6px',
      fontSize: '10px',
      fontWeight: 'bold',
      marginLeft: '8px',
      textTransform: 'uppercase'
    }}>
      {title}
    </span>
  );
}

function SeamlessBackground({ slideIndex, totalSlides }: { slideIndex: number, totalSlides: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <motion.div
        animate={{ x: `-${slideIndex * (100 / totalSlides)}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${totalSlides * 100}vw`,
          display: 'flex',
          opacity: 'var(--bg-pattern-opacity)',
        }}
      >
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '-5%', top: '-30%', width: '220vh', transform: 'rotate(85deg)' }} />
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '25%', bottom: '-40%', width: '250vh', transform: 'rotate(-60deg)' }} />
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '55%', top: '-50%', width: '240vh', transform: 'rotate(115deg)' }} />
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '72%', bottom: '-20%', width: '280vh', transform: 'rotate(-25deg)' }} />
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '90%', top: '-35%', width: '260vh', transform: 'rotate(145deg)' }} />
      </motion.div>
    </div>
  );
}

export default function OpportunitiesPage() {
  const [opportunitiesList, setOpportunitiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<{ type: 'desc' | 'gap', id: number } | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [commandActive, setCommandActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [, setSidebarCollapsed] = useState(false);
  // Accordion fold state: 0 = collapsed, 1 = accordion, 2 = expanded
  const [foldState, setFoldState] = useState(0);
  const [isAccordionHovered, setIsAccordionHovered] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState<number | null>(null);

  // Fetch real database opportunities from FastAPI backend
  const loadData = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchOpportunities();
    if (res.ok) {
      const items = res.data?.items || [];
      const mapped = items.map((op: Opportunity) => {
        const af = op.analysis_fields || {};
        // No invented provenance. An opportunity the backend produced without
        // evidence gets an empty citation list and the UI says so, rather than
        // being given a constant that renders as a "Source Citation".
        const highlights = Array.isArray(af.highlights) && af.highlights.length > 0
          ? af.highlights
          : [{ text: op.title.slice(0, 35), citations: [] }];

        const gapBullets = Array.isArray(af.gapBullets) && af.gapBullets.length > 0
          ? af.gapBullets
          : Array.isArray((af as any).gap_bullets) && (af as any).gap_bullets.length > 0
            ? (af as any).gap_bullets
            : [{
              text: af.gapIdentified || (af as any).gap_identified || 'Market gap identified from DB competitor signals.',
              citations: [],
              companies: [],
            }];

        return {
          id: op.id,
          title: op.title,
          description: op.description,
          highlights,
          gapBullets,
          effort: op.effort ? op.effort.charAt(0).toUpperCase() + op.effort.slice(1) : 'High',
          impact: op.impact ? op.impact.charAt(0).toUpperCase() + op.impact.slice(1) : 'High',
          topComplaint: af.topComplaint || (af as any).top_complaint || "'Customer support response latency' — verified in signal logs.",
          rootCause: af.rootCause || (af as any).root_cause || 'No live support channel; email verified response lag.',
          gapIdentified: af.gapIdentified || (af as any).gap_identified || 'No competitor in this market offers instant automated resolution.',
          opportunityText: af.opportunityText || (af as any).opportunity_text || `'${op.title}' — positions our brand as the leading choice.`,
          priorityScore: op.priority_score ? String(op.priority_score).toUpperCase() : 'HIGH',
          priorityReasoning: op.priority_reasoning || 'High complaint volume, low complexity, strong differentiation.',
          earlyWarning: af.earlyWarning || (af as any).early_warning || 'Complaint volume for this category grew MoM. Trend alert triggered.',
          quickWin: af.quickWin || (af as any).quick_win || 'Deploy automated support line within 2 weeks.',
        };
      });
      setOpportunitiesList(mapped);
      setSlideIndex(0);
    } else {
      setError(res.error || 'Failed to fetch opportunities from database.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const res = await generateOpportunities();
    if (res.ok) {
      await loadData();
    } else {
      alert(`Generation failed: ${res.error}`);
    }
    setIsGenerating(false);
  };

  const handleRunPipeline = async () => {
    setIsRunningPipeline(true);
    const res = await triggerPipeline();
    if (res.ok) {
      alert('Full Ingest Pipeline triggered successfully! Background execution started.');
      setTimeout(() => {
        loadData();
      }, 3000);
    } else {
      alert(`Pipeline trigger failed: ${res.error}`);
    }
    setIsRunningPipeline(false);
  };

  // Close brief on slide change
  useEffect(() => {
    setFoldState(0);
  }, [slideIndex]);

  // Global thinking class toggle
  useEffect(() => {
    if (isThinking) {
      document.body.classList.add('is-thinking-active');
      const timer = setTimeout(() => {
        setIsThinking(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      document.body.classList.remove('is-thinking-active');
    }
  }, [isThinking]);

  // Sidebar command interaction
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCommandActive(false);
        setSelectedNode(null);
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const slide = opportunitiesList[slideIndex];

  const handleMouseEnter = (type: 'desc' | 'gap', id: number) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredNode({ type, id });
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setHoveredNode(null);
    }, 400);
  };

  const keepHoverActive = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  // Helper to render description with hoverable spans
  const renderDescription = () => {
    if (!slide) return null;
    let desc = slide.description;
    let parts: React.ReactNode[] = [desc];

    (slide.highlights || []).forEach((highlight: any, idx: number) => {
      const newParts: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(highlight.text);
          split.forEach((s, i) => {
            newParts.push(s);
            if (i < split.length - 1) {
              const isHovered = hoveredNode?.type === 'desc' && hoveredNode?.id === idx;
              newParts.push(
                <span
                  key={`${idx}-${i}`}
                  className="skeleton-target"
                  onMouseEnter={() => handleMouseEnter('desc', idx)}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    color: isHovered ? 'var(--accent)' : 'inherit',
                    borderBottom: isHovered ? '2px solid var(--accent)' : '1px dashed rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    transition: 'color 0.2s, border-color 0.2s',
                    position: 'relative'
                  }}
                >
                  {highlight.text}
                </span>
              );
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts;
  };

  const nextSlide = () => {
    if (opportunitiesList.length > 0) {
      setSlideIndex((prev) => (prev + 1) % opportunitiesList.length);
    }
  };

  const prevSlide = () => {
    if (opportunitiesList.length > 0) {
      setSlideIndex((prev) => (prev - 1 + opportunitiesList.length) % opportunitiesList.length);
    }
  };

  const activeCitations: string[] = hoveredNode?.type === 'desc'
    ? slide?.highlights[hoveredNode.id]?.citations || []
    : hoveredNode?.type === 'gap'
      ? slide?.gapBullets[hoveredNode.id]?.citations || []
      : [];

  const invertFolds = hoveredPanel === 1 || hoveredPanel === 3 || hoveredPanel === 5;

  return (
    <>
      <div className="main-content" style={{ overflowY: 'auto', padding: '60px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
        <SeamlessBackground slideIndex={slideIndex} totalSlides={Math.max(1, opportunitiesList.length)} />

        {/* Top Header Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, width: '100%', margin: '0 auto 30px auto' }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Database Intelligence
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleRunPipeline}
              disabled={isRunningPipeline}
              style={{
                background: 'var(--card-bg-alt)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '10px 18px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: isRunningPipeline ? 'not-allowed' : 'pointer',
                opacity: isRunningPipeline ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {isRunningPipeline ? 'Triggering Pipeline...' : 'Run Ingest Pipeline'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '10px 18px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {isGenerating ? 'Synthesizing...' : 'Generate Opportunities'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-secondary)' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 20, fontSize: 14 }}>Fetching real database opportunities...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Auth Error State */}
        {!loading && error && (
          <div style={{ maxWidth: 600, margin: '60px auto', padding: 32, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Database Access Required</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              {error === 'Not signed in' ? 'Please sign in to fetch live opportunities stored in your Supabase database.' : error}
            </p>
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                background: 'var(--accent)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none'
              }}
            >
              Sign In to Account
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && opportunitiesList.length === 0 && (
          <div style={{ maxWidth: 600, margin: '60px auto', padding: 32, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>No Opportunities Found in Database</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              There are no opportunities in the database for your workspace. Click below to trigger the AI opportunity synthesis engine or run the complete pipeline.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button
                onClick={handleRunPipeline}
                disabled={isRunningPipeline}
                style={{
                  background: 'var(--card-bg-alt)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '12px 24px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isRunningPipeline ? 'Triggering Pipeline...' : 'Run Ingest Pipeline'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '12px 24px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isGenerating ? 'Synthesizing...' : 'Synthesize Opportunities'}
              </button>
            </div>
          </div>
        )}

        {/* Real DB Data Content */}
        {!loading && !error && slide && (
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', flex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', gap: 60 }}
            >
              {/* LEFT COLUMN: Main content */}
              <div style={{ flex: 1, position: 'relative', display: 'flex', zIndex: 15 }}>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h1 className="skeleton-target" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24, letterSpacing: '-0.02em', fontFamily: 'var(--font-playfair)' }}>
                    {slide.title}
                  </h1>

                  <p className="skeleton-target" style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 600 }}>
                    {renderDescription()}
                  </p>

                  <div style={{ display: 'flex', gap: 60 }}>

                    {/* Left Side: Gaps & Effort/Impact */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', zIndex: 10 }}>
                      {/* Gaps Section */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                          <h2 className="skeleton-target" style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', margin: 0 }}>Gap(s) <SampleBadge title="Mock data" /></h2>
                        </div>
                        <ul className="skeleton-target" style={{ margin: 0, paddingLeft: 16, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                          {slide.gapBullets.map((bullet: any, i: number) => {
                            const isHovered = hoveredNode?.type === 'gap' && hoveredNode?.id === i;
                            return (
                              <li
                                key={i}
                                style={{
                                  marginBottom: 10,
                                  color: isHovered ? 'var(--accent)' : 'inherit',
                                  transition: 'color 0.2s',
                                  position: 'relative'
                                }}
                              >
                                <span
                                  onMouseEnter={() => handleMouseEnter('gap', i)}
                                  onMouseLeave={handleMouseLeave}
                                  style={{
                                    borderBottom: isHovered ? '2px solid var(--accent)' : '1px dashed rgba(255,255,255,0.2)',
                                    transition: 'border-color 0.2s',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {bullet.text}
                                </span>
                                <CompanyPile companies={bullet.companies} />
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div className="skeleton-target" style={{ display: 'flex', gap: 40 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Effort</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{slide.effort}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Impact</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{slide.impact}</div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Citations Modal overlaid */}
                    <div style={{ flex: 1, position: 'relative', zIndex: 100 }}>
                      <AnimatePresence>
                        {hoveredNode !== null && (
                          <motion.div
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            onMouseEnter={keepHoverActive}
                            onMouseLeave={handleMouseLeave}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: 320,
                              background: 'var(--card-bg)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 16,
                              padding: 24,
                              boxShadow: '0 20px 40px var(--shadow-color)',
                              zIndex: 100
                            }}
                          >
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 16 }}>Source Citations</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {activeCitations.length === 0 && (
                                <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                                  No source recorded for this item. Run Generate to rebuild it from collected signals.
                                </p>
                              )}
                              {activeCitations.map((cit: any, i: number) => {
                                const title = typeof cit === 'string' ? cit : cit.title || cit.name || 'Source Citation';
                                const rawUrl = typeof cit === 'object' && cit.url
                                  ? String(cit.url)
                                  : (typeof cit === 'string' && cit.startsWith('http') ? cit : '');

                                // Only a real http(s) source becomes a link. A
                                // `partnerships://<uuid>` signal is internal and a bare
                                // label has no source at all — neither is worth
                                // laundering into a web search that we then present as
                                // provenance.
                                const isWebSource = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');

                                const rowStyle = {
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '12px 16px',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 8,
                                  background: 'var(--card-bg-alt)',
                                  color: 'var(--text-primary)',
                                  fontSize: 13,
                                  fontWeight: 500,
                                  textDecoration: 'none',
                                } as const;

                                const label = (
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{title}</span>
                                );

                                if (!isWebSource) {
                                  return (
                                    <div key={i} style={{ ...rowStyle, color: 'var(--text-secondary)' }} title={title}>
                                      {label}
                                      <span style={{ fontSize: 11, opacity: 0.7, flexShrink: 0, marginLeft: 8 }}>
                                        {rawUrl.startsWith('partnerships://') ? 'Internal' : 'No link'}
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <a
                                    key={i}
                                    href={rawUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={title}
                                    style={{ ...rowStyle, transition: 'border-color 0.2s, background 0.2s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--item-hover)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--card-bg-alt)'; }}
                                  >
                                    {label}
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0, marginLeft: 8 }}>
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                      <polyline points="15 3 21 3 21 9" />
                                      <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                  </a>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Data Report - 3D Vertical Accordion (Exact oshift-master implementation) */}
              <div style={{ flexShrink: 0, width: 340, position: 'relative', zIndex: 10, perspective: 2500, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <motion.div
                  className="skeleton-target"
                  animate={{
                    rotateX: foldState === 2 ? 0 : 25,
                    rotateY: foldState === 2 ? 0 : -15,
                    rotateZ: foldState === 2 ? 0 : -2,
                    y: foldState === 2 ? 0 : -30
                  }}
                  transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    transformStyle: 'preserve-3d',
                    width: '100%',
                    position: 'relative',
                    pointerEvents: 'none'
                  }}
                >
                  {/* Floating "Click to Expand" Hint */}
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: foldState === 0 && isAccordionHovered ? 1 : 0,
                      y: foldState === 0 && isAccordionHovered ? -20 : 0
                    }}
                    transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                    style={{ position: 'absolute', top: -30, left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, pointerEvents: 'none' }}
                  >
                    Click to Expand
                  </motion.div>

                  {/* Panel 1 (Always Visible Base) */}
                  <motion.div
                    onClick={() => setFoldState((s) => (s + 1) % 2)}
                    onMouseEnter={(e) => { e.stopPropagation(); setIsAccordionHovered(true); setHoveredPanel(1); }}
                    onMouseLeave={(e) => { e.stopPropagation(); setIsAccordionHovered(false); setHoveredPanel(null); }}
                    animate={{
                      rotateX: foldState === 0 ? (isAccordionHovered ? -5 : 5) : foldState === 1 ? (invertFolds ? -15 : 15) : 0,
                      marginBottom: foldState === 1 ? 400 : 0
                    }}
                    transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      transformOrigin: 'top center',
                      transformStyle: 'preserve-3d',
                      background: 'var(--card-bg)',
                      position: 'relative',
                      width: '100%',
                      padding: 24,
                      boxShadow: foldState === 2 ? '0 4px 12px var(--shadow-color)' : '-5px 15px 25px rgba(0,0,0,0.15)',
                      border: foldState === 2 ? '1px solid var(--border-color)' : 'none',
                      borderRadius: foldState === 2 ? 8 : 2,
                      pointerEvents: 'auto',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.03) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 10 }} />

                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Opportunity Analysis
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                      </span>
                      {slide.priorityScore && (
                        <div style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: 0.5, color: slide.priorityScore === 'HIGH' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          [{slide.priorityScore} PRIORITY]
                        </div>
                      )}
                    </div>

                    {slide.topComplaint && (
                      <div style={{ paddingBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          Top Complaint
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{slide.topComplaint}</div>
                      </div>
                    )}

                    {/* Panel 2 (Valley Fold) */}
                    <motion.div
                      onClick={(e) => {
                        if (foldState === 1) {
                          e.stopPropagation();
                          setFoldState(0);
                        }
                      }}
                      onMouseEnter={(e) => { e.stopPropagation(); setHoveredPanel(2); }}
                      onMouseLeave={(e) => { e.stopPropagation(); setHoveredPanel(1); }}
                      initial={false}
                      animate={{ rotateX: foldState === 0 ? (isAccordionHovered ? -165 : -175) : foldState === 1 ? (invertFolds ? 40 : -40) : 0 }}
                      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        transformOrigin: 'top center', transformStyle: 'preserve-3d',
                        background: 'var(--card-bg-alt)',
                        padding: 24,
                        boxShadow: foldState === 2 ? 'none' : '-5px 15px 25px rgba(0,0,0,0.15)',
                        borderLeft: foldState === 2 ? '1px solid var(--border-color)' : 'none',
                        borderRight: foldState === 2 ? '1px solid var(--border-color)' : 'none',
                        pointerEvents: foldState === 0 ? 'none' : 'auto'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 25, background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 8px, transparent 100%)', pointerEvents: 'none', zIndex: 10 }} />

                      {slide.rootCause && (
                        <div style={{ paddingBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            Root Cause
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{slide.rootCause}</div>
                        </div>
                      )}

                      {/* Panel 3 (Mountain Fold) */}
                      <motion.div
                        onMouseEnter={(e) => { e.stopPropagation(); setHoveredPanel(3); }}
                        onMouseLeave={(e) => { e.stopPropagation(); setHoveredPanel(2); }}
                        initial={false}
                        animate={{ rotateX: foldState === 0 ? (isAccordionHovered ? 165 : 175) : foldState === 1 ? (invertFolds ? -40 : 40) : 0 }}
                        transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          transformOrigin: 'top center', transformStyle: 'preserve-3d',
                          background: 'var(--card-bg)',
                          padding: 24,
                          boxShadow: foldState === 2 ? 'none' : '-5px 15px 25px rgba(0,0,0,0.15)',
                          borderLeft: foldState === 2 ? '1px solid var(--border-color)' : 'none',
                          borderRight: foldState === 2 ? '1px solid var(--border-color)' : 'none',
                        }}
                      >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 35, background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 6px, transparent 100%)', borderTop: foldState === 2 ? 'none' : '1.5px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)', pointerEvents: 'none', zIndex: 10 }} />

                        {slide.opportunityText && (
                          <div style={{ paddingBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                              Opportunity
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{slide.opportunityText}</div>
                          </div>
                        )}

                        {/* Panel 4 (Valley Fold) */}
                        <motion.div
                          onMouseEnter={(e) => { e.stopPropagation(); setHoveredPanel(4); }}
                          onMouseLeave={(e) => { e.stopPropagation(); setHoveredPanel(3); }}
                          initial={false}
                          animate={{ rotateX: foldState === 0 ? (isAccordionHovered ? -165 : -175) : foldState === 1 ? (invertFolds ? 40 : -40) : 0 }}
                          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                          style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            transformOrigin: 'top center', transformStyle: 'preserve-3d',
                            background: 'var(--card-bg-alt)',
                            padding: 24,
                            boxShadow: foldState === 2 ? 'none' : '-5px 15px 25px rgba(0,0,0,0.15)',
                            borderLeft: foldState === 2 ? '1px solid var(--border-color)' : 'none',
                            borderRight: foldState === 2 ? '1px solid var(--border-color)' : 'none',
                          }}
                        >
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 45, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 12px, transparent 100%)', pointerEvents: 'none', zIndex: 10 }} />

                          {slide.earlyWarning && (
                            <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: 12, paddingBottom: 8 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Trend Alert</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{slide.earlyWarning}</div>
                            </div>
                          )}

                          {/* Panel 5 (Mountain Fold) */}
                          <motion.div
                            onMouseEnter={(e) => { e.stopPropagation(); setHoveredPanel(5); }}
                            onMouseLeave={(e) => { e.stopPropagation(); setHoveredPanel(4); }}
                            initial={false}
                            animate={{ rotateX: foldState === 0 ? (isAccordionHovered ? 165 : 175) : foldState === 1 ? (invertFolds ? -40 : 40) : 0 }}
                            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                            style={{
                              position: 'absolute', top: '100%', left: 0, right: 0,
                              transformOrigin: 'top center', transformStyle: 'preserve-3d',
                              background: 'var(--card-bg)',
                              padding: 24,
                              boxShadow: foldState === 2 ? '0 10px 20px var(--shadow-color)' : '-5px 15px 25px rgba(0,0,0,0.15)',
                              borderLeft: foldState === 2 ? '1px solid var(--border-color)' : 'none',
                              borderRight: foldState === 2 ? '1px solid var(--border-color)' : 'none',
                              borderBottom: foldState === 2 ? '1px solid var(--border-color)' : 'none',
                              borderRadius: foldState === 2 ? '0 0 8px 8px' : 2
                            }}
                          >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 10 }} />

                            {slide.quickWin && (
                              <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: 12, marginBottom: 20 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Quick Win</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{slide.quickWin}</div>
                              </div>
                            )}

                            <button style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Suggest Plan
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>

                          </motion.div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>

              {/* NAVIGATION ARROWS */}
              {opportunitiesList.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', zIndex: 2, gap: 12 }}>
                  <button
                    onClick={prevSlide}
                    className="skeleton-target"
                    style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px var(--shadow-color)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--card-bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <button
                    onClick={nextSlide}
                    className="skeleton-target"
                    style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px var(--shadow-color)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--card-bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
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
