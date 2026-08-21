import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';

export type Canvas2D = CanvasRenderingContext2D & { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void };

// ── Types ─────────────────────────────────────────────────────────────

export interface NodeMetadata {
  domain?: string;
  website?: string;
  url?: string;
  color?: string;
  is_hub?: boolean;
  description?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface DBGraphNode {
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
    is_hub?: boolean;
    [key: string]: unknown;
  };
  created_at?: string;
  updated_at?: string;
}

export interface DBGraphEdge {
  id: string;
  source: string;
  target: string;
  rel_type: string;
  source_name?: string;
  source_type?: string;
  target_name?: string;
  target_type?: string;
  weight?: number | null;
  metadata?: NodeMetadata;
}

export interface PartnershipsResponse {
  workspace_id: string;
  nodes: DBGraphNode[];
  edges: DBGraphEdge[];
  node_count: number;
  edge_count: number;
}

export interface Competitor {
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
  metadata?: NodeMetadata;
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
  metadata?: NodeMetadata;
}

export interface GraphEntity {
  id: string;
  name: string;
  domain: string;
  type: 'company' | 'influencer' | 'integration' | 'agency';
  color: string;
  isHub: boolean;
  created_at?: string;
  metadata?: NodeMetadata;
}

export interface TimelineEvent {
  id: number;
  x: number;
  dateStr: string;
  monthStr: string;
  entityId: string;
}
