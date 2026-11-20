import React, { useEffect, useState } from 'react';
import { triggerHaptic } from '../../lib/haptics';
import {
  coordToSq,
  evaluatePosition,
  getLegalMovesForSquare,
  INITIAL_FEN,
  parseFen,
  pieceGlyph,
  toFen,
  tryMakeMove,
  type ChessMove,
  type ChessPosition,
} from './chessEngine';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function InteractiveChessBoard({
  initialFen = INITIAL_FEN,
  onUserMove,
  highlightSquares = [],
  compact = false,
  showAnalysisControls = true,
}: {
  initialFen?: string;
  onUserMove?: (move: ChessMove, fen: string) => void;
  highlightSquares?: string[];
  compact?: boolean;
  showAnalysisControls?: boolean;
}) {
  const [history, setHistory] = useState<{ pos: ChessPosition; san?: string; from?: string; to?: string }[]>([
    { pos: parseFen(initialFen) },
  ]);
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedSq, setSelectedSq] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [fenInput, setFenInput] = useState(initialFen);
  const [showFenBox, setShowFenBox] = useState(false);

  // Sync whenever initialFen prop changes externally (e.g. selecting a puzzle or opening step)
  useEffect(() => {
    const parsed = parseFen(initialFen);
    setHistory([{ pos: parsed }]);
    setStepIdx(0);
    setSelectedSq(null);
    setFenInput(initialFen);
  }, [initialFen]);

  const currentEntry = history[stepIdx] || history[0];
  const currentPos = currentEntry.pos;
  const legalTargets = selectedSq ? getLegalMovesForSquare(currentPos, selectedSq) : [];

  const attemptMove = (fromSq: string, toSq: string) => {
    const res = tryMakeMove(currentPos, fromSq, toSq);
    if (!res) return false;
    triggerHaptic('selection');
    const nextHistory = [
      ...history.slice(0, stepIdx + 1),
      { pos: res.next, san: res.move.san, from: fromSq, to: toSq },
    ];
    setHistory(nextHistory);
    setStepIdx(nextHistory.length - 1);
    setSelectedSq(null);
    const nextFen = toFen(res.next);
    setFenInput(nextFen);
    onUserMove?.(res.move, nextFen);
    return true;
  };

  const handleSquareClick = (sq: string, hasOwnPiece: boolean) => {
    if (selectedSq === sq) {
      setSelectedSq(null);
      return;
    }
    if (selectedSq && legalTargets.includes(sq)) {
      attemptMove(selectedSq, sq);
      return;
    }
    if (hasOwnPiece) {
      triggerHaptic('light');
      setSelectedSq(sq);
    } else {
      setSelectedSq(null);
    }
  };

  const evalData = evaluatePosition(currentPos);

  const rankIndices = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const fileIndices = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="space-y-3">
      {/* 8x8 Chessboard Container */}
      <div
        className={`w-full ${compact ? 'max-w-[320px]' : 'max-w-[400px]'} mx-auto aspect-square rounded-[12px] p-2`}
        style={{
          backgroundColor: '#0D0E11',
          border: '1px solid var(--os-border)',
        }}
      >
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-[8px] overflow-hidden">
          {rankIndices.map((rIdx) =>
            fileIndices.map((cIdx) => {
              const sq = coordToSq(rIdx, cIdx);
              const piece = currentPos.board[rIdx][cIdx];
              const isLight = (rIdx + cIdx) % 2 === 0;
              const isSelected = selectedSq === sq;
              const isLegalDest = legalTargets.includes(sq);
              const isLastMove = currentEntry.from === sq || currentEntry.to === sq;
              const isCustomHighlight = highlightSquares.includes(sq);
              const hasOwnPiece = Boolean(piece && piece.color === currentPos.turn);

              let bg = isLight ? '#2D3038' : '#17191E';
              if (isSelected) bg = 'rgba(185, 155, 121, 0.52)';
              else if (isLastMove || isCustomHighlight) {
                bg = isLight ? 'rgba(185, 155, 121, 0.34)' : 'rgba(185, 155, 121, 0.24)';
              }

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq, hasOwnPiece)}
                  onDragOver={(e) => {
                    if (selectedSq || e.dataTransfer.types.includes('text/plain')) {
                      e.preventDefault();
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = e.dataTransfer.getData('text/plain');
                    if (from && from !== sq) {
                      attemptMove(from, sq);
                    }
                  }}
                  className="relative flex items-center justify-center select-none cursor-pointer transition-colors"
                  style={{ backgroundColor: bg }}
                >
                  {/* Rank / File labels */}
                  {cIdx === (flipped ? 7 : 0) && (
                    <span
                      className="absolute top-0.5 left-1 metadata text-[8px] pointer-events-none"
                      style={{ color: 'rgba(217,213,203,0.4)' }}
                    >
                      {RANKS[rIdx]}
                    </span>
                  )}
                  {rIdx === (flipped ? 0 : 7) && (
                    <span
                      className="absolute bottom-0.5 right-1 metadata text-[8px] pointer-events-none"
                      style={{ color: 'rgba(217,213,203,0.4)' }}
                    >
                      {FILES[cIdx]}
                    </span>
                  )}

                  {/* Legal target dot or capture ring */}
                  {isLegalDest && !piece && (
                    <span
                      className="w-2.5 h-2.5 rounded-full pointer-events-none"
                      style={{ backgroundColor: 'rgba(185, 155, 121, 0.65)' }}
                    />
                  )}
                  {isLegalDest && piece && (
                    <span
                      className="absolute inset-1 rounded-full border-2 pointer-events-none"
                      style={{ borderColor: 'rgba(185, 155, 121, 0.78)' }}
                    />
                  )}

                  {/* Piece */}
                  {piece && (
                    <span
                      draggable={hasOwnPiece}
                      onDragStart={(e) => {
                        setSelectedSq(sq);
                        e.dataTransfer.setData('text/plain', sq);
                      }}
                      className={`${compact ? 'text-[22px] sm:text-[24px]' : 'text-[26px] sm:text-[30px]'} leading-none ${
                        hasOwnPiece ? 'cursor-grab active:cursor-grabbing' : ''
                      }`}
                      style={{
                        color: piece.color === 'w' ? '#F3EFE6' : '#A7B6D2',
                        textShadow:
                          piece.color === 'w'
                            ? '0 1px 3px rgba(0,0,0,0.75)'
                            : '0 1px 2px rgba(0,0,0,0.9)',
                      }}
                    >
                      {pieceGlyph(piece)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Controls Bar */}
      {showAnalysisControls && (
        <div className="space-y-2.5 max-w-[400px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={stepIdx === 0}
                onClick={() => {
                  setStepIdx((i) => Math.max(0, i - 1));
                  setSelectedSq(null);
                }}
                className="px-2.5 py-1.5 rounded-[7px] metadata text-[10.5px] cursor-pointer disabled:opacity-35"
                style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-ivory)', border: '1px solid var(--os-border)' }}
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={stepIdx >= history.length - 1}
                onClick={() => {
                  setStepIdx((i) => Math.min(history.length - 1, i + 1));
                  setSelectedSq(null);
                }}
                className="px-2.5 py-1.5 rounded-[7px] metadata text-[10.5px] cursor-pointer disabled:opacity-35"
                style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-ivory)', border: '1px solid var(--os-border)' }}
              >
                Next →
              </button>
              <button
                type="button"
                onClick={() => {
                  setHistory([{ pos: parseFen(initialFen) }]);
                  setStepIdx(0);
                  setSelectedSq(null);
                  setFenInput(initialFen);
                }}
                className="px-2.5 py-1.5 rounded-[7px] metadata text-[10.5px] cursor-pointer"
                style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-ivory-muted)', border: '1px solid var(--os-border)' }}
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="px-2.5 py-1.5 rounded-[7px] metadata text-[10.5px] cursor-pointer"
                style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-ivory-muted)', border: '1px solid var(--os-border)' }}
              >
                Flip
              </button>
              <button
                type="button"
                onClick={() => setShowEval((e) => !e)}
                className="px-2.5 py-1.5 rounded-[7px] metadata text-[10.5px] cursor-pointer"
                style={{
                  backgroundColor: showEval ? 'var(--os-stone)' : 'var(--os-graphite)',
                  color: showEval ? 'var(--os-brass)' : 'var(--os-dusty-blue)',
                  border: '1px solid var(--os-border)',
                }}
              >
                Analyze
              </button>
              <button
                type="button"
                onClick={() => setShowFenBox((s) => !s)}
                className="px-2 py-1.5 rounded-[7px] metadata text-[10.5px] cursor-pointer"
                style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-ivory-faint)', border: '1px solid var(--os-border)' }}
              >
                FEN
              </button>
            </div>
          </div>

          {/* Move History Strip */}
          {history.length > 1 && (
            <div
              className="px-3 py-2 rounded-[8px] flex items-center gap-2 overflow-x-auto no-scrollbar metadata text-[11px]"
              style={{ backgroundColor: '#13151A', border: '1px solid var(--os-border)' }}
            >
              {history.slice(1).map((h, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStepIdx(idx + 1)}
                  className="px-1.5 py-0.5 rounded-[4px] shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: stepIdx === idx + 1 ? 'var(--os-brass)' : 'transparent',
                    color: stepIdx === idx + 1 ? '#101114' : 'var(--os-ivory-muted)',
                  }}
                >
                  {Math.floor(idx / 2) + 1}{idx % 2 === 0 ? '.' : '...'} {h.san}
                </button>
              ))}
            </div>
          )}

          {/* Static Position Evaluation */}
          {showEval && (
            <div
              className="p-3 rounded-[9px] space-y-1 text-[12px]"
              style={{ backgroundColor: '#13151A', border: '1px solid rgba(167,182,210,0.28)' }}
            >
              <p className="font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                {evalData.summary}
              </p>
              <p style={{ color: 'var(--os-ivory-muted)' }}>{evalData.centerHold}</p>
              <p className="metadata text-[10.5px]" style={{ color: 'var(--os-brass)' }}>
                {evalData.kingSafety}
              </p>
            </div>
          )}

          {/* Load / Copy FEN */}
          {showFenBox && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-[7px] font-mono text-[11px]"
                style={{ backgroundColor: '#0D0E11', border: '1px solid var(--os-border)', color: 'var(--os-ivory)' }}
              />
              <button
                type="button"
                onClick={() => {
                  const p = parseFen(fenInput);
                  setHistory([{ pos: p }]);
                  setStepIdx(0);
                  setSelectedSq(null);
                }}
                className="px-2.5 py-1.5 rounded-[7px] metadata text-[10.5px] cursor-pointer"
                style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
              >
                Load
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
