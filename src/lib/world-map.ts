/**
 * Land-mask + country-highlight utilities using world-atlas TopoJSON.
 */

import { feature } from 'topojson-client';
import countriesTopo from 'world-atlas/countries-110m.json';
import type { LngLat } from './world-map-types';

export type { LngLat } from './world-map-types';

type Ring = number[][];
type GeoPolygon = { type: 'Polygon'; coordinates: Ring[] };
type GeoMultiPolygon = { type: 'MultiPolygon'; coordinates: Ring[][] };
type GeoFeature = {
  type: 'Feature';
  id?: string | number;
  properties?: { name?: string };
  geometry: GeoPolygon | GeoMultiPolygon;
};

const countriesFC = feature(
  countriesTopo as any,
  (countriesTopo as any).objects.countries
) as unknown as { type: 'FeatureCollection'; features: GeoFeature[] };

const LAND_FEATURES = countriesFC.features;

/** Ray-casting point-in-polygon (equirectangular space) */
function pointInRing(lat: number, lng: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]; // [lng, lat]
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInFeature(lat: number, lng: number, f: GeoFeature): boolean {
  const g = f.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const poly of polys) {
    if (pointInRing(lat, lng, poly[0])) return true;
  }
  return false;
}

/**
 * Draw all country land polygons onto a canvas (equirectangular).
 * Dark = land, white = water — used to place dots on land only.
 */
export function drawWorldMapCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000000';

  const project = ([lng, lat]: number[]): [number, number] => [
    ((lng + 180) / 360) * width,
    ((90 - lat) / 180) * height,
  ];

  const drawPolygon = (rings: Ring[]) => {
    rings.forEach((ring) => {
      ctx.beginPath();
      ring.forEach((pt, i) => {
        const [x, y] = project(pt);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    });
  };

  for (const f of LAND_FEATURES) {
    const g = f.geometry;
    if (g.type === 'Polygon') drawPolygon(g.coordinates);
    else if (g.type === 'MultiPolygon') for (const poly of g.coordinates) drawPolygon(poly);
  }

  return canvas;
}

/** Returns a function to check land vs water quickly. */
export function makeLandSampler(canvas: HTMLCanvasElement): (lat: number, lng: number) => boolean {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height).data;

  return (lat: number, lng: number): boolean => {
    const normalizedLng = (((lng + 180) % 360) + 360) % 360 - 180;
    const x = Math.floor(((normalizedLng + 180) / 360) * width) % width;
    const y = Math.floor(((90 - lat) / 180) * height);
    if (y < 0 || y >= height) return false;
    return imageData[(y * width + x) * 4] < 128;
  };
}

/** Lowercase, de-accent, drop punctuation: "U.A.E." and "Côte d'Ivoire" both key cleanly. */
function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Shorthand a person (or the agent writing company.metadata) would actually
 * type, mapped onto the name world-atlas uses. Only the forms that differ —
 * anything spelled the atlas's way resolves without an entry here.
 */
const NAME_ALIASES: Record<string, string> = {
  uae: 'United Arab Emirates',
  emirates: 'United Arab Emirates',
  uk: 'United Kingdom',
  britain: 'United Kingdom',
  greatbritain: 'United Kingdom',
  england: 'United Kingdom',
  usa: 'United States of America',
  us: 'United States of America',
  unitedstates: 'United States of America',
  america: 'United States of America',
  ksa: 'Saudi Arabia',
  saudi: 'Saudi Arabia',
  kingdomofsaudiarabia: 'Saudi Arabia',
  korea: 'South Korea',
  republicofkorea: 'South Korea',
  dprk: 'North Korea',
  russianfederation: 'Russia',
  czechrepublic: 'Czechia',
  ivorycoast: "Côte d'Ivoire",
  swaziland: 'eSwatini',
  northmacedonia: 'Macedonia',
  drc: 'Dem. Rep. Congo',
  drcongo: 'Dem. Rep. Congo',
  democraticrepublicofthecongo: 'Dem. Rep. Congo',
  bosnia: 'Bosnia and Herz.',
  bosniaandherzegovina: 'Bosnia and Herz.',
  turkiye: 'Turkey',
  holland: 'Netherlands',
  burma: 'Myanmar',
  vietnam: 'Vietnam',
  southsudan: 'S. Sudan',
  westernsahara: 'W. Sahara',
  equatorialguinea: 'Eq. Guinea',
  centralafricanrepublic: 'Central African Rep.',
  dominicanrepublic: 'Dominican Rep.',
  easttimor: 'Timor-Leste',
};

