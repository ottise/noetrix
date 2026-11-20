import { doc, setDoc } from 'firebase/firestore';
import { db, getLocalDateStr, diffDaysFromToday } from '../db/database';
import { initFirebaseIfConfigured } from './firebase';
import { scheduleSourceCodeSave } from './sourceStore';
import type { WidgetSnapshot } from '../types';

export const WIDGET_SNAPSHOT_STORAGE_KEY = 'lifeos_widget_snapshot_v1';
export const AUTO_LOCKSCREEN_KEY = 'noetrix_auto_lockscreen_notify_v1';

export function isAutoLockScreenEnabled(): boolean {
  try {
    return localStorage.getItem(AUTO_LOCKSCREEN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAutoLockScreenEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_LOCKSCREEN_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Updates the PWA Home Screen App Icon Badge (iOS 16.4+ & Desktop PWA)
 * and updates the single in-place Lock Screen notification (tag: 'noetrix-focus-live')
 * so the user sees Today's Focus on their Lock Screen automatically without Scriptable!
 */
export async function syncAutomaticLockScreenAndBadge(
  snapshot: WidgetSnapshot,
  forceNotify = false
): Promise<{ badgeSet: boolean; notificationSent: boolean }> {
  let badgeSet = false;
  let notificationSent = false;

  const remainingFocus = Math.max(0, snapshot.focusTotal - snapshot.focusCompleted);

  // 1. Update App Icon Badge automatically
  try {
    const nav = navigator as Navigator & {
      setAppBadge?: (contents?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (typeof nav.setAppBadge === 'function') {
      if (remainingFocus > 0) {
        await nav.setAppBadge(remainingFocus);
      } else if (typeof nav.clearAppBadge === 'function') {
        await nav.clearAppBadge();
      }
      badgeSet = true;
    }
  } catch {
    // ignore if browser doesn't support Badging API
  }

  // 2. Update persistent Lock Screen Notification in-place if enabled or forced
  if (!forceNotify && !isAutoLockScreenEnabled()) {
    return { badgeSet, notificationSent };
  }

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return { badgeSet, notificationSent };
  }

  const title = `NOETRIX · Today’s Focus (0${snapshot.focusCompleted}/0${snapshot.focusTotal})`;
  const taskLines =
    snapshot.focusTasks.length > 0
      ? snapshot.focusTasks
          .map((t) => `${t.done ? '●' : '○'} ${t.title}`)
          .join('\n')
      : 'Chưa chọn 3 việc trọng tâm cho hôm nay.';

  const footerLine = snapshot.nextUp
    ? `\nTiếp theo: ${snapshot.nextUp.time ? `${snapshot.nextUp.time} · ` : ''}${snapshot.nextUp.title}`
    : snapshot.nearestDeadline
    ? `\nHạn gần nhất: ${snapshot.nearestDeadline.title} (${snapshot.nearestDeadline.daysLeft}d)`
    : '';

  const body = `${taskLines}${footerLine}`;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, {
          body,
          tag: 'noetrix-focus-live',
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
          silent: true,
        });
        notificationSent = true;
        return { badgeSet, notificationSent };
      }
    }

    // Fallback to standard Notification API
    new Notification(title, {
      body,
      tag: 'noetrix-focus-live',
      icon: '/icons/icon-192.svg',
      silent: true,
    });
    notificationSent = true;
  } catch (err) {
    console.warn('Lock screen notification skipped:', err);
  }

  return { badgeSet, notificationSent };
}

/**
 * Generates a compact, native-widget-ready snapshot of Today's Focus, Next Up,
 * nearest deadline, and Life Balance.
 * Also automatically updates the Lock Screen notification & Home Screen Icon Badge when enabled!
 */
