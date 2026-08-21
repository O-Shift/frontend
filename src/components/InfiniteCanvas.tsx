'use client';
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  ReactNode,
} from 'react';

export interface InfiniteCanvasHandle {
  getTransform: () => { x: number; y: number; k: number };
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

interface InfiniteCanvasProps {
  children: ReactNode;
  initialScale?: number;
  onCanvasMouseDown?: (worldX: number, worldY: number, e: MouseEvent) => boolean | void;
  className?: string;
}

const InfiniteCanvas = forwardRef<InfiniteCanvasHandle, InfiniteCanvasProps>(
  ({ children, initialScale = 0.7, onCanvasMouseDown, className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const panzoomRef  = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(Math.round(initialScale * 100));

    const transform       = useRef({ x: 0, y: 0, k: initialScale });
    const targetTransform = useRef({ x: 0, y: 0, k: initialScale });
    const isDragging      = useRef(false);
    const lastPos         = useRef({ x: 0, y: 0 });

    // ── Reset view: put world (0,0) at screen center ───────────────
    const resetView = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      targetTransform.current = { x: w / 2, y: h / 2, k: initialScale };
    };

    const _zoomToCenter = (newK: number) => {
      if (!containerRef.current) return;
      const ratio = newK / targetTransform.current.k;
      const cx = containerRef.current.clientWidth  / 2;
      const cy = containerRef.current.clientHeight / 2;
      targetTransform.current = {
        x: cx - (cx - targetTransform.current.x) * ratio,
        y: cy - (cy - targetTransform.current.y) * ratio,
        k: newK,
      };
    };

    const zoomIn  = () => _zoomToCenter(Math.min(targetTransform.current.k * 1.5, 3));
    const zoomOut = () => _zoomToCenter(Math.max(targetTransform.current.k / 1.5, 0.15));

    useImperativeHandle(ref, () => ({
      getTransform: () => ({ ...transform.current }),
      resetView,
      zoomIn,
      zoomOut,
    }));

    useEffect(() => {
      if (!containerRef.current || !panzoomRef.current) return;
      const container = containerRef.current;
      const panzoom   = panzoomRef.current;

      resetView();
      // Snap immediately on first load (no lerp lag)
      transform.current = { ...targetTransform.current };

      let animFrameId: number;

      const updateTransform = () => {
        const t  = transform.current;
        const tt = targetTransform.current;
        t.x += (tt.x - t.x) * 0.18;
        t.y += (tt.y - t.y) * 0.18;
        t.k += (tt.k - t.k) * 0.18;
        panzoom.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.k})`;
        setZoom(Math.round(t.k * 100));
        animFrameId = requestAnimationFrame(updateTransform);
      };
      updateTransform();

      // ── Interaction handlers ──────────────────────────────────────
      const activePointers = new Map<number, { x: number; y: number }>();
      let pinchState: { initDist: number; initK: number } | null = null;

      const distBetween = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        Math.hypot(a.x - b.x, a.y - b.y);

      const onPointerDown = (e: PointerEvent) => {
        if (
          (e.target as Element).closest('.campaign-node')       ||
          (e.target as Element).closest('.command-wrapper')     ||
          (e.target as Element).closest('#mascot-img')          ||
          (e.target as Element).closest('.bottom-right-controls') ||
          (e.target as Element).closest('.main-header') ||
          (e.target as Element).closest('.page-header')
        ) return;

        if (onCanvasMouseDown) {
          const rect   = container.getBoundingClientRect();
          const worldX = (e.clientX - rect.left - transform.current.x) / transform.current.k;
          const worldY = (e.clientY - rect.top  - transform.current.y) / transform.current.k;
          const consumed = onCanvasMouseDown(worldX, worldY, e);
          if (consumed) return;
        }

        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activePointers.size === 2) {
          isDragging.current = false;
          const [a, b] = [...activePointers.values()];
          pinchState = {
            initDist: distBetween(a, b),
            initK:    targetTransform.current.k,
          };
          return;
        }

        if (activePointers.size !== 1) return;

        try { container.setPointerCapture(e.pointerId); } catch {}

        isDragging.current = true;
        lastPos.current    = { x: e.clientX, y: e.clientY };
        container.style.cursor = 'grabbing';
      };

      const onPointerMove = (e: PointerEvent) => {
        if (activePointers.has(e.pointerId)) {
          activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        if (pinchState && activePointers.size >= 2) {
          const [a, b] = [...activePointers.values()];
          const dist = distBetween(a, b);
          if (pinchState.initDist <= 0 || dist <= 0) return;
          const rect = container.getBoundingClientRect();
          const midX = (a.x + b.x) / 2 - rect.left;
          const midY = (a.y + b.y) / 2 - rect.top;
          const newK  = Math.min(Math.max(pinchState.initK * (dist / pinchState.initDist), 0.15), 3);
          const ratio = newK / targetTransform.current.k;
          const t = targetTransform.current;
          t.x = midX - (midX - t.x) * ratio;
          t.y = midY - (midY - t.y) * ratio;
          t.k = newK;
          return;
        }

        if (!isDragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;

        // Direct-update for snappy pan response
        targetTransform.current.x += dx;
        targetTransform.current.y += dy;
        transform.current.x = targetTransform.current.x;
        transform.current.y = targetTransform.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
      };

      const endPointer = (e: PointerEvent) => {
        try { container.releasePointerCapture(e.pointerId); } catch {}
        activePointers.delete(e.pointerId);
        if (activePointers.size < 2) pinchState = null;
        if (activePointers.size === 0) {
          isDragging.current = false;
          container.style.cursor = 'grab';
        }
      };

      const onPointerUp = (e: PointerEvent) => endPointer(e);
      const onPointerCancel = (e: PointerEvent) => endPointer(e);

      const onWheel = (e: WheelEvent) => {
        if (
          (e.target as Element).closest('.command-wrapper') ||
          (e.target as Element).closest('#mascot-img') ||
          (e.target as Element).closest('.chat-window')
        ) {
          return;
        }
        if (activePointers.size > 0) return;
        e.preventDefault();

        const zoomAmount = Math.exp(e.deltaY * -0.002);
        const rect   = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newK   = Math.min(Math.max(targetTransform.current.k * zoomAmount, 0.15), 3);
        const ratio  = newK / targetTransform.current.k;
        targetTransform.current.x = mouseX - (mouseX - targetTransform.current.x) * ratio;
        targetTransform.current.y = mouseY - (mouseY - targetTransform.current.y) * ratio;
        targetTransform.current.k = newK;
      };

      container.addEventListener('pointerdown',  onPointerDown);
      container.addEventListener('pointermove',  onPointerMove);
      container.addEventListener('pointerup',    onPointerUp);
      container.addEventListener('pointercancel', onPointerCancel);
      container.addEventListener('wheel',  onWheel, { passive: false });

      return () => {
        cancelAnimationFrame(animFrameId);
        container.removeEventListener('pointerdown',  onPointerDown);
        container.removeEventListener('pointermove',  onPointerMove);
        container.removeEventListener('pointerup',    onPointerUp);
        container.removeEventListener('pointercancel', onPointerCancel);
        container.removeEventListener('wheel',  onWheel);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div ref={containerRef} className={`main-content ${className}`} style={{ cursor: 'grab', position: 'absolute', inset: 0, touchAction: 'none' }}>

        {/* World layer — transforms applied here */}
        <div
          ref={panzoomRef}
          id="panzoom-container"
          style={{
            transformOrigin: '0 0',
            willChange: 'transform',
            position: 'absolute',
            top: 0, left: 0,
            // Use a large size so that absolutely-placed children at
            // negative coordinates aren't clipped by this div.
            width: 0, height: 0,
            overflow: 'visible',
          }}
        >
          {children}
        </div>

        {/* Zoom controls — fixed to viewport corner */}
        <div className="bottom-right-controls">
          <div className="br-pill">
            <button className="icon-btn" onClick={zoomOut} title="Zoom out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <div className="divider"/>
            <button className="icon-btn" onClick={zoomIn} title="Zoom in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
          </div>
          <div className="br-pill br-zoom" onClick={resetView} style={{ cursor: 'pointer' }}>
            {zoom}%
          </div>
          <button className="br-circle" onClick={resetView} title="Reset view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

InfiniteCanvas.displayName = 'InfiniteCanvas';
export default InfiniteCanvas;
