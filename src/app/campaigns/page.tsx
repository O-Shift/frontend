'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InfiniteCanvas, { InfiniteCanvasHandle } from '@/components/InfiniteCanvas';
import PromptField from '@/components/PromptField';

// ─── Campaign data (computed once at module level) ────────────────
const CLUSTERS = [
  { id: 'holiday', name: 'Holiday Seasons',      x: -580, y: -320, color: '#FF6700' },
  { id: 'tech',    name: 'Tech Product Launches', x:  580, y: -320, color: '#00A4EF' },
  { id: 'sports',  name: 'Sports & eSports',      x:    0, y:  420, color: '#34A853' },
];

const HEATMAP_CLUSTERS = [
  { id: 'high', name: 'High ROI', x: -580, y: -320, color: '#FF3300' },
  { id: 'avg', name: 'Average ROI', x: 580, y: -320, color: '#FF9900' },
  { id: 'low', name: 'Low ROI', x: 0, y: 420, color: '#555555' },
];

const IMGS = [
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80',
  'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=300&q=80',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&q=80',
];

const clusterCounts: Record<string, number> = {};
const heatmapCounts: Record<string, number> = {};
const CAMPAIGNS = Array.from({ length: 27 }, (_, i) => {
  const cluster = CLUSTERS[i % CLUSTERS.length];
  if (clusterCounts[cluster.id] === undefined) clusterCounts[cluster.id] = 0;
  const idx    = clusterCounts[cluster.id]++;
  const radius = 235 * Math.sqrt(idx + 0.5);
  const theta  = idx * 137.508 * (Math.PI / 180);
  
  const roiValue = 1 + ((i * 17) % 5);
  let hCluster = HEATMAP_CLUSTERS[2];
  if (roiValue >= 4) hCluster = HEATMAP_CLUSTERS[0];
  else if (roiValue >= 2) hCluster = HEATMAP_CLUSTERS[1];
  
  if (heatmapCounts[hCluster.id] === undefined) heatmapCounts[hCluster.id] = 0;
  const hIdx = heatmapCounts[hCluster.id]++;
  const hRadius = 235 * Math.sqrt(hIdx + 0.5);
  const hTheta = hIdx * 137.508 * (Math.PI / 180);

  const pick   = () => IMGS[Math.floor(Math.random() * IMGS.length)];
  return {
    id: i,
    cluster,
    x: cluster.x + Math.cos(theta) * radius,
    y: cluster.y + Math.sin(theta) * radius,
    heatmapCluster: hCluster,
    heatmapX: hCluster.x + Math.cos(hTheta) * hRadius,
    heatmapY: hCluster.y + Math.sin(hTheta) * hRadius,
    title: `${cluster.name.split(' ')[0]} Camp. ${i}`,
    imgs: Array.from({ length: 15 }, () => pick()),
    roi: roiValue,
  };
});