export async function buildAndPersistWidgetSnapshot(): Promise<WidgetSnapshot> {
  const today = getLocalDateStr();
  const [tasks, dailyLog, lectures, psychPosts, hobbies] = await Promise.all([
    db.tasks.toArray(),
    db.dailyLogs.get(today),
    db.workflowLectures.toArray(),
    db.psychologyPosts.toArray(),
    db.hobbyLogs.where('date').equals(today).toArray(),
  ]);

  const focusTasks = tasks
    .filter((t) => t.isTodayFocus)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 3)
    .map((t) => ({
      id: t.id,
      title: t.title,
      done: t.status === 'completed',
      category: t.category,
    }));

  const focusCompleted = focusTasks.filter((t) => t.done).length;
  const remainingCount = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'paused'
  ).length;

  // Find next scheduled activity for today (preferring future HH:mm)
  const nowHm = `${String(new Date().getHours()).padStart(2, '0')}:${String(
    new Date().getMinutes()
  ).padStart(2, '0')}`;

  const scheduledToday = tasks
    .filter(
      (t) =>
        t.status !== 'completed' &&
        t.status !== 'paused' &&
        (t.scheduledTime || t.scheduledDate === today)
    )
    .sort((a, b) => (a.scheduledTime || '23:59').localeCompare(b.scheduledTime || '23:59'));

  const upcomingTask =
    scheduledToday.find((t) => t.scheduledTime && t.scheduledTime >= nowHm) ||
    scheduledToday.find((t) => Boolean(t.scheduledTime)) ||
    tasks.find((t) => !t.isTodayFocus && t.status !== 'completed' && t.status !== 'paused') ||
    null;

  // Nearest deadline across Tasks, Workflow Lectures, Psychology Posts
  const deadlinePool: { title: string; dueDate: string; daysLeft: number }[] = [];
  for (const t of tasks) {
    if (t.status !== 'completed' && t.deadline) {
      deadlinePool.push({
        title: t.title,
        dueDate: t.deadline,
        daysLeft: diffDaysFromToday(t.deadline),
      });
    }
  }
  for (const l of lectures) {
    if (l.status !== 'published' && l.dueDate) {
      deadlinePool.push({
        title: `Workflow: ${l.title}`,
        dueDate: l.dueDate,
        daysLeft: diffDaysFromToday(l.dueDate),
      });
    }
  }
  for (const p of psychPosts) {
    if (p.status !== 'published' && p.dueDate) {
      deadlinePool.push({
        title: `IG Tâm lý: ${p.title}`,
        dueDate: p.dueDate,
        daysLeft: diffDaysFromToday(p.dueDate),
      });
    }
  }
  deadlinePool.sort((a, b) => a.daysLeft - b.daysLeft);

  const dateLabel = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  }).format(new Date());

  const snapshot: WidgetSnapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    dateLabel,
    focusTasks,
    focusCompleted,
    focusTotal: focusTasks.length,
    remainingCount,
    nextUp: upcomingTask
      ? {
          title: upcomingTask.title,
          category: upcomingTask.category,
          time: upcomingTask.scheduledTime,
          durationMinutes: upcomingTask.durationMinutes,
        }
      : null,
    nearestDeadline: deadlinePool[0] || null,
    lifeBalance: {
      learn: Boolean(dailyLog?.codeDone || dailyLog?.englishDone),
      read: Boolean(dailyLog?.readDone),
      move: Boolean(dailyLog?.gymDone || hobbies.some((h) => h.type === 'swimming')),
      create: Boolean(dailyLog?.createDone || hobbies.some((h) => h.type === 'drawing')),
    },
  };

  try {
    localStorage.setItem(WIDGET_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota issues
  }

  // Trigger automatic Lock Screen notification & App Icon Badge update
  syncAutomaticLockScreenAndBadge(snapshot, false).catch(() => {});

  // Automatically persist all data directly to source code (src/data/noetrix-store.json)
  scheduleSourceCodeSave();

  // Also mirror to Firestore if authenticated
  try {
    const { auth, firestore } = initFirebaseIfConfigured();
    if (auth?.currentUser && firestore) {
      await setDoc(doc(firestore, 'users', auth.currentUser.uid, 'system', 'widgetSnapshot'), snapshot);
    }
  } catch {
    // Offline-first
  }

  return snapshot;
}

