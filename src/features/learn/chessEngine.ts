// Lightweight, 100% Legal-Move Chess Engine (FEN, Castling, En Passant, Promotion, Check Verification)

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface ChessPiece {
  color: Color;
  type: PieceType;
}

export interface ChessPosition {
  board: (ChessPiece | null)[][]; // [rank 0..7 -> row 8..1][file 0..7 -> col a..h]
  turn: Color;
  castling: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
  epSquare: string | null; // e.g. 'e3'
  halfmove: number;
  fullmove: number;
}

export interface ChessMove {
  from: string;
  to: string;
  san: string;
  captured?: ChessPiece | null;
  promotion?: PieceType;
}

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function sqToCoord(sq: string): [number, number] | null {
  if (!sq || sq.length < 2) return null;
  const c = FILES.indexOf(sq[0]);
  const r = RANKS.indexOf(sq[1]);
  if (c === -1 || r === -1) return null;
  return [r, c];
}

export function coordToSq(r: number, c: number): string {
  return `${FILES[c]}${RANKS[r]}`;
}

export function pieceGlyph(p: ChessPiece | null): string {
  if (!p) return '';
  if (p.color === 'w') {
    switch (p.type) {
      case 'p': return '♙';
      case 'n': return '♘';
      case 'b': return '♗';
      case 'r': return '♖';
      case 'q': return '♕';
      case 'k': return '♔';
    }
  }
  switch (p.type) {
    case 'p': return '♟︎';
    case 'n': return '♞';
    case 'b': return '♝';
    case 'r': return '♜';
    case 'q': return '♛';
    case 'k': return '♚';
  }
}

export function parseFen(fen: string): ChessPosition {
  const parts = fen.trim().split(/\s+/);
  const rows = (parts[0] || INITIAL_FEN.split(' ')[0]).split('/');
  const board: (ChessPiece | null)[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null)
  );

  for (let r = 0; r < 8 && r < rows.length; r++) {
    let c = 0;
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '8') {
        c += Number(ch);
      } else if (c < 8) {
        const isUpper = ch === ch.toUpperCase();
        const type = ch.toLowerCase() as PieceType;
        if (['p', 'n', 'b', 'r', 'q', 'k'].includes(type)) {
          board[r][c] = { color: isUpper ? 'w' : 'b', type };
        }
        c++;
      }
    }
  }

  const turn: Color = parts[1] === 'b' ? 'b' : 'w';
  const castlingStr = parts[2] || 'KQkq';
  const epSquare = parts[3] && parts[3] !== '-' ? parts[3] : null;

  return {
    board,
    turn,
    castling: {
      wK: castlingStr.includes('K'),
      wQ: castlingStr.includes('Q'),
      bK: castlingStr.includes('k'),
      bQ: castlingStr.includes('q'),
    },
    epSquare,
    halfmove: Number(parts[4]) || 0,
    fullmove: Number(parts[5]) || 1,
  };
}

export function toFen(pos: ChessPosition): string {
  const rows = pos.board.map((row) => {
    let out = '';
    let empty = 0;
    for (const cell of row) {
      if (!cell) {
        empty++;
      } else {
        if (empty > 0) {
          out += String(empty);
          empty = 0;
        }
        out += cell.color === 'w' ? cell.type.toUpperCase() : cell.type;
      }
    }
    if (empty > 0) out += String(empty);
    return out;
  });

  const cStr =
    `${pos.castling.wK ? 'K' : ''}${pos.castling.wQ ? 'Q' : ''}${pos.castling.bK ? 'k' : ''}${pos.castling.bQ ? 'q' : ''}` ||
    '-';

  return `${rows.join('/')} ${pos.turn} ${cStr} ${pos.epSquare || '-'} ${pos.halfmove} ${pos.fullmove}`;
}

function clonePosition(pos: ChessPosition): ChessPosition {
  return {
    board: pos.board.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
    turn: pos.turn,
    castling: { ...pos.castling },
    epSquare: pos.epSquare,
    halfmove: pos.halfmove,
    fullmove: pos.fullmove,
  };
}