// ─── Page ─────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'Clusters' | 'Heatmap'>('Clusters');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [commandActive, setCommandActive] = useState(false);
  const canvasRef = useRef<InfiniteCanvasHandle>(null);

  const [folderRect, setFolderRect] = useState<{x: number, y: number} | null>(null);
  const [animState, setAnimState] = useState<'idle' | 'entering' | 'entered' | 'leaving'>('idle');
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('is-thinking-active', isThinking);
    return () => document.body.classList.remove('is-thinking-active');
  }, [isThinking]);

  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<number | null>(null);
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
    <div className="skeleton-target" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
        {(currentView === 'Heatmap' ? HEATMAP_CLUSTERS : CLUSTERS).map((c) => (
          <div
            key={`blob-${c.id}`}
            style={{
              position: 'absolute',
              left: c.x, top: c.y,
              width: 1400, height: 1400,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${c.color}22, transparent 60%)`,
              filter: 'blur(60px)',
              opacity: hoveredCluster === c.id ? 1 : 0,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ))}

        {/* SVG: Voronoi territory fills + seams + connection lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 0 }}>
          {/* Voronoi region fills */}
          {(currentView === 'Heatmap' ? HEATMAP_CLUSTERS : CLUSTERS).map((c, i) => {
            const polygon = i === 0 ? '-1500,-1000 0,-1000 0,-177 -1500,998'
                         : i === 1 ? '0,-1000 1500,-1000 1500,998 0,-177'
                         : '-1500,998 0,-177 1500,998 1500,1000 -1500,1000';
            return (
              <polygon
                key={`vor-${c.id}`}
                points={polygon}
                fill={c.color}
                fillOpacity={hoveredCluster === c.id ? 0.06 : 0}
                stroke={hoveredCluster === c.id ? c.color : 'none'}
                strokeOpacity={0.4}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                style={{ transition: 'fill-opacity 0.4s ease' }}
              />
            );
          })}
          {/* Voronoi seams (bisector lines) */}
          {hoveredCluster && (
            <>
              <line x1="0" y1="-1000" x2="0" y2="-177" stroke="#a1a1aa" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="-177" x2="-1500" y2="998" stroke="#a1a1aa" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="-177" x2="1500" y2="998" stroke="#a1a1aa" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 4" />
            </>
          )}
          {/* Dashed connection lines */}
          {CAMPAIGNS.map((camp) => (
            <line
              key={`l${camp.id}`}
              x1={camp.x}         y1={camp.y}
              x2={camp.cluster.x} y2={camp.cluster.y}
              stroke="#3f3f46"
              strokeOpacity="0.25"
              strokeWidth="1.5"
              strokeDasharray="8 8"
            />
          ))}
        </svg>

        {/* Cluster ghost labels */}
        {(currentView === 'Heatmap' ? HEATMAP_CLUSTERS : CLUSTERS).map((c) => (
          <div
            key={c.id}
            className="ghost-label"
            onMouseEnter={() => setHoveredCluster(c.id)}
            onMouseLeave={() => setHoveredCluster(null)}
            style={{
              position: 'absolute',
              left: c.x, top: c.y,
              transform: 'translate(-50%, -50%)',
              fontSize: 44, fontWeight: 800,
              color: hoveredCluster === c.id ? `${c.color}66` : 'rgba(255,255,255,0.04)',
              textTransform: 'uppercase', letterSpacing: 10,
              whiteSpace: 'nowrap', cursor: 'crosshair',
              transition: 'color 0.3s ease',
              userSelect: 'none',
              zIndex: 5,
            }}
          >
            {c.name}
          </div>
        ))}

        {/* Campaign folder cards */}
        {CAMPAIGNS.map((camp) => {
          const isSelected = selectedNode?.id === camp.id;
          const isBlurred = selectedNode && !isSelected;
          const activeClusterId = currentView === 'Heatmap' ? camp.heatmapCluster.id : camp.cluster.id;
          const activeColor = currentView === 'Heatmap' ? camp.heatmapCluster.color : camp.cluster.color;
          const isHovered = hoveredFolderId === camp.id || activeClusterId === hoveredCluster;
          const targetX = currentView === 'Heatmap' ? camp.heatmapX : camp.x;
          const targetY = currentView === 'Heatmap' ? camp.heatmapY : camp.y;
          
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
                <div className="deck-wrapper skeleton-target" title={camp.title} style={{ ['--cord-color' as any]: activeColor }}>
                  <div className={`cards ${isSelected ? 'cards-hidden' : ''}`}>
                    <div className="card card-left" style={{ backgroundImage: `url('${camp.imgs[0]}')` }}>
                      <div className="floating-bubble" style={{ bottom: 45, left: -20 }}>
                        <span style={{ color: '#0095ff', fontSize: 16 }}>✨</span> {(camp.roi * 12).toFixed(0)}
                      </div>
                    </div>
                    
                    <div className="card card-right" style={{ backgroundImage: `url('${camp.imgs[1]}')` }}>
                      <div className="floating-bubble" style={{ top: 45, right: -25, width: 45, height: 45, borderRadius: '50%', justifyContent: 'center' }}>
                        Wen
                      </div>
                    </div>

                    <div className="card deck-front" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('${camp.imgs[2]}')` }}>
                      <div className="logo">{camp.title}</div>
                    </div>
                  </div>
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
              left: selectedNode.x,
              top: selectedNode.y + 160,
              transform: 'translateX(-50%)',
              opacity: animState !== 'idle' ? 1 : 0,
              zIndex: 10,
              pointerEvents: animState === 'entered' ? 'auto' : 'none',
              userSelect: 'none',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', gap: 24, padding: '24px 24px 64px 24px', alignItems: 'flex-end' }}>
              {selectedNode.imgs.map((img: string, i: number) => {
                const date = new Date();
                date.setDate(date.getDate() - (selectedNode.imgs.length - i) * 14);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                // Deterministic pseudo-random height for the vertical lines
                const lineH = 20 + ((i * 47) % 60);

                const startX = 1428 - i * 204;
                const startY = -300;
                const jx = (i % 3 === 0) ? -60 : (i % 3 === 1) ? 60 : 0;
                const rot = (i % 5 - 2) * 15;

                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    minWidth: 180,
                    ['--sx' as any]: `${startX}px`,
                    ['--sy' as any]: `${startY}px`,
                    ['--jx' as any]: `${jx}px`,
                    ['--rot' as any]: `${rot}deg`,
                    animation: animState === 'leaving'
                      ? `pop-in 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${(selectedNode.imgs.length - 1 - i) * 0.08}s both`
                      : animState !== 'idle' ? `pop-out 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.12}s both` : 'none',
                  }}>
                    <img 
                      src={img} 
                      alt="" 
                      draggable={false}
                      style={{ 
                        width: 180, height: 180, objectFit: 'cover', borderRadius: 16, 
                      border: '2px solid rgba(255,255,255,0.15)',
                      transition: 'transform 0.3s'
                      }} 
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05) translateY(-10px)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
                    />
                    <div style={{
                      color: 'white', fontSize: 14, fontWeight: 600, background: 'rgba(0,0,0,0.6)',
                      padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(4px)', marginTop: 12
                    }}>{dateStr}</div>
                    
                    {/* Vertical connecting line */}
                    <div style={{ width: 2, height: lineH, background: '#3f3f46', marginTop: 8 }} />
                    
                    {/* Hollow intersection dot */}
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', 
                      border: '2px solid #3f3f46',
                      background: 'var(--bg, #0a0a0a)',
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
                background: '#3f3f46',
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
      <div className="main-header" style={{ pointerEvents: 'none', zIndex: 10 }}>
        <h1>Campaigns</h1>
        <div className="view-toggle" id="viewToggleBtn" style={{ pointerEvents: 'auto', position: 'relative' }} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>View: <span>{currentView}</span></span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                <polyline points="6 9 12 15 18 9" />
            </svg>
            {isDropdownOpen && (
              <div className="view-dropdown show" id="viewDropdown">
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setCurrentView('Clusters'); setIsDropdownOpen(false); }}>Clusters</div>
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setCurrentView('Heatmap'); setIsDropdownOpen(false); }}>Heatmap</div>
              </div>
            )}
        </div>
        <div className="icon-btn" style={{ pointerEvents: 'auto' }} onClick={() => canvasRef.current?.resetView()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
          </svg>
        </div>
      </div>

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
                      <circle cx="8" cy="12" r="2" fill="black" />
                      <circle cx="16" cy="12" r="2" fill="black" />
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
                          <span> This campaign features high engagement metrics and a strong presence in the chosen cluster.</span>
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
