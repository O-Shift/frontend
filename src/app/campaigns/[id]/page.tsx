'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  fetchCampaign,
  campaignThemes,
  campaignPlatforms,
  campaignDateRange,
  type Campaign,
  type CampaignPost,
} from '@/lib/api';
import { getPostArtwork, getDeckArtwork } from '@/lib/campaign-artwork';

// The CSS variable is what makes globals.css's var(--font-playfair, fallback)
// resolve on this route; the class must be mounted for the variable to exist.
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700', '800'], style: ['normal', 'italic'], variable: '--font-playfair' });

type SlideProps = { campaign: Campaign };

/**
 * Deck ink tones. Tiles pick one by hash so a post keeps its fill across
 * renders. Every tone gradates down to near-black, so none of them is black
 * itself — that would render a flat, unreadable tile.
 */
const TILE_TONES = ['#9c1c31', '#0033a0', '#3d5a3a'];

/** Stable ink tone for a given id, so a tile keeps its colour across renders. */
function tileTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return TILE_TONES[hash % TILE_TONES.length];
}

function tileFill(seed: string): string {
  return `linear-gradient(150deg, ${tileTone(seed)} 0%, #0a0a0a 100%)`;
}

function postTileBg(post: CampaignPost, campaignFallback?: Campaign, darkOverlay = true): string {
  const imgUrl = getPostArtwork(post, campaignFallback);
  const fallback = tileFill(post.id);
  if (!imgUrl) {
    return darkOverlay
      ? `linear-gradient(to top, rgba(10,10,10,0.75) 0%, rgba(10,10,10,0.2) 60%, transparent 100%), ${fallback}`
      : fallback;
  }
  if (darkOverlay) {
    return `linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,0.2) 100%), url('${imgUrl}'), ${fallback}`;
  }
  return `linear-gradient(to top, rgba(10,10,10,0.4) 0%, transparent 100%), url('${imgUrl}'), ${fallback}`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function dateRangeLabel(campaign: Campaign): string {
  const { start: rawStart, end: rawEnd } = campaignDateRange(campaign);
  const start = formatDate(rawStart);
  const end = formatDate(rawEnd);
  if (start && end) return start === end ? start : `${start} – ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Through ${end}`;
  const detected = formatDate(campaign.detected_at);
  return detected ? `Detected ${detected}` : 'No dates recorded';
}

/**
 * Confidence is the clustering engine's certainty that these posts are one
 * campaign. It replaces the status/cluster labels this deck used to show: the
 * API returns neither, so both rendered as constants on every campaign.
 */
function confidenceLabel(campaign: Campaign): string {
  const c = campaign.confidence;
  if (c >= 70) return `${c}% confidence`;
  if (c >= 40) return `${c}% confidence · tentative`;
  return `${c}% confidence · weak signal`;
}

/** Leading theme, or a neutral label when the engine recorded none. */
function themeLabel(campaign: Campaign): string {
  return campaignThemes(campaign)[0] ?? 'Uncategorised';
}

/** Groups captured posts by platform, keeping the first spelling seen as the label. */
function postCountsByPlatform(posts: CampaignPost[]): Map<string, { label: string; count: number }> {
  const counts = new Map<string, { label: string; count: number }>();
  for (const post of posts) {
    const raw = (post.platform || post.source || '').trim() || 'Unattributed';
    const key = raw.toLowerCase();
    const seen = counts.get(key);
    if (seen) {
      seen.count += 1;
    } else {
      counts.set(key, { label: raw, count: 1 });
    }
  }
  return counts;
}

/** Marks deck furniture that is styling, not a fact about this campaign. */
function SampleBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(10,10,10,0.55)',
        color: '#f3eedf',
        border: '1px solid rgba(243,238,223,0.35)',
        borderRadius: 4,
        padding: '3px 8px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: 'uppercase',
        fontFamily: 'var(--font-inter)',
      }}
    >
      {label}
    </span>
  );
}

function DeckMessage({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f3eedf', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '120px 8% 6% 8%', textAlign: 'center' }}>
      {icon}
      <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#0a0a0a', fontWeight: 700, fontFamily: 'var(--font-playfair)', margin: 0, letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <p style={{ fontSize: 'clamp(14px, 1.8vw, 18px)', color: '#555555', fontFamily: 'var(--font-inter)', margin: 0, maxWidth: 540, lineHeight: 1.5 }}>
        {body}
      </p>
      {action}
    </div>
  );
}