export function isSquareAttacked(
  board: (ChessPiece | null)[][],
  r: number,
  c: number,
  byColor: Color
): boolean {
  // Pawn attacks
  const pawnDir = byColor === 'w' ? 1 : -1;
  for (const dc of [-1, 1]) {
    const pr = r + pawnDir;
    const pc = c + dc;
    if (pr >= 0 && pr < 8 && pc >= 0 && pc < 8) {
      const p = board[pr][pc];
      if (p && p.color === byColor && p.type === 'p') return true;
    }
  }

  // Knight attacks
  const kJumps = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of kJumps) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (p && p.color === byColor && p.type === 'n') return true;
    }
  }

  // King adjacency
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p && p.color === byColor && p.type === 'k') return true;
      }
    }
  }

  // Orthogonal rays (Rook / Queen)
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let nr = r + dr;
    let nc = c + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  // Diagonal rays (Bishop / Queen)
  for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    let nr = r + dr;
    let nc = c + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return false;
}

export function findKing(board: (ChessPiece | null)[][], color: Color): [number, number] | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color && p.type === 'k') return [r, c];
    }
  }
  return null;
}

function applyRawMove(pos: ChessPosition, fr: number, fc: number, tr: number, tc: number): ChessPosition {
  const next = clonePosition(pos);
  const piece = next.board[fr][fc];
  if (!piece) return next;

  // En passant capture
  if (piece.type === 'p' && next.epSquare && coordToSq(tr, tc) === next.epSquare && !next.board[tr][tc]) {
    next.board[fr][tc] = null;
  }

  // Castling rook move
  if (piece.type === 'k' && Math.abs(tc - fc) === 2) {
    if (tc === 6) {
      next.board[fr][5] = next.board[fr][7];
      next.board[fr][7] = null;
    } else if (tc === 2) {
      next.board[fr][3] = next.board[fr][0];
      next.board[fr][0] = null;
    }
  }

  next.board[tr][tc] = piece;
  next.board[fr][fc] = null;

  // Auto-promote to Queen
  if (piece.type === 'p' && (tr === 0 || tr === 7)) {
    next.board[tr][tc] = { color: piece.color, type: 'q' };
  }

  // Update En Passant target
  if (piece.type === 'p' && Math.abs(tr - fr) === 2) {
    next.epSquare = coordToSq((fr + tr) / 2, fc);
  } else {
    next.epSquare = null;
  }

  // Update Castling rights
  if (piece.type === 'k') {
    if (piece.color === 'w') { next.castling.wK = false; next.castling.wQ = false; }
    else { next.castling.bK = false; next.castling.bQ = false; }
  }
  if (fr === 7 && fc === 7) next.castling.wK = false;
  if (fr === 7 && fc === 0) next.castling.wQ = false;
  if (fr === 0 && fc === 7) next.castling.bK = false;
  if (fr === 0 && fc === 0) next.castling.bQ = false;
  if (tr === 7 && tc === 7) next.castling.wK = false;
  if (tr === 7 && tc === 0) next.castling.wQ = false;
  if (tr === 0 && tc === 7) next.castling.bK = false;
  if (tr === 0 && tc === 0) next.castling.bQ = false;

  next.turn = pos.turn === 'w' ? 'b' : 'w';
  if (pos.turn === 'b') next.fullmove++;
  return next;
}

