import { db, getLocalDateStr, addDaysStr } from '../db/database';
import type { DailyLog } from '../types';

export interface LevelInfo {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

const LEVEL_TITLES = [
  'Khởi động',
  'Người Xây Nền',
  'Kỷ Luật Trẻ',
  'Thợ Rèn Tư Duy',
  'Kiến Trúc Sư Hệ Thống',
  'Bậc Thầy Tập Trung',
  'Chiến Lược Gia',
  'Kẻ Sáng Tạo Bền Bỉ',
  'Chuyên Gia Độc Lập',
  'Hệ Điều Hành Sống',
];

export function calculateLevel(totalXp: number): LevelInfo {
  const xpPerLevel = 250;
  const safeXp = Math.max(0, totalXp);
  const level = Math.floor(safeXp / xpPerLevel) + 1;
  const currentLevelXp = safeXp % xpPerLevel;
  const nextLevelXp = xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));
  const title = LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 2))];
  return { level, title, currentLevelXp, nextLevelXp, progressPercent };
}

export async function awardXp(amount: number): Promise<void> {
  if (amount === 0) return;
  const profile = await db.profile.get('main');
  if (!profile) return;
  const nextXp = Math.max(0, profile.xp + amount);
  await db.profile.update('main', {
    xp: nextXp,
    updatedAt: Date.now(),
  });
}

export async function incrementTiktokRescue(xpBonus = 25): Promise<void> {
  const profile = await db.profile.get('main');
  if (!profile) return;
  await db.profile.update('main', {
    tiktokRescues: (profile.tiktokRescues || 0) + 1,
    xp: profile.xp + xpBonus,
    updatedAt: Date.now(),
  });
}

/**
 * Flexible streak: counts consecutive days ending today or yesterday,
 * tolerating up to 1 rest/grace day in the past 7 days so a busy day doesn't crush motivation!
 */
export function computeFlexibleStreak(
  logs: DailyLog[],
  predicate: (log: DailyLog) => boolean
): { current: number; usedGraceDay: boolean } {
  const logMap = new Map<string, DailyLog>();
  for (const log of logs) logMap.set(log.date, log);

  const today = getLocalDateStr();
  let cursor = today;
  const todayLog = logMap.get(today);
  // If today isn't logged yet, start checking from yesterday
  if (!todayLog || !predicate(todayLog)) {
    cursor = addDaysStr(today, -1);
  }

  let streak = 0;
  let missesAllowed = 1;
  let usedGraceDay = false;

  for (let i = 0; i < 365; i++) {
    const entry = logMap.get(cursor);
    if (entry && predicate(entry)) {
      streak++;
      cursor = addDaysStr(cursor, -1);
    } else if (missesAllowed > 0 && streak > 0) {
      // Check if the day before the gap was completed -> treat as grace day
      const beforeGap = logMap.get(addDaysStr(cursor, -1));
      if (beforeGap && predicate(beforeGap)) {
        missesAllowed--;
        usedGraceDay = true;
        cursor = addDaysStr(cursor, -1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return { current: streak, usedGraceDay };
}
