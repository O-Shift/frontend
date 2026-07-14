'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700', '800'], style: ['normal', 'italic'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const CLUSTERS = [
  { id: 'holiday', name: 'Holiday Seasons' },
  { id: 'tech',    name: 'Tech Product Launches' },
  { id: 'sports',  name: 'Sports & eSports' },
];

function getMockCampaign(idStr: string) {
    const id = parseInt(idStr, 10) || 0;
    const cluster = CLUSTERS[id % CLUSTERS.length];
    return {
        id,
        cluster,
        title: `${cluster.name.split(' ')[0]} Trends`,
    };
}

// ─── Slide 1: Editorial Intro with "e" cutout mask ────────────────────────────
function Slide1() {
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
          <motion.image
            href="/mushroom_botanical.png"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#letter-e-clip)"
            animate={{ 
              scale: [1.12, 1.02, 1.12], 
              x: [-15, 5, -15], 
              y: [-15, 5, -15] 
            }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
      </motion.div>

      <div style={{ zIndex: 10, maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <motion.h1 
          initial={{ y: 40, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          style={{ 
            fontSize: 'clamp(36px, 5vw, 68px)', 
            fontFamily: playfair.style.fontFamily, 
            color: '#0a0a0a', 
            lineHeight: 1.1, 
            margin: 0, 
            fontWeight: 700, 
            letterSpacing: '-0.02em' 
          }}
        >
          At Empee, we don't guess trends...
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
            fontFamily: inter.style.fontFamily
          }}
        >
          We watch what's moving
        </motion.p>
      </div>
    </div>
  );
}

// ─── Slide 2: Overlapping Spring Photo Collage (Flying from bottom) ────────────────────────────
function Slide2({ campaign }: any) {
  const collageItems = [
    { src: '/mushroom_fashion.png', top: '12%', left: '10%', width: '22vw', height: '35vh', rot: -8, delay: 0.1 },
    { src: '/mushroom_kids.png', top: '8%', right: '12%', width: '24vw', height: '36vh', rot: 10, delay: 0.25 },
    { src: '/mushroom_botanical.png', top: '33%', left: '32%', width: '16vw', height: '24vh', rot: 5, delay: 0.4 },
    { src: '/mushroom_corset.png', bottom: '10%', left: '14%', width: '22vw', height: '38vh', rot: -6, delay: 0.55 },
    { src: '/mushroom_kids.png', bottom: '8%', right: '16%', width: '24vw', height: '34vh', rot: 4, delay: 0.7 }
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#9c1c31', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* Blurred dynamic background underlay */}
      <div 
        style={{ 
          position: 'absolute', inset: 0, 
          backgroundImage: `url('/mushroom_kids.png')`, 
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(30px) brightness(0.4)',
          opacity: 0.65,
          zIndex: 1
        }} 
      />

      {/* Collage images flying up from the bottom */}
      {collageItems.map((item, i) => (
        <motion.div 
          key={i}
          initial={{ y: '100vh', opacity: 0, rotate: 0 }}
          animate={{ y: 0, opacity: 1, rotate: item.rot }}
          transition={{ type: 'spring', stiffness: 100, damping: 18, delay: item.delay }}
          style={{
            position: 'absolute',
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            width: item.width,
            height: item.height,
            zIndex: 5,
            boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <img 
            src={item.src} 
            alt="" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
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
          fontFamily: playfair.style.fontFamily, 
          color: '#f3eedf', 
          lineHeight: 1, 
          margin: 0, 
          letterSpacing: '-0.02em' 
        }}>
          {campaign.cluster.name}
        </h2>
        <div style={{ 
          fontSize: 'clamp(28px, 4vw, 44px)', 
          fontFamily: playfair.style.fontFamily, 
          color: '#ebdcb9', 
          fontStyle: 'italic', 
          marginTop: 12 
        }}>
          & Mycology
        </div>
      </motion.div>
    </div>
  );
}

// ─── Slide 3: Animated Bar Chart ────────────────────────────
function Slide3() {
  const bars = [
    { year: 2021, val: 0.5, h: '20%' },
    { year: 2022, val: 1.0, h: '40%' },
    { year: 2023, val: 1.5, h: '60%' },
    { year: 2024, val: 2.1, h: '84%' }
  ];

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
          fontFamily: playfair.style.fontFamily,
          textAlign: 'center'
        }}
      >
        #Goblincore TikTok Views (Approx.)
      </motion.h2>
      
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(16px, 4vw, 48px)', height: '42vh', width: '100%', maxWidth: 650, position: 'relative' }}>
         {/* Y-Axis Value Labels & Grid Lines */}
         {[0.0, 0.5, 1.0, 1.5, 2.0, 2.5].map((val, i) => (
           <motion.div 
             key={i} 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: i * 0.08, duration: 0.5 }}
             style={{ position: 'absolute', bottom: `${(val/2.5)*100}%`, left: 0, right: 0, borderBottom: '1px solid rgba(10,10,10,0.1)' }}
           >
             <span style={{ position: 'absolute', left: -44, bottom: -9, fontSize: 15, color: '#1a1a1a', fontWeight: 600, fontFamily: inter.style.fontFamily }}>
               {val.toFixed(1)}
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
             <span style={{ fontSize: 16, color: '#1a1a1a', fontWeight: 600, fontFamily: inter.style.fontFamily }}>Billion</span>
         </motion.div>
         
         {/* Bars */}
         {bars.map((bar, i) => (
           <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, height: '100%', justifyContent: 'flex-end' }}>
             <motion.div 
               initial={{ scaleY: 0 }}
               animate={{ scaleY: 1 }}
               transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.4 + i * 0.15 }}
               style={{ 
                 width: '100%', 
                 background: '#0033a0', 
                 borderRadius: '6px 6px 0 0',
                 height: bar.h,
                 originY: 1,
               }} 
               whileHover={{ scale: 1.05, filter: 'brightness(1.15)' }}
             />
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.8 + i * 0.1 }}
               style={{ marginTop: 20, fontSize: 18, color: '#0a0a0a', fontWeight: 700, fontFamily: inter.style.fontFamily }}
             >
               {bar.year}
             </motion.div>
           </div>
         ))}
      </div>
    </div>
  );
}