export function getLegalMovesForSquare(pos: ChessPosition, fromSq: string): string[] {
  const coord = sqToCoord(fromSq);
  if (!coord) return [];
  const [fr, fc] = coord;
  const piece = pos.board[fr][fc];
  if (!piece || piece.color !== pos.turn) return [];

  const pseudo: [number, number][] = [];
  const dir = piece.color === 'w' ? -1 : 1;
  const opp: Color = piece.color === 'w' ? 'b' : 'w';

  if (piece.type === 'p') {
    if (fr + dir >= 0 && fr + dir < 8 && !pos.board[fr + dir][fc]) {
      pseudo.push([fr + dir, fc]);
      const startRank = piece.color === 'w' ? 6 : 1;
      if (fr === startRank && !pos.board[fr + 2 * dir][fc]) {
        pseudo.push([fr + 2 * dir, fc]);
      }
    }
    for (const dc of [-1, 1]) {
      const tr = fr + dir;
      const tc = fc + dc;
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
        const target = pos.board[tr][tc];
        if ((target && target.color === opp) || (pos.epSquare && coordToSq(tr, tc) === pos.epSquare)) {
          pseudo.push([tr, tc]);
        }
      }
    }
  } else if (piece.type === 'n') {
    for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
      const tr = fr + dr;
      const tc = fc + dc;
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
        const t = pos.board[tr][tc];
        if (!t || t.color === opp) pseudo.push([tr, tc]);
      }
    }
  } else if (piece.type === 'k') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const tr = fr + dr;
        const tc = fc + dc;
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          const t = pos.board[tr][tc];
          if (!t || t.color === opp) pseudo.push([tr, tc]);
        }
      }
    }
    // Castling
    const inCheck = isSquareAttacked(pos.board, fr, fc, opp);
    if (!inCheck) {
      if (piece.color === 'w' && fr === 7 && fc === 4) {
        if (pos.castling.wK && !pos.board[7][5] && !pos.board[7][6] && !isSquareAttacked(pos.board, 7, 5, 'b') && !isSquareAttacked(pos.board, 7, 6, 'b')) {
          pseudo.push([7, 6]);
        }
        if (pos.castling.wQ && !pos.board[7][3] && !pos.board[7][2] && !pos.board[7][1] && !isSquareAttacked(pos.board, 7, 3, 'b') && !isSquareAttacked(pos.board, 7, 2, 'b')) {
          pseudo.push([7, 2]);
        }
      }
      if (piece.color === 'b' && fr === 0 && fc === 4) {
        if (pos.castling.bK && !pos.board[0][5] && !pos.board[0][6] && !isSquareAttacked(pos.board, 0, 5, 'w') && !isSquareAttacked(pos.board, 0, 6, 'w')) {
          pseudo.push([0, 6]);
        }
        if (pos.castling.bQ && !pos.board[0][3] && !pos.board[0][2] && !pos.board[0][1] && !isSquareAttacked(pos.board, 0, 3, 'w') && !isSquareAttacked(pos.board, 0, 2, 'w')) {
          pseudo.push([0, 2]);
        }
      }
    }
  } else {
    const dirs: [number, number][] =
      piece.type === 'b'
        ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
        : piece.type === 'r'
        ? [[1, 0], [-1, 0], [0, 1], [0, -1]]
        : [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];

    for (const [dr, dc] of dirs) {
      let tr = fr + dr;
      let tc = fc + dc;
      while (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
        const t = pos.board[tr][tc];
        if (!t) {
          pseudo.push([tr, tc]);
        } else {
          if (t.color === opp) pseudo.push([tr, tc]);
          break;
        }
        tr += dr;
        tc += dc;
      }
    }
  }

  // Filter out moves leaving own king in check
  const legal: string[] = [];
  for (const [tr, tc] of pseudo) {
    const sim = applyRawMove(pos, fr, fc, tr, tc);
    const kingCoord = findKing(sim.board, piece.color);
    if (kingCoord && !isSquareAttacked(sim.board, kingCoord[0], kingCoord[1], opp)) {
      legal.push(coordToSq(tr, tc));
    }
  }
  return legal;
}

export function tryMakeMove(
  pos: ChessPosition,
  fromSq: string,
  toSq: string
): { next: ChessPosition; move: ChessMove } | null {
  const legalDests = getLegalMovesForSquare(pos, fromSq);
  if (!legalDests.includes(toSq)) return null;

  const fcCoord = sqToCoord(fromSq)!;
  const tcCoord = sqToCoord(toSq)!;
  const piece = pos.board[fcCoord[0]][fcCoord[1]]!;
  const captured = pos.board[tcCoord[0]][tcCoord[1]];
  const next = applyRawMove(pos, fcCoord[0], fcCoord[1], tcCoord[0], tcCoord[1]);

  let san = '';
  if (piece.type === 'k' && Math.abs(tcCoord[1] - fcCoord[1]) === 2) {
    san = tcCoord[1] === 6 ? 'O-O' : 'O-O-O';
  } else {
    const pieceChar = piece.type === 'p' ? '' : piece.type.toUpperCase();
    const isCapture = Boolean(captured) || (piece.type === 'p' && fromSq[0] !== toSq[0]);
    const prefix = piece.type === 'p' && isCapture ? fromSq[0] : pieceChar;
    san = `${prefix}${isCapture ? 'x' : ''}${toSq}`;
    if (piece.type === 'p' && (tcCoord[0] === 0 || tcCoord[0] === 7)) san += '=Q';
  }

  // Add + if enemy king is in check
  const enemyKing = findKing(next.board, next.turn);
  if (enemyKing && isSquareAttacked(next.board, enemyKing[0], enemyKing[1], piece.color)) {
    san += '+';
  }

  return {
    next,
    move: { from: fromSq, to: toSq, san, captured },
  };
}

