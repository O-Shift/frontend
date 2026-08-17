/**
 * Curated high-resolution aesthetic photography & artwork for campaign visual decks.
 * Provides rich, fast, reliable imagery matching campaign themes and keywords,
 * with fallback handling for expired third-party social tokens.
 */

import type { Campaign, CampaignPost } from './api';

// Curated high-performance Unsplash imagery collections (optimized via Unsplash image API)
const THEME_ARTWORK: Record<string, string[]> = {
  summer: [
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80', // Summer celebration
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80', // Creative office collaboration
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', // Modern workspace
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80', // Team office vibes
  ],
  office: [
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80', // Office desk
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80', // Group brainstorming
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80', // Modern meeting
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80', // Creative studio
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', // Gourmet dish
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', // Restaurant dining
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', // Fresh pizza
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', // Fresh salad
  ],
  ramadan: [
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80', // Eastern architecture
    'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80', // Dates & lantern
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80', // Lantern night
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80', // Market grocery
  ],
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', // Tech circuitry
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80', // Cyber code
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80', // Modern laptop coding
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80', // Cybersecurity
  ],
  retail: [
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80', // Fashion shopping
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80', // Storefront
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80', // Black friday sale
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80', // Retail store
  ],
  pride: [
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80', // Vibrant colors
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80', // Celebration confetti
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80', // Friends celebration
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80', // Festival night
  ],
  delivery: [
    'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=800&q=80', // Delivery scooter
    'https://images.unsplash.com/photo-1580674684081-7617f132e7b1?auto=format&fit=crop&w=800&q=80', // Package parcel
    'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80', // Fast courier
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80', // Logistics warehouse
  ],
  default: [
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80', // Marketing startup
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80', // Strategy meeting
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', // Digital charts
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80', // Presentation
  ],
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Check if an image URL is a valid, hotlinkable image (not an expired or blocked token). */
export function isHotlinkableImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  
  // TikTok signed CDN URLs block external browser requests with 403
  if (trimmed.includes('tiktokcdn') || trimmed.includes('.heic')) {
    return false;
  }
  // Generic domain pages
  if (trimmed.includes('demo.visualizer') || trimmed.endsWith('.html') || trimmed.endsWith('.htm')) {
    return false;
  }
  return true;
}

/**
 * Returns a 3-image set for a campaign deck: [cardLeft, cardRight, deckFront].
 */
export function getDeckArtwork(campaign: Campaign): [string, string, string] {
  // 1. First check if campaign posts have valid image URLs (e.g. YouTube thumbnails)
  const validThumbnails: string[] = [];
  for (const p of campaign.posts ?? []) {
    if (isHotlinkableImageUrl(p.thumbnail_url)) {
      validThumbnails.push(p.thumbnail_url!.trim());
    }
    if (Array.isArray(p.media_urls)) {
      for (const m of p.media_urls) {
        if (isHotlinkableImageUrl(m) && !validThumbnails.includes(m.trim())) {
          validThumbnails.push(m.trim());
        }
      }
    }
  }

  // 2. Determine matching theme collection
  const textToScan = [
    campaign.title,
    campaign.description || '',
    ...(campaign.metadata?.themes || []),
  ].join(' ').toLowerCase();

  let themeKey = 'default';
  if (textToScan.includes('summer') || textToScan.includes('sun') || textToScan.includes('beach') || textToScan.includes('vibe')) {
    themeKey = 'summer';
  } else if (textToScan.includes('office') || textToScan.includes('work') || textToScan.includes('career') || textToScan.includes('team')) {
    themeKey = 'office';
  } else if (textToScan.includes('food') || textToScan.includes('iftar') || textToScan.includes('recipe') || textToScan.includes('kitchen') || textToScan.includes('meal')) {
    themeKey = 'food';
  } else if (textToScan.includes('ramadan') || textToScan.includes('eid')) {
    themeKey = 'ramadan';
  } else if (textToScan.includes('tech') || textToScan.includes('disrupt') || textToScan.includes('machine learning') || textToScan.includes('ai') || textToScan.includes('software')) {
    themeKey = 'tech';
  } else if (textToScan.includes('sale') || textToScan.includes('discount') || textToScan.includes('pay day') || textToScan.includes('shop') || textToScan.includes('flash')) {
    themeKey = 'retail';
  } else if (textToScan.includes('pride') || textToScan.includes('courier') || textToScan.includes('spotlight')) {
    themeKey = 'pride';
  } else if (textToScan.includes('delivery') || textToScan.includes('grocery') || textToScan.includes('carrefour') || textToScan.includes('fast')) {
    themeKey = 'delivery';
  }

  const pool = THEME_ARTWORK[themeKey] || THEME_ARTWORK.default;
  const hash = hashString(campaign.id);

  const img0 = validThumbnails[0] || pool[hash % pool.length];
  const img1 = validThumbnails[1] || pool[(hash + 1) % pool.length];
  const img2 = validThumbnails[2] || pool[(hash + 2) % pool.length];

  return [img0, img1, img2];
}

/**
 * Returns a rich background-image CSS value with subtle contrast gradient.
 */
export function getDeckCardStyle(imageUrl: string, darkOverlay = false): React.CSSProperties {
  if (darkOverlay) {
    return {
      backgroundImage: `linear-gradient(to top, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.45) 45%, rgba(10,10,12,0.2) 100%), url('${imageUrl}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return {
    backgroundImage: `linear-gradient(to top, rgba(10,10,12,0.4) 0%, transparent 100%), url('${imageUrl}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

/** Get image for an individual post tile (e.g. on moodboards or timelines). */
export function getPostArtwork(post: CampaignPost, campaignFallback?: Campaign): string {
  if (isHotlinkableImageUrl(post.thumbnail_url)) {
    return post.thumbnail_url!.trim();
  }
  if (Array.isArray(post.media_urls) && post.media_urls.length > 0 && isHotlinkableImageUrl(post.media_urls[0])) {
    return post.media_urls[0].trim();
  }
  if (campaignFallback) {
    const [i0, _i1, _i2] = getDeckArtwork(campaignFallback);
    return i0;
  }
  const hash = hashString(post.id);
  const pool = THEME_ARTWORK.default;
  return pool[hash % pool.length];
}
