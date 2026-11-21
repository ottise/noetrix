import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import type { ChessModule, ChessStage } from '../../types';
import { DirectoryCard, useRoomBack, useToast } from '../../components/ui/Primitives';
import {
  CHESS_PUZZLES,
  INITIAL_FEN,
  OPENING_LINES,
} from './chessEngine';
import { InteractiveChessBoard } from './InteractiveChessBoard';

type ChessSection = 'overview' | 'path' | 'lesson' | 'library';
type LessonTab = 'theory' | 'examples' | 'explain' | 'review';
type LessonStatus = 'not_started' | 'learning' | 'practicing' | 'mastered' | 'paused';

const CHESS_UI_STATE_KEY = 'noetrix_chess_room_state_v2';

function extractLessonNumber(title: string): number {
  const m = title.match(/^(\d+)\./);
  return m ? Number(m[1]) : 999;
}

function getLessonStatus(mod: ChessModule, overrides: Record<string, LessonStatus>): LessonStatus {
  if (mod.done) return 'mastered';
  if (overrides[mod.id]) return overrides[mod.id];
  if (mod.notes.trim() || mod.openQuestion?.trim()) return 'learning';
  return 'not_started';
}

const STATUS_META: Record<LessonStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: 'var(--os-ivory-faint)', bg: 'transparent' },
  learning: { label: 'Learning', color: 'var(--os-dusty-blue)', bg: 'rgba(167,182,210,0.12)' },
  practicing: { label: 'Practicing', color: 'var(--os-brass)', bg: 'rgba(185,155,121,0.14)' },
  mastered: { label: 'Mastered', color: 'var(--os-sage)', bg: 'rgba(155,170,152,0.14)' },
  paused: { label: 'Paused', color: 'var(--os-crimson)', bg: 'rgba(194,123,118,0.12)' },
};

const STAGES: {
  id: ChessStage;
  phase: 1 | 2 | 3;
  code: string;
  title: string;
  eloRef: string;
  focus: string;
  goal: string;
  criteria: string;
}[] = [
  {
    id: 'beginner',
    phase: 1,
    code: '01',
    title: 'Foundation',
    eloRef: '0–1000 Elo tham khảo',
    focus: 'Luật chơi · Bảo vệ quân · Nguyên tắc khai cuộc · Tactics · Tàn cuộc cơ bản',
    goal: 'Biết chơi đúng, chấm dứt tự mất quân 1 nước (blunder) và hiểu nguyên tắc đằng sau nước đi.',
    criteria: 'Nắm vững 5 đòn chiến thuật cốt lõi và chiếu hết thành thạo K+Q / K+R vs K.',
  },
  {
    id: 'intermediate',
    phase: 2,
    code: '02',
    title: 'Intermediate',
    eloRef: '1000–1800 Elo tham khảo',
    focus: 'CCT Calculation · Candidate Moves · Cấu trúc tốt · Positional Play · Tàn cuộc thực chiến',
    goal: 'Biết suy nghĩ theo hệ thống, tính nhiều biến đối phương và tự phân tích ván trước khi bật Engine.',
    criteria: 'Hình thành thói quen rà Checks → Captures → Threats và biết đánh giá Imbalances.',
  },
  {
    id: 'advanced',
    phase: 3,
    code: '03',
    title: 'Advanced',
    eloRef: '1800–2200+ Elo tham khảo',
    focus: 'Deep Calculation · Prophylaxis · Endgame Theory · Opening Repertoire · Giải đấu',
    goal: 'Biết đánh giá vị trí sâu, phòng ngừa kế hoạch đối phương (Prophylaxis) và xây hệ thống thi đấu.',
    criteria: 'Kiểm soát tư duy ở thế cờ phức tạp và phân tích sâu sai lầm sau mỗi ván đấu.',
  },
];

interface LibraryResource {
  id: string;
  title: string;
  author: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  topic: 'Openings' | 'Tactics' | 'Strategy' | 'Endgames' | 'Course';
  description: string;
  url?: string;
  linkedLessonNum?: number;
}