/** Atlas name -> numeric id, built once from the topology's own properties. */
const NAME_INDEX: Map<string, { id: number; name: string }> = (() => {
  const index = new Map<string, { id: number; name: string }>();
  for (const f of LAND_FEATURES) {
    const name = f.properties?.name;
    const id = Number(f.id);
    // Kosovo, N. Cyprus and Somaliland carry no id, so they cannot be keyed.
    if (!name || !Number.isFinite(id)) continue;
    index.set(normalizeName(name), { id, name });
  }
  return index;
})();

export interface ResolvedCountry {
  id: number;
  /** The atlas's own spelling, so tooltips read consistently. */
  name: string;
}

/**
 * Map free-text country names onto atlas ids, dropping anything unrecognized.
 *
 * `company.metadata` is a free-form jsonb blob, so the list may hold regions
 * ("MENA", "Global") or misspellings alongside real countries. Those simply do
 * not resolve — better an unhighlighted globe than a confidently wrong one.
 * Duplicates and aliases collapse onto one entry.
 */
export function resolveCountryIds(names: string[]): ResolvedCountry[] {
  const out: ResolvedCountry[] = [];
  const seen = new Set<number>();
  for (const raw of names) {
    const key = normalizeName(raw);
    if (!key) continue;
    const hit = NAME_INDEX.get(key) ?? NAME_INDEX.get(normalizeName(NAME_ALIASES[key] ?? ''));
    if (!hit || seen.has(hit.id)) continue;
    seen.add(hit.id);
    out.push(hit);
  }
  return out;
}

/**
 * Undo the antimeridian clip so a ring is continuous in longitude.
 *
 * The atlas cuts Russia and Fiji at ±180, so their rings hold both -180 and
 * +180 and the flat-space centroid formula degenerates on the self-crossing
 * that creates. Adding a turn each time consecutive points jump more than half
 * the world makes the ring monotonic again; the caller wraps the result back.
 */
function unwrapRing(ring: Ring): Ring {
  const out: Ring = [];
  let turns = 0;
  for (let i = 0; i < ring.length; i++) {
    if (i > 0) {
      const delta = ring[i][0] - ring[i - 1][0];
      if (delta > 180) turns -= 360;
      else if (delta < -180) turns += 360;
    }
    out.push([ring[i][0] + turns, ring[i][1]]);
  }
  return out;
}

/**
 * Rough centre of a country, for placing a marker on it.
 *
 * Uses the polygon centroid of its largest ring rather than averaging all of
 * them, so an outlying island does not drag the marker into the sea. Returns
 * null for an id the atlas does not carry.
 */
export function countryCentroid(id: number): { lat: number; lng: number } | null {
  const f = LAND_FEATURES.find((x) => Number(x.id) === id);
  if (!f) return null;
  const g = f.geometry;
  const rings = (g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((p) => p[0]))
    .map(unwrapRing);

  let best: Ring | null = null;
  let bestArea = 0;
  for (const ring of rings) {
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    }
    area = Math.abs(area / 2);
    if (area > bestArea) { bestArea = area; best = ring; }
  }
  if (!best || bestArea === 0) return null;

  let cx = 0, cy = 0, signed = 0;
  for (let i = 0, j = best.length - 1; i < best.length; j = i++) {
    const cross = best[j][0] * best[i][1] - best[i][0] * best[j][1];
    signed += cross;
    cx += (best[j][0] + best[i][0]) * cross;
    cy += (best[j][1] + best[i][1]) * cross;
  }
  if (signed === 0) return null;
  const lng = cx / (3 * signed);
  return { lng: ((((lng + 180) % 360) + 360) % 360) - 180, lat: cy / (3 * signed) };
}
/**
 * Returns a function that checks if a lat/lng point falls inside any
 * of the highlighted countries (identified by UN M49 / ISO 3166-1 numeric IDs).
 */
export function makeCountryHighlighter(highlightedIds: number[]): (lat: number, lng: number) => boolean {
  const highlightedFeatures = LAND_FEATURES.filter((f) =>
    highlightedIds.includes(Number(f.id))
  );
  return (lat: number, lng: number): boolean => {
    for (const f of highlightedFeatures) {
      if (pointInFeature(lat, lng, f)) return true;
    }
    return false;
  };
}

/**
 * Returns the ID of the first highlighted country containing the lat/lng,
 * or null if none. Used for hover detection.
 */
export function makeCountryIdSampler(
  highlightedIds: number[]
): (lat: number, lng: number) => number | null {
  const entries = LAND_FEATURES
    .filter((f) => highlightedIds.includes(Number(f.id)))
    .map((f) => ({ id: Number(f.id), feature: f }));

  return (lat: number, lng: number): number | null => {
    for (const { id, feature } of entries) {
      if (pointInFeature(lat, lng, feature)) return id;
    }
    return null;
  };
}
