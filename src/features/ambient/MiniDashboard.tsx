import React, { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, diffDaysFromToday, getLocalDateStr } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { buildAndPersistWidgetSnapshot } from '../../lib/ambient';
import { CheckDot } from '../../components/ui/Primitives';

/**
 * Ambient Desktop Mini Dashboard — Section 11 Dark Editorial Graphite aesthetic.
 * Translucent Graphite (#1B1D22) on Obsidian (#101114), warm Ivory (#D9D5CB),
 * Antique Brass (#B99B79) & Sage (#9BAA98). Live-synced with IndexedDB.
 */
export function MiniDashboard() {
  const today = getLocalDateStr();
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const lectures = useLiveQuery(() => db.workflowLectures.toArray()) || [];
  const psych = useLiveQuery(() => db.psychologyPosts.toArray()) || [];

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const focusTasks = tasks
    .filter((t) => t.isTodayFocus)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 3);
  const doneCount = focusTasks.filter((t) => t.status === 'completed').length;
  const remaining = tasks.filter((t) => t.status !== 'completed' && t.status !== 'paused').length;

  const nowHm = `${String(new Date().getHours()).padStart(2, '0')}:${String(
    new Date().getMinutes()
  ).padStart(2, '0')}`;
  const nextUp =
    tasks
      .filter((t) => t.status !== 'completed' && t.scheduledTime)
      .sort((a, b) => (a.scheduledTime || '23:59').localeCompare(b.scheduledTime || '23:59'))
      .find((t) => (t.scheduledTime || '') >= nowHm) ||
    tasks.find((t) => t.status !== 'completed' && !t.isTodayFocus && t.scheduledDate === today) ||
    null;

  const deadlines: { title: string; days: number }[] = [];
  for (const l of lectures) {
    if (l.status !== 'published' && l.dueDate) {
      deadlines.push({ title: `Workflow · ${l.title}`, days: diffDaysFromToday(l.dueDate) });
    }
  }
  for (const p of psych) {
    if (p.status !== 'published' && p.dueDate) {
      deadlines.push({ title: `Tâm lý · ${p.title}`, days: diffDaysFromToday(p.dueDate) });
    }
  }
  deadlines.sort((a, b) => a.days - b.days);
  const nearest = deadlines[0] || null;

  const toggleTask = async (id: string, currentlyDone: boolean) => {
    await db.tasks.update(id, {
      status: currentlyDone ? 'planned' : 'completed',
      completedAt: currentlyDone ? undefined : Date.now(),
      updatedAt: Date.now(),
    });
    await awardXp(currentlyDone ? -20 : 20);
    await buildAndPersistWidgetSnapshot();
  };

  return (
    <div
      className="min-h-dvh p-4 space-y-4 select-none"
      style={{ backgroundColor: '#101114', color: '#D9D5CB' }}
    >
      {/* Editorial Header */}
      <div className="flex items-end justify-between pb-3" style={{ borderBottom: '1px solid rgba(217,213,203,0.085)' }}>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: '#B99B79' }}>
            Personal OS · Focus
          </p>
          <p className="font-editorial text-[24px] leading-tight mt-0.5" style={{ color: '#EDEAE2' }}>
            A little structure.
          </p>
        </div>
        <span
          className="text-[13px] font-medium tabular-nums"
          style={{ color: doneCount === focusTasks.length && focusTasks.length > 0 ? '#9BAA98' : '#B99B79' }}
        >
          0{doneCount} / 0{focusTasks.length}
        </span>
      </div>

      {/* Top 3 Focus Tasks */}
      <div
        className="rounded-[12px] overflow-hidden"
        style={{ backgroundColor: '#1B1D22', border: '1px solid rgba(217,213,203,0.08)' }}
      >
        {focusTasks.length === 0 ? (
          <p className="p-4 text-[13px]" style={{ color: 'rgba(217,213,203,0.58)' }}>
            Chưa chọn 3 việc trọng tâm cho hôm nay.
          </p>
        ) : (
          focusTasks.map((task, idx) => {
            const done = task.status === 'completed';
            return (
              <React.Fragment key={task.id}>
                <button
                  type="button"
                  onClick={() => toggleTask(task.id, done)}
                  className="w-full px-3.5 py-3 flex items-center gap-3 text-left transition-colors hover:bg-[#292A2D]/60 cursor-pointer"
                >
                  <CheckDot checked={done} size="sm" />
                  <span
                    className={`text-[13.5px] leading-snug line-clamp-2 ${
                      done ? 'line-through opacity-45' : ''
                    }`}
                    style={{ color: '#EDEAE2' }}
                  >
                    {task.title}
                  </span>
                </button>
                {idx < focusTasks.length - 1 && (
                  <div className="h-[1px] ml-10" style={{ backgroundColor: 'rgba(217,213,203,0.07)' }} />
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Next Up & Nearest Deadline */}
      <div className="space-y-2">
        {nextUp && (
          <div
            className="px-3.5 py-2.5 rounded-[12px] flex items-center justify-between gap-2"
            style={{ backgroundColor: '#1B1D22', border: '1px solid rgba(217,213,203,0.08)' }}
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(217,213,203,0.42)' }}>
                Next Up
              </p>
              <p className="text-[13.5px] font-medium truncate mt-0.5" style={{ color: '#EDEAE2' }}>
                {nextUp.title}
              </p>
            </div>
            {nextUp.scheduledTime && (
              <span className="text-[13px] font-medium tabular-nums shrink-0" style={{ color: '#B99B79' }}>
                {nextUp.scheduledTime}
              </span>
            )}
          </div>
        )}

        {nearest && (
          <div className="px-1 flex items-center justify-between gap-2 text-[12px]">
            <span className="truncate" style={{ color: 'rgba(217,213,203,0.52)' }}>
              {nearest.title}
            </span>
            <span className="tabular-nums shrink-0" style={{ color: '#A7B6D2' }}>
              {nearest.days < 0 ? `Trễ ${Math.abs(nearest.days)}d` : nearest.days === 0 ? 'Hôm nay' : `${nearest.days}d`}
            </span>
          </div>
        )}
      </div>

      <p className="text-[10px] uppercase tracking-[0.16em] text-center pt-1 tabular-nums" style={{ color: 'rgba(217,213,203,0.32)' }}>
        {remaining} open intentions · Private space
      </p>
    </div>
  );
}
