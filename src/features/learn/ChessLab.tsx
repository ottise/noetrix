import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createId, getLocalDateStr, formatShortDate } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import type { ChessGameLog, ChessModule, ChessStage } from '../../types';
import { Modal, useToast } from '../../components/ui/Primitives';
import {
  CHESS_PUZZLES,
  INITIAL_FEN,
  OPENING_LINES,
  type ChessMove,
} from './chessEngine';
import { InteractiveChessBoard } from './InteractiveChessBoard';

type ChessSection = 'overview' | 'path' | 'lesson' | 'practice' | 'journal' | 'library';
type LessonTab = 'theory' | 'examples' | 'practice' | 'explain' | 'review';
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
        section: p.section || 'overview',
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
  const games = useLiveQuery(() => db.chessGames.orderBy('createdAt').reverse().toArray()) || [];

  const [ui, setUi] = useState<PersistedChessUI>(loadChessUI);
  const [lessonTab, setLessonTab] = useState<LessonTab>('theory');

  // Practice Board states
  const [practiceMode, setPracticeMode] = useState<'sandbox' | 'openings' | 'puzzles'>('openings');
  const [openingId, setOpeningId] = useState(OPENING_LINES[0].id);
  const [openingStep, setOpeningStep] = useState(0);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [puzzleFeedback, setPuzzleFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showPuzzleHint, setShowPuzzleHint] = useState(false);

  // Game Journal Modal & Fields
  const [logOpen, setLogOpen] = useState(false);
  const [platform, setPlatform] = useState<ChessGameLog['platform']>('Lichess');
  const [rating, setRating] = useState<number>(1000);
  const [result, setResult] = useState<ChessGameLog['result']>('loss');
  const [turningPointMove, setTurningPointMove] = useState('');
  const [missedCandidateMove, setMissedCandidateMove] = useState('');
  const [calcMode, setCalcMode] = useState<'calculated' | 'guessed' | 'mixed'>('calculated');
  const [errCat, setErrCat] = useState<NonNullable<ChessGameLog['errorCategory']>>('tactics');
  const [blunderType, setBlunderType] = useState('Hanging Piece / Bỏ sót đe dọa');
  const [gameUrl, setGameUrl] = useState('');
  const [takeaway, setTakeaway] = useState('');

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

  const handleLogGame = async (e: React.FormEvent) => {
    e.preventDefault();
    const item: ChessGameLog = {
      id: createId('cg'),
      date: getLocalDateStr(),
      platform,
      rating: Number(rating) || 1000,
      result,
      blunderType: blunderType.trim() || 'Uncategorized',
      gameUrl: gameUrl.trim(),
      takeaway: takeaway.trim(),
      turningPointMove: turningPointMove.trim(),
      missedCandidateMove: missedCandidateMove.trim(),
      calculatedOrGuessed: calcMode,
      errorCategory: errCat,
      createdAt: Date.now(),
    };
    await db.chessGames.put(item);
    setTakeaway('');
    setTurningPointMove('');
    setMissedCandidateMove('');
    setGameUrl('');
    setLogOpen(false);
    showToast('Đã lưu ván đấu & phân tích tư duy vào Game Journal');
  };

  // Top Header / Section Navigation inside Chess Room
  const renderSectionBreadcrumb = (title: string) => (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--os-border)]">
      <div className="flex items-center gap-2 metadata text-[10.5px] uppercase tracking-[0.12em]">
        <button
          type="button"
          onClick={() => setUi((p) => ({ ...p, section: 'overview' }))}
          className="hover:underline cursor-pointer"
          style={{ color: 'var(--os-ivory-muted)' }}
        >
          ← CHESS ROOM
        </button>
        <span style={{ color: 'var(--os-ivory-faint)' }}>/</span>
        <span style={{ color: 'var(--os-brass)' }}>{title}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {(
          [
            ['path', t('Learning Path', 'Lộ trình học')],
            ['practice', t('Practice Board', 'Bàn cờ thực hành')],
            ['journal', t('Game Journal', 'Nhật ký ván đấu')],
            ['library', t('Chess Library', 'Thư viện Cờ')],
          ] as const
        ).map(([sec, lbl]) => (
          <button
            key={sec}
            type="button"
            onClick={() => setUi((p) => ({ ...p, section: sec }))}
            className="px-2.5 py-1 rounded-[7px] text-[11.5px] cursor-pointer transition-colors"
            style={{
              backgroundColor: ui.section === sec ? '#23262E' : 'transparent',
              color: ui.section === sec ? 'var(--os-brass)' : 'var(--os-ivory-muted)',
              border: ui.section === sec ? '1px solid rgba(185,155,121,0.35)' : '1px solid transparent',
            }}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );

  // =========================================================================
  // 1. CHESS ROOM OVERVIEW (Clean Orientation Hub — No Wall of Text!)
  // =========================================================================
  if (ui.section === 'overview') {
    const resumeMod = activeLesson || sortedModules[0];
    const resumeNum = resumeMod ? extractLessonNumber(resumeMod.title) : 1;
    const resumeStage = resumeMod?.phase === 1 ? 'FOUNDATION' : resumeMod?.phase === 2 ? 'INTERMEDIATE' : 'ADVANCED';
    const stageTotal = resumeMod?.phase === 1 ? 6 : resumeMod?.phase === 2 ? 7 : 7;

    return (
      <div className="space-y-9">
        {/* Identity & Honest Progress Summary */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--os-border)]">
          <div className="space-y-1">
            <span className="metadata text-[10.5px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
              {t('THE PLAYGROUND / CHESS ROOM', 'SÂN CHƠI / PHÒNG CỜ VUA')}
            </span>
            <h2 className="editorial-h2">{t('Think ahead before you move.', 'Nghĩ trước vài bước trước khi đi.')}</h2>
            <p className="text-[13.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
              {t('A quiet, structured journey from fundamentals to mastery.', 'Hành trình tĩnh lặng và bài bản từ nền tảng đến tinh thông.')}
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div>
              <p className="font-editorial text-[24px] leading-none tabular-nums" style={{ color: 'var(--os-ivory-bright)' }}>
                {masteredCount} <span className="text-[14px]" style={{ color: 'var(--os-ivory-faint)' }}>/ {sortedModules.length}</span>
              </p>
              <p className="metadata text-[9.5px] uppercase mt-1" style={{ color: 'var(--os-ivory-faint)' }}>
                {t('Lessons Mastered', 'Bài đã thành thạo')}
              </p>
            </div>
            <div className="h-7 w-[1px] bg-[var(--os-border)]" />
            <div>
              <p className="font-editorial text-[16px] leading-none" style={{ color: games.length > 0 ? 'var(--os-sage)' : 'var(--os-ivory-muted)' }}>
                {games.length > 0 ? t(`${games.length} Games Logged`, `${games.length} Ván đã ghi`) : t('No games recorded', 'Chưa ghi ván nào')}
              </p>
              <p className="metadata text-[9.5px] uppercase mt-1.5" style={{ color: 'var(--os-ivory-faint)' }}>
                {t('Game Journal', 'Nhật ký ván đấu')}
              </p>
            </div>
          </div>
        </div>

        {/* CURRENT SESSION / RESUME LEARNING SPOTLIGHT */}
        {resumeMod && (
          <section
            aria-label="Current Session"
            className="rounded-[14px] overflow-hidden"
            style={{ backgroundColor: 'var(--os-graphite)', border: '1px solid var(--os-border)' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-8 p-6 sm:p-7 flex flex-col justify-between gap-5">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
                      {t('● CURRENT SESSION · RESUME LEARNING', '● PHIÊN HIỆN TẠI · HỌC TIẾP')}
                    </span>
                    <span className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                      · {resumeStage} · {t('LESSON', 'BÀI')} {String(resumeNum).padStart(2, '0')} / {String(stageTotal).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-editorial-vi text-[24px] sm:text-[28px] leading-snug" style={{ color: 'var(--os-ivory-bright)' }}>
                    {resumeMod.title.replace(/^\d+\.\s*/, '')}
                  </h3>
                  <p className="text-[13.5px] leading-relaxed line-clamp-2" style={{ color: 'var(--os-ivory-muted)' }}>
                    {resumeMod.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--os-border)]">
                  <button
                    type="button"
                    onClick={() => openLessonWorkspace(resumeMod, 'theory')}
                    className="px-4 py-2 rounded-[9px] text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90"
                    style={{ backgroundColor: 'var(--os-ivory-bright)', color: 'var(--os-obsidian)' }}
                  >
                    {t('Continue where you left off →', 'Tiếp tục bài đang học →')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUi((p) => ({ ...p, section: 'practice' }))}
                    className="metadata text-[11px] hover:underline cursor-pointer"
                    style={{ color: 'var(--os-dusty-blue)' }}
                  >
                    {t('Open Practice Board ↗', 'Mở Bàn cờ thực hành ↗')}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 relative min-h-[160px] lg:border-l border-[var(--os-border)] overflow-hidden p-5 flex flex-col justify-end">
                <img
                  src="/art/room-playground.jpg"
                  alt="Chess Room Atmosphere"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(180deg, rgba(16,17,20,0.3) 0%, rgba(16,17,20,0.92) 100%)',
                  }}
                />
                <div className="relative z-10 space-y-1">
                  <span className="metadata text-[9.5px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
                    {t('RULE 01', 'NGUYÊN TẮC 01')}
                  </span>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(237,234,226,0.88)' }}>
                    {t('“Don’t memorize moves. Understand why a move works.”', '“Đừng học vẹt nước đi. Hãy hiểu vì sao nước đi đó có giá trị.”')}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FOUR CLEAN DESTINATIONS (Overview -> Destinations, Not All Content Dumped!) */}
        <section className="space-y-3">
          <p className="editorial-eyebrow">{t('EXPLORE CHESS ROOM', 'KHÁM PHÁ PHÒNG CỜ')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y divide-y sm:divide-y-0 sm:divide-x divide-[var(--os-border)]" style={{ borderColor: 'var(--os-border)' }}>
            {(
              [
                {
                  id: 'path',
                  num: '01',
                  title: t('Learning Path', 'Lộ Trình Học'),
                  sub: t('3-stage curriculum from Foundation to Advanced.', 'Giáo trình 3 giai đoạn từ Foundation đến Advanced.'),
                  cta: `${sortedModules.length} ${t('lessons', 'bài')}`,
                  accent: 'var(--os-brass)',
                },
                {
                  id: 'practice',
                  num: '02',
                  title: t('Practice Board', 'Bàn Cờ Thực Hành'),
                  sub: t('Legal drag-and-drop board, Openings & Tactical Puzzles.', 'Bàn cờ tương tác kéo thả hợp lệ, Khai cuộc & Tactical Puzzles.'),
                  cta: t('Interactive 8×8', 'Bàn cờ 8×8'),
                  accent: 'var(--os-dusty-blue)',
                },
                {
                  id: 'journal',
                  num: '03',
                  title: t('Game Journal', 'Nhật Ký Ván Đấu'),
                  sub: t('Save PGN, Critical Moments & self-analyze before turning on Engine.', 'Lưu PGN, Critical Moments & tự phân tích 4 câu hỏi trước Engine.'),
                  cta: games.length > 0 ? `${games.length} ${t('games', 'ván')}` : t('Ready to log', 'Sẵn sàng ghi'),
                  accent: 'var(--os-sage)',
                },
                {
                  id: 'library',
                  num: '04',
                  title: t('Chess Library', 'Thư Viện Cờ'),
                  sub: t('Classic books, courses & Lichess Studies curated by level.', 'Sách kinh điển, khóa học, Lichess Studies phân theo trình độ.'),
                  cta: `${CHESS_LIBRARY_ITEMS.length} ${t('references', 'tài liệu')}`,
                  accent: 'var(--os-ivory-muted)',
                },
              ] as const
            ).map((dest, idx) => (
              <button
                key={dest.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setUi((p) => ({ ...p, section: dest.id }));
                }}
                className={`py-5 ${idx === 0 ? 'sm:pr-5' : idx === 3 ? 'sm:pl-5' : 'sm:px-5'} text-left flex flex-col justify-between gap-4 hover:bg-[rgba(217,213,203,0.025)] transition-colors cursor-pointer group`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="metadata text-[10.5px]" style={{ color: dest.accent }}>
                      {dest.num}
                    </span>
                    <span className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                      {dest.cta}
                    </span>
                  </div>
                  <h3 className="editorial-h3 group-hover:text-white transition-colors">
                    {dest.title}
                  </h3>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                    {dest.sub}
                  </p>
                </div>
                <span className="metadata text-[11px] group-hover:translate-x-1 transition-transform" style={{ color: 'var(--os-brass)' }}>
                  Enter →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Activity (Compact) */}
        {games.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="editorial-eyebrow">RECENT GAME REFLECTION</p>
              <button
                type="button"
                onClick={() => setUi((p) => ({ ...p, section: 'journal' }))}
                className="metadata text-[10.5px] hover:underline cursor-pointer"
                style={{ color: 'var(--os-dusty-blue)' }}
              >
                View all →
              </button>
            </div>
            <div className="p-4 rounded-[12px] flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--os-graphite)', border: '1px solid var(--os-border)' }}>
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium truncate" style={{ color: 'var(--os-ivory-bright)' }}>
                  {games[0].platform} · {games[0].result.toUpperCase()} · {games[0].blunderType}
                </p>
                <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
                  {games[0].takeaway || 'Đã ghi nhận nhật ký ván đấu.'}
                </p>
              </div>
              <span className="metadata text-[10.5px] shrink-0" style={{ color: 'var(--os-ivory-faint)' }}>
                {formatShortDate(games[0].date)}
              </span>
            </div>
          </section>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. LEARNING PATH (3 Stages: Foundation, Intermediate, Advanced)
  // =========================================================================
  if (ui.section === 'path') {
    return (
      <div className="space-y-8">
        {renderSectionBreadcrumb('LEARNING PATH')}

        {/* 3 Clean Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAGES.map((st) => {
            const stItems = sortedModules.filter((m) => m.phase === st.phase);
            const stMastered = stItems.filter((m) => m.done).length;
            const active = ui.activeStage === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setUi((p) => ({ ...p, activeStage: st.id }))}
                className="p-5 rounded-[12px] text-left space-y-2.5 transition-all cursor-pointer"
                style={{
                  backgroundColor: active ? 'var(--os-stone)' : 'var(--os-graphite)',
                  border: active ? '1px solid rgba(185,155,121,0.55)' : '1px solid var(--os-border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="metadata text-[10.5px] uppercase" style={{ color: 'var(--os-brass)' }}>
                    STAGE {st.code}
                  </span>
                  <span className="metadata text-[10.5px] tabular-nums" style={{ color: 'var(--os-ivory-faint)' }}>
                    {stMastered}/{stItems.length} Mastered
                  </span>
                </div>
                <h3 className="editorial-h3">{st.title}</h3>
                <p className="text-[12px]" style={{ color: 'var(--os-ivory-muted)' }}>
                  {st.focus}
                </p>
                <p className="metadata text-[10px] pt-1" style={{ color: 'var(--os-ivory-faint)' }}>
                  {st.eloRef}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail & Ordered Lessons */}
        <div className="space-y-5 pt-2">
          <div className="p-5 rounded-[12px] space-y-2" style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}>
            <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-dusty-blue)' }}>
              STAGE {currentStageMeta.code} · {currentStageMeta.title.toUpperCase()} OBJECTIVES
            </span>
            <p className="text-[14px]" style={{ color: 'var(--os-ivory-bright)' }}>
              {currentStageMeta.goal}
            </p>
            <p className="text-[12.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
              <strong>Tiêu chí hoàn thành gợi ý:</strong> {currentStageMeta.criteria}
            </p>
          </div>

          {/* Ordered Lesson List — ZERO Fake Checkmarks! */}
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
                    <h4 className="text-[15.5px] font-medium group-hover:text-white" style={{ color: 'var(--os-ivory-bright)' }}>
                      {mod.title}
                    </h4>
                    <p className="text-[12.5px] line-clamp-1" style={{ color: 'var(--os-ivory-muted)' }}>
                      {mod.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="metadata text-[10px] uppercase tracking-[0.06em] px-2.5 py-1 rounded-[6px]"
                      style={{
                        backgroundColor: meta.bg,
                        color: meta.color,
                        border: '1px solid var(--os-border)',
                      }}
                    >
                      {meta.label}
                    </span>
                    <span className="metadata text-[11.5px] group-hover:translate-x-1 transition-transform" style={{ color: 'var(--os-brass)' }}>
                      Open Lesson →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
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
        {/* Breadcrumb & Status Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--os-border)]">
          <div className="flex items-center gap-2 metadata text-[10.5px] uppercase tracking-[0.12em]">
            <button
              type="button"
              onClick={() => setUi((p) => ({ ...p, section: 'path' }))}
              className="hover:underline cursor-pointer"
              style={{ color: 'var(--os-ivory-muted)' }}
            >
              ← CHESS ROOM / {stageName}
            </button>
            <span style={{ color: 'var(--os-ivory-faint)' }}>/</span>
            <span style={{ color: 'var(--os-brass)' }}>LESSON {String(num).padStart(2, '0')}</span>
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

        {/* Lesson Header */}
        <div className="space-y-1.5">
          <h2 className="editorial-h2">{activeLesson.title}</h2>
          <p className="text-[14px]" style={{ color: 'var(--os-ivory-muted)' }}>
            {activeLesson.description}
          </p>
        </div>

        {/* Contextual Lesson Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--os-border)] overflow-x-auto no-scrollbar">
          {(
            [
              ['theory', 'Theory'],
              ['examples', 'Examples'],
              ['practice', 'Practice'],
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

        {(lessonTab === 'examples' || lessonTab === 'practice') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            <div className="lg:col-span-6">
              <InteractiveChessBoard initialFen={lessonSampleFen} />
            </div>
            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-[12px] space-y-2.5" style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}>
                <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                  {lessonTab === 'examples' ? 'MINH HỌA THỰC TẾ' : 'BÀI TẬP THỰC HÀNH'}
                </span>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--os-ivory)' }}>
                  {lessonTab === 'examples'
                    ? activeLesson.example || 'Thử di chuyển các quân hợp lệ trực tiếp trên bàn cờ bên cạnh để quan sát kiểm soát ô và phản công.'
                    : activeLesson.exercise || 'Thực hành trực tiếp trên bàn cờ: luôn rà Checks → Captures → Threats trước khi buông quân.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUi((p) => ({ ...p, section: 'practice' }))}
                className="metadata text-[11px] hover:underline cursor-pointer"
                style={{ color: 'var(--os-dusty-blue)' }}
              >
                Mở Practice Board đầy đủ (Openings & Tactical Puzzles) ↗
              </button>
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
  // 4. PRACTICE BOARD (Dedicated Interactive Legal-Move Chess Studio)
  // =========================================================================
  if (ui.section === 'practice') {
    const activeOpening = OPENING_LINES.find((o) => o.id === openingId) || OPENING_LINES[0];
    const currentOpenStep = activeOpening.steps[openingStep] || activeOpening.steps[0];
    const currentPuzzle = CHESS_PUZZLES[puzzleIdx] || CHESS_PUZZLES[0];

    const activeFen =
      practiceMode === 'openings'
        ? currentOpenStep.fen
        : practiceMode === 'puzzles'
        ? currentPuzzle.fen
        : INITIAL_FEN;

    const handlePuzzleMove = (move: ChessMove) => {
      if (practiceMode !== 'puzzles') return;
      if (move.from === currentPuzzle.solutionFrom && move.to === currentPuzzle.solutionTo) {
        triggerHaptic('success');
        setPuzzleFeedback('correct');
        showToast(`Chính xác! ${move.san} — Đã giải được ${currentPuzzle.motif}`);
      } else {
        triggerHaptic('warning');
        setPuzzleFeedback('wrong');
      }
    };

    return (
      <div className="space-y-6">
        {renderSectionBreadcrumb('PRACTICE BOARD')}

        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['openings', 'Opening Explorer'],
              ['puzzles', 'Tactical Puzzles'],
              ['sandbox', 'Free Analysis Sandbox'],
            ] as const
          ).map(([m, lbl]) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setPracticeMode(m);
                setPuzzleFeedback('idle');
                setShowPuzzleHint(false);
              }}
              className="px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium cursor-pointer"
              style={{
                backgroundColor: practiceMode === m ? 'var(--os-brass)' : 'var(--os-graphite)',
                color: practiceMode === m ? '#101114' : 'var(--os-ivory)',
                border: '1px solid var(--os-border)',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Interactive 8x8 Chessboard */}
          <div className="lg:col-span-6">
            <InteractiveChessBoard
              initialFen={activeFen}
              onUserMove={handlePuzzleMove}
            />
          </div>

          {/* Right Context Panel */}
          <div className="lg:col-span-6 space-y-4">
            {practiceMode === 'openings' && (
              <div className="p-5 rounded-[12px] space-y-4" style={{ backgroundColor: 'var(--os-graphite)', border: '1px solid var(--os-border)' }}>
                <div className="flex items-center justify-between">
                  <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                    OPENING EXPLORER · ECO {activeOpening.eco}
                  </span>
                  <select
                    value={openingId}
                    onChange={(e) => {
                      setOpeningId(e.target.value);
                      setOpeningStep(0);
                    }}
                    className="px-2.5 py-1 rounded-[7px] text-[12px] bg-[#101114] border border-[var(--os-border)] text-[#EDEAE2]"
                  >
                    {OPENING_LINES.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {activeOpening.steps.map((st, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setOpeningStep(idx)}
                      className="px-2.5 py-1 rounded-[7px] metadata text-[11px] cursor-pointer"
                      style={{
                        backgroundColor: openingStep === idx ? 'var(--os-brass)' : '#101114',
                        color: openingStep === idx ? '#101114' : 'var(--os-ivory-muted)',
                        border: '1px solid var(--os-border)',
                      }}
                    >
                      {st.moveLabel}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[var(--os-border)]">
                  <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-sage)' }}>
                    {currentOpenStep.principle}
                  </span>
                  <p className="text-[14px] leading-relaxed" style={{ color: 'var(--os-ivory)' }}>
                    {currentOpenStep.explanation}
                  </p>
                </div>
              </div>
            )}

            {practiceMode === 'puzzles' && (
              <div className="p-5 rounded-[12px] space-y-4" style={{ backgroundColor: 'var(--os-graphite)', border: '1px solid var(--os-border)' }}>
                <div className="flex items-center justify-between">
                  <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                    PUZZLE 0{puzzleIdx + 1}/0{CHESS_PUZZLES.length} · {currentPuzzle.motif} ({currentPuzzle.difficulty})
                  </span>
                  <div className="flex gap-1.5">
                    {CHESS_PUZZLES.map((pz, i) => (
                      <button
                        key={pz.id}
                        type="button"
                        onClick={() => {
                          setPuzzleIdx(i);
                          setPuzzleFeedback('idle');
                          setShowPuzzleHint(false);
                        }}
                        className="w-6 h-6 rounded-[6px] metadata text-[10px] cursor-pointer"
                        style={{
                          backgroundColor: puzzleIdx === i ? 'var(--os-brass)' : '#101114',
                          color: puzzleIdx === i ? '#101114' : 'var(--os-ivory-muted)',
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <h3 className="editorial-h3">{currentPuzzle.title}</h3>
                <p className="text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                  Lượt Trắng đi. Kéo thả hoặc bấm chọn quân để tìm nước đi thắng ngay!
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPuzzleHint((h) => !h)}
                    className="px-3 py-1.5 rounded-[8px] metadata text-[11px] cursor-pointer"
                    style={{ backgroundColor: '#101114', color: 'var(--os-dusty-blue)', border: '1px solid var(--os-border)' }}
                  >
                    {showPuzzleHint ? 'Ẩn Hint' : 'Show Hint'}
                  </button>
                </div>

                {showPuzzleHint && (
                  <p className="text-[13px] p-3 rounded-[8px]" style={{ backgroundColor: '#101114', color: 'var(--os-ivory)' }}>
                    💡 {currentPuzzle.hint}
                  </p>
                )}

                {puzzleFeedback === 'correct' && (
                  <div className="p-3.5 rounded-[9px] space-y-1" style={{ backgroundColor: 'rgba(155,170,152,0.12)', border: '1px solid rgba(155,170,152,0.4)' }}>
                    <p className="text-[13.5px] font-semibold" style={{ color: 'var(--os-sage)' }}>
                      ✓ Đúng rồi!
                    </p>
                    <p className="text-[12.5px]" style={{ color: 'var(--os-ivory)' }}>
                      {currentPuzzle.explanation}
                    </p>
                  </div>
                )}
                {puzzleFeedback === 'wrong' && (
                  <div className="p-3 rounded-[9px]" style={{ backgroundColor: 'rgba(194,123,118,0.12)', border: '1px solid rgba(194,123,118,0.4)' }}>
                    <p className="text-[13px]" style={{ color: 'var(--os-crimson)' }}>
                      Chưa phải nước mạnh nhất. Hãy bấm Reset trên bàn cờ và rà lại Checks → Captures → Threats!
                    </p>
                  </div>
                )}
              </div>
            )}

            {practiceMode === 'sandbox' && (
              <div className="p-5 rounded-[12px] space-y-3" style={{ backgroundColor: 'var(--os-graphite)', border: '1px solid var(--os-border)' }}>
                <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-dusty-blue)' }}>
                  FREE ANALYSIS SANDBOX
                </span>
                <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                  Bàn cờ kiểm tra nước đi hợp lệ (hỗ trợ Nhập thành, Bắt tốt qua đường, Phong cấp, chống đi nước để hở Vua bị chiếu). Bấm <strong>Analyze</strong> bên dưới bàn cờ để xem đánh giá vật chất & kiểm soát trung tâm, hoặc bấm <strong>FEN</strong> để dán thế cờ cần phân tích.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. GAME JOURNAL (4-Question Self-Analysis Before Engine)
  // =========================================================================
  if (ui.section === 'journal') {
    return (
      <div className="space-y-6">
        {renderSectionBreadcrumb('GAME JOURNAL')}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="editorial-h2">Game Journal</h3>
            <p className="text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
              Tự phân tích tư duy bằng 4 câu hỏi cốt lõi trước khi bật Engine.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            className="px-4 py-2 rounded-[9px] text-[12.5px] font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
          >
            + Log Game Reflection
          </button>
        </div>

        {games.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[var(--os-border)] rounded-[12px] space-y-2">
            <p className="text-[15px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
              No games recorded yet
            </p>
            <p className="text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
              Sau mỗi ván Rapid 10+5 hoặc 15+10, hãy dành 10 phút tự phân tích sai lầm và bài học vào đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--os-border)] border-y border-[var(--os-border)]">
            {games.map((g) => (
              <article key={g.id} className="py-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="metadata text-[10.5px] uppercase px-2 py-0.5 rounded-[5px]"
                      style={{
                        backgroundColor: 'var(--os-graphite)',
                        color:
                          g.result === 'win'
                            ? 'var(--os-sage)'
                            : g.result === 'loss'
                            ? 'var(--os-crimson)'
                            : 'var(--os-brass)',
                      }}
                    >
                      {g.result.toUpperCase()}
                    </span>
                    <span className="text-[14px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                      {g.platform} · {g.rating} · {g.blunderType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="metadata text-[11px]" style={{ color: 'var(--os-ivory-faint)' }}>
                      {formatShortDate(g.date)}
                    </span>
                    <button
                      type="button"
                      onClick={() => db.chessGames.delete(g.id)}
                      className="metadata text-[11px] hover:text-[var(--os-crimson)] cursor-pointer"
                      style={{ color: 'var(--os-ivory-faint)' }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {(g.turningPointMove || g.missedCandidateMove) && (
                  <p className="metadata text-[11px]" style={{ color: 'var(--os-dusty-blue)' }}>
                    {g.turningPointMove ? `Turning Point: ${g.turningPointMove}` : ''}
                    {g.missedCandidateMove ? ` · Candidate Moves: ${g.missedCandidateMove}` : ''}
                    {g.calculatedOrGuessed ? ` · ${g.calculatedOrGuessed.toUpperCase()}` : ''}
                  </p>
                )}

                {g.takeaway && (
                  <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory)' }}>
                    {g.takeaway}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        {/* Log New Game Modal (Contains the 4 Structured Questions) */}
        <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Post-Game Self-Analysis">
          <form onSubmit={handleLogGame} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as ChessGameLog['platform'])}
                className="px-3 py-2 rounded-[9px] ios-fill text-[13px]"
              >
                <option value="Lichess">Lichess</option>
                <option value="Chess.com">Chess.com</option>
                <option value="OTB">OTB</option>
              </select>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as ChessGameLog['result'])}
                className="px-3 py-2 rounded-[9px] ios-fill text-[13px]"
              >
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="draw">Draw</option>
              </select>
              <input
                type="number"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                placeholder="Elo"
                className="px-3 py-2 rounded-[9px] ios-fill text-[13px] tabular-nums"
              />
            </div>

            <input
              type="text"
              value={turningPointMove}
              onChange={(e) => setTurningPointMove(e.target.value)}
              placeholder="1. Bước ngoặt ở nước nào? (vd: 14... Nd4)"
              className="w-full px-3.5 py-2 rounded-[9px] ios-fill text-[13px]"
            />
            <input
              type="text"
              value={missedCandidateMove}
              onChange={(e) => setMissedCandidateMove(e.target.value)}
              placeholder="2. Đã cân nhắc những Candidate Moves nào?"
              className="w-full px-3.5 py-2 rounded-[9px] ios-fill text-[13px]"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={calcMode}
                onChange={(e) => setCalcMode(e.target.value as 'calculated' | 'guessed' | 'mixed')}
                className="px-3 py-2 rounded-[9px] ios-fill text-[12.5px]"
              >
                <option value="calculated">3. Tính thiếu biến</option>
                <option value="guessed">3. Đi theo cảm tính / đoán</option>
                <option value="mixed">3. Pha trộn cả hai</option>
              </select>
              <select
                value={errCat}
                onChange={(e) => setErrCat(e.target.value as NonNullable<ChessGameLog['errorCategory']>)}
                className="px-3 py-2 rounded-[9px] ios-fill text-[12.5px]"
              >
                <option value="tactics">4. Lỗi Chiến thuật</option>
                <option value="strategy">4. Lỗi Chiến lược</option>
                <option value="endgame">4. Lỗi Tàn cuộc</option>
                <option value="opening">4. Lỗi Khai cuộc</option>
                <option value="time">4. Thiếu thời gian</option>
              </select>
            </div>
            <input
              type="text"
              value={blunderType}
              onChange={(e) => setBlunderType(e.target.value)}
              placeholder="Mẫu sai lầm chính (vd: Bỏ sót Pin, Không check CCT...)"
              className="w-full px-3.5 py-2 rounded-[9px] ios-fill text-[13px]"
            />
            <textarea
              rows={3}
              required
              value={takeaway}
              onChange={(e) => setTakeaway(e.target.value)}
              placeholder="Bài học tư duy rút ra cho các ván sau..."
              className="w-full px-3.5 py-2.5 rounded-[9px] ios-fill text-[13.5px]"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-[9px] text-[13.5px] font-semibold cursor-pointer"
              style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
            >
              Lưu phân tích ván đấu
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  // =========================================================================
  // 6. CHESS LIBRARY (Searchable & Linked to Curriculum Lessons)
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
