'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PromptField from '@/components/PromptField';

// BACKEND: competitors.competitors_watchlist — SELECT id, name, domain WHERE workspace_id = ?
const entities = [
  { name: "Tesla", domain: "tesla.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "Spotify", domain: "spotify.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Google", domain: "google.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Vercel", domain: "vercel.com" },
  { name: "Nike", domain: "nike.com" }
];

function getBrandColors(domain: string) {
  const knownBrands: Record<string, [string, string]> = {
    'amazon.com': ['#ff9900', '#cc7a00'],
    'tesla.com': ['#e82127', '#b3191e'],
    'apple.com': ['#52525b', '#27272a'],
    'nike.com': ['#ff6600', '#cc5200'],
    'spotify.com': ['#1db954', '#179443'],
    'stripe.com': ['#635bff', '#4e48cc'],
    'vercel.com': ['#18181b', '#000000'],
    'google.com': ['#4285f4', '#3367d6'],
    'microsoft.com': ['#00a4ef', '#007bb5'],
    'meta.com': ['#0668e1', '#0553b4'],
    'netflix.com': ['#e50914', '#b30710'],
    'uber.com': ['#27272a', '#18181b']
  };

  const key = domain.toLowerCase();
  if (knownBrands[key]) return knownBrands[key];

  let hash = 0;
  for (let i = 0; i < domain.length; i++) hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return [`hsl(${hue}, 80%, 50%)`, `hsl(${(hue + 40) % 360}, 80%, 40%)`];
}

function getPattern(index: number, c1: string, c2: string) {
  const mixAlpha = `color-mix(in srgb, ${c1} 40%, transparent)`;
  const mixDark = `color-mix(in srgb, ${c2} 40%, black)`;

  const patterns = [
    `linear-gradient(135deg, ${c1} 0%, ${mixDark} 100%)`,
    `repeating-linear-gradient(180deg, ${mixAlpha} 0%, ${mixAlpha} 20px, transparent 20px, transparent 40px), linear-gradient(to bottom, ${c1}, ${c2})`,
    `repeating-linear-gradient(45deg, ${mixAlpha} 0%, ${mixAlpha} 30px, transparent 30px, transparent 60px), linear-gradient(135deg, ${c2} 0%, ${c1} 100%)`,
    `repeating-linear-gradient(90deg, ${mixAlpha} 0%, ${mixAlpha} 25px, transparent 25px, transparent 50px), linear-gradient(to right, ${c1}, ${c2})`,
    `linear-gradient(90deg, transparent 35%, ${mixAlpha} 35%, ${mixAlpha} 65%, transparent 65%), linear-gradient(0deg, transparent 35%, ${mixAlpha} 35%, ${mixAlpha} 65%, transparent 65%), linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
    `repeating-linear-gradient(45deg, transparent 0%, transparent 20px, ${mixAlpha} 20px, ${mixAlpha} 40px), repeating-linear-gradient(-45deg, transparent 0%, transparent 20px, ${mixAlpha} 20px, ${mixAlpha} 40px), linear-gradient(to bottom, ${c1}, ${mixDark})`
  ];
  return patterns[index % patterns.length];
}

export default function CompetitorsPage() {
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  // BACKEND: filter done client-side on fetched data
  const filtered = entities.filter(e => e.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
    <div className="main-content" style={{ overflowY: 'auto', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 1000, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <motion.div 
          animate={{ opacity: isSearchFocused ? 0 : 1, width: isSearchFocused ? 0 : 'auto' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ overflow: 'hidden', whiteSpace: 'nowrap', paddingRight: 24 }}
        >
          <h1 style={{ color: 'var(--text-primary)', fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1 }}>Competitors</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Select a competitor profile to analyze performance gaps and metrics.</div>
          {/* BACKEND: add competitor → POST /competitors { name, url } via FastAPI */}
        </motion.div>
        <motion.div className="competitors-search skeleton-target"
          animate={{ 
            width: isSearchFocused ? '100%' : 320,
            borderColor: isSearchFocused ? 'var(--text-secondary)' : 'var(--border-color)',
            boxShadow: isSearchFocused ? '0 16px 48px var(--shadow-color)' : '0 8px 32px var(--shadow-color)'
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '16px 24px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 16, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            // BACKEND: client-side filter on competitors list — no server search endpoint
            type="text"
            placeholder="Search competitors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: 18,
              width: '100%',
              fontFamily: 'inherit',
              fontWeight: 500
            }}
          />
        </motion.div>
      </div>

      <motion.div layout style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 32,
        width: '100%',
        maxWidth: 1000
      }}>
        {filtered.map((company, i) => {
          const [c1, c2] = getBrandColors(company.domain);
          const pattern = getPattern(i, c1, c2);
          const patternBack = getPattern(i, c2, c1);

          return (
            <div
              key={company.domain}
              className="competitor-card skeleton-target"
              style={{
                height: '320px',
                borderRadius: '24px',
                background: pattern,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease'
              }}
              onClick={(e) => {
                const logoDiv = e.currentTarget.querySelector('.search-logo-container') as HTMLDivElement;
                if (logoDiv) {
                  const rect = logoDiv.getBoundingClientRect();
                  // BACKEND: company detail page fetches signals for this competitor
                  router.push(`/company/${company.domain}?startX=${rect.left}&startY=${rect.top}&startW=${rect.width}&round=false`);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 30px 60px ${c1}40, inset 0 1px 0 rgba(255,255,255,0.3)`;
                const front = e.currentTarget.querySelector('.card-front') as HTMLDivElement;
                const overlay = e.currentTarget.querySelector('.card-overlay') as HTMLDivElement;
                if (front) front.style.transform = 'translateY(-60px)';
                if (overlay) {
                  overlay.style.opacity = '1';
                  overlay.style.transform = 'translateY(0)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
                const front = e.currentTarget.querySelector('.card-front') as HTMLDivElement;
                const overlay = e.currentTarget.querySelector('.card-overlay') as HTMLDivElement;
                if (front) front.style.transform = 'translateY(0)';
                if (overlay) {
                  overlay.style.opacity = '0';
                  overlay.style.transform = 'translateY(40px)';
                }
              }}
            >
              <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 80px rgba(0,0,0,0.2)', pointerEvents: 'none' }} />

              <div 
                className="card-front"
                style={{
                  position: 'absolute', inset: 0,
                  padding: '24px',
                  display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <div
                  className="search-logo-container"
                  style={{
                    width: 56, height: 56, borderRadius: 16, background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0, zIndex: 2,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                  }}
                >
                  <img src={`https://logo.clearbit.com/${company.domain}`} alt={company.name} style={{ width: '70%', height: '70%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${company.domain}&sz=64`; }} />
                </div>
                <div style={{ zIndex: 2, color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 16, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {company.domain}
                </div>
                <div style={{ marginTop: 'auto', zIndex: 2 }}>
                  <div style={{ color: 'white', fontSize: 24, fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {company.name}
                  </div>
                </div>
              </div>

              {/* OVERLAY FROM BOTTOM */}
              <div 
                className="card-overlay"
                style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  background: `linear-gradient(to top, ${c2} 20%, color-mix(in srgb, ${c2} 85%, transparent) 65%, transparent 100%)`,
                  padding: '60px 24px 24px 24px',
                  opacity: 0,
                  transform: 'translateY(40px)',
                  transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'flex', flexDirection: 'column',
                  pointerEvents: 'none', zIndex: 10
                }}
              >
                <div style={{ color: 'rgba(255,255,255,0.95)', fontSize: 12, lineHeight: 1.5, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  Leading innovator in the {['Tesla', 'Uber'].includes(company.name) ? 'transportation' : ['Netflix', 'Spotify'].includes(company.name) ? 'entertainment' : 'technology'} sector, focused on scaling digital experiences and capturing global market share through aggressive strategy and cutting-edge R&D.
                </div>
                <div style={{ marginTop: 16, padding: '8px 16px', background: 'white', color: c1, borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignSelf: 'flex-start', boxShadow: `0 4px 12px rgba(0,0,0,0.2)` }}>
                  Click to know more
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>

      {/* BACKEND: POST /hermes/conversations/{id}/messages (SSE) */}
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
