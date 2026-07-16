'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chess } from 'chess.js';
import { useRouter } from 'next/navigation';
import { Poppins } from 'next/font/google';
import { FaChessKing, FaChessQueen, FaChessRook, FaChessBishop, FaChessKnight, FaChessPawn } from 'react-icons/fa';

const poppins = Poppins({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'] });

const pieceValues: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 1000 };

function evalBoard(board: any[][]): number {
  let s = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]; if (!p) continue;
    const v = pieceValues[p.type] + ((r === 3 || r === 4) && (c === 3 || c === 4) ? 2 : 0);
    s += p.color === 'w' ? v : -v;
  }
  return s;
}

function getBestMove(chess: Chess): string | null {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;
  let best: string | null = null, bestVal = Infinity;
  const fen = chess.fen();
  for (const mv of [...moves].sort(() => Math.random() - 0.5)) {
    chess.move(mv.san);
    if (chess.isCheckmate()) { chess.load(fen); return mv.san; }
    const replies = chess.moves({ verbose: true });
    let rv = -Infinity;
    if (!replies.length) rv = chess.isCheckmate() ? -Infinity : 0;
    else for (const r of replies) {
      chess.move(r.san);
      const sc = evalBoard(chess.board());
      if (sc > rv) rv = sc;
      chess.load(fen); chess.move(mv.san);
    }
    chess.load(fen);
    if (rv < bestVal) { bestVal = rv; best = mv.san; }
  }
  return best || moves[0].san;
}

const PieceGraphics: Record<string, React.ElementType> = {
  k: FaChessKing,
  q: FaChessQueen,
  r: FaChessRook,
  b: FaChessBishop,
  n: FaChessKnight,
  p: FaChessPawn
};