// ─── Slide 1: Editorial Intro with "e" cutout mask ────────────────────────────
function Slide1({ campaign }: SlideProps) {
  const [heroImg] = getDeckArtwork(campaign);

  return (
    <div style={{ width: '100%', height: '100%', background: '#f3eedf', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '120px 8% 8% 8%' }}>
      {/* Stylized lowercase cursive 'e' mask */}
      <motion.div 
        initial={{ x: '15vw', opacity: 0, scale: 0.9 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'absolute', top: '8%', right: '-4%', width: '56vw', height: '90vh', pointerEvents: 'none' }}
      >
        <svg viewBox="0 0 500 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="letter-e-clip">
              <path 
                fillRule="evenodd" 
                d="M 230,80 
                   C 140,80 70,150 70,250 
                   C 70,350 140,420 230,420 
                   C 320,420 380,360 430,270 
                   L 370,240 
                   C 330,300 290,360 230,360 
                   C 170,360 120,310 120,250 
                   C 120,230 125,210 130,190 
                   C 180,220 240,230 310,230 
                   C 390,230 450,190 450,130 
                   C 450,80 390,80 230,80 Z 
                   M 230,130 
                   C 290,130 340,150 350,170 
                   C 350,185 310,195 270,195 
                   C 210,195 160,180 140,160 
                   C 155,140 190,130 230,130 Z" 
              />
            </clipPath>
          </defs>
          {/* The letterform is filled with the campaign's hero artwork or ink tone. */}
          {heroImg ? (
            <motion.image
              href={heroImg}
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#letter-e-clip)"
              animate={{
                scale: [1.12, 1.02, 1.12],
                x: [-15, 5, -15],
                y: [-15, 5, -15]
              }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <motion.rect
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              fill={tileTone(campaign.id)}
              clipPath="url(#letter-e-clip)"
              animate={{
                scale: [1.12, 1.02, 1.12],
                x: [-15, 5, -15],
                y: [-15, 5, -15]
              }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </svg>
      </motion.div>

      <div style={{ zIndex: 10, maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.8, ease: 'easeOut' }}
          style={{
            fontSize: 13,
            letterSpacing: 2,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#9c1c31',
            fontFamily: 'var(--font-inter)',
          }}
        >
          {themeLabel(campaign)} · {confidenceLabel(campaign)}
        </motion.div>
        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(36px, 5vw, 68px)',
            fontFamily: 'var(--font-playfair)',
            color: '#0a0a0a',
            lineHeight: 1.1,
            margin: 0,
            fontWeight: 700,
            letterSpacing: '-0.02em'
          }}
        >
          {campaign.title}
        </motion.h1>
        <motion.p
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(18px, 2vw, 24px)',
            color: '#1a1a1a',
            margin: 0,
            fontWeight: 500,
            letterSpacing: '0.01em',
            fontFamily: 'var(--font-inter)'
          }}
        >
          {dateRangeLabel(campaign)}
        </motion.p>
      </div>
    </div>
  );
}

// ─── Slide 2: Overlapping Spring Photo Collage (Flying from bottom) ────────────────────────────
/** Slots the collage lays post tiles into, outermost first. */
const COLLAGE_SLOTS = [
  { top: '12%', left: '10%', width: '22vw', height: '35vh', rot: -8, delay: 0.1 },
  { top: '8%', right: '12%', width: '24vw', height: '36vh', rot: 10, delay: 0.25 },
  { bottom: '10%', left: '14%', width: '22vw', height: '38vh', rot: -6, delay: 0.55 },
  { bottom: '8%', right: '16%', width: '24vw', height: '34vh', rot: 4, delay: 0.7 },
] as const;

