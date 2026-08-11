'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PromptField from '@/components/PromptField';
import { apiFetch } from '@/lib/api';
import { logoUrl } from '@/lib/logos';
import Skeleton from '@/components/Skeleton';

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
  /**
   * graph.graph_relationships.weight — relationship strength. Nullable, and
   * nothing writes it today, so null is the common case rather than the rare
   * one. A real 0 is a meaningful strength and is not the same as null.
   */
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
    // ignore
  }

  if (str.includes('.')) {
    return str.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  return '';
}

/**
 * The domain a node's logo should be looked up by, or '' when the record has
 * no site. Deliberately does not fall back to the node's name: "2U, Inc."
 * parses as a domain because it contains a dot, and we would then ask the
 * favicon service for `2u, inc.`. A node with no site gets a monogram.
 */
function getDynamicDomain(metadata?: any): string {
  if (metadata?.domain) return extractDomain(metadata.domain);
  if (metadata?.website) return extractDomain(metadata.website);
  if (metadata?.url) return extractDomain(metadata.url);
  return '';
}

function getDynamicBrandColor(str: string): string {
  if (!str) return 'hsl(210, 70%, 50%)';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 75%, 50%)`;
}

export default function PartnershipsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  
  const [zoom, setZoom] = useState(100);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Graph');
  
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [commandActive, setCommandActive] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isThinking, setIsThinking] = useState(false);

  const [dbGraphData, setDbGraphData] = useState<PartnershipsResponse | null>(null);
  const [dbCompetitors, setDbCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
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
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  
  const transform = useRef({ x: 0, y: 0, k: 1 });
  const targetTransform = useRef({ x: 0, y: 0, k: 1 });
  
  useEffect(() => {
    if (loading) return;
    if (!containerRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Camera starts unset — it is fitted to the graph's bounding box once the
    // nodes exist, further down. The old hardcoded k=1 default with nodes
    // seeded across 1.2× the viewport is what left a small graph half off-
    // screen, looking "way too zoomed out" with links invisible.
    
    const nodes: any[] = [];
    const links: any[] = [];
    const preloadedImages: any = {};
    const nodeMap = new Map<string, any>();
    const timelineEvents: any[] = [];

    const processImageCache = (
      key: string,
      domain: string,
      name: string,
      type: string,
      color: string
    ) => {
      if (preloadedImages[key]) return;

      const imgObj = { loaded: false, canvas: null as HTMLCanvasElement | null, img: null as HTMLImageElement | null };
      preloadedImages[key] = imgObj;

      const renderMonogramCanvas = () => {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const xctx = c.getContext('2d');
        if (!xctx) return;

        xctx.beginPath();
        if (type === 'company') {
          if ((xctx as any).roundRect) (xctx as any).roundRect(2, 2, 124, 124, 24);
          else xctx.rect(2, 2, 124, 124);
        } else {
          xctx.arc(64, 64, 62, 0, Math.PI * 2);
        }
        xctx.fillStyle = color || '#27272a';
        xctx.fill();

        const initial = (name || domain || 'C').charAt(0).toUpperCase();
        xctx.fillStyle = '#ffffff';
        xctx.font = 'bold 56px Inter, sans-serif';
        xctx.textAlign = 'center';
        xctx.textBaseline = 'middle';
        xctx.fillText(initial, 64, 64);

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
          if ((xctx as any).roundRect) (xctx as any).roundRect(2, 2, 124, 124, 24);
          else xctx.rect(2, 2, 124, 124);
        } else {
          xctx.arc(64, 64, 62, 0, Math.PI * 2);
        }
        xctx.fillStyle = '#ffffff';
        xctx.fill();
        xctx.clip();

        try {
          xctx.drawImage(img, 2, 2, 124, 124);
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

    const rawEntities: any[] = [];

    if (dbGraphData?.nodes) {
      for (const gn of dbGraphData.nodes) {
        const dom = getDynamicDomain(gn.metadata);
        rawEntities.push({
          id: gn.id,
          name: gn.name,
          domain: dom,
          type: gn.entity_type === 'content_creator' ? 'influencer' : 'company',
          color: gn.metadata?.color || getDynamicBrandColor(dom || gn.name),
          isHub: gn.entity_type === 'competitor' || gn.entity_type === 'agency',
          created_at: gn.created_at || gn.updated_at
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
          created_at: comp.created_at
        });
      }
    }

    // STRICT DYNAMIC TIMELINE: Real DB Timestamps only
    const entitiesWithDates = rawEntities
      .filter(e => e.created_at)
      .map(e => ({ ...e, dateObj: new Date(e.created_at) }))
      .filter(e => !isNaN(e.dateObj.getTime()))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    if (entitiesWithDates.length > 0) {
      entitiesWithDates.forEach((entity, idx) => {
        const d = entity.dateObj;
        timelineEvents.push({
          id: idx,
          x: idx * 160,
          dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          monthStr: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          isFirstOfMonth: true,
          entityId: entity.id
        });
      });
    }

    // Node size carries one real measurement, never a random draw.
    //
    // The preferred metric is the summed weight of a node's incident edges,
    // normalised into the size band the graph already used. But nothing in the
    // backend writes graph_relationships.weight yet — app/agent/tools/
    // partnerships.py inserts (workspace_id, source_id, target_id, rel_type,
    // metadata) and no job backfills it — so on every real workspace today
    // that map comes back empty. The fallback is therefore degree: how many
    // partnerships the node actually has. That is present in the data right
    // now, and it is what node size gets read as anyway.
    //
    // The two are never mixed. A graph with any weighted edge is scaled purely
    // by weight, otherwise purely by degree; blending them would put two
    // different units on one axis and make the sizes mean nothing.
    //
    // Edges are matched to entities exactly the way the link pass below matches
    // them: by id first, then by lowercased name.
    const entityIdByKey = new Map<string, string>();
    for (const e of rawEntities) {
      if (e.id) entityIdByKey.set(String(e.id), e.id);
      if (e.name) entityIdByKey.set(String(e.name).toLowerCase(), e.id);
    }

    const summedWeight = new Map<string, number>();
    const degree = new Map<string, number>();
    for (const edge of dbGraphData?.edges ?? []) {
      const srcId = entityIdByKey.get(edge.source) ?? entityIdByKey.get((edge.source_name || '').toLowerCase());
      const tgtId = entityIdByKey.get(edge.target) ?? entityIdByKey.get((edge.target_name || '').toLowerCase());
      if (srcId && srcId === tgtId) continue; // self-loops are dropped from the links too
      const w = edge.weight;
      const weighted = typeof w === 'number' && Number.isFinite(w);
      for (const id of [srcId, tgtId]) {
        if (!id) continue;
        degree.set(id, (degree.get(id) ?? 0) + 1);
        if (weighted) summedWeight.set(id, (summedWeight.get(id) ?? 0) + (w as number));
      }
    }

    // Presence in the chosen map is the "has a real measurement" flag, so a
    // node totalling a genuine 0 stays distinct from one with nothing recorded.
    const sizeBy = summedWeight.size > 0 ? summedWeight : degree;
    let maxSize = 0;
    for (const total of sizeBy.values()) {
      if (total > maxSize) maxSize = total;
    }

    for (let i = 0; i < rawEntities.length; i++) {
      const entity = rawEntities[i];
      const isHub = entity.isHub;
      // A node with nothing recorded sits at the band floor rather than taking
      // a random size: an unconnected node genuinely is the smallest thing in
      // the graph, and a fixed floor stops it re-sizing on every render.
      const total = sizeBy.get(entity.id);
      const strength = total === undefined
        ? null
        : maxSize > 0
          ? Math.min(1, Math.max(0, total / maxSize))
          : 0;
      const value = strength === null
        ? (isHub ? 150 : 15)
        : (isHub ? 150 + strength * 2000 : 15 + strength * 50);
      const radius = isHub ? 12 + Math.sqrt(value) * 0.25 : 6 + Math.sqrt(value) * 0.4;
      const cacheKey = entity.id || `${entity.name}_${i}`;

      processImageCache(cacheKey, entity.domain, entity.name, entity.type, entity.color);

      const evIdx = timelineEvents.findIndex(ev => ev.entityId === entity.id);
      const ev = evIdx !== -1 ? timelineEvents[evIdx] : null;

      // Phyllotaxis seed rather than a random scatter across 1.2× the viewport.
      // Two things follow from it: the same graph lays out the same way on every
      // render instead of rearranging itself, and the nodes start close enough
      // together that the simulation settles in a few hundred cheap steps rather
      // than spending seconds on screen hauling them in from the edges.
      const seedAngle = i * 2.399963229728653; // golden angle, radians
      const seedRadius = Math.sqrt(i + 0.5) * 34;

      const nodeObj = {
        id: entity.id || cacheKey,
        cacheKey: cacheKey,
        x: Math.cos(seedAngle) * seedRadius,
        y: Math.sin(seedAngle) * seedRadius,
        vx: 0,
        vy: 0,
        isHub: isHub,
        value: value,
        domain: entity.domain,
        type: entity.type,
        radius: radius,
        baseRadius: radius,
        color: entity.color,
        label: entity.name,
        hasRealDate: !!ev,
        timelineX: ev ? ev.x : 0,
        timelineY: (i % 2 === 0 ? -1 : 1) * (80 + (i % 3) * 40),
        orbitOffset: Math.random() * Math.PI * 2
      };

      nodes.push(nodeObj);
      nodeMap.set(entity.id, nodeObj);
      nodeMap.set(entity.name.toLowerCase(), nodeObj);
      if (entity.domain) nodeMap.set(entity.domain.toLowerCase(), nodeObj);
    }

    if (dbGraphData?.edges && dbGraphData.edges.length > 0) {
      for (const edge of dbGraphData.edges) {
        const src = nodeMap.get(edge.source) || nodeMap.get((edge.source_name || '').toLowerCase());
        const tgt = nodeMap.get(edge.target) || nodeMap.get((edge.target_name || '').toLowerCase());
        if (src && tgt && src !== tgt) {
          links.push({ source: src, target: tgt, rel_type: edge.rel_type });
        }
      }
    }

    let isDragging = false;
    let hoveredNode: any = null;
    let localSelectedNode: any = null;
    let lastX = 0, lastY = 0;
    
    (window as any).setViewMode = (mode: string) => {
        setCurrentView(mode.charAt(0).toUpperCase() + mode.slice(1));
        setViewDropdownOpen(false);

        // That's all that needs to happen here. The effect re-runs on the
        // `currentView` change and rebuilds the graph from scratch — the init
        // block re-seeds nodes, re-heats the simulation, and re-fits the
        // camera to the view. Mutating `targetTransform` / velocities here used
        // to be how the camera and the settle were steered, but those objects
        // belong to the outgoing effect instance and are thrown away on the
        // re-run, so the branches below were dead code that set the old
        // hardcoded k=1 view.
    };
    
    let animFrameId: number;
    let time = 0;
    // Last zoom percentage we pushed to React, so the loop only calls setZoom
    // when the readout actually changes instead of firing a setState per frame.
    let lastZoomPct = -1;
    
    // Simulated annealing: `alpha` scales every inter-node force and decays
    // toward `alphaMin` each tick, so the layout converges and then stops. The
    // old loop ran the same forces at full strength forever, so the graph never
    // stopped drifting — that is the "too long, doesn't feel good" animation —
    // and it burned a requestAnimationFrame in perpetuity. Switching views
    // re-runs this whole effect, which resets alpha to 1; that is the only path
    // that restarts the simulation.
    let alpha = 1;
    const alphaDecay = 0.98;
    const alphaMin = 0.001;

    const applyPhysics = () => {
        const repulsion = 150;
        const springLen = 60;
        const springK = 0.005;
        const damping = 0.8;
        const mode = currentView.toLowerCase();

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const n1 = nodes[i];
                const n2 = nodes[j];
                const dx = n1.x - n2.x;
                const dy = n1.y - n2.y;
                let distSq = dx * dx + dy * dy;
                if (distSq === 0) distSq = 1;
                if (distSq < 50000) {
                    const dist = Math.sqrt(distSq);
                    const force = (repulsion / distSq) * alpha;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    n1.vx += fx;
                    n1.vy += fy;
                    n2.vx -= fx;
                    n2.vy -= fy;
                }
            }
        }

        for (const link of links) {
            const dx = link.target.x - link.source.x;
            const dy = link.target.y - link.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - springLen) * springK * alpha * (mode === 'timeline' ? 0.02 : 1);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            link.source.vx += fx;
            link.source.vy += fy;
            link.target.vx -= fx;
            link.target.vy -= fy;
        }

        for (const n of nodes) {
            if (mode === 'graph') {
                n.vx -= n.x * 0.001 * alpha;
                n.vy -= n.y * 0.001 * alpha;
            } else if (mode === 'timeline') {
                n.vx += (n.timelineX - n.x) * 0.08;
                n.vy += (n.timelineY - n.y) * 0.08;
            }

            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
        }

        // Timeline mode pins nodes to fixed coordinates rather than relaxing
        // into a layout, so it keeps running; only the graph simulation cools.
        if (mode === 'graph' && alpha > alphaMin) {
            alpha *= alphaDecay;
            if (alpha <= alphaMin) alpha = 0;
        }
    };

    // Fit the whole graph into the viewport with breathing room, dead-centre.
    // This is the "zoom just enough to fit everything on screen by default"
    // the tab was asked for; it also sets the floor the settle happens inside,
    // so the animation below reads as a short polish, not a long arrival.
    // `animate` leaves the live transform alone so the camera lerps to the fit
    // (what the reset button wants); the initial fit needs it applied outright,
    // before the first frame is painted.
    const fitToBounds = (animate = false) => {
        if (nodes.length === 0) {
            targetTransform.current = { x: width / 2, y: height / 2, k: 1 };
            if (!animate) transform.current = { ...targetTransform.current };
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of nodes) {
            if (n.x - n.radius < minX) minX = n.x - n.radius;
            if (n.y - n.radius < minY) minY = n.y - n.radius;
            if (n.x + n.radius > maxX) maxX = n.x + n.radius;
            if (n.y + n.radius > maxY) maxY = n.y + n.radius;
        }
        const PAD = 100; // screen pixels of margin on every side
        const contentW = Math.max(maxX - minX, 1);
        const contentH = Math.max(maxY - minY, 1);
        // 1.4 caps the zoom-in so a two-node graph doesn't blow up past
        // usability; small graphs get a modest enlargement, big ones shrink
        // just enough to fit. The 0.1 floor matches the wheel-zoom clamp.
        const k = Math.max(0.1, Math.min((width - PAD * 2) / contentW, (height - PAD * 2) / contentH, 1.4));
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        targetTransform.current = { x: width / 2 - cx * k, y: height / 2 - cy * k, k };
        if (!animate) transform.current = { ...targetTransform.current };
    };

    // The simulation runs a head start before the first paint — synchronous,
    // off-screen, cheap at these node counts — so the graph appears already
    // arranged and only finishes the last of its settling on screen. The old
    // code showed the raw scatter and let the physics drag it together live for
    // tens of seconds, which is the "weird, too long" animation the tab was
    // reported for. `0.98^90 ≈ 0.16`, so the head start keeps the layout ~84%
    // hot: the visible phase is a brief, gentle convergence rather than an
    // already-frozen picture.
    if (currentView.toLowerCase() === 'graph') {
        for (let s = 0; s < 90; s++) applyPhysics();
        fitToBounds();
    } else {
        // Timeline lays its axis out in world space; the camera parks at the
        // left edge. Reached via the effect re-running on a view change, this
        // mirrors what setViewMode below sets up.
        targetTransform.current = { x: 200, y: height / 2, k: 0.5 };
        transform.current = { ...targetTransform.current };
    }
    
    const draw = (t: number) => {
        const tr = transform.current;
        const tt = targetTransform.current;
        const mode = currentView.toLowerCase();

        // Read once per frame. Everything below picks its colour from this: the
        // canvas has no stylesheet, so a hardcoded white stroke is invisible on
        // the light theme's white background — which is what made the graph
        // look empty even with nodes and edges present.
        const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
        const ink = isLightMode ? '0, 0, 0' : '255, 255, 255';
        const haloColor = isLightMode ? 'rgba(255, 255, 255, 0.92)' : 'rgba(0, 0, 0, 0.78)';
        const labelColor = isLightMode ? '#27272a' : '#e4e4e7';
        const labelMutedColor = isLightMode ? '#71717a' : '#a1a1aa';
        
        tr.x += (tt.x - tr.x) * 0.15;
        tr.y += (tt.y - tr.y) * 0.15;
        tr.k += (tt.k - tr.k) * 0.15;
        
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(tr.x, tr.y);
        ctx.scale(tr.k, tr.k);

        // Draw Links in Graph Mode
        if (mode === 'graph') {
          ctx.lineWidth = 0.5 / tr.k;
          for (const link of links) {
              ctx.beginPath();
              ctx.moveTo(link.source.x, link.source.y);
              ctx.lineTo(link.target.x, link.target.y);

              if (link.source === hoveredNode || link.target === hoveredNode || link.source === localSelectedNode || link.target === localSelectedNode) {
                  const gradient = ctx.createLinearGradient(link.source.x, link.source.y, link.target.x, link.target.y);
                  gradient.addColorStop(0, link.source.color || 'rgba(142, 142, 147, 0.8)');
                  gradient.addColorStop(1, link.target.color || 'rgba(142, 142, 147, 0.8)');
                  ctx.strokeStyle = gradient;
                  ctx.lineWidth = 2.0 / tr.k;
              } else if (link.source.isHub && link.target.isHub) {
                  ctx.strokeStyle = `rgba(${ink}, 0.45)`;
                  ctx.lineWidth = 1.5 / tr.k;
              } else {
                  ctx.strokeStyle = 'rgba(142, 142, 147, 0.4)';
                  ctx.lineWidth = 1.0 / tr.k;
              }
              ctx.stroke();
          }
        }
        
        // Draw Timeline Mode
        if (mode === 'timeline') {
            const TIMELINE_BASE_Y = 0;

            if (timelineEvents.length > 0) {
              // Baseline axis line
              ctx.beginPath();
              const minX = -100;
              const maxX = (timelineEvents.length - 1) * 160 + 300;
              ctx.moveTo(minX, TIMELINE_BASE_Y);
              ctx.lineTo(maxX, TIMELINE_BASE_Y);
              ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.35)';
              ctx.lineWidth = 2.5 / tr.k;
              ctx.stroke();

              // Connectors to nodes with real dates
              for (const n of nodes) {
                if (n.hasRealDate) {
                  ctx.beginPath();
                  ctx.moveTo(n.x, TIMELINE_BASE_Y);
                  ctx.lineTo(n.x, n.y);
                  ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)';
                  ctx.lineWidth = 1.5 / tr.k;
                  ctx.stroke();
                }
              }

              // Timeline date labels & tick marks
              ctx.fillStyle = isLightMode ? '#52525b' : '#a1a1aa';
              ctx.font = `600 ${14 / tr.k}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              
              for (const ev of timelineEvents) {
                  ctx.beginPath();
                  ctx.moveTo(ev.x, TIMELINE_BASE_Y - 8 / tr.k);
                  ctx.lineTo(ev.x, TIMELINE_BASE_Y + 8 / tr.k);
                  ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)';
                  ctx.lineWidth = 2 / tr.k;
                  ctx.stroke();

                  ctx.fillText(ev.dateStr, ev.x, TIMELINE_BASE_Y + 24 / tr.k);
              }
            } else {
              ctx.fillStyle = isLightMode ? '#71717a' : '#a1a1aa';
              ctx.font = `500 ${16 / tr.k}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('No timeline event timestamps available in database for these graph records.', 0, 0);
            }
        }

        // Render Empty State if 0 DB records
        if (nodes.length === 0) {
          ctx.fillStyle = isLightMode ? '#52525b' : '#a1a1aa';
          ctx.font = `600 ${18 / tr.k}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('No partnership graph records found in workspace.', 0, -10);
          ctx.font = `400 ${14 / tr.k}px Inter, sans-serif`;
          ctx.fillStyle = isLightMode ? '#a1a1aa' : '#71717a';
          ctx.fillText('Add competitors or run partnership discovery to generate graph nodes.', 0, 20);
        }

        // Draw Nodes
        for (const n of nodes) {
            const scaledRadius = n.radius / Math.max(tr.k * 0.5, 0.8);
            const isActive = n === localSelectedNode || n === hoveredNode;

            if (n.isHub && mode === 'graph') {
                ctx.save();
                ctx.translate(n.x, n.y);
                ctx.rotate(t * 0.5 + n.orbitOffset);
                ctx.beginPath();
                ctx.arc(0, 0, scaledRadius + 8 / tr.k, 0, Math.PI * 1.5);
                ctx.strokeStyle = isActive ? n.color : 'rgba(142, 142, 147, 0.4)';
                ctx.lineWidth = 1.5 / tr.k;
                ctx.setLineDash([4 / tr.k, 4 / tr.k]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.rotate(-t * 0.8);
                ctx.beginPath();
                ctx.arc(0, 0, scaledRadius + 14 / tr.k, Math.PI * 0.5, Math.PI * 2);
                ctx.strokeStyle = isActive ? `rgba(${ink}, 0.5)` : 'rgba(142, 142, 147, 0.2)';
                ctx.lineWidth = 1 / tr.k;
                ctx.stroke();
                ctx.restore();
            }

            const screenX = n.x * tr.k + tr.x;
            const screenY = n.y * tr.k + tr.y;
            const screenR = scaledRadius * tr.k;
            if (screenX + screenR + 250 < 0 || screenX - screenR - 250 > width || screenY + screenR + 150 < 0 || screenY - screenR - 150 > height) {
                continue; 
            }

            const pImg = preloadedImages[n.cacheKey || n.domain];

            if (pImg && (pImg.canvas || pImg.img)) {
                const imgSource = pImg.canvas || pImg.img;
                if (isActive) {
                    ctx.save();
                    // The node's own brand colour, not white — a white glow is
                    // invisible against the light theme's background.
                    ctx.shadowColor = n.color || `rgba(${ink}, 0.6)`;
                    ctx.shadowBlur = 20 * tr.k;
                    ctx.drawImage(imgSource, n.x - scaledRadius, n.y - scaledRadius, scaledRadius * 2, scaledRadius * 2);
                    ctx.restore();
                } else {
                    ctx.drawImage(imgSource, n.x - scaledRadius, n.y - scaledRadius, scaledRadius * 2, scaledRadius * 2);
                }
                
                ctx.beginPath();
                if (n.type === 'company') {
                    const size = scaledRadius * 2;
                    if((ctx as any).roundRect) (ctx as any).roundRect(n.x - scaledRadius, n.y - scaledRadius, size, size, scaledRadius * 0.35);
                    else ctx.rect(n.x - scaledRadius, n.y - scaledRadius, size, size);
                } else {
                    ctx.arc(n.x, n.y, scaledRadius, 0, Math.PI * 2);
                }
                ctx.strokeStyle = isActive
                    ? (isLightMode ? '#18181b' : '#ffffff')
                    : (n.isHub ? n.color : 'rgba(142, 142, 147, 0.4)');
                ctx.lineWidth = (isActive ? 2.5 : 1.0) / tr.k;
                ctx.stroke();
            } else {
                ctx.beginPath();
                if (n.type === 'company') {
                    const size = scaledRadius * 2;
                    if((ctx as any).roundRect) (ctx as any).roundRect(n.x - scaledRadius, n.y - scaledRadius, size, size, scaledRadius * 0.35);
                    else ctx.rect(n.x - scaledRadius, n.y - scaledRadius, size, size);
                } else {
                    ctx.arc(n.x, n.y, scaledRadius, 0, Math.PI * 2);
                }
                ctx.fillStyle = n.color;

                if (isActive) {
                    ctx.shadowColor = n.color || `rgba(${ink}, 0.6)`;
                    ctx.shadowBlur = 20 * tr.k;
                }

                ctx.fill();

                if (isActive) {
                    ctx.shadowBlur = 0;
                    // An outline reads as "selected" in both themes, where the
                    // old white fill only did in dark.
                    ctx.strokeStyle = isLightMode ? '#18181b' : '#ffffff';
                    ctx.lineWidth = 2.5 / tr.k;
                    ctx.stroke();
                }
            }
        }

        // Node labels — a second pass so a label is never overdrawn by a node
        // that comes later in the loop. `label` was already on every node object
        // but nothing ever drew it, which is why the graph read as a field of
        // anonymous dots.
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (const n of nodes) {
            if (!n.label) continue;

            const scaledRadius = n.radius / Math.max(tr.k * 0.5, 0.8);
            const screenX = n.x * tr.k + tr.x;
            const screenY = n.y * tr.k + tr.y;
            const screenR = scaledRadius * tr.k;
            if (screenX + screenR + 250 < 0 || screenX - screenR - 250 > width || screenY + screenR + 150 < 0 || screenY - screenR - 150 > height) {
                continue;
            }

            const isActive = n === localSelectedNode || n === hoveredNode;
            // Below a certain zoom every label collides with its neighbours, so
            // keep only the hubs and whatever the pointer is on.
            if (tr.k < 0.7 && !n.isHub && !isActive) continue;

            const fontPx = (n.isHub ? 13 : 11.5) / tr.k;
            ctx.font = `${n.isHub || isActive ? 600 : 500} ${fontPx}px Inter, sans-serif`;

            const text = n.label.length > 24 ? `${n.label.slice(0, 23)}…` : n.label;
            const ty = n.y + scaledRadius + 7 / tr.k;

            // Halo first: labels sit over edges and other nodes, and without a
            // backdrop they smear into whatever is behind them.
            ctx.lineWidth = 3 / tr.k;
            ctx.strokeStyle = haloColor;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(text, n.x, ty);

            ctx.fillStyle = isActive ? labelColor : (n.isHub ? labelColor : labelMutedColor);
            ctx.fillText(text, n.x, ty);
        }

        ctx.restore();
    };

    const loop = () => {
        time = performance.now() * 0.001;
        applyPhysics();
        const mode = currentView.toLowerCase();
        for (const n of nodes) {
            const baseR = mode === 'timeline' ? 14 : n.baseRadius;
            const targetRadius = (n === hoveredNode || n === localSelectedNode) ? baseR * 1.25 : baseR;
            n.radius += (targetRadius - n.radius) * 0.2;
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

    const onMouseDown = (e: MouseEvent) => {
        if ((e.target as Element).closest('.command-wrapper') || (e.target as Element).closest('#mascot-img')) {
            return;
        }
        if (e.button === 2) return; 

        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - transform.current.x) / transform.current.k;
        const mouseY = (e.clientY - rect.top - transform.current.y) / transform.current.k;

        localSelectedNode = null;
        let minDist = Infinity;

        for (const n of nodes) {
            const dx = n.x - mouseX;
            const dy = n.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < n.radius + 15 && dist < minDist) {
                localSelectedNode = n;
                minDist = dist;
            }
        }

        if (localSelectedNode) {
            setSelectedNode(localSelectedNode);
            setCommandActive(true);
            setSidebarCollapsed(false);
            return;
        }

        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - transform.current.x) / transform.current.k;
        const mouseY = (e.clientY - rect.top - transform.current.y) / transform.current.k;

        if (!isDragging) {
            hoveredNode = null;
            let minDist = Infinity;
            for (const n of nodes) {
                const dx = n.x - mouseX;
                const dy = n.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < n.radius + 15 && dist < minDist) {
                    hoveredNode = n;
                    minDist = dist;
                }
            }
            canvas.style.cursor = hoveredNode ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
        }

        if (!isDragging) return;
        targetTransform.current.x += e.clientX - lastX;
        targetTransform.current.y += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        transform.current.x = targetTransform.current.x;
        transform.current.y = targetTransform.current.y;
    };

    const onMouseUp = () => { isDragging = false; };
    const onMouseLeave = () => { isDragging = false; };

    const onWheel = (e: WheelEvent) => {
        if (
            (e.target as Element).closest('.command-wrapper') ||
            (e.target as Element).closest('#mascot-img') ||
            (e.target as Element).closest('.chat-window')
        ) {
            return;
        }
        e.preventDefault();

        const zoomAmount = Math.exp(e.deltaY * -0.002);
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newK = Math.min(Math.max(targetTransform.current.k * zoomAmount, 0.1), 8);
        const actualZoom = newK / targetTransform.current.k;

        targetTransform.current.x = mouseX - (mouseX - targetTransform.current.x) * actualZoom;
        targetTransform.current.y = mouseY - (mouseY - targetTransform.current.y) * actualZoom;
        targetTransform.current.k = newK;
    };

    const zoomIn = () => {
        const newK = Math.min(targetTransform.current.k * 1.5, 8);
        zoomToCenter(newK);
    };
    const zoomOut = () => {
        const newK = Math.max(targetTransform.current.k / 1.5, 0.1);
        zoomToCenter(newK);
    };
    const zoomToCenter = (newK: number) => {
        const actualZoom = newK / targetTransform.current.k;
        const mouseX = width / 2;
        const mouseY = height / 2;
        targetTransform.current.x = mouseX - (mouseX - targetTransform.current.x) * actualZoom;
        targetTransform.current.y = mouseY - (mouseY - targetTransform.current.y) * actualZoom;
        targetTransform.current.k = newK;
    };

    const resetView = () => {
        // Recompute the fit from the nodes' current (settled) positions rather
        // than snapping back to the old hardcoded k=1, which for any graph
        // wider than the viewport left most of it off-screen. Animated, so the
        // button reads as a camera move rather than a jump cut.
        fitToBounds(true);
    };

    (window as any).zoomIn = zoomIn;
    (window as any).zoomOut = zoomOut;
    (window as any).resetView = resetView;

    const onDoubleClick = (e: MouseEvent) => {
        if ((e.target as Element).closest('.command-wrapper') || (e.target as Element).closest('#mascot-img')) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - transform.current.x) / transform.current.k;
        const mouseY = (e.clientY - rect.top - transform.current.y) / transform.current.k;

        let clickedNode = null;
        let minDist = Infinity;
        for (const n of nodes) {
            const dx = n.x - mouseX;
            const dy = n.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < n.radius + 15 && dist < minDist) {
                clickedNode = n;
                minDist = dist;
            }
        }
        if (clickedNode && (clickedNode.type === 'company' || clickedNode.isHub)) {
            const screenR = (clickedNode.radius / Math.max(transform.current.k * 0.5, 0.8)) * transform.current.k;
            const screenX = clickedNode.x * transform.current.k + transform.current.x - screenR;
            const screenY = clickedNode.y * transform.current.k + transform.current.y - screenR;
            const startW = screenR * 2;
            const isRound = clickedNode.type !== 'company';
            router.push(`/company/${clickedNode.domain || clickedNode.label}?startX=${screenX}&startY=${screenY}&startW=${startW}&round=${isRound}`);
        }
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
        cancelAnimationFrame(animFrameId);
        window.removeEventListener('resize', handleResize);
        container.removeEventListener('mousedown', onMouseDown);
        container.removeEventListener('dblclick', onDoubleClick);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        container.removeEventListener('mouseleave', onMouseLeave);
        container.removeEventListener('wheel', onWheel);
    };
  }, [currentView, loading, dbGraphData, dbCompetitors, router]);

  return (
    <div className="page-canvas skeleton-target" id="graphContainer" ref={containerRef}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <canvas id="obsidianCanvas" ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}></canvas>
        </div>

        {/* The graph effect early-returns while `loading`, so the canvas above
            stays empty and the page reads as finished-but-broken rather than
            still working. The header and toolbar are already drawn, so this
            covers only the canvas and leaves them interactive. */}
        {loading && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ width: 'min(680px, 70%)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Skeleton variant="card" height={320} />
              <div style={{ display: 'flex', gap: 16 }}>
                <Skeleton variant="card" height={72} style={{ flex: 1 }} />
                <Skeleton variant="card" height={72} style={{ flex: 1 }} />
                <Skeleton variant="card" height={72} style={{ flex: 1 }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Page header ────────────────────────────────────────── */}
        <div className="page-header" style={{ position: 'absolute', top: 28, left: 28, zIndex: 10, pointerEvents: 'none', alignItems: 'center', marginBottom: 0, gap: 16 }}>
          <div style={{ pointerEvents: 'auto' }}>
            <h1 className="page-title">Partnerships</h1>
          </div>
          <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <button
                className="btn-secondary card-sm"
                id="viewToggleBtn"
                onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
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
              {viewDropdownOpen && (
                <div className="view-dropdown show" id="viewDropdown">
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); (window as any).setViewMode('graph'); }}>Graph</div>
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); (window as any).setViewMode('timeline'); }}>Timeline</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bottom-right-controls" style={{ zIndex: 20, pointerEvents: 'auto' }}>
            <div className="br-pill card-sm">
                <button className="icon-btn" onClick={() => (window as any).zoomOut()} title="Zoom Out">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                <div className="divider"></div>
                <button className="icon-btn" onClick={() => (window as any).zoomIn()} title="Zoom In">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>
            <button className="btn-secondary card-sm pill" id="zoom-indicator" onClick={() => (window as any).resetView()} title="Reset View">
              {zoom}%
            </button>
            <button className="btn-secondary card-sm" style={{ padding: '8px 12px' }} title="Help">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            </button>
        </div>

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
                    <span className="v0-action-text">replicate this</span>
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
                            <strong><span>{selectedNode?.label || 'Node'}</span>:</strong>
                            <span> This screen captures the futuristic, visionary aesthetic with a blue grid background, glowing compass, and cloud elements.</span>
                        </li>
                    </ul>
                </div>
                <div className="v0-prompt-suggestion">
                    What would you like to refine or add to this design?
                </div>
            </div>
        </div>
    </div>
  );
}
