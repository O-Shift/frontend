'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceCenter,
  forceX,
  forceY,
  Simulation,
  SimulationNodeDatum,
  SimulationLinkDatum,
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
import { logoUrl } from '@/lib/logos';
import Skeleton from '@/components/Skeleton';

// ── Types ─────────────────────────────────────────────────────────────

interface DBGraphNode {
  id: string;
  name: string;
  entity_type: string;
  metadata?: {
    domain?: string;
    website?: string;
    url?: string;
    color?: string;
    type?: string;
    value?: number;
    description?: string;
    summary?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

interface DBGraphEdge {
  id: string;
  source: string;
  target: string;
  rel_type: string;
  source_name?: string;
  source_type?: string;
  target_name?: string;
  target_type?: string;
  weight?: number | null;
  metadata?: any;
}

interface PartnershipsResponse {
  workspace_id: string;
  nodes: DBGraphNode[];
  edges: DBGraphEdge[];
  node_count: number;
  edge_count: number;
}

interface Competitor {
  id: string;
  name: string;
  website: string;
  description?: string;
  created_at?: string;
}

export type EntityCategory = 'all' | 'company' | 'influencer' | 'integration' | 'agency';

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  cacheKey: string;
  name: string;
  label: string;
  domain: string;
  website?: string;
  type: 'company' | 'influencer' | 'integration' | 'agency';
  isHub: boolean;
  color: string;
  radius: number;
  baseRadius: number;
  value: number;
  degree: number;
  partnerCount: number;
  connectedNodeIds: Set<string>;
  connectedEdgeIds: Set<string>;
  connectedPartners: Array<{
    id: string;
    name: string;
    domain: string;
    type: string;
    relType: string;
    color: string;
  }>;
  created_at?: string;
  hasRealDate: boolean;
  timelineX: number;
  timelineY: number;
  orbitOffset: number;
  metadata?: any;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  source: GraphNode;
  target: GraphNode;
  rel_type: string;
  weight?: number | null;
  metadata?: any;
}

// ── Domain & Color Utilities ──────────────────────────────────────────

function extractDomain(input?: string | null): string {
  if (!input) return '';
  const str = input.trim();
  try {
    const urlStr = str.startsWith('http://') || str.startsWith('https://')
      ? str
      : `https://${str}`;
    const host = new URL(urlStr).hostname.replace(/^www\./, '');
    if (host.includes('.')) return host;
  } catch {
    // fallback
  }

  if (str.includes('.')) {
    return str.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  return '';
}

function getDynamicDomain(metadata?: any): string {
  if (metadata?.domain) return extractDomain(metadata.domain);
  if (metadata?.website) return extractDomain(metadata.website);
  if (metadata?.url) return extractDomain(metadata.url);
  return '';
}

function getDynamicBrandColor(str: string): string {
  if (!str) return 'hsl(215, 80%, 55%)';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 52%)`;
}

function formatRelType(type: string): string {
  if (!type || type.toLowerCase() === 'partner' || type.toLowerCase() === 'partners_with') {
    return 'Partners With';
  }
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ── Component ─────────────────────────────────────────────────────────

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

  const [dbGraphData, setDbGraphData] = useState<PartnershipsResponse | null>(null);
  const [dbCompetitors, setDbCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  // Live transform and target for smooth lerp camera
  const transform = useRef({ x: 0, y: 0, k: 1 });
  const targetTransform = useRef({ x: 0, y: 0, k: 1 });
  const activeSimulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const fitToBoundsRef = useRef<((animate?: boolean) => void) | null>(null);

  // ── Data Fetching ───────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [graphRes, compRes] = await Promise.all([
        apiFetch<PartnershipsResponse>('/graph/partnerships'),
        apiFetch<Competitor[]>('/competitors'),
      ]);

      if (graphRes.ok && graphRes.data) {
        setDbGraphData(graphRes.data);
      }
      if (compRes.ok && compRes.data) {
        setDbCompetitors(compRes.data);
      }
    } catch (err) {
      console.error('Failed to load partnership data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      apiFetch<any>(`/competitors/${encodeURIComponent(targetKey)}`)
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

  // ── Graph Rendering & Force Simulation ──────────────────────────────

  useEffect(() => {
    if (loading) return;
    if (!containerRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let dpr = window.devicePixelRatio || 1;

    const setupCanvasResolution = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    setupCanvasResolution();

    // ── Build Entities & Nodes ────────────────────────────────────────

    const rawEntities: Array<{
      id: string;
      name: string;
      domain: string;
      type: 'company' | 'influencer' | 'integration' | 'agency';
      color: string;
      isHub: boolean;
      created_at?: string;
      metadata?: any;
    }> = [];

    if (dbGraphData?.nodes) {
      for (const gn of dbGraphData.nodes) {
        const dom = getDynamicDomain(gn.metadata);
        let type: 'company' | 'influencer' | 'integration' | 'agency' = 'company';
        const eType = (gn.entity_type || '').toLowerCase();
        if (eType === 'content_creator' || eType === 'influencer' || eType === 'creator') {
          type = 'influencer';
        } else if (eType === 'agency') {
          type = 'agency';
        } else if (eType === 'integration' || eType === 'tech_partner' || eType === 'tool') {
          type = 'integration';
        }

        const isHub = eType === 'competitor' || eType === 'brand' || eType === 'agency' || (gn.metadata?.is_hub ?? false);
        const color = gn.metadata?.color || (
          type === 'influencer' ? '#a855f7' :
          type === 'integration' ? '#10b981' :
          type === 'agency' ? '#38bdf8' :
          getDynamicBrandColor(dom || gn.name)
        );

        rawEntities.push({
          id: gn.id,
          name: gn.name,
          domain: dom,
          type,
          color,
          isHub,
          created_at: gn.created_at || gn.updated_at,
          metadata: gn.metadata,
        });
      }
    }

    for (const comp of dbCompetitors) {
      const dom = extractDomain(comp.website);
      if (!rawEntities.some(e => e.id === comp.id || e.name.toLowerCase() === comp.name.toLowerCase())) {
        rawEntities.push({
          id: comp.id,
          name: comp.name,
          domain: dom,
          type: 'company',
          color: getDynamicBrandColor(dom || comp.name),
          isHub: true,
          created_at: comp.created_at,
          metadata: { website: comp.website, description: comp.description },
        });
      }
    }

    // Filter entities if a category filter or search query is active
    let filteredEntities = rawEntities;
    if (activeCategory !== 'all') {
      filteredEntities = filteredEntities.filter(e => {
        if (activeCategory === 'company') return e.type === 'company' || e.isHub;
        return e.type === activeCategory;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filteredEntities = filteredEntities.filter(
        e => e.name.toLowerCase().includes(q) || e.domain.toLowerCase().includes(q)
      );
    }

    // Timeline events mapping
    const timelineEvents: Array<{
      id: number;
      x: number;
      dateStr: string;
      monthStr: string;
      entityId: string;
    }> = [];

    const entitiesWithDates = filteredEntities
      .filter(e => e.created_at)
      .map(e => ({ ...e, dateObj: new Date(e.created_at!) }))
      .filter(e => !isNaN(e.dateObj.getTime()))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    entitiesWithDates.forEach((entity, idx) => {
      const d = entity.dateObj;
      timelineEvents.push({
        id: idx,
        x: idx * 180,
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        monthStr: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        entityId: entity.id,
      });
    });

    // Image Preloader / Monogram Cache
    const preloadedImages: Record<string, { loaded: boolean; canvas: HTMLCanvasElement | null; img: HTMLImageElement | null }> = {};

    const processImageCache = (
      key: string,
      domain: string,
      name: string,
      type: string,
      color: string
    ) => {
      if (preloadedImages[key]) return;

      const imgObj: { loaded: boolean; canvas: HTMLCanvasElement | null; img: HTMLImageElement | null } = {
        loaded: false,
        canvas: null,
        img: null,
      };
      preloadedImages[key] = imgObj;

      const renderMonogramCanvas = () => {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const xctx = c.getContext('2d');
        if (!xctx) return;

        xctx.beginPath();
        if (type === 'company') {
          if ((xctx as any).roundRect) (xctx as any).roundRect(4, 4, 120, 120, 24);
          else xctx.rect(4, 4, 120, 120);
        } else {
          xctx.arc(64, 64, 58, 0, Math.PI * 2);
        }
        xctx.fillStyle = color || '#27272a';
        xctx.fill();

        const initial = (name || domain || 'C').charAt(0).toUpperCase();
        xctx.fillStyle = '#ffffff';
        xctx.font = 'bold 54px Inter, system-ui, sans-serif';
        xctx.textAlign = 'center';
        xctx.textBaseline = 'middle';
        xctx.fillText(initial, 64, 66);

        imgObj.canvas = c;
        imgObj.loaded = true;
      };

      if (!domain) {
        renderMonogramCanvas();
        return;
      }

      const imgUrl = logoUrl(domain);
      const fallbackUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      if (!imgUrl) {
        renderMonogramCanvas();
        return;
      }

      const img = new Image();
      let triedFallback = false;

      const cacheImg = () => {
        if (img.naturalWidth <= 16 || img.naturalHeight <= 16) {
          renderMonogramCanvas();
          return;
        }

        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const xctx = c.getContext('2d');
        if (!xctx) {
          renderMonogramCanvas();
          return;
        }

        xctx.beginPath();
        if (type === 'company') {
          if ((xctx as any).roundRect) (xctx as any).roundRect(4, 4, 120, 120, 24);
          else xctx.rect(4, 4, 120, 120);
        } else {
          xctx.arc(64, 64, 58, 0, Math.PI * 2);
        }
        xctx.fillStyle = '#ffffff';
        xctx.fill();
        xctx.clip();

        try {
          xctx.drawImage(img, 6, 6, 116, 116);
          imgObj.canvas = c;
          imgObj.loaded = true;
        } catch {
          imgObj.img = img;
          imgObj.loaded = true;
        }
      };

      img.onload = cacheImg;
      img.onerror = () => {
        if (!triedFallback && fallbackUrl && img.src !== fallbackUrl) {
          triedFallback = true;
          img.src = fallbackUrl;
        } else {
          renderMonogramCanvas();
        }
      };
      img.src = imgUrl;
    };

    // Calculate node degrees and partners
    const entityIdByKey = new Map<string, string>();
    for (const e of filteredEntities) {
      if (e.id) entityIdByKey.set(String(e.id), e.id);
      if (e.name) entityIdByKey.set(String(e.name).toLowerCase(), e.id);
    }

    const degreeMap = new Map<string, number>();
    for (const edge of dbGraphData?.edges ?? []) {
      const srcId = entityIdByKey.get(edge.source) ?? entityIdByKey.get((edge.source_name || '').toLowerCase());
      const tgtId = entityIdByKey.get(edge.target) ?? entityIdByKey.get((edge.target_name || '').toLowerCase());
      if (srcId && tgtId && srcId !== tgtId) {
        degreeMap.set(srcId, (degreeMap.get(srcId) ?? 0) + 1);
        degreeMap.set(tgtId, (degreeMap.get(tgtId) ?? 0) + 1);
      }
    }

    // Build GraphNode array
    const nodes: GraphNode[] = [];
    const nodeMap = new Map<string, GraphNode>();

    for (let i = 0; i < filteredEntities.length; i++) {
      const entity = filteredEntities[i];
      const isHub = entity.isHub;
      const deg = degreeMap.get(entity.id) ?? 0;
      const cacheKey = entity.id || `${entity.name}_${i}`;

      processImageCache(cacheKey, entity.domain, entity.name, entity.type, entity.color);

      const evIdx = timelineEvents.findIndex(ev => ev.entityId === entity.id);
      const ev = evIdx !== -1 ? timelineEvents[evIdx] : null;

      // Seed positions with golden angle spiral for symmetrical initial layout
      const seedAngle = i * 2.399963229728653;
      const seedRadius = Math.sqrt(i + 0.5) * (isHub ? 45 : 30);

      // Node radius sized purposefully
      const baseRadius = isHub
        ? Math.min(22 + Math.sqrt(deg + 1) * 4.5, 36)
        : Math.min(13 + Math.sqrt(deg + 1) * 3, 22);

      const nodeObj: GraphNode = {
        id: entity.id || cacheKey,
        cacheKey,
        name: entity.name,
        label: entity.name,
        domain: entity.domain,
        website: entity.metadata?.website,
        type: entity.type,
        isHub,
        color: entity.color,
        radius: baseRadius,
        baseRadius,
        value: deg,
        degree: deg,
        partnerCount: deg,
        connectedNodeIds: new Set<string>(),
        connectedEdgeIds: new Set<string>(),
        connectedPartners: [],
        created_at: entity.created_at,
        hasRealDate: !!ev,
        timelineX: ev ? ev.x : 0,
        timelineY: (i % 2 === 0 ? -1 : 1) * (90 + (i % 3) * 45),
        orbitOffset: (i * Math.PI) / 4,
        metadata: entity.metadata,
        x: Math.cos(seedAngle) * seedRadius,
        y: Math.sin(seedAngle) * seedRadius,
        vx: 0,
        vy: 0,
      };

      nodes.push(nodeObj);
      nodeMap.set(entity.id, nodeObj);
      nodeMap.set(entity.name.toLowerCase(), nodeObj);
      if (entity.domain) nodeMap.set(entity.domain.toLowerCase(), nodeObj);
    }

    // Build GraphLink array
    const links: GraphLink[] = [];
    if (dbGraphData?.edges && dbGraphData.edges.length > 0) {
      for (const edge of dbGraphData.edges) {
        const src = nodeMap.get(edge.source) || nodeMap.get((edge.source_name || '').toLowerCase());
        const tgt = nodeMap.get(edge.target) || nodeMap.get((edge.target_name || '').toLowerCase());
        if (src && tgt && src !== tgt) {
          const edgeId = edge.id || `${src.id}-${tgt.id}`;
          const linkObj: GraphLink = {
            id: edgeId,
            source: src,
            target: tgt,
            rel_type: edge.rel_type || 'partner',
            weight: edge.weight,
            metadata: edge.metadata,
          };
          links.push(linkObj);

          // Update connectivity sets for instant Spotlight highlighting
          src.connectedNodeIds.add(tgt.id);
          tgt.connectedNodeIds.add(src.id);
          src.connectedEdgeIds.add(edgeId);
          tgt.connectedEdgeIds.add(edgeId);

          src.connectedPartners.push({
            id: tgt.id,
            name: tgt.name,
            domain: tgt.domain,
            type: tgt.type,
            relType: edge.rel_type,
            color: tgt.color,
          });
          tgt.connectedPartners.push({
            id: src.id,
            name: src.name,
            domain: src.domain,
            type: src.type,
            relType: edge.rel_type,
            color: src.color,
          });
        }
      }
    }

    // ── D3-Force Physics Engine ───────────────────────────────────────

    const simulation = forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(links)
          .id((d: any) => d.id)
          .distance((link: any) => {
            const src = link.source as GraphNode;
            const tgt = link.target as GraphNode;
            if (src.isHub && tgt.isHub) return 290;
            if (src.isHub || tgt.isHub) return 140;
            return 95;
          })
          .strength((link: any) => {
            const srcDegree = (link.source as GraphNode).degree || 1;
            const tgtDegree = (link.target as GraphNode).degree || 1;
            return Math.min(1.2 / Math.min(srcDegree, tgtDegree), 0.7);
          })
      )
      .force(
        'charge',
        forceManyBody<GraphNode>()
          .strength((d: any) => (d.isHub ? -1000 : -280))
          .distanceMin(25)
          .distanceMax(1100)
          .theta(0.85)
      )
      .force(
        'collide',
        forceCollide<GraphNode>()
          .radius((d: any) => d.radius + (d.isHub ? 38 : 26))
          .iterations(3)
          .strength(0.9)
      )
      .force('center', forceCenter(0, 10).strength(0.04))
      .force('x', forceX(0).strength(0.025))
      .force('y', forceY(10).strength(0.025))
      .alphaDecay(0.028);

    activeSimulationRef.current = simulation;

    // ── Camera Fit to Bounds ──────────────────────────────────────────

    const fitToBounds = (animate = false) => {
      if (nodes.length === 0) {
        targetTransform.current = { x: width / 2, y: height / 2 + 10, k: 1 };
        if (!animate) transform.current = { ...targetTransform.current };
        return;
      }

      if (currentView === 'Timeline') {
        targetTransform.current = { x: 180, y: height / 2 + 10, k: 0.65 };
        if (!animate) transform.current = { ...targetTransform.current };
        return;
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of nodes) {
        const r = n.radius + 35;
        if ((n.x ?? 0) - r < minX) minX = (n.x ?? 0) - r;
        if ((n.y ?? 0) - r < minY) minY = (n.y ?? 0) - r;
        if ((n.x ?? 0) + r > maxX) maxX = (n.x ?? 0) + r;
        if ((n.y ?? 0) + r > maxY) maxY = (n.y ?? 0) + r;
      }

      const PAD = 95;
      const contentW = Math.max(maxX - minX, 1);
      const contentH = Math.max(maxY - minY, 1);
      const k = Math.max(0.15, Math.min((width - PAD * 2) / contentW, (height - PAD * 2) / contentH, 1.4));
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      targetTransform.current = {
        x: width / 2 - cx * k,
        y: height / 2 + 12 - cy * k,
        k,
      };

      if (!animate) {
        transform.current = { ...targetTransform.current };
      }
    };
    fitToBoundsRef.current = fitToBounds;

    // ── Pre-warm Simulation for Instant Optimal Positioning ───────────

    if (currentView === 'Graph') {
      for (let i = 0; i < 180; ++i) {
        simulation.tick();
      }
      fitToBounds(false);
    } else {
      fitToBounds(false);
    }

    // ── Interaction State ─────────────────────────────────────────────

    let isPanning = false;
    let hoveredNode: GraphNode | null = null;
    let hoveredLink: GraphLink | null = null;
    let lastMouseX = 0, lastMouseY = 0;
    let animFrameId: number;
    let time = 0;
    let lastZoomPct = -1;

    // ── Render Draw Loop ──────────────────────────────────────────────

    const draw = (t: number) => {
      const tr = transform.current;
      const tt = targetTransform.current;
      const mode = currentView.toLowerCase();

      // Camera lerp
      tr.x += (tt.x - tr.x) * 0.16;
      tr.y += (tt.y - tr.y) * 0.16;
      tr.k += (tt.k - tr.k) * 0.16;

      const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
      const ink = isLightMode ? '24, 24, 27' : '255, 255, 255';
      const bgDotColor = isLightMode ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.035)';
      const textPrimary = isLightMode ? '#09090b' : '#ffffff';
      const textSecondary = isLightMode ? '#27272a' : '#e4e4e7';
      const textMuted = isLightMode ? '#71717a' : '#a1a1aa';

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // Background Subtle Dot Matrix Grid
      const gridSize = 36 * tr.k;
      const offsetX = ((tr.x % gridSize) + gridSize) % gridSize;
      const offsetY = ((tr.y % gridSize) + gridSize) % gridSize;
      ctx.fillStyle = bgDotColor;
      for (let x = offsetX; x < width; x += gridSize) {
        for (let y = offsetY; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(tr.x, tr.y);
      ctx.scale(tr.k, tr.k);

      const activeHighlightNode = hoveredNode || selectedNode;

      // ── Draw Links (Graph Mode) ─────────────────────────────────────
      if (mode === 'graph') {
        for (const link of links) {
          const src = link.source;
          const tgt = link.target;
          if (src.x === undefined || src.y === undefined || tgt.x === undefined || tgt.y === undefined) continue;

          const isConnectedToActive =
            activeHighlightNode &&
            (src.id === activeHighlightNode.id || tgt.id === activeHighlightNode.id);
          const isHovered = hoveredLink === link;

          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);

          if (isHovered || isConnectedToActive) {
            // Calm, elegant dual gradient without harsh neon glow
            const grad = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
            grad.addColorStop(0, src.color || 'rgba(255, 255, 255, 0.7)');
            grad.addColorStop(1, tgt.color || 'rgba(255, 255, 255, 0.7)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.6 / tr.k;
            ctx.stroke();

            // Subtle gentle pulse dot along active link
            const pulseT = (t * 0.6) % 1;
            const pulseX = src.x + (tgt.x - src.x) * pulseT;
            const pulseY = src.y + (tgt.y - src.y) * pulseT;
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 2.2 / tr.k, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          } else {
            const dimFactor = activeHighlightNode ? 0.05 : 0.18;
            ctx.strokeStyle = `rgba(${ink}, ${dimFactor})`;
            ctx.lineWidth = 1.1 / tr.k;
            ctx.stroke();
          }
        }

        // Draw Relationship Badges ('Partners With') on Hovered / Selected Links
        for (const link of links) {
          const src = link.source;
          const tgt = link.target;
          if (src.x === undefined || src.y === undefined || tgt.x === undefined || tgt.y === undefined) continue;

          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const linkLength = Math.sqrt(dx * dx + dy * dy);

          // Only show badge when link has sufficient length to avoid overlapping node labels
          if (linkLength < 80) continue;

          const isConnectedToActive =
            activeHighlightNode &&
            (src.id === activeHighlightNode.id || tgt.id === activeHighlightNode.id);
          const isHovered = hoveredLink === link;

          if (isHovered || (isConnectedToActive && tr.k >= 0.75)) {
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;
            const relText = formatRelType(link.rel_type);

            ctx.font = `500 ${10 / tr.k}px Inter, system-ui, sans-serif`;
            const textMetrics = ctx.measureText(relText);
            const pillW = textMetrics.width + 14 / tr.k;
            const pillH = 17 / tr.k;

            // Calm frosted capsule
            ctx.beginPath();
            if ((ctx as any).roundRect) {
              (ctx as any).roundRect(midX - pillW / 2, midY - pillH / 2, pillW, pillH, 8.5 / tr.k);
            } else {
              ctx.rect(midX - pillW / 2, midY - pillH / 2, pillW, pillH);
            }
            ctx.fillStyle = isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(18, 19, 25, 0.94)';
            ctx.fill();
            ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.16)';
            ctx.lineWidth = 1 / tr.k;
            ctx.stroke();

            ctx.fillStyle = isLightMode ? '#18181b' : '#f4f4f5';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(relText, midX, midY);
          }
        }
      }

      // ── Draw Timeline Mode ──────────────────────────────────────────
      if (mode === 'timeline') {
        const TIMELINE_BASE_Y = 0;
        if (timelineEvents.length > 0) {
          ctx.beginPath();
          const minX = -100;
          const maxX = (timelineEvents.length - 1) * 180 + 300;
          ctx.moveTo(minX, TIMELINE_BASE_Y);
          ctx.lineTo(maxX, TIMELINE_BASE_Y);
          ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1.5 / tr.k;
          ctx.stroke();

          for (const n of nodes) {
            if (n.hasRealDate && n.x !== undefined && n.y !== undefined) {
              ctx.beginPath();
              ctx.moveTo(n.x, TIMELINE_BASE_Y);
              ctx.lineTo(n.x, n.y);
              ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.12)';
              ctx.lineWidth = 1.2 / tr.k;
              ctx.stroke();
            }
          }

          ctx.fillStyle = textMuted;
          ctx.font = `600 ${13 / tr.k}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          for (const ev of timelineEvents) {
            ctx.beginPath();
            ctx.moveTo(ev.x, TIMELINE_BASE_Y - 7 / tr.k);
            ctx.lineTo(ev.x, TIMELINE_BASE_Y + 7 / tr.k);
            ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1.5 / tr.k;
            ctx.stroke();

            ctx.fillText(ev.dateStr, ev.x, TIMELINE_BASE_Y + 20 / tr.k);
          }
        } else {
          ctx.fillStyle = textMuted;
          ctx.font = `500 ${14.5 / tr.k}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('No chronological event dates recorded for these partnerships.', 0, 0);
        }
      }

      // Empty State
      if (nodes.length === 0) {
        ctx.fillStyle = textPrimary;
        ctx.font = `600 ${16 / tr.k}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No partnership graph records found in workspace.', 0, -12);
        ctx.font = `400 ${13 / tr.k}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = textMuted;
        ctx.fillText('Add competitors or run partnership discovery to generate graph nodes.', 0, 16);
      }

      // ── Draw Nodes ──────────────────────────────────────────────────
      for (const n of nodes) {
        if (n.x === undefined || n.y === undefined) continue;

        const isHovered = n === hoveredNode;
        const isSelected = n === selectedNode;
        const isNeighborOfActive =
          activeHighlightNode &&
          (n.id === activeHighlightNode.id || activeHighlightNode.connectedNodeIds.has(n.id));

        const opacity = activeHighlightNode ? (isNeighborOfActive ? 1.0 : 0.16) : 1.0;
        const scaledRadius = n.radius / Math.max(tr.k * 0.35, 0.85);

        // Screen culling
        const screenX = n.x * tr.k + tr.x;
        const screenY = n.y * tr.k + tr.y;
        const screenR = scaledRadius * tr.k;
        if (screenX + screenR + 250 < 0 || screenX - screenR - 250 > width || screenY + screenR + 150 < 0 || screenY - screenR - 150 > height) {
          continue;
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        // Clean subtle accent ring for Hubs in graph mode
        if (n.isHub && mode === 'graph' && opacity > 0.5) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(n.x, n.y, scaledRadius + 5 / tr.k, 0, Math.PI * 2);
          ctx.strokeStyle = (isHovered || isSelected) ? 'rgba(255, 255, 255, 0.55)' : `rgba(${ink}, 0.12)`;
          ctx.lineWidth = (isHovered || isSelected ? 1.8 : 1.0) / tr.k;
          ctx.stroke();
          ctx.restore();
        }

        const pImg = preloadedImages[n.cacheKey || n.domain];

        if (pImg && (pImg.canvas || pImg.img)) {
          const imgSource = pImg.canvas || pImg.img!;
          ctx.drawImage(imgSource, n.x - scaledRadius, n.y - scaledRadius, scaledRadius * 2, scaledRadius * 2);

          ctx.beginPath();
          if (n.type === 'company') {
            const size = scaledRadius * 2;
            if ((ctx as any).roundRect) (ctx as any).roundRect(n.x - scaledRadius, n.y - scaledRadius, size, size, scaledRadius * 0.32);
            else ctx.rect(n.x - scaledRadius, n.y - scaledRadius, size, size);
          } else {
            ctx.arc(n.x, n.y, scaledRadius, 0, Math.PI * 2);
          }
          ctx.strokeStyle = (isHovered || isSelected)
            ? (isLightMode ? '#09090b' : '#ffffff')
            : (n.isHub ? `rgba(${ink}, 0.45)` : `rgba(${ink}, 0.22)`);
          ctx.lineWidth = ((isHovered || isSelected) ? 2.2 : 1.1) / tr.k;
          ctx.stroke();
        } else {
          ctx.beginPath();
          if (n.type === 'company') {
            const size = scaledRadius * 2;
            if ((ctx as any).roundRect) (ctx as any).roundRect(n.x - scaledRadius, n.y - scaledRadius, size, size, scaledRadius * 0.32);
            else ctx.rect(n.x - scaledRadius, n.y - scaledRadius, size, size);
          } else {
            ctx.arc(n.x, n.y, scaledRadius, 0, Math.PI * 2);
          }
          ctx.fillStyle = n.color || '#27272a';
          ctx.fill();

          ctx.strokeStyle = (isHovered || isSelected)
            ? (isLightMode ? '#09090b' : '#ffffff')
            : (isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)');
          ctx.lineWidth = ((isHovered || isSelected) ? 2.2 : 1.0) / tr.k;
          ctx.stroke();
        }

        ctx.restore();
      }

      // ── Draw Node Labels (Second Pass with Dedicated High-Contrast Pill) ─
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (const n of nodes) {
        if (!n.label || n.x === undefined || n.y === undefined) continue;

        const isHovered = n === hoveredNode;
        const isSelected = n === selectedNode;
        const isNeighborOfActive =
          activeHighlightNode &&
          (n.id === activeHighlightNode.id || activeHighlightNode.connectedNodeIds.has(n.id));

        const opacity = activeHighlightNode ? (isNeighborOfActive ? 1.0 : 0.16) : 1.0;
        if (opacity < 0.3) continue;

        if (tr.k < 0.65 && !n.isHub && !isHovered && !isSelected) continue;

        const scaledRadius = n.radius / Math.max(tr.k * 0.35, 0.85);
        const fontPx = (n.isHub ? 12 : 11) / tr.k;
        ctx.font = `600 ${fontPx}px Inter, system-ui, sans-serif`;

        const maxLen = tr.k > 1.2 ? 26 : 18;
        const text = n.label.length > maxLen ? `${n.label.slice(0, maxLen - 1)}…` : n.label;
        const textMetrics = ctx.measureText(text);

        const hasSubtitle = (isHovered || isSelected || (tr.k >= 1.25 && n.isHub)) && n.partnerCount > 0;
        const subFontPx = 9.5 / tr.k;
        const subText = `${n.partnerCount} ${n.partnerCount === 1 ? 'Alliance' : 'Alliances'}`;

        let subWidth = 0;
        if (hasSubtitle) {
          ctx.font = `500 ${subFontPx}px Inter, system-ui, sans-serif`;
          subWidth = ctx.measureText(subText).width;
        }

        const maxContentW = Math.max(textMetrics.width, subWidth);
        const pillW = maxContentW + 14 / tr.k;
        const pillH = hasSubtitle ? (fontPx + subFontPx + 10 / tr.k) : (fontPx + 6 / tr.k);
        const pillY = n.y + scaledRadius + 6 / tr.k;

        ctx.save();
        ctx.globalAlpha = opacity;

        // Dedicated Frosted Label Pill for 100% Crisp Visibility
        ctx.beginPath();
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(n.x - pillW / 2, pillY, pillW, pillH, 6 / tr.k);
        } else {
          ctx.rect(n.x - pillW / 2, pillY, pillW, pillH);
        }
        ctx.fillStyle = isLightMode ? 'rgba(255, 255, 255, 0.92)' : 'rgba(14, 15, 20, 0.88)';
        ctx.fill();
        ctx.strokeStyle = (isHovered || isSelected)
          ? 'rgba(255, 255, 255, 0.35)'
          : (isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)');
        ctx.lineWidth = 1 / tr.k;
        ctx.stroke();

        // Primary Label Text
        ctx.font = `600 ${fontPx}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = (isHovered || isSelected || n.isHub) ? textPrimary : textSecondary;
        ctx.fillText(text, n.x, pillY + 3 / tr.k);

        // Subtitle Text (Calm silver/slate instead of bright neon orange)
        if (hasSubtitle) {
          ctx.font = `500 ${subFontPx}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = textMuted;
          ctx.fillText(subText, n.x, pillY + fontPx + 5 / tr.k);
        }

        ctx.restore();
      }

      ctx.restore();
      ctx.restore();
    };

    // ── Live Animation Loop ───────────────────────────────────────────

    const loop = () => {
      time = performance.now() * 0.001;

      // In timeline mode, ease nodes toward horizontal dates
      if (currentView === 'Timeline') {
        for (const n of nodes) {
          if (n.x !== undefined && n.y !== undefined) {
            n.x += (n.timelineX - n.x) * 0.08;
            n.y += (n.timelineY - n.y) * 0.08;
          }
        }
      }

      // Smooth radius pulse for hovered node
      for (const n of nodes) {
        const isHovered = n === hoveredNode;
        const isSelected = n === selectedNode;
        const targetR = (isHovered || isSelected) ? n.baseRadius * 1.15 : n.baseRadius;
        n.radius += (targetR - n.radius) * 0.22;
      }

      draw(time);

      const zoomPct = Math.round(transform.current.k * 100);
      if (zoomPct !== lastZoomPct) {
        lastZoomPct = zoomPct;
        setZoom(zoomPct);
      }

      animFrameId = requestAnimationFrame(loop);
    };
    loop();

    // ── Mouse & Pan Interaction (NO MANUAL NODE DRAGGING) ─────────────

    const getNodeAtPosition = (clientX: number, clientY: number): GraphNode | null => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (clientX - rect.left - transform.current.x) / transform.current.k;
      const mouseY = (clientY - rect.top - transform.current.y) / transform.current.k;

      let closest: GraphNode | null = null;
      let minDist = Infinity;

      for (const n of nodes) {
        if (n.x === undefined || n.y === undefined) continue;
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = (n.radius / Math.max(transform.current.k * 0.35, 0.85)) + 14 / transform.current.k;

        if (dist <= hitRadius && dist < minDist) {
          closest = n;
          minDist = dist;
        }
      }

      return closest;
    };

    let mouseDownPos = { x: 0, y: 0 };
    let hasMoved = false;

    const onMouseDown = (e: MouseEvent) => {
      if (
        (e.target as Element).closest('.command-wrapper') ||
        (e.target as Element).closest('.partnership-drawer') ||
        (e.target as Element).closest('.glass-dock') ||
        (e.target as Element).closest('.bottom-right-controls') ||
        (e.target as Element).closest('.chat-window')
      ) {
        return;
      }
      if (e.button !== 0) return; // Only primary left click

      mouseDownPos = { x: e.clientX, y: e.clientY };
      hasMoved = false;
      isPanning = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning) {
        const node = getNodeAtPosition(e.clientX, e.clientY);
        hoveredNode = node;
        canvas.style.cursor = node ? 'pointer' : 'grab';
        return;
      }

      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;

      if (Math.abs(e.clientX - mouseDownPos.x) > 4 || Math.abs(e.clientY - mouseDownPos.y) > 4) {
        hasMoved = true;
      }

      if (hasMoved) {
        canvas.style.cursor = 'grabbing';
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        targetTransform.current.x += dx;
        targetTransform.current.y += dy;
        transform.current.x = targetTransform.current.x;
        transform.current.y = targetTransform.current.y;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isPanning) {
        if (!hasMoved) {
          // Stationary click on canvas: hit test clicked position
          const clicked = getNodeAtPosition(e.clientX, e.clientY);
          if (clicked) {
            setSelectedNode(clicked);
            setSidebarOpen(true);
            setCommandActive(true);
          } else {
            // Clicked on empty space: clear selection & close drawer!
            setSelectedNode(null);
            setSidebarOpen(false);
            setCommandActive(false);
          }
        }
        isPanning = false;
      }
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      if (
        (e.target as Element).closest('.command-wrapper') ||
        (e.target as Element).closest('.partnership-drawer') ||
        (e.target as Element).closest('.chat-window')
      ) {
        return;
      }
      e.preventDefault();

      const zoomSpeed = 0.0018;
      const zoomFactor = Math.exp(-e.deltaY * zoomSpeed);
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newK = Math.min(Math.max(targetTransform.current.k * zoomFactor, 0.12), 4.5);
      const ratio = newK / targetTransform.current.k;

      targetTransform.current.x = mouseX - (mouseX - targetTransform.current.x) * ratio;
      targetTransform.current.y = mouseY - (mouseY - targetTransform.current.y) * ratio;
      targetTransform.current.k = newK;
    };

    const onDoubleClick = (e: MouseEvent) => {
      if (
        (e.target as Element).closest('.command-wrapper') ||
        (e.target as Element).closest('.partnership-drawer')
      ) {
        return;
      }

      const node = getNodeAtPosition(e.clientX, e.clientY);
      if (node && (node.type === 'company' || node.isHub)) {
        const dest = node.domain || node.label;
        if (dest) router.push(`/company/${dest}`);
      }
    };

    // Resize Observer for smooth container responsiveness
    const resizeObserver = new ResizeObserver(() => {
      setupCanvasResolution();
      fitToBounds(false);
    });
    resizeObserver.observe(container);

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animFrameId);
      simulation.stop();
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
    };
  }, [loading, dbGraphData, dbCompetitors, currentView, activeCategory, searchQuery, router]);

  // ── Camera Zoom Controls ────────────────────────────────────────────

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

  // ── Category Filters ────────────────────────────────────────────────

  const categories: Array<{ key: EntityCategory; label: string; icon: any }> = [
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
      {/* ── Canvas Layer ────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <canvas
          id="obsidianCanvas"
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      {/* ── Loading Skeleton ───────────────────────────────────── */}
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

      {/* ── Top-Centered Glassmorphic Floating Filter Dock ─────────── */}
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

      {/* ── Bottom Right Zoom & View HUD (Dynamically Slides to Avoid Drawer) ─ */}
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

      {/* ── PromptField Context Overlay ────────────────────────── */}
      <PromptField
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        commandActive={commandActive}
        setCommandActive={setCommandActive}
        setSidebarCollapsed={collapsed => setSidebarOpen(!collapsed)}
        onThinkingChange={setIsThinking}
      />

      {/* ── Partnership Intelligence Inspector Drawer (Below Top Dock) ─ */}
      {sidebarOpen && selectedNode && (
        <div
          className="glass-dock partnership-drawer"
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 76,
            right: 24,
            bottom: 24,
            width: 350,
            maxWidth: 'calc(100vw - 48px)',
            borderRadius: '20px',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideInRight 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Subtle top warm accent rim */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 20,
              right: 20,
              height: 1,
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
              opacity: 0.65,
            }}
          />

          {/* Drawer Header */}
          <div
            style={{
              padding: '16px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: selectedNode.type === 'company' ? '12px' : '50%',
                  background: selectedNode.color || 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  boxShadow: `0 0 20px ${selectedNode.color}33`,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  overflow: 'hidden',
                }}
              >
                {selectedNode.domain && logoUrl(selectedNode.domain) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl(selectedNode.domain) || undefined}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  selectedNode.label.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {selectedNode.label}
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    marginTop: 2,
                  }}
                >
                  {selectedNode.type}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setSidebarOpen(false); setSelectedNode(null); }}
              className="glass-pill"
              style={{
                padding: 6,
                borderRadius: '8px',
              }}
              title="Close Inspector"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div
                className="glass-pill"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  cursor: 'default',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Alliances
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', marginTop: 4 }}>
                  {selectedNode.partnerCount}
                </div>
              </div>
              <div
                className="glass-pill"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  cursor: 'default',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Ecosystem Role
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>
                  {selectedNode.isHub ? 'Primary Hub' : 'Partner Satellite'}
                </div>
              </div>
            </div>

            {/* Prominent Company Brief / Overview */}
            <div
              className="glass-pill"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderRadius: '14px',
                padding: '13px 15px',
                cursor: 'default',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Info size={13} style={{ color: 'var(--accent)' }} />
                <span>About {selectedNode.label}</span>
              </div>
              {briefLoading ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Loading company brief…
                </div>
              ) : (
                <p style={{ fontSize: '0.83rem', lineHeight: 1.55, color: 'var(--text-secondary)', margin: 0 }}>
                  {entityBrief || `${selectedNode.label} is an active ${selectedNode.type} with ${selectedNode.partnerCount} direct alliances in the competitive graph.`}
                </p>
              )}
            </div>

            {/* Connected Partners List */}
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Direct Alliances ({selectedNode.connectedPartners.length})</span>
                <Sparkles size={12} style={{ color: 'var(--accent)' }} />
              </div>

              {selectedNode.connectedPartners.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {selectedNode.connectedPartners.map((partner, pIdx) => (
                    <div
                      key={`${partner.id}-${pIdx}`}
                      className="glass-pill"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '12px',
                        padding: '9px 12px',
                        width: '100%',
                        cursor: 'default',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: partner.type === 'company' ? '8px' : '50%',
                            background: partner.color || 'rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            flexShrink: 0,
                          }}
                        >
                          {partner.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {partner.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                            {formatRelType(partner.relType)}
                          </div>
                        </div>
                      </div>

                      {partner.domain && (
                        <button
                          onClick={() => router.push(`/company/${partner.domain}`)}
                          className="glass-pill"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                          title={`View ${partner.name}`}
                        >
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '8px 0' }}>
                  No direct alliances recorded for this entity yet.
                </div>
              )}
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div
            style={{
              padding: '14px 18px',
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              gap: 10,
            }}
          >
            {selectedNode.domain && (
              <button
                onClick={() => router.push(`/company/${selectedNode.domain}`)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Company Profile</span>
                <ArrowRight size={14} />
              </button>
            )}
            <button
              onClick={() => {
                setCommandActive(true);
              }}
              className="glass-pill"
              style={{
                flex: selectedNode.domain ? undefined : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              <span>Ask AI</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
