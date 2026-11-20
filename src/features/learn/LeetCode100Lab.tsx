import React, { useEffect, useState } from 'react';
import { db, getLocalDateStr } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import { scheduleSourceCodeSave } from '../../lib/sourceStore';
import { CheckDot, ProgressBar, useToast } from '../../components/ui/Primitives';
import {
  LEETCODE_100_CHAPTERS,
  LEETCODE_100_PROBLEMS,
  LEETCODE_90DAY_SCHEDULE,
  LEETCODE_MASTERY_META,
  LEETCODE_PARALLEL_RESOURCES,
  type LeetCode100Problem,
  type LeetCodeMasteryStatus,
} from './leetcode100Data';

const LC100_STORAGE_KEY = 'noetrix_leetcode100_progress_v1';

export interface ProblemNoteRecord {
  status: LeetCodeMasteryStatus;
  steps: {
    understand: boolean;
    think: boolean;
    bruteForce: boolean;
    optimize: boolean;
    implement: boolean;
    analyze: boolean;
    review: boolean;
    resolve1d: boolean;
    resolve7d: boolean;
  };
  timeComplexity: string;
  spaceComplexity: string;
  understandAndEdgeCases: string;
  bruteToOptimalIdea: string;
  javaCode: string;
  reviewAndMistakesNote: string;
  timeSpentMinutes: number;
  updatedAt: number;
}

export interface ChapterStudyRecord {
  checkedLectures: string[];
  lectureNotes: string;
  updatedAt: number;
}

interface LeetCode100PersistedState {
  problems: Record<number, ProblemNoteRecord>;
  chapters: Record<string, ChapterStudyRecord>;
  lastChapterId: string;
  lastProblemNum: number;
}

const DEFAULT_STEPS: ProblemNoteRecord['steps'] = {
  understand: false,
  think: false,
  bruteForce: false,
  optimize: false,
  implement: false,
  analyze: false,
  review: false,
  resolve1d: false,
  resolve7d: false,
};

function createDefaultProblemRecord(prob: LeetCode100Problem): ProblemNoteRecord {
  return {
    status: 'unsolved',
    steps: { ...DEFAULT_STEPS },
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    understandAndEdgeCases: '',
    bruteToOptimalIdea: '',
    javaCode: `// #${String(prob.num).padStart(2, '0')}. ${prob.title} (${prob.difficulty})\nclass Solution {\n    \n}`,
    reviewAndMistakesNote: '',
    timeSpentMinutes: 25,
    updatedAt: Date.now(),
  };
}

function loadPersistedState(): LeetCode100PersistedState {
  try {
    const raw = localStorage.getItem(LC100_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LeetCode100PersistedState>;
      return {
        problems: parsed.problems || {},
        chapters: parsed.chapters || {},
        lastChapterId: parsed.lastChapterId || 'ch01',
        lastProblemNum: parsed.lastProblemNum || 1,
      };
    }
  } catch {
    // ignore corrupt JSON
  }
  return {
    problems: {},
    chapters: {},
    lastChapterId: 'ch01',
    lastProblemNum: 1,
  };
}

const EIGHT_STEP_WORKFLOW: {
  key: keyof ProblemNoteRecord['steps'];
  code: string;
  title: string;
  desc: string;
}[] = [
  {
    key: 'understand',
    code: '01',
    title: 'Understand',
    desc: 'Đọc đề, xác định Input, Output, Constraints & Edge Cases',
  },
  {
    key: 'think',
    code: '02',
    title: 'Think (15–25m)',
    desc: 'Tự suy nghĩ độc lập 15–25 phút trước khi xem bất kỳ gợi ý nào',
  },
  {
    key: 'bruteForce',
    code: '03',
    title: 'Brute Force',
    desc: 'Viết hoặc phác thảo cách giải đơn giản nhất trước',
  },
  {
    key: 'optimize',
    code: '04',
    title: 'Optimize',
    desc: 'Tìm cấu trúc dữ liệu hoặc thuật toán tốt hơn từ bottleneck',
  },
  {
    key: 'implement',
    code: '05',
    title: 'Implement (Java)',
    desc: 'Tự triển khai code sạch bằng Java & tự trace với test case',
  },
  {
    key: 'analyze',
    code: '06',
    title: 'Analyze Big-O',
    desc: 'Đánh giá chính xác Time Complexity và Space Complexity',
  },
  {
    key: 'review',
    code: '07',
    title: 'Review',
    desc: 'Đọc Solution chuẩn và so sánh ưu/nhược với cách giải của mình',
  },
  {
    key: 'resolve1d',
    code: '08a',
    title: 'Re-solve (+1 ngày)',
    desc: 'Giải lại sau 1 ngày hoàn toàn không nhìn lời giải',
  },
  {
    key: 'resolve7d',
    code: '08b',
    title: 'Re-solve (+7 ngày)',
    desc: 'Giải lại sau 7 ngày không nhìn lời giải → Đạt Mastered',
  },
];

