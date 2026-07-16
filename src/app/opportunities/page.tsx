'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PromptField from '@/components/PromptField';

const OPPORTUNITIES = [
  {
    id: 1,
    title: 'Gap & Opportunity Report — Example',
    description: 'Expanding into the mid-market segment offers a significant growth vector. Current analysis shows a $50M gap in mid-tier SaaS adoption where our core product features perfectly align. The immediate opportunity lies in creating a streamlined onboarding experience that bridges the complexity gap for teams of 50-200 employees.',
    highlights: [
      { text: '$50M gap', citations: ['Internal Revenue Projections', 'Stripe Billing Trends', 'Churn Analysis Q2'] },
      { text: 'streamlined onboarding experience', citations: ['UX Audit 2023', 'Zendesk Ticket Volume', 'User Flow Drop-offs'] }
    ],
    gaps: ['stripe.com', 'slack.com', 'notion.so'],
    gapBullets: [
      { text: 'Missing robust role-based access control (RBAC) preventing enterprise adoption.', citations: ['Market Report Q3', 'Competitor Analysis', 'Salesforce Data'], companies: ['stripe.com', 'slack.com', 'notion.so', 'figma.com', 'github.com', 'apple.com'] },
      { text: 'Lack of native integrations with legacy ERP systems.', citations: ['Internal Revenue Projections', 'Stripe Billing Trends'], companies: ['stripe.com', 'slack.com'] },
      { text: 'Current reporting tools do not support automated scheduled exports.', citations: ['UX Audit 2023', 'User Flow Drop-offs'], companies: ['notion.so'] }
    ],
    effort: 'High',
    impact: 'High',
    topComplaint: "'Customer support never responds' — 312 mentions across Google Reviews + App Store in 60 days.",
    rootCause: "No live support channel; only email with 48hr+ response times.",
    gapIdentified: "No competitor in this market offers Arabic-language live chat or weekend support.",
    opportunityText: "'24/7 Arabic Live Chat Support' — positions our brand as the most customer-centric option in the market.",
    priorityScore: "HIGH",
    priorityReasoning: "312 complaint mentions, low implementation complexity, strong differentiation potential.",
    earlyWarning: "Complaint volume for this category grew from 40 (Month 1) → 120 (Month 2) → 312 (Month 3). Trend alert triggered.",
    quickWin: "Launch a WhatsApp support line within 2 weeks. Market it as: 'We actually reply.'"
  },
  {
    id: 2,
    title: 'Opportunity 2',
    description: 'We have identified a massive under-utilization of the AI automation tools in our platform. By surfacing these features directly in the main dashboard rather than burying them in settings, we can increase user retention by an estimated 15% within the first 30 days of the customer lifecycle.',
    highlights: [
      { text: 'under-utilization of the AI automation tools', citations: ['Mixpanel Event Data', 'Feature Heatmaps'] },
      { text: 'estimated 15%', citations: ['Predictive Cohort Model', 'A/B Test Results', 'Historical Data'] }
    ],
    gaps: ['openai.com', 'anthropic.com', 'linear.app'],
    gapBullets: [
      { text: 'AI features require navigating 3 levels deep into settings.', citations: ['Mixpanel Event Data', 'Feature Heatmaps'], companies: ['openai.com', 'anthropic.com', 'linear.app'] },
      { text: 'No contextual tooltips to explain AI automation capabilities.', citations: ['Support Queries', 'Beta User Feedback'], companies: ['anthropic.com'] },
      { text: 'Users lack pre-built templates to start automating immediately.', citations: ['Predictive Cohort Model', 'A/B Test Results'], companies: ['openai.com', 'linear.app'] }
    ],
    effort: 'Low',
    impact: 'High',
    topComplaint: "'Too hard to figure out AI' — 145 mentions in onboarding surveys.",
    rootCause: "Features hidden 3 menus deep without contextual onboarding.",
    gapIdentified: "Competitors have single-click AI templates.",
    opportunityText: "Surface 3 core AI templates directly on the dashboard.",
    priorityScore: "MEDIUM",
    priorityReasoning: "High impact on retention, moderate engineering effort.",
    earlyWarning: "AI usage dropped 12% MoM after the recent navigation redesign.",
    quickWin: "Add a 'Try AI' banner to the top of the dashboard."
  },
  {
    id: 3,
    title: 'Opportunity 3',
    description: 'Launching a dedicated mobile companion app focused strictly on quick-approval workflows. Executive sponsors currently delay approvals by an average of 3.4 days due to friction in the desktop web experience. A mobile-first approach could reduce this latency to under 4 hours.',
    highlights: [
      { text: 'average of 3.4 days', citations: ['Database Timestamps', 'SLA Tracking', 'Customer Success Reports'] },
      { text: 'under 4 hours', citations: ['Workflow Audit', 'Time-to-resolution metrics', 'Mobile App Survey'] }
    ],
    gaps: ['apple.com', 'figma.com', 'github.com'],
    gapBullets: [
      { text: 'Mobile web experience is unresponsive for complex approval forms.', citations: ['Workflow Audit', 'Time-to-resolution metrics'], companies: ['figma.com', 'github.com', 'apple.com'] },
      { text: 'Push notifications for urgent approvals are currently unsupported.', citations: ['Mobile App Survey', 'Competitor Features'], companies: ['apple.com', 'github.com'] },
      { text: 'No offline mode for executives reviewing while traveling.', citations: ['Database Timestamps', 'SLA Tracking', 'Executive Interviews'], companies: ['figma.com'] }
    ],
    effort: 'High',
    impact: 'Low',
    topComplaint: "'Takes too long to approve' — 89 mentions from Enterprise admins.",
    rootCause: "No mobile-native approval workflow.",
    gapIdentified: "Legacy enterprise solutions lack modern mobile companions.",
    opportunityText: "Standalone mobile app for instant push-notification approvals.",
    priorityScore: "LOW",
    priorityReasoning: "High engineering cost, but highly requested by key enterprise accounts.",
    earlyWarning: "Approval times increased by 0.5 days on average last quarter.",
    quickWin: "Implement email-based approvals (reply 'APPROVE' to email)."
  }
];

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

