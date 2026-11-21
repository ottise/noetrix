import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createId, getLocalDateStr, diffDaysFromToday, formatShortDate } from '../../db/database';
import { purgeLegacyMockSchedule } from '../../db/seed';
import { awardXp } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import { scheduleSourceCodeSave } from '../../lib/sourceStore';
import type { TaskCategory, TaskItem, WorkspaceId } from '../../types';
import { BackButton, useToast } from '../../components/ui/Primitives';
import { MobileMonthCalendar } from '../../components/MobileMonthCalendar';

interface CalendarItem {
  id: string;
  dateStr: string;
  title: string;
  kind: 'task' | 'deadline' | 'workflow' | 'psychology';
  category: TaskCategory | 'workflow' | 'psychology' | 'deadline';
  time?: string;
  durationMinutes?: number;
  done: boolean;
  metaCategory: string;
  metaSub: string;
  taskRef?: TaskItem;
  lectureId?: string;
  psychId?: string;
  jumpTo?: { ws: WorkspaceId; sub?: string };
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMondayGridDays(
  year: number,
  monthIdx: number
): { dateStr: string; inMonth: boolean; dayNum: number }[] {
  const firstOfMonth = new Date(year, monthIdx, 1);
  // Monday = 0, Tuesday = 1, ..., Sunday = 6
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIdx, 1 - startOffset);

  const cells: { dateStr: string; inMonth: boolean; dayNum: number }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      dateStr: toYmd(d),
      inMonth: d.getMonth() === monthIdx,
      dayNum: d.getDate(),
    });
  }
  return cells;
}

const MOCK_TASK_IDS = new Set([
  'tsk_starter_1',
  'tsk_starter_2',
  'tsk_starter_3',
  'tsk_starter_4',
  'tsk_starter_5',
]);

