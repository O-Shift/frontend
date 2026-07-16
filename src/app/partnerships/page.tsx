'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PromptField from '@/components/PromptField';
import SkeletonOverlay from '@/components/SkeletonOverlay';

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

  useEffect(() => {
    document.body.classList.toggle('is-thinking-active', isThinking);
    return () => document.body.classList.remove('is-thinking-active');
  }, [isThinking]);

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
  
  const transform = useRef({ x: 0, y: 0, k: 1 });
  const targetTransform = useRef({ x: 0, y: 0, k: 1 });
  
  useEffect(() => {
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

    targetTransform.current = { x: width / 2, y: height / 2, k: 1 };
    transform.current = { x: width / 2, y: height / 2, k: 1 };
    
    const NUM_NODES = 250;
    const NUM_HUBS = 12;

    const timelineEvents: any[] = [];
    const NUM_EVENTS = Math.floor(NUM_NODES / 2);
    let currentDate = new Date(2021, 0, 1);
    let lastMonth = -1;

    for (let i = 0; i < NUM_EVENTS; i++) {
        const month = currentDate.getMonth();
        const isFirstOfMonth = month !== lastMonth;
        lastMonth = month;

        timelineEvents.push({
            id: i,
            x: i * 80,
            dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            monthStr: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            isFirstOfMonth: isFirstOfMonth,
            node1: null as any,
            node2: null as any
        });
        currentDate.setDate(currentDate.getDate() + 2 + Math.floor(Math.random() * 4));
    }

    const pairIndices = Array.from({length: NUM_NODES}, (_, i) => i);
    for (let i = pairIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairIndices[i], pairIndices[j]] = [pairIndices[j], pairIndices[i]];
    }

    const nodeToEvent = new Array(NUM_NODES);
    const nodeYOffset = new Array(NUM_NODES);
    for (let i = 0; i < NUM_EVENTS; i++) {
        const n1 = pairIndices[i * 2];
        const n2 = pairIndices[i * 2 + 1];
        nodeToEvent[n1] = i;
        nodeToEvent[n2] = i;
        nodeYOffset[n1] = -100 - Math.random() * 60;
        nodeYOffset[n2] = 100 + Math.random() * 60;
    }

    const nodes: any[] = [];
    const links: any[] = [];
    const preloadedImages: any = {};
    
    const entities = [
      { name: "Apple", domain: "apple.com", type: "company", color: "#FF5A00" },
      { name: "Google", domain: "google.com", type: "company", color: "#34A853" },
      { name: "Microsoft", domain: "microsoft.com", type: "company", color: "#00A4EF" },
      { name: "Amazon", domain: "amazon.com", type: "company", color: "#FF9900" },
      { name: "Tesla", domain: "tesla.com", type: "company", color: "#E31937" },
      { name: "Meta", domain: "meta.com", type: "company", color: "#0668E1" },
      { name: "MrBeast", domain: "mrbeast.store", type: "influencer", color: "#E50914" },
      { name: "Netflix", domain: "netflix.com", type: "company", color: "#E50914" },
      { name: "Spotify", domain: "spotify.com", type: "company", color: "#1DB954" },
      { name: "Stripe", domain: "stripe.com", type: "company", color: "#635BFF" },
      { name: "MKBHD", domain: "mkbhd.com", type: "influencer", color: "#FF0000" },
      { name: "Uber", domain: "uber.com", type: "company", color: "#FFFFFF" }
    ];

    const processImageCache = (domain: string, type: string, imgUrl: string, fallbackUrl: string | null) => {
      if (!preloadedImages[domain]) {
        const imgObj = { loaded: false, canvas: null as HTMLCanvasElement | null };
        preloadedImages[domain] = imgObj;
        const img = new Image();
        img.src = imgUrl;
        
        const cacheImg = () => {
          const c = document.createElement('canvas');
          c.width = 128;
          c.height = 128;
          const xctx = c.getContext('2d');
          if(!xctx) return;
          
          xctx.beginPath();
          if (type === 'company') {
              if((xctx as any).roundRect) (xctx as any).roundRect(2, 2, 124, 124, 24);
              else xctx.rect(2, 2, 124, 124);
          } else {
              xctx.arc(64, 64, 62, 0, Math.PI * 2);
          }
          xctx.fillStyle = '#ffffff';
          xctx.fill();
          xctx.clip();
          xctx.drawImage(img, 2, 2, 124, 124);
          
          imgObj.canvas = c;
          imgObj.loaded = true;
        };

        img.onload = cacheImg;
        img.onerror = () => {
            if (fallbackUrl && img.src !== fallbackUrl) {
                img.src = fallbackUrl;
            }
        };
      }
    };

    for (let i = 0; i < NUM_NODES; i++) {
      const isHub = i < NUM_HUBS;
      let value = 0;
      let radius = 3.5;
      let imgUrl = null;
      let label = '';
      let domain = '';
      let type = 'normal';
      let color = '#8E8E93';

      if (isHub) {
          const entity = entities[i % entities.length];
          label = entity.name;
          domain = entity.domain;
          type = entity.type;
          color = entity.color || '#FF5A00';

          imgUrl = `https://logo.clearbit.com/${entity.domain}`;
          const fallbackUrl = `https://www.google.com/s2/favicons?domain=${entity.domain}&sz=128`;
          processImageCache(entity.domain, type, imgUrl, fallbackUrl);

          value = 50 + Math.random() * 2950;
          radius = 8 + Math.sqrt(value) * 0.25;
      } else {
          const isCompany = Math.random() > 0.4;
          type = isCompany ? 'company' : 'influencer';
          const idStr = i.toString();
          let fallbackUrl = null;
          
          if (isCompany) {
              const smallCompanies = ["vercel.com", "figma.com", "notion.so", "openai.com", "anthropic.com", "linear.app", "github.com", "gitlab.com", "slack.com", "raycast.com", "arc.net"];
              domain = smallCompanies[i % smallCompanies.length];
              imgUrl = `https://logo.clearbit.com/${domain}`;
              fallbackUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
              label = domain.split('.')[0];
              color = '#8E8E93';
          } else {
              domain = `influencer_${i}`;
              imgUrl = `https://i.pravatar.cc/50?u=${idStr}`;
              label = `Creator ${i}`;
              color = '#a78bfa';
          }

          processImageCache(domain, type, imgUrl, fallbackUrl);
          value = 5 + Math.random() * 20;
          radius = 5 + Math.sqrt(value) * 0.4;
      }

      const eventIdx = nodeToEvent[i];
      const ev = timelineEvents[eventIdx];
      let tX = ev ? ev.x : 0;
      let tY = nodeYOffset[i];

      nodes.push({
          id: i,
          x: (Math.random() - 0.5) * width * 1.5,
          y: (Math.random() - 0.5) * height * 1.5,
          vx: 0,
          vy: 0,
          isHub: isHub,
          value: value,
          domain: domain,
          type: type,
          radius: radius,
          baseRadius: radius,
          color: color,
          label: label,
          timelineX: tX,
          timelineY: tY,
          orbitOffset: Math.random() * Math.PI * 2
      });
    }

    for (let i = NUM_HUBS; i < NUM_NODES; i++) {
        const targetHub = Math.floor(Math.random() * NUM_HUBS);
        links.push({ source: nodes[i], target: nodes[targetHub] });

        if (Math.random() > 0.85) {
            const randomNode = Math.floor(NUM_HUBS + Math.random() * (NUM_NODES - NUM_HUBS));
            if (randomNode !== i) {
                links.push({ source: nodes[i], target: nodes[randomNode] });
            }
        }
    }

    for (let i = 0; i < NUM_EVENTS; i++) {
        const n1Idx = pairIndices[i * 2];
        const n2Idx = pairIndices[i * 2 + 1];
        if (n1Idx !== undefined && n2Idx !== undefined) {
            const n1 = nodes[n1Idx];
            const n2 = nodes[n2Idx];
            links.push({ source: n1, target: n2 });
            const ev = timelineEvents[i];
            if (ev) {
                ev.node1 = n1;
                ev.node2 = n2;
            }
        }
    }
    
    for (let i = 0; i < NUM_HUBS; i++) {
        for (let j = i + 1; j < NUM_HUBS; j++) {
            if (Math.random() > 0.75) {
                links.push({ source: nodes[i], target: nodes[j] });
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

        if (mode === 'timeline') {
            const targetK = 0.5;
            targetTransform.current.x = 200;
            targetTransform.current.y = height / 2;
            targetTransform.current.k = targetK; 
        } else {
            targetTransform.current.x = width / 2;
            targetTransform.current.y = height / 2;
            targetTransform.current.k = 1;
            nodes.forEach(n => {
                n.vx += (Math.random() - 0.5) * 50;
            });
        }
    };
    
    let animFrameId: number;
    let time = 0;
    
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
                    const force = repulsion / distSq;
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
            const force = (dist - springLen) * springK * (mode === 'timeline' ? 0.02 : 1);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            link.source.vx += fx;
            link.source.vy += fy;
            link.target.vx -= fx;
            link.target.vy -= fy;
        }

        for (const n of nodes) {
            if (mode === 'graph') {
                n.vx -= n.x * 0.001;
                n.vy -= n.y * 0.001;
            } else if (mode === 'timeline') {
                n.vx += (n.timelineX - n.x) * 0.08;
                n.vy += (n.timelineY - n.y) * 0.08;
            }

            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
        }
    };
    
    const draw = (t: number) => {
        const tr = transform.current;
        const tt = targetTransform.current;
        const mode = currentView.toLowerCase();
        
        tr.x += (tt.x - tr.x) * 0.15;
        tr.y += (tt.y - tr.y) * 0.15;
        tr.k += (tt.k - tr.k) * 0.15;
        
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(tr.x, tr.y);
        ctx.scale(tr.k, tr.k);

        ctx.lineWidth = 0.5 / tr.k;
        for (const link of links) {
            if (mode === 'timeline') continue;

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
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1.5 / tr.k;
            } else {
                ctx.strokeStyle = 'rgba(142, 142, 147, 0.4)';
                ctx.lineWidth = 1.0 / tr.k;
            }
            ctx.stroke();
        }
        
        if (mode === 'timeline') {
            const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
            const TIMELINE_BASE_Y = 0;
            ctx.beginPath();
            const minX = -100;
            const maxX = (timelineEvents.length - 1) * 80 + 200;
            ctx.moveTo(minX, TIMELINE_BASE_Y);
            ctx.lineTo(maxX, TIMELINE_BASE_Y);
            ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2 / tr.k;
            ctx.stroke();

            let lastDrawnX = -Infinity;
            const minTextSpacing = 80 / tr.k;

            ctx.fillStyle = isLightMode ? '#52525b' : '#a1a1aa';
            ctx.font = `600 ${14 / tr.k}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            for (const ev of timelineEvents) {
                if (ev.node1 && ev.node2) {
                    ctx.beginPath();
                    ctx.moveTo(ev.node1.x, ev.node1.y + ev.node1.radius);
                    ctx.lineTo(ev.node2.x, ev.node2.y - ev.node2.radius);
                    ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)';
                    ctx.lineWidth = 1.5 / tr.k;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.moveTo(ev.x, TIMELINE_BASE_Y - 6 / tr.k);
                ctx.lineTo(ev.x, TIMELINE_BASE_Y + 6 / tr.k);
                ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 2 / tr.k;
                ctx.stroke();

                const textStr = tr.k < 0.4 ? ev.monthStr : ev.dateStr;
                const isMajor = tr.k < 0.4 ? ev.isFirstOfMonth : true;

                if (isMajor && (ev.x - lastDrawnX > minTextSpacing)) {
                    ctx.fillText(textStr, ev.x, TIMELINE_BASE_Y + 20 / tr.k);
                    lastDrawnX = ev.x;
                }
            }

            ctx.fillStyle = isLightMode ? '#ffffff' : '#18181b';
            ctx.strokeStyle = isLightMode ? '#52525b' : 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2 / tr.k;
            for (const ev of timelineEvents) {
                ctx.beginPath();
                ctx.arc(ev.x, TIMELINE_BASE_Y, 3 / tr.k, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        for (const n of nodes) {
            const scaledRadius = n.radius / Math.max(tr.k * 0.5, 0.8);
            const isActive = n === localSelectedNode || n === hoveredNode;

            if (n.isHub) {
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
                ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(142, 142, 147, 0.2)';
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

            const pImg = preloadedImages[n.domain];

            if (pImg && pImg.canvas) {
                if (isActive) {
                    ctx.save();
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
                    ctx.shadowBlur = 20 * tr.k;
                    ctx.drawImage(pImg.canvas, n.x - scaledRadius, n.y - scaledRadius, scaledRadius * 2, scaledRadius * 2);
                    ctx.restore();
                } else {
                    ctx.drawImage(pImg.canvas, n.x - scaledRadius, n.y - scaledRadius, scaledRadius * 2, scaledRadius * 2);
                }
                
                ctx.beginPath();
                if (n.type === 'company') {
                    const size = scaledRadius * 2;
                    if((ctx as any).roundRect) (ctx as any).roundRect(n.x - scaledRadius, n.y - scaledRadius, size, size, scaledRadius * 0.35);
                    else ctx.rect(n.x - scaledRadius, n.y - scaledRadius, size, size);
                } else {
                    ctx.arc(n.x, n.y, scaledRadius, 0, Math.PI * 2);
                }
                ctx.strokeStyle = isActive ? '#ffffff' : (n.isHub ? n.color : 'rgba(142, 142, 147, 0.4)');
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
                ctx.fillStyle = isActive ? '#ffffff' : n.color;
                
                if (isActive) {
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
                    ctx.shadowBlur = 20 * tr.k;
                }
                
                ctx.fill();
                
                if (isActive) {
                    ctx.shadowBlur = 0;
                }
            }
        }
        ctx.restore();
    };

    const loop = () => {
        time = performance.now() * 0.001;
        applyPhysics();
        const mode = currentView.toLowerCase();
        for (const n of nodes) {
            const baseR = mode === 'timeline' ? 12 : n.baseRadius;
            const targetRadius = (n === hoveredNode || n === localSelectedNode) ? baseR * 1.25 : baseR;
            n.radius += (targetRadius - n.radius) * 0.2;
        }
        draw(time);
        setZoom(Math.round(transform.current.k * 100));
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
                if (n.isHub) {
                    const dx = n.x - mouseX;
                    const dy = n.y - mouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < n.radius + 15 && dist < minDist) {
                        hoveredNode = n;
                        minDist = dist;
                    }
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
        targetTransform.current.x = width / 2;
        targetTransform.current.y = height / 2;
        targetTransform.current.k = 1;
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
            router.push(`/company/${clickedNode.domain}?startX=${screenX}&startY=${screenY}&startW=${startW}&round=${isRound}`);
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
  }, [currentView]);

  return (
    <div className="main-content skeleton-target" id="graphContainer" ref={containerRef}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <canvas id="obsidianCanvas" ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}></canvas>
        </div>

        <div className="main-header">
            <h1>Partnerships</h1>
            <div className="view-toggle" id="viewToggleBtn" style={{ position: 'relative' }} onClick={() => setViewDropdownOpen(!viewDropdownOpen)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <span>View: <span>{currentView}</span></span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
                {viewDropdownOpen && (
                  <div className="view-dropdown show" id="viewDropdown">
                      <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); (window as any).setViewMode('graph'); }}>Graph</div>
                      <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); (window as any).setViewMode('timeline'); }}>Timeline</div>
                  </div>
                )}
            </div>
        </div>

        <div className="bottom-right-controls">
            <div className="br-pill">
                <button className="icon-btn" onClick={() => (window as any).zoomOut()}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                <div className="divider"></div>
                <button className="icon-btn" onClick={() => (window as any).zoomIn()}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>
            <div className="br-pill br-zoom" id="zoom-indicator" onClick={() => (window as any).resetView()}>{zoom}%</div>
            <button className="br-circle">
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
            onSubmit={() => setIsThinking(true)}
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