function Slide2({ campaign }: SlideProps) {
  // The heading is the leading theme, so the subline carries the rest. Platform
  // is a poor subline here: the collector records it as a generic "social" for
  // every post, which reads as though nothing was captured.
  const themes = campaignThemes(campaign);
  const platforms = campaignPlatforms(campaign);
  const subline =
    themes.slice(1).join(' · ') ||
    (platforms.length > 0 ? platforms.join(' · ') : 'No themes recorded');

  // Campaigns carry no artwork, so the collage is built from the posts that
  // were actually captured — the stock photography this slide used to show was
  // identical on every campaign.
  const collageItems = campaign.posts
    .slice(0, COLLAGE_SLOTS.length)
    .map((post, i) => ({ post, ...COLLAGE_SLOTS[i] }));

  return (
    <div style={{ width: '100%', height: '100%', background: '#9c1c31', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* Ink wash underlay, seeded from the campaign so it stays put across renders */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: tileFill(campaign.id),
          filter: 'blur(30px) brightness(0.5)',
          opacity: 0.6,
          zIndex: 1
        }}
      />

      {/* Collage tiles flying up from the bottom, one per captured post */}
      {collageItems.map((item) => (
        <motion.div
          key={item.post.id}
          initial={{ y: '100vh', opacity: 0, rotate: 0 }}
          animate={{ y: 0, opacity: 1, rotate: item.rot }}
          transition={{ type: 'spring', stiffness: 100, damping: 18, delay: item.delay }}
          style={{
            position: 'absolute',
            top: 'top' in item ? item.top : undefined,
            left: 'left' in item ? item.left : undefined,
            right: 'right' in item ? item.right : undefined,
            bottom: 'bottom' in item ? item.bottom : undefined,
            width: item.width,
            height: item.height,
            zIndex: 5,
            boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
            borderRadius: 8,
            overflow: 'hidden',
            background: postTileBg(item.post, campaign),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: 8,
            padding: 18,
          }}
          title={item.post.title}
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(243,238,223,0.7)', fontFamily: 'var(--font-inter)' }}>
            {item.post.platform || item.post.source}
          </span>
          {/* The clamp lives on a block child: a `-webkit-box` flex item is not
              laid out as a flex item, and its text overlapped the label above. */}
          <div style={{ fontSize: 'clamp(12px, 1.1vw, 15px)', color: '#f3eedf', fontFamily: 'var(--font-inter)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.post.title || item.post.content}
          </div>
        </motion.div>
      ))}

      {/* Center card springing up from bottom */}
      <motion.div 
        initial={{ y: '100vh', opacity: 0, scale: 0.8 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }} 
        transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.85 }}
        style={{ 
          background: '#0033a0', 
          padding: '40px 60px', 
          zIndex: 10, 
          textAlign: 'center', 
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          borderRadius: 4
        }}
      >
        <h2 style={{
          fontSize: 'clamp(36px, 5.5vw, 68px)',
          fontFamily: 'var(--font-playfair)',
          color: '#f3eedf',
          lineHeight: 1,
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          {themeLabel(campaign)}
        </h2>
        <div style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontFamily: 'var(--font-playfair)',
          color: '#ebdcb9',
          fontStyle: 'italic',
          marginTop: 12
        }}>
          {subline}
        </div>
      </motion.div>

      {campaign.posts.length === 0 && (
        <div style={{ position: 'absolute', left: '4%', bottom: 24, zIndex: 20 }}>
          <SampleBadge label="No posts captured" />
        </div>
      )}
    </div>
  );
}

