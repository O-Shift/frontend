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

function getCapturedPieces(board: any[][]) {
  if (!board || board.length === 0) return { capturedW: [], capturedB: [] };
  const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type !== 'k') {
        counts[p.color as 'w' | 'b'][p.type as 'p'|'n'|'b'|'r'|'q']++;
      }
    }
  }
  const initial = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const capturedW: string[] = [];
  const capturedB: string[] = [];
  for (const t of ['q', 'r', 'b', 'n', 'p'] as const) {
    for (let i = 0; i < initial[t] - counts.w[t]; i++) capturedW.push(t);
    for (let i = 0; i < initial[t] - counts.b[t]; i++) capturedB.push(t);
  }
  return { capturedW, capturedB };
}

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
        }, 600);
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

  const { capturedW, capturedB } = getCapturedPieces(board);

  return (
    <div 
      style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg-body)', color: 'var(--text-primary)',
      fontFamily: poppins.style.fontFamily,
      padding: '2vw', boxSizing: 'border-box',
      userSelect: 'none', WebkitUserSelect: 'none'
    }}>
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        border: '1px solid var(--border-color)', borderRadius: '24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', background: 'var(--bg-main)',
      }}>
        {/* Top Text & Button */}
        {!isChess && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', zIndex: 10, marginBottom: '4vh' }}>
            <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '420px', lineHeight: 1.6, fontWeight: 600 }}>
              Looks like you hit a dead end. <br/> Play a game while we sort it out?
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 2, filter: 'drop-shadow(2px 2px 0px var(--accent))' }}
              onClick={() => router.push('/')}
              style={{ 
                background: 'var(--bg-main)', color: 'var(--text-primary)', 
                border: '2px solid var(--text-primary)', borderRadius: '999px', 
                padding: '12px 36px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', 
                filter: 'drop-shadow(4px 4px 0px var(--accent))',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              Go back home
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

            <motion.div
              layout
              onClick={() => !isChess && setIsChess(true)}
              whileHover={!isChess ? { scale: 1.05 } : {}}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
                ...(isChess ? {
                  position: 'absolute', inset: 0, margin: 'auto',
                  width: 'min(65vh, 80vw)', height: 'min(65vh, 80vw)',
                  maxWidth: '800px', maxHeight: '800px', cursor: 'default',
                  background: 'rgba(15, 23, 42, 0.4)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                } : {
                  position: 'relative', cursor: 'pointer', display: 'inline-block', margin: '0 2vw',
                  background: 'conic-gradient(var(--bg-body) 90deg, var(--accent) 90deg 180deg, var(--bg-body) 180deg 270deg, var(--accent) 270deg) 0 0 / 25% 25%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                })
              }}
            >
              {!isChess && "0"}

              {isChess && showPieces && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ width: '100%', height: '100%', position: 'relative' }}
                >
                  {/* Left Side Graveyard (White pieces captured by Black) */}
                  <div style={{ 
                    position: 'absolute', top: '10%', bottom: '10%', left: '-8vw', 
                    width: '6vw', minWidth: '50px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                    fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', color: '#fff',
                    background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid var(--border-color)', borderRadius: '16px',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)'
                  }}>
                    {capturedW.map((type, i) => {
                      const Icon = PieceGraphics[type];
                      return <Icon key={`cw-${i}`} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />;
                    })}
                  </div>

                  {/* Board Squares Container */}
                  <div style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                    {[...Array(8)].map((_, r) => [...Array(8)].map((_, c) => {
                      const p = board[r]?.[c];
                      const sq = `${String.fromCharCode(97 + c)}${8 - r}`;
                      const isSel = selectedSquare === sq;
                      const isDest = validDestinations.includes(sq);
                      const isDark = (r + c) % 2 === 1;
                      return (
                        <div
                          key={`sq-${sq}`}
                          onClick={() => handleSquareClick(sq)}
                          style={{
                            position: 'absolute',
                            top: `${r * 12.5}%`, left: `${c * 12.5}%`,
                            width: '12.5%', height: '12.5%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: isDark ? 'var(--accent)' : 'var(--bg-main)',
                            boxShadow: 'inset 0 0 1px var(--border-color)',
                            transition: 'background-color 0.2s ease',
                          }}
                        >
                          {isSel && <div style={{ position: 'absolute', inset: '4%', border: '2px solid var(--text-primary)', borderRadius: '8px', zIndex: 1, opacity: 0.8 }} />}
                          {isDest && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                            <div style={{ width: '25%', height: '25%', background: 'var(--text-primary)', borderRadius: '50%', opacity: 0.8 }} />
                          </div>}
                          
                          {p && (() => {
                            const PieceIcon = PieceGraphics[p.type];
                            return (
                              <motion.div 
                                layoutId={`piece-${p.type}-${p.color}-${sq}`}
                                style={{
                                  fontSize: 'clamp(28px, 6vmin, 60px)',
                                  color: p.color === 'w' ? '#fff' : '#111',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  zIndex: 2
                                }}>
                                <PieceIcon style={{ stroke: p.color === 'w' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', strokeWidth: '12px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5)) drop-shadow(0 1px 3px rgba(0,0,0,0.3))' }} />
                              </motion.div>
                            );
                          })()}
                        </div>
                      );
                    }))}
                  </div>

                  {/* Right Side Graveyard (Black pieces captured by White) */}
                  <div style={{ 
                    position: 'absolute', top: '10%', bottom: '10%', right: '-8vw', 
                    width: '6vw', minWidth: '50px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                    fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', color: '#111',
                    background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid var(--border-color)', borderRadius: '16px',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)'
                  }}>
                    {capturedB.map((type, i) => {
                      const Icon = PieceGraphics[type];
                      return <Icon key={`cb-${i}`} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />;
                    })}
                  </div>
                </motion.div>
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
                  position: 'absolute', top: '15%', left: '-5%', background: 'var(--bg-main)', color: 'var(--text-primary)',
                  padding: '8px 20px', borderRadius: '999px', fontSize: 'clamp(0.7rem, 1.2vw, 1rem)', fontWeight: 800,
                  whiteSpace: 'nowrap', zIndex: 15, border: '2px solid var(--text-primary)', filter: 'drop-shadow(4px 4px 0px var(--accent))', cursor: 'grab'
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
                  position: 'absolute', bottom: '25%', right: '-8%', background: 'var(--bg-main)', color: 'var(--text-primary)',
                  padding: '8px 20px', borderRadius: '999px', fontSize: 'clamp(0.7rem, 1.2vw, 1rem)', fontWeight: 800,
                  whiteSpace: 'nowrap', zIndex: 15, border: '2px solid var(--text-primary)', filter: 'drop-shadow(4px 4px 0px var(--accent))', cursor: 'grab'
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
        </div>

        {/* Chess Overlays */}
        <AnimatePresence>
          {isChess && (
            <>
              {/* Status Indicator */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ position: 'absolute', top: '4%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 30 }}
              >
                <div style={{ 
                  fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-primary)',
                  background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  padding: '10px 32px', borderRadius: '999px', border: '1px solid var(--border-color)', 
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.1)' 
                }}>
                  {gameStatus}
                </div>
              </motion.div>

              {/* Bottom Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ position: 'absolute', bottom: '4%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 30 }}
              >
                <div style={{ display: 'flex', gap: '16px', background: 'var(--card-bg)', padding: '8px', borderRadius: '999px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.1)' }}>
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: 'var(--text-primary)', color: 'var(--bg-body)' }} whileTap={{ scale: 0.95 }}
                    onClick={initGame} 
                    style={{ padding: '8px 28px', fontSize: '0.9rem', background: 'var(--text-primary)', color: 'var(--bg-body)', border: 'none', cursor: 'pointer', fontWeight: 700, borderRadius: '999px', transition: 'all 0.2s' }}
                  >
                    Reset
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: 'var(--bg-main)' }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setIsChess(false); setShowPieces(false); }} 
                    style={{ padding: '8px 28px', fontSize: '0.9rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600, borderRadius: '999px', transition: 'all 0.2s' }}
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}