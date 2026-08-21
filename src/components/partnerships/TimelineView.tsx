'use client';

import type { GraphNode, TimelineEvent } from '@/components/partnerships/types';

interface DrawTimelineSceneOptions {
  k: number;
  timelineEvents: TimelineEvent[];
  nodes: GraphNode[];
  isLightMode: boolean;
  textMuted: string;
}

/**
 * Timeline scene drawing, invoked by the shared canvas render loop so the
 * camera lerp / highlight pass stays identical between Graph and Timeline.
 */
export function drawTimelineScene(
  ctx: CanvasRenderingContext2D,
  { k, timelineEvents, nodes, isLightMode, textMuted }: DrawTimelineSceneOptions
) {
  const TIMELINE_BASE_Y = 0;
  if (timelineEvents.length > 0) {
    ctx.beginPath();
    const minX = -100;
    const maxX = (timelineEvents.length - 1) * 180 + 300;
    ctx.moveTo(minX, TIMELINE_BASE_Y);
    ctx.lineTo(maxX, TIMELINE_BASE_Y);
    ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5 / k;
    ctx.stroke();

    for (const n of nodes) {
      if (n.hasRealDate && n.x !== undefined && n.y !== undefined) {
        ctx.beginPath();
        ctx.moveTo(n.x, TIMELINE_BASE_Y);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.2 / k;
        ctx.stroke();
      }
    }

    ctx.fillStyle = textMuted;
    ctx.font = `600 ${13 / k}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const ev of timelineEvents) {
      ctx.beginPath();
      ctx.moveTo(ev.x, TIMELINE_BASE_Y - 7 / k);
      ctx.lineTo(ev.x, TIMELINE_BASE_Y + 7 / k);
      ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5 / k;
      ctx.stroke();

      ctx.fillText(ev.dateStr, ev.x, TIMELINE_BASE_Y + 20 / k);
    }
  } else {
    ctx.fillStyle = textMuted;
    ctx.font = `500 ${14.5 / k}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No chronological event dates recorded for these partnerships.', 0, 0);
  }
}
