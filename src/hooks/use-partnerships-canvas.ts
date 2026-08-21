'use client';

/**
 * Camera/simulation/render controller for the partnerships graph + timeline canvases.
 * Extracted verbatim from page.tsx; every dependency arrives by name so the moved
 * body required zero edits.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { RefObject, Dispatch, SetStateAction } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceCenter,
  forceX,
  forceY,
  type Simulation,
} from 'd3-force';
import { logoUrl } from '@/lib/logos';
import { formatRelType } from '@/hooks/use-partnerships-graph';
import type {
  Canvas2D,
  Competitor,
  GraphEntity,
  PartnershipsResponse,
  TimelineEvent,
  GraphNode,
  GraphLink,
} from '@/components/partnerships/types';

interface PartnershipsCanvasProps {
  loading: boolean;
  dbGraphData: PartnershipsResponse | null;
  dbCompetitors: Competitor[];
  entities: GraphEntity[];
  timelineEvents: TimelineEvent[];
  currentView: 'Graph' | 'Timeline';
  selectedNode: GraphNode | null;
  setSelectedNode: Dispatch<SetStateAction<GraphNode | null>>;
  setCommandActive: Dispatch<SetStateAction<boolean>>;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  setZoom: Dispatch<SetStateAction<number>>;
  router: ReturnType<typeof useRouter>;
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  transform: RefObject<{ x: number; y: number; k: number }>;
  targetTransform: RefObject<{ x: number; y: number; k: number }>;
  activeSimulationRef: RefObject<Simulation<GraphNode, GraphLink> | null>;
  fitToBoundsRef: RefObject<((animate?: boolean) => void) | null>;
}

export function usePartnershipsCanvas({
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
}: PartnershipsCanvasProps) {
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

    // ┌€┌€ Build Entities & Nodes ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

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
          const rc = xctx as Canvas2D;
          if (rc.roundRect) rc.roundRect(4, 4, 120, 120, 24);
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
          const rc = xctx as Canvas2D;
          if (rc.roundRect) rc.roundRect(4, 4, 120, 120, 24);
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
    for (const e of entities) {
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

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
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

    // ┌€┌€ D3-Force Physics Engine ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

    const simulation = forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(links)
          .id(d => d.id)
          .distance(link => {
            const src = link.source;
            const tgt = link.target;
            if (src.isHub && tgt.isHub) return 290;
            if (src.isHub || tgt.isHub) return 140;
            return 95;
          })
          .strength(link => {
            const srcDegree = link.source.degree || 1;
            const tgtDegree = link.target.degree || 1;
            return Math.min(1.2 / Math.min(srcDegree, tgtDegree), 0.7);
          })
      )
      .force(
        'charge',
        forceManyBody<GraphNode>()
          .strength(d => (d.isHub ? -1000 : -280))
          .distanceMin(25)
          .distanceMax(1100)
          .theta(0.85)
      )
      .force(
        'collide',
        forceCollide<GraphNode>()
          .radius(d => d.radius + (d.isHub ? 38 : 26))
          .iterations(3)
          .strength(0.9)
      )
      .force('center', forceCenter(0, 10).strength(0.04))
      .force('x', forceX(0).strength(0.025))
      .force('y', forceY(10).strength(0.025))
      .alphaDecay(0.028);

    activeSimulationRef.current = simulation;

    // ┌€┌€ Camera Fit to Bounds ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

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

    // ┌€┌€ Pre-warm Simulation for Instant Optimal Positioning ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

    if (currentView === 'Graph') {
      for (let i = 0; i < 180; ++i) {
        simulation.tick();
      }
      fitToBounds(false);
    } else {
      fitToBounds(false);
    }

    // ┌€┌€ Interaction State ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

    let isPanning = false;
    let hoveredNode: GraphNode | null = null;
    let hoveredLink: GraphLink | null = null;
    let lastMouseX = 0, lastMouseY = 0;
    let animFrameId: number;
    let time = 0;
    let lastZoomPct = -1;

    // ┌€┌€ Render Draw Loop ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

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

      // ┌€┌€ Draw Links (Graph Mode) ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€
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
            const ccLinkPill = ctx as Canvas2D;
            if (ccLinkPill.roundRect) {
              ccLinkPill.roundRect(midX - pillW / 2, midY - pillH / 2, pillW, pillH, 8.5 / tr.k);
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

      // ┌€┌€ Draw Timeline Mode ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€
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

      // ┌€┌€ Draw Nodes ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€
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
            const ccNode = ctx as Canvas2D;
            if (ccNode.roundRect) ccNode.roundRect(n.x - scaledRadius, n.y - scaledRadius, size, size, scaledRadius * 0.32);
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
            const ccNode = ctx as Canvas2D;
            if (ccNode.roundRect) ccNode.roundRect(n.x - scaledRadius, n.y - scaledRadius, size, size, scaledRadius * 0.32);
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

      // ┌€┌€ Draw Node Labels (Second Pass with Dedicated High-Contrast Pill) ┌€
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
        const ccLabel = ctx as Canvas2D;
        if (ccLabel.roundRect) {
          ccLabel.roundRect(n.x - pillW / 2, pillY, pillW, pillH, 6 / tr.k);
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

    // ┌€┌€ Live Animation Loop ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

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

    // ┌€┌€ Mouse & Pan Interaction (NO MANUAL NODE DRAGGING) ┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€┌€

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
  }, [loading, dbGraphData, dbCompetitors, entities, timelineEvents, currentView, router]);
}