export function evaluatePosition(pos: ChessPosition): {
  materialDelta: number;
  summary: string;
  centerHold: string;
  kingSafety: string;
} {
  const vals: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let wMat = 0;
  let bMat = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = pos.board[r][c];
      if (!p) continue;
      if (p.color === 'w') wMat += vals[p.type];
      else bMat += vals[p.type];
    }
  }
  const delta = wMat - bMat;
  const summary =
    delta === 0
      ? 'Cân bằng vật chất (0.0)'
      : delta > 0
      ? `Trắng ưu thế +${delta}.0 điểm lực lượng`
      : `Đen ưu thế +${Math.abs(delta)}.0 điểm lực lượng`;

  const centerSqs = ['e4', 'd4', 'e5', 'd5'];
  let wCenter = 0;
  let bCenter = 0;
  for (const sq of centerSqs) {
    const c = sqToCoord(sq)!;
    const p = pos.board[c[0]][c[1]];
    if (p) {
      if (p.color === 'w') wCenter++;
      else bCenter++;
    }
  }
  const centerHold = `Chiếm ô trung tâm trực tiếp: Trắng (${wCenter}/4) · Đen (${bCenter}/4)`;

  const wKing = findKing(pos.board, 'w');
  const bKing = findKing(pos.board, 'b');
  const wCheck = wKing ? isSquareAttacked(pos.board, wKing[0], wKing[1], 'b') : false;
  const bCheck = bKing ? isSquareAttacked(pos.board, bKing[0], bKing[1], 'w') : false;
  const kingSafety = wCheck
    ? 'Vua Trắng đang bị chiếu!'
    : bCheck
    ? 'Vua Đen đang bị chiếu!'
    : `Lượt đi: ${pos.turn === 'w' ? 'Trắng' : 'Đen'} · Nước thứ ${pos.fullmove}`;

  return { materialDelta: delta, summary, centerHold, kingSafety };
}

export interface CuratedOpeningLine {
  id: string;
  name: string;
  eco: string;
  steps: {
    fen: string;
    moveLabel: string;
    principle: string;
    explanation: string;
  }[];
}

export const OPENING_LINES: CuratedOpeningLine[] = [
  {
    id: 'italian',
    name: 'Italian Game (Giuoco Piano)',
    eco: 'C50',
    steps: [
      {
        fen: INITIAL_FEN,
        moveLabel: 'Xuất phát',
        principle: 'Trung tâm (e4, d4, e5, d5)',
        explanation: 'Mục tiêu khai cuộc: Chiếm trung tâm, phát triển Mã trước Tượng và nhập thành sớm.',
      },
      {
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        moveLabel: '1. e4',
        principle: 'Kiểm soát trung tâm & Mở đường chéo',
        explanation: '1. e4 chiếm không gian, kiểm soát d5/f5 và mở đường cho Tượng f1 + Hậu d1.',
      },
      {
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        moveLabel: '1... e5',
        principle: 'Phản công trung tâm đối xứng',
        explanation: 'Đen giành lại ô d4/f4 và mở đường cho Tượng f8.',
      },
      {
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
        moveLabel: '2. Nf3',
        principle: 'Phát triển quân nhẹ kèm đe dọa (Tempo)',
        explanation: 'Mã f3 kiểm soát e5 & d4 đồng thời tấn công trực tiếp tốt e5.',
      },
      {
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        moveLabel: '2... Nc6',
        principle: 'Phát triển để bảo vệ trung tâm',
        explanation: 'Mã c6 vừa phát triển quân vừa bảo vệ tốt e5.',
      },
      {
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
        moveLabel: '3. Bc4',
        principle: 'Nhắm điểm yếu f7 & Dọn đường nhập thành',
        explanation: 'Tượng c4 ngắm thẳng ô yếu nhất f7 (chỉ được Vua bảo vệ) và dọn sạch cánh Vua để sẵn sàng O-O.',
      },
    ],
  },
  {
    id: 'queens_gambit',
    name: "Queen's Gambit",
    eco: 'D06',
    steps: [
      {
        fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
        moveLabel: '1. d4',
        principle: 'Chiếm trung tâm chắc chắn',
        explanation: 'Tốt d4 được Hậu d1 bảo vệ sẵn ngay từ đầu.',
      },
      {
        fen: 'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2',
        moveLabel: '1... d5',
        principle: 'Khóa trục dọc trung tâm',
        explanation: 'Đen ngăn Trắng đẩy e4 dễ dàng.',
      },
      {
        fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2',
        moveLabel: '2. c4',
        principle: 'Thách thức tốt trung tâm d5',
        explanation: 'Dùng tốt cánh c tấn công tốt trung tâm d5 để giành đa số tốt trung tâm.',
      },
    ],
  },
];