export function PersonalCalendar({
  onNavigate,
  onSwitchHomeTab,
}: {
  onNavigate: (workspace: WorkspaceId, sub?: string) => void;
  onSwitchHomeTab?: (tab: 'today' | 'calendar') => void;
}) {
  const { showToast } = useToast();
  const { lang, t } = useLanguage();
  const todayStr = getLocalDateStr();

  const [subMode, setSubMode] = useState<'calendar' | 'timeline'>('calendar');
  const [viewCursor, setViewCursor] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Quick Add Event / Schedule form for selectedDate
  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDuration, setNewDuration] = useState('45');
  const [newCategory, setNewCategory] = useState<TaskCategory>('learning');
  const [newDeadline, setNewDeadline] = useState('');
  const [pinFocus, setPinFocus] = useState(false);

  // Automatically purge any leftover mock schedule records from IndexedDB
  useEffect(() => {
    purgeLegacyMockSchedule()
      .then(() => {
        scheduleSourceCodeSave();
      })
      .catch(() => {});
  }, []);

  const rawTasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const tasks = useMemo(
    () => rawTasks.filter((tk) => !MOCK_TASK_IDS.has(tk.id)),
    [rawTasks]
  );
  const lectures = useLiveQuery(() => db.workflowLectures.toArray()) || [];
  const psychPosts = useLiveQuery(() => db.psychologyPosts.toArray()) || [];
  const dailyLogs = useLiveQuery(() => db.dailyLogs.toArray()) || [];

  const gridDays = useMemo(
    () => getMondayGridDays(viewCursor.year, viewCursor.month),
    [viewCursor.year, viewCursor.month]
  );

  // Build unified index of calendar items by YYYY-MM-DD
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    const pushItem = (dateStr: string | undefined, item: CalendarItem) => {
      if (!dateStr) return;
      const list = map.get(dateStr) || [];
      list.push(item);
      map.set(dateStr, list);
    };

    for (const tk of tasks) {
      const done = tk.status === 'completed';
      if (tk.scheduledDate) {
        pushItem(tk.scheduledDate, {
          id: `tsk_${tk.id}`,
          dateStr: tk.scheduledDate,
          title: tk.title,
          kind: 'task',
          category: tk.category,
          time: tk.scheduledTime,
          durationMinutes: tk.durationMinutes,
          done,
          metaCategory: tk.category,
          metaSub: tk.durationMinutes ? `${tk.durationMinutes}m` : tk.priority,
          taskRef: tk,
        });
      }
      if (tk.deadline && tk.deadline !== tk.scheduledDate) {
        pushItem(tk.deadline, {
          id: `due_${tk.id}`,
          dateStr: tk.deadline,
          title: `Due: ${tk.title}`,
          kind: 'deadline',
          category: 'deadline',
          done,
          metaCategory: 'deadline',
          metaSub: tk.category,
          taskRef: tk,
        });
      }
    }

    for (const lec of lectures) {
      const targetDate = lec.publishedAt || lec.dueDate;
      const done = lec.status === 'published';
      pushItem(targetDate, {
        id: `wf_${lec.id}`,
        dateStr: targetDate,
        title: lec.title,
        kind: 'workflow',
        category: 'workflow',
        done,
        metaCategory: 'AI Workflow',
        metaSub: done
          ? 'published'
          : `${Object.values(lec.checklist).filter(Boolean).length}/5`,
        lectureId: lec.id,
        jumpTo: { ws: 'creative', sub: 'lectures' },
      });
    }

    for (const psy of psychPosts) {
      const targetDate = psy.publishedAt || psy.dueDate;
      const done = psy.status === 'published';
      pushItem(targetDate, {
        id: `psy_${psy.id}`,
        dateStr: targetDate,
        title: psy.title,
        kind: 'psychology',
        category: 'psychology',
        done,
        metaCategory: 'Psychology',
        metaSub: psy.status,
        psychId: psy.id,
        jumpTo: { ws: 'creative', sub: 'psychology' },
      });
    }

    // Sort items within each day by time
    for (const [, list] of map.entries()) {
      list.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
    }

    return map;
  }, [tasks, lectures, psychPosts]);

  const monthPrefix = `${viewCursor.year}-${String(viewCursor.month + 1).padStart(2, '0')}`;
  const monthStats = useMemo(() => {
    let planned = 0;
    let completed = 0;
    for (const [dStr, list] of itemsByDate.entries()) {
      if (dStr.startsWith(monthPrefix)) {
        planned += list.length;
        completed += list.filter((i) => i.done).length;
      }
    }
    return { planned, completed };
  }, [itemsByDate, monthPrefix]);

  const selectedItems = itemsByDate.get(selectedDate) || [];

  // Upcoming Publishing & Research Schedule (from publishing tasks + any user lectures/psych posts)
  const upcomingPublishing = useMemo(() => {
    const list: {
      id: string;
      channel: string;
      title: string;
      date: string;
      daysLeft: number;
      onDelete: () => Promise<void>;
      onOpen?: () => void;
    }[] = [
      ...tasks
        .filter((tk) => (tk.category === 'publishing' || tk.deadline) && tk.status !== 'completed')
        .map((tk) => {
          const d = tk.deadline || tk.scheduledDate || todayStr;
          return {
            id: `pub_tsk_${tk.id}`,
            channel: tk.category.toUpperCase(),
            title: tk.title,
            date: d,
            daysLeft: diffDaysFromToday(d),
            onDelete: async () => {
              await db.tasks.delete(tk.id);
            },
            onOpen: () => setSelectedDate(d),
          };
        }),
      ...lectures
        .filter((l) => l.status !== 'published')
        .map((l) => ({
          id: `pub_wf_${l.id}`,
          channel: 'AI WORKFLOW (3D)',
          title: l.title,
          date: l.dueDate,
          daysLeft: diffDaysFromToday(l.dueDate),
          onDelete: async () => {
            await db.workflowLectures.delete(l.id);
          },
          onOpen: () => onNavigate('creative', 'lectures'),
        })),
      ...psychPosts
        .filter((p) => p.status !== 'published')
        .map((p) => ({
          id: `pub_psy_${p.id}`,
          channel: 'PSYCHOLOGY RESEARCH (7D)',
          title: p.title,
          date: p.dueDate,
          daysLeft: diffDaysFromToday(p.dueDate),
          onDelete: async () => {
            await db.psychologyPosts.delete(p.id);
          },
          onOpen: () => onNavigate('creative', 'psychology'),
        })),
    ];
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, lectures, psychPosts, todayStr, onNavigate]);

  // All scheduled dates for Timeline Orbit mode
  const timelineDateGroups = useMemo(() => {
    return Array.from(itemsByDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [itemsByDate]);

  // Rhythm Energy Percentage based on completed items or daily log
  const rhythmEnergyPct = useMemo(() => {
    const todayLog = dailyLogs.find((l) => l.date === selectedDate);
    let score = 60;
    if (todayLog?.codeDone) score += 10;
    if (todayLog?.gymDone) score += 10;
    if (todayLog?.englishDone) score += 10;
    if (todayLog?.readDone) score += 10;
    if (selectedItems.length > 0) {
      const doneRatio = selectedItems.filter((i) => i.done).length / selectedItems.length;
      score = Math.max(score, Math.round(62 + doneRatio * 36));
    }
    return Math.min(100, score);
  }, [dailyLogs, selectedDate, selectedItems]);

  const shiftMonth = (delta: number) => {
    triggerHaptic('selection');
    setViewCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const jumpToToday = () => {
    triggerHaptic('selection');
    const now = new Date();
    setViewCursor({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(todayStr);
  };

  const toggleTaskDone = async (task: TaskItem) => {
    const willComplete = task.status !== 'completed';
    triggerHaptic(willComplete ? 'success' : 'light');
    await db.tasks.update(task.id, {
      status: willComplete ? 'completed' : 'planned',
      completedAt: willComplete ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    await awardXp(willComplete ? 25 : -25);
    if (willComplete) {
      showToast(t(`Completed · ${task.title}`, `Đã hoàn thành · ${task.title}`));
    }
  };

  const handleDeleteCalendarItem = async (ev: CalendarItem) => {
    if (ev.taskRef) {
      await db.tasks.delete(ev.taskRef.id);
    } else if (ev.lectureId) {
      await db.workflowLectures.delete(ev.lectureId);
    } else if (ev.psychId) {
      await db.psychologyPosts.delete(ev.psychId);
    }
    showToast(t('Removed from calendar', 'Đã xóa khỏi lịch'), 'info');
  };

  const handleAddEventForDate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newTitle.trim();
    if (!cleaned) return;
    const now = Date.now();
    await db.tasks.put({
      id: createId('tsk'),
      title: cleaned,
      description: '',
      category: newCategory,
      project: '',
      priority: 'medium',
      status: 'planned',
      isTodayFocus: pinFocus && selectedDate === todayStr,
      scheduledDate: selectedDate,
      scheduledTime: newTime || undefined,
      deadline: newDeadline || undefined,
      durationMinutes: newDuration ? Number(newDuration) : undefined,
      recurrence: 'none',
      createdAt: now,
      updatedAt: now,
    });
    setNewTitle('');
    setNewTime('');
    setNewDeadline('');
    setPinFocus(false);
    setComposerOpen(false);
    triggerHaptic('success');
    showToast(
      t(
        `Scheduled on ${formatShortDate(selectedDate)}`,
        `Đã thêm lịch vào ngày ${formatShortDate(selectedDate)}`
      )
    );
  };

  const monthHeading = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(viewCursor.year, viewCursor.month, 1));

  const quarterNum = Math.floor(viewCursor.month / 3) + 1;

  const selectedFullLabel = (() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (!y || !m || !d) return selectedDate;
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(y, m - 1, d));
  })();

  const selectedShortFocusLabel = (() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (!y || !m || !d) return selectedDate;
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'vi-VN', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(y, m - 1, d));
  })();

  const weekdayHeaders =
    lang === 'en'
      ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
      : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const getCellPillStyles = (ev: CalendarItem) => {
    if (ev.kind === 'deadline') {
      return {
        pill: 'bg-[#221619] text-[#e8a3a3] border border-rose-900/40',
        dot: 'bg-rose-500',
      };
    }
    if (ev.category === 'learning') {
      return {
        pill: 'bg-[#1e2023] text-[#d4dae8] border border-[#2e3442]',
        dot: 'bg-sky-400',
      };
    }
    if (ev.category === 'publishing' || ev.category === 'workflow') {
      return {
        pill: 'bg-[#171b26] text-[#b6c0d4] border border-violet-500/20',
        dot: 'bg-violet-400',
      };
    }
    return {
      pill: 'bg-[#22241f] text-[#f2ede4] border border-[#c6a052]/30',
      dot: 'bg-[#e5c07b]',
    };
  };

  const getCategoryTextColor = (cat: CalendarItem['category']) => {
    switch (cat) {
      case 'learning':
        return 'text-sky-400';
      case 'publishing':
      case 'workflow':
        return 'text-violet-400';
      case 'deadline':
        return 'text-rose-400';
      case 'life':
        return 'text-emerald-400';
      default:
        return 'text-[#e5c07b]/90';
    }
  };

  return (
    <div className="bg-[#090b0e] rounded-xl border border-[#1b1f28] overflow-hidden shadow-2xl">
      {/* ================================================================
          TOP NAVIGATION SUB-BAR (Matches HTML Spec Header)
          ================================================================ */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-[#090b0e]/95 px-5 py-2.5 border-b border-[#1b1f28] flex flex-wrap items-center justify-between gap-2">
        {/* Sanctuary Navigation Tabs */}
        <div className="flex items-center space-x-2">
          {onSwitchHomeTab && (
            <button
              type="button"
              onClick={() => onSwitchHomeTab('today')}
              className="px-3 py-1 rounded-md text-xs font-medium text-[#7d8799] hover:text-[#d3d8e2] hover:bg-[#141720] transition cursor-pointer"
            >
              {t('Today · Sanctuary', 'Hôm nay · Tổng quan')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSubMode('calendar')}
            className="hidden md:flex px-3.5 py-1 rounded-md text-xs font-semibold items-center space-x-2 transition cursor-pointer bg-[#181a20] border border-[#c6a052]/40 text-[#fae3b4] shadow-[0_0_12px_-2px_rgba(198,160,82,0.2)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#e5c07b]" />
            <span>{t('Calendar · Schedule', 'Lịch · Kế hoạch')}</span>
          </button>
        </div>

        {/* System Controls & Today Focus */}
        <div className="flex items-center space-x-3 ml-auto">
          <div className="hidden sm:flex items-center space-x-2.5 text-[11px] tabular-nums text-[#8b95a7] bg-[#12151d] px-2.5 py-1 rounded-md border border-[#1e232e]">
            <span>
              {t('PLANNED', 'DỰ KIẾN')}:{' '}
              <strong className="text-white font-semibold">{monthStats.planned}</strong>
            </span>
            <span className="text-[#343a4a]">/</span>
            <span>
              {t('COMPLETED', 'HOÀN THÀNH')}:{' '}
              <strong className="text-emerald-400 font-semibold">{monthStats.completed}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setComposerOpen((o) => !o)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#c6a052] hover:bg-[#e5c07b] text-black font-semibold text-xs tracking-wide shadow-[0_0_15px_rgba(198,160,82,0.35)] transition cursor-pointer"
          >
            <span>{composerOpen ? t('Close', 'Đóng') : t('+ Add Event', '+ Thêm lịch')}</span>
          </button>
        </div>
      </header>

      {/* ================================================================
          CORE CONTENT AREA: MONTHLY GRID + SELECTED DAY DOCKET
          ================================================================ */}
      <div className="px-3 sm:px-5 py-3.5 space-y-3.5">
        {/* Calendar Header Bar with Month Control (Desktop) */}
        <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center space-x-3.5">
            <div className="flex items-center bg-[#13161e] border border-[#222734] rounded-md p-0.5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-1 hover:bg-[#1e2330] rounded text-[#8b95a7] hover:text-white transition cursor-pointer"
                title={t('Previous Month', 'Tháng trước')}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
              <button
                type="button"
                onClick={jumpToToday}
                className="px-2.5 py-0.5 tabular-nums text-[11px] uppercase tracking-wider text-[#e5c07b] hover:bg-[#1e2330] rounded font-semibold transition cursor-pointer"
              >
                {t('TODAY', 'HÔM NAY')}
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-1 hover:bg-[#1e2330] rounded text-[#8b95a7] hover:text-white transition cursor-pointer"
                title={t('Next Month', 'Tháng sau')}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white capitalize">
              {monthHeading}
            </h1>
          </div>
        </div>

        {/* TIMELINE ORBIT MODE */}
        {subMode === 'timeline' ? (
          <section className="bg-[#101217] border border-[#1f242e] rounded-lg p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5 border-b border-[#1c212d] pb-2.5">
              <BackButton onClick={() => setSubMode('calendar')} />
              <span className="text-[12px] font-medium text-[#e5c07b]">
                {t('Timeline · All scheduled days', 'Quỹ đạo thời gian · Tất cả ngày có lịch')}
              </span>
            </div>

            {timelineDateGroups.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-xs text-[#7e889a]">
                  {t('No events scheduled yet.', 'Chưa có lịch hẹn nào trong quỹ đạo.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubMode('calendar');
                    setComposerOpen(true);
                  }}
                  className="px-3 py-1 rounded bg-[#c6a052] text-black text-xs font-semibold cursor-pointer"
                >
                  {t('+ Add First Event', '+ Tạo lịch đầu tiên')}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {timelineDateGroups.map(([dStr, list]) => (
                  <div
                    key={dStr}
                    className="p-3 rounded-md bg-[#141720] border border-[#202532] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="tabular-nums text-xs font-bold text-[#e5c07b]">
                        {formatShortDate(dStr)} {dStr === todayStr ? '· TODAY' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(dStr);
                          setSubMode('calendar');
                        }}
                        className="text-[10.5px] tabular-nums text-[#8b95a7] hover:text-white cursor-pointer"
                      >
                        {t('Focus Day →', 'Xem ngày này →')}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {list.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between text-xs text-[#f0ede6] bg-[#101217] px-2.5 py-1.5 rounded border border-[#1d222c]"
                        >
                          <span className={ev.done ? 'line-through opacity-50' : ''}>
                            {ev.time ? `${ev.time} · ` : ''}
                            {ev.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCalendarItem(ev)}
                            className="text-[10px] tabular-nums text-[#525a6c] hover:text-rose-400 cursor-pointer"
                          >
                            Del
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          /* SPLIT GRID: 2 COLUMNS (MONTHLY CALENDAR & SELECTED DAY DOCKET) */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-start">
            {/* Mobile iOS Circular Month Grid with Watermark */}
            <div className="md:hidden">
              <MobileMonthCalendar
                year={viewCursor.year}
                month={viewCursor.month}
                gridDays={gridDays}
                weekdayLabels={weekdayHeaders}
                todayStr={todayStr}
                selectedDate={selectedDate}
                onShiftMonth={shiftMonth}
                onJumpToday={jumpToToday}
                onSelectDate={(dStr) => setSelectedDate(dStr)}
                onQuickAddDate={(dStr) => {
                  setSelectedDate(dStr);
                  setComposerOpen(true);
                }}
                getDayMeta={(dStr) => {
                  const list = itemsByDate.get(dStr) || [];
                  const allDone = list.length > 0 && list.every((ev) => ev.done);
                  return {
                    hasItems: list.length > 0,
                    itemCount: list.length,
                    allDone,
                  };
                }}
                onFabClick={() => setComposerOpen((o) => !o)}
                fabAriaLabel={t('Add event', 'Thêm lịch mới')}
              />
            </div>

            {/* BEGIN: Desktop MonthlyCalendarGrid */}
            <section
              className="hidden md:block xl:col-span-8 bg-[#101217] border border-[#1f242e] rounded-lg overflow-hidden shadow-2xl"
              data-purpose="monthly-calendar"
            >
              {/* Day Names Row (MON - SUN) */}
              <div className="grid grid-cols-7 border-b border-[#1d222c] bg-[#141720]/80 text-[10px] tabular-nums tracking-widest text-[#858fa2] uppercase py-1.5 text-center">
                {weekdayHeaders.map((wd) => (
                  <div key={wd}>{wd}</div>
                ))}
              </div>

              {/* Calendar Days 7x6 Grid Compacted */}
              <div className="grid grid-cols-7 bg-[#1c202a] gap-[1px]">
                {gridDays.map((cell) => {
                  const isToday = cell.dateStr === todayStr;
                  const isSelected = cell.dateStr === selectedDate;
                  const dayItems = itemsByDate.get(cell.dateStr) || [];

                  if (!cell.inMonth) {
                    return (
                      <button
                        key={cell.dateStr}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setSelectedDate(cell.dateStr);
                        }}
                        className="min-h-[58px] p-1.5 bg-[#0c0e12] text-[#424856] flex flex-col justify-between text-left cursor-pointer hover:bg-[#101319]"
                      >
                        <span className="tabular-nums text-[11px]">{cell.dayNum}</span>
                      </button>
                    );
                  }

                  if (isSelected) {
                    return (
                      <button
                        key={cell.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(cell.dateStr)}
                        className="min-h-[58px] p-1.5 bg-[#181a17] border-2 border-[#c6a052]/80 shadow-[inset_0_0_12px_rgba(198,160,82,0.15)] flex flex-col justify-between relative z-10 rounded-[2px] text-left cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="tabular-nums text-[10px] font-bold w-4 h-4 rounded-full bg-[#c6a052] text-black flex items-center justify-center shadow-[0_0_6px_#c6a052]">
                            {cell.dayNum}
                          </span>
                          <span className="hidden sm:inline text-[9px] tabular-nums tracking-wider text-[#e5c07b] uppercase font-semibold">
                            {isToday ? t('TODAY', 'HÔM NAY') : t('FOCUS', 'CHỌN')}
                          </span>
                        </div>

                        {/* Events Preview on Calendar Cell (Dots on Mobile, Pills on Desktop) */}
                        {dayItems.length > 0 && (
                          <>
                            <div className="flex sm:hidden items-center gap-0.5 flex-wrap my-0.5">
                              {dayItems.slice(0, 3).map((ev) => {
                                const st = getCellPillStyles(ev);
                                return <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />;
                              })}
                            </div>
                            <div className="hidden sm:block space-y-0.5 my-0.5 w-full">
                              {dayItems.slice(0, 2).map((ev) => {
                                const st = getCellPillStyles(ev);
                                return (
                                  <div
                                    key={ev.id}
                                    className={`flex items-center space-x-1 text-[9px] px-1 py-0.5 rounded truncate ${st.pill}`}
                                  >
                                    <span className={`w-1 h-1 rounded-full shrink-0 ${st.dot}`} />
                                    <span className={`truncate ${ev.done ? 'line-through opacity-55' : ''}`}>
                                      {ev.time ? `${ev.time} ` : ''}
                                      {ev.title}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}

                        {dayItems.length > 2 ? (
                          <div className="hidden sm:block text-[9px] tabular-nums text-[#e5c07b] font-medium tracking-tight truncate">
                            +{dayItems.length - 2} {t('more items', 'mục nữa')}
                          </div>
                        ) : (
                          <div />
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedDate(cell.dateStr);
                      }}
                      className="min-h-[58px] p-1.5 bg-[#101319] hover:bg-[#131620] transition flex flex-col justify-between group text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`tabular-nums text-[11px] font-medium group-hover:text-[#e5c07b] ${
                            isToday ? 'text-[#e5c07b] font-bold underline' : 'text-[#a2abbc]'
                          }`}
                        >
                          {cell.dayNum}
                        </span>
                        {dayItems.length > 1 && (
                          <span className="text-[9px] tabular-nums text-[#757f95]">
                            +{dayItems.length - 1}
                          </span>
                        )}
                      </div>

                      {dayItems.length > 0 && (
                        <>
                          <div className="flex sm:hidden items-center gap-0.5 flex-wrap my-0.5">
                            {dayItems.slice(0, 3).map((ev) => {
                              const st = getCellPillStyles(ev);
                              return <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />;
                            })}
                          </div>
                          <div className="hidden sm:block space-y-0.5 my-0.5 w-full">
                            {dayItems.slice(0, 1).map((ev) => {
                              const st = getCellPillStyles(ev);
                              return (
                                <div
                                  key={ev.id}
                                  className={`flex items-center space-x-1 text-[9px] px-1 py-0.5 rounded truncate ${st.pill}`}
                                >
                                  <span className={`w-1 h-1 rounded-full shrink-0 ${st.dot}`} />
                                  <span className={`truncate ${ev.done ? 'line-through opacity-55' : ''}`}>
                                    {ev.time ? `${ev.time} ` : ''}
                                    {ev.title}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      <div />
                    </button>
                  );
                })}
              </div>
            </section>
            {/* END: MonthlyCalendarGrid */}

            {/* BEGIN: SelectedDayDocket */}
            <section
              className="xl:col-span-4 bg-[#101217] border border-[#1f242e] rounded-lg p-3.5 shadow-2xl flex flex-col"
              data-purpose="selected-day-details"
            >
              {/* Docket Header */}
              <div className="flex items-center justify-between border-b border-[#1c212d] pb-2.5 mb-2.5">
                <h2 className="text-[17px] font-semibold text-white tracking-[-0.015em] capitalize">
                  {selectedFullLabel}
                </h2>
                <button
                  type="button"
                  onClick={() => setComposerOpen((o) => !o)}
                  className="px-2 py-0.5 text-[11px] rounded bg-[#191d27] hover:bg-[#c6a052] hover:text-black border border-[#272e3f] text-[#c0c7d5] font-medium transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>{composerOpen ? t('Close', 'Đóng') : t('+ Add', '+ Thêm')}</span>
                </button>
              </div>

              {/* Inline Event Composer */}
              {composerOpen && (
                <form
                  onSubmit={handleAddEventForDate}
                  className="mb-3 p-2.5 rounded-md bg-[#141720] border border-[#c6a052]/40 space-y-2"
                >
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t('Event or task title...', 'Tên lịch hẹn hoặc việc cần làm...')}
                    className="w-full px-2.5 py-1.5 rounded text-xs bg-[#0c0e12] border border-[#262a36] text-white"
                  />
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="px-2 py-1 rounded text-[11px] bg-[#0c0e12] border border-[#262a36] text-[#e6e8ec] tabular-nums"
                    />
                    <input
                      type="number"
                      min={5}
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      placeholder="45m"
                      className="px-2 py-1 rounded text-[11px] bg-[#0c0e12] border border-[#262a36] text-[#e6e8ec] tabular-nums"
                    />
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                      className="px-2 py-1 rounded text-[11px] bg-[#0c0e12] border border-[#262a36] text-[#e6e8ec] tabular-nums"
                    >
                      <option value="health">health</option>
                      <option value="learning">learning</option>
                      <option value="publishing">publishing</option>
                      <option value="creative">creative</option>
                      <option value="life">life</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {selectedDate === todayStr ? (
                      <label className="flex items-center gap-1.5 text-[11px] text-[#8b95a7] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pinFocus}
                          onChange={(e) => setPinFocus(e.target.checked)}
                        />
                        {t('Pin to Today Focus', 'Ghim vào hôm nay')}
                      </label>
                    ) : (
                      <span className="text-[10px] tabular-nums text-[#757f95]">
                        {formatShortDate(selectedDate)}
                      </span>
                    )}
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-[#c6a052] hover:bg-[#e5c07b] text-black font-semibold text-[11px] cursor-pointer"
                    >
                      {t('Save Event', 'Lưu vào lịch')}
                    </button>
                  </div>
                </form>
              )}

              {/* Task & Event List (Compact laptop viewport) */}
              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[295px] pr-1 custom-scrollbar">
                {selectedItems.length === 0 ? (
                  <div className="py-8 px-3 text-center rounded-md bg-[#141720]/60 border border-dashed border-[#202532] space-y-2">
                    <p className="text-xs text-[#788295]">
                      {t('No events scheduled for this day.', 'Chưa có lịch hẹn nào trong ngày này.')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setComposerOpen(true)}
                      className="text-[11px] tabular-nums text-[#e5c07b] hover:underline cursor-pointer"
                    >
                      {t('+ Add Event to This Day', '+ Thêm lịch cho ngày này')}
                    </button>
                  </div>
                ) : (
                  selectedItems.map((ev) => {
                    const isHighlightCard = ev.kind === 'psychology' || ev.kind === 'workflow';
                    if (isHighlightCard) {
                      return (
                        <div
                          key={ev.id}
                          className="p-2.5 rounded-md bg-gradient-to-r from-[#171614] to-[#161a22] border border-[#c6a052]/30 hover:border-[#c6a052]/60 shadow-[0_4px_16px_-4px_rgba(198,160,82,0.12)] transition"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-start space-x-2 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#e5c07b] mt-1 shrink-0 shadow-[0_0_6px_#c6a052]" />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#fae3b4] leading-tight">
                                  {ev.title}
                                </h4>
                                <div className="flex items-center space-x-2 text-[10px] text-[#8e98ac] mt-1 tabular-nums">
                                  <span className="text-[#e5c07b] font-medium">{ev.metaCategory}</span>
                                  <span>•</span>
                                  <span className="text-[#a4adbf]">{ev.metaSub}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {ev.jumpTo && (
                                <button
                                  type="button"
                                  onClick={() => onNavigate(ev.jumpTo!.ws, ev.jumpTo!.sub)}
                                  className="text-[11px] tabular-nums font-medium text-[#e5c07b] hover:text-white flex items-center space-x-1 shrink-0 px-1.5 py-0.5 rounded bg-[#20221e] border border-[#c6a052]/20 transition cursor-pointer"
                                >
                                  <span>Open ↗</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteCalendarItem(ev)}
                                className="text-[10px] text-[#525a6c] hover:text-rose-400 tabular-nums transition cursor-pointer"
                                title="Delete"
                              >
                                Del
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={ev.id}
                        className="group relative p-2 rounded-md bg-[#141720] border border-[#202532] hover:border-[#c6a052]/40 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => ev.taskRef && toggleTaskDone(ev.taskRef)}
                              className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition shrink-0 cursor-pointer ${
                                ev.done
                                  ? 'border-emerald-400 bg-emerald-400/20'
                                  : 'border-[#444c60] group-hover:border-[#e5c07b]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ev.done
                                    ? 'bg-emerald-400'
                                    : 'bg-transparent group-hover:bg-[#e5c07b]/40'
                                }`}
                              />
                            </button>
                            <div className="min-w-0">
                              <h4
                                className={`text-xs font-semibold leading-tight ${
                                  ev.done ? 'line-through text-[#6c7689]' : 'text-[#f0ede6]'
                                }`}
                              >
                                {ev.time ? `${ev.time} · ` : ''}
                                {ev.title}
                              </h4>
                              <div className="flex items-center space-x-1.5 text-[10px] text-[#788295] mt-0.5 tabular-nums">
                                <span className={`${getCategoryTextColor(ev.category)} font-medium`}>
                                  {ev.metaCategory}
                                </span>
                                <span>•</span>
                                <span>{ev.metaSub}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCalendarItem(ev)}
                            className="text-[10px] text-[#525a6c] hover:text-rose-400 tabular-nums transition shrink-0 cursor-pointer"
                            title="Delete Task"
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </section>
            {/* END: SelectedDayDocket */}
          </div>
        )}

        {upcomingPublishing.length > 0 && (
          <section
            className="bg-[#101217] border border-[#1f242e] rounded-lg p-3.5 shadow-2xl"
            data-purpose="publishing-research-schedule"
          >
            {/* Section Title */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-1.5 h-1.5 bg-[#c6a052] rounded-sm" />
                <h3 className="text-[11px] font-medium text-[#e5c07b]">
                  {t(
                    `Upcoming publishing & research (${upcomingPublishing.length})`,
                    `Lịch xuất bản & nghiên cứu sắp tới (${upcomingPublishing.length})`
                  )}
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {upcomingPublishing.map((item, idx) => {
                const isLastOdd =
                  upcomingPublishing.length % 2 === 1 && idx === upcomingPublishing.length - 1;
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded bg-[#141720] border border-[#212735] hover:border-[#c6a052]/40 transition ${
                      isLastOdd && upcomingPublishing.length > 1 ? 'md:col-span-2' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] tabular-nums mb-1">
                      <span className="text-[#757f95] font-medium">
                        {item.channel} <span className="text-[#414859]">·</span>{' '}
                        {formatShortDate(item.date).slice(0, 5)}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.daysLeft === 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-[#c6a052]/15 border border-[#c6a052]/30 text-[#e5c07b] font-semibold text-[10px]">
                            {t('Today', 'Hôm nay')}
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] tabular-nums font-medium ${
                              item.daysLeft < 0
                                ? 'text-rose-400'
                                : item.daysLeft <= 3
                                ? 'text-amber-400/90'
                                : 'text-[#8a95a8]'
                            }`}
                          >
                            {item.daysLeft < 0
                              ? `${Math.abs(item.daysLeft)}d late`
                              : `${item.daysLeft}d left`}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={item.onDelete}
                          className="text-[10px] text-[#525a6c] hover:text-rose-400 cursor-pointer"
                          title="Delete"
                        >
                          Del
                        </button>
                      </div>
                    </div>
                    <p
                      onClick={item.onOpen}
                      className="text-xs font-semibold text-[#f1ede6] truncate cursor-pointer hover:text-[#fae3b4]"
                    >
                      {item.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
