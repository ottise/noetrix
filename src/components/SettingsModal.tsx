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
import {
  Modal,
  ProgressBar,
  IOSListGroup,
  IOSListRow,
  IOSSwitch,
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
      showToast('Đã lưu cấu hình Cloudinary — Ảnh chụp sẽ tự động đẩy lên Cloudinary!');
    } else {
      showToast('Đã xóa cấu hình Cloudinary (Lưu ảnh cục bộ IndexedDB)', 'info');
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
    showToast('Đã lưu thiết lập cá nhân');
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
        showToast('Thiếu apiKey hoặc projectId trong JSON cấu hình Firebase.', 'error');
        return;
      }
      saveLocalFirebaseConfig(parsed);
      showToast('Đã lưu Firebase config · Đang tải lại...', 'info');
      setTimeout(() => window.location.reload(), 700);
    } catch {
      showToast('Định dạng JSON không hợp lệ.', 'error');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast('Đăng nhập thành công · Đang đồng bộ...');
      await syncWithFirebaseCloud();
      showToast('Đã đồng bộ với Firebase');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi đăng nhập Firebase', 'error');
    }
  };

  const handleExport = async () => {
    try {
      await exportFullBackupJson(true);
      await db.profile.update('main', { lastBackupAt: Date.now(), updatedAt: Date.now() });
      showToast('Đã tải xuống file Backup (.json)');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi xuất backup', 'error');
    }
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const res = await importFullBackupJson(file);
      showToast(`Đã khôi phục ${res.restoredRecords} bản ghi & ${res.restoredMedia} media`);
    } catch (err) {
      console.error(err);
      showToast('File backup không hợp lệ.', 'error');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cài đặt">
      <div className="space-y-6">
        {/* Progress Summary */}
        <div className="ios-card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold" style={{ color: 'var(--ios-blue)' }}>
                Cấp {levelInfo.level} · {levelInfo.title}
              </p>
              <p className="text-[24px] font-bold tracking-tight tabular-nums mt-0.5">
                {profile.xp} XP
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-[var(--ios-label-secondary)]">Thắng TikTok</p>
              <p className="text-[20px] font-bold tabular-nums" style={{ color: 'var(--ios-green)' }}>
                {profile.tiktokRescues} lần
              </p>
            </div>
          </div>
          <ProgressBar
            value={levelInfo.currentLevelXp}
            max={levelInfo.nextLevelXp}
            colorClass="bg-[#007AFF] dark:bg-[#0A84FF]"
          />
          <p className="text-[12px] text-[var(--ios-label-secondary)] tabular-nums">
            Còn {levelInfo.nextLevelXp - levelInfo.currentLevelXp} XP để lên cấp {levelInfo.level + 1}
          </p>
        </div>

        {/* Native iOS Inset Grouped Preferences */}
        <IOSListGroup header="Giao diện & Phản hồi">
          <IOSListRow
            title="Chế độ Tối (OLED Dark)"
            subtitle="Nền đen chuẩn iOS tiết kiệm pin"
            trailing={
              <IOSSwitch
                checked={profile.theme === 'dark'}
                onChange={toggleTheme}
                ariaLabel="Bật chế độ tối"
              />
            }
          />
          <IOSListRow
            title="Âm thanh Vòng Quay & Hẹn giờ"
            subtitle="Phát âm báo nhẹ khi kết thúc"
            trailing={
              <IOSSwitch
                checked={profile.soundEnabled}
                onChange={toggleSound}
                ariaLabel="Bật âm thanh"
              />
            }
          />
        </IOSListGroup>

        {/* Personal Identity */}
        <IOSListGroup header="Cá nhân hóa">
          <div className="p-4 space-y-2.5">
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Tên ứng dụng (vd: LifeOS)"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-elevated text-[15px]"
            />
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Câu nhắc bản thân mỗi sáng..."
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-elevated text-[14px]"
            />
            <button
              type="button"
              onClick={saveProfileInfo}
              className="w-full py-2.5 rounded-[12px] text-white text-[14px] font-semibold ios-pressable cursor-pointer"
              style={{ backgroundColor: 'var(--ios-blue)' }}
            >
              Lưu thay đổi
            </button>
          </div>
        </IOSListGroup>

        {/* Cloudinary Image Hosting */}
        <IOSListGroup
          header="Lưu trữ Ảnh Cloudinary (Swimming, Art & Trang sách)"
          footer="Khi điền Cloud Name & Unsigned Upload Preset (Settings -> Upload -> Upload presets -> Signing Mode: Unsigned trên Cloudinary), mọi ảnh chụp buổi bơi, tranh vẽ và trang sách sẽ tự động lưu lên Cloudinary kèm bản sao cục bộ."
        >
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium">Trạng thái Cloudinary</span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: cloudinaryActive
                    ? 'color-mix(in srgb, var(--ios-green) 16%, transparent)'
                    : 'var(--ios-fill-tertiary)',
                  color: cloudinaryActive ? 'var(--ios-green)' : 'var(--ios-label-secondary)',
                }}
              >
                {cloudinaryActive ? '☁ Đã kết nối Cloudinary' : 'Chưa cấu hình (Lưu cục bộ)'}
              </span>
            </div>
            <input
              type="text"
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              placeholder="Cloudinary Cloud Name (vd: dxyz12345)"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-elevated text-[14px]"
            />
            <input
              type="text"
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              placeholder="Unsigned Upload Preset (vd: noetrix_unsigned)"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-elevated text-[14px]"
            />
            <input
              type="text"
              value={cloudFolder}
              onChange={(e) => setCloudFolder(e.target.value)}
              placeholder="Thư mục Cloudinary (mặc định: noetrix)"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-elevated text-[13px]"
            />
            <button
              type="button"
              onClick={handleSaveCloudinary}
              className="w-full py-2.5 rounded-[12px] text-white text-[14px] font-semibold ios-pressable cursor-pointer"
              style={{ backgroundColor: 'var(--ios-blue)' }}
            >
              Lưu cấu hình Cloudinary
            </button>
          </div>
        </IOSListGroup>

        {/* Firebase Sync */}
        <IOSListGroup
          header="Đồng bộ Firebase Cloud"
          footer="Dữ liệu luôn được lưu trước tại máy (Offline-first). Khi kết nối Firebase, ảnh, ghi âm và ghi chú đồng bộ 2 chiều giữa iPhone & PC."
        >
          {existingCfg ? (
            user ? (
              <>
                <IOSListRow
                  title={user.email || 'Đã đăng nhập'}
                  subtitle={`Project: ${existingCfg.projectId}`}
                  trailing={
                    <button
                      type="button"
                      onClick={() => signOutFirebase().then(() => showToast('Đã đăng xuất', 'info'))}
                      className="text-[13px] font-semibold cursor-pointer"
                      style={{ color: 'var(--ios-red)' }}
                    >
                      Đăng xuất
                    </button>
                  }
                />
                <IOSListRow
                  title={syncing ? 'Đang đồng bộ 2 chiều...' : 'Đồng bộ ngay với Cloud'}
                  onClick={syncing ? undefined : onSyncNow}
                  disclosure={!syncing}
                />
              </>
            ) : (
              <IOSListRow
                title="Đăng nhập Google để bật đồng bộ"
                subtitle={`Project: ${existingCfg.projectId}`}
                onClick={handleGoogleSignIn}
                disclosure
              />
            )
          ) : (
            <div className="p-4 text-[13px] text-[var(--ios-label-secondary)] leading-relaxed">
              Đang chạy chế độ <strong>Offline Local</strong>. Điền <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10">.env.local</code> hoặc dán Firebase Config bên dưới để bật đồng bộ iPhone ↔ PC.
            </div>
          )}

          <IOSListRow
            title={showFbForm ? 'Ẩn cấu hình Firebase JSON' : 'Cấu hình Firebase JSON trực tiếp'}
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
                  Lưu Config
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
                    Xóa Config
                  </button>
                )}
              </div>
            </div>
          )}
        </IOSListGroup>

        {/* Full Data Ownership + Storage Quota Monitor */}
        <IOSListGroup
          header="Bảo vệ dữ liệu & Sao lưu"
          footer="Dữ liệu nằm tại IndexedDB trên thiết bị (Local-first). Nên xuất Backup định kỳ mỗi tuần hoặc kết nối Firebase Cloud."
        >
          {quota?.supported && (
            <div className="px-4 py-3.5 space-y-2">
              <div className="flex items-center justify-between text-[13px] tabular-nums">
                <span className="font-medium">Dung lượng lưu trữ nội bộ</span>
                <span
                  style={{ color: quota.warning ? 'var(--ios-red)' : 'var(--ios-label-secondary)' }}
                >
                  {quota.usageMB} MB / {quota.quotaMB.toLocaleString('vi-VN')} MB ({quota.percent}%)
                </span>
              </div>
              <ProgressBar value={quota.percent} max={100} />
              {quota.warning && (
                <p className="text-[12px]" style={{ color: 'var(--ios-red)' }}>
                  Cảnh báo: dung lượng trình duyệt sắp đầy. Hãy xuất Backup ngay.
                </p>
              )}
            </div>
          )}
          <IOSListRow
            title="Xuất toàn bộ dữ liệu Backup (.json)"
            subtitle={
              profile.lastBackupAt
                ? `Lần sao lưu gần nhất: ${new Date(profile.lastBackupAt).toLocaleString('vi-VN')}`
                : 'Chưa từng xuất backup — nên sao lưu ngay'
            }
            onClick={handleExport}
            disclosure
          />
          <IOSListRow
            title="Khôi phục từ file Backup"
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
