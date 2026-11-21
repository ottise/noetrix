import React, { useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import type { ProfileState } from '../types';
import { db } from '../db/database';
import { calculateLevel } from '../lib/gamification';
import {
  getSavedFirebaseConfig,
  saveLocalFirebaseConfig,
  signInWithGoogle,
  signOutFirebase,
} from '../lib/firebase';
import {
  syncWithFirebaseCloud,
  exportFullBackupJson,
  importFullBackupJson,
} from '../lib/sync';
import {
  getCloudinaryConfig,
  saveCloudinaryConfig,
  isCloudinaryConfigured,
} from '../lib/media';
import { getStorageQuotaInfo } from '../lib/ambient';
import { useLanguage } from '../lib/i18n';
import {
  Modal,
  ProgressBar,
  IOSListGroup,
  IOSListRow,
  IOSSwitch,
  SegmentedControl,
  useToast,
} from './ui/Primitives';

export function SettingsModal({
  open,
  onClose,
  profile,
  user,
  syncing,
  onSyncNow,
}: {
  open: boolean;
  onClose: () => void;
  profile: ProfileState | undefined;
  user: User | null;
  syncing: boolean;
  onSyncNow: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const { lang, setLang, t } = useLanguage();
  const importRef = useRef<HTMLInputElement>(null);
  const [appName, setAppName] = useState(profile?.appName || 'LifeOS');
  const [motto, setMotto] = useState(profile?.motto || '');
  const [showFbForm, setShowFbForm] = useState(false);
  const [quota, setQuota] = useState<{
    supported: boolean;
    usageMB: number;
    quotaMB: number;
    percent: number;
    warning: boolean;
  } | null>(null);

  React.useEffect(() => {
    if (open) {
      getStorageQuotaInfo().then(setQuota);
    }
  }, [open]);

  const existingCfg = getSavedFirebaseConfig();
  const [fbJson, setFbJson] = useState(
    existingCfg ? JSON.stringify(existingCfg, null, 2) : ''
  );

  const initialCloudinary = getCloudinaryConfig();
  const [cloudName, setCloudName] = useState(initialCloudinary.cloudName);
  const [uploadPreset, setUploadPreset] = useState(initialCloudinary.uploadPreset);
  const [cloudFolder, setCloudFolder] = useState(initialCloudinary.folder || 'noetrix');
  const [cloudinaryActive, setCloudinaryActive] = useState(isCloudinaryConfigured());

  React.useEffect(() => {
    if (open) {
      const cfg = getCloudinaryConfig();
      setCloudName(cfg.cloudName);
      setUploadPreset(cfg.uploadPreset);
      setCloudFolder(cfg.folder || 'noetrix');
      setCloudinaryActive(Boolean(cfg.cloudName && cfg.uploadPreset));
    }
  }, [open]);

  const handleSaveCloudinary = () => {
    saveCloudinaryConfig({
      cloudName,
      uploadPreset,
      folder: cloudFolder || 'noetrix',
    });
    const active = isCloudinaryConfigured();
    setCloudinaryActive(active);
    if (active) {
      showToast(
        t(
          'Cloudinary config saved — Photos will auto-upload to Cloudinary!',
          'Đã lưu cấu hình Cloudinary — Ảnh chụp sẽ tự động đẩy lên Cloudinary!'
        )
      );
    } else {
      showToast(
        t(
          'Cleared Cloudinary config (Saving images locally in IndexedDB)',
          'Đã xóa cấu hình Cloudinary (Lưu ảnh cục bộ IndexedDB)'
        ),
        'info'
      );
    }
  };

  React.useEffect(() => {
    if (profile) {
      setAppName(profile.appName);
      setMotto(profile.motto);
    }
  }, [profile]);

  if (!profile) return null;
  const levelInfo = calculateLevel(profile.xp);

  const saveProfileInfo = async () => {
    await db.profile.update('main', {
      appName: appName.trim() || 'LifeOS',
      motto: motto.trim(),
      updatedAt: Date.now(),
    });
    showToast(t('Personal settings saved', 'Đã lưu thiết lập cá nhân'));
  };

  const toggleTheme = async () => {
    const next = profile.theme === 'dark' ? 'light' : 'dark';
    await db.profile.update('main', { theme: next, updatedAt: Date.now() });
  };

  const toggleSound = async () => {
    await db.profile.update('main', {
      soundEnabled: !profile.soundEnabled,
      updatedAt: Date.now(),
    });
  };

  const handleSaveFbConfig = () => {
    try {
      const parsed = JSON.parse(fbJson);
      if (!parsed.apiKey || !parsed.projectId) {
        showToast(
          t('Missing apiKey or projectId in Firebase JSON config.', 'Thiếu apiKey hoặc projectId trong JSON cấu hình Firebase.'),
          'error'
        );
        return;
      }
      saveLocalFirebaseConfig(parsed);
      showToast(t('Firebase config saved · Reloading...', 'Đã lưu Firebase config · Đang tải lại...'), 'info');
      setTimeout(() => window.location.reload(), 700);
    } catch {
      showToast(t('Invalid JSON format.', 'Định dạng JSON không hợp lệ.'), 'error');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast(t('Signed in · Syncing...', 'Đăng nhập thành công · Đang đồng bộ...'));
      await syncWithFirebaseCloud();
      showToast(t('Synced with Firebase', 'Đã đồng bộ với Firebase'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('Firebase sign-in error', 'Lỗi đăng nhập Firebase'), 'error');
    }
  };

  const handleExport = async () => {
    try {
      await exportFullBackupJson(true);
      await db.profile.update('main', { lastBackupAt: Date.now(), updatedAt: Date.now() });
      showToast(t('Downloaded Backup file (.json)', 'Đã tải xuống file Backup (.json)'));
    } catch (err) {
      console.error(err);
      showToast(t('Failed to export backup', 'Lỗi khi xuất backup'), 'error');
    }
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const res = await importFullBackupJson(file);
      showToast(
        t(
          `Restored ${res.restoredRecords} records & ${res.restoredMedia} media items`,
          `Đã khôi phục ${res.restoredRecords} bản ghi & ${res.restoredMedia} media`
        )
      );
    } catch (err) {
      console.error(err);
      showToast(t('Invalid backup file.', 'File backup không hợp lệ.'), 'error');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('Settings', 'Cài đặt')}>
      <div className="space-y-6">
        {/* Native iOS Inset Grouped Preferences + Language Switcher */}
        <IOSListGroup header={t('Language, Appearance & Feedback', 'Ngôn ngữ, Giao diện & Phản hồi')}>
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-medium">{t('Interface Language', 'Ngôn ngữ giao diện')}</p>
              <p className="text-[12px] text-[var(--ios-label-secondary)]">
                {t('Switch the entire web between English and Vietnamese', 'Chuyển đổi toàn bộ web giữa Tiếng Anh và Tiếng Việt')}
              </p>
            </div>
            <div className="w-40 shrink-0">
              <SegmentedControl
                value={lang}
                onChange={setLang}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'vi', label: 'Tiếng Việt' },
                ]}
              />
            </div>
          </div>
          <IOSListRow
            title={t('Dark Mode (OLED Dark)', 'Chế độ Tối (OLED Dark)')}
            subtitle={t('Editorial noir dark surface', 'Nền tối chuẩn iOS tiết kiệm pin')}
            trailing={
              <IOSSwitch
                checked={profile.theme === 'dark'}
                onChange={toggleTheme}
                ariaLabel={t('Toggle dark mode', 'Bật chế độ tối')}
              />
            }
          />
          <IOSListRow
            title={t('Wheel & Timer Chime', 'Âm thanh Vòng Quay & Hẹn giờ')}
            subtitle={t('Play subtle chime when finished', 'Phát âm báo nhẹ khi kết thúc')}
            trailing={
              <IOSSwitch
                checked={profile.soundEnabled}
                onChange={toggleSound}
                ariaLabel={t('Toggle sound', 'Bật âm thanh')}
              />
            }
          />
        </IOSListGroup>

        {/* Personal Identity */}
        <IOSListGroup header={t('Personalization', 'Cá nhân hóa')}>
          <div className="p-4 space-y-2.5">
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder={t('App name (e.g. NOETRIX)', 'Tên ứng dụng (vd: NOETRIX)')}
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-elevated text-[15px]"
            />
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder={t('Daily morning motto...', 'Câu nhắc bản thân mỗi sáng...')}
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-elevated text-[14px]"
            />
            <button
              type="button"
              onClick={saveProfileInfo}
              className="w-full py-2.5 rounded-[12px] text-white text-[14px] font-semibold ios-pressable cursor-pointer"
              style={{ backgroundColor: 'var(--ios-blue)' }}
            >
              {t('Save changes', 'Lưu thay đổi')}
            </button>
          </div>
        </IOSListGroup>

        {/* Cloudinary Image Hosting */}
        <IOSListGroup
          header={t('Cloudinary Image Storage (Swimming, Art & Book pages)', 'Lưu trữ Ảnh Cloudinary (Swimming, Art & Trang sách)')}
          footer={t(
            'When Cloud Name & Unsigned Upload Preset are provided, photos from swimming, art, and book pages auto-upload to Cloudinary alongside local IndexedDB copies.',
            'Khi điền Cloud Name & Unsigned Upload Preset, mọi ảnh chụp buổi bơi, tranh vẽ và trang sách sẽ tự động lưu lên Cloudinary kèm bản sao cục bộ.'
          )}
        >
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium">{t('Cloudinary Status', 'Trạng thái Cloudinary')}</span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: cloudinaryActive
                    ? 'color-mix(in srgb, var(--ios-green) 16%, transparent)'
                    : 'var(--ios-fill-tertiary)',
                  color: cloudinaryActive ? 'var(--ios-green)' : 'var(--ios-label-secondary)',
                }}
              >
                {cloudinaryActive
                  ? t('☁ Connected to Cloudinary', '☁ Đã kết nối Cloudinary')
                  : t('Not configured (Local only)', 'Chưa cấu hình (Lưu cục bộ)')}
              </span>
            </div>
            <input
              type="text"
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              placeholder={t('Cloudinary Cloud Name (e.g. dxyz12345)', 'Cloudinary Cloud Name (vd: dxyz12345)')}
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-elevated text-[14px]"
            />
            <input
              type="text"
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              placeholder={t('Unsigned Upload Preset (e.g. noetrix_unsigned)', 'Unsigned Upload Preset (vd: noetrix_unsigned)')}
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-elevated text-[14px]"
            />
            <input
              type="text"
              value={cloudFolder}
              onChange={(e) => setCloudFolder(e.target.value)}
              placeholder={t('Cloudinary folder (default: noetrix)', 'Thư mục Cloudinary (mặc định: noetrix)')}
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-elevated text-[13px]"
            />
            <button
              type="button"
              onClick={handleSaveCloudinary}
              className="w-full py-2.5 rounded-[12px] text-white text-[14px] font-semibold ios-pressable cursor-pointer"
              style={{ backgroundColor: 'var(--ios-blue)' }}
            >
              {t('Save Cloudinary Config', 'Lưu cấu hình Cloudinary')}
            </button>
          </div>
        </IOSListGroup>

        {/* Firebase Sync */}
        <IOSListGroup
          header={t('Firebase Cloud Sync', 'Đồng bộ Firebase Cloud')}
          footer={t(
            'Data is saved locally first (Offline-first). When Firebase is connected, photos, voice memos, and notes sync 2-way across devices.',
            'Dữ liệu luôn được lưu trước tại máy (Offline-first). Khi kết nối Firebase, ảnh, ghi âm và ghi chú đồng bộ 2 chiều giữa iPhone & PC.'
          )}
        >
          {existingCfg ? (
            user ? (
              <>
                <IOSListRow
                  title={user.email || t('Signed in', 'Đã đăng nhập')}
                  subtitle={`Project: ${existingCfg.projectId}`}
                  trailing={
                    <button
                      type="button"
                      onClick={() => signOutFirebase().then(() => showToast(t('Signed out', 'Đã đăng xuất'), 'info'))}
                      className="text-[13px] font-semibold cursor-pointer"
                      style={{ color: 'var(--ios-red)' }}
                    >
                      {t('Sign out', 'Đăng xuất')}
                    </button>
                  }
                />
                <IOSListRow
                  title={syncing ? t('Syncing 2-way...', 'Đang đồng bộ 2 chiều...') : t('Sync now with Cloud', 'Đồng bộ ngay với Cloud')}
                  onClick={syncing ? undefined : onSyncNow}
                  disclosure={!syncing}
                />
              </>
            ) : (
              <IOSListRow
                title={t('Sign in with Google to enable sync', 'Đăng nhập Google để bật đồng bộ')}
                subtitle={`Project: ${existingCfg.projectId}`}
                onClick={handleGoogleSignIn}
                disclosure
              />
            )
          ) : (
            <div className="p-4 text-[13px] text-[var(--ios-label-secondary)] leading-relaxed">
              {t(
                'Running in Offline Local mode. Fill .env.local or paste Firebase Config below to enable multi-device sync.',
                'Đang chạy chế độ Offline Local. Điền .env.local hoặc dán Firebase Config bên dưới để bật đồng bộ đa thiết bị.'
              )}
            </div>
          )}

          <IOSListRow
            title={
              showFbForm
                ? t('Hide Firebase JSON config', 'Ẩn cấu hình Firebase JSON')
                : t('Configure Firebase JSON directly', 'Cấu hình Firebase JSON trực tiếp')
            }
            onClick={() => setShowFbForm((s) => !s)}
            disclosure
          />

          {showFbForm && (
            <div className="p-4 space-y-2.5">
              <textarea
                rows={6}
                value={fbJson}
                onChange={(e) => setFbJson(e.target.value)}
                placeholder={'{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "...",\n  "appId": "..."\n}'}
                className="w-full p-3 rounded-[10px] ios-elevated text-xs font-mono"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveFbConfig}
                  className="px-4 py-2 rounded-[10px] text-white text-xs font-semibold ios-pressable cursor-pointer"
                  style={{ backgroundColor: 'var(--ios-blue)' }}
                >
                  {t('Save Config', 'Lưu Config')}
                </button>
                {existingCfg && (
                  <button
                    type="button"
                    onClick={() => {
                      saveLocalFirebaseConfig(null);
                      window.location.reload();
                    }}
                    className="px-4 py-2 rounded-[10px] text-xs font-semibold cursor-pointer"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--ios-red) 15%, transparent)',
                      color: 'var(--ios-red)',
                    }}
                  >
                    {t('Delete Config', 'Xóa Config')}
                  </button>
                )}
              </div>
            </div>
          )}
        </IOSListGroup>

        {/* Full Data Ownership + Storage Quota Monitor */}
        <IOSListGroup
          header={t('Data Protection & Backup', 'Bảo vệ dữ liệu & Sao lưu')}
          footer={t(
            'Data lives locally in IndexedDB (Local-first). Export periodic weekly backups or connect Firebase Cloud.',
            'Dữ liệu nằm tại IndexedDB trên thiết bị (Local-first). Nên xuất Backup định kỳ mỗi tuần hoặc kết nối Firebase Cloud.'
          )}
        >
          {quota?.supported && (
            <div className="px-4 py-3.5 space-y-2">
              <div className="flex items-center justify-between text-[13px] tabular-nums">
                <span className="font-medium">{t('Local storage usage', 'Dung lượng lưu trữ nội bộ')}</span>
                <span
                  style={{ color: quota.warning ? 'var(--ios-red)' : 'var(--ios-label-secondary)' }}
                >
                  {quota.usageMB} MB / {quota.quotaMB.toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN')} MB ({quota.percent}%)
                </span>
              </div>
              <ProgressBar value={quota.percent} max={100} />
              {quota.warning && (
                <p className="text-[12px]" style={{ color: 'var(--ios-red)' }}>
                  {t(
                    'Warning: browser storage is nearly full. Please export a backup now.',
                    'Cảnh báo: dung lượng trình duyệt sắp đầy. Hãy xuất Backup ngay.'
                  )}
                </p>
              )}
            </div>
          )}
          <IOSListRow
            title={t('Export full Backup (.json)', 'Xuất toàn bộ dữ liệu Backup (.json)')}
            subtitle={
              profile.lastBackupAt
                ? `${t('Last backup:', 'Lần sao lưu gần nhất:')} ${new Date(profile.lastBackupAt).toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN')}`
                : t('Never exported — recommended to back up now', 'Chưa từng xuất backup — nên sao lưu ngay')
            }
            onClick={handleExport}
            disclosure
          />
          <IOSListRow
            title={t('Restore from Backup file', 'Khôi phục từ file Backup')}
            onClick={() => importRef.current?.click()}
            disclosure
          />
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0])}
          />
        </IOSListGroup>
      </div>
    </Modal>
  );
}