// ─── Slide 4: Strategic Quote Overlay ────────────────────────────
function Slide4() {
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
          backgroundImage: `url('/mushroom_kids.png')`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
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
            fontFamily: playfair.style.fontFamily,
            margin: 0
          }}
        >
          Mushroom motifs perform especially strongly in childrenswear, quilting and interiors, where whimsy, nostalgia and softness drive repeat sales.
        </motion.p>
      </div>
    </div>
  );
}

// ─── Slide 5: Products Showcase Grid ────────────────────────────
function Slide5() {
  const swatches = [
    { src: '/fabric_pattern_1.png' },
    { src: '/fabric_pattern_2.png' },
    { src: '/fabric_pattern_3.png' }
  ];

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
             fontFamily: playfair.style.fontFamily, 
             color: '#0a0a0a', 
             margin: 0, 
             lineHeight: 0.95, 
             letterSpacing: '-0.03em' 
           }}
         >
           Mushrooms
         </motion.h1>
         <motion.h2 
           initial={{ x: -30, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.3 }}
           style={{ 
             fontSize: 'clamp(20px, 3.8vw, 44px)', 
             color: '#1a1a1a', 
             fontWeight: 600, 
             marginTop: 32, 
             letterSpacing: '-0.02em',
             fontFamily: inter.style.fontFamily,
             margin: '24px 0 8px 0'
           }}
         >
           We saw it coming.
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
             fontFamily: inter.style.fontFamily,
             margin: 0
           }}
         >
           We've got the fabric.
         </motion.h2>
       </div>
       
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(16px, 3vw, 40px)', marginTop: 60, maxWidth: 1100 }}>
         {swatches.map((swatch, i) => (
           <motion.div 
             key={i}
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
                 borderRadius: 4
               }}
             >
               <img 
                 src={swatch.src} 
                 alt="" 
                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
               />
             </div>
             <div style={{ 
               marginTop: 20, 
               fontSize: 14, 
               letterSpacing: 2, 
               color: '#1a1a1a', 
               fontWeight: 700, 
               fontFamily: inter.style.fontFamily 
             }}>
               COMING SOON
             </div>
           </motion.div>
         ))}
       </div>
    </div>
  );
}

