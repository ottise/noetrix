import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getLocalDateStr } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
import type { CodePillar, DailyLog } from '../../types';
import { CheckDot, useToast } from '../../components/ui/Primitives';

const CODE_PILLARS: { id: CodePillar; label: string }[] = [
  { id: 'workflow_ai', label: 'Workflow AI' },
  { id: 'leetcode', label: 'LeetCode' },
  { id: 'java', label: 'Java Core' },
  { id: 'csharp', label: 'C# Core' },
  { id: 'web', label: 'Web Core' },
];

const GYM_SPLITS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio'];

/**
 * Room 05: Life — A Personal Journal Outside the Screen
 * Spec Section 8:
 * - No guilt-inducing percentage rings.
 * - Features "A SMALL MOMENT FROM YOUR JOURNAL" in large editorial italic serif.
 * - Calm personal journal cards for Movement (Gym) and Daily Craft (Code & English).
 */
export function HabitsWellnessView() {
  const { showToast } = useToast();
  const todayStr = getLocalDateStr();
  const allLogs = useLiveQuery(() => db.dailyLogs.toArray()) || [];

  const todayLog: DailyLog =
    allLogs.find((l) => l.date === todayStr) || {
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

  const toggleHabit = async (field: 'codeDone' | 'englishDone' | 'gymDone', xp: number, label: string) => {
    const nextVal = !todayLog[field];
    triggerHaptic(nextVal ? 'success' : 'light');
    await upsertToday({
      [field]: nextVal,
      xpEarned: Math.max(0, todayLog.xpEarned + (nextVal ? xp : -xp)),
    });
    await awardXp(nextVal ? xp : -xp);
    if (nextVal) showToast(`Logged · ${label}`);
  };

  return (
    <div className="space-y-10">
      {/* 1. A Small Moment From Your Journal (Spec Section 8) */}
      <section
        className="p-6 sm:p-8 rounded-[14px] space-y-4"
        style={{
          backgroundColor: 'var(--os-graphite)',
          border: '1px solid var(--os-border)',
        }}
      >
        <p className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
          A Small Moment From Your Journal
        </p>
        <textarea
          rows={3}
          value={todayLog.dailyNote}
          onChange={(e) => upsertToday({ dailyNote: e.target.value })}
          placeholder="“Today I managed to spend some time reading instead of scrolling.” — Write a quiet line from your day..."
          className="w-full bg-transparent font-editorial-vi text-[21px] sm:text-[24px] leading-snug resize-none placeholder:opacity-45"
          style={{ color: 'var(--os-ivory-bright)' }}
        />
      </section>

      {/* 2. Two Calm Lifestyle Chambers: Movement & Daily Craft */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Chamber A: Movement (Gym & Body) */}
        <div
          className="p-6 rounded-[14px] space-y-5 flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--os-graphite)',
            border: '1px solid var(--os-border)',
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="editorial-eyebrow">Movement</span>
              <button
                type="button"
                onClick={() => toggleHabit('gymDone', 30, 'Movement & Gym')}
                className="inline-flex items-center gap-2 text-[13px] cursor-pointer"
                style={{ color: todayLog.gymDone ? 'var(--os-sage)' : 'var(--os-ivory-muted)' }}
              >
                <CheckDot checked={todayLog.gymDone} size="sm" />
                <span>{todayLog.gymDone ? 'Completed today' : 'Mark session'}</span>
              </button>
            </div>

            <h3 className="editorial-h2">Gym & Physical Rhythm</h3>
            <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
              Chăm sóc cơ thể ngoài màn hình. Chọn nhóm cơ hoặc hình thức vận động của buổi tập hôm nay.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {GYM_SPLITS.map((sp) => {
              const active = todayLog.gymSplit === sp;
              return (
                <button
                  key={sp}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    upsertToday({ gymSplit: active ? '' : sp, gymDone: true });
                  }}
                  className="px-3 py-1.5 rounded-full text-[12.5px] cursor-pointer"
                  style={{
                    backgroundColor: active ? 'var(--os-stone)' : 'var(--os-obsidian)',
                    color: active ? 'var(--os-brass)' : 'var(--os-ivory-muted)',
                    border: active ? '1px solid rgba(185,155,121,0.4)' : '1px solid var(--os-border)',
                  }}
                >
                  {sp}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chamber B: Daily Craft & Language */}
        <div
          className="p-6 rounded-[14px] space-y-5 flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--os-graphite)',
            border: '1px solid var(--os-border)',
          }}
        >
          <div className="space-y-3">
            <span className="editorial-eyebrow">Daily Craft</span>
            <h3 className="editorial-h2">Code & Language</h3>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleHabit('codeDone', 30, 'Code Craft')}
                  className="inline-flex items-center gap-2.5 text-[14.5px] cursor-pointer"
                  style={{ color: 'var(--os-ivory-bright)' }}
                >
                  <CheckDot checked={todayLog.codeDone} size="sm" />
                  <span>Deep Coding ({todayLog.codeMinutes || 0} min)</span>
                </button>
                <div className="flex items-center gap-1.5 text-[12px]">
                  <button
                    type="button"
                    onClick={() => upsertToday({ codeMinutes: (todayLog.codeMinutes || 0) + 30, codeDone: true })}
                    className="px-2.5 py-1 rounded-full ios-fill cursor-pointer"
                    style={{ color: 'var(--os-brass)' }}
                  >
                    +30m
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {CODE_PILLARS.map((p) => {
                  const active = todayLog.codePillars.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? todayLog.codePillars.filter((x) => x !== p.id)
                          : [...todayLog.codePillars, p.id];
                        upsertToday({ codePillars: next });
                      }}
                      className="px-2.5 py-1 rounded-full text-[11.5px] cursor-pointer"
                      style={{
                        backgroundColor: active ? 'var(--os-stone)' : 'var(--os-obsidian)',
                        color: active ? 'var(--os-dusty-blue)' : 'var(--os-ivory-faint)',
                        border: '1px solid var(--os-border)',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 space-y-2" style={{ borderTop: '1px solid var(--os-border)' }}>
            <button
              type="button"
              onClick={() => toggleHabit('englishDone', 25, 'English Practice')}
              className="inline-flex items-center gap-2.5 text-[14.5px] cursor-pointer"
              style={{ color: 'var(--os-ivory-bright)' }}
            >
              <CheckDot checked={todayLog.englishDone} size="sm" />
              <span>Active English Practice</span>
            </button>
            <input
              type="text"
              value={todayLog.englishNote}
              onChange={(e) => upsertToday({ englishNote: e.target.value })}
              placeholder="Notes from today's reading or shadowing..."
              className="w-full px-3 py-2 rounded-[9px] text-[13px]"
              style={{
                backgroundColor: 'var(--os-obsidian)',
                border: '1px solid var(--os-border)',
                color: 'var(--os-ivory)',
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
