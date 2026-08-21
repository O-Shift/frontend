'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import InfiniteCanvas, { InfiniteCanvasHandle } from '@/components/InfiniteCanvas';
import PromptField from '@/components/PromptField';
import { fetchCampaigns, campaignThemes, campaignThumbnails, type Campaign, type CampaignPost } from '@/lib/api';
import { getDeckArtwork, getDeckCardStyle, getPostArtwork } from '@/lib/campaign-artwork';

// ─── Canvas regions ───────────────────────────────────────────────
// Position and colour only. The names shown on the canvas come from the
// themes the clustering engine recorded, not from this list.
interface Region {
  id: string;
  x: number;
  y: number;
  color: string;
  /** Voronoi outline, or null for a region that sits outside the seam grid. */
  polygon: string | null;
}

const CLUSTERS: Region[] = [
  { id: 'r1', x: -580, y: -320, color: '#FF6700', polygon: '-1500,-1000 0,-1000 0,-177 -1500,998' },
  { id: 'r2', x:  580, y: -320, color: '#00A4EF', polygon: '0,-1000 1500,-1000 1500,998 0,-177' },
  { id: 'r3', x:    0, y:  420, color: '#34A853', polygon: '-1500,998 0,-177 1500,998 1500,1000 -1500,1000' },
];

interface HeatmapBucket extends Region {
  name: string;
}

const HEATMAP_CLUSTERS: HeatmapBucket[] = [
  { id: 'high',   name: 'High confidence',   x: -580, y: -320, color: '#FF3300', polygon: CLUSTERS[0].polygon },
  { id: 'medium', name: 'Medium confidence', x:  580, y: -320, color: '#FF9900', polygon: CLUSTERS[1].polygon },
  { id: 'low',    name: 'Low confidence',    x:    0, y:  420, color: '#555555', polygon: CLUSTERS[2].polygon },
];

/** Bucket label for campaigns the clustering engine recorded no theme for. */
const UNTHEMED = 'Untagged';

/**
 * Confidence is how sure the clustering engine is that these posts are one
 * campaign, and it is the only score on the record — the API returns no ROI or
 * budget, so this is what a "heatmap" can honestly rank by.
 */
function heatmapBucketFor(confidence: number): HeatmapBucket {
  if (confidence >= 70) return HEATMAP_CLUSTERS[0];
  if (confidence >= 40) return HEATMAP_CLUSTERS[1];
  return HEATMAP_CLUSTERS[2];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Derives a consistent HSL gradient for card layers when no image is available.
 * Same id, same colours on the server and in the browser.
 */
function deckGradient(seed: string, layer: number): string {
  const h = (hashString(seed) + layer * 43) % 360;
  return `linear-gradient(145deg, hsl(${h} 42% 24%), hsl(${(h + 45) % 360} 48% 13%))`;
}

function deckCardBg(thumbnailUrl: string | undefined | null, seed: string, layer: number, darkOverlay = false): string {
  const fallback = deckGradient(seed, layer);
  if (!thumbnailUrl) {
    return darkOverlay ? `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%), ${fallback}` : fallback;
  }
  if (darkOverlay) {
    return `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%), url('${thumbnailUrl}'), ${fallback}`;
  }
  return `linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%), url('${thumbnailUrl}'), ${fallback}`;
}

interface CampaignNode {
  id: string;
  title: string;
  campaign: Campaign;
  clusterName: string;
  region: Region;
  x: number;
  y: number;
  heatmapCluster: HeatmapBucket;
  heatmapX: number;
  heatmapY: number;
  confidence: number;
}

interface GhostLabel {
  key: string;
  name: string;
  x: number;
  y: number;
  color: string;
  regionId: string;
}

const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);

/**
 * Lays the campaigns out on the same phyllotaxis spirals the page has always
 * used: one spiral per canvas region, radius 235*sqrt(n+0.5) at the golden
 * angle. The grouping dimension is the campaign's leading theme — the
 * clustering engine records themes in `metadata.themes`, and there is no
 * `cluster` field on the wire. The three regions are reused in order when the
 * workspace has more themes than regions, and groups sharing a region continue
 * the same spiral so nodes never collide.
 */
