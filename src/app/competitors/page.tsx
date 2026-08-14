'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PromptField from '@/components/PromptField';
import { apiFetch } from '@/lib/api';
import { usePinned } from '@/context/PinnedContext';
import { extractDomain } from '@/lib/utils/domain';
import { logoUrl } from '@/lib/logos';

interface Competitor {
  id: string;
  workspace_id?: string;
  name: string;
  website: string;
  description?: string | null;
  created_at?: string;
}

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

const SampleBadge = ({ title }: { title: string }) => (
  <span style={{ fontSize: 10, background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: 4, marginLeft: 8, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
    {title}
  </span>
);


export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();

  // Aliased: this page already owns a `loading`/`error` pair for the competitor
  // list, which is a separate request from the watchlist.
  const {
    pin,
    unpin,
    isPinned,
    loading: pinnedLoading,
    error: pinnedError,
  } = usePinned();

  // competitor_ids with a pin write in flight. The context updates optimistically,
  // so the icon flips before the request lands; without this a double-click would
  // fire the opposite write against a state the server has not acknowledged yet.
  const [pinPending, setPinPending] = useState<ReadonlySet<string>>(() => new Set());

  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [commandActive, setCommandActive] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isThinking, setIsThinking] = useState(false);

  // Add Competitor modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompWebsite, setNewCompWebsite] = useState('');
  const [newCompDesc, setNewCompDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const loadCompetitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<Competitor[]>('/competitors');
    if (res.ok) {
      setCompetitors(res.data);
    } else {
      setError(res.error || 'Failed to fetch competitors');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  useEffect(() => {
    document.body.classList.toggle('is-thinking-active', isThinking);
    return () => document.body.classList.remove('is-thinking-active');
  }, [isThinking]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCommandActive(false);
        setSidebarCollapsed(true);
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim() || !newCompWebsite.trim()) return;
    setIsSubmitting(true);
    setAddError(null);

    let formattedWebsite = newCompWebsite.trim();
    if (!formattedWebsite.startsWith('http://') && !formattedWebsite.startsWith('https://')) {
      formattedWebsite = `https://${formattedWebsite}`;
    }

    const res = await apiFetch<Competitor>('/competitors', {
      method: 'POST',
      body: JSON.stringify({
        name: newCompName.trim(),
        website: formattedWebsite,
        description: newCompDesc.trim() || undefined,
      }),
    });

    setIsSubmitting(false);

    if (res.ok) {
      setNewCompName('');
      setNewCompWebsite('');
      setNewCompDesc('');
      setIsAddModalOpen(false);
      loadCompetitors();
    } else {
      setAddError(res.error || 'Failed to add competitor');
    }
  };

  const handleDeleteCompetitor = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this competitor?')) return;
    const res = await apiFetch(`/competitors/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert(res.error || 'Failed to delete competitor');
    }
  };

  const handleTogglePin = async (company: Competitor, e: React.MouseEvent) => {
    // The whole card is a click target that routes to /company/[domain], so
    // without this the toggle would navigate away mid-write. Same guard the
    // delete button above uses; preventDefault keeps the <button> inert beyond
    // this handler.
    e.preventDefault();
    e.stopPropagation();

    // Nothing is known about membership until the watchlist has been read, and
    // a second write for the same competitor must wait for the first.
    if (pinnedLoading || pinPending.has(company.id)) return;

    const domain = extractDomain(company.website);
    const wasPinned = isPinned(company.id);

    setPinPending((prev) => new Set(prev).add(company.id));

    const ok = wasPinned
      ? await unpin(company.id)
      : await pin({
          competitor_id: company.id,
          domain,
          // Normalised the same way PinnedContext normalises a watchlist row it
          // read back, so the sidebar label does not change on the next reload.
          name: company.name || domain || 'Unnamed competitor',
          logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          hasNews: false,
        });

    setPinPending((prev) => {
      const next = new Set(prev);
      next.delete(company.id);
      return next;
    });

    if (!ok) {
      // pin/unpin never throw; they record the reason on the context's `error`,
      // which the banner renders. The banner is at the top of a scrolling grid
      // and this card may be well below it, so write failures also alert — the
      // same way handleDeleteCompetitor reports its own.
      alert(wasPinned ? 'Failed to unpin this competitor.' : 'Failed to pin this competitor.');
    }
  };

  const filtered = competitors.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.website.toLowerCase().includes(query.toLowerCase()) ||
      extractDomain(c.website).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="main-content" style={{ overflowY: 'auto', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1000, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <motion.div 
            animate={{ opacity: isSearchFocused ? 0 : 1, width: isSearchFocused ? 0 : 'auto' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', whiteSpace: 'nowrap', paddingRight: 24 }}
          >
            <h1 style={{ color: 'var(--text-primary)', fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1 }}>Competitors</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>View and track competitors saved in your workspace.</div>
          </motion.div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '14px 24px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Competitor
            </button>

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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 16, flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
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
                  color: 'var(--text-primary)',
                  fontSize: 18,
                  width: '100%',
                  fontFamily: 'inherit',
                  fontWeight: 500
                }}
              />
            </motion.div>
          </div>
        </div>

        {error && (
          <div className="card" style={{ padding: '16px 20px', background: 'transparent', border: '1px solid var(--border-color)', color: '#ef4444', fontSize: 14, width: '100%', maxWidth: 1000, marginBottom: 32 }}>
            {error}
          </div>
        )}

        {/* The pinned context reports failures on `error` and never throws, so a
            watchlist that failed to load would otherwise leave every pin control
            silently inert with no explanation. This is the only surface a read
            failure has; write failures additionally alert from handleTogglePin. */}
        {pinnedError && pinnedError !== 'Not signed in' && (
          <div className="card" style={{ padding: '16px 20px', background: 'transparent', border: '1px solid var(--border-color)', color: '#ef4444', fontSize: 14, width: '100%', maxWidth: 1000, marginBottom: 32 }}>
            Pinned competitors: {pinnedError}
          </div>
        )}

        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 32,
            width: '100%',
            maxWidth: 1000
          }}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="card"
                style={{
                  height: '320px',
                  borderRadius: '24px',
                  animation: 'pulse 1.5s infinite ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ height: 24, width: '70%', background: 'rgba(255,255,255,0.1)', borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{
            width: '100%',
            maxWidth: 1000,
            padding: '60px 40px',
            textAlign: 'center',
            borderStyle: 'dashed',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
              {query ? 'No competitors found' : 'No competitors in workspace yet'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400 }}>
              {query ? `No competitor matching "${query}"` : 'Add your first competitor to start tracking performance gaps and signals.'}
            </div>
            {!query && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 8,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                + Add Competitor
              </button>
            )}
          </div>
        ) : (
          <motion.div layout style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 32,
            width: '100%',
            maxWidth: 1000
          }}>
            {filtered.map((company, i) => {
              const domain = extractDomain(company.website);
              const [c1, c2] = getBrandColors(domain);
              const pattern = getPattern(i, c1, c2);
              const initial = (company.name || domain || 'C').charAt(0).toUpperCase();

              // Keyed on the competitor id, never on `domain`: extractDomain
              // answers '' for a competitor with no website, so a domain-keyed
              // check would mark every websiteless competitor pinned as soon as
              // one of them was.
              const companyPinned = isPinned(company.id);
              const pinBusy = pinPending.has(company.id);
              // While the watchlist is still loading, `companyPinned` is false
              // only because nothing has been read yet. Offering an active
              // "pin" control there would state a membership we do not know, so
              // it stays disabled and dimmed until the read resolves.
              const pinDisabled = pinnedLoading || pinBusy;
              const pinIdleBg = companyPinned ? 'rgba(245, 158, 11, 0.85)' : 'rgba(0, 0, 0, 0.4)';
              const pinIdleFg = companyPinned ? '#ffffff' : 'rgba(255,255,255,0.8)';

              return (
                <div
                  key={company.id}
                  className="competitor-card skeleton-target"
                  style={{
                    height: '320px',
                    borderRadius: '24px',
                    background: pattern,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease',
                    padding: 0
                  }}
                  onClick={(e) => {
                    const logoDiv = e.currentTarget.querySelector('.search-logo-container') as HTMLDivElement;
                    if (logoDiv) {
                      const rect = logoDiv.getBoundingClientRect();
                      router.push(`/company/${domain}?startX=${rect.left}&startY=${rect.top}&startW=${rect.width}&round=false`);
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

                  {/* PIN BUTTON */}
                  <button
                    type="button"
                    onClick={(evt) => handleTogglePin(company, evt)}
                    // aria-disabled rather than the native `disabled`: a disabled
                    // button never runs our handler, and browsers disagree about
                    // whether the click still bubbles — where it does, it would
                    // reach the card and navigate. Letting the handler always run
                    // means stopPropagation() is guaranteed, and it re-checks the
                    // same condition before writing anything.
                    aria-disabled={pinDisabled}
                    title={
                      pinnedLoading
                        ? 'Loading pinned competitors...'
                        : companyPinned
                          ? 'Unpin from sidebar'
                          : 'Pin to sidebar'
                    }
                    aria-label={companyPinned ? `Unpin ${company.name}` : `Pin ${company.name}`}
                    aria-pressed={pinnedLoading ? undefined : companyPinned}
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 48,
                      zIndex: 20,
                      background: pinIdleBg,
                      backdropFilter: 'blur(8px)',
                      color: pinIdleFg,
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      cursor: pinDisabled ? 'not-allowed' : 'pointer',
                      opacity: pinDisabled ? 0.45 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(btn) => {
                      if (pinDisabled) return;
                      btn.currentTarget.style.background = 'rgba(245, 158, 11, 0.8)';
                      btn.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(btn) => {
                      if (pinDisabled) return;
                      btn.currentTarget.style.background = pinIdleBg;
                      btn.currentTarget.style.color = pinIdleFg;
                    }}
                  >
                    {/* Bookmark, filled once pinned so the state reads without hovering. */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={companyPinned ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={(evt) => handleDeleteCompetitor(company.id, evt)}
                    title="Remove competitor"
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      zIndex: 20,
                      background: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(8px)',
                      color: 'rgba(255,255,255,0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(btn) => {
                      btn.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
                      btn.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(btn) => {
                      btn.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      btn.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                    }}
                  >
                    ✕
                  </button>

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
                        width: 56, height: 56, borderRadius: 16, background: '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0, zIndex: 2,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        color: c1,
                        fontSize: 22,
                        fontWeight: 800
                      }}
                    >
                      {domain ? (
                        <img
                          src={logoUrl(domain, 64) ?? ''}
                          alt={company.name}
                          style={{ width: '70%', height: '70%', objectFit: 'contain' }}
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (!img.dataset.triedGoogle) {
                              img.dataset.triedGoogle = 'true';
                              img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                            } else {
                              img.style.display = 'none';
                              if (img.parentElement) {
                                img.parentElement.textContent = initial;
                              }
                            }
                          }}
                        />
                      ) : (
                        initial
                      )}
                    </div>
                    <div style={{ zIndex: 2, color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 16, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {domain || company.website}
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
                    <div style={{ color: 'rgba(255,255,255,0.95)', fontSize: 12, lineHeight: 1.5, textShadow: '0 2px 4px rgba(0,0,0,0.3)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {company.description || (
                        <span>
                          Monitored competitor profile for {company.name}. Click to view signals and intelligence.
                          <SampleBadge title="Mock data" />
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 16, padding: '8px 16px', background: 'white', color: c1, borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignSelf: 'flex-start', boxShadow: `0 4px 12px rgba(0,0,0,0.2)` }}>
                      Click to know more
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ADD COMPETITOR MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="card card-lg"
              style={{
                width: '100%',
                maxWidth: 480,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Add Competitor</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    color: 'var(--text-secondary)',
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              {addError && (
                <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border-color)', color: '#ef4444', fontSize: 13 }}>
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddCompetitor} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp"
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: 15,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Website / Domain *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. https://acme.com"
                    value={newCompWebsite}
                    onChange={(e) => setNewCompWebsite(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: 15,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="Brief overview of this competitor..."
                    rows={3}
                    value={newCompDesc}
                    onChange={(e) => setNewCompDesc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 6,
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Competitor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
