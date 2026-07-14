'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PromptField from '@/components/PromptField';

const OPPORTUNITIES = [
  {
    id: 1,
    title: 'Opportunity 1',
    description: 'Expanding into the mid-market segment offers a significant growth vector. Current analysis shows a $50M gap in mid-tier SaaS adoption where our core product features perfectly align. The immediate opportunity lies in creating a streamlined onboarding experience that bridges the complexity gap for teams of 50-200 employees.',
    highlights: [
      { text: '$50M gap', citations: ['Internal Revenue Projections', 'Stripe Billing Trends', 'Churn Analysis Q2'] },
      { text: 'streamlined onboarding experience', citations: ['UX Audit 2023', 'Zendesk Ticket Volume', 'User Flow Drop-offs'] }
    ],
    gaps: ['stripe.com', 'slack.com', 'notion.so'],
    gapBullets: [
      { text: 'Missing robust role-based access control (RBAC) preventing enterprise adoption.', citations: ['Market Report Q3', 'Competitor Analysis', 'Salesforce Data'] },
      { text: 'Lack of native integrations with legacy ERP systems.', citations: ['Internal Revenue Projections', 'Stripe Billing Trends'] },
      { text: 'Current reporting tools do not support automated scheduled exports.', citations: ['UX Audit 2023', 'User Flow Drop-offs'] }
    ],
    effort: 'High',
    impact: 'High',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000'
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
      { text: 'AI features require navigating 3 levels deep into settings.', citations: ['Mixpanel Event Data', 'Feature Heatmaps'] },
      { text: 'No contextual tooltips to explain AI automation capabilities.', citations: ['Support Queries', 'Beta User Feedback'] },
      { text: 'Users lack pre-built templates to start automating immediately.', citations: ['Predictive Cohort Model', 'A/B Test Results'] }
    ],
    effort: 'Low',
    impact: 'High',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1000'
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
      { text: 'Mobile web experience is unresponsive for complex approval forms.', citations: ['Workflow Audit', 'Time-to-resolution metrics'] },
      { text: 'Push notifications for urgent approvals are currently unsupported.', citations: ['Mobile App Survey', 'Competitor Features'] },
      { text: 'No offline mode for executives reviewing while traveling.', citations: ['Database Timestamps', 'SLA Tracking', 'Executive Interviews'] }
    ],
    effort: 'High',
    impact: 'Low',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1000'
  }
];

export default function OpportunitiesPage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<{ type: 'desc' | 'gap', id: number } | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // PromptField State
  const [selectedNode, setSelectedNode] = useState(null);
  const [commandActive, setCommandActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
            <div style={{ flex: 1, position: 'relative', display: 'flex', zIndex: 2 }}>
              {/* Vertical line indicator */}
              <div className="skeleton-target" style={{ width: 2, background: 'var(--border-color)', marginRight: 40, height: '100%' }}>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: '30%' }}
                  style={{ width: '100%', background: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h1 className="skeleton-target" style={{ fontSize: 48, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 32, letterSpacing: '-0.02em', fontFamily: 'var(--font-poppins)' }}>
                  {slide.title}
                </h1>

                <p className="skeleton-target" style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 60, maxWidth: 600 }}>
                  {renderDescription()}
                </p>

                <div style={{ display: 'flex', gap: 80 }}>
                  
                  {/* Left Side: Gaps & Effort/Impact */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 40, position: 'relative', zIndex: 10 }}>
                    {/* Gaps Section */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <h2 className="skeleton-target" style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Gap(s)</h2>
                        <div className="skeleton-target" style={{ display: 'flex', gap: 16 }}>
                          {slide.gaps.map((domain, i) => (
                            <div key={i} style={{ width: 48, height: 48, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--card-bg-alt)', overflow: 'hidden' }}>
                              <img src={`https://logo.clearbit.com/${domain}`} alt={domain} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <ul className="skeleton-target" style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6 }}>
                        {slide.gapBullets.map((bullet, i) => {
                          const isHovered = hoveredNode?.type === 'gap' && hoveredNode?.id === i;
                          return (
                            <li 
                              key={i} 
                              style={{ 
                                marginBottom: 12,
                                color: isHovered ? 'var(--accent)' : 'inherit',
                                cursor: 'pointer',
                                transition: 'color 0.2s',
                                position: 'relative'
                              }}
                              onMouseEnter={() => handleMouseEnter('gap', i)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <span style={{ borderBottom: isHovered ? '2px solid var(--accent)' : '1px dashed rgba(255,255,255,0.2)', transition: 'border-color 0.2s' }}>
                                {bullet.text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Effort & Impact */}
                    <div className="skeleton-target" style={{ display: 'flex', gap: 60 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Effort</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: slide.effort === 'High' ? '#FF6700' : '#4ade80' }}>{slide.effort}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Impact</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: slide.impact === 'High' ? '#4ade80' : '#FF6700' }}>{slide.impact}</div>
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

            {/* RIGHT COLUMN: Image & Navigation */}
            <div style={{ flexShrink: 0, width: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <div className="skeleton-target" style={{ width: '100%', aspectRatio: '1', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--card-bg)' }}>
                <img src={slide.image} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
              </div>

              {/* Suggest Plan Button */}
              <div style={{ position: 'absolute', bottom: -20, right: 0 }}>
                <button className="skeleton-target" style={{ background: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', padding: '12px 24px', fontSize: 16, fontWeight: 500, borderRadius: 4, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--bg-body)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  Suggest Plan
                </button>
              </div>
            </div>
            
            {/* NEXT ARROW */}
            <div style={{ display: 'flex', alignItems: 'center', zIndex: 2 }}>
              <button 
                onClick={nextSlide}
                className="skeleton-target"
                style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--text-primary)', background: 'transparent', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--bg-body)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