// ─── Slide 3: Animated Bar Chart ────────────────────────────
function Slide3({ campaign }: SlideProps) {
  const bars = [...postCountsByPlatform(campaign.posts).values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const step = Math.max(1, Math.ceil(Math.max(...bars.map((b) => b.count), 1) / 5));
  const axisTop = step * 5;
  const ticks = [0, 1, 2, 3, 4, 5].map((i) => i * step);

  return (
    <div style={{ width: '100%', height: '100%', background: '#f3eedf', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 8% 6% 8%' }}>
      <motion.h2
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          fontSize: 'clamp(24px, 4vw, 40px)',
          color: '#0a0a0a',
          marginBottom: 80,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-playfair)',
          textAlign: 'center'
        }}
      >
        Captured Posts by Platform
      </motion.h2>

      {bars.length === 0 ? (
        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#555555', fontFamily: 'var(--font-inter)', margin: 0, textAlign: 'center', maxWidth: 520, lineHeight: 1.5 }}>
          No posts have been captured for this campaign yet, so there is nothing to chart.
        </p>
      ) : (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(16px, 4vw, 48px)', height: '42vh', width: '100%', maxWidth: 650, position: 'relative' }}>
         {/* Y-Axis Value Labels & Grid Lines */}
         {ticks.map((val, i) => (
           <motion.div
             key={i}
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: i * 0.08, duration: 0.5 }}
             style={{ position: 'absolute', bottom: `${(val/axisTop)*100}%`, left: 0, right: 0, borderBottom: '1px solid rgba(10,10,10,0.1)' }}
           >
             <span style={{ position: 'absolute', left: -44, bottom: -9, fontSize: 15, color: '#1a1a1a', fontWeight: 600, fontFamily: 'var(--font-inter)' }}>
               {val}
             </span>
           </motion.div>
         ))}

         {/* Legend Tag */}
         <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.5 }}
           style={{ position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 10 }}
         >
             <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#0033a0' }} />
             <span style={{ fontSize: 16, color: '#1a1a1a', fontWeight: 600, fontFamily: 'var(--font-inter)' }}>Posts captured</span>
         </motion.div>

         {/* Bars */}
         {bars.map((bar, i) => (
           <div key={bar.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, height: '100%', justifyContent: 'flex-end' }}>
             <motion.div
               initial={{ scaleY: 0 }}
               animate={{ scaleY: 1 }}
               transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.4 + i * 0.15 }}
               style={{
                 width: '100%',
                 background: '#0033a0',
                 borderRadius: '6px 6px 0 0',
                 height: `${(bar.count / axisTop) * 100}%`,
                 originY: 1,
               }}
               whileHover={{ scale: 1.05, filter: 'brightness(1.15)' }}
             />
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.8 + i * 0.1 }}
               style={{ marginTop: 20, fontSize: 18, color: '#0a0a0a', fontWeight: 700, fontFamily: 'var(--font-inter)', textAlign: 'center', wordBreak: 'break-word' }}
             >
               {bar.label}
             </motion.div>
           </div>
         ))}
      </div>
      )}
    </div>
  );
}

// ─── Slide 4: Strategic Quote Overlay ────────────────────────────
function Slide4({ campaign }: SlideProps) {
  const themes = campaignThemes(campaign);
  const quote =
    campaign.description?.trim() ||
    (themes.length > 0
      ? `Recurring themes across this campaign: ${themes.join(', ')}.`
      : 'No description has been recorded for this campaign.');
  const [heroImg] = getDeckArtwork(campaign);

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'flex-end',
        overflow: 'hidden'
      }}
    >
      <motion.div
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: heroImg ? `url('${heroImg}')` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          background: heroImg ? undefined : tileFill(campaign.id),
        }}
      />
      {/* Spotify-style deep solid blue-to-transparent overlay */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to top, rgba(0, 51, 160, 0.95) 0%, rgba(0, 51, 160, 0.5) 45%, transparent 95%)',
          zIndex: 1
        }} 
      />
      <div 
        style={{ 
          zIndex: 10, 
          padding: '8% 8% 10% 8%', 
          maxWidth: 950 
        }}
      >
        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{
            fontSize: 'clamp(24px, 4.5vw, 48px)',
            color: '#ffffff',
            lineHeight: 1.25,
            fontWeight: 400,
            letterSpacing: '-0.015em',
            fontFamily: 'var(--font-playfair)',
            margin: 0
          }}
        >
          {quote}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.9 }}
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontFamily: 'var(--font-inter)',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {themeLabel(campaign)} · {confidenceLabel(campaign)}
          </span>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Slide 5: Products Showcase Grid ────────────────────────────