function layOutCampaigns(campaigns: Campaign[]): { nodes: CampaignNode[]; labels: GhostLabel[] } {
  const grouped = new Map<string, Campaign[]>();
  for (const c of campaigns) {
    const key = campaignThemes(c)[0] ?? UNTHEMED;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(c);
    else grouped.set(key, [c]);
  }

  const groupNames = [...grouped.keys()].sort((a, b) => {
    if (a === UNTHEMED) return 1;
    if (b === UNTHEMED) return -1;
    return a.localeCompare(b);
  });

  const regionCounts: Record<string, number> = {};
  const heatmapCounts: Record<string, number> = {};
  const nodes: CampaignNode[] = [];
  const labels: GhostLabel[] = [];

  groupNames.forEach((clusterName, groupIndex) => {
    const region = CLUSTERS[groupIndex % CLUSTERS.length];
    labels.push({
      key: clusterName,
      name: clusterName,
      x: region.x,
      // Groups past the third share a region; stack their labels so both read.
      y: region.y + Math.floor(groupIndex / CLUSTERS.length) * 56,
      color: region.color,
      regionId: region.id,
    });

    for (const campaign of grouped.get(clusterName) ?? []) {
      const idx = regionCounts[region.id] ?? 0;
      regionCounts[region.id] = idx + 1;
      const radius = 235 * Math.sqrt(idx + 0.5);
      const theta = idx * GOLDEN_ANGLE;

      const hCluster = heatmapBucketFor(campaign.confidence);
      const hIdx = heatmapCounts[hCluster.id] ?? 0;
      heatmapCounts[hCluster.id] = hIdx + 1;
      const hRadius = 235 * Math.sqrt(hIdx + 0.5);
      const hTheta = hIdx * GOLDEN_ANGLE;

      nodes.push({
        id: campaign.id,
        title: campaign.title,
        campaign,
        clusterName,
        region,
        x: region.x + Math.cos(theta) * radius,
        y: region.y + Math.sin(theta) * radius,
        heatmapCluster: hCluster,
        heatmapX: hCluster.x + Math.cos(hTheta) * hRadius,
        heatmapY: hCluster.y + Math.sin(hTheta) * hRadius,
        confidence: campaign.confidence,
      });
    }
  });

  return { nodes, labels };
}