export function LeetCode100Lab() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [state, setState] = useState<LeetCode100PersistedState>(() => loadPersistedState());
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => state.lastChapterId || 'ch01');
  const [selectedProblemNum, setSelectedProblemNum] = useState<number>(() => state.lastProblemNum || 1);

  const [statusFilter, setStatusFilter] = useState<LeetCodeMasteryStatus | 'all' | 'needs_resolve'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScheduleDrawer, setShowScheduleDrawer] = useState(false);

  // 20-Minute "Think Before Hint" Timer
  const [thinkSeconds, setThinkSeconds] = useState(20 * 60);
  const [thinkRunning, setThinkRunning] = useState(false);

  // Persist to localStorage & source code (src/data/noetrix-store.json) automatically
  useEffect(() => {
    try {
      localStorage.setItem(LC100_STORAGE_KEY, JSON.stringify(state));
      scheduleSourceCodeSave();
    } catch {
      // ignore quota error
    }
  }, [state]);

  useEffect(() => {
    if (!thinkRunning || thinkSeconds <= 0) return;
    const id = window.setInterval(() => {
      setThinkSeconds((prev) => {
        if (prev <= 1) {
          setThinkRunning(false);
          triggerHaptic('success');
          showToast('Đã đủ 20 phút tự suy nghĩ (Think) — Hãy thử Brute Force hoặc xem gợi ý nhỏ!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [thinkRunning, thinkSeconds, showToast]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const activeChapter =
    LEETCODE_100_CHAPTERS.find((c) => c.id === selectedChapterId) || LEETCODE_100_CHAPTERS[0];

  const activeProblem =
    LEETCODE_100_PROBLEMS.find((p) => p.num === selectedProblemNum) ||
    LEETCODE_100_PROBLEMS.find((p) => p.chapterId === activeChapter.id) ||
    LEETCODE_100_PROBLEMS[0];

  const activeProblemRecord: ProblemNoteRecord =
    state.problems[activeProblem.num] || createDefaultProblemRecord(activeProblem);

  const activeChapterRecord: ChapterStudyRecord = state.chapters[activeChapter.id] || {
    checkedLectures: [],
    lectureNotes: '',
    updatedAt: Date.now(),
  };

  const selectChapter = (chapterId: string) => {
    triggerHaptic('selection');
    setSelectedChapterId(chapterId);
    const firstProb = LEETCODE_100_PROBLEMS.find((p) => p.chapterId === chapterId);
    const nextProbNum = firstProb ? firstProb.num : selectedProblemNum;
    setSelectedProblemNum(nextProbNum);
    setState((prev) => ({
      ...prev,
      lastChapterId: chapterId,
      lastProblemNum: nextProbNum,
    }));
  };

  const selectProblem = (prob: LeetCode100Problem) => {
    triggerHaptic('selection');
    setSelectedProblemNum(prob.num);
    if (prob.chapterId !== selectedChapterId) {
      setSelectedChapterId(prob.chapterId);
    }
    setState((prev) => ({
      ...prev,
      lastChapterId: prob.chapterId,
      lastProblemNum: prob.num,
    }));
  };

  const updateProblemRecord = (
    num: number,
    patch: Partial<ProblemNoteRecord> | ((curr: ProblemNoteRecord) => ProblemNoteRecord)
  ) => {
    const probObj = LEETCODE_100_PROBLEMS.find((p) => p.num === num) || activeProblem;
    setState((prev) => {
      const curr = prev.problems[num] || createDefaultProblemRecord(probObj);
      const next =
        typeof patch === 'function'
          ? patch(curr)
          : { ...curr, ...patch, updatedAt: Date.now() };
      return {
        ...prev,
        problems: {
          ...prev.problems,
          [num]: next,
        },
      };
    });
  };

  const handleSetProblemStatus = async (prob: LeetCode100Problem, status: LeetCodeMasteryStatus) => {
    triggerHaptic('selection');
    const prevStatus = state.problems[prob.num]?.status || 'unsolved';
    updateProblemRecord(prob.num, { status });

    if (status !== 'unsolved' && prevStatus === 'unsolved') {
      const xp = prob.difficulty === 'Medium' ? 35 : 25;
      await awardXp(xp);
      showToast(`#${prob.num} ${prob.title} → ${LEETCODE_MASTERY_META[status].label} · +${xp} XP`);
    } else if (status === 'mastered' && prevStatus !== 'mastered') {
      await awardXp(40);
      showToast(`Mastered Pattern · #${prob.num} ${prob.title} · +40 XP`);
    }

    // Sync to db.leetcodeEntries so TodayView / GlobalSearch / Firebase Sync stay up to date
    if (status !== 'unsolved') {
      const ch = LEETCODE_100_CHAPTERS.find((c) => c.id === prob.chapterId);
      const rec = state.problems[prob.num] || createDefaultProblemRecord(prob);
      await db.leetcodeEntries.put({
        id: `lc100_${prob.num}`,
        problemName: `#${String(prob.num).padStart(2, '0')}. ${prob.title}`,
        pattern: ch ? ch.title.replace(/^Chapter \d+\.\s*/, '') : 'Java Roadmap',
        difficulty: prob.difficulty,
        solvedWithoutHint:
          status === 'independent' || status === 'resolved' || status === 'mastered',
        timeMinutes: rec.timeSpentMinutes || 25,
        keyIdea:
          rec.bruteToOptimalIdea.trim() ||
          `[${LEETCODE_MASTERY_META[status].label}] Time: ${rec.timeComplexity}, Space: ${rec.spaceComplexity}`,
        date: getLocalDateStr(),
        createdAt: Date.now(),
      });
    }
  };

  const toggleProblemStep = (
    num: number,
    stepKey: keyof ProblemNoteRecord['steps']
  ) => {
    triggerHaptic('light');
    updateProblemRecord(num, (curr) => ({
      ...curr,
      steps: {
        ...curr.steps,
        [stepKey]: !curr.steps[stepKey],
      },
      updatedAt: Date.now(),
    }));
  };

  const toggleChapterLecture = async (chapterId: string, lectureTitle: string) => {
    triggerHaptic('light');
    const current = state.chapters[chapterId] || {
      checkedLectures: [],
      lectureNotes: '',
      updatedAt: Date.now(),
    };
    const exists = current.checkedLectures.includes(lectureTitle);
    const nextChecked = exists
      ? current.checkedLectures.filter((l) => l !== lectureTitle)
      : [...current.checkedLectures, lectureTitle];

    setState((prev) => ({
      ...prev,
      chapters: {
        ...prev.chapters,
        [chapterId]: {
          ...current,
          checkedLectures: nextChecked,
          updatedAt: Date.now(),
        },
      },
    }));

    if (!exists) {
      await awardXp(10);
    }
  };

  const updateChapterNotes = (chapterId: string, lectureNotes: string) => {
    setState((prev) => {
      const current = prev.chapters[chapterId] || {
        checkedLectures: [],
        lectureNotes: '',
        updatedAt: Date.now(),
      };
      return {
        ...prev,
        chapters: {
          ...prev.chapters,
          [chapterId]: {
            ...current,
            lectureNotes,
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  // Global stats across all 100 problems
  const allStatuses = LEETCODE_100_PROBLEMS.map(
    (p) => state.problems[p.num]?.status || 'unsolved'
  );
  const solvedCount = allStatuses.filter((s) => s !== 'unsolved').length;
  const masteredOrResolvedCount = allStatuses.filter(
    (s) => s === 'mastered' || s === 'resolved'
  ).length;
  const independentCount = allStatuses.filter(
    (s) => s === 'independent' || s === 'mastered' || s === 'resolved'
  ).length;
  const needsResolveCount = LEETCODE_100_PROBLEMS.filter((p) => {
    const rec = state.problems[p.num];
    if (!rec || rec.status === 'unsolved') return false;
    return !rec.steps.resolve1d || !rec.steps.resolve7d;
  }).length;

  const totalLectures = LEETCODE_100_CHAPTERS.reduce((acc, c) => acc + c.lectures.length, 0);
  const completedLectures = LEETCODE_100_CHAPTERS.reduce(
    (acc, c) => acc + (state.chapters[c.id]?.checkedLectures.length || 0),
    0
  );

  // Filter problems for display
  const isGlobalFiltering = searchQuery.trim().length > 0 || statusFilter !== 'all';
  const displayedProblems = LEETCODE_100_PROBLEMS.filter((p) => {
    if (!isGlobalFiltering && p.chapterId !== activeChapter.id) return false;
    const rec = state.problems[p.num];
    const st = rec?.status || 'unsolved';

    if (statusFilter === 'needs_resolve') {
      if (st === 'unsolved' || (rec?.steps.resolve1d && rec?.steps.resolve7d)) return false;
    } else if (statusFilter !== 'all' && st !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchNum = String(p.num) === q.replace('#', '');
      const matchTitle = p.title.toLowerCase().includes(q);
      if (!matchNum && !matchTitle) return false;
    }
    return true;
  });

  // Group chapters by Part
  const parts = Array.from(new Set(LEETCODE_100_CHAPTERS.map((c) => c.partTitle)));

  return (
    <div className="space-y-8">
      {/* ================================================================
          1. LEETCODE 100 — 90-DAY LEARNING ROADMAP HERO
          ================================================================ */}
      <section
        className="rounded-[14px] p-6 sm:p-8 space-y-6"
        style={{
          backgroundColor: 'var(--os-graphite)',
          border: '1px solid var(--os-border)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="metadata text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
                {t('LEETCODE 100 — 90-DAY LEARNING ROADMAP', 'LEETCODE 100 — LỘ TRÌNH HỌC 90 NGÀY')}
              </span>
              <span style={{ color: 'var(--os-ivory-faint)' }}>·</span>
              <span className="metadata text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-dusty-blue)' }}>
                {t('JAVA BACKEND FOCUS · 1–2H/DAY · 6 DAYS/WEEK', 'TRỌNG TÂM JAVA BACKEND · 1–2H/NGÀY · 6 NGÀY/TUẦN')}
              </span>
            </div>

            <h2 className="editorial-h1">
              {t('From Zero to Problem Solving.', 'Từ Số 0 Đến Giải Quyết Vấn Đề.')}
            </h2>

            <p className="text-[14px] max-w-2xl leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
              {t(
                '100 problems in 90 days is not about chasing 100 Accepted badges. The goal is that after 3 months, facing any unseen problem, you can ',
                '100 bài trong 90 ngày không phải để sưu tầm 100 Accepted. Mục tiêu là sau 3 tháng, khi gặp một bài mới, bạn có thể '
              )}
              <strong style={{ color: 'var(--os-ivory-bright)' }}>
                {t(
                  'identify the core pattern, pick an approach, prove correctness, and implement cleanly in Java',
                  'nhận diện vấn đề, chọn hướng giải, chứng minh tính đúng đắn và tự triển khai bằng Java'
                )}
              </strong>
              .
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowScheduleDrawer((s) => !s)}
              className="px-3.5 py-2 rounded-[10px] text-[12.5px] font-medium cursor-pointer transition-opacity hover:opacity-85"
              style={{
                backgroundColor: 'var(--os-stone)',
                color: 'var(--os-ivory)',
                border: '1px solid var(--os-border)',
              }}
            >
              {showScheduleDrawer
                ? t('Hide 90-Day Schedule & Docs', 'Ẩn Lịch 90 Ngày & Tài liệu')
                : t('90-Day Schedule & Docs ↗', 'Lịch 90 Ngày & Tài liệu ↗')}
            </button>
          </div>
        </div>

        {/* 4 Key Progress Counters */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4"
          style={{ borderTop: '1px solid var(--os-border)' }}
        >
          <div>
            <p className="font-editorial text-[28px] leading-none tabular-nums" style={{ color: 'var(--os-ivory-bright)' }}>
              {solvedCount} / 100
            </p>
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--os-ivory-muted)' }}>
              {t('Solved in 90-day roadmap', 'Bài đã giải trong lộ trình 90 ngày')}
            </p>
          </div>

          <div>
            <p className="font-editorial text-[28px] leading-none tabular-nums" style={{ color: 'var(--os-sage)' }}>
              {masteredOrResolvedCount}
            </p>
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--os-ivory-muted)' }}>
              {t('Mastered & Re-solved (Deep pattern)', 'Mastered & Re-solved (Hiểu sâu pattern)')}
            </p>
          </div>

          <div>
            <p className="font-editorial text-[28px] leading-none tabular-nums" style={{ color: 'var(--os-dusty-blue)' }}>
              {independentCount}
            </p>
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--os-ivory-muted)' }}>
              {t('Independent (Solved without hints)', 'Independent (Tự giải không phụ thuộc lời giải)')}
            </p>
          </div>

          <div>
            <p className="font-editorial text-[28px] leading-none tabular-nums" style={{ color: 'var(--os-brass)' }}>
              {completedLectures} / {totalLectures}
            </p>
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--os-ivory-muted)' }}>
              {t('Theory topics (15 Chapters)', 'Chuyên đề lý thuyết (15 Chương)')}
            </p>
          </div>
        </div>

        <ProgressBar value={solvedCount} max={100} />

        {/* Collapsible 90-Day Schedule & Parallel Resources Drawer */}
        {showScheduleDrawer && (
          <div
            className="p-5 rounded-[12px] space-y-5"
            style={{
              backgroundColor: 'var(--os-obsidian)',
              border: '1px solid var(--os-border)',
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 90-Day Table */}
              <div className="lg:col-span-7 space-y-2.5">
                <p className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
                  LỊCH HỌC 90 NGÀY · 6 GIAI ĐOẠN · 100 BÀI
                </p>
                <div
                  className="rounded-[10px] overflow-hidden divide-y divide-[var(--os-border)]"
                  style={{ border: '1px solid var(--os-border)' }}
                >
                  {LEETCODE_90DAY_SCHEDULE.map((row) => (
                    <div
                      key={row.stage}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-[12.5px]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="metadata text-[10.5px]" style={{ color: 'var(--os-brass)' }}>
                          {row.part}
                        </span>
                        <span className="font-medium truncate" style={{ color: 'var(--os-ivory-bright)' }}>
                          {row.stage}
                        </span>
                        <span className="text-[11.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
                          ({row.chapters})
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 metadata text-[11.5px] tabular-nums">
                        <span style={{ color: 'var(--os-ivory-muted)' }}>{row.days}</span>
                        <span style={{ color: 'var(--os-sage)' }}>{row.count} bài</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5 Parallel Resources */}
              <div className="lg:col-span-5 space-y-2.5">
                <p className="editorial-eyebrow" style={{ color: 'var(--os-dusty-blue)' }}>
                  TÀI LIỆU HỌC SONG SONG
                </p>
                <div className="space-y-2">
                  {LEETCODE_PARALLEL_RESOURCES.map((res) => (
                    <a
                      key={res.title}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-[10px] flex items-center justify-between gap-3 transition-colors hover:border-[var(--os-border-hover)] block"
                      style={{
                        backgroundColor: 'var(--os-graphite)',
                        border: '1px solid var(--os-border)',
                      }}
                    >
                      <div>
                        <p className="text-[13.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                          {res.title}
                        </p>
                        <p className="text-[11.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                          {res.subtitle}
                        </p>
                      </div>
                      <span className="metadata text-[11px]" style={{ color: 'var(--os-brass)' }}>
                        MỞ ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          2. SEARCH & EVALUATION STATUS FILTER BAR
          ================================================================ */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              ['all', `Theo Chapter`],
              ['unsolved', 'Chưa giải'],
              ['independent', 'Independent'],
              ['hint_used', 'Hint Used'],
              ['solution_learned', 'Solution Learned'],
              ['resolved', 'Re-solved'],
              ['mastered', 'Mastered'],
              ['needs_resolve', `Cần Re-solve 1d/7d (${needsResolveCount})`],
            ] as const
          ).map(([key, label]) => {
            const active = statusFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setStatusFilter(key);
                }}
                className="px-3 py-1.5 rounded-[9px] text-[12px] font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? 'var(--os-brass)' : 'var(--os-graphite)',
                  color: active ? '#101114' : 'var(--os-ivory-muted)',
                  border: '1px solid var(--os-border)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm trong 100 bài (VD: #16, Two Sum, LRU Cache)..."
          className="w-full md:w-72 px-3.5 py-2 rounded-[10px] text-[13px]"
          style={{
            backgroundColor: 'var(--os-graphite)',
            border: '1px solid var(--os-border)',
            color: 'var(--os-ivory-bright)',
          }}
        />
      </section>

      {/* ================================================================
          3. MAIN 12-COLUMN WORKBENCH:
             - Left 4 cols: 15 Chapters Directory + Problem List
             - Right 8 cols: Chapter Lectures + Active Problem Java Studio & Notes
          ================================================================ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (4 cols): 15 Chapters Navigator & Chapter Problem List */}
        <div className="lg:col-span-4 space-y-5">
          {/* 15 Chapters Grouped by Part I..VI */}
          <div
            className="rounded-[14px] p-4 space-y-4 max-h-[520px] overflow-y-auto"
            style={{
              backgroundColor: 'var(--os-graphite)',
              border: '1px solid var(--os-border)',
            }}
          >
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--os-border)' }}>
              <span className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
                15 CHAPTERS · PHẦN I → VI
              </span>
              <span className="metadata text-[11px]" style={{ color: 'var(--os-ivory-faint)' }}>
                90 DAYS
              </span>
            </div>

            {parts.map((partTitle) => {
              const chList = LEETCODE_100_CHAPTERS.filter((c) => c.partTitle === partTitle);
              return (
                <div key={partTitle} className="space-y-1.5">
                  <p className="metadata text-[10px] uppercase tracking-[0.1em] px-2 pt-1" style={{ color: 'var(--os-dusty-blue)' }}>
                    {partTitle}
                  </p>
                  {chList.map((ch) => {
                    const isSelected = ch.id === activeChapter.id;
                    const chProbs = LEETCODE_100_PROBLEMS.filter((p) => p.chapterId === ch.id);
                    const chSolved = chProbs.filter(
                      (p) => (state.problems[p.num]?.status || 'unsolved') !== 'unsolved'
                    ).length;

                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setSearchQuery('');
                          selectChapter(ch.id);
                        }}
                        className="w-full px-3 py-2.5 rounded-[10px] text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'var(--os-stone)' : 'transparent',
                          border: isSelected
                            ? '1px solid rgba(185, 155, 121, 0.45)'
                            : '1px solid transparent',
                        }}
                      >
                        <div className="min-w-0">
                          <p
                            className="text-[13.5px] font-medium truncate"
                            style={{
                              color: isSelected ? 'var(--os-ivory-bright)' : 'var(--os-ivory)',
                            }}
                          >
                            {ch.title}
                          </p>
                          <p className="metadata text-[10.5px] mt-0.5" style={{ color: 'var(--os-ivory-faint)' }}>
                            {ch.dayRange} · {ch.lectures.length} bài giảng
                          </p>
                        </div>

                        <span
                          className="metadata text-[11px] tabular-nums shrink-0 px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: 'var(--os-obsidian)',
                            color:
                              chSolved === chProbs.length
                                ? 'var(--os-sage)'
                                : chSolved > 0
                                ? 'var(--os-brass)'
                                : 'var(--os-ivory-faint)',
                          }}
                        >
                          {chSolved}/{chProbs.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Problem Queue for Selected Chapter / Filter */}
          <div
            className="rounded-[14px] p-4 space-y-3"
            style={{
              backgroundColor: 'var(--os-graphite)',
              border: '1px solid var(--os-border)',
            }}
          >
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--os-border)' }}>
              <span className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
                {isGlobalFiltering
                  ? `KẾT QUẢ LỌC (${displayedProblems.length} BÀI)`
                  : `BÀI THỰC HÀNH CH.${activeChapter.number} (${displayedProblems.length})`}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {displayedProblems.length === 0 ? (
                <p className="text-[13px] py-4 text-center" style={{ color: 'var(--os-ivory-muted)' }}>
                  Không có bài nào khớp bộ lọc hiện tại.
                </p>
              ) : (
                displayedProblems.map((prob) => {
                  const rec = state.problems[prob.num];
                  const st = rec?.status || 'unsolved';
                  const meta = LEETCODE_MASTERY_META[st];
                  const active = prob.num === activeProblem.num;

                  return (
                    <button
                      key={prob.num}
                      type="button"
                      onClick={() => selectProblem(prob)}
                      className="w-full p-3 rounded-[10px] text-left space-y-1.5 transition-all cursor-pointer"
                      style={{
                        backgroundColor: active ? 'var(--os-stone)' : 'var(--os-obsidian)',
                        border: active
                          ? '1px solid rgba(185, 155, 121, 0.6)'
                          : '1px solid var(--os-border)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="metadata text-[11px] tabular-nums" style={{ color: 'var(--os-brass)' }}>
                          #{String(prob.num).padStart(2, '0')} · {prob.difficulty.toUpperCase()}
                        </span>
                        <span
                          className="metadata text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: meta.bg,
                            color: meta.color,
                          }}
                        >
                          {meta.shortLabel}
                        </span>
                      </div>

                      <p className="text-[14px] font-medium leading-snug" style={{ color: 'var(--os-ivory-bright)' }}>
                        {prob.title}
                      </p>

                      {prob.isReview && (
                        <p className="metadata text-[10px]" style={{ color: 'var(--os-dusty-blue)' }}>
                          ↺ ÔN TẬP CÓ CHỦ ĐÍCH
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols):
            1. Chapter Lecture Syllabus & Chapter Study Notes
            2. Active Problem (#01..#100) 8-Step Workbench, Java Code Editor & Personal Notes */}
        <div className="lg:col-span-8 space-y-6">
          {/* PANEL A: CHAPTER LECTURES & THEORY NOTEBOOK */}
          <div
            className="rounded-[14px] p-5 sm:p-6 space-y-5"
            style={{
              backgroundColor: 'var(--os-graphite)',
              border: '1px solid var(--os-border)',
            }}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="metadata text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                  {activeChapter.partTitle} · {activeChapter.dayRange}
                </span>
                <span className="metadata text-[11px] tabular-nums" style={{ color: 'var(--os-sage)' }}>
                  {activeChapterRecord.checkedLectures.length}/{activeChapter.lectures.length} BÀI GIẢNG ĐÃ HỌC
                </span>
              </div>
              <h3 className="editorial-h2">{activeChapter.title}</h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                {activeChapter.goal}
              </p>
            </div>

            {activeChapter.note && (
              <div
                className="p-3.5 rounded-[10px] text-[13px] leading-relaxed"
                style={{
                  backgroundColor: 'var(--os-obsidian)',
                  color: 'var(--os-dusty-blue)',
                  border: '1px solid var(--os-border)',
                }}
              >
                <strong>Ghi chú lộ trình:</strong> {activeChapter.note}
              </div>
            )}

            {/* Lecture Topics Checklist */}
            <div className="space-y-2">
              <p className="editorial-eyebrow">Nội dung Bài giảng cần nắm vững (Chạm để đánh dấu đã học)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeChapter.lectures.map((lec) => {
                  const checked = activeChapterRecord.checkedLectures.includes(lec);
                  return (
                    <button
                      key={lec}
                      type="button"
                      onClick={() => toggleChapterLecture(activeChapter.id, lec)}
                      className="p-2.5 rounded-[9px] text-left flex items-center gap-2.5 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--os-obsidian)',
                        border: checked
                          ? '1px solid rgba(155, 170, 152, 0.45)'
                          : '1px solid var(--os-border)',
                      }}
                    >
                      <CheckDot checked={checked} size="sm" />
                      <span
                        className={`text-[13px] leading-snug ${checked ? 'opacity-75' : ''}`}
                        style={{ color: 'var(--os-ivory-bright)' }}
                      >
                        {lec}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Java Focus Callout */}
            <div
              className="p-3.5 rounded-[10px] text-[12.5px] leading-relaxed"
              style={{
                backgroundColor: 'var(--os-obsidian)',
                border: '1px solid var(--os-border)',
                color: 'var(--os-ivory)',
              }}
            >
              <span className="metadata text-[10.5px] uppercase" style={{ color: 'var(--os-brass)' }}>
                JAVA BACKEND FOCUS:{' '}
              </span>
              {activeChapter.javaFocus}
            </div>

            {/* Chapter Theory Study Notebook */}
            <div className="space-y-1.5">
              <label className="editorial-eyebrow block" style={{ color: 'var(--os-dusty-blue)' }}>
                Sổ tay Bài giảng & Ghi chú Lý thuyết của {activeChapter.title}
              </label>
              <textarea
                rows={4}
                value={activeChapterRecord.lectureNotes}
                onChange={(e) => updateChapterNotes(activeChapter.id, e.target.value)}
                placeholder={`Ghi chép kiến thức cốt lõi của ${activeChapter.title}, cơ chế bên dưới trong Java (VD: HashMap collision, ArrayDeque, Backtracking template) và các mẫu code dùng chung...`}
                className="w-full p-3.5 rounded-[10px] text-[13.5px] leading-relaxed"
                style={{
                  backgroundColor: 'var(--os-obsidian)',
                  border: '1px solid var(--os-border)',
                  color: 'var(--os-ivory)',
                }}
              />
            </div>
          </div>

          {/* PANEL B: ACTIVE PROBLEM (#01..#100) — 8-STEP WORKBENCH, JAVA CODE & NOTES */}
          <div
            className="rounded-[14px] p-5 sm:p-6 space-y-6"
            style={{
              backgroundColor: 'var(--os-graphite)',
              border: '1px solid var(--os-border)',
            }}
          >
            {/* Problem Header + Direct LeetCode Link + 20m Think Timer */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--os-border)' }}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="metadata text-[12px] font-semibold" style={{ color: 'var(--os-brass)' }}>
                    PROBLEM #{String(activeProblem.num).padStart(2, '0')} / 100
                  </span>
                  <span
                    className="metadata text-[11px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--os-obsidian)',
                      color:
                        activeProblem.difficulty === 'Easy'
                          ? 'var(--os-sage)'
                          : 'var(--os-brass)',
                      border: '1px solid var(--os-border)',
                    }}
                  >
                    {activeProblem.difficulty}
                  </span>
                  {activeProblem.isReview && (
                    <span
                      className="metadata text-[10.5px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'rgba(167, 182, 210, 0.14)',
                        color: 'var(--os-dusty-blue)',
                      }}
                    >
                      ↺ BÀI ÔN TẬP CÓ CHỦ ĐÍCH
                    </span>
                  )}
                </div>

                <h3 className="editorial-h2">{activeProblem.title}</h3>

                {activeProblem.reviewNote && (
                  <p className="text-[12.5px]" style={{ color: 'var(--os-dusty-blue)' }}>
                    {activeProblem.reviewNote}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {/* 20-Minute Independent Thinking Timer */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    if (!thinkRunning && thinkSeconds === 0) {
                      setThinkSeconds(20 * 60);
                    }
                    setThinkRunning((r) => !r);
                  }}
                  className="px-3 py-2 rounded-[10px] metadata text-[11.5px] cursor-pointer"
                  style={{
                    backgroundColor: thinkRunning ? 'var(--os-brass)' : 'var(--os-obsidian)',
                    color: thinkRunning ? '#101114' : 'var(--os-ivory)',
                    border: '1px solid var(--os-border)',
                  }}
                  title="Bấm giờ 20 phút tự suy nghĩ độc lập trước khi xem gợi ý"
                >
                  {thinkRunning
                    ? `⏱ Đang Think: ${formatTimer(thinkSeconds)}`
                    : `⏱ Bấm giờ Think (${formatTimer(thinkSeconds)})`}
                </button>

                <a
                  href={`https://leetcode.com/problems/${activeProblem.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-[10px] text-[13px] font-semibold"
                  style={{
                    backgroundColor: 'var(--os-brass)',
                    color: '#101114',
                  }}
                >
                  Giải trên LeetCode ↗
                </a>
              </div>
            </div>

            {/* 5 Evaluation Rules Selector ("Không tính là thành thạo chỉ vì đã Accepted") */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
                  QUY TẮC ĐÁNH GIÁ MỖI BÀI (KHÔNG TÍNH THÀNH THẠO CHỈ VÌ ACCEPTED)
                </span>
                <span className="text-[12px]" style={{ color: 'var(--os-ivory-muted)' }}>
                  {LEETCODE_MASTERY_META[activeProblemRecord.status].meaning}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {(
                  [
                    'unsolved',
                    'independent',
                    'hint_used',
                    'solution_learned',
                    'resolved',
                    'mastered',
                  ] as LeetCodeMasteryStatus[]
                ).map((st) => {
                  const meta = LEETCODE_MASTERY_META[st];
                  const active = activeProblemRecord.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleSetProblemStatus(activeProblem, st)}
                      className="p-2.5 rounded-[10px] text-left transition-all cursor-pointer"
                      style={{
                        backgroundColor: active ? meta.bg : 'var(--os-obsidian)',
                        border: active
                          ? `1px solid ${meta.color}`
                          : '1px solid var(--os-border)',
                      }}
                    >
                      <p className="metadata text-[11px] font-semibold" style={{ color: meta.color }}>
                        {meta.shortLabel}
                      </p>
                      <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'var(--os-ivory-muted)' }}>
                        {meta.meaning}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8-Step Mandatory Workflow Checklist */}
            <div className="space-y-2">
              <p className="editorial-eyebrow">
                Phương pháp học 8 bước bắt buộc cho bài #{String(activeProblem.num).padStart(2, '0')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {EIGHT_STEP_WORKFLOW.map((step) => {
                  const done = activeProblemRecord.steps[step.key];
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => toggleProblemStep(activeProblem.num, step.key)}
                      className="p-2.5 rounded-[10px] text-left flex items-start gap-2.5 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--os-obsidian)',
                        border: done
                          ? '1px solid rgba(155, 170, 152, 0.45)'
                          : '1px solid var(--os-border)',
                      }}
                    >
                      <div className="mt-0.5">
                        <CheckDot checked={done} size="sm" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                          <span className="metadata text-[10.5px] mr-1" style={{ color: 'var(--os-brass)' }}>
                            {step.code}
                          </span>
                          {step.title}
                        </p>
                        <p className="text-[11.5px] leading-snug mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
                          {step.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Structured Problem Notes & Complexity Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="metadata text-[11px] uppercase" style={{ color: 'var(--os-brass)' }}>
                  1. Understand · Input, Output, Constraints & Edge Cases
                </label>
                <textarea
                  rows={3}
                  value={activeProblemRecord.understandAndEdgeCases}
                  onChange={(e) =>
                    updateProblemRecord(activeProblem.num, {
                      understandAndEdgeCases: e.target.value,
                    })
                  }
                  placeholder="Ràng buộc kích thước n (VD: n <= 10^5 → cần O(n) hoặc O(n log n)), mảng rỗng, số âm, trùng lặp, tràn số int..."
                  className="w-full p-3 rounded-[10px] text-[13px] leading-relaxed"
                  style={{
                    backgroundColor: 'var(--os-obsidian)',
                    border: '1px solid var(--os-border)',
                    color: 'var(--os-ivory)',
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="metadata text-[11px] uppercase" style={{ color: 'var(--os-dusty-blue)' }}>
                  2. Brute Force → Optimize (Tư duy chuyển đổi Pattern)
                </label>
                <textarea
                  rows={3}
                  value={activeProblemRecord.bruteToOptimalIdea}
                  onChange={(e) =>
                    updateProblemRecord(activeProblem.num, {
                      bruteToOptimalIdea: e.target.value,
                    })
                  }
                  placeholder="Brute Force tốn O(n²) ở đâu? Dùng CTDL / Pattern nào (HashMap, Two Pointers, Sliding Window, Monotonic Stack...) để giảm xuống O(n)?"
                  className="w-full p-3 rounded-[10px] text-[13px] leading-relaxed"
                  style={{
                    backgroundColor: 'var(--os-obsidian)',
                    border: '1px solid var(--os-border)',
                    color: 'var(--os-ivory)',
                  }}
                />
              </div>
            </div>

            {/* Time Complexity / Space Complexity / Time Spent Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="metadata text-[10.5px] uppercase" style={{ color: 'var(--os-sage)' }}>
                  Time Complexity
                </label>
                <input
                  type="text"
                  value={activeProblemRecord.timeComplexity}
                  onChange={(e) =>
                    updateProblemRecord(activeProblem.num, { timeComplexity: e.target.value })
                  }
                  placeholder="O(n)"
                  className="w-full mt-1 px-3 py-2 rounded-[9px] metadata text-[13px]"
                  style={{
                    backgroundColor: 'var(--os-obsidian)',
                    border: '1px solid var(--os-border)',
                    color: 'var(--os-ivory-bright)',
                  }}
                />
              </div>

              <div>
                <label className="metadata text-[10.5px] uppercase" style={{ color: 'var(--os-dusty-blue)' }}>
                  Space Complexity
                </label>
                <input
                  type="text"
                  value={activeProblemRecord.spaceComplexity}
                  onChange={(e) =>
                    updateProblemRecord(activeProblem.num, { spaceComplexity: e.target.value })
                  }
                  placeholder="O(1)"
                  className="w-full mt-1 px-3 py-2 rounded-[9px] metadata text-[13px]"
                  style={{
                    backgroundColor: 'var(--os-obsidian)',
                    border: '1px solid var(--os-border)',
                    color: 'var(--os-ivory-bright)',
                  }}
                />
              </div>

              <div>
                <label className="metadata text-[10.5px] uppercase" style={{ color: 'var(--os-brass)' }}>
                  Thời gian giải (phút)
                </label>
                <input
                  type="number"
                  min={1}
                  value={activeProblemRecord.timeSpentMinutes}
                  onChange={(e) =>
                    updateProblemRecord(activeProblem.num, {
                      timeSpentMinutes: Math.max(1, Number(e.target.value) || 15),
                    })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-[9px] metadata text-[13px] tabular-nums"
                  style={{
                    backgroundColor: 'var(--os-obsidian)',
                    border: '1px solid var(--os-border)',
                    color: 'var(--os-ivory-bright)',
                  }}
                />
              </div>
            </div>

            {/* Java Solution Code Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="metadata text-[11px] uppercase" style={{ color: 'var(--os-brass)' }}>
                  3. Implement · Lời giải Java của bạn (SF Mono)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeProblemRecord.javaCode);
                    showToast('Đã copy code Java vào Clipboard');
                  }}
                  className="metadata text-[11px] cursor-pointer hover:underline"
                  style={{ color: 'var(--os-dusty-blue)' }}
                >
                  COPY JAVA CODE
                </button>
              </div>
              <textarea
                rows={10}
                spellCheck={false}
                value={activeProblemRecord.javaCode}
                onChange={(e) =>
                  updateProblemRecord(activeProblem.num, { javaCode: e.target.value })
                }
                className="w-full p-4 rounded-[12px] metadata text-[13px] leading-[1.65] resize-y"
                style={{
                  backgroundColor: 'var(--os-obsidian)',
                  border: '1px solid var(--os-border)',
                  color: 'var(--os-ivory-bright)',
                }}
              />
            </div>

            {/* Review & Personal Notes for 1-Day / 7-Day Re-solve */}
            <div className="space-y-1.5">
              <label className="metadata text-[11px] uppercase" style={{ color: 'var(--os-sage)' }}>
                4. Review & Ghi chú cá nhân (Điểm mù cần nhớ khi Re-solve sau 1 ngày & 7 ngày)
              </label>
              <textarea
                rows={3}
                value={activeProblemRecord.reviewAndMistakesNote}
                onChange={(e) =>
                  updateProblemRecord(activeProblem.num, {
                    reviewAndMistakesNote: e.target.value,
                  })
                }
                placeholder="Ghi lại lỗi sai khi tự code (VD: quên kiểm tra con trỏ null, sai điều kiện dừng while left <= right), hoặc kỹ thuật Java hay học được từ Solution..."
                className="w-full p-3.5 rounded-[10px] text-[13.5px] leading-relaxed"
                style={{
                  backgroundColor: 'var(--os-obsidian)',
                  border: '1px solid var(--os-border)',
                  color: 'var(--os-ivory)',
                }}
              />
            </div>

            {/* Next / Previous Problem Quick Navigation */}
            <div
              className="flex items-center justify-between pt-3"
              style={{ borderTop: '1px solid var(--os-border)' }}
            >
              <button
                type="button"
                disabled={activeProblem.num <= 1}
                onClick={() => {
                  const prev = LEETCODE_100_PROBLEMS.find((p) => p.num === activeProblem.num - 1);
                  if (prev) selectProblem(prev);
                }}
                className="px-3.5 py-2 rounded-[9px] text-[12.5px] font-medium cursor-pointer disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--os-stone)',
                  color: 'var(--os-ivory)',
                }}
              >
                ← Bài #{String(Math.max(1, activeProblem.num - 1)).padStart(2, '0')}
              </button>

              <span className="metadata text-[11px]" style={{ color: 'var(--os-ivory-faint)' }}>
                TỰ ĐỘNG LƯU GHI CHÚ & CODE JAVA
              </span>

              <button
                type="button"
                disabled={activeProblem.num >= 100}
                onClick={() => {
                  const next = LEETCODE_100_PROBLEMS.find((p) => p.num === activeProblem.num + 1);
                  if (next) selectProblem(next);
                }}
                className="px-3.5 py-2 rounded-[9px] text-[12.5px] font-medium cursor-pointer disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--os-stone)',
                  color: 'var(--os-ivory)',
                }}
              >
                Bài #{String(Math.min(100, activeProblem.num + 1)).padStart(2, '0')} →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