const CHESS_LIBRARY_ITEMS: LibraryResource[] = [
  {
    id: 'lib_lichess_learn',
    title: 'Lichess – Learn Chess',
    author: 'lichess.org',
    level: 'Beginner',
    topic: 'Course',
    description: 'Bài tập tương tác nắm luật di chuyển 6 quân, nhập thành, bắt tốt qua đường và chiếu hết cơ bản.',
    url: 'https://lichess.org/learn',
    linkedLessonNum: 1,
  },
  {
    id: 'lib_seirawan',
    title: 'Play Winning Chess',
    author: 'Yasser Seirawan',
    level: 'Beginner',
    topic: 'Strategy',
    description: '4 nguyên tắc nền tảng: Force (Lực lượng), Time (Nhịp độ), Space (Không gian), Pawn Structure.',
    linkedLessonNum: 2,
  },
  {
    id: 'lib_chernev',
    title: 'Logical Chess: Move by Move',
    author: 'Irving Chernev',
    level: 'Beginner',
    topic: 'Openings',
    description: 'Giải thích rõ ràng lý do đằng sau từng nước đi từ khai cuộc đến kết thúc ván.',
    linkedLessonNum: 3,
  },
  {
    id: 'lib_lichess_mate',
    title: 'Lichess – Basic Checkmates Practice',
    author: 'lichess.org',
    level: 'Beginner',
    topic: 'Tactics',
    description: 'Luyện tập tương tác các mẫu chiếu hết cơ bản và K+Q / K+R vs K.',
    url: 'https://lichess.org/practice/checkmates/piece-checkmates-i/BJy6fEDf',
    linkedLessonNum: 4,
  },
  {
    id: 'lib_yusupov',
    title: "Yusupov's Chess School (Series 9 cuốn)",
    author: 'Artur Yusupov',
    level: 'Intermediate',
    topic: 'Tactics',
    description: 'Bộ giáo trình hệ thống nhất: Fundamentals → Beyond the Basics → Mastery với bài test cuối chương.',
    url: 'https://chesseduca.com/series/yusupovs-chess-school/',
    linkedLessonNum: 5,
  },
  {
    id: 'lib_silman_eg',
    title: "Silman's Complete Endgame Course",
    author: 'Jeremy Silman',
    level: 'Intermediate',
    topic: 'Endgames',
    description: 'Học kiến thức tàn cuộc được chia đúng theo từng ngưỡng Elo từ người mới đến Master.',
    linkedLessonNum: 6,
  },
  {
    id: 'lib_silman_mind',
    title: "The Amateur's Mind",
    author: 'Jeremy Silman',
    level: 'Intermediate',
    topic: 'Strategy',
    description: 'Chỉ ra những ngộ nhận phổ biến và dạy cách đọc sự mất cân bằng (Imbalances).',
    linkedLessonNum: 10,
  },
  {
    id: 'lib_100eg',
    title: '100 Endgames You Must Know',
    author: 'Jesús de la Villa',
    level: 'Intermediate',
    topic: 'Endgames',
    description: '100 thế tàn cuộc thiết yếu nhất cho thực chiến (Lucena, Philidor, Vua & Tốt...).',
    linkedLessonNum: 12,
  },
  {
    id: 'lib_lichess_int',
    title: 'Lichess – Intermediate Chess Course',
    author: 'lichess.org',
    level: 'Intermediate',
    topic: 'Course',
    description: 'Lichess Study tổng hợp các bài học trung cấp về kế hoạch và chiến thuật.',
    url: 'https://lichess.org/study/QjfpcMCD',
    linkedLessonNum: 7,
  },
  {
    id: 'lib_dvoretsky',
    title: "Dvoretsky's Endgame Manual",
    author: 'Mark Dvoretsky',
    level: 'Advanced',
    topic: 'Endgames',
    description: 'Tài liệu tham khảo tàn cuộc chuẩn mực dành cho trình độ Advanced & Mastery.',
    linkedLessonNum: 17,
  },
  {
    id: 'lib_aagaard_calc',
    title: 'Grandmaster Preparation: Calculation',
    author: 'Jacob Aagaard',
    level: 'Advanced',
    topic: 'Tactics',
    description: 'Rèn kỹ năng tính biến sâu, Candidate Moves, Comparison và Pruning.',
    linkedLessonNum: 14,
  },
  {
    id: 'lib_aagaard_pos',
    title: 'Grandmaster Preparation: Positional Play',
    author: 'Jacob Aagaard',
    level: 'Advanced',
    topic: 'Strategy',
    description: '3 câu hỏi cốt lõi để định hướng chiến lược trong thế cờ phức tạp.',
    linkedLessonNum: 15,
  },
  {
    id: 'lib_hellsten',
    title: 'Mastering Chess Strategy',
    author: 'Johan Hellsten',
    level: 'Advanced',
    topic: 'Strategy',
    description: 'Giáo trình thực hành chiến lược toàn diện qua các thế cờ kinh điển.',
    linkedLessonNum: 16,
  },
];

