import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, diffDaysFromToday, formatShortDate } from '../../db/database';
import { Card, IOSListGroup } from '../../components/ui/Primitives';
import { SFChevronRight } from '../../components/ui/SFSymbols';

interface CalendarEntry {
  id: string;
  channel: 'AI Workflow (3d)' | 'IG Tâm lý (7d)';
  title: string;
  date: string;
  published: boolean;
  stage: string;
  daysLeft: number;
  target: 'workflow' | 'psychology';
}

/**
 * Content Pipeline Calendar — Spec Section 7:
 * View all upcoming, in-progress, and published posts across both independent
 * publishing cycles (Weekly Psychology + Every-3-Days AI Workflow) on one timeline.
 */
export function ContentCalendar({
  onJump,
}: {
  onJump: (target: 'workflow' | 'psychology') => void;
}) {
  const lectures = useLiveQuery(() => db.workflowLectures.toArray()) || [];
  const psych = useLiveQuery(() => db.psychologyPosts.toArray()) || [];

  const entries: CalendarEntry[] = [
    ...lectures.map((l) => ({
      id: l.id,
      channel: 'AI Workflow (3d)' as const,
      title: l.title,
      date: l.publishedAt || l.dueDate,
      published: l.status === 'published',
      stage:
        l.status === 'published'
          ? 'Đã đăng'
          : `${Object.values(l.checklist).filter(Boolean).length}/5 bước`,
      daysLeft: diffDaysFromToday(l.dueDate),
      target: 'workflow' as const,
    })),
    ...psych.map((p) => ({
      id: p.id,
      channel: 'IG Tâm lý (7d)' as const,
      title: p.title,
      date: p.publishedAt || p.dueDate,
      published: p.status === 'published',
      stage:
        p.status === 'published'
          ? 'Đã đăng'
          : p.status === 'raw'
          ? 'Raw VI'
          : p.status === 'research'
          ? 'Nghiên cứu'
          : p.status === 'english'
          ? 'English'
          : 'Ý tưởng',
      daysLeft: diffDaysFromToday(p.dueDate),
      target: 'psychology' as const,
    })),
  ];

  const upcoming = entries
    .filter((e) => !e.published)
    .sort((a, b) => a.date.localeCompare(b.date));
  const published = entries
    .filter((e) => e.published)
    .sort((a, b) => b.date.localeCompare(a.date));

  const wfPublished = lectures.filter((l) => l.status === 'published').length;
  const psyPublished = psych.filter((p) => p.status === 'published').length;

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-3">
          <div className="pr-3">
            <p className="text-[12px] text-[var(--ios-label-secondary)]">Sắp đăng</p>
            <p className="text-[24px] leading-[29px] font-bold tabular-nums mt-0.5" style={{ color: 'var(--ios-blue)' }}>
              {upcoming.length}
            </p>
          </div>
          <div
            className="px-3"
            style={{
              borderLeft: '0.5px solid var(--ios-hairline)',
              borderRight: '0.5px solid var(--ios-hairline)',
            }}
          >
            <p className="text-[12px] text-[var(--ios-label-secondary)]">Workflow đã đăng</p>
            <p className="text-[24px] leading-[29px] font-bold tabular-nums mt-0.5" style={{ color: 'var(--ios-green)' }}>
              {wfPublished}
            </p>
          </div>
          <div className="pl-3">
            <p className="text-[12px] text-[var(--ios-label-secondary)]">Tâm lý đã đăng</p>
            <p className="text-[24px] leading-[29px] font-bold tabular-nums mt-0.5" style={{ color: 'var(--ios-green)' }}>
              {psyPublished}
            </p>
          </div>
        </div>
      </Card>

      <IOSListGroup header={`Lịch sắp đến hạn (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <div className="px-4 py-5 text-[14px] text-[var(--ios-label-secondary)]">
            Không có bài nào đang chờ xuất bản.
          </div>
        ) : (
          upcoming.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onJump(item.target)}
              className="w-full px-4 py-3.5 flex items-start justify-between gap-3 text-left active:bg-[var(--ios-fill)] transition-colors cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium" style={{ color: 'var(--ios-blue)' }}>
                  {item.channel} · {formatShortDate(item.date)}
                </p>
                <p className="text-[17px] leading-[22px] font-semibold mt-0.5">{item.title}</p>
                <p className="text-[13px] text-[var(--ios-label-secondary)] mt-0.5">
                  Trạng thái: {item.stage}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pt-1">
                <span
                  className="text-[14px] font-medium tabular-nums"
                  style={{ color: item.daysLeft < 0 ? 'var(--ios-red)' : 'var(--ios-blue)' }}
                >
                  {item.daysLeft < 0
                    ? `Trễ ${Math.abs(item.daysLeft)}d`
                    : item.daysLeft === 0
                    ? 'Hôm nay'
                    : `Còn ${item.daysLeft}d`}
                </span>
                <SFChevronRight className="w-4 h-4 text-[var(--ios-label-tertiary)]" />
              </div>
            </button>
          ))
        )}
      </IOSListGroup>

      <IOSListGroup header={`Kho bài đã xuất bản (${published.length})`}>
        {published.length === 0 ? (
          <div className="px-4 py-5 text-[14px] text-[var(--ios-label-secondary)]">
            Các bài đã đăng trên Instagram sẽ tự động lưu trữ theo dòng thời gian tại đây.
          </div>
        ) : (
          published.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onJump(item.target)}
              className="w-full px-4 py-3.5 flex items-start justify-between gap-3 text-left active:bg-[var(--ios-fill)] transition-colors cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-[var(--ios-label-secondary)] tabular-nums">
                  {item.channel} · Đăng {formatShortDate(item.date)}
                </p>
                <p className="text-[16px] font-semibold mt-0.5">{item.title}</p>
              </div>
              <span className="text-[13px] font-medium shrink-0" style={{ color: 'var(--ios-green)' }}>
                Đã đăng
              </span>
            </button>
          ))
        )}
      </IOSListGroup>
    </div>
  );
}
