import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getLocalDateStr, diffDaysFromToday, formatShortDate } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { buildAndPersistWidgetSnapshot } from '../../lib/ambient';
import { triggerHaptic } from '../../lib/haptics';
import type { DailyLog, TaskCategory, TaskItem, WorkspaceId } from '../../types';
import { CheckDot, useToast } from '../../components/ui/Primitives';

const CATEGORY_COPY: Record<TaskCategory, string> = {
  learning: 'Continue learning',
  publishing: 'Continue publishing',
  health: 'Move & restore',
  creative: 'Continue creating',
  life: 'Personal rhythm',
};

const CATEGORY_ROOM: Record<TaskCategory, { ws: WorkspaceId; sub?: string }> = {
  learning: { ws: 'learning', sub: 'code' },
  publishing: { ws: 'creative', sub: 'psychology' },
  health: { ws: 'life', sub: 'habits' },
  creative: { ws: 'creative', sub: 'stories' },
  life: { ws: 'life', sub: 'books' },
};

const WORLD_ROOMS: {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  workspace: WorkspaceId;
  sub?: string;
}[] = [
  {
    id: 'library',
    title: 'The Library',
    subtitle: 'Read & discover',
    image: '/art/room-library.jpg',
    workspace: 'knowledge',
  },
  {
    id: 'studio',
    title: 'The Studio',
    subtitle: 'Write & create',
    image: '/art/room-studio.jpg',
    workspace: 'creative',
    sub: 'psychology',
  },
  {
    id: 'lab',
    title: 'The Lab',
    subtitle: 'Learn & experiment',
    image: '/art/room-lab.jpg',
    workspace: 'learning',
    sub: 'code',
  },
  {
    id: 'playground',
    title: 'The Playground',
    subtitle: 'Play & explore',
    image: '/art/room-playground.jpg',
    workspace: 'playground',
    sub: 'wheel',
  },
];

function getEditorialDateEyebrow(): string {
  const d = new Date();
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(d).toUpperCase();
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(d).toUpperCase();
  return `${weekday} · ${month} ${d.getDate()}`;
}

