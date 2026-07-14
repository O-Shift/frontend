'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

  // Parallax background state
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 100, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-1, 1], [15, -15]);
  const rotateY = useTransform(smoothX, [-1, 1], [-15, 15]);
  const bgX = useTransform(smoothX, [-1, 1], [-40, 40]);
  const bgY = useTransform(smoothY, [-1, 1], [-40, 40]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

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
    background: 'conic-gradient(var(--bg-main) 90deg, var(--accent) 90deg 180deg, var(--bg-main) 180deg 270deg, var(--accent) 270deg) 0 0 / 25% 25%',
    backgroundRepeat: 'repeat'
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg-main-alt)', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: poppins.style.fontFamily, overflow: 'hidden'
    }}>
      {/* Interactive Parallax Grid */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-50%', left: '-50%',
          width: '200%', height: '200%',
          backgroundImage: 'linear-gradient(to right, var(--text-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
          opacity: 0.08,
          zIndex: 0,
          pointerEvents: 'none',
          x: bgX,
          y: bgY,
          rotateX,
          rotateY,
          transformPerspective: 1200
        }}
      />

      <div style={{ height: '5vh', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2vh', position: 'relative', zIndex: 10 }}>
        <AnimatePresence>
          {!isChess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ fontSize: '1.5rem', letterSpacing: '0.1em', fontWeight: 500 }}
            >
              Oops!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'clamp(180px, 30vw, 420px)', fontWeight: 900, lineHeight: 1, zIndex: 10
      }}>
        <motion.div
          animate={isChess ? { x: '-100vw', opacity: 0 } : { x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ userSelect: 'none', marginRight: '-5vw', zIndex: 1, textShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
        >
          4
        </motion.div>

        <motion.div
          layout
          onClick={() => !isChess && setIsChess(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            filter: isChess ? 'none' : 'drop-shadow(0 15px 40px rgba(0,0,0,0.5))',
            ...(isChess ? {
              position: 'absolute',
              inset: 0,
              margin: 'auto',
              width: 'min(75vh, 90vw)', height: 'min(75vh, 90vw)',
              maxWidth: '800px', maxHeight: '800px',
              cursor: 'default',
              ...checkerboardStyle
            } : {
              position: 'relative',
              cursor: 'pointer',
              ...checkerboardStyle,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              display: 'inline-block',
              userSelect: 'none'
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
          style={{ userSelect: 'none', marginLeft: '-5vw', zIndex: 1, textShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
        >
          4
        </motion.div>
      </div>

      <AnimatePresence>
        {isChess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ position: 'absolute', bottom: '5%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.05em' }}>{gameStatus}</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={initGame} style={{ padding: '8px 24px', fontSize: '0.9rem', background: 'var(--text-primary)', color: 'var(--bg-main-alt)', border: 'none', cursor: 'pointer', fontWeight: 600, borderRadius: '4px' }}>Reset</button>
              <button onClick={() => { setIsChess(false); setShowPieces(false); }} style={{ padding: '8px 24px', fontSize: '0.9rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--text-primary)', cursor: 'pointer', fontWeight: 600, borderRadius: '4px' }}>Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isChess && (
          <motion.img
            src="/404.png"
            alt="Mascot"
            initial={{ opacity: 0, y: 50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50, x: 50 }}
            style={{
              position: 'absolute',
              bottom: '-20%',
              right: '10%',
              height: 'clamp(300px, 45vw, 650px)',
              width: 'auto',
              objectFit: 'contain',
              zIndex: 8,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.4))'
            }}
          />
        )}
      </AnimatePresence>

      {!isChess && (
        <button
          onClick={() => router.push('/')}
          style={{
            position: 'absolute',
            bottom: '10%',
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            opacity: 0.6,
            transition: 'opacity 0.2s',
            zIndex: 20
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
        >
          Return Home
        </button>
      )}
    </div>
  );
}