function Slide5({ campaign }: SlideProps) {
  const platforms = campaignPlatforms(campaign).slice(0, 6);
  const counts = postCountsByPlatform(campaign.posts);

  return (
    <div style={{ width: '100%', height: '100%', background: '#f3eedf', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 8% 6% 8%' }}>
       {/* Branding logo in top right corner (placed safely below close button level) */}
       <motion.div 
         initial={{ scale: 0, rotate: -180 }}
         animate={{ scale: 1, rotate: 0 }}
         transition={{ type: 'spring', stiffness: 120, damping: 15, delay: 0.3 }}
         style={{ position: 'absolute', top: 110, right: '8%' }}
       >
          <svg viewBox="0 0 100 100" width="56" height="56">
              <path fill="#0033a0" d="M 50,15 C 30,15 15,28 15,50 C 15,72 30,85 50,85 C 65,85 78,74 85,60 L 75,54 C 70,64 61,72 50,72 C 38,72 30,62 30,50 L 87,50 C 87,28 70,15 50,15 Z M 50,26 C 61,26 70,34 72,42 L 28,42 C 30,34 39,26 50,26 Z" />
          </svg>
       </motion.div>

       <div>
         <motion.h1
           initial={{ y: -40, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ type: 'spring', stiffness: 100, damping: 15 }}
           style={{
             fontSize: 'clamp(50px, 9vw, 120px)',
             fontFamily: 'var(--font-playfair)',
             color: '#0a0a0a',
             margin: 0,
             lineHeight: 0.95,
             letterSpacing: '-0.03em'
           }}
         >
           {campaign.title}
         </motion.h1>
         <motion.h2
           initial={{ x: -30, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.3 }}
           style={{
             fontSize: 'clamp(20px, 3.8vw, 44px)',
             color: '#1a1a1a',
             fontWeight: 600,
             letterSpacing: '-0.02em',
             fontFamily: 'var(--font-inter)',
             margin: '24px 0 8px 0'
           }}
         >
           {themeLabel(campaign)}
         </motion.h2>
         <motion.h2
           initial={{ x: -30, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.45 }}
           style={{
             fontSize: 'clamp(20px, 3.8vw, 44px)',
             color: '#1a1a1a',
             fontWeight: 600,
             letterSpacing: '-0.02em',
             fontFamily: 'var(--font-inter)',
             margin: 0
           }}
         >
           {dateRangeLabel(campaign)}
         </motion.h2>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(16px, 3vw, 40px)', marginTop: 60, maxWidth: 1100 }}>
         {platforms.length === 0 ? (
           <p style={{ gridColumn: '1 / -1', fontSize: 'clamp(14px, 1.8vw, 18px)', color: '#555555', fontFamily: 'var(--font-inter)', margin: 0 }}>
             No platforms have been recorded for this campaign yet.
           </p>
         ) : platforms.map((platform, i) => (
           <motion.div
             key={platform}
             initial={{ y: 80, opacity: 0, rotate: -4 }}
             animate={{ y: 0, opacity: 1, rotate: 0 }}
             transition={{ type: 'spring', stiffness: 100, damping: 14, delay: 0.6 + i * 0.15 }}
             whileHover={{ y: -10, scale: 1.02 }}
           >
             <div
               style={{
                 width: '100%',
                 aspectRatio: '2/3',
                 overflow: 'hidden',
                 boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                 borderRadius: 4,
                 background: tileFill(platform),
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 padding: 20,
                 textAlign: 'center',
               }}
             >
               <span style={{
                 fontFamily: 'var(--font-playfair)',
                 fontWeight: 700,
                 fontSize: 'clamp(22px, 3vw, 34px)',
                 color: '#f3eedf',
                 letterSpacing: '-0.01em',
                 lineHeight: 1.15,
                 wordBreak: 'break-word',
               }}>
                 {platform}
               </span>
             </div>
             <div style={{
               marginTop: 20,
               fontSize: 14,
               letterSpacing: 2,
               color: '#1a1a1a',
               fontWeight: 700,
               fontFamily: 'var(--font-inter)'
             }}>
               {(() => {
                 const count = counts.get(platform.trim().toLowerCase())?.count ?? 0;
                 return `${count} POST${count === 1 ? '' : 'S'} CAPTURED`;
               })()}
             </div>
           </motion.div>
         ))}
       </div>
    </div>
  );
}

// ─── Slide 6: Moodboard Slide ────────────────────────────
function Slide6({ campaign }: SlideProps) {
  const gridAreas = ['1 / 1 / 3 / 2', '1 / 2 / 2 / 3', '2 / 2 / 4 / 3', '3 / 1 / 4 / 2'];
  const posts = campaign.posts.slice(0, 4);
  const themes = campaignThemes(campaign).slice(0, 4);
  const themeStyles: React.CSSProperties[] = [
    { fontSize: 'clamp(28px, 4vw, 44px)', fontFamily: 'var(--font-playfair)', fontStyle: 'italic', color: '#0033a0' },
    { fontSize: 'clamp(20px, 3vw, 28px)', fontFamily: 'var(--font-inter)', fontWeight: 700, letterSpacing: 5, color: '#9c1c31', textTransform: 'uppercase' },
    { fontSize: 'clamp(32px, 4.5vw, 50px)', fontFamily: 'var(--font-playfair)', fontWeight: 800, color: '#0a0a0a', lineHeight: 1 },
    { fontSize: 'clamp(18px, 2.5vw, 24px)', fontFamily: 'var(--font-inter)', fontWeight: 500, color: '#3a3a3a', letterSpacing: '0.05em' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#f3eedf', position: 'relative', display: 'flex', flexDirection: 'column', padding: '120px 8% 6% 8%', overflow: 'hidden' }}>
      <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#0a0a0a', fontWeight: 700, fontFamily: 'var(--font-playfair)', margin: '0 0 32px 0', letterSpacing: '-0.01em' }}>
        The Moodboard
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3, 14vh)', gap: 20, flex: 1, maxWidth: 750 }}>
        {posts.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', fontSize: 'clamp(14px, 1.8vw, 18px)', color: '#555555', fontFamily: 'var(--font-inter)', margin: 0 }}>
            No posts have been captured for this campaign yet.
          </p>
        ) : posts.map((post, i) => (
          <motion.a
            key={post.id}
            href={post.url || undefined}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: i * 0.15 }}
            style={{
              gridArea: gridAreas[i],
              overflow: 'hidden',
              borderRadius: 6,
              boxShadow: '0 15px 35px rgba(0,0,0,0.12)',
              background: postTileBg(post, campaign),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 10,
              textDecoration: 'none',
              color: '#f3eedf',
            }}
            whileHover={{ scale: 1.02 }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.75, fontFamily: 'var(--font-inter)' }}>
              {post.platform || post.source || 'Captured'}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, fontFamily: 'var(--font-inter)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {post.title || post.content || 'Untitled post'}
            </span>
            <span style={{ fontSize: 11, opacity: 0.7, fontFamily: 'var(--font-inter)' }}>
              {formatDate(post.captured_at) ?? 'Capture date unknown'}
            </span>
          </motion.a>
        ))}
      </div>

      {/* Themes recorded on the campaign, styled with the deck's keyword treatments */}
      <div style={{ position: 'absolute', right: '10%', top: '28%', maxWidth: '32%', display: 'flex', flexDirection: 'column', gap: 28, zIndex: 10, textAlign: 'right' }}>
        {themes.length === 0 ? (
          <span style={{ fontSize: 'clamp(14px, 1.8vw, 18px)', color: '#555555', fontFamily: 'var(--font-inter)' }}>
            No themes recorded
          </span>
        ) : themes.map((theme, i) => (
          <motion.span
            key={theme}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.2, type: 'spring' }}
            style={themeStyles[i]}
          >
            {theme}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// ─── Slide 7: Recorded Metrics Slide ────────────────────────────
/**
 * The four figures the campaign record actually carries. This slide used to
 * show budget, spend, progress and ROI — none of which exist on the wire, so
 * all four read "Not recorded" on every campaign in the workspace.
 */
function Slide7({ campaign }: SlideProps) {
  const platforms = campaignPlatforms(campaign);
  const postCount = campaign.posts.length;
  const themes = campaignThemes(campaign);

  const metrics = [
    {
      name: 'Confidence',
      value: `${campaign.confidence}%`,
      accent: '#9c1c31',
      desc: 'How sure the clustering engine is that these posts are one campaign.',
    },
    {
      name: 'Posts captured',
      value: String(postCount),
      accent: '#0033a0',
      desc: postCount === 0 ? 'No posts were clustered into this campaign.' : 'Signals clustered into this campaign.',
    },
    {
      name: 'Platforms',
      value: platforms.length > 0 ? String(platforms.length) : 'None',
      accent: '#0a0a0a',
      desc: platforms.length > 0 ? platforms.join(' · ') : 'No platform was attributed to these posts.',
    },
    {
      name: 'Window',
      value: dateRangeLabel(campaign),
      accent: '#ebdcb9',
      desc: themes.length > 0 ? `Themes: ${themes.join(', ')}.` : 'No themes were recorded for this campaign.',
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#f3eedf', position: 'relative', display: 'flex', flexDirection: 'column', padding: '120px 8% 6% 8%', overflow: 'hidden' }}>
      <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#0a0a0a', fontWeight: 700, fontFamily: 'var(--font-playfair)', margin: '0 0 40px 0', letterSpacing: '-0.01em' }}>
        Recorded Metrics
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 30, flex: 1, alignItems: 'center', maxWidth: 1050 }}>
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.name}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: i * 0.15 }}
            whileHover={{ y: -8 }}
            style={{
              background: '#ffffff',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 15px 35px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              height: '35vh',
              minHeight: '280px',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ background: metric.accent, flex: 1, width: '100%' }} />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0a0a0a', fontFamily: 'var(--font-inter)' }}>{metric.name}</div>
              <div style={{ fontSize: metric.value.length > 12 ? 17 : 24, fontWeight: 700, color: '#0033a0', fontFamily: 'var(--font-playfair)', lineHeight: 1.2 }}>{metric.value}</div>
              <div style={{ fontSize: 13, color: '#555555', fontFamily: 'var(--font-inter)', lineHeight: 1.3, marginTop: 4 }}>{metric.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Slide 8: Sources ────────────────────────────
/**
 * The deck's closing slide is the evidence it was built from. This used to be a
 * font specimen — two cards naming Playfair and Inter — which said nothing
 * about the campaign and was identical on every one.
 */
function Slide8({ campaign }: SlideProps) {
  const posts = campaign.posts;

  return (
    <div style={{ width: '100%', height: '100%', background: '#f3eedf', position: 'relative', display: 'flex', flexDirection: 'column', padding: '120px 8% 6% 8%', overflow: 'hidden' }}>
      <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#0a0a0a', fontWeight: 700, fontFamily: 'var(--font-playfair)', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
        Sources
      </h2>
      <p style={{ fontSize: 14, color: '#555555', fontFamily: 'var(--font-inter)', margin: '0 0 32px 0' }}>
        {posts.length === 0
          ? 'No posts were clustered into this campaign.'
          : `Every claim in this deck comes from ${posts.length} captured post${posts.length === 1 ? '' : 's'}.`}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1050, overflowY: 'auto', paddingRight: 8 }}>
        {posts.map((post, i) => (
          <motion.a
            key={post.id}
            href={post.url || undefined}
            target={post.url ? '_blank' : undefined}
            rel={post.url ? 'noopener noreferrer' : undefined}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 110, damping: 16, delay: i * 0.08 }}
            whileHover={post.url ? { x: 6 } : undefined}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 18,
              background: '#ffffff',
              borderRadius: 8,
              padding: '16px 20px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
              textDecoration: 'none',
              cursor: post.url ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9c1c31', fontFamily: 'var(--font-inter)', fontVariantNumeric: 'tabular-nums' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#0a0a0a', fontFamily: 'var(--font-inter)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {post.title || post.content || 'Untitled post'}
              </span>
              <span style={{ display: 'block', fontSize: 12, color: '#555555', fontFamily: 'var(--font-inter)', marginTop: 3 }}>
                {(post.platform || post.source || 'Unattributed')}
                {formatDate(post.captured_at) ? ` · captured ${formatDate(post.captured_at)}` : ''}
              </span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: post.url ? '#0033a0' : '#999999', fontFamily: 'var(--font-inter)', whiteSpace: 'nowrap' }}>
              {post.url ? 'Open ↗' : 'No link'}
            </span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