function postDate(iso: string | null): string {
  if (!iso) return 'Undated';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Undated';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Page ─────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<CampaignNode | null>(null);
  const [currentView, setCurrentView] = useState<'Clusters' | 'Heatmap'>('Clusters');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [commandActive, setCommandActive] = useState(false);
  const canvasRef = useRef<InfiniteCanvasHandle>(null);

  const [folderRect, setFolderRect] = useState<{x: number, y: number} | null>(null);
  const [animState, setAnimState] = useState<'idle' | 'entering' | 'entered' | 'leaving'>('idle');
  const [isThinking, setIsThinking] = useState(false);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchCampaigns({ limit: 200 });
      if (cancelled) return;
      if (res.ok) {
        setCampaigns(res.data);
        setError(null);
      } else {
        setCampaigns([]);
        setError(res.error || 'Could not load campaigns.');
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const { nodes, labels } = useMemo(() => layOutCampaigns(campaigns), [campaigns]);

  const visibleRegions = useMemo<Region[]>(() => {
    if (currentView === 'Heatmap') {
      const used = new Set(nodes.map((n) => n.heatmapCluster.id));
      return HEATMAP_CLUSTERS.filter((b) => used.has(b.id));
    }
    const used = new Set(nodes.map((n) => n.region.id));
    return CLUSTERS.filter((r) => used.has(r.id));
  }, [nodes, currentView]);

  const ghostLabels = useMemo<GhostLabel[]>(() => {
    if (currentView !== 'Heatmap') return labels;
    const used = new Set(nodes.map((n) => n.heatmapCluster.id));
    return HEATMAP_CLUSTERS.filter((b) => used.has(b.id)).map((b) => ({
      key: b.id, regionId: b.id, name: b.name, x: b.x, y: b.y, color: b.color,
    }));
  }, [currentView, nodes, labels]);

  const selectedPosts = useMemo<CampaignPost[]>(() => {
    if (!selectedNode) return [];
    return [...(selectedNode.campaign.posts ?? [])].sort((a, b) => {
      const ta = a.captured_at ? Date.parse(a.captured_at) : 0;
      const tb = b.captured_at ? Date.parse(b.captured_at) : 0;
      return ta - tb;
    });
  }, [selectedNode]);

  useEffect(() => {
    document.body.classList.toggle('is-thinking-active', isThinking);
    return () => document.body.classList.remove('is-thinking-active');
  }, [isThinking]);

  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // ESC closes the prompt bar and floating sidebar, but keeps the chip
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

  useEffect(() => {
    if (animState === 'entering') {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimState('entered'));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [animState]);

  const handleSetSelectedNode = (node: any) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    if (!node) {
      setCommandActive(false);
      setSidebarCollapsed(true);
      setAnimState('leaving');
      leaveTimeoutRef.current = setTimeout(() => {
        setSelectedNode(null);
        setAnimState('idle');
      }, 2100);
    } else {
      setSelectedNode(node);
      setCommandActive(true);
      setSidebarCollapsed(false);
      setAnimState('entering');
    }
  };

  return (
    <div className="page-canvas skeleton-target">
      <style>{`
        .campaign-node.blurred { filter: blur(8px) opacity(0.3); pointer-events: none; }
        .campaign-node.selected .cards { opacity: 0; pointer-events: none; transition: opacity 0.2s; }
        @keyframes pop-out {
          0% { transform: translate(var(--sx), var(--sy)) scale(0); opacity: 0; }
          30% { transform: translate(calc(var(--sx) + var(--jx)), calc(var(--sy) - 140px)) scale(1.15) rotate(var(--rot)); opacity: 1; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pop-in {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
          60% { transform: translate(calc(var(--sx) + var(--jx)), calc(var(--sy) - 140px)) scale(1.15) rotate(var(--rot)); opacity: 1; }
          100% { transform: translate(var(--sx), var(--sy)) scale(0); opacity: 0; }
        }
        @keyframes line-grow {
          0% { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 0.6; }
        }
        @keyframes line-shrink {
          0% { transform: scaleX(1); opacity: 0.6; }
          100% { transform: scaleX(0); opacity: 0; }
        }
      `}</style>

      {/* ── Infinite pan/zoom canvas ──────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
      <InfiniteCanvas ref={canvasRef} initialScale={0.65} className="campaigns-bg">

        {/* Gradient territory blobs (behind Voronoi lines) */}
        {visibleRegions.map((c) => (
          <div
            key={`blob-${c.id}`}
            style={{
              position: 'absolute',
              left: c.x, top: c.y,
              width: 1400, height: 1400,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${c.color}, transparent 60%)`,
              filter: 'blur(60px)',
              opacity: hoveredCluster === c.id ? 0.13 : 0,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ))}

        {/* SVG: Voronoi territory fills + seams + connection lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 0 }}>
          {/* Voronoi region fills */}
          {visibleRegions.map((c) => c.polygon && (
            <polygon
              key={`vor-${c.id}`}
              points={c.polygon}
              fill={c.color}
              fillOpacity={hoveredCluster === c.id ? 0.06 : 0}
              stroke={hoveredCluster === c.id ? c.color : 'none'}
              strokeOpacity={0.4}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              style={{ transition: 'fill-opacity 0.4s ease' }}
            />
          ))}
          {/* Voronoi seams (bisector lines) */}
          {hoveredCluster && (
            <>
              <line x1="0" y1="-1000" x2="0" y2="-177" stroke="var(--border-color)" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="-177" x2="-1500" y2="998" stroke="var(--border-color)" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="-177" x2="1500" y2="998" stroke="var(--border-color)" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4 4" />
            </>
          )}
          {/* Dashed connection lines */}
          {nodes.map((camp) => {
            const anchor = currentView === 'Heatmap' ? camp.heatmapCluster : camp.region;
            return (
              <line
                key={`l${camp.id}`}
                x1={currentView === 'Heatmap' ? camp.heatmapX : camp.x}
                y1={currentView === 'Heatmap' ? camp.heatmapY : camp.y}
                x2={anchor.x} y2={anchor.y}
                stroke="var(--border-color)"
                strokeOpacity="0.3"
                strokeWidth="1.5"
                strokeDasharray="8 8"
              />
            );
          })}
        </svg>

        {/* Cluster ghost labels */}
        {ghostLabels.map((c) => (
          <div
            key={c.key}
            className="ghost-label"
            onMouseEnter={() => setHoveredCluster(c.regionId)}
            onMouseLeave={() => setHoveredCluster(null)}
            style={{
              position: 'absolute',
              left: c.x, top: c.y,
              transform: 'translate(-50%, -50%)',
              fontSize: 44, fontWeight: 800,
              color: hoveredCluster === c.regionId ? c.color : 'var(--text-secondary)',
              opacity: hoveredCluster === c.regionId ? 0.4 : 0.18,
              textTransform: 'uppercase', letterSpacing: 10,
              whiteSpace: 'nowrap', cursor: 'crosshair',
              transition: 'all 0.3s ease',
              userSelect: 'none',
              zIndex: 5,
            }}
          >
            {c.name}
          </div>
        ))}

        {/* Campaign folder cards */}
        {nodes.map((camp) => {
          const isSelected = selectedNode?.id === camp.id;
          const isBlurred = selectedNode && !isSelected;
          const activeClusterId = currentView === 'Heatmap' ? camp.heatmapCluster.id : camp.region.id;
          const activeColor = currentView === 'Heatmap' ? camp.heatmapCluster.color : camp.region.color;
          const isHovered = hoveredFolderId === camp.id || activeClusterId === hoveredCluster;
          const targetX = currentView === 'Heatmap' ? camp.heatmapX : camp.x;
          const targetY = currentView === 'Heatmap' ? camp.heatmapY : camp.y;
          const postCount = camp.campaign.posts?.length ?? 0;

          return (
            <div
              key={camp.id}
              className={`campaign-node ${isSelected ? 'selected' : ''} ${isBlurred ? 'blurred' : ''}`}
              style={{ left: targetX - 110, top: targetY - 80, transition: 'filter 0.4s, opacity 0.4s, left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)', zIndex: isHovered ? 10 : 0 }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                router.push(`/campaigns/${camp.id}`);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isSelected) {
                  if (leaveTimeoutRef.current) {
                    clearTimeout(leaveTimeoutRef.current);
                    leaveTimeoutRef.current = null;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  setFolderRect({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2 - 20
                  });
                  setSelectedNode(camp);
                  setCommandActive(true);
                  setSidebarCollapsed(false);
                  setAnimState('entering');
                } else {
                  setCommandActive(false);
                  setSidebarCollapsed(true);
                  setAnimState('leaving');
                  leaveTimeoutRef.current = setTimeout(() => {
                    setSelectedNode(null);
                    setAnimState('idle');
                  }, 2100);
                }
              }}
            >
              <div className="scene"
                onMouseEnter={() => setHoveredFolderId(camp.id)}
                onMouseLeave={() => setHoveredFolderId(null)}
              >
                <div className="deck-wrapper skeleton-target" title={`${camp.title} — ${camp.clusterName}`} style={{ ['--cord-color' as any]: activeColor }}>
                  {(() => {
                    const [leftImg, rightImg, frontImg] = getDeckArtwork(camp.campaign);
                    return (
                      <div className={`cards ${isSelected ? 'cards-hidden' : ''}`}>
                        <div className="card card-left" style={getDeckCardStyle(leftImg, camp.id, 1, false)}>
                          <div
                            className="floating-bubble"
                            style={{ bottom: 45, left: -20 }}
                            title={`${camp.confidence}% confidence this is one campaign`}
                          >
                            <span style={{ color: '#0095ff', fontSize: 16 }}>✨</span> {camp.confidence}%
                          </div>
                        </div>

                        <div className="card card-right" style={getDeckCardStyle(rightImg, camp.id, 2, false)}>
                          <div
                            className="floating-bubble"
                            style={{ top: 45, right: -25, width: 45, height: 45, borderRadius: '50%', justifyContent: 'center' }}
                            title={`${postCount} captured post${postCount === 1 ? '' : 's'}`}
                          >
                            {postCount}
                          </div>
                        </div>

                        <div className="card deck-front" style={getDeckCardStyle(frontImg, camp.id, 0, true)}>
                          <div className="logo font-semibold drop-shadow-md">{camp.title}</div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="cord-ring" />
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Timeline inside Canvas ───────────────────────────────────── */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              left: currentView === 'Heatmap' ? selectedNode.heatmapX : selectedNode.x,
              top: (currentView === 'Heatmap' ? selectedNode.heatmapY : selectedNode.y) + 160,
              transform: 'translateX(-50%)',
              opacity: animState !== 'idle' ? 1 : 0,
              zIndex: 10,
              pointerEvents: animState === 'entered' ? 'auto' : 'none',
              userSelect: 'none',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', gap: 24, padding: '24px 24px 64px 24px', alignItems: 'flex-end' }}>
              {selectedPosts.length === 0 && (
                <div style={{
                  color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
                  background: 'var(--card-bg)', border: '1px dashed var(--border-color)',
                  borderRadius: 12, padding: '18px 26px', whiteSpace: 'nowrap',
                }}>
                  No posts captured for this campaign yet.
                </div>
              )}
              {selectedPosts.map((post, i) => {
                const dateStr = postDate(post.captured_at);

                // Deterministic pseudo-random height for the vertical lines
                const lineH = 20 + ((i * 47) % 60);

                const startX = 1428 - i * 204;
                const startY = -300;
                const jx = (i % 3 === 0) ? -60 : (i % 3 === 1) ? 60 : 0;
                const rot = (i % 5 - 2) * 15;
                const postImg = getPostArtwork(post, selectedNode.campaign);

                return (
                  <div key={post.id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    minWidth: 180,
                    ['--sx' as any]: `${startX}px`,
                    ['--sy' as any]: `${startY}px`,
                    ['--jx' as any]: `${jx}px`,
                    ['--rot' as any]: `${rot}deg`,
                    animation: animState === 'leaving'
                      ? `pop-in 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${(selectedPosts.length - 1 - i) * 0.08}s both`
                      : animState !== 'idle' ? `pop-out 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.12}s both` : 'none',
                  }}>
                    <a
                      href={post.url || undefined}
                      target={post.url ? '_blank' : undefined}
                      rel={post.url ? 'noreferrer' : undefined}
                      title={post.url ? `${post.title} — open source` : post.title}
                      draggable={false}
                      style={{
                        width: 180, height: 180, borderRadius: 16,
                        border: '2px solid var(--border-color)',
                        ...getDeckCardStyle(postImg, post.id, 0, true),
                        transition: 'transform 0.3s',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        padding: 14, boxSizing: 'border-box', overflow: 'hidden',
                        textDecoration: 'none', cursor: post.url ? 'pointer' : 'default',
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05) translateY(-10px)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
                    >
                      <span style={{ color: '#ffffff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.75 }}>
                        {post.platform || post.source || 'Post'}
                      </span>
                      <span style={{
                        color: '#ffffff', fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginTop: 4,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {post.title}
                      </span>
                    </a>
                    <div style={{
                      color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, background: 'var(--card-bg)',
                      padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border-color)',
                      backdropFilter: 'blur(4px)', marginTop: 12
                    }}>{dateStr}</div>

                    {/* Vertical connecting line */}
                    <div style={{ width: 2, height: lineH, background: 'var(--border-color)', marginTop: 8 }} />

                    {/* Hollow intersection dot */}
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '2px solid var(--border-color)',
                      background: 'var(--card-bg)',
                      zIndex: 2, position: 'relative',
                      marginBottom: -8 // perfectly center on the bottom edge
                    }} />
                  </div>
                );
              })}

              {/* Horizontal Timeline Line */}
              <div style={{
                position: 'absolute',
                bottom: 63, left: 24, right: 24, height: 2,
                background: 'var(--border-color)',
                zIndex: 1,
                transformOrigin: 'left',
                animation: animState === 'leaving'
                  ? `line-shrink 1.8s linear 0.2s both`
                  : animState !== 'idle' ? `line-grow 1.8s linear 0.5s both` : 'none'
              }} />
            </div>
          </div>
        )}
      </InfiniteCanvas>
      </div>

      {/* ── Page header ────────────────────────────────────────── */}
      <div className="page-header" style={{ position: 'absolute', top: 28, left: 28, zIndex: 10, pointerEvents: 'none', alignItems: 'center', marginBottom: 0, gap: 16 }}>
        <div style={{ pointerEvents: 'auto' }}>
          <h1 className="page-title">Campaigns</h1>
        </div>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <button
              className="btn-secondary card-sm"
              id="viewToggleBtn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={nodes.length === 0}
              title={nodes.length === 0 ? 'No campaigns to arrange yet' : undefined}
              style={nodes.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span>View:</span>
              <span className="pill pill-accent">{currentView}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="view-dropdown show" id="viewDropdown">
                <div className="dropdown-item" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setCurrentView('Clusters'); setIsDropdownOpen(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setCurrentView('Clusters'); setIsDropdownOpen(false); } }}>Clusters</div>
                <div className="dropdown-item" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setCurrentView('Heatmap'); setIsDropdownOpen(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setCurrentView('Heatmap'); setIsDropdownOpen(false); } }}>Heatmap</div>
              </div>
            )}
          </div>
          <button
            className="btn-secondary card-sm"
            onClick={() => canvasRef.current?.resetView()}
            title="Reset View"
            style={{ padding: '8px 12px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Loading / failed / empty ───────────────────────────── */}
      {(isLoading || error || nodes.length === 0) && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
            }}>
              <Loader2 className="h-5 w-5 animate-spin" /> Fetching campaigns...
            </div>
          ) : error ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, maxWidth: 460,
              border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444', borderRadius: 12, padding: 16, fontSize: 14, fontWeight: 500,
              pointerEvents: 'auto',
            }}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Could not load campaigns: {error}</span>
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              border: '1px dashed var(--border-color)', background: 'var(--card-bg)',
              borderRadius: 16, padding: '48px 56px', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>No campaigns found</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                Campaigns appear here once the analyzers have clustered captured posts for this workspace.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Mascot + AI prompt — shared PromptField component ───── */}
      <PromptField
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        commandActive={commandActive}
        setCommandActive={setCommandActive}
        setSidebarCollapsed={setSidebarCollapsed}
        onThinkingChange={setIsThinking}
      />

      <div className={`v0-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
          <div className="v0-sidebar-header">
              <button className="v0-toggle-btn" onClick={() => setSidebarCollapsed(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="8" cy="12" r="2" fill="var(--text-primary)" />
                      <circle cx="16" cy="12" r="2" fill="var(--text-primary)" />
                  </svg>
              </button>
          </div>
          <div className="v0-sidebar-content">
              <div className="v0-action-bar">
                  <div className="v0-avatar"></div>
                  <span className="v0-action-text">analyze this</span>
                  <div className="v0-action-icons">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                  </div>
              </div>
              <div className="v0-context-section">
                  <div className="v0-section-title">provided:</div>
                  <ul className="v0-context-list">
                      <li>
                          <strong><span>{selectedNode?.title || 'Campaign'}</span>:</strong>
                          <span> {selectedNode
                            ? selectedNode.campaign.description
                              || `${selectedNode.clusterName} · ${selectedPosts.length} captured post${selectedPosts.length === 1 ? '' : 's'}`
                            : 'Select a campaign on the canvas.'}</span>
                      </li>
                  </ul>
              </div>
              <div className="v0-prompt-suggestion">
                  What would you like to refine or analyze further?
              </div>
          </div>
      </div>

    </div>
  );
}
