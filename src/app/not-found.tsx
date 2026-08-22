'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Poppins } from 'next/font/google';
import dynamic from 'next/dynamic';

const Chess404 = dynamic(() => import('@/components/games/Chess404'), { ssr: false, loading: () => null });

const poppins = Poppins({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'] });

export default function NotFoundPage() {
  const router = useRouter();
  const [isChess, setIsChess] = useState(false);
  const [showPieces, setShowPieces] = useState(false);

  useEffect(() => {
    if (!isChess) return;
    setTimeout(() => setShowPieces(true), 600); // Wait for morph
  }, [isChess]);

  return (
    <div
      id="not-found-container"
      style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg-body)', color: 'var(--text-primary)',
      fontFamily: poppins.style.fontFamily,
      padding: '2vw', boxSizing: 'border-box',
      userSelect: 'none', WebkitUserSelect: 'none'
    }}>
      {/* OS Pattern Background (Full Background) */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, opacity: 'var(--bg-pattern-opacity)' }}>
        <img src="/logo.png" alt="" style={{ position: 'absolute', left: '-10%', top: '-20%', width: '150vh', transform: 'rotate(45deg)' }} />
        <img src="/logo.png" alt="" style={{ position: 'absolute', right: '-15%', bottom: '-30%', width: '180vh', transform: 'rotate(-30deg)' }} />
      </div>

      <div style={{
        position: 'relative', width: '100%', height: '100%',
        border: '1px solid var(--border-color)', borderRadius: '24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', background: 'var(--bg-main)',
        zIndex: 1
      }}>
        {/* Top Text & Button */}
        {!isChess && (
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', zIndex: 50, marginBottom: '4vh' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center', maxWidth: '420px', lineHeight: 1.6, fontWeight: 500 }}>
              Looks like you hit a dead end. <br/> Play a game while we sort it out?
            </p>
            <motion.button
              whileHover={{ opacity: 0.9, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/')}
              style={{
                background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: '6px',
                padding: '0.85rem 1.75rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)'
              }}
            >
              Go back home
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>→</span>
            </motion.button>
          </div>
        )}

        {/* 404 Graphic Container */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>

          {/* Orange Offset Shadows */}
          {!isChess && (
            <div style={{
              position: 'absolute', display: 'flex', fontSize: 'clamp(150px, 28vw, 380px)', fontWeight: 900, lineHeight: 1,
              color: 'var(--accent)', zIndex: 0, transform: 'translate(10px, 15px) scale(1.02)'
            }}>
              <div>4</div><div style={{ margin: '0 2vw' }}>0</div><div>4</div>
            </div>
          )}

          {/* Main 404 Text */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(150px, 28vw, 380px)', fontWeight: 900, lineHeight: 1, zIndex: 1,
            letterSpacing: '0.05em'
          }}>
            <motion.div
              animate={isChess ? { x: '-100vw', opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={!isChess ? {
                color: 'var(--card-bg)',
                textShadow: '2px 2px 8px rgba(0,0,0,0.15)',
                WebkitTextStroke: '1px var(--border-color)'
              } : {}}
            >
              4
            </motion.div>

            {/* The interactive "0" */}
            <motion.div
              layout
              onClick={() => !isChess && setIsChess(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20,
                ...( !isChess ? {
                  position: 'relative', cursor: 'pointer',
                  margin: '0 -2%',
                  background: 'repeating-conic-gradient(var(--card-bg) 0% 25%, var(--border-color) 0% 50%) 50% / 32px 32px',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStroke: '1px var(--border-color)',
                  filter: 'drop-shadow(8px 8px 0px rgba(0,0,0,0.15))'
                } : {
                  position: 'absolute', inset: 0, margin: 'auto',
                  width: 'min(90vw, 60vh)', height: 'min(90vw, 60vh)',
                  maxWidth: '800px', maxHeight: '800px', cursor: 'default',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.1)',
                  WebkitTextFillColor: 'initial',
                  WebkitBackgroundClip: 'initial',
                  WebkitTextStroke: 'none',
                  filter: 'none'
                })
              }}
              whileHover={!isChess ? { scale: 1.05, rotate: 3 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {!isChess && "0"}

              {isChess && showPieces && (
                <Chess404 onExit={() => { setIsChess(false); setShowPieces(false); }} />
              )}
            </motion.div>

            <motion.div
              animate={isChess ? { x: '100vw', opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={!isChess ? {
                color: 'var(--card-bg)',
                textShadow: '2px 2px 8px rgba(0,0,0,0.15)',
                WebkitTextStroke: '1px var(--border-color)'
              } : {}}
            >
              4
            </motion.div>
          </div>

          {/* Speech Bubbles and Stickers */}
          {!isChess && (
            <>
              {/* Left Bubble */}
              <motion.div
                drag dragElastic={0.5} dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }} whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
                initial={{ opacity: 0, scale: 0.8, rotate: -20, y: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: -10, y: [0, -10, 0] }}
                transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.5 }, rotate: { duration: 0.5 }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
                style={{
                  position: 'absolute', top: '15%', left: '-5%', background: 'transparent', color: 'var(--card-bg)',
                  padding: '8px 20px', fontSize: 'clamp(0.7rem, 1.2vw, 1rem)', fontWeight: 800,
                  whiteSpace: 'nowrap', zIndex: 15, border: '2px solid var(--card-bg)', filter: 'drop-shadow(4px 4px 0px var(--accent))', cursor: 'grab'
                }}
              >
                DAMN WHAT HAPPENED ?!
              </motion.div>

              {/* Right Bubble */}
              <motion.div
                drag dragElastic={0.5} dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }} whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
                initial={{ opacity: 0, scale: 0.8, rotate: 20, y: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: 12, y: [0, -10, 0] }}
                transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.5 }, rotate: { duration: 0.5 }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } }}
                style={{
                  position: 'absolute', bottom: '25%', right: '-8%', background: 'transparent', color: 'var(--card-bg)',
                  padding: '8px 20px', fontSize: 'clamp(0.7rem, 1.2vw, 1rem)', fontWeight: 800,
                  whiteSpace: 'nowrap', zIndex: 15, border: '2px solid var(--card-bg)', filter: 'drop-shadow(4px 4px 0px var(--accent))', cursor: 'grab'
                }}
              >
                SOME ERROR OR SOMETHING?
              </motion.div>

              {/* Stickers */}
              <motion.div
                drag dragElastic={0.5} dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }} whileDrag={{ scale: 1.2, cursor: 'grabbing' }}
                animate={{ y: [0, -15, 0], rotate: [-15, -5, -15] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: '45%', left: '30%', fontSize: '4.5rem', zIndex: 12, filter: 'drop-shadow(2px 2px 0 var(--text-primary)) drop-shadow(-2px -2px 0 var(--text-primary)) drop-shadow(2px -2px 0 var(--text-primary)) drop-shadow(-2px 2px 0 var(--text-primary))', cursor: 'grab' }}
              >
                💥
              </motion.div>
              <motion.div
                drag dragElastic={0.5} dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }} whileDrag={{ scale: 1.2, cursor: 'grabbing' }}
                animate={{ y: [0, -10, 0], rotate: [25, 35, 25] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                style={{ position: 'absolute', top: '15%', right: '35%', fontSize: '3.5rem', zIndex: 12, filter: 'drop-shadow(2px 2px 0 var(--text-primary)) drop-shadow(-2px -2px 0 var(--text-primary)) drop-shadow(2px -2px 0 var(--text-primary)) drop-shadow(-2px 2px 0 var(--text-primary))', cursor: 'grab' }}
              >
                💀
              </motion.div>
            </>
          )}

          {/* Clean minimal padding to separate from chess overlays */}
          <div style={{ height: '40px' }} />
        </div>
      </div>
    </div>
  );
}