function padTwo(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Milestone 02 — Home: The Living Space
 * Apple Minimal × Dark Academia × Cinematic Editorial
 * 3 visual layers: Emotional Hero · Personal Current Focus · Quiet Functional Structure & Your World
 */
export function TodayView({
  onNavigate,
  onOpenCapture,
  onOpenAmbient,
  onOpenManifesto,
}: {
  onNavigate: (workspace: WorkspaceId, sub?: string) => void;
  onOpenCapture: () => void;
  onOpenAmbient: () => void;
  onOpenManifesto?: () => void;
}) {
  const { showToast } = useToast();
  const todayStr = getLocalDateStr();
  const [showInbox, setShowInbox] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<'active' | 'completed'>('active');

  const profile = useLiveQuery(() => db.profile.get('main'));
  const rawTasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const tasks = [...rawTasks].sort((a, b) => b.createdAt - a.createdAt);
  const todayLogRow = useLiveQuery(() => db.dailyLogs.get(todayStr));
  const lectures = useLiveQuery(() => db.workflowLectures.orderBy('updatedAt').reverse().toArray()) || [];
  const psychPosts = useLiveQuery(() => db.psychologyPosts.orderBy('updatedAt').reverse().toArray()) || [];

  useEffect(() => {
    buildAndPersistWidgetSnapshot();
  }, [rawTasks, todayLogRow, lectures, psychPosts]);

  const todayLog: DailyLog = todayLogRow || {
    date: todayStr,
    codeDone: false,
    codePillars: [],
    codeMinutes: 0,
    englishDone: false,
    englishNote: '',
    gymDone: false,
    gymSplit: '',
    readDone: false,
    createDone: false,
    dailyNote: '',
    xpEarned: 0,
    updatedAt: Date.now(),
  };

  const upsertToday = async (patch: Partial<DailyLog>) => {
    await db.dailyLogs.put({
      ...todayLog,
      ...patch,
      date: todayStr,
      updatedAt: Date.now(),
    });
  };

  const focusTasks = tasks
    .filter((t) => t.isTodayFocus)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 3);
  const focusDone = focusTasks.filter((t) => t.status === 'completed').length;
  const currentActiveFocus = focusTasks.find((t) => t.status !== 'completed') || focusTasks[0] || null;

  const nowHm = `${String(new Date().getHours()).padStart(2, '0')}:${String(
    new Date().getMinutes()
  ).padStart(2, '0')}`;
  const scheduledUpcoming = tasks
    .filter((t) => t.status !== 'completed' && t.status !== 'paused' && t.scheduledTime)
    .sort((a, b) => (a.scheduledTime || '23:59').localeCompare(b.scheduledTime || '23:59'));
  const nextUp =
    scheduledUpcoming.find((t) => (t.scheduledTime || '') >= nowHm) ||
    scheduledUpcoming[0] ||
    null;

  const otherTasks = tasks.filter((t) => {
    if (t.isTodayFocus) return false;
    return inboxFilter === 'completed' ? t.status === 'completed' : t.status !== 'completed';
  });
  const openOtherCount = tasks.filter((t) => !t.isTodayFocus && t.status !== 'completed').length;

  const nextWorkflow = lectures
    .filter((l) => l.status !== 'published')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const wfDays = nextWorkflow ? diffDaysFromToday(nextWorkflow.dueDate) : null;

  const nextPsych = psychPosts
    .filter((p) => p.status !== 'published')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const psychDays = nextPsych ? diffDaysFromToday(nextPsych.dueDate) : null;

  const toggleTaskDone = async (task: TaskItem) => {
    const willComplete = task.status !== 'completed';
    triggerHaptic(willComplete ? 'success' : 'light');
    await db.tasks.update(task.id, {
      status: willComplete ? 'completed' : 'planned',
      completedAt: willComplete ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    await awardXp(willComplete ? 25 : -25);
    if (willComplete) showToast(`Đã hoàn thành · ${task.title}`);
  };

  const toggleFocusPin = async (task: TaskItem) => {
    triggerHaptic('selection');
    if (task.isTodayFocus) {
      await db.tasks.update(task.id, { isTodayFocus: false, updatedAt: Date.now() });
      showToast('Đã bỏ khỏi 3 việc hôm nay', 'info');
      return;
    }
    if (focusTasks.length >= 3) {
      showToast('Giữ tối đa 3 việc quan trọng trong ngày để không bị phân tán.', 'info');
      return;
    }
    await db.tasks.update(task.id, {
      isTodayFocus: true,
      status: task.status === 'inbox' ? 'planned' : task.status,
      scheduledDate: todayStr,
      updatedAt: Date.now(),
    });
    showToast('Đã đưa vào 3 việc hôm nay');
  };

  const balance = {
    learn: Boolean(todayLog.codeDone || todayLog.englishDone),
    read: Boolean(todayLog.readDone),
    move: Boolean(todayLog.gymDone),
    create: Boolean(todayLog.createDone),
  };

  const toggleBalance = async (key: keyof typeof balance) => {
    triggerHaptic('light');
    if (key === 'learn') await upsertToday({ codeDone: !balance.learn });
    if (key === 'read') await upsertToday({ readDone: !balance.read });
    if (key === 'move') await upsertToday({ gymDone: !balance.move });
    if (key === 'create') await upsertToday({ createDone: !balance.create });
  };

  const handleContinueFocus = () => {
    if (currentActiveFocus) {
      const dest = CATEGORY_ROOM[currentActiveFocus.category];
      onNavigate(dest.ws, dest.sub);
    } else {
      onNavigate('learning', 'code');
    }
  };

  const formatDaysShort = (days: number | null) => {
    if (days === null) return '—';
    if (days < 0) return `Trễ ${Math.abs(days)}d`;
    if (days === 0) return 'Hôm nay';
    return `${days}d`;
  };

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* ================================================================
          LAYER 1: EMOTIONAL LAYER — Editorial Headline + Cinematic Hero
          ================================================================ */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="metadata text-[11px] tracking-[0.08em]"
                style={{ color: 'var(--os-brass)' }}
              >
                01 / SYSTEM.READY
              </span>
              <span style={{ color: 'var(--os-ivory-faint)' }}>·</span>
              <p className="editorial-eyebrow">{getEditorialDateEyebrow()}</p>
              <span style={{ color: 'var(--os-ivory-faint)' }}>·</span>
              <button
                type="button"
                onClick={onOpenManifesto}
                className="metadata text-[11px] uppercase tracking-[0.12em] hover:underline cursor-pointer"
                style={{ color: 'var(--os-dusty-blue)' }}
              >
                NOETRIX · THE ART OF BECOMING ↗
              </button>
            </div>
            <h1 className="editorial-display">
              A new day,
              <br />
              <span style={{ color: 'var(--os-ivory)' }}>
                a new perspective.
              </span>
            </h1>
            <div className="space-y-1 max-w-xl">
              <p className="font-editorial text-[18px] sm:text-[20px]" style={{ color: 'var(--os-ivory-bright)' }}>
                “{profile?.motto || 'Curious by nature. Mischievous by design. Pure in pursuit.'}”
              </p>
              <p className="text-[13.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                A mind without boundaries, a soul without a destination.
              </p>
            </div>
          </div>
        </div>

        {/* Cinematic Study Hero Frame + Personal Focus Overlay */}
        <div
          onClick={handleContinueFocus}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleContinueFocus();
            }
          }}
          className="group relative w-full aspect-[16/10] sm:aspect-[21/9] max-h-[380px] rounded-[14px] overflow-hidden cursor-pointer"
          style={{
            backgroundColor: 'var(--os-graphite)',
            border: '1px solid var(--os-border)',
          }}
        >
          <img
            src="/art/hero-study.jpg"
            alt="Quiet evening study desk"
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />

          {/* Subtle cinematic bottom scrim for effortless serif readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(16,17,20,0.08) 0%, rgba(16,17,20,0.28) 46%, rgba(16,17,20,0.88) 100%)',
            }}
          />

          {/* Personal Layer: Current Focus anchored delicately along bottom */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5 min-w-0 max-w-xl">
              <p
                className="text-[10px] font-medium uppercase tracking-[0.2em]"
                style={{ color: '#B99B79' }}
              >
                Your Current Focus
              </p>
              <h2
                className="font-editorial-vi text-[24px] sm:text-[30px] leading-[1.16] tracking-[-0.015em] font-normal truncate"
                style={{ color: '#EDEAE2' }}
              >
                {currentActiveFocus ? currentActiveFocus.title : 'Build your craft.'}
              </h2>
              <p className="text-[13px] tabular-nums" style={{ color: 'rgba(217, 213, 203, 0.72)' }}>
                {currentActiveFocus
                  ? `${CATEGORY_COPY[currentActiveFocus.category]}${
                      currentActiveFocus.durationMinutes ? ` · ${currentActiveFocus.durationMinutes} min` : ''
                    }`
                  : 'Continue learning · 45 min'}
              </p>
            </div>

            <span
              className="inline-flex items-center gap-1.5 self-start sm:self-end px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-300 group-hover:translate-x-0.5 shrink-0"
              style={{
                backgroundColor: 'rgba(16, 17, 20, 0.62)',
                border: '1px solid rgba(217, 213, 203, 0.2)',
                color: '#EDEAE2',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span>Continue</span>
              <span style={{ color: '#B99B79' }}>↗</span>
            </span>
          </div>
        </div>
      </section>

      {/* ================================================================
          LAYER 2: FUNCTIONAL LAYER — Asymmetrical Editorial Structure
          ================================================================ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left 7 cols: A little structure for today (Top 3 Focus + Quiet Inbox) */}
        <div className="lg:col-span-7 space-y-5">
          <div
            className="flex items-baseline justify-between gap-4 pb-3.5"
            style={{ borderBottom: '1px solid var(--os-border)' }}
          >
            <h2 className="editorial-h2">A little structure for today</h2>
            <div className="flex items-center gap-4 shrink-0">
              <span
                className="font-editorial text-[22px] tabular-nums"
                style={{
                  color:
                    focusDone === focusTasks.length && focusTasks.length > 0
                      ? 'var(--os-sage)'
                      : 'var(--os-brass)',
                }}
              >
                {padTwo(focusDone)} / {padTwo(Math.max(3, focusTasks.length))}
              </span>
              <button
                type="button"
                onClick={onOpenCapture}
                className="text-[12.5px] font-medium transition-opacity hover:opacity-80 cursor-pointer"
                style={{ color: 'var(--os-dusty-blue)' }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* The 3 Curated Focus Intentions */}
          {focusTasks.length === 0 ? (
            <div
              className="py-8 px-5 rounded-[12px] text-center space-y-3"
              style={{
                backgroundColor: 'var(--os-graphite)',
                border: '1px solid var(--os-border)',
              }}
            >
              <p className="font-editorial text-[22px]" style={{ color: 'var(--os-ivory-bright)' }}>
                A clear desk.
              </p>
              <p className="text-[13.5px] max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                Chọn tối đa 3 việc quan trọng nhất để định hình nhịp sống hôm nay.
              </p>
              <div className="pt-1 flex items-center justify-center gap-4 text-[13px]">
                <button
                  type="button"
                  onClick={onOpenCapture}
                  className="font-medium cursor-pointer"
                  style={{ color: 'var(--os-brass)' }}
                >
                  + Thêm việc mới
                </button>
                {openOtherCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowInbox(true)}
                    className="cursor-pointer"
                    style={{ color: 'var(--os-dusty-blue)' }}
                  >
                    Chọn từ Inbox ({openOtherCount})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--os-border)]">
              {focusTasks.map((task) => {
                const done = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className="group py-4 flex items-start justify-between gap-4 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskDone(task)}
                      className="flex items-start gap-3.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="mt-0.5">
                        <CheckDot checked={done} />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-[15.5px] leading-[22px] font-normal transition-colors ${
                            done ? 'line-through opacity-45' : ''
                          }`}
                          style={{ color: 'var(--os-ivory-bright)' }}
                        >
                          {task.title}
                        </p>
                        <p
                          className="text-[12.5px] mt-1 tabular-nums"
                          style={{ color: 'var(--os-ivory-faint)' }}
                        >
                          {CATEGORY_COPY[task.category]}
                          {task.durationMinutes ? ` · ${task.durationMinutes} min` : ''}
                          {task.deadline ? ` · Due ${formatShortDate(task.deadline)}` : ''}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleFocusPin(task)}
                      className="text-[11.5px] opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pt-1 cursor-pointer shrink-0"
                      style={{ color: 'var(--os-ivory-faint)' }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quiet Collapsible Inbox Toggle (keeps Home uncluttered) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowInbox((s) => !s)}
              className="inline-flex items-center gap-2 text-[12.5px] transition-colors cursor-pointer"
              style={{ color: 'var(--os-ivory-muted)' }}
            >
              <span>
                {showInbox ? 'Ẩn danh sách Inbox' : `Inbox & các việc khác (${openOtherCount})`}
              </span>
              <span style={{ color: 'var(--os-ivory-faint)' }}>{showInbox ? '↑' : '↓'}</span>
            </button>

            {showInbox && (
              <div
                className="mt-4 rounded-[12px] p-4 space-y-3"
                style={{
                  backgroundColor: 'var(--os-graphite)',
                  border: '1px solid var(--os-border)',
                }}
              >
                <div className="flex items-center justify-between gap-2 pb-2" style={{ borderBottom: '1px solid var(--os-border)' }}>
                  <div className="flex items-center gap-4 text-[12px]">
                    <button
                      type="button"
                      onClick={() => setInboxFilter('active')}
                      className="cursor-pointer font-medium"
                      style={{
                        color: inboxFilter === 'active' ? 'var(--os-brass)' : 'var(--os-ivory-faint)',
                      }}
                    >
                      Đang mở ({openOtherCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInboxFilter('completed')}
                      className="cursor-pointer font-medium"
                      style={{
                        color: inboxFilter === 'completed' ? 'var(--os-sage)' : 'var(--os-ivory-faint)',
                      }}
                    >
                      Đã xong
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenCapture}
                    className="text-[12px] font-medium cursor-pointer"
                    style={{ color: 'var(--os-dusty-blue)' }}
                  >
                    + New task
                  </button>
                </div>

                {otherTasks.length === 0 ? (
                  <p className="text-[13px] py-2" style={{ color: 'var(--os-ivory-faint)' }}>
                    Không có mục nào trong danh sách này.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--os-border)]">
                    {otherTasks.map((t) => {
                      const done = t.status === 'completed';
                      return (
                        <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => toggleTaskDone(t)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                          >
                            <CheckDot checked={done} size="sm" />
                            <span
                              className={`text-[14px] truncate ${done ? 'line-through opacity-45' : ''}`}
                              style={{ color: 'var(--os-ivory)' }}
                            >
                              {t.title}
                            </span>
                          </button>
                          <div className="flex items-center gap-3 text-[12px] shrink-0">
                            {!done && (
                              <button
                                type="button"
                                onClick={() => toggleFocusPin(t)}
                                className="cursor-pointer"
                                style={{ color: 'var(--os-brass)' }}
                              >
                                Focus
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => db.tasks.delete(t.id)}
                              className="cursor-pointer"
                              style={{ color: 'var(--os-ivory-faint)' }}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 cols: Quiet Personal Companion Sheet */}
        <div
          className="lg:col-span-5 rounded-[14px] p-5 sm:p-6 space-y-6"
          style={{
            backgroundColor: 'var(--os-graphite)',
            border: '1px solid var(--os-border)',
          }}
        >
          {/* Next Up */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="editorial-eyebrow">Next Up</p>
              {nextUp?.scheduledTime && (
                <span
                  className="text-[13px] font-medium tabular-nums"
                  style={{ color: 'var(--os-brass)' }}
                >
                  {nextUp.scheduledTime}
                </span>
              )}
            </div>
            {nextUp ? (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-editorial-vi text-[19px] leading-snug" style={{ color: 'var(--os-ivory-bright)' }}>
                    {nextUp.title}
                  </p>
                  <p className="text-[12.5px] mt-0.5 tabular-nums" style={{ color: 'var(--os-ivory-muted)' }}>
                    {CATEGORY_COPY[nextUp.category]}
                    {nextUp.durationMinutes ? ` · ${nextUp.durationMinutes} min` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleTaskDone(nextUp)}
                  className="mt-1 cursor-pointer shrink-0"
                  title="Hoàn thành"
                >
                  <CheckDot checked={nextUp.status === 'completed'} size="sm" />
                </button>
              </div>
            ) : (
              <p className="text-[13.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                Không có lịch cố định sắp tới. Hãy giữ nhịp tự do.
              </p>
            )}
          </div>

          <div className="h-[1px]" style={{ backgroundColor: 'var(--os-border)' }} />

          {/* Publishing Pulse */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="editorial-eyebrow">Publishing Pulse</p>
              <button
                type="button"
                onClick={() => onNavigate('creative', 'calendar')}
                className="text-[11.5px] cursor-pointer"
                style={{ color: 'var(--os-dusty-blue)' }}
              >
                Calendar ↗
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigate('knowledge')}
                className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium truncate group-hover:underline" style={{ color: 'var(--os-ivory)' }}>
                    AI Workflow · 3 days
                  </p>
                  <p className="text-[12px] truncate" style={{ color: 'var(--os-ivory-faint)' }}>
                    {nextWorkflow ? nextWorkflow.title : 'Create next lesson'}
                  </p>
                </div>
                <span className="text-[12.5px] tabular-nums shrink-0" style={{ color: 'var(--os-dusty-blue)' }}>
                  {formatDaysShort(wfDays)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('creative', 'psychology')}
                className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium truncate group-hover:underline" style={{ color: 'var(--os-ivory)' }}>
                    Psychology · Weekly
                  </p>
                  <p className="text-[12px] truncate" style={{ color: 'var(--os-ivory-faint)' }}>
                    {nextPsych ? nextPsych.title : 'Draft weekly essay'}
                  </p>
                </div>
                <span className="text-[12.5px] tabular-nums shrink-0" style={{ color: 'var(--os-brass)' }}>
                  {formatDaysShort(psychDays)}
                </span>
              </button>
            </div>
          </div>

          <div className="h-[1px]" style={{ backgroundColor: 'var(--os-border)' }} />

          {/* Life Balance — Quiet 4-word Touch Bar (No screaming rings!) */}
          <div className="space-y-3">
            <p className="editorial-eyebrow">Life Balance</p>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ['learn', 'Learn', balance.learn],
                  ['read', 'Read', balance.read],
                  ['move', 'Move', balance.move],
                  ['create', 'Create', balance.create],
                ] as const
              ).map(([key, label, active]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleBalance(key)}
                  className="py-2 px-1 rounded-[10px] flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: active ? 'rgba(155, 170, 152, 0.12)' : 'var(--os-stone)',
                    border: active ? '1px solid rgba(155, 170, 152, 0.28)' : '1px solid transparent',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: active ? 'var(--os-sage)' : 'var(--os-ivory-faint)',
                    }}
                  />
                  <span
                    className="text-[12px] font-medium"
                    style={{
                      color: active ? 'var(--os-ivory-bright)' : 'var(--os-ivory-muted)',
                    }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          LAYER 3: YOUR WORLD — 4 Editorial Visual Workspace Destinations
          ================================================================ */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="editorial-eyebrow">Your World</p>
          <button
            type="button"
            onClick={() => onNavigate('life', 'habits')}
            className="text-[12px] transition-opacity hover:opacity-80 cursor-pointer"
            style={{ color: 'var(--os-ivory-muted)' }}
          >
            Life, outside the screen ↗
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {WORLD_ROOMS.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onNavigate(room.workspace, room.sub)}
              className="group relative aspect-[16/10] rounded-[12px] overflow-hidden text-left cursor-pointer"
              style={{
                backgroundColor: 'var(--os-graphite)',
                border: '1px solid var(--os-border)',
              }}
            >
              <img
                src={room.image}
                alt={room.title}
                loading="lazy"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(16,17,20,0.06) 0%, rgba(16,17,20,0.34) 55%, rgba(16,17,20,0.9) 100%)',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-3">
                <div>
                  <h3
                    className="font-editorial text-[26px] leading-[1.1] tracking-[-0.01em]"
                    style={{ color: '#EDEAE2' }}
                  >
                    {room.title}
                  </h3>
                  <p className="text-[12.5px] mt-1" style={{ color: 'rgba(217, 213, 203, 0.72)' }}>
                    {room.subtitle}
                  </p>
                </div>
                <span
                  className="text-[15px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
                  style={{ color: '#B99B79' }}
                >
                  ↗
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* NOETRIX Signature Crest Footer — SF Pro Display Semibold + Medium + SF Pro Text + SF Mono */}
      <footer className="pt-6 pb-8">
        <button
          type="button"
          onClick={onOpenManifesto}
          className="w-full p-6 sm:p-8 rounded-[14px] text-center space-y-4 cursor-pointer transition-colors hover:border-[var(--os-border-hover)]"
          style={{
            backgroundColor: 'var(--os-graphite)',
            border: '1px solid var(--os-border)',
          }}
        >
          <div className="space-y-1.5">
            <p
              className="noetrix-logo text-[28px] sm:text-[32px] leading-none"
              style={{ color: 'var(--os-ivory-bright)' }}
            >
              NOETRIX
            </p>
            <p
              className="metadata text-[10.5px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--os-brass)' }}
            >
              THE ART OF BECOMING
            </p>
          </div>

          <div className="h-[1px] w-full max-w-md mx-auto" style={{ backgroundColor: 'var(--os-border)' }} />

          <div className="space-y-2">
            <p
              className="font-editorial text-[19px] sm:text-[22px] leading-snug"
              style={{ color: 'var(--os-ivory-bright)' }}
            >
              Curious by nature. Mischievous by design. Pure in pursuit.
            </p>
            <p className="text-[13.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
              A mind without boundaries, a soul without a destination.
            </p>
            <p
              className="metadata text-[10px] uppercase tracking-[0.22em] pt-1"
              style={{ color: 'var(--os-brass)' }}
            >
              THINK · DISCOVER · CREATE · BECOME
            </p>
          </div>
        </button>
      </footer>
    </div>
  );
}