export default function WrappedCampaignPage() {
    const params = useParams();
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isExiting, setIsExiting] = useState(false);
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);

    const rawId = params.id;
    const campaignId = Array.isArray(rawId) ? rawId[0] : rawId;

    useEffect(() => {
        if (!campaignId) return;
        let cancelled = false;
        fetchCampaign(campaignId).then((res) => {
            if (cancelled) return;
            if (res.ok) {
                setCampaign(res.data);
                setNotFound(false);
                setError(null);
            } else if (res.status === 404) {
                setNotFound(true);
                setCampaign(null);
                setError(null);
            } else {
                setError(res.error);
                setCampaign(null);
                setNotFound(false);
            }
            setIsLoading(false);
        });
        return () => { cancelled = true; };
    }, [campaignId]);

    const totalSlides = 8;

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            router.back();
        }, 850);
    };

    const nextSlide = () => {
        if (isExiting) return;
        setDirection(1);
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(s => s + 1);
        } else {
            handleClose();
        }
    };

    const prevSlide = () => {
        if (isExiting) return;
        setDirection(-1);
        setCurrentSlide(s => Math.max(0, s - 1));
    };

    useEffect(() => {
        if (isExiting || !campaign) return;
        const timer = setTimeout(() => {
            nextSlide();
        }, 6000);
        return () => clearTimeout(timer);
    }, [currentSlide, isExiting, campaign]);

    useEffect(() => {
        if (isExiting) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            } else if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide, isExiting]);

    const handleTap = (e: React.MouseEvent) => {
        if (isExiting) return;
        const x = e.clientX;
        const width = window.innerWidth;
        if (x < width / 3) {
            prevSlide();
        } else {
            nextSlide();
        }
    };

    const Slides = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8];
    const CurrentComponent = Slides[currentSlide];

    // Every hook above runs unconditionally; these early returns come after them.
    // The deck renders campaign data on all eight slides, so there is nothing to
    // show until the fetch resolves — and `campaign` stays null on both failure
    // paths, which is what the type error at CurrentComponent was pointing at.
    if (isLoading || notFound || error) {
        const heading = notFound
            ? 'Campaign not found'
            : error
              ? 'Could not load this campaign'
              : 'Loading campaign…';
        // A 404 means the id is not in this workspace — a dead link, not an
        // outage. Keeping it distinct from a transport failure tells the reader
        // whether retrying is worth anything.
        const detail = notFound
            ? 'It may have been deleted, or it belongs to a different workspace.'
            : error ?? '';
        return (
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 99999, background: '#0a0a0c',
                    fontFamily: 'var(--font-inter)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24,
                }}
            >
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 500, margin: 0 }} role={error ? 'alert' : undefined}>
                    {heading}
                </p>
                {detail ? (
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0, maxWidth: 420, textAlign: 'center' }}>
                        {detail}
                    </p>
                ) : null}
                {!isLoading ? (
                    <button
                        type="button"
                        onClick={handleClose}
                        style={{
                            marginTop: 8, padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.1)', color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)', fontSize: 14,
                        }}
                    >
                        Go back
                    </button>
                ) : null}
            </div>
        );
    }

    if (!campaign) return null;

    // Card-deck horizontal slide animation variants for transitions between slides
    const slideVariants = {
      enter: (dir: number) => ({
        x: dir > 0 ? '100%' : '-100%',
        opacity: 0,
      }),
      center: {
        x: 0,
        opacity: 1,
        transition: {
          x: { type: 'spring' as const, stiffness: 300, damping: 30 },
          opacity: { duration: 0.3 }
        }
      },
      exit: (dir: number) => ({
        x: dir > 0 ? '-40%' : '40%',
        opacity: 0,
        transition: {
          x: { duration: 0.4 },
          opacity: { duration: 0.3 }
        }
      })
    };

    return (
        <motion.div 
            onClick={handleTap}
            className={playfair.variable}
            initial={{ y: '100vh', opacity: 0 }}
            animate={isExiting ? { y: '100vh', opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
                position: 'fixed', inset: 0, zIndex: 99999, background: '#0a0a0c', cursor: 'pointer',
                fontFamily: 'var(--font-inter)',
                userSelect: 'none',
                overflow: 'hidden'
            }}
        >
            <style jsx global>{`
                @keyframes progress-fill {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .slide-progress-bar {
                    height: 100%;
                    border-radius: 2px;
                }
                .slide-progress-bar.active {
                    animation: progress-fill 6s linear forwards;
                }
                .slide-progress-bar.completed {
                    width: 100% !important;
                }
                .slide-progress-bar.pending {
                    width: 0% !important;
                }
            `}</style>

            {/* Progress Bars */}
            <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', gap: 8, zIndex: 100000 }}>
                {Array.from({ length: totalSlides }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 4, background: currentSlide === 3 ? 'rgba(255,255,255,0.25)' : 'rgba(10,10,10,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                        <div
                            className={`slide-progress-bar ${i < currentSlide ? 'completed' : i === currentSlide ? 'active' : 'pending'}`}
                            style={{ 
                                background: currentSlide === 3 ? '#ffffff' : '#0033a0',
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Close Button */}
            <div 
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                style={{ 
                  position: 'absolute', 
                  top: 40, 
                  right: 24, 
                  zIndex: 100000, 
                  padding: 10, 
                  cursor: 'pointer', 
                  background: currentSlide === 3 ? 'rgba(255,255,255,0.12)' : 'rgba(10,10,10,0.06)', 
                  borderRadius: '50%', 
                  backdropFilter: 'blur(8px)',
                  border: currentSlide === 3 ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(10,10,10,0.08)'
                }}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={currentSlide === 3 ? '#ffffff' : '#0a0a0a'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>

            {/* Slide Container (with Framer Motion slide deck transitions) */}
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <AnimatePresence custom={direction} mode="popLayout">
                    <motion.div
                        key={currentSlide}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <CurrentComponent campaign={campaign} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
