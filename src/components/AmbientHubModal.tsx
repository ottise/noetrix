import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  buildAndPersistWidgetSnapshot,
  isAutoLockScreenEnabled,
  setAutoLockScreenEnabled,
  syncAutomaticLockScreenAndBadge,
  exportTodayFocusToNativeIOSCalendar,
  generateAndShareLockScreenWallpaper,
} from '../lib/ambient';
import { useLanguage } from '../lib/i18n';
import type { WidgetSnapshot } from '../types';
import { Card, IOSListGroup, IOSSwitch, Modal, ProgressBar, useToast } from './ui/Primitives';
import { MiniDashboard } from '../features/ambient/MiniDashboard';

interface DocumentPiPWindow {
  document: Document;
  addEventListener: (event: string, cb: () => void) => void;
}

export function AmbientHubModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [snapshot, setSnapshot] = useState<WidgetSnapshot | null>(null);
  const [autoLockScreen, setAutoLockScreen] = useState<boolean>(() => isAutoLockScreenEnabled());

  useEffect(() => {
    if (open) {
      setAutoLockScreen(isAutoLockScreenEnabled());
      buildAndPersistWidgetSnapshot().then(setSnapshot);
    }
  }, [open]);

  const openAlwaysOnTopMiniWindow = async () => {
    const docPip = (
      window as unknown as {
        documentPictureInPicture?: {
          requestWindow: (opts: { width: number; height: number }) => Promise<DocumentPiPWindow>;
        };
      }
    ).documentPictureInPicture;

    if (docPip) {
      try {
        const pipWin = await docPip.requestWindow({ width: 340, height: 430 });
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            const cssText = Array.from(sheet.cssRules)
              .map((r) => r.cssText)
              .join('\n');
            const style = pipWin.document.createElement('style');
            style.textContent = cssText;
            pipWin.document.head.appendChild(style);
          } catch {
            if (sheet.href) {
              const link = pipWin.document.createElement('link');
              link.rel = 'stylesheet';
              link.href = sheet.href;
              pipWin.document.head.appendChild(link);
            }
          }
        }
        pipWin.document.documentElement.classList.add('dark');
        pipWin.document.title = 'NOETRIX · Today’s Focus';
        const mount = pipWin.document.createElement('div');
        pipWin.document.body.style.margin = '0';
        pipWin.document.body.style.backgroundColor = '#101114';
        pipWin.document.body.appendChild(mount);
        const root = createRoot(mount);
        root.render(<MiniDashboard />);
        pipWin.addEventListener('pagehide', () => root.unmount());
        showToast(t('Opened Always-on-Top mini window on Desktop', 'Đã mở cửa sổ nổi Always-on-Top trên Desktop'));
        return;
      } catch (err) {
        console.warn('Document PiP fallback:', err);
      }
    }

    const url = `${window.location.origin}${window.location.pathname}?mode=mini`;
    window.open(url, 'noetrix-mini-dashboard', 'width=350,height=470,menubar=no,toolbar=no,location=no,status=no');
    showToast(t('Opened Mini Dashboard window', 'Đã mở cửa sổ Mini Dashboard riêng'));
  };

  const handleToggleAutoLockScreen = async () => {
    const next = !autoLockScreen;
    if (next) {
      if (typeof Notification === 'undefined') {
        showToast(
          t(
            'Browser does not support Web Notification yet. On iPhone, Add to Home Screen first.',
            'Trình duyệt hiện tại chưa hỗ trợ Web Notification. Trên iPhone hãy chọn Thêm vào MH chính trước.'
          ),
          'info'
        );
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        showToast(
          t(
            'Please allow Notification permission so NOETRIX can show cards on Lock Screen.',
            'Hãy cho phép quyền Thông báo để NOETRIX tự động hiện thẻ việc trên Màn hình khóa.'
          ),
          'error'
        );
        return;
      }
    }

    setAutoLockScreen(next);
    setAutoLockScreenEnabled(next);

    if (next) {
      const snap = snapshot || (await buildAndPersistWidgetSnapshot());
      await syncAutomaticLockScreenAndBadge(snap, true);
      showToast(t('Enabled automatic Lock Screen cards for Today’s Focus!', 'Đã bật tự động hiện 3 việc hôm nay trên Màn hình khóa!'));
    } else {
      showToast(t('Disabled automatic Lock Screen updates', 'Đã tắt tự động đẩy ra Màn hình khóa'), 'info');
    }
  };

  const handlePushNowToLockScreen = async () => {
    if (typeof Notification === 'undefined') {
      showToast(
        t(
          'On iPhone, install NOETRIX to Home Screen (Share -> Add to Home Screen) to enable Lock Screen notifications.',
          'Trên iPhone, hãy cài NOETRIX ra Màn hình chính (Share -> Add to Home Screen) để bật thông báo Màn hình khóa.'
        ),
        'info'
      );
      return;
    }
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        showToast(
          t('Notification permission required to display on Lock Screen.', 'Cần cấp quyền Thông báo để hiển thị trên Màn hình khóa.'),
          'error'
        );
        return;
      }
    }
    setAutoLockScreen(true);
    setAutoLockScreenEnabled(true);
    const snap = snapshot || (await buildAndPersistWidgetSnapshot());
    const res = await syncAutomaticLockScreenAndBadge(snap, true);
    if (res.notificationSent) {
      showToast(t('Pushed Today’s Focus to Lock Screen & updated App Badge!', 'Đã đẩy thẻ Today’s Focus ra Màn hình khóa & cập nhật Badge Icon!'));
    } else {
      showToast(t('Updated Today’s Focus status', 'Đã cập nhật trạng thái Today’s Focus'));
    }
  };

  const handleSyncNativeCalendar = async () => {
    const snap = snapshot || (await buildAndPersistWidgetSnapshot());
    exportTodayFocusToNativeIOSCalendar(snap);
    showToast(t('Exported to native Calendar — auto-displays on iPhone Lock Screen Widget!', 'Đã xuất sang Lịch mặc định — Tự hiện trên Widget Lịch Màn hình khóa iPhone!'));
  };

  const handleGenerateWallpaper = async () => {
    const snap = snapshot || (await buildAndPersistWidgetSnapshot());
    await generateAndShareLockScreenWallpaper(snap);
    showToast(t('Generated today’s Lock Screen wallpaper', 'Đã tạo ảnh Màn hình khóa iPhone hôm nay'));
  };

  return (
    <Modal open={open} onClose={onClose} title={t('Ambient Task Display', 'Hiển Thị Ambient Ngoài Màn Hình')}>
      <div className="space-y-6">
        {/* A. Desktop Always-on-Top Mini Dashboard */}
        <IOSListGroup
          header={t('A. Always-on-Top Desktop Window (Windows / Mac)', 'A. Cửa sổ nổi tự động trên máy tính (Windows / Mac)')}
          footer={t(
            'Uses Document Picture-in-Picture on Chrome/Edge to float above other apps while you code.',
            'Dùng Document Picture-in-Picture trên Chrome/Edge để cửa sổ luôn nổi trên góc màn hình ngay cả khi bạn đang code.'
          )}
        >
          <div className="p-4 space-y-3">
            <p className="text-[13.5px] text-[var(--ios-label-secondary)] leading-relaxed">
              {t(
                'Open a floating mini board showing Today’s Top 3, Next Up, and nearest deadline — check off tasks without switching windows.',
                'Mở bảng mini luôn nổi trên mọi ứng dụng khác, hiện Today’s Top 3, Next Up và Deadline gần nhất — tick hoàn thành trực tiếp ngoài app.'
              )}
            </p>
            <button
              type="button"
              onClick={openAlwaysOnTopMiniWindow}
              className="w-full py-3 rounded-[12px] text-[14.5px] font-semibold ios-pressable cursor-pointer"
              style={{
                backgroundColor: 'var(--os-brass)',
                color: '#101114',
              }}
            >
              {t('Open Floating Desktop Window ↗', 'Mở cửa sổ nổi trên Desktop ↗')}
            </button>
          </div>
        </IOSListGroup>

        {/* B. Live Preview */}
        {snapshot && (
          <section className="space-y-3">
            <h3 className="ios-section-header px-1">
              {t('B. Live Preview (Home & Lock Screen)', 'B. Bản xem trước trực tiếp (Màn hình chính & Màn hình khóa)')}
            </h3>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">{t('Today’s Focus', 'Trọng tâm hôm nay')}</span>
                <span
                  className="text-[14px] font-semibold tabular-nums"
                  style={{
                    color:
                      snapshot.focusCompleted === snapshot.focusTotal && snapshot.focusTotal > 0
                        ? 'var(--os-sage)'
                        : 'var(--os-brass)',
                  }}
                >
                  {snapshot.focusCompleted}/{snapshot.focusTotal}
                </span>
              </div>

              <ProgressBar
                value={snapshot.focusCompleted}
                max={Math.max(1, snapshot.focusTotal)}
                positive={snapshot.focusCompleted === snapshot.focusTotal && snapshot.focusTotal > 0}
              />

              <div className="space-y-1.5">
                {snapshot.focusTasks.length === 0 ? (
                  <p className="text-[13px] text-[var(--ios-label-secondary)]">
                    {t('No tasks in Today’s Focus yet', 'Chưa có task trong Today’s Focus')}
                  </p>
                ) : (
                  snapshot.focusTasks.map((tk) => (
                    <div key={tk.id} className="flex items-center gap-2 text-[14px]">
                      <span style={{ color: tk.done ? 'var(--os-sage)' : 'var(--os-brass)' }}>
                        {tk.done ? '●' : '○'}
                      </span>
                      <span className={tk.done ? 'line-through text-[var(--ios-label-secondary)] truncate' : 'truncate'}>
                        {tk.title}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 ios-hairline-t flex items-center justify-between text-[12px] text-[var(--ios-label-secondary)]">
                <span className="truncate">
                  {snapshot.nextUp
                    ? `${t('Next:', 'Tiếp theo:')} ${snapshot.nextUp.time ? `${snapshot.nextUp.time} · ` : ''}${snapshot.nextUp.title}`
                    : t(`${snapshot.remainingCount} other tasks remaining`, `Còn ${snapshot.remainingCount} việc khác`)}
                </span>
              </div>
            </Card>
          </section>
        )}

        {/* C. ZERO-CODE AUTOMATIC DISPLAY ON IPHONE & LOCK SCREEN */}
        <IOSListGroup
          header={t('C. Auto Lock Screen & Badge Sync (Zero Code)', 'C. Tự động hiện ra ngoài màn hình (Không cần copy code)')}
          footer={t(
            'When enabled, adding or completing any of Today’s 3 Focus tasks auto-updates your Lock Screen card and app icon badge.',
            'Khi bật công tắc bên dưới, mỗi khi bạn thêm hoặc hoàn thành 1 việc trong 3 việc hôm nay, NOETRIX sẽ tự động cập nhật thẻ ghim ngay trên Màn hình khóa và số Badge trên icon ứng dụng.'
          )}
        >
          <div className="p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                  {t('Auto Lock Screen Card & App Badge', 'Tự động đẩy ra Màn hình khóa & Badge Icon')}
                </p>
                <p className="text-[12px]" style={{ color: 'var(--os-ivory-muted)' }}>
                  {t('Sync Lock Screen card whenever your task list changes', 'Tự cập nhật thẻ việc trên Màn hình khóa mỗi khi danh sách task thay đổi')}
                </p>
              </div>
              <IOSSwitch
                checked={autoLockScreen}
                onChange={handleToggleAutoLockScreen}
                ariaLabel={t('Auto show on Lock Screen', 'Tự động hiện trên Màn hình khóa')}
              />
            </div>

            <button
              type="button"
              onClick={handlePushNowToLockScreen}
              className="w-full py-2.5 rounded-[11px] text-[13.5px] font-semibold ios-pressable cursor-pointer"
              style={{
                backgroundColor: 'var(--os-brass)',
                color: '#101114',
              }}
            >
              {t('Push Today’s Focus to Lock Screen Now', 'Đẩy thẻ Today’s Focus ra Màn hình khóa ngay')}
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleSyncNativeCalendar}
                className="py-2.5 px-3 rounded-[10px] text-[12.5px] font-medium cursor-pointer text-center transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: 'var(--os-stone)',
                  color: 'var(--os-ivory-bright)',
                  border: '1px solid var(--os-border)',
                }}
              >
                {t('Sync to iPhone Calendar Widget', 'Đồng bộ 1 chạm vào Widget Lịch iPhone')}
              </button>

              <button
                type="button"
                onClick={handleGenerateWallpaper}
                className="py-2.5 px-3 rounded-[10px] text-[12.5px] font-medium cursor-pointer text-center transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: 'var(--os-stone)',
                  color: 'var(--os-dusty-blue)',
                  border: '1px solid var(--os-border)',
                }}
              >
                {t('Generate Lock Screen Wallpaper', 'Tạo ảnh Màn hình khóa hôm nay')}
              </button>
            </div>
          </div>
        </IOSListGroup>
      </div>
    </Modal>
  );
}