export default function NotFoundPage() {
  const router = useRouter();
  const [isChess, setIsChess] = useState(false);
  const [showPieces, setShowPieces] = useState(false);

  // Chess state
  const [game, setGame] = useState<Chess | null>(null);
  const [board, setBoard] = useState<any[][]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validDestinations, setValidDestinations] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState('');

  const initGame = () => {
    const g = new Chess();
    setGame(g); setBoard(g.board());
    setSelectedSquare(null); setValidDestinations([]);
    setGameStatus('Your turn');
  };

  useEffect(() => {
    if (isChess) {
      initGame();
      setTimeout(() => setShowPieces(true), 600); // Wait for morph
    } else {
      setShowPieces(false);
    }
  }, [isChess]);

  const handleSquareClick = (sq: string) => {
    if (!game || game.isGameOver()) return;
    if (validDestinations.includes(sq) && selectedSquare) {
      try {
        game.move({ from: selectedSquare, to: sq, promotion: 'q' });
        setBoard(game.board()); setSelectedSquare(null); setValidDestinations([]);
        if (game.isGameOver()) {
          setGameStatus(game.isCheckmate() ? 'You win!' : 'Draw!');
          return;
        }
        setGameStatus('AI thinking...');
        setTimeout(() => {
          const ai = getBestMove(game);
          if (ai) { game.move(ai); setBoard(game.board()); }
          setGameStatus(game.isGameOver() ? (game.isCheckmate() ? 'AI wins!' : 'Draw!') : 'Your turn');
        }, 50);
      } catch (e) { console.error(e); }
      return;
    }
    const row = 8 - parseInt(sq[1], 10);
    const col = sq.charCodeAt(0) - 97;
    const piece = board[row]?.[col];
    if (piece && piece.color === 'w') {
      setSelectedSquare(sq);
      const mvs = game.moves({ square: sq as any, verbose: true }) as any[];
      setValidDestinations(mvs.map((m: any) => m.to));
    } else { setSelectedSquare(null); setValidDestinations([]); }
  };

  const checkerboardStyle = {
    background: 'conic-gradient(#111 90deg, var(--accent) 90deg 180deg, #111 180deg 270deg, var(--accent) 270deg) 0 0 / 25% 25%',
    backgroundRepeat: 'repeat'
  };

  const foilStyle = {
    backgroundImage: `url('https://images.unsplash.com/photo-1618365908648-e71bd5716cba?q=80&w=1000')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a0a0a', color: '#ffffff',
      fontFamily: poppins.style.fontFamily,
      padding: '2vw', boxSizing: 'border-box'
    }}>
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', background: '#111111'
      }}>
        
        {/* Top Nav */}
        <div style={{ position: 'absolute', top: '32px', left: '32px', right: '32px', display: 'flex', justifyContent: 'space-between', zIndex: 20 }}>
          <button style={{ 
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', 
            borderRadius: '999px', padding: '10px 28px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.05em'
          }}>
            = MENU
          </button>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.05em', color: '#fff' }}>OSHIFT</div>
        </div>

        {/* 404 Graphic Container */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, marginTop: '-5vh' }}>
          
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
            fontSize: 'clamp(150px, 28vw, 380px)', fontWeight: 900, lineHeight: 1, zIndex: 1
          }}>
            <motion.div
              animate={isChess ? { x: '-100vw', opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={!isChess ? foilStyle : {}}
            >
              4
            </motion.div>

            <motion.div
              layout
              onClick={() => !isChess && setIsChess(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
                margin: '0 2vw',
                ...(isChess ? {
                  position: 'absolute', inset: 0, margin: 'auto',
                  width: 'min(75vh, 90vw)', height: 'min(75vh, 90vw)',
                  maxWidth: '800px', maxHeight: '800px', cursor: 'default',
                  ...checkerboardStyle
                } : {
                  position: 'relative', cursor: 'pointer', display: 'inline-block',
                  ...foilStyle
                })
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {!isChess && "0"}

              {isChess && showPieces && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ width: '100%', height: '100%', position: 'relative' }}
                >
                  {[...Array(8)].map((_, r) => [...Array(8)].map((_, c) => {
                    const p = board[r]?.[c];
                    const sq = `${String.fromCharCode(97 + c)}${8 - r}`;
                    const isSel = selectedSquare === sq;
                    const isDest = validDestinations.includes(sq);
                    return (
                      <div
                        key={sq}
                        onClick={() => handleSquareClick(sq)}
                        style={{
                          position: 'absolute',
                          top: `${r * 12.5}%`, left: `${c * 12.5}%`,
                          width: '12.5%', height: '12.5%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          background: isSel ? 'rgba(0, 255, 0, 0.4)' : isDest ? 'rgba(255, 0, 0, 0.4)' : 'transparent',
                        }}
                      >
                        {p && (() => {
                          const PieceIcon = PieceGraphics[p.type];
                          return (
                            <div style={{
                              fontSize: 'clamp(28px, 6.5vmin, 64px)',
                              color: p.color === 'w' ? '#ffffff' : '#111111',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <PieceIcon style={{ stroke: p.color === 'w' ? '#111111' : '#ffffff', strokeWidth: '16px' }} />
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }))}
                </motion.div>
              )}
            </motion.div>

            <motion.div
              animate={isChess ? { x: '100vw', opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={!isChess ? foilStyle : {}}
            >
              4
            </motion.div>
          </div>

          {/* Speech Bubbles and Stickers */}
          {!isChess && (
            <>
              {/* Left Bubble */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: -10 }}
                style={{
                  position: 'absolute', top: '15%', left: '-5%', background: '#fff', color: '#000',
                  padding: '8px 20px', borderRadius: '999px', fontSize: 'clamp(0.7rem, 1.2vw, 1rem)', fontWeight: 800,
                  whiteSpace: 'nowrap', zIndex: 15, border: '2px solid #000', filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,1))'
                }}
              >
                DAMN WHAT HAPPENED ?!
              </motion.div>

              {/* Right Bubble */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 20 }} animate={{ opacity: 1, scale: 1, rotate: 12 }}
                style={{
                  position: 'absolute', bottom: '25%', right: '-8%', background: '#fff', color: '#000',
                  padding: '8px 20px', borderRadius: '999px', fontSize: 'clamp(0.7rem, 1.2vw, 1rem)', fontWeight: 800,
                  whiteSpace: 'nowrap', zIndex: 15, border: '2px solid #000', filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,1))'
                }}
              >
                SOME ERROR OR SOMETHING?
              </motion.div>

              {/* Stickers */}
              <div style={{ position: 'absolute', top: '45%', left: '30%', fontSize: '4.5rem', zIndex: 12, filter: 'drop-shadow(2px 2px 0 white) drop-shadow(-2px -2px 0 white) drop-shadow(2px -2px 0 white) drop-shadow(-2px 2px 0 white)', transform: 'rotate(-15deg)' }}>🍄</div>
              <div style={{ position: 'absolute', top: '15%', right: '35%', fontSize: '3.5rem', zIndex: 12, filter: 'drop-shadow(2px 2px 0 white) drop-shadow(-2px -2px 0 white) drop-shadow(2px -2px 0 white) drop-shadow(-2px 2px 0 white)', transform: 'rotate(25deg)' }}>🌸</div>
            </>
          )}
        </div>

        {/* Footer Text & Button */}
        {!isChess && (
          <div style={{ position: 'absolute', bottom: '12%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', zIndex: 10 }}>
            <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', maxWidth: '420px', lineHeight: 1.6, fontWeight: 500 }}>
              We apologize for the inconvenience you experienced, our specialists are already working on solving this problem
            </p>
            <button
              onClick={() => router.push('/')}
              style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '999px', padding: '12px 36px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s', filter: 'drop-shadow(0 4px 10px rgba(255,255,255,0.1))' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Go back home
            </button>
          </div>
        )}

        {/* Floating Book a Call Button */}
        {!isChess && (
          <button style={{
            position: 'absolute', bottom: '32px', right: '32px', width: '80px', height: '80px',
            background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '50%',
            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', zIndex: 20,
            boxShadow: '0 10px 30px rgba(255, 90, 0, 0.4)', transition: 'transform 0.2s',
            lineHeight: 1.2
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Book a<br/>call
          </button>
        )}

        {/* Chess Overlays */}
        <AnimatePresence>
          {isChess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{ position: 'absolute', bottom: '5%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 30 }}
            >
              <div style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.05em' }}>{gameStatus}</div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={initGame} style={{ padding: '8px 24px', fontSize: '0.9rem', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 600, borderRadius: '4px' }}>Reset</button>
                <button onClick={() => { setIsChess(false); setShowPieces(false); }} style={{ padding: '8px 24px', fontSize: '0.9rem', background: 'transparent', color: '#fff', border: '1px solid #fff', cursor: 'pointer', fontWeight: 600, borderRadius: '4px' }}>Close</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
