'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { Chess, Square } from 'chess.js';
import { FaChessKing, FaChessQueen, FaChessRook, FaChessBishop, FaChessKnight, FaChessPawn } from 'react-icons/fa';

const pieceValues: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 1000 };

type BoardState = ReturnType<Chess['board']>;
const EMPTY_BOARD: BoardState = [];

function evalBoard(board: BoardState): number {
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

function getCapturedPieces(board: BoardState) {
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

export default function Chess404({ onExit }: { onExit: () => void }) {
  const [game, setGame] = useState<Chess | null>(null);
  const [board, setBoard] = useState<BoardState>(EMPTY_BOARD);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validDestinations, setValidDestinations] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState('');
  const [overlayHost] = useState<HTMLElement | null>(() => document.getElementById('not-found-container'));

  const initGame = async () => {
    const { Chess: ChessCtor } = await import('chess.js');
    const g = new ChessCtor();
    setGame(g); setBoard(g.board());
    setSelectedSquare(null); setValidDestinations([]);
    setGameStatus('Your turn');
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initGame awaits the chess.js dynamic import; setState fires post-await
    initGame();
  }, []);

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
      const mvs = game.moves({ square: sq as Square, verbose: true });
      setValidDestinations(mvs.map((m) => m.to));
    } else { setSelectedSquare(null); setValidDestinations([]); }
  };

  const { capturedW, capturedB } = getCapturedPieces(board);

  return (
    <>
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
          fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', color: 'var(--text-primary)',
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
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '12px'
        }}>
          {[...Array(8)].map((_, r) => [...Array(8)].map((_, c) => {
            const sq = `${String.fromCharCode(97 + c)}${8 - r}`;
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
                  backgroundColor: isDark ? 'var(--text-primary)' : 'transparent',
                  opacity: isDark ? 0.06 : 1,
                  boxShadow: 'inset 0 0 1px var(--border-color)',
                  transition: 'background-color 0.2s ease, opacity 0.2s ease',
                  zIndex: 1
                }}
              />
            );
          }))}

          {[...Array(8)].map((_, r) => [...Array(8)].map((_, c) => {
            const p = board[r]?.[c];
            const sq = `${String.fromCharCode(97 + c)}${8 - r}`;
            const isSel = selectedSquare === sq;
            const isDest = validDestinations.includes(sq);

            return (
              <div
                key={`pieces-layer-${sq}`}
                style={{
                  position: 'absolute',
                  top: `${r * 12.5}%`, left: `${c * 12.5}%`,
                  width: '12.5%', height: '12.5%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 2
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
                        color: p.color === 'w' ? 'var(--accent)' : 'var(--text-primary)',
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
          fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', color: 'var(--text-primary)',
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

      {overlayHost && createPortal(
        <>
          {/* Status Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ position: 'absolute', top: '4%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 30 }}
          >
            <div style={{
              fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)',
              background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              padding: '8px 20px', borderRadius: '6px', border: '1px solid var(--border-color)',
              boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)'
            }}>
              {gameStatus}
            </div>
          </motion.div>

          {/* Bottom Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ position: 'absolute', bottom: '4%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 30 }}
          >
            <div style={{ display: 'flex', gap: '12px', background: 'var(--card-bg)', padding: '10px 14px', borderRadius: '8px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.1)' }}>
              <motion.button
                whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.95 }}
                onClick={initGame}
                style={{ padding: '8px 24px', fontSize: '0.9rem', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, borderRadius: '6px', transition: 'opacity 0.2s' }}
              >
                Reset
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: 'var(--item-hover)' }} whileTap={{ scale: 0.95 }}
                onClick={onExit}
                style={{ padding: '8px 24px', fontSize: '0.9rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600, borderRadius: '6px', transition: 'background-color 0.2s' }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </>,
        overlayHost
      )}
    </>
  );
}