export interface ChessPuzzle {
  id: string;
  title: string;
  motif: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  fen: string;
  solutionFrom: string;
  solutionTo: string;
  hint: string;
  explanation: string;
}

export const CHESS_PUZZLES: ChessPuzzle[] = [
  {
    id: 'pz_fork_1',
    title: 'Scholar Mate Motif (Điểm yếu f7)',
    motif: 'Checkmate Pattern',
    difficulty: 'Beginner',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    solutionFrom: 'h5',
    solutionTo: 'f7',
    hint: 'Tìm nước đi chiếu hết ngay tại điểm yếu f7 (ô chỉ được Vua bảo vệ).',
    explanation: '1. Qxf7# chiếu hết ngay lập tức vì Hậu được Tượng c4 bảo vệ.',
  },
  {
    id: 'pz_backrank',
    title: 'Back-Rank Mate (Chiếu hết hàng cuối)',
    motif: 'Back-Rank',
    difficulty: 'Beginner',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    solutionFrom: 'd1',
    solutionTo: 'd8',
    hint: 'Vua Đen bị giam sau hàng tốt f7-g7-h7. Hãy kiểm tra nước Chiếu trên cột mở.',
    explanation: '1. Rd8# chiếu hết trực diện vì hàng tốt f7, g7, h7 tự chặn đường thoát của Vua Đen.',
  },
  {
    id: 'pz_fork_royal',
    title: 'Royal Knight Fork (Chĩa Vua & Xe/Hậu)',
    motif: 'Fork',
    difficulty: 'Intermediate',
    fen: 'q3k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
    solutionFrom: 'd5',
    solutionTo: 'c7',
    hint: 'Tìm ô để Mã nhảy tới chiếu Vua e8 đồng thời tấn công Hậu a8 (hình chữ L ngược).',
    explanation: '1. Nc7+! Nước nhảy Mã vừa chiếu Vua e8 vừa chĩa thẳng vào Hậu a8 — Đen buộc phải chạy Vua và mất Hậu.',
  },
  {
    id: 'pz_pin_absolute',
    title: 'Absolute Pin (Ghim tuyệt đối Hậu vào Vua)',
    motif: 'Pin',
    difficulty: 'Intermediate',
    fen: '4k3/8/8/8/4q3/8/8/R3K3 w - - 0 1',
    solutionFrom: 'a1',
    solutionTo: 'e1',
    hint: 'Hậu Đen e4 và Vua Đen e8 đang nằm trên cùng cột e.',
    explanation: '1. Re1! Đòn ghim tuyệt đối (Absolute Pin) trên cột e: Hậu Đen không thể rời cột e vì sẽ để lộ Vua bị chiếu.',
  },
  {
    id: 'pz_skewer',
    title: 'Rook Skewer (Đòn Xiên hàng ngang 7)',
    motif: 'Skewer',
    difficulty: 'Advanced',
    fen: '8/q3k3/8/8/8/8/8/4K2R w - - 0 1',
    solutionFrom: 'h1',
    solutionTo: 'h7',
    hint: 'Vua Đen e7 và Hậu Đen a7 cùng nằm trên hàng ngang số 7.',
    explanation: '1. Rh7+! Chiếu Vua e7 để ép Vua chạy sang hàng khác, nước sau Trắng ăn Hậu a7 miễn phí.',
  },
];