// ─── Slide 6: Moodboard Slide ────────────────────────────
function Slide6() {
  const images = [
    { src: '/mushroom_fashion.png', gridArea: '1 / 1 / 3 / 2' },
    { src: '/mushroom_botanical.png', gridArea: '1 / 2 / 2 / 3' },
    { src: '/mushroom_corset.png', gridArea: '2 / 2 / 4 / 3' },
    { src: '/mushroom_kids.png', gridArea: '3 / 1 / 4 / 2' }
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#f3eedf', position: 'relative', display: 'flex', flexDirection: 'column', padding: '120px 8% 6% 8%', overflow: 'hidden' }}>
      <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#0a0a0a', fontWeight: 700, fontFamily: playfair.style.fontFamily, margin: '0 0 32px 0', letterSpacing: '-0.01em' }}>
        The Moodboard
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3, 14vh)', gap: 20, flex: 1, maxWidth: 750 }}>
        {images.map((img, i) => (
          <motion.div 
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: i * 0.15 }}
            style={{ gridArea: img.gridArea, overflow: 'hidden', borderRadius: 6, boxShadow: '0 15px 35px rgba(0,0,0,0.12)' }}
            whileHover={{ scale: 1.02 }}
          >
            <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </motion.div>
        ))}
      </div>
      
      {/* Floating design keywords with custom delays */}
      <div style={{ position: 'absolute', right: '10%', top: '28%', display: 'flex', flexDirection: 'column', gap: 28, zIndex: 10 }}>
        <motion.span 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
          style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontFamily: playfair.style.fontFamily, fontStyle: 'italic', color: '#0033a0' }}
        >
          Whimsy
        </motion.span>
        <motion.span 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, type: 'spring' }}
          style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontFamily: inter.style.fontFamily, fontWeight: 700, letterSpacing: 5, color: '#9c1c31' }}
        >
          NOSTALGIA
        </motion.span>
        <motion.span 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, type: 'spring' }}
          style={{ fontSize: 'clamp(32px, 4.5vw, 50px)', fontFamily: playfair.style.fontFamily, fontWeight: 800, color: '#0a0a0a', lineHeight: 1 }}
        >
          Softness
        </motion.span>
        <motion.span 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, type: 'spring' }}
          style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontFamily: inter.style.fontFamily, fontWeight: 500, color: '#3a3a3a', letterSpacing: '0.05em' }}
        >
          Earthy Tones
        </motion.span>
      </div>
    </div>
  );
}

