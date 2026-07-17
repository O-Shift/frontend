/**
 * Land-mask + country-highlight utilities using world-atlas TopoJSON.
 */

import { feature } from 'topojson-client';
// @ts-expect-error - world-atlas ships untyped JSON
import countriesTopo from 'world-atlas/countries-110m.json';
import type { LngLat } from './world-map-types';

export type { LngLat } from './world-map-types';

type Ring = number[][];
type GeoPolygon = { type: 'Polygon'; coordinates: Ring[] };
type GeoMultiPolygon = { type: 'MultiPolygon'; coordinates: Ring[][] };
type GeoFeature = {
  type: 'Feature';
  id?: string | number;
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
