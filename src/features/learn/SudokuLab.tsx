import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createId, getLocalDateStr, formatShortDate } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import type { SudokuRun, SudokuTechnique } from '../../types';
import { DirectoryCard, Modal, useRoomBack, useToast } from '../../components/ui/Primitives';
import { SudokuTechniqueIllustration } from './SudokuDiagram';

type SudokuSection = 'overview' | 'path' | 'lesson' | 'practice' | 'journal' | 'library';

const SUDOKU_UI_KEY = 'noetrix_sudoku_room_v2';

function formatArrows(text: string): string {
  return text.replace(/->/g, '→');
}

function extractTechNum(name: string): number {
  const m = name.match(/^(\d+)\./);
  return m ? Number(m[1]) : 999;
}

const CURRICULUM_STAGES: {
  tier: SudokuTechnique['tier'];
  code: string;
  title: string;
  range: string;
  goal: string;
}[] = [
  {
    tier: 'basic',
    code: '01',
    title: 'Foundation',
    range: 'Easy – Medium',
    goal: 'Hiểu luật 9×9, Scanning, Naked/Hidden Singles và Snyder Notation.',
  },
  {
    tier: 'intermediate',
    code: '02',
    title: 'Elimination',
    range: 'Medium – Hard',
    goal: 'Pointing Pairs, Box-Line Reduction và Naked/Hidden Subsets.',
  },
  {
    tier: 'expert',
    code: '03',
    title: 'Patterns & Chains',
    range: 'Hard – Expert',
    goal: 'X-Wing, Swordfish, XY-Wing, Simple Coloring & AIC.',
  },
  {
    tier: 'mastery',
    code: '04',
    title: 'Mastery',
    range: 'Expert – Master',
    goal: 'Forcing Chains, ALS, chứng minh toàn bảng 0% đoán mò.',
  },
];

const SUDOKU_RESOURCES = [
  {
    title: 'The Art of Sudoku',
    author: 'Thomas Snyder (Grandmaster Puzzles)',
    role: 'Sách & Tư duy hệ thống',
    description: 'Ghi chú Snyder chuẩn mực và tư duy giải các bài Sudoku khó bằng logic thuần túy.',
    url: 'https://www.gmpuzzles.com/',
  },
  {
    title: 'HoDoKu',
    author: 'Sudoku Trainer',
    role: 'Desktop Trainer',
    description: 'Hệ thống hóa 100% kỹ thuật loại trừ ứng viên từ Intermediate tới Master.',
    url: 'https://hodoku.sourceforge.net/',
  },
  {
    title: 'Sudoku Coach',
    author: 'Interactive Campaign',
    role: 'Web Trainer',
    description: 'Giải thích trực quan từng bước tại sao một ứng viên bị loại bỏ.',
    url: 'https://sudoku.coach/',
  },
  {
    title: 'Cracking the Cryptic',
    author: 'Simon Anthony & Mark Goodliffe',
    role: 'Video Phân tích',
    description: 'Quan sát cách giải Sudoku đỉnh cao: đặt giả thuyết, chứng minh và tìm điểm đột phá.',
    url: 'https://www.youtube.com/@CrackingTheCryptic',
  },
];

// Curated Playable 9x9 Sudoku Puzzles (0 = empty)
const SUDOKU_PUZZLES: {
  id: string;
  title: string;
  level: string;
  givens: number[][];
}[] = [
  {
    id: 'sd_p1',
    title: 'Puzzle 01 · Scanning & Hidden Singles',
    level: 'Easy – Medium',
    givens: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
  },
  {
    id: 'sd_p2',
    title: 'Puzzle 02 · Snyder & Pointing Pairs',
    level: 'Medium – Hard',
    givens: [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ],
  },
];