interface PersistedChessUI {
  section: ChessSection;
  activeStage: ChessStage;
  activeLessonId: string;
  libraryStatuses: Record<string, 'queued' | 'reading' | 'completed'>;
  lessonStatuses: Record<string, LessonStatus>;
  libraryFilterLevel: string;
  libraryFilterTopic: string;
}

function loadChessUI(): PersistedChessUI {
  try {
    const raw = localStorage.getItem(CHESS_UI_STATE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PersistedChessUI>;
      return {
        section:
          p.section && (p.section as string) !== 'journal' && (p.section as string) !== 'practice'
            ? p.section
            : 'overview',
        activeStage: p.activeStage || 'beginner',
        activeLessonId: p.activeLessonId || 'ch_01_opening_principles',
        libraryStatuses: p.libraryStatuses || {},
        lessonStatuses: p.lessonStatuses || {},
        libraryFilterLevel: p.libraryFilterLevel || 'All',
        libraryFilterTopic: p.libraryFilterTopic || 'All',
      };
    }
  } catch {
    // ignore
  }
  return {
    section: 'overview',
    activeStage: 'beginner',
    activeLessonId: 'ch_01_opening_principles',
    libraryStatuses: {},
    lessonStatuses: {},
    libraryFilterLevel: 'All',
    libraryFilterTopic: 'All',
  };
}

