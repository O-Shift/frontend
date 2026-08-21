'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  type Simulation,
} from 'd3-force';
import {
  Building2,
  Users,
  Network,
  Sparkles,
  ArrowRight,
  ExternalLink,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Layers,
  ShieldCheck,
  Info,
} from 'lucide-react';
import PromptField from '@/components/PromptField';
import { apiFetch } from '@/lib/api';
import Skeleton from '@/components/Skeleton';
import type { LucideIcon } from 'lucide-react';
import type {
  Canvas2D,
  EntityCategory,
  GraphLink,
  GraphNode,
} from '@/components/partnerships/types';
import { usePartnershipsCanvas } from '@/hooks/use-partnerships-canvas';
import PartnershipDrawer from '@/components/partnerships/PartnershipDrawer';
import { extractDomain, usePartnershipsGraph } from '@/hooks/use-partnerships-graph';

// ┌€┌€ Component ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

export default function PartnershipsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const [zoom, setZoom] = useState(100);
  const [currentView, setCurrentView] = useState<'Graph' | 'Timeline'>('Graph');
  const [activeCategory, setActiveCategory] = useState<EntityCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [commandActive, setCommandActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const [entityBrief, setEntityBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  const { loading, dbGraphData, dbCompetitors, entities, timelineEvents } = usePartnershipsGraph(activeCategory, searchQuery);

  // Live transform and target for smooth lerp camera
  const transform = useRef({ x: 0, y: 0, k: 1 });
  const targetTransform = useRef({ x: 0, y: 0, k: 1 });
  const activeSimulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const fitToBoundsRef = useRef<((animate?: boolean) => void) | null>(null);

  // ┌€┌€ Data Fetching ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

  // Dynamic Company Brief Fetching
  useEffect(() => {
    if (!selectedNode) {
      setEntityBrief(null);
      setBriefLoading(false);
      return;
    }

    if (selectedNode.metadata?.description) {
      setEntityBrief(selectedNode.metadata.description);
      return;
    }
    if (selectedNode.metadata?.summary) {
      setEntityBrief(selectedNode.metadata.summary);
      return;
    }

    const match = dbCompetitors.find(
      c => c.id === selectedNode.id ||
           c.name.toLowerCase() === selectedNode.label.toLowerCase() ||
           (selectedNode.domain && extractDomain(c.website) === selectedNode.domain)
    );
    if (match?.description) {
      setEntityBrief(match.description);
      return;
    }

    const targetKey = selectedNode.domain || selectedNode.id;
    if (targetKey) {
      setBriefLoading(true);
      apiFetch<{ description?: string; summary?: string }>(`/competitors/${encodeURIComponent(targetKey)}`)
        .then(res => {
          if (res.ok && res.data?.description) {
            setEntityBrief(res.data.description);
          } else if (res.ok && res.data?.summary) {
            setEntityBrief(res.data.summary);
          } else {
            setEntityBrief(`${selectedNode.label} is an active ${selectedNode.type} entity with ${selectedNode.partnerCount} connected alliances across the monitored market intelligence network.`);
          }
        })
        .catch(() => {
          setEntityBrief(`${selectedNode.label} is an active ${selectedNode.type} entity with ${selectedNode.partnerCount} connected alliances across the monitored market intelligence network.`);
        })
        .finally(() => {
          setBriefLoading(false);
        });
    } else {
      setEntityBrief(`${selectedNode.label} is an active ${selectedNode.type} entity with ${selectedNode.partnerCount} connected alliances across the monitored market intelligence network.`);
    }
  }, [selectedNode, dbCompetitors]);

  useEffect(() => {
    document.body.classList.toggle('is-thinking-active', isThinking);
    return () => document.body.classList.remove('is-thinking-active');
  }, [isThinking]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCommandActive(false);
        setSidebarOpen(false);
        setSelectedNode(null);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  // ┌€┌€ Graph Rendering & Force Simulation ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

  usePartnershipsCanvas({
    loading,
    dbGraphData,
    dbCompetitors,
    entities,
    timelineEvents,
    currentView,
    selectedNode,
    setSelectedNode,
    setCommandActive,
    setSidebarOpen,
    setZoom,
    router,
    containerRef,
    canvasRef,
    transform,
    targetTransform,
    activeSimulationRef,
    fitToBoundsRef,
  });

  // ┌€┌€ Camera Zoom Controls ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

  const handleZoom = (direction: 'in' | 'out') => {
    if (!containerRef.current) return;
    const factor = direction === 'in' ? 1.35 : 1 / 1.35;
    const newK = Math.min(Math.max(targetTransform.current.k * factor, 0.12), 4.5);
    const ratio = newK / targetTransform.current.k;
    const cx = containerRef.current.clientWidth / 2;
    const cy = containerRef.current.clientHeight / 2;

    targetTransform.current = {
      x: cx - (cx - targetTransform.current.x) * ratio,
      y: cy - (cy - targetTransform.current.y) * ratio,
      k: newK,
    };
  };

  const handleResetView = () => {
    if (fitToBoundsRef.current) {
      fitToBoundsRef.current(true);
    }
  };

  // ┌€┌€ Category Filters ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

  const categories: Array<{ key: EntityCategory; label: string; icon: LucideIcon }> = [
    { key: 'all', label: 'All Alliances', icon: Network },
    { key: 'company', label: 'Competitors & Hubs', icon: Building2 },
    { key: 'integration', label: 'Tech Integrations', icon: Layers },
    { key: 'influencer', label: 'Content Creators', icon: Users },
    { key: 'agency', label: 'Agencies', icon: ShieldCheck },
  ];

  return (
    <div
      className="page-canvas skeleton-target"
      id="graphContainer"
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {/* ┌€┌€ Canvas Layer ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€ */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <canvas
          id="obsidianCanvas"
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      {/* ┌€┌€ Loading Skeleton ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€ */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            background: 'var(--bg-main-transparent)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{ width: 'min(640px, 75%)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton variant="card" height={300} />
            <div style={{ display: 'flex', gap: 16 }}>
              <Skeleton variant="card" height={64} style={{ flex: 1 }} />
              <Skeleton variant="card" height={64} style={{ flex: 1 }} />
              <Skeleton variant="card" height={64} style={{ flex: 1 }} />
            </div>
          </div>
        </div>
      )}

      {/* ┌€┌€ Top-Centered Glassmorphic Floating Filter Dock ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€ */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 15,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: 'calc(100vw - 48px)',
        }}
      >
        <div
          className="glass-dock"
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 5px',
            borderRadius: '999px',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            overflowX: 'auto',
            scrollbarWidth: 'thin',
            overscrollBehaviorX: 'contain',
          }}
        >
          {/* Segmented Mode Switcher */}
          <div className="glass-segmented">
            <button
              className={`glass-segmented-item ${currentView === 'Graph' ? 'is-active' : ''}`}
              onClick={() => setCurrentView('Graph')}
              style={{
                padding: '4px 14px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              <Network
                size={13}
                style={{
                  color: currentView === 'Graph' ? 'var(--accent)' : 'inherit',
                  transition: 'color 0.2s ease',
                  flexShrink: 0,
                }}
              />
              <span>Graph View</span>
            </button>
            <button
              className={`glass-segmented-item ${currentView === 'Timeline' ? 'is-active' : ''}`}
              onClick={() => setCurrentView('Timeline')}
              style={{
                padding: '4px 14px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              <Calendar
                size={13}
                style={{
                  color: currentView === 'Timeline' ? 'var(--accent)' : 'inherit',
                  transition: 'color 0.2s ease',
                  flexShrink: 0,
                }}
              />
              <span>Timeline</span>
            </button>
          </div>

          <div style={{ width: 1, height: 14, background: 'rgba(255, 255, 255, 0.1)', margin: '0 2px', flexShrink: 0 }} />

          {/* Category Filter Pills */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`glass-pill ${isActive ? 'is-active' : ''}`}
                  style={{
                    padding: '4px 13px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                  }}
                  title={cat.label}
                >
                  <Icon
                    size={13}
                    style={{
                      color: isActive ? 'var(--accent)' : 'inherit',
                      transition: 'color 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ┌€┌€ Bottom Right Zoom & View HUD (Dynamically Slides to Avoid Drawer) ┌€ */}
      <div
        className="bottom-right-controls"
        style={{
          position: 'absolute',
          bottom: 24,
          right: (sidebarOpen && selectedNode) ? 388 : 24,
          zIndex: 20,
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'right 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="glass-dock"
          style={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '999px',
            padding: '3px 4px',
          }}
        >
          <button
            className="glass-pill"
            onClick={() => handleZoom('out')}
            title="Zoom Out"
            style={{
              padding: '5px 8px',
              borderRadius: '999px',
              border: 'none',
              background: 'transparent',
            }}
          >
            <ZoomOut size={14} />
          </button>
          <div style={{ width: 1, height: 14, background: 'rgba(255, 255, 255, 0.08)', margin: '0 2px' }} />
          <button
            className="glass-pill"
            onClick={() => handleZoom('in')}
            title="Zoom In"
            style={{
              padding: '5px 8px',
              borderRadius: '999px',
              border: 'none',
              background: 'transparent',
            }}
          >
            <ZoomIn size={14} />
          </button>
        </div>

        <button
          className="glass-dock glass-pill"
          onClick={handleResetView}
          title="Auto-Fit & Center Graph"
          style={{
            padding: '5px 14px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          <Maximize2 size={12} style={{ color: 'var(--accent)' }} />
          <span>{zoom}%</span>
        </button>
      </div>

      {/* ┌€┌€ PromptField Context Overlay ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€ */}
      <PromptField
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        commandActive={commandActive}
        setCommandActive={setCommandActive}
        setSidebarCollapsed={collapsed => setSidebarOpen(!collapsed)}
        onThinkingChange={setIsThinking}
      />

      {/* ┌€┌€ Partnership Intelligence Inspector Drawer (Below Top Dock) ┌€ */}
      {sidebarOpen && selectedNode && (
        <PartnershipDrawer
          selectedNode={selectedNode}
          entityBrief={entityBrief}
          briefLoading={briefLoading}
          onClose={() => { setSidebarOpen(false); setSelectedNode(null); }}
          onAskAi={() => { setCommandActive(true); }}
        />
      )}
    </div>
  );
}

