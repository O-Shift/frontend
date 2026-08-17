/**
 * Campaign Artwork & Visual Deck Styling.
 * Resolves authentic captured media (YouTube thumbnails, Supabase Storage assets,
 * direct image attachments) with zero mock/stock photo fallbacks.
 *
 * When no genuine media exists for a post/campaign, cards render clean, deterministic
 * HSL ink-tone gradients with typography.
 */

import type { Campaign, CampaignPost } from './api';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Derives a consistent, high-contrast HSL gradient for card layers when no image is available.
 * Deterministic: same seed & layer produces identical colors on server and client.
 */
export function deckGradient(seed: string, layer: number): string {
  const h = (hashString(seed) + layer * 43) % 360;
  return `linear-gradient(145deg, hsl(${h} 45% 22%), hsl(${(h + 45) % 360} 52% 11%))`;
}

function anyImageExt(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.svg') ||
    lower.includes('.jpg?') ||
    lower.includes('.jpeg?') ||
    lower.includes('.png?') ||
    lower.includes('.webp?')
  );
}

/** Check if an image URL is a valid, renderable, browser-loadable image URL. */
export function isHotlinkableImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('data:image/') &&
    !trimmed.startsWith('/')
  ) {
    return false;
  }

  const lower = trimmed.toLowerCase();

  // Browsers cannot natively decode HEIC / HEIF images
  if (lower.includes('.heic') || lower.includes('.heif')) {
    return false;
  }

  // TikTok signed CDN URLs block external browser requests with 403 Forbidden
  if (
    lower.includes('tiktokcdn') ||
    lower.includes('byteoversea') ||
    lower.includes('ibytedtos') ||
    lower.includes('muscdn')
  ) {
    return false;
  }

  // Generic mock/demo domain pages / non-image html pages
  if (
    lower.includes('demo.visualizer') ||
    lower.endsWith('.html') ||
    lower.endsWith('.htm')
  ) {
    return false;
  }

  return true;
}

/** Extracts a direct YouTube thumbnail from a watch, embed, short, or youtu.be URL. */
export function getYouTubeThumbnail(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i
  );
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
}

/** Collects all candidate real image URLs from a single campaign post. */
export function extractMediaFromPost(post: CampaignPost): string[] {
  const urls: string[] = [];

  if (isHotlinkableImageUrl(post.thumbnail_url)) {
    urls.push(post.thumbnail_url!.trim());
  }

  if (Array.isArray(post.media_urls)) {
    for (const m of post.media_urls) {
      if (isHotlinkableImageUrl(m) && !urls.includes(m.trim())) {
        urls.push(m.trim());
      }
    }
  }

  const ytThumb = getYouTubeThumbnail(post.url);
  if (ytThumb && isHotlinkableImageUrl(ytThumb) && !urls.includes(ytThumb)) {
    urls.push(ytThumb);
  }

  if (isHotlinkableImageUrl(post.url) && anyImageExt(post.url) && !urls.includes(post.url.trim())) {
    urls.push(post.url.trim());
  }

  return urls;
}

/**
 * Returns a 3-image set for a campaign deck: [cardLeft, cardRight, deckFront].
 * Returns actual captured image URLs from the campaign's posts/metadata.
 * If NO real images exist for a card, returns null (zero mock images).
 */
export function getDeckArtwork(campaign: Campaign): [string | null, string | null, string | null] {
  const validThumbnails: string[] = [];
  for (const p of campaign.posts ?? []) {
    const postMedia = extractMediaFromPost(p);
    for (const url of postMedia) {
      if (isHotlinkableImageUrl(url) && !validThumbnails.includes(url)) {
        validThumbnails.push(url);
      }
    }
  }

  const meta = campaign.metadata as Record<string, unknown> | undefined;
  if (meta) {
    const metaThumb = typeof meta.thumbnail_url === 'string' ? meta.thumbnail_url.trim() : '';
    if (isHotlinkableImageUrl(metaThumb) && !validThumbnails.includes(metaThumb)) {
      validThumbnails.push(metaThumb);
    }
    const metaImage = typeof meta.image_url === 'string' ? meta.image_url.trim() : '';
    if (isHotlinkableImageUrl(metaImage) && !validThumbnails.includes(metaImage)) {
      validThumbnails.push(metaImage);
    }
  }

  if (validThumbnails.length >= 3) {
    return [validThumbnails[0], validThumbnails[1], validThumbnails[2]];
  }
  if (validThumbnails.length === 2) {
    return [validThumbnails[0], validThumbnails[1], validThumbnails[0]];
  }
  if (validThumbnails.length === 1) {
    return [validThumbnails[0], validThumbnails[0], validThumbnails[0]];
  }

  // Zero real images captured: return null for all layers (no mock stock photos)
  return [null, null, null];
}

/**
 * Returns the card style: renders real image if provided, or a rich HSL brand gradient if null.
 */
export function getDeckCardStyle(
  imageUrl: string | null | undefined,
  seed: string,
  layer = 0,
  darkOverlay = false
): React.CSSProperties {
  const fallback = deckGradient(seed, layer);

  if (imageUrl) {
    if (darkOverlay) {
      return {
        backgroundImage: `linear-gradient(to top, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.45) 45%, rgba(10,10,12,0.15) 100%), url('${imageUrl}'), ${fallback}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      backgroundImage: `linear-gradient(to top, rgba(10,10,12,0.35) 0%, transparent 100%), url('${imageUrl}'), ${fallback}`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  if (darkOverlay) {
    return {
      backgroundImage: `linear-gradient(to top, rgba(10,10,12,0.75) 0%, rgba(10,10,12,0.2) 60%, transparent 100%), ${fallback}`,
    };
  }

  return {
    backgroundImage: fallback,
  };
}

/** Get image URL for an individual post tile (returns null when no real image exists). */
export function getPostArtwork(post: CampaignPost, campaignFallback?: Campaign): string | null {
  const postMedia = extractMediaFromPost(post);
  if (postMedia.length > 0) {
    return postMedia[0];
  }
  if (campaignFallback) {
    const [i0] = getDeckArtwork(campaignFallback);
    return i0;
  }
  return null;
}