/**
 * 1-Tap Native iOS Calendar (.ics) export so Today's Focus tasks automatically appear
 * on the built-in iPhone Lock Screen & Home Screen Calendar Widget (zero 3rd-party app needed!)
 */
export function exportTodayFocusToNativeIOSCalendar(snapshot: WidgetSnapshot): void {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateCompact = `${yyyy}${mm}${dd}`;

  const events: string[] = [];

  snapshot.focusTasks.forEach((t, idx) => {
    const startHour = String(9 + idx * 2).padStart(2, '0');
    const endHour = String(10 + idx * 2).padStart(2, '0');
    const statusPrefix = t.done ? '[ĐÃ XONG] ' : '[FOCUS] ';
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:noetrix-focus-${dateCompact}-${t.id}@noetrix.local`,
        `DTSTAMP:${dateCompact}T000000Z`,
        `DTSTART:${dateCompact}T${startHour}0000`,
        `DTEND:${dateCompact}T${endHour}0000`,
        `SUMMARY:${statusPrefix}${t.title}`,
        `DESCRIPTION:NOETRIX Today's Focus (${snapshot.focusCompleted}/${snapshot.focusTotal})`,
        'END:VEVENT',
      ].join('\r\n')
    );
  });

  if (snapshot.nextUp?.time) {
    const [h, m] = snapshot.nextUp.time.split(':');
    const hh = String(Number(h) || 17).padStart(2, '0');
    const min = String(Number(m) || 30).padStart(2, '0');
    const endH = String(Math.min(23, (Number(h) || 17) + 1)).padStart(2, '0');
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:noetrix-nextup-${dateCompact}@noetrix.local`,
        `DTSTAMP:${dateCompact}T000000Z`,
        `DTSTART:${dateCompact}T${hh}${min}00`,
        `DTEND:${dateCompact}T${endH}${min}00`,
        `SUMMARY:[NEXT UP] ${snapshot.nextUp.title}`,
        'DESCRIPTION:NOETRIX Next Up Schedule',
        'END:VEVENT',
      ].join('\r\n')
    );
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NOETRIX//Personal OS//VI',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `noetrix-today-${dateCompact}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Generates an iPhone Retina Lock Screen Wallpaper (1179x2556) with Today's 3 Focus tasks
 * positioned neatly below the iOS Lock Screen clock, and shares/downloads it in 1 tap.
 */
export async function generateAndShareLockScreenWallpaper(snapshot: WidgetSnapshot): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1179;
  canvas.height = 2556;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Obsidian background (#101114)
  ctx.fillStyle = '#101114';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle radial warm brass glow behind the card
  const grad = ctx.createRadialGradient(590, 1280, 50, 590, 1280, 720);
  grad.addColorStop(0, 'rgba(185, 155, 121, 0.12)');
  grad.addColorStop(1, 'rgba(16, 17, 20, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Card container positioned below iOS Lock Screen clock (y = 880..1760)
  const cardX = 84;
  const cardY = 900;
  const cardW = 1011;
  const cardH = 780;

  ctx.fillStyle = '#1B1D22';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 42);
  ctx.fill();

  ctx.strokeStyle = 'rgba(217, 213, 203, 0.14)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Header: NOETRIX · TODAY'S FOCUS
  ctx.fillStyle = '#B99B79';
  ctx.font = '500 28px "SF Mono", monospace';
  ctx.fillText('NOETRIX · TODAY’S FOCUS', cardX + 64, cardY + 86);

  ctx.fillStyle = '#9BAA98';
  ctx.textAlign = 'right';
  ctx.fillText(`0${snapshot.focusCompleted} / 0${snapshot.focusTotal}`, cardX + cardW - 64, cardY + 86);
  ctx.textAlign = 'left';

  // Divider
  ctx.fillStyle = 'rgba(217, 213, 203, 0.1)';
  ctx.fillRect(cardX + 64, cardY + 122, cardW - 128, 2);

  // 3 Focus tasks
  const tasks = snapshot.focusTasks.slice(0, 3);
  if (tasks.length === 0) {
    ctx.fillStyle = '#D9D5CB';
    ctx.font = '400 38px -apple-system, "SF Pro Text", sans-serif';
    ctx.fillText('A clear desk. Choose 3 focus intentions.', cardX + 64, cardY + 230);
  } else {
    tasks.forEach((t, i) => {
      const y = cardY + 215 + i * 135;
      ctx.fillStyle = t.done ? '#9BAA98' : '#B99B79';
      ctx.font = '600 40px -apple-system, "SF Pro Text", sans-serif';
      ctx.fillText(t.done ? '●' : '○', cardX + 64, y);

      ctx.fillStyle = t.done ? 'rgba(217, 213, 203, 0.45)' : '#EDEAE2';
      ctx.font = '500 38px -apple-system, "SF Pro Display", sans-serif';
      const maxChars = 36;
      const cleanTitle = t.title.length > maxChars ? `${t.title.slice(0, maxChars - 1)}…` : t.title;
      ctx.fillText(cleanTitle, cardX + 124, y);
    });
  }

  // Footer inside card: Next Up / Motto
  ctx.fillStyle = 'rgba(217, 213, 203, 0.1)';
  ctx.fillRect(cardX + 64, cardY + cardH - 135, cardW - 128, 2);

  ctx.fillStyle = '#A7B6D2';
  ctx.font = '400 30px "SF Mono", monospace';
  const nextLabel = snapshot.nextUp
    ? `NEXT UP · ${snapshot.nextUp.time ? `${snapshot.nextUp.time} · ` : ''}${snapshot.nextUp.title}`
    : 'Curious by nature. Mischievous by design. Pure in pursuit.';
  ctx.fillText(nextLabel.slice(0, 48), cardX + 64, cardY + cardH - 68);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!blob) return;

  const file = new File([blob], 'noetrix-lockscreen.png', { type: 'image/png' });
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };

  if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        title: 'NOETRIX Lock Screen',
        files: [file],
      });
      return;
    } catch {
      // fallback to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'noetrix-lockscreen.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function getStorageQuotaInfo(): Promise<{
  supported: boolean;
  usageMB: number;
  quotaMB: number;
  percent: number;
  warning: boolean;
}> {
  try {
    if (navigator.storage && typeof navigator.storage.estimate === 'function') {
      const est = await navigator.storage.estimate();
      const usage = est.usage || 0;
      const quota = est.quota || 1;
      const usageMB = Math.round((usage / (1024 * 1024)) * 10) / 10;
      const quotaMB = Math.round(quota / (1024 * 1024));
      const percent = Math.min(100, Math.round((usage / quota) * 100));
      return {
        supported: true,
        usageMB,
        quotaMB,
        percent,
        warning: percent >= 75,
      };
    }
  } catch {
    // Fallback
  }
  return { supported: false, usageMB: 0, quotaMB: 0, percent: 0, warning: false };
}

export function generateIOSWidgetScript(snapshot: WidgetSnapshot, appUrl: string): string {
  const embedded = JSON.stringify(snapshot, null, 2);
  return `// NOETRIX — Optional Scriptable Widget
const APP_URL = ${JSON.stringify(appUrl)};
const SNAPSHOT = ${embedded};
const widget = new ListWidget();
widget.url = APP_URL;
widget.backgroundColor = new Color("#101114");
const title = widget.addText("NOETRIX · " + SNAPSHOT.focusCompleted + "/" + SNAPSHOT.focusTotal);
title.font = Font.boldSystemFont(14);
title.textColor = new Color("#EDEAE2");
Script.setWidget(widget);
Script.complete();`;
}