// ─── Slide 7: Color Palette Slide ────────────────────────────
function Slide7() {
  const colors = [
    { name: 'Forest Burgundy', hex: '#9c1c31', desc: 'Primary brand accent representing wild forest mushrooms.' },
    { name: 'Goblincore Blue', hex: '#0033a0', desc: 'Contrast shade representing twilight shadows and dusk.' },
    { name: 'Moss Spore Cream', hex: '#f3eedf', desc: 'Warm organic neutral background base.' },
    { name: 'Gills Ochre', hex: '#ebdcb9', desc: 'Secondary accent for organic soil details.' }
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#f3eedf', position: 'relative', display: 'flex', flexDirection: 'column', padding: '120px 8% 6% 8%', overflow: 'hidden' }}>
      <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#0a0a0a', fontWeight: 700, fontFamily: playfair.style.fontFamily, margin: '0 0 40px 0', letterSpacing: '-0.01em' }}>
        Color Palette
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 30, flex: 1, alignItems: 'center', maxWidth: 1050 }}>
        {colors.map((color, i) => (
          <motion.div
            key={i}
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
            <div style={{ background: color.hex, flex: 1, width: '100%' }} />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0a0a0a', fontFamily: inter.style.fontFamily }}>{color.name}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#888888', fontFamily: inter.style.fontFamily }}>{color.hex}</div>
              <div style={{ fontSize: 13, color: '#555555', fontFamily: inter.style.fontFamily, lineHeight: 1.3, marginTop: 4 }}>{color.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Slide 8: Typography Slide ────────────────────────────
function Slide8() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f3eedf', position: 'relative', display: 'flex', flexDirection: 'column', padding: '120px 8% 6% 8%', overflow: 'hidden' }}>
      <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#0a0a0a', fontWeight: 700, fontFamily: playfair.style.fontFamily, margin: '0 0 40px 0', letterSpacing: '-0.01em' }}>
        Typography System
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, flex: 1, maxWidth: 1050, alignItems: 'center' }}>
        {/* Playfair card */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 }}
          style={{ background: '#ffffff', borderRadius: 8, padding: 30, boxShadow: '0 15px 35px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '38vh', minHeight: '300px' }}
        >
          <div>
            <div style={{ fontSize: 13, letterSpacing: 1.5, fontWeight: 700, color: '#888888', fontFamily: inter.style.fontFamily, marginBottom: 12 }}>DISPLAY HEADERS</div>
            <div style={{ fontSize: 36, fontFamily: playfair.style.fontFamily, fontWeight: 700, color: '#0a0a0a', lineHeight: 1 }}>Playfair Display</div>
            <div style={{ fontSize: 24, fontFamily: playfair.style.fontFamily, fontStyle: 'italic', color: '#0033a0', marginTop: 4 }}>Serif Font Family</div>
          </div>
          <div style={{ fontSize: 'clamp(14px, 1.8vw, 18px)', fontFamily: playfair.style.fontFamily, color: '#333333', lineBreak: 'anywhere', margin: '20px 0', lineHeight: 1.4, letterSpacing: '0.02em' }}>
            Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
          </div>
          <div style={{ fontSize: 13, color: '#555555', fontFamily: inter.style.fontFamily, lineHeight: 1.4 }}>
            Used for bold, high-contrast editorial statements that establish layout hierarchy and capture human attention.
          </div>
        </motion.div>

        {/* Inter card */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.3 }}
          style={{ background: '#ffffff', borderRadius: 8, padding: 30, boxShadow: '0 15px 35px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '38vh', minHeight: '300px' }}
        >
          <div>
            <div style={{ fontSize: 13, letterSpacing: 1.5, fontWeight: 700, color: '#888888', fontFamily: inter.style.fontFamily, marginBottom: 12 }}>BODY & DATA</div>
            <div style={{ fontSize: 36, fontFamily: inter.style.fontFamily, fontWeight: 700, color: '#0a0a0a', lineHeight: 1, letterSpacing: '-0.02em' }}>Inter</div>
            <div style={{ fontSize: 20, fontFamily: inter.style.fontFamily, fontWeight: 500, color: '#9c1c31', marginTop: 6 }}>Sans-Serif Font Family</div>
          </div>
          <div style={{ fontSize: 'clamp(13px, 1.6vw, 16px)', fontFamily: inter.style.fontFamily, color: '#333333', letterSpacing: '-0.01em', margin: '20px 0', lineHeight: 1.4 }}>
            Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
          </div>
          <div style={{ fontSize: 13, color: '#555555', fontFamily: inter.style.fontFamily, lineHeight: 1.4 }}>
            Used for structural grid labels, quantitative axis units, and highly legible description copy across digital surfaces.
          </div>
        </motion.div>
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
    
    const campaign = getMockCampaign(params.id as string);
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
        if (isExiting) return;
        const timer = setTimeout(() => {
            nextSlide();
        }, 6000);
        return () => clearTimeout(timer);
    }, [currentSlide, isExiting]);

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
            initial={{ y: '100vh', opacity: 0 }}
            animate={isExiting ? { y: '100vh', opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
                position: 'fixed', inset: 0, zIndex: 99999, background: '#0a0a0c', cursor: 'pointer',
                fontFamily: inter.style.fontFamily,
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
