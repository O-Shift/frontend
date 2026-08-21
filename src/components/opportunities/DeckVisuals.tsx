'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CompanyPile({ companies }: { companies: string[] }) {
  const [hovered, setHovered] = useState(false);
  if (!companies || companies.length === 0) return null;
  const visible = companies.slice(0, 3);
  const extra = companies.length - 3;

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 12, verticalAlign: 'middle', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg-alt)', padding: '2px', borderRadius: 999, border: '1px solid var(--border-color)', minWidth: 20 }}>
        {visible.map((domain, i) => (
          <span key={i} style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--card-bg-alt)', background: '#fff', overflow: 'hidden', marginLeft: i === 0 ? 0 : -6, zIndex: 3 - i, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} alt={domain} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.currentTarget.style.display = 'none'} />
          </span>
        ))}
        {extra > 0 && (
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 4, marginRight: 4 }}>
            +{extra}
          </span>
        )}
      </span>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px var(--shadow-color)',
              zIndex: 50,
              pointerEvents: 'none'
            }}
          >
            {companies.map(d => d.split('.')[0].charAt(0).toUpperCase() + d.split('.')[0].slice(1)).join(', ')}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

export function SeamlessBackground({ slideIndex, totalSlides }: { slideIndex: number, totalSlides: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <motion.div
        animate={{ x: `-${slideIndex * (100 / totalSlides)}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${totalSlides * 100}vw`,
          display: 'flex',
          opacity: 'var(--bg-pattern-opacity)',
        }}
      >
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '-5%', top: '-30%', width: '220vh', transform: 'rotate(85deg)' }} />
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '25%', bottom: '-40%', width: '250vh', transform: 'rotate(-60deg)' }} />
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '55%', top: '-50%', width: '240vh', transform: 'rotate(115deg)' }} />
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '72%', bottom: '-20%', width: '280vh', transform: 'rotate(-25deg)' }} />
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '90%', top: '-35%', width: '260vh', transform: 'rotate(145deg)' }} />
      </motion.div>
    </div>
  );
}