export function ChessLab() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const modules = useLiveQuery(() => db.chessModules.toArray()) || [];

  const [ui, setUi] = useState<PersistedChessUI>(loadChessUI);
  const [lessonTab, setLessonTab] = useState<LessonTab>('theory');

  useRoomBack(ui.section !== 'overview', () =>
    setUi((p) => ({ ...p, section: p.section === 'lesson' ? 'path' : 'overview' }))
  );

  // Library Search
  const [libSearch, setLibSearch] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(CHESS_UI_STATE_KEY, JSON.stringify(ui));
    } catch {
      // ignore
    }
  }, [ui]);

  // Properly ordered curriculum by numeric prefix (01, 02, 03, 04, 05, 06, ...)
  const sortedModules = useMemo(() => {
    return [...modules].sort(
      (a, b) => extractLessonNumber(a.title) - extractLessonNumber(b.title)
    );
  }, [modules]);

  const activeLesson =
    sortedModules.find((m) => m.id === ui.activeLessonId) ||
    sortedModules.find((m) => !m.done) ||
    sortedModules[0] ||
    null;

  const currentStageMeta =
    STAGES.find((s) => s.id === ui.activeStage) || STAGES[0];

  const masteredCount = sortedModules.filter((m) => m.done).length;
  const activeStageLessons = sortedModules.filter((m) =>
    currentStageMeta.id === 'beginner'
      ? m.phase === 1
      : currentStageMeta.id === 'intermediate'
      ? m.phase === 2
      : m.phase >= 3
  );

  const openLessonWorkspace = (mod: ChessModule, tab: LessonTab = 'theory') => {
    triggerHaptic('selection');
    const st: ChessStage =
      mod.phase === 1 ? 'beginner' : mod.phase === 2 ? 'intermediate' : 'advanced';
    setLessonTab(tab);
    setUi((prev) => ({
      ...prev,
      section: 'lesson',
      activeStage: st,
      activeLessonId: mod.id,
      lessonStatuses: {
        ...prev.lessonStatuses,
        [mod.id]:
          prev.lessonStatuses[mod.id] && prev.lessonStatuses[mod.id] !== 'not_started'
            ? prev.lessonStatuses[mod.id]
            : mod.done
            ? 'mastered'
            : 'learning',
      },
    }));
  };

  const setLessonStatus = async (mod: ChessModule, next: LessonStatus) => {
    triggerHaptic('selection');
    await db.chessModules.update(mod.id, {
      done: next === 'mastered',
      updatedAt: Date.now(),
    });
    setUi((prev) => ({
      ...prev,
      lessonStatuses: { ...prev.lessonStatuses, [mod.id]: next },
    }));
    showToast(`Trạng thái bài học: ${STATUS_META[next].label}`);
  };

  // Top Header / Section Navigation inside Chess Room
  const renderSectionBreadcrumb = (title: string) => (
    <div className="flex items-center pb-3 border-b border-[var(--os-border)]">
      <h2 className="text-[17px] font-semibold text-[#EDEAE2]">{title}</h2>
    </div>
  );

  // =========================================================================
  // 1. CHESS ROOM OVERVIEW (Clean Stages Directory matching The Lab)
  // =========================================================================
  if (ui.section === 'overview') {
    const resumeMod = activeLesson || sortedModules[0];

    return (
      <div className="space-y-4">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap pb-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-semibold text-white">
                {t('Stages', 'Lộ trình cờ vua')}
              </h2>
              <span
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(155, 170, 152, 0.12)',
                  color: '#9BAA98',
                  border: '1px solid rgba(155, 170, 152, 0.25)',
                }}
              >
                {masteredCount}/{sortedModules.length} ✓
              </span>
            </div>

            <div className="flex items-center gap-2">
              {resumeMod && (
                <button
                  type="button"
                  onClick={() => openLessonWorkspace(resumeMod, 'theory')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2b3343] hover:border-[#cba86a]/60 bg-[#12161f] hover:bg-[#181d28] text-[#cba86a] hover:text-[#faebd7] text-[12px] font-medium transition-all cursor-pointer"
                >
                  <span>{t('Resume', 'Học tiếp')}</span>
                  <span>→</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setUi((p) => ({ ...p, section: 'library' }));
                }}
                className="px-3 py-1.5 rounded-lg border border-[#222834] hover:border-[#384152] bg-[#12151c] text-[#9ca3af] hover:text-white text-[12px] font-medium transition-all cursor-pointer"
              >
                {t('Library', 'Tài liệu')}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {STAGES.map((st) => {
              const stItems = sortedModules.filter((m) => m.phase === st.phase);
              const stMastered = stItems.filter((m) => m.done).length;
              return (
                <DirectoryCard
                  key={st.id}
                  code={`STAGE.${st.code}`}
                  title={st.title}
                  subtitle={st.focus}
                  statuses={[
                    { label: `${stItems.length} ${t('lessons', 'bài')}`, tone: 'muted' },
                    ...(stMastered > 0
                      ? [{ label: `${stMastered} ${t('Mastered', 'Thành thạo')}`, tone: 'emerald' as const }]
                      : []),
                  ]}
                  onClick={() =>
                    setUi((p) => ({
                      ...p,
                      activeStage: st.id,
                      section: 'path',
                    }))
                  }
                />
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // 2. LEARNING PATH (Stage Syllabus & Lessons)
  // =========================================================================
  if (ui.section === 'path') {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--os-border)]">
          <div>
            <span className="block text-[11px] font-medium text-[#cba86a]">
              STAGE.{currentStageMeta.code} · {currentStageMeta.eloRef}
            </span>
            <h2 className="text-[17px] font-semibold text-white">{currentStageMeta.title}</h2>
          </div>

          <div className="flex items-center gap-1.5">
            {STAGES.map((st) => {
              const active = ui.activeStage === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setUi((p) => ({ ...p, activeStage: st.id }))}
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

        <p className="text-[13px] text-[#9ca3af]">{currentStageMeta.goal}</p>

        {/* Ordered Lesson List */}
        <div className="divide-y divide-[var(--os-border)] border-y border-[var(--os-border)]">
          {activeStageLessons.map((mod) => {
            const st = getLessonStatus(mod, ui.lessonStatuses);
            const meta = STATUS_META[st];
            return (
              <div
                key={mod.id}
                onClick={() => openLessonWorkspace(mod)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openLessonWorkspace(mod);
                }}
                className="py-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[rgba(217,213,203,0.025)] transition-colors group"
              >
                <div className="min-w-0 space-y-1">
                  <h4 className="text-[15px] font-semibold group-hover:text-white" style={{ color: 'var(--os-ivory-bright)' }}>
                    {mod.title}
                  </h4>
                  <p className="text-[12px] line-clamp-1" style={{ color: 'var(--os-ivory-muted)' }}>
                    {mod.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: meta.bg,
                      color: meta.color,
                      border: '1px solid var(--os-border)',
                    }}
                  >
                    {meta.label}
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
  // 3. LESSON WORKSPACE (Focused Study for ONE Lesson)
  // =========================================================================
  if (ui.section === 'lesson' && activeLesson) {
    const lessonStatus = getLessonStatus(activeLesson, ui.lessonStatuses);
    const num = extractLessonNumber(activeLesson.title);
    const stageName = activeLesson.phase === 1 ? 'FOUNDATION' : activeLesson.phase === 2 ? 'INTERMEDIATE' : 'ADVANCED';

    // Select a relevant board position for this lesson's Theory Diagram / Examples / Practice
    const lessonSampleFen =
      num === 1
        ? INITIAL_FEN
        : num === 2
        ? 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'
        : num === 3
        ? OPENING_LINES[0]?.steps[Math.min(5, (OPENING_LINES[0]?.steps.length || 1) - 1)]?.fen || INITIAL_FEN
        : num === 4
        ? CHESS_PUZZLES[1]?.fen || INITIAL_FEN
        : num === 5
        ? CHESS_PUZZLES[2]?.fen || INITIAL_FEN
        : num === 6
        ? '8/8/4k3/8/4P3/4K3/8/8 w - - 0 1'
        : num % 3 === 1
        ? CHESS_PUZZLES[3]?.fen || INITIAL_FEN
        : num % 3 === 2
        ? CHESS_PUZZLES[4]?.fen || INITIAL_FEN
        : 'r2q1rk1/ppp2ppp/2npbn2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 8';

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--os-border)]">
          <div className="min-w-0">
            <h2 className="editorial-h2 truncate">{activeLesson.title}</h2>
            <p className="text-[12px] truncate" style={{ color: 'var(--os-ivory-muted)' }}>
              {activeLesson.description}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {(['not_started', 'learning', 'practicing', 'mastered', 'paused'] as const).map((st) => {
              const active = lessonStatus === st;
              const meta = STATUS_META[st];
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setLessonStatus(activeLesson, st)}
                  className="px-2.5 py-1 rounded-[6px] metadata text-[10px] uppercase cursor-pointer"
                  style={{
                    backgroundColor: active ? '#262932' : 'transparent',
                    color: active ? meta.color : 'var(--os-ivory-faint)',
                    border: active ? '1px solid var(--os-border)' : '1px solid transparent',
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contextual Lesson Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--os-border)] overflow-x-auto no-scrollbar">
          {(
            [
              ['theory', 'Theory'],
              ['examples', 'Examples'],
              ['explain', 'Explain'],
              ['review', 'Review'],
            ] as const
          ).map(([tb, lbl]) => {
            const active = lessonTab === tb;
            return (
              <button
                key={tb}
                type="button"
                onClick={() => setLessonTab(tb)}
                className="px-4 py-2.5 text-[13px] font-medium shrink-0 cursor-pointer transition-colors"
                style={{
                  color: active ? 'var(--os-ivory-bright)' : 'var(--os-ivory-muted)',
                  borderBottom: active ? '2px solid var(--os-brass)' : '2px solid transparent',
                }}
              >
                {lbl}
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        {lessonTab === 'theory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="metadata text-[10.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                  {t('CORE CONCEPT — UNDERSTAND WHY BEFORE MEMORIZING', 'NGUYÊN LÝ CỐT LÕI — HIỂU TẠI SAO TRƯỚC KHI THUỘC LÒNG')}
                </span>
                <p className="text-[15px] leading-[1.75]" style={{ color: 'var(--os-ivory)' }}>
                  {activeLesson.concept || activeLesson.description}
                </p>
              </div>

              {activeLesson.mistake && (
                <div className="p-4 rounded-[10px] space-y-1" style={{ backgroundColor: '#15171C', border: '1px solid rgba(194,123,118,0.3)' }}>
                  <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-crimson)' }}>
                    {t('COMMON TRAP TO AVOID', 'LỖI THƯỜNG GẶP CẦN TRÁNH')}
                  </span>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory)' }}>
                    {activeLesson.mistake}
                  </p>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setLessonTab('examples')}
                  className="px-4 py-2 rounded-[9px] text-[12.5px] font-medium cursor-pointer"
                  style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
                >
                  {t('Inspect Worked Example →', 'Xem ví dụ trên bàn cờ →')}
                </button>
                <button
                  type="button"
                  onClick={() => setLessonTab('explain')}
                  className="px-4 py-2 rounded-[9px] text-[12.5px] font-medium cursor-pointer"
                  style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-ivory)', border: '1px solid var(--os-border)' }}
                >
                  {t('Self-Explain', 'Tự diễn giải (Explain)')}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-2.5">
              <div className="p-3.5 rounded-[12px] space-y-2.5" style={{ backgroundColor: '#12151C', border: '1px solid rgba(203, 168, 106, 0.22)' }}>
                <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#cba86a' }}>
                  {t('ILLUSTRATIVE BOARD POSITION', 'HÌNH MINH HỌA THẾ CỜ')}
                </span>
                <InteractiveChessBoard initialFen={lessonSampleFen} />
              </div>
            </div>
          </div>
        )}

        {lessonTab === 'examples' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            <div className="lg:col-span-6">
              <InteractiveChessBoard initialFen={lessonSampleFen} />
            </div>
            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-[12px] space-y-2.5" style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}>
                <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                  MINH HỌA THỰC TẾ
                </span>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--os-ivory)' }}>
                  {activeLesson.example || 'Thử di chuyển các quân hợp lệ trực tiếp trên bàn cờ bên cạnh để quan sát kiểm soát ô và phản công.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {lessonTab === 'explain' && (
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                YOUR UNDERSTANDING · RETRIEVAL PRACTICE
              </span>
              <p className="text-[14.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                {activeLesson.openQuestion || 'Hãy đóng phần Theory lại và tự giải thích bản chất của bài học này bằng ngôn ngữ của bạn:'}
              </p>
            </div>
            <textarea
              rows={7}
              value={activeLesson.notes}
              onChange={(e) =>
                db.chessModules.update(activeLesson.id, { notes: e.target.value, updatedAt: Date.now() })
              }
              placeholder="Write your explanation without looking at the theory..."
              className="w-full p-4 rounded-[10px] text-[14px] leading-relaxed"
              style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)', color: 'var(--os-ivory)' }}
            />
            <p className="metadata text-[10.5px]" style={{ color: 'var(--os-sage)' }}>
              ● Tự động lưu vào cơ sở dữ liệu
            </p>
          </div>
        )}

        {lessonTab === 'review' && (
          <div className="space-y-5 max-w-2xl">
            <div className="space-y-2">
              <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-dusty-blue)' }}>
                TÀI LIỆU LIÊN KẾT VỚI BÀI HỌC NÀY
              </span>
              {activeLesson.resources && activeLesson.resources.length > 0 ? (
                <div className="space-y-2">
                  {activeLesson.resources.map((res, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-[10px] flex items-center justify-between gap-3"
                      style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}
                    >
                      <div>
                        <p className="text-[13.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                          {res.label}
                        </p>
                        {res.note && (
                          <p className="text-[12px]" style={{ color: 'var(--os-ivory-muted)' }}>
                            {res.note}
                          </p>
                        )}
                      </div>
                      {res.url && (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="metadata text-[11px] hover:underline shrink-0"
                          style={{ color: 'var(--os-brass)' }}
                        >
                          Open ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                  Xem thêm tài liệu trong mục Chess Library.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 4. CHESS LIBRARY (Searchable & Linked to Curriculum Lessons)
  // =========================================================================
  const filteredLib = CHESS_LIBRARY_ITEMS.filter((item) => {
    if (ui.libraryFilterLevel !== 'All' && item.level !== ui.libraryFilterLevel) return false;
    if (ui.libraryFilterTopic !== 'All' && item.topic !== ui.libraryFilterTopic) return false;
    if (libSearch.trim()) {
      const q = libSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {renderSectionBreadcrumb('CHESS LIBRARY')}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={libSearch}
          onChange={(e) => setLibSearch(e.target.value)}
          placeholder="Tìm sách, khóa học, tác giả..."
          className="px-3.5 py-2 rounded-[9px] text-[13px] w-full sm:w-64"
          style={{ backgroundColor: 'var(--os-graphite)', border: '1px solid var(--os-border)', color: 'var(--os-ivory)' }}
        />

        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setUi((p) => ({ ...p, libraryFilterLevel: lvl }))}
              className="px-2.5 py-1 rounded-[7px] metadata text-[10.5px] cursor-pointer"
              style={{
                backgroundColor: ui.libraryFilterLevel === lvl ? 'var(--os-brass)' : 'var(--os-graphite)',
                color: ui.libraryFilterLevel === lvl ? '#101114' : 'var(--os-ivory-muted)',
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[var(--os-border)] border-y border-[var(--os-border)]">
        {filteredLib.map((item) => {
          const st = ui.libraryStatuses[item.id] || 'queued';
          const linkedLesson = item.linkedLessonNum
            ? sortedModules.find((m) => extractLessonNumber(m.title) === item.linkedLessonNum)
            : undefined;
          return (
            <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-brass)' }}>
                    {item.level} · {item.topic}
                  </span>
                  <span className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    · {item.author}
                  </span>
                </div>
                <h4 className="text-[15.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                  {item.title}
                </h4>
                <p className="text-[12.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <select
                  value={st}
                  onChange={(e) =>
                    setUi((p) => ({
                      ...p,
                      libraryStatuses: {
                        ...p.libraryStatuses,
                        [item.id]: e.target.value as 'queued' | 'reading' | 'completed',
                      },
                    }))
                  }
                  className="px-2 py-1 rounded-[6px] metadata text-[10px] bg-[#14161B] border border-[var(--os-border)] text-[#EDEAE2]"
                >
                  <option value="queued">Queued</option>
                  <option value="reading">Reading</option>
                  <option value="completed">Completed</option>
                </select>

                {linkedLesson && (
                  <button
                    type="button"
                    onClick={() => openLessonWorkspace(linkedLesson)}
                    className="metadata text-[10.5px] hover:underline cursor-pointer"
                    style={{ color: 'var(--os-dusty-blue)' }}
                  >
                    Lesson {String(item.linkedLessonNum).padStart(2, '0')} ↗
                  </button>
                )}

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="metadata text-[10.5px] hover:underline"
                    style={{ color: 'var(--os-brass)' }}
                  >
                    Link ↗
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