function InteractiveSudokuBoard() {
  const { showToast } = useToast();
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = SUDOKU_PUZZLES[puzzleIdx];

  const [grid, setGrid] = useState<number[][]>(() => puzzle.givens.map((r) => [...r]));
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [selected, setSelected] = useState<[number, number] | null>([0, 2]);
  const [noteMode, setNoteMode] = useState(false);

  const resetBoard = (idx: number) => {
    const p = SUDOKU_PUZZLES[idx];
    setPuzzleIdx(idx);
    setGrid(p.givens.map((r) => [...r]));
    setNotes({});
    setSelected(null);
  };

  const hasConflict = (r: number, c: number, val: number): boolean => {
    if (val === 0) return false;
    for (let i = 0; i < 9; i++) {
      if (i !== c && grid[r][i] === val) return true;
      if (i !== r && grid[i][c] === val) return true;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr++) {
      for (let cc = bc; cc < bc + 3; cc++) {
        if ((rr !== r || cc !== c) && grid[rr][cc] === val) return true;
      }
    }
    return false;
  };

  const enterNumber = (num: number) => {
    if (!selected) return;
    const [r, c] = selected;
    if (puzzle.givens[r][c] !== 0) return; // Given cell locked
    triggerHaptic('selection');

    if (noteMode && num !== 0) {
      const key = `${r}-${c}`;
      setNotes((prev) => {
        const cur = prev[key] || [];
        const next = cur.includes(num) ? cur.filter((x) => x !== num) : [...cur, num].sort();
        return { ...prev, [key]: next };
      });
      return;
    }

    setGrid((prev) => prev.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? num : v)) : row)));
    if (num !== 0) {
      setNotes((prev) => {
        const copy = { ...prev };
        delete copy[`${r}-${c}`];
        return copy;
      });
    }
  };

  const findLogicHint = () => {
    // Look for a Naked Single cell where 8 digits are already seen in peers
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== 0) continue;
        const used = new Set<number>();
        for (let i = 0; i < 9; i++) {
          if (grid[r][i]) used.add(grid[r][i]);
          if (grid[i][c]) used.add(grid[i][c]);
        }
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let rr = br; rr < br + 3; rr++) {
          for (let cc = bc; cc < bc + 3; cc++) {
            if (grid[rr][cc]) used.add(grid[rr][cc]);
          }
        }
        const cands = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !used.has(n));
        if (cands.length === 1) {
          setSelected([r, c]);
          showToast(`Naked Single tại R${r + 1}C${c + 1}: Chỉ còn duy nhất số ${cands[0]} hợp lệ!`);
          return;
        }
      }
    }
    showToast('Dùng Pencil Notes (Snyder) tìm cặp Locked Candidates hoặc Hidden Single.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
      <div className="lg:col-span-6 flex flex-col items-center space-y-3">
        <div
          className="w-full max-w-[380px] aspect-square rounded-[10px] overflow-hidden grid grid-cols-9 grid-rows-9"
          style={{ border: '2px solid rgba(185,155,121,0.5)', backgroundColor: '#121418' }}
        >
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isGiven = puzzle.givens[r][c] !== 0;
              const isSel = selected?.[0] === r && selected?.[1] === c;
              const conflict = val !== 0 && hasConflict(r, c, val);
              const cellNotes = notes[`${r}-${c}`] || [];
              const thickRight = c === 2 || c === 5;
              const thickBottom = r === 2 || r === 5;

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => setSelected([r, c])}
                  className="relative flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSel
                      ? 'rgba(185,155,121,0.28)'
                      : conflict
                      ? 'rgba(194,123,118,0.22)'
                      : 'transparent',
                    borderRight: thickRight
                      ? '2px solid rgba(185,155,121,0.45)'
                      : '1px solid rgba(217,213,203,0.08)',
                    borderBottom: thickBottom
                      ? '2px solid rgba(185,155,121,0.45)'
                      : '1px solid rgba(217,213,203,0.08)',
                  }}
                >
                  {val !== 0 ? (
                    <span
                      className="text-[17px] font-mono"
                      style={{
                        color: conflict
                          ? 'var(--os-crimson)'
                          : isGiven
                          ? 'var(--os-ivory-bright)'
                          : 'var(--os-brass)',
                        fontWeight: isGiven ? 700 : 500,
                      }}
                    >
                      {val}
                    </span>
                  ) : cellNotes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5 text-[8px] font-mono leading-none items-center justify-items-center" style={{ color: 'var(--os-dusty-blue)' }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                        <span key={d}>{cellNotes.includes(d) ? d : ''}</span>
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Controls & Number Pad */}
      <div className="lg:col-span-6 space-y-4">
        <div className="p-5 rounded-[12px] space-y-4" style={{ backgroundColor: 'var(--os-graphite)', border: '1px solid var(--os-border)' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
              {puzzle.level} · ZERO-GUESS BOARD
            </span>
            <div className="flex gap-1.5">
              {SUDOKU_PUZZLES.map((pz, idx) => (
                <button
                  key={pz.id}
                  type="button"
                  onClick={() => resetBoard(idx)}
                  className="px-2.5 py-1 rounded-[6px] metadata text-[10.5px] cursor-pointer"
                  style={{
                    backgroundColor: puzzleIdx === idx ? 'var(--os-brass)' : '#101114',
                    color: puzzleIdx === idx ? '#101114' : 'var(--os-ivory-muted)',
                  }}
                >
                  Bài 0{idx + 1}
                </button>
              ))}
            </div>
          </div>

          <h3 className="editorial-h3">{puzzle.title}</h3>

          {/* Number Pad */}
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => enterNumber(n)}
                className="py-2.5 rounded-[8px] font-mono text-[15px] font-semibold cursor-pointer hover:bg-[#282B34]"
                style={{ backgroundColor: '#101114', color: 'var(--os-ivory-bright)', border: '1px solid var(--os-border)' }}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => enterNumber(0)}
              className="py-2.5 rounded-[8px] metadata text-[11px] cursor-pointer"
              style={{ backgroundColor: '#101114', color: 'var(--os-crimson)', border: '1px solid var(--os-border)' }}
            >
              Xóa
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--os-border)]">
            <button
              type="button"
              onClick={() => setNoteMode((m) => !m)}
              className="px-3.5 py-1.5 rounded-[8px] metadata text-[11px] cursor-pointer"
              style={{
                backgroundColor: noteMode ? 'var(--os-dusty-blue)' : '#101114',
                color: noteMode ? '#101114' : 'var(--os-ivory)',
                border: '1px solid var(--os-border)',
              }}
            >
              {noteMode ? '✎ Pencil Notes: BẬT' : '✎ Pencil Notes: TẮT'}
            </button>
            <button
              type="button"
              onClick={findLogicHint}
              className="px-3.5 py-1.5 rounded-[8px] metadata text-[11px] cursor-pointer"
              style={{ backgroundColor: '#101114', color: 'var(--os-brass)', border: '1px solid var(--os-border)' }}
            >
              Prove Hint
            </button>
            <button
              type="button"
              onClick={() => resetBoard(puzzleIdx)}
              className="px-3 py-1.5 rounded-[8px] metadata text-[11px] cursor-pointer"
              style={{ backgroundColor: '#101114', color: 'var(--os-ivory-muted)', border: '1px solid var(--os-border)' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SudokuLab() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const techniques = useLiveQuery(() => db.sudokuTechniques.toArray()) || [];
  const runs = useLiveQuery(() => db.sudokuRuns.orderBy('createdAt').reverse().toArray()) || [];

  const [section, setSection] = useState<SudokuSection>(() => {
    try {
      const raw = localStorage.getItem(SUDOKU_UI_KEY);
      if (raw) return (JSON.parse(raw).section as SudokuSection) || 'overview';
    } catch {
      // ignore
    }
    return 'overview';
  });
  const [activeTier, setActiveTier] = useState<SudokuTechnique['tier']>('basic');
  const [activeTechId, setActiveTechId] = useState<string>('sd_01_candidates');

  const [logOpen, setLogOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<SudokuRun['difficulty']>('Expert');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [guessCount, setGuessCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [stuckNote, setStuckNote] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(SUDOKU_UI_KEY, JSON.stringify({ section }));
    } catch {
      // ignore
    }
  }, [section]);

  useRoomBack(section !== 'overview', () =>
    setSection((prev) => (prev === 'lesson' ? 'path' : 'overview'))
  );

  const sortedTechniques = useMemo(() => {
    return [...techniques].sort((a, b) => extractTechNum(a.name) - extractTechNum(b.name));
  }, [techniques]);

  const masteredCount = sortedTechniques.filter((t) => t.mastery === 'mastered').length;
  const activeTech =
    sortedTechniques.find((t) => t.id === activeTechId) ||
    sortedTechniques.find((t) => t.mastery === 'practicing') ||
    sortedTechniques[0] ||
    null;

  const setTechMastery = async (tech: SudokuTechnique, next: SudokuTechnique['mastery']) => {
    triggerHaptic('selection');
    await db.sudokuTechniques.update(tech.id, { mastery: next, updatedAt: Date.now() });
    showToast(`Cập nhật: ${next.toUpperCase()}`);
  };

  const handleLogRun = async (e: React.FormEvent) => {
    e.preventDefault();
    const g = Math.max(0, Number(guessCount) || 0);
    const run: SudokuRun = {
      id: createId('sdr'),
      date: getLocalDateStr(),
      difficulty,
      durationMinutes: Math.max(1, Number(durationMinutes) || 15),
      pureLogic: g === 0,
      guessCount: g,
      mistakeCount: Math.max(0, Number(mistakeCount) || 0),
      techniquesUsed: activeTech ? [activeTech.name] : [],
      stuckNote: stuckNote.trim(),
      createdAt: Date.now(),
    };
    await db.sudokuRuns.put(run);
    setStuckNote('');
    setLogOpen(false);
    showToast(g === 0 ? 'Đã lưu ván Sudoku 0% đoán mò!' : 'Đã lưu ván Sudoku vào Run Journal');
  };

  const renderBreadcrumb = (_title: string) => (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--os-border)]">
      <div className="flex items-center gap-1.5 flex-wrap">
        {(
          [
            ['path', t('Curriculum', 'Giáo trình')],
            ['practice', t('Practice Board', 'Bàn cờ thực hành')],
            ['journal', t('Run Journal', 'Nhật ký giải')],
            ['library', t('Library', 'Tài liệu')],
          ] as const
        ).map(([sec, lbl]) => (
          <button
            key={sec}
            type="button"
            onClick={() => setSection(sec)}
            className="px-2.5 py-1 rounded-[7px] text-[11.5px] cursor-pointer"
            style={{
              backgroundColor: section === sec ? '#23262E' : 'transparent',
              color: section === sec ? 'var(--os-brass)' : 'var(--os-ivory-muted)',
              border: section === sec ? '1px solid rgba(185,155,121,0.35)' : '1px solid transparent',
            }}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );

  // =========================================================================
  // 1. SUDOKU OVERVIEW (Clean Stages Directory matching The Lab)
  // =========================================================================
  if (section === 'overview') {
    return (
      <div className="space-y-4">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap pb-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-semibold text-white">
                {t('Stages', 'Lộ trình Sudoku')}
              </h2>
              <span
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(155, 170, 152, 0.12)',
                  color: '#9BAA98',
                  border: '1px solid rgba(155, 170, 152, 0.25)',
                }}
              >
                {masteredCount}/{sortedTechniques.length} ✓
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  ['practice', t('9×9 Board', 'Bảng 9×9')],
                  ['journal', t('Journal', 'Nhật ký')],
                  ['library', t('Library', 'Tài liệu')],
                ] as const
              ).map(([sec, lbl]) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSection(sec)}
                  className="px-3 py-1.5 rounded-lg border border-[#222834] hover:border-[#384152] bg-[#12151c] text-[#9ca3af] hover:text-white text-[12px] font-medium transition-all cursor-pointer"
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {CURRICULUM_STAGES.map((st) => {
              const items = sortedTechniques.filter((tk) => tk.tier === st.tier);
              const done = items.filter((tk) => tk.mastery === 'mastered').length;
              return (
                <DirectoryCard
                  key={st.tier}
                  code={`STAGE.${st.code}`}
                  title={st.title}
                  subtitle={st.goal}
                  statuses={[
                    { label: `${items.length} ${t('techniques', 'kỹ thuật')}`, tone: 'muted' },
                    ...(done > 0
                      ? [{ label: `${done} ${t('Mastered', 'Thành thạo')}`, tone: 'emerald' as const }]
                      : []),
                  ]}
                  onClick={() => {
                    setActiveTier(st.tier);
                    setSection('path');
                  }}
                />
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // 2. CURRICULUM STAGES -> ORDERED TECHNIQUES
  // =========================================================================
  if (section === 'path') {
    const currentStage = CURRICULUM_STAGES.find((st) => st.tier === activeTier) || CURRICULUM_STAGES[0];
    const tierTechs = sortedTechniques.filter((tk) => tk.tier === activeTier);
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--os-border)]">
          <div>
            <span className="block text-[11px] font-medium text-[#cba86a]">
              STAGE.{currentStage.code} · {currentStage.range}
            </span>
            <h2 className="text-[17px] font-semibold text-white">{currentStage.title}</h2>
          </div>

          <div className="flex items-center gap-1.5">
            {CURRICULUM_STAGES.map((st) => {
              const active = activeTier === st.tier;
              return (
                <button
                  key={st.tier}
                  type="button"
                  onClick={() => setActiveTier(st.tier)}
                  className="px-2.5 py-1 rounded-lg text-[12px] font-medium cursor-pointer transition-colors"
                  style={{
                    backgroundColor: active ? '#1e2430' : 'transparent',
                    color: active ? '#cba86a' : '#8b95a7',
                    border: active ? '1px solid rgba(203,168,106,0.45)' : '1px solid transparent',
                  }}
                >
                  {st.code}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[13px] text-[#9ca3af]">{currentStage.goal}</p>

        <div className="divide-y divide-[var(--os-border)] border-y border-[var(--os-border)]">
          {tierTechs.map((tk) => {
            const col =
              tk.mastery === 'mastered'
                ? 'var(--os-sage)'
                : tk.mastery === 'practicing'
                ? 'var(--os-brass)'
                : 'var(--os-ivory-faint)';
            return (
              <div
                key={tk.id}
                onClick={() => {
                  setActiveTechId(tk.id);
                  setSection('lesson');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setActiveTechId(tk.id);
                    setSection('lesson');
                  }
                }}
                className="py-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[rgba(217,213,203,0.025)] group"
              >
                <div className="min-w-0 space-y-1">
                  <h4 className="text-[15px] font-semibold group-hover:text-white" style={{ color: 'var(--os-ivory-bright)' }}>
                    {formatArrows(tk.name)}
                  </h4>
                  <p className="text-[12px] line-clamp-1" style={{ color: 'var(--os-ivory-muted)' }}>
                    {formatArrows(tk.summary)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ color: col, border: '1px solid var(--os-border)' }}>
                    {tk.mastery}
                  </span>
                  <span className="text-[13px] font-medium text-[#cba86a] group-hover:translate-x-0.5 transition-transform">
                    {t('Open', 'Mở')} →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. TECHNIQUE WORKSPACE
  // =========================================================================
  if (section === 'lesson' && activeTech) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--os-border)]">
          <h2 className="editorial-h2 truncate">{formatArrows(activeTech.name)}</h2>

          <div className="flex gap-1.5">
            {(['unknown', 'practicing', 'mastered'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTechMastery(activeTech, m)}
                className="px-2.5 py-1 rounded-[6px] metadata text-[10px] uppercase cursor-pointer"
                style={{
                  backgroundColor: activeTech.mastery === m ? 'var(--os-stone)' : 'transparent',
                  color: activeTech.mastery === m ? 'var(--os-brass)' : 'var(--os-ivory-faint)',
                  border: '1px solid var(--os-border)',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 rounded-[10px] space-y-1.5" style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}>
              <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-brass)' }}>
                {t('CORE LOGIC', 'BẢN CHẤT LOGIC')}
              </span>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--os-ivory)' }}>{formatArrows(activeTech.summary)}</p>
            </div>
            <div className="p-4 rounded-[10px] space-y-1.5" style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}>
              <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-dusty-blue)' }}>
                {t('HOW TO SPOT ON THE BOARD', 'CÁCH NHẬN DIỆN TRÊN BẢNG')}
              </span>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--os-ivory)' }}>{formatArrows(activeTech.howToSpot)}</p>
            </div>
            {activeTech.example && (
              <div className="p-4 rounded-[10px] space-y-1.5" style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}>
                <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-sage)' }}>
                  {t('WORKED EXAMPLE', 'VÍ DỤ MINH HỌA')}
                </span>
                <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>{formatArrows(activeTech.example)}</p>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-brass)' }}>
                {t('YOUR NOTES & EXPLANATION', 'GHI CHÚ & DIỄN GIẢI CỦA BẠN')}
              </span>
              <textarea
                rows={5}
                value={activeTech.notes}
                onChange={(e) => db.sudokuTechniques.update(activeTech.id, { notes: e.target.value, updatedAt: Date.now() })}
                placeholder={t(
                  'Write quick spotting cues for this technique in your own words...',
                  'Ghi chú lại dấu hiệu soi nhanh kỹ thuật này theo ngôn ngữ của bạn...'
                )}
                className="w-full p-4 rounded-[10px] text-[13.5px] leading-relaxed"
                style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)', color: 'var(--os-ivory)' }}
              />
            </div>
          </div>

          <div className="lg:col-span-6">
            <SudokuTechniqueIllustration techId={activeTech.id} />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. INTERACTIVE 9x9 PRACTICE BOARD
  // =========================================================================
  if (section === 'practice') {
    return (
      <div className="space-y-6">
        {renderBreadcrumb('PRACTICE BOARD')}
        <InteractiveSudokuBoard />
      </div>
    );
  }

  // =========================================================================
  // 5. RUN JOURNAL
  // =========================================================================
  if (section === 'journal') {
    return (
      <div className="space-y-6">
        {renderBreadcrumb('RUN JOURNAL')}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="editorial-h2">Sudoku Run Journal</h3>
            <p className="text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>Ghi lại điểm bị mắc và tỷ lệ 0% đoán mò.</p>
          </div>
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            className="px-4 py-2 rounded-[9px] text-[12.5px] font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
          >
            + Log Solve Run
          </button>
        </div>

        {runs.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[var(--os-border)] rounded-[12px]">
            <p className="text-[14.5px]" style={{ color: 'var(--os-ivory-bright)' }}>No runs recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--os-border)] border-y border-[var(--os-border)]">
            {runs.map((r) => (
              <div key={r.id} className="py-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                    {r.difficulty} · {r.durationMinutes}m · {r.pureLogic ? '0 đoán mò (Pure Logic)' : `${r.guessCount} guesses`}
                  </p>
                  {r.stuckNote && <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>{r.stuckNote}</p>}
                </div>
                <button type="button" onClick={() => db.sudokuRuns.delete(r.id)} className="metadata text-[11px] cursor-pointer" style={{ color: 'var(--os-ivory-faint)' }}>
                  {formatShortDate(r.date)} ×
                </button>
              </div>
            ))}
          </div>
        )}

        <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Log Sudoku Run">
          <form onSubmit={handleLogRun} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as SudokuRun['difficulty'])} className="px-3 py-2 rounded-[9px] ios-fill text-[13px]">
                {['Easy', 'Medium', 'Hard', 'Expert', 'Master'].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} placeholder="Phút" className="px-3 py-2 rounded-[9px] ios-fill text-[13px]" />
              <input type="number" min={0} value={guessCount} onChange={(e) => setGuessCount(Number(e.target.value))} placeholder="Số lần đoán" className="px-3 py-2 rounded-[9px] ios-fill text-[13px]" />
            </div>
            <textarea rows={3} value={stuckNote} onChange={(e) => setStuckNote(e.target.value)} placeholder="Điểm bị mắc và kỹ thuật giúp phá vỡ thế bế tắc..." className="w-full p-3 rounded-[9px] ios-fill text-[13px]" />
            <button type="submit" className="w-full py-2.5 rounded-[9px] text-[13px] font-semibold cursor-pointer" style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}>
              Lưu Run
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  // =========================================================================
  // 6. SUDOKU LIBRARY
  // =========================================================================
  return (
    <div className="space-y-6">
      {renderBreadcrumb('LIBRARY')}
      <div className="divide-y divide-[var(--os-border)] border-y border-[var(--os-border)]">
        {SUDOKU_RESOURCES.map((res) => (
          <div key={res.title} className="py-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-dusty-blue)' }}>{res.role} · {res.author}</span>
              <h4 className="text-[15.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>{res.title}</h4>
              <p className="text-[12.5px]" style={{ color: 'var(--os-ivory-muted)' }}>{res.description}</p>
            </div>
            <a href={res.url} target="_blank" rel="noreferrer" className="metadata text-[11px] hover:underline shrink-0" style={{ color: 'var(--os-brass)' }}>
              Open ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