export default function OpportunitiesPage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<{ type: 'desc' | 'gap', id: number } | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [commandActive, setCommandActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Accordion fold state: 0 = collapsed, 1 = accordion
  const [foldState, setFoldState] = useState(0);
  const [isAccordionHovered, setIsAccordionHovered] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState<number | null>(null);

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

  const slide = OPPORTUNITIES[slideIndex];

  const handleMouseEnter = (type: 'desc' | 'gap', id: number) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredNode({ type, id });
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setHoveredNode(null);
    }, 400); // 400ms grace period to move mouse to popup
  };

  const keepHoverActive = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  // Helper to render description with hoverable spans
  const renderDescription = () => {
    let desc = slide.description;
    let parts: React.ReactNode[] = [desc];

    slide.highlights.forEach((highlight, idx) => {
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
    setSlideIndex((prev) => (prev + 1) % OPPORTUNITIES.length);
  };

  const activeCitations = hoveredNode?.type === 'desc' 
    ? slide.highlights[hoveredNode.id].citations 
    : hoveredNode?.type === 'gap' 
      ? slide.gapBullets[hoveredNode.id].citations 
      : [];

  const invertFolds = hoveredPanel === 1 || hoveredPanel === 3 || hoveredPanel === 5;

  return (
    <>
      <div className="main-content" style={{ overflowY: 'auto', padding: '60px', display: 'flex', flexDirection: 'column' }}>
        
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
                        <h2 className="skeleton-target" style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', margin: 0 }}>Gap(s)</h2>
                      </div>
                      <ul className="skeleton-target" style={{ margin: 0, paddingLeft: 16, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                        {slide.gapBullets.map((bullet, i) => {
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
                            {activeCitations.map((cit, i) => (
                              <a 
                                key={i} 
                                href="#"
                                style={{ 
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
                                  transition: 'border-color 0.2s, background 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--item-hover)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--card-bg-alt)'; }}
                              >
                                <span>{cit}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Data Report - 3D Vertical Accordion */}
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
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
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                          </button>

                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
            
            {/* NEXT ARROW */}
            <div style={{ display: 'flex', alignItems: 'center', zIndex: 2 }}>
              <button 
                onClick={nextSlide}
                className="skeleton-target"
                style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px var(--shadow-color)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--bg-body)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

          </motion.div>
        </AnimatePresence>
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
