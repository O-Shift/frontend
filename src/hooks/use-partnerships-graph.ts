// oshift/src/hooks/use-partnerships-graph.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { extractDomain as extractDomainRaw } from '@/lib/utils/domain';
import { stringToHue } from '@/lib/colors';
import type {
  Competitor,
  EntityCategory,
  GraphEntity,
  NodeMetadata,
  PartnershipsResponse,
  TimelineEvent,
} from '@/components/partnerships/types';

// ── Domain & Color Utilities ──────────────────────────────────────────

export function extractDomain(input?: string | null): string {
  if (!input) return '';
  const str = input.trim();
  const host = extractDomainRaw(str);
  if (host.includes('.')) return host;
  if (!str.includes('.')) return '';
  return str.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
}

export function getDynamicDomain(metadata?: NodeMetadata): string {
  if (metadata?.domain) return extractDomain(metadata.domain);
  if (metadata?.website) return extractDomain(metadata.website);
  if (metadata?.url) return extractDomain(metadata.url);
  return '';
}

export function getDynamicBrandColor(str: string): string {
  if (!str) return 'hsl(215, 80%, 55%)';
  return `hsl(${stringToHue(str)}, 70%, 52%)`;
}

export function formatRelType(type: string): string {
  if (!type || type.toLowerCase() === 'partner' || type.toLowerCase() === 'partners_with') {
    return 'Partners With';
  }
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ── DBGraphNode → GraphEntity normalization (+ competitor fallback) ───

export function buildRawEntities(
  dbGraphData: PartnershipsResponse | null,
  dbCompetitors: Competitor[]
): GraphEntity[] {
  const rawEntities: GraphEntity[] = [];

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

  return rawEntities;
}

// ── Category / search filtering ───────────────────────────────────────

export function filterEntities(
  rawEntities: GraphEntity[],
  activeCategory: EntityCategory,
  searchQuery: string
): GraphEntity[] {
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
  return filteredEntities;
}

// ── Timeline events mapping ───────────────────────────────────────────

export function buildTimelineEvents(filteredEntities: GraphEntity[]): TimelineEvent[] {
  const timelineEvents: TimelineEvent[] = [];

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

  return timelineEvents;
}

/**
 * Partnership graph source data plus the category/search-filtered entity list
 * and derived timeline events. Mirrors the page's original fetch semantics:
 * both reads run in parallel, a failed read keeps previous data, and `loading`
 * covers the whole pass.
 */
export function usePartnershipsGraph(activeCategory: EntityCategory, searchQuery: string) {
  const [dbGraphData, setDbGraphData] = useState<PartnershipsResponse | null>(null);
  const [dbCompetitors, setDbCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch; setState fires from async loader after awaits
    loadData();
  }, [loadData]);

  const entities = useMemo(
    () => filterEntities(buildRawEntities(dbGraphData, dbCompetitors), activeCategory, searchQuery),
    [dbGraphData, dbCompetitors, activeCategory, searchQuery]
  );

  const timelineEvents = useMemo(() => buildTimelineEvents(entities), [entities]);

  return { loading, dbGraphData, dbCompetitors, entities, timelineEvents };
}
