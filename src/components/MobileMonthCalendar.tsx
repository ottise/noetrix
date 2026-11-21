import React from 'react';
import { triggerHaptic } from '../lib/haptics';

export interface MobileCalendarCell {
  dateStr: string;
  inMonth: boolean;
  dayNum: number;
}

export interface MobileCalendarDayMeta {
  hasItems: boolean;
  itemCount?: number;
  allDone?: boolean;
  hasIncompleteWarning?: boolean;
  accentColor?: string;
  circleContent?: React.ReactNode;
}

/**
 * Mobile Apple-minimal circular month calendar with giant month watermark behind the grid.
 * Shared across Schedule (PersonalCalendar) and Life Photo Vault (HobbiesJournal) on < 768px screens.
 */
export function MobileMonthCalendar({
  year,
  month,
  gridDays,
  weekdayLabels,
  todayStr,
  selectedDate,
  onShiftMonth,
  onJumpToday,
  onSelectDate,
  onQuickAddDate,
  getDayMeta,
  onFabClick,
  fabAriaLabel,
}: {
  year: number;
  month: number;
  gridDays: MobileCalendarCell[];
  weekdayLabels: string[];
  todayStr: string;
  selectedDate: string;
  onShiftMonth: (delta: number) => void;
  onJumpToday: () => void;
  onSelectDate: (dateStr: string) => void;
  onQuickAddDate?: (dateStr: string) => void;
  getDayMeta: (dateStr: string) => MobileCalendarDayMeta;
  onFabClick?: () => void;
  fabAriaLabel?: string;
}) {
  // Trim trailing all-out-of-month week rows so the grid stays compact (4-6 weeks)
  const weeks: MobileCalendarCell[][] = [];
  for (let i = 0; i < gridDays.length; i += 7) {
    const slice = gridDays.slice(i, i + 7);
    if (slice.some((c) => c.inMonth)) {
      weeks.push(slice);
    }
  }
  const visibleCells = weeks.flat();
  const monthNumber = month + 1;

  return (
    <div
      className="relative rounded-2xl px-2.5 pt-2.5 pb-4 overflow-hidden select-none"
      style={{
        backgroundColor: '#111317',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Subtle month/year pill to jump back to Today */}
      <div className="flex items-center justify-between px-2 pb-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onJumpToday();
          }}
          className="text-[11px] font-medium tracking-wide text-[#8f98a8] hover:text-white cursor-pointer"
        >
          {String(monthNumber).padStart(2, '0')} / {year}
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onJumpToday();
          }}
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-[#d1d5db] cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* Header bar: <  Mon  Tue  Wed  Thu  Fri  Sat  Sun  > */}
      <div className="relative flex items-center justify-between pb-3">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onShiftMonth(-1);
          }}
          aria-label="Previous month"
          className="w-7 h-7 flex items-center justify-center rounded-full text-[#7aa2d6] hover:bg-white/[0.06] active:scale-90 transition cursor-pointer shrink-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex-1 grid grid-cols-7 text-center">
          {weekdayLabels.map((wd) => (
            <span
              key={wd}
              className="text-[11px] font-medium tracking-normal text-[#9ca3af] capitalize"
            >
              {wd.charAt(0).toUpperCase() + wd.slice(1).toLowerCase()}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onShiftMonth(1);
          }}
          aria-label="Next month"
          className="w-7 h-7 flex items-center justify-center rounded-full text-[#7aa2d6] hover:bg-white/[0.06] active:scale-90 transition cursor-pointer shrink-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Main Circular Grid + Giant Month Watermark Behind */}
      <div className="relative px-1">
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        >
          <span
            className="font-bold tracking-tighter leading-none"
            style={{
              fontSize: 'clamp(132px, 38vw, 178px)',
              color: 'rgba(255, 255, 255, 0.055)',
            }}
          >
            {monthNumber}
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-7 gap-y-3 gap-x-1">
          {visibleCells.map((cell) => {
            if (!cell.inMonth) {
              return <div key={cell.dateStr} className="h-[58px]" aria-hidden="true" />;
            }

            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            const isPastOrToday = cell.dateStr <= todayStr;
            const meta = getDayMeta(cell.dateStr);
            const showPlus = !meta.hasItems && isPastOrToday;

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectDate(cell.dateStr);
                  if (!meta.hasItems && isSelected && onQuickAddDate) {
                    onQuickAddDate(cell.dateStr);
                  }
                }}
                className="flex flex-col items-center justify-start py-0.5 cursor-pointer group focus:outline-none"
              >
                <div
                  className={`relative w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all duration-150 overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-[#7aa2d6] ring-offset-2 ring-offset-[#111317] scale-105'
                      : 'group-active:scale-95'
                  }`}
                  style={{
                    backgroundColor: meta.circleContent
                      ? '#171b24'
                      : meta.hasItems
                      ? meta.allDone
                        ? 'rgba(130, 179, 138, 0.24)'
                        : meta.accentColor || 'rgba(122, 162, 214, 0.24)'
                      : isPastOrToday
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(255, 255, 255, 0.075)',
                    border: meta.circleContent
                      ? '1px solid rgba(255, 255, 255, 0.22)'
                      : meta.hasItems
                      ? `1px solid ${meta.allDone ? 'rgba(130, 179, 138, 0.65)' : 'rgba(122, 162, 214, 0.65)'}`
                      : isPastOrToday
                      ? '1px solid rgba(255, 255, 255, 0.16)'
                      : '1px solid transparent',
                  }}
                >
                  {meta.circleContent ? (
                    meta.circleContent
                  ) : meta.hasItems ? (
                    <span className="text-[12px] font-semibold text-white">
                      {meta.allDone ? '✓' : meta.itemCount && meta.itemCount > 1 ? meta.itemCount : '•'}
                    </span>
                  ) : showPlus ? (
                    <span className="text-[15px] font-light text-white/45 group-hover:text-white/80 leading-none">
                      +
                    </span>
                  ) : null}

                  {meta.hasIncompleteWarning && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#111317]" />
                  )}
                </div>

                <span
                  className={`mt-1 text-[11.5px] leading-none tabular-nums font-medium ${
                    isToday ? 'text-[#7aa2d6] font-bold' : isSelected ? 'text-white font-semibold' : 'text-[#a3acb9]'
                  }`}
                >
                  {cell.dayNum}
                </span>

                <span
                  className="mt-0.5 w-1 h-1 rounded-full transition-opacity"
                  style={{
                    backgroundColor: '#7aa2d6',
                    opacity: isToday ? 1 : 0,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating + Action Button aligned inside/bottom-right of calendar card on mobile */}
      {onFabClick && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onFabClick();
          }}
          aria-label={fabAriaLabel || 'Add new item'}
          className="absolute right-3.5 bottom-4 z-20 w-12 h-12 rounded-full flex items-center justify-center text-[#0b0d10] shadow-[0_10px_25px_rgba(122,162,214,0.35)] active:scale-90 transition cursor-pointer"
          style={{ backgroundColor: '#7aa2d6' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
}
