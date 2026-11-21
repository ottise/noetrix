import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createId, getLocalDateStr, formatShortDate } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import {
  compressImageFile,
  saveMediaLocalAndMaybeUpload,
  syncLocalMediaToCloudinary,
  deleteMediaBlob,
} from '../../lib/media';
import {
  getSavedCloudinaryConfig,
  saveLocalCloudinaryConfig,
  isCloudinaryConfigured,
} from '../../lib/cloudinary';
import type { HobbyLog, HobbyLogType } from '../../types';
import { Modal, useToast } from '../../components/ui/Primitives';
import { ResolvedImage } from '../../components/ImageGallery';
import { MobileMonthCalendar } from '../../components/MobileMonthCalendar';

const GYM_SPLITS = [
  'Push (Ngực / Vai / Tay sau)',
  'Pull (Lưng / Tay trước)',
  'Legs (Chân / Đùi / Core)',
  'Upper Body',
  'Full Body / Cardio',
];

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMondayGridDays(
  year: number,
  monthIdx: number
): { dateStr: string; inMonth: boolean; dayNum: number }[] {
  const firstOfMonth = new Date(year, monthIdx, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIdx, 1 - startOffset);

  const cells: { dateStr: string; inMonth: boolean; dayNum: number }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      dateStr: toYmd(d),
      inMonth: d.getMonth() === monthIdx,
      dayNum: d.getDate(),
    });
  }
  return cells;
}

export function HobbiesJournal() {
  const { showToast } = useToast();
  const { lang, t } = useLanguage();
  const todayStr = getLocalDateStr();
  const rawLogs = useLiveQuery(() => db.hobbyLogs.orderBy('createdAt').reverse().toArray()) || [];
  const logs = useMemo(
    () =>
      rawLogs.filter(
        (l) =>
          l.id !== 'hb_mwoqjkee_30ht9ao' &&
          !l.title.startsWith('Sơ đồ / Bản vẽ:') &&
          !l.details.includes('Excalidraw Canvas')
      ),
    [rawLogs]
  );

  // Auto-delete any Excalidraw whiteboard entry that was previously pushed into hobbyLogs
  useEffect(() => {
    const stale = rawLogs.filter(
      (l) =>
        l.id === 'hb_mwoqjkee_30ht9ao' ||
        l.title.startsWith('Sơ đồ / Bản vẽ:') ||
        l.details.includes('Excalidraw Canvas')
    );
    if (stale.length > 0) {
      db.hobbyLogs.bulkDelete(stale.map((s) => s.id)).catch(() => {});
    }
  }, [rawLogs]);

  // Photo Calendar state
  const [viewCursor, setViewCursor] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Quick Capture Studio Drawer (Locket-style 2-step capture -> post)
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [captureType, setCaptureType] = useState<HobbyLogType>('gym');
  const [captureDate, setCaptureDate] = useState<string>(todayStr);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(45);
  const [details, setDetails] = useState('');
  const [distanceMeters, setDistanceMeters] = useState(500);
  const [stroke, setStroke] = useState('Bơi sải / Bơi ếch');
  const [gymSplit, setGymSplit] = useState(GYM_SPLITS[0]);
  const [gymPhotoKind, setGymPhotoKind] = useState<'body' | 'scale'>('body');
  const [locationName, setLocationName] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Lightbox state
  const [lightboxLog, setLightboxLog] = useState<HobbyLog | null>(null);

  // Live Camera Viewfinder state
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hidden file inputs
  const fileRef = useRef<HTMLInputElement>(null);
  const nativeCameraRef = useRef<HTMLInputElement>(null);

  // Cloudinary Config Modal state
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [cloudConfigTick, setCloudConfigTick] = useState(0);
  const savedCloud = getSavedCloudinaryConfig();
  const cloudReady = isCloudinaryConfigured();

  const [cloudName, setCloudName] = useState(savedCloud?.cloudName || '');
  const [uploadPreset, setUploadPreset] = useState(savedCloud?.uploadPreset || '');
  const [apiKey, setApiKey] = useState(savedCloud?.apiKey || '');
  const [apiSecret, setApiSecret] = useState(savedCloud?.apiSecret || '');
  const [folder, setFolder] = useState(savedCloud?.folder || 'noetrix');

  // Group all logs by YYYY-MM-DD for Calendar & Date Vault
  const logsByDate = useMemo(() => {
    const map = new Map<string, HobbyLog[]>();
    for (const item of logs) {
      const d = item.date || todayStr;
      const list = map.get(d) || [];
      list.push(item);
      map.set(d, list);
    }
    return map;
  }, [logs, todayStr]);

  const gridDays = useMemo(
    () => getMondayGridDays(viewCursor.year, viewCursor.month),
    [viewCursor.year, viewCursor.month]
  );

  const monthPrefix = `${viewCursor.year}-${String(viewCursor.month + 1).padStart(2, '0')}`;
  const monthStats = useMemo(() => {
    let totalCaptures = 0;
    let activeDays = 0;
    for (const [dStr, list] of logsByDate.entries()) {
      if (dStr.startsWith(monthPrefix)) {
        totalCaptures += list.length;
        activeDays += 1;
      }
    }
    return { totalCaptures, activeDays };
  }, [logsByDate, monthPrefix]);

  const selectedDateLogs = logsByDate.get(selectedDate) || [];

  const getGymDayStatus = (dateStr: string) => {
    const dayGymLogs = logs.filter(
      (l) => (l.date || todayStr) === dateStr && l.type === 'gym' && Boolean(l.imageMediaId || l.imageRemoteUrl)
    );
    const hasBody = dayGymLogs.some((l) => l.gymPhotoKind === 'body');
    const hasScale = dayGymLogs.some((l) => l.gymPhotoKind === 'scale');
    const count = (hasBody ? 1 : 0) + (hasScale ? 1 : 0);
    return {
      hasAnyGym: dayGymLogs.length > 0,
      hasBody,
      hasScale,
      count,
      isComplete: hasBody && hasScale,
      isIncomplete: dayGymLogs.length > 0 && (!hasBody || !hasScale),
    };
  };

  // Preview URL lifecycle
  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!quickCaptureOpen) {
      stopCameraStream();
    }
    return () => stopCameraStream();
  }, [quickCaptureOpen]);

  const defaultTitleForType = (type: HobbyLogType) => {
    if (type === 'gym') return t('Gym Session', 'Buổi tập Gym');
    if (type === 'swimming') return t('Swimming Session', 'Buổi đi bơi');
    if (type === 'drawing') return t('Sketch / Drawing', 'Bức vẽ / Phác thảo');
    return t('Interesting Place', 'Nơi thú vị mới ghé');
  };

  // Global Ctrl+V image paste anywhere on this page!
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const pastedFile = new File([blob], `clipboard-${Date.now()}.jpg`, {
              type: blob.type || 'image/jpeg',
            });
            setPendingFile(pastedFile);
            setCaptureDate(selectedDate || todayStr);
            if (!title.trim()) {
              setTitle(defaultTitleForType(captureType));
            }
            setQuickCaptureOpen(true);
            stopCameraStream();
            showToast(t('Pasted image from Clipboard · Ready to save!', 'Đã dán ảnh từ Clipboard · Chọn mục & bấm Lưu!'));
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedDate, todayStr, captureType, title, showToast, t]);

  const startLiveCamera = async (nextFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    stopCameraStream();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          t(
            'Browser does not support live camera. Opening photo picker.',
            'Trình duyệt không hỗ trợ mở camera trực tiếp. Đang mở trình chọn ảnh.'
          )
        );
        nativeCameraRef.current?.click();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setFacingMode(nextFacing);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      console.warn('Live camera fallback to native file input:', err);
      setCameraError(
        t(
          'Could not access camera directly. Opened file picker instead.',
          'Không thể truy cập trực tiếp camera (hoặc chưa cấp quyền). Đã mở khung chọn ảnh từ máy.'
        )
      );
      nativeCameraRef.current?.click();
    }
  };

  const capturePhotoFromVideo = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    triggerHaptic('medium');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `noetrix-${captureType}-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        setPendingFile(capturedFile);
        stopCameraStream();
        showToast(t('Photo snapped! Click Save to store in vault.', 'Đã chụp ảnh! Bấm Lưu để cất vào kho.'));
      },
      'image/jpeg',
      0.9
    );
  };

  const launchQuickCapture = (
    type: HobbyLogType,
    options?: { autoCamera?: boolean; autoFilePicker?: boolean; targetDate?: string }
  ) => {
    triggerHaptic('light');
    const dateToUse = options?.targetDate || selectedDate || todayStr;
    setCaptureType(type);
    setCaptureDate(dateToUse);
    if (type === 'gym') {
      const gymStatus = getGymDayStatus(dateToUse);
      setGymPhotoKind(gymStatus.hasBody && !gymStatus.hasScale ? 'scale' : 'body');
    }
    setTitle('');
    setShowDatePicker(false);
    setDuration(type === 'gym' ? 60 : type === 'swimming' ? 45 : 30);
    setDetails('');
    setLocationName('');
    setCameraError(null);
    setQuickCaptureOpen(true);

    if (options?.autoCamera) {
      setTimeout(() => {
        startLiveCamera('environment');
      }, 120);
    } else if (options?.autoFilePicker) {
      setTimeout(() => {
        fileRef.current?.click();
      }, 120);
    }
  };

  const switchCaptureType = (nextType: HobbyLogType) => {
    setCaptureType(nextType);
    if (nextType === 'gym') {
      const gymStatus = getGymDayStatus(captureDate || selectedDate || todayStr);
      setGymPhotoKind(gymStatus.hasBody && !gymStatus.hasScale ? 'scale' : 'body');
    }
    if (
      !title.trim() ||
      title === defaultTitleForType('gym') ||
      title === defaultTitleForType('swimming') ||
      title === defaultTitleForType('drawing') ||
      title === defaultTitleForType('places')
    ) {
      setTitle(defaultTitleForType(nextType));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageMediaId: string | undefined;
      let imageRemoteUrl: string | undefined;
      let uploadedToCloudinary = false;
      let cloudinaryErr: string | undefined;

      if (pendingFile) {
        const compressed = await compressImageFile(pendingFile);
        const saved = await saveMediaLocalAndMaybeUpload(
          'image',
          compressed.blob,
          compressed.fileName,
          { subFolder: `hobbies/${captureType}` }
        );
        imageMediaId = saved.mediaId;
        imageRemoteUrl = saved.remoteUrl;
        uploadedToCloudinary = saved.provider === 'cloudinary';
        cloudinaryErr = saved.uploadError;
      }

      const finalDate = captureDate || selectedDate || todayStr;
      const resolvedTitle =
        title.trim() ||
        (captureType === 'gym'
          ? gymPhotoKind === 'body'
            ? t('Gym · Body', 'Gym · Body')
            : t('Gym · Weight', 'Gym · Weight')
          : defaultTitleForType(captureType));

      const item: HobbyLog = {
        id: createId('hb'),
        type: captureType,
        date: finalDate,
        title: resolvedTitle,
        durationMinutes: Math.max(5, Number(duration) || 30),
        details: details.trim(),
        distanceMeters: captureType === 'swimming' ? Number(distanceMeters) || 0 : undefined,
        stroke: captureType === 'swimming' ? stroke : undefined,
        gymSplit: undefined,
        gymPhotoKind: captureType === 'gym' ? gymPhotoKind : undefined,
        locationName: captureType === 'places' ? locationName.trim() : undefined,
        imageMediaId,
        imageRemoteUrl,
        createdAt: Date.now(),
      };

      await db.hobbyLogs.put(item);

      // Sync gym capture with that day's DailyLog
      if (captureType === 'gym') {
        const existingLog = await db.dailyLogs.get(finalDate);
        await db.dailyLogs.put({
          date: finalDate,
          codeDone: existingLog?.codeDone || false,
          codePillars: existingLog?.codePillars || [],
          codeMinutes: existingLog?.codeMinutes || 0,
          englishDone: existingLog?.englishDone || false,
          englishNote: existingLog?.englishNote || '',
          gymDone: true,
          gymSplit: gymSplit || existingLog?.gymSplit || 'Gym Session',
          readDone: existingLog?.readDone,
          createDone: existingLog?.createDone,
          dailyNote: existingLog?.dailyNote || '',
          xpEarned: (existingLog?.xpEarned || 0) + 25,
          updatedAt: Date.now(),
        });
      }

      await awardXp(25);
      setSelectedDate(finalDate);
      setPendingFile(null);

      if (captureType === 'gym') {
        const prevStatus = getGymDayStatus(finalDate);
        const nowHasBody = prevStatus.hasBody || (Boolean(imageMediaId || imageRemoteUrl) && gymPhotoKind === 'body');
        const nowHasScale = prevStatus.hasScale || (Boolean(imageMediaId || imageRemoteUrl) && gymPhotoKind === 'scale');

        if (!nowHasBody || !nowHasScale) {
          const missingKind: 'body' | 'scale' = !nowHasBody ? 'body' : 'scale';
          setGymPhotoKind(missingKind);
          setTitle('');
          startLiveCamera(facingMode);
          showToast(
            missingKind === 'scale'
              ? t('Saved Body photo! Missing Weight photo for this day.', 'Đã lưu ảnh Body! Còn thiếu ảnh Weight hôm nay.')
              : t('Saved Weight photo! Missing Body photo for this day.', 'Đã lưu ảnh Weight! Còn thiếu ảnh Body hôm nay.'),
            'error'
          );
          return;
        }
      }

      setQuickCaptureOpen(false);

      if (pendingFile && uploadedToCloudinary) {
        showToast(
          t(
            `Saved photo to ${formatShortDate(finalDate)} & Cloudinary`,
            `Đã lưu ảnh vào kho ngày ${formatShortDate(finalDate)} & Cloudinary`
          )
        );
      } else if (pendingFile && cloudinaryErr) {
        showToast(
          t(
            `Saved to ${formatShortDate(finalDate)} (Cloudinary: ${cloudinaryErr})`,
            `Đã lưu vào ngày ${formatShortDate(finalDate)} (Cloudinary: ${cloudinaryErr})`
          ),
          'info'
        );
      } else {
        showToast(
          t(
            `Saved to Photo Vault (${formatShortDate(finalDate)})`,
            `Đã lưu vào Kho Ảnh ngày ${formatShortDate(finalDate)}`
          )
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const openCloudConfigModal = () => {
    const current = getSavedCloudinaryConfig();
    setCloudName(current?.cloudName || '');
    setUploadPreset(current?.uploadPreset || '');
    setApiKey(current?.apiKey || '');
    setApiSecret(current?.apiSecret || '');
    setFolder(current?.folder || 'noetrix');
    setCloudModalOpen(true);
  };

  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudName.trim()) {
      saveLocalCloudinaryConfig(null);
      setCloudConfigTick((tk) => tk + 1);
      setCloudModalOpen(false);
      showToast(t('Cleared Cloudinary config', 'Đã xóa cấu hình Cloudinary'), 'info');
      return;
    }
    if (!uploadPreset.trim() && (!apiKey.trim() || !apiSecret.trim())) {
      showToast(
        t(
          'Enter an Unsigned Upload Preset or API Key + API Secret.',
          'Hãy nhập Upload Preset (Unsigned) hoặc cặp API Key + API Secret.'
        ),
        'error'
      );
      return;
    }
    saveLocalCloudinaryConfig({
      cloudName,
      uploadPreset,
      apiKey,
      apiSecret,
      folder: folder || 'noetrix',
    });
    setCloudConfigTick((tk) => tk + 1);
    setCloudModalOpen(false);
    showToast(t(`Connected Cloudinary (${cloudName.trim()})`, `Đã kết nối Cloudinary (${cloudName.trim()})`));
  };

  const handleSyncSingleToCloudinary = async (log: HobbyLog) => {
    if (!log.imageMediaId) return;
    if (!isCloudinaryConfigured()) {
      openCloudConfigModal();
      showToast(
        t(
          'Enter Cloud Name & Upload Preset to push photos to Cloudinary',
          'Hãy nhập Cloud Name & Upload Preset để đẩy ảnh lên Cloudinary'
        ),
        'info'
      );
      return;
    }
    setSyncingId(log.id);
    try {
      const secureUrl = await syncLocalMediaToCloudinary(
        log.imageMediaId,
        `hobbies/${log.type}`
      );
      await db.hobbyLogs.update(log.id, { imageRemoteUrl: secureUrl });
      showToast(t('Uploaded photo to Cloudinary', 'Đã tải ảnh lên Cloudinary thành công'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('Cloudinary upload error', 'Lỗi tải lên Cloudinary'), 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (log: HobbyLog) => {
    if (log.imageMediaId) await deleteMediaBlob(log.imageMediaId);
    await db.hobbyLogs.delete(log.id);
    showToast(t('Deleted entry', 'Đã xóa khỏi kho'), 'info');
  };

  const copyCloudinaryUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast(t('Copied Cloudinary URL', 'Đã copy link ảnh Cloudinary'));
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getTypeMeta = (type: HobbyLogType) => {
    switch (type) {
      case 'gym':
        return {
          badge: 'GYM',
          label: t('Gym', 'Tập Gym'),
          color: '#eac16f',
          bg: 'rgba(234, 193, 111, 0.14)',
        };
      case 'swimming':
        return {
          badge: 'SWIM',
          label: t('Swimming', 'Đi Bơi'),
          color: 'var(--os-sage)',
          bg: 'rgba(155, 170, 152, 0.14)',
        };
      case 'drawing':
        return {
          badge: 'ART',
          label: t('Art / Sketch', 'Vẽ'),
          color: 'var(--os-brass)',
          bg: 'rgba(185, 155, 121, 0.14)',
        };
      case 'places':
        return {
          badge: 'PLACES',
          label: t('Places', 'Nơi Thú Vị'),
          color: 'var(--os-dusty-blue)',
          bg: 'rgba(167, 182, 210, 0.14)',
        };
    }
  };

  const shiftMonth = (delta: number) => {
    triggerHaptic('selection');
    setViewCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const jumpToToday = () => {
    triggerHaptic('selection');
    const now = new Date();
    setViewCursor({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(todayStr);
  };

  const monthHeading = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(viewCursor.year, viewCursor.month, 1));

  const formatFullDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(y, m - 1, d));
  };

  const weekdayHeaders =
    lang === 'en'
      ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
      : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  void cloudConfigTick;

  const renderCategoryAndGymTags = () => {
    const gymStatus = getGymDayStatus(captureDate || selectedDate || todayStr);
    return (
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {(
            [
              ['gym', t('Gym', 'Gym')],
              ['swimming', t('Swim', 'Bơi')],
              ['drawing', t('Art', 'Vẽ')],
              ['places', t('Places', 'Nơi ghé')],
            ] as const
          ).map(([cat, lbl]) => {
            const active = captureType === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => switchCaptureType(cat)}
                className="px-3.5 py-1 rounded-full text-[12px] font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? 'rgba(234, 193, 111, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                  color: active ? '#eac16f' : '#9ca3af',
                  border: active ? '1px solid rgba(234, 193, 111, 0.55)' : '1px solid transparent',
                }}
              >
                {lbl}
              </button>
            );
          })}
        </div>

        {captureType === 'gym' && (
          <div className="flex items-center justify-center gap-2">
            {(
              [
                ['body', 'Body', gymStatus.hasBody],
                ['scale', 'Weight', gymStatus.hasScale],
              ] as const
            ).map(([kind, lbl, done]) => {
              const active = gymPhotoKind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setGymPhotoKind(kind)}
                  className="px-3.5 py-1 rounded-full text-[12px] font-medium cursor-pointer flex items-center gap-1.5 transition-colors"
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
                    color: active ? '#EDEAE2' : '#7f8796',
                    border: active ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span>{lbl}</span>
                  {done && <span className="text-emerald-400">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Hidden file inputs Always Mounted for 1-click upload */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            if (f) {
              setPendingFile(f);
              setQuickCaptureOpen(true);
            }
          }}
        />
        <input
          ref={nativeCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            if (f) {
              setPendingFile(f);
              setQuickCaptureOpen(true);
            }
          }}
        />

        {/* ==============================================================
            LOCKET-STYLE MINIMAL CAPTURE -> POST STUDIO
            ============================================================== */}
        {quickCaptureOpen && (
          <form
            onSubmit={handleSave}
            className="mt-4 max-w-[390px] mx-auto rounded-[32px] p-4 sm:p-5 space-y-5 shadow-2xl"
            style={{
              backgroundColor: '#0B0C10',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Minimal Top Bar */}
            <div className="flex items-center justify-between px-1">
              <span className="metadata text-[11px] text-[#9ca3af] tabular-nums">
                {formatShortDate(captureDate)}
              </span>
              <span className="text-[13px] font-semibold text-[#EDEAE2]">
                {previewUrl ? t('Post', 'Đăng lên kho') : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setPendingFile(null);
                  setQuickCaptureOpen(false);
                }}
                aria-label="Close camera"
                className="w-8 h-8 rounded-full bg-white/[0.08] text-white/75 hover:text-white flex items-center justify-center text-[14px] cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {!previewUrl ? (
              /* ----------------------------------------------------------
                 STEP 1: LIVE VIEWFINDER + 3-BUTTON SHUTTER ROW (GALLERY / SHUTTER / FLIP)
                 ---------------------------------------------------------- */
              <div className="space-y-5">
                <div className="relative aspect-square w-full rounded-[28px] overflow-hidden bg-[#151821] border border-white/10 flex items-center justify-center">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`w-full h-full object-cover ${
                        facingMode === 'user' ? 'scale-x-[-1]' : ''
                      }`}
                    />
                  ) : (
                    <div className="p-6 text-center space-y-3">
                      <button
                        type="button"
                        onClick={() => startLiveCamera(facingMode)}
                        className="px-5 py-2.5 rounded-full text-[13.5px] font-semibold cursor-pointer"
                        style={{ backgroundColor: '#eac16f', color: '#0c0e12' }}
                      >
                        {t('Open Camera', 'Mở Camera')}
                      </button>
                      {cameraError && (
                        <p className="text-[12px] text-[#eac16f]/90 max-w-[240px] mx-auto leading-relaxed">
                          {cameraError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Locket Bottom Row: Gallery | Big Shutter Ring | Flip Camera */}
                <div className="flex items-center justify-around pt-1 pb-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    aria-label={t('Choose from Gallery', 'Chọn ảnh từ máy')}
                    title={t('Choose from Gallery', 'Chọn ảnh từ máy')}
                    className="w-12 h-12 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <circle cx="8.5" cy="10.5" r="1.5" />
                      <path d="M21 15l-4.5-4.5L7 19" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (cameraActive) {
                        capturePhotoFromVideo();
                      } else {
                        startLiveCamera(facingMode);
                      }
                    }}
                    aria-label={t('Snap photo', 'Chụp ảnh')}
                    className="w-[78px] h-[78px] rounded-full p-[4px] border-[3.5px] border-[#eac16f] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                  >
                    <span className="w-full h-full rounded-full bg-white hover:bg-[#f6f1e6] block" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      startLiveCamera(facingMode === 'environment' ? 'user' : 'environment')
                    }
                    aria-label={t('Flip Camera', 'Đổi Camera')}
                    title={t('Flip Camera', 'Đổi Camera')}
                    className="w-12 h-12 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 2l3 3-3 3" />
                      <path d="M3 11V9a4 4 0 014-4h13" />
                      <path d="M7 22l-3-3 3-3" />
                      <path d="M21 13v2a4 4 0 01-4 4H4" />
                    </svg>
                  </button>
                </div>

                {renderCategoryAndGymTags()}
              </div>
            ) : (
              /* ----------------------------------------------------------
                 STEP 2: POST PREVIEW + ADD MESSAGE PILL + 3-BUTTON POST ROW (✕ / POST / DATE)
                 ---------------------------------------------------------- */
              <div className="space-y-5">
                <div className="relative aspect-square w-full rounded-[28px] overflow-hidden bg-black border border-white/10">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />

                  {/* Locket "Add a message" overlay pill */}
                  <div className="absolute inset-x-4 bottom-4 flex justify-center">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('Add a message...', 'Thêm ghi chú...')}
                      className="max-w-[240px] w-full px-4 py-2 rounded-full bg-black/55 backdrop-blur-md text-white placeholder-white/75 text-center text-[13.5px] border border-white/15 focus:outline-none focus:border-[#eac16f]"
                    />
                  </div>
                </div>

                {/* Locket Post Action Row: Retake (✕) | Send / Post (Paper Plane) | Date */}
                <div className="flex items-center justify-around pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setPendingFile(null);
                      setTitle('');
                      startLiveCamera(facingMode);
                    }}
                    aria-label={t('Retake', 'Chụp lại')}
                    title={t('Retake', 'Chụp lại')}
                    className="w-12 h-12 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white text-[19px] flex items-center justify-center cursor-pointer transition-colors"
                  >
                    ✕
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    aria-label={t('Post photo', 'Đăng ảnh')}
                    title={t('Post photo', 'Đăng ảnh')}
                    className="w-[76px] h-[76px] rounded-full bg-[#eac16f] hover:bg-[#f2cc7c] text-[#0c0e12] flex items-center justify-center cursor-pointer active:scale-95 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {saving ? (
                      <span className="w-6 h-6 rounded-full border-2 border-[#0c0e12] border-t-transparent animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-7 h-7 translate-x-[1px] -translate-y-[1px]" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13" />
                        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDatePicker((v) => !v)}
                    aria-label={t('Change date', 'Đổi ngày lưu')}
                    title={t('Change date', 'Đổi ngày lưu')}
                    className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                      showDatePicker
                        ? 'bg-[#eac16f]/20 text-[#eac16f] border border-[#eac16f]/50'
                        : 'bg-white/[0.08] hover:bg-white/[0.16] text-white'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="16" rx="3" />
                      <path d="M16 3v4M8 3v4M3 10h18" />
                    </svg>
                  </button>
                </div>

                {showDatePicker && (
                  <div className="flex justify-center">
                    <input
                      type="date"
                      value={captureDate}
                      onChange={(e) => setCaptureDate(e.target.value)}
                      className="px-3 py-1.5 rounded-full text-[12.5px] bg-[#161922] border border-white/15 text-white tabular-nums"
                    />
                  </div>
                )}

                {/* Minimal Category Selector + Gym Body/Weight Tags */}
                {renderCategoryAndGymTags()}
              </div>
            )}
          </form>
        )}
      </div>

      {/* ================================================================
          02. PHOTO CALENDAR & SELECTED DAY PHOTO VAULT
          ================================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Mobile iOS Circular Photo Calendar */}
        <div className="md:hidden">
          <MobileMonthCalendar
            year={viewCursor.year}
            month={viewCursor.month}
            gridDays={gridDays}
            weekdayLabels={weekdayHeaders}
            todayStr={todayStr}
            selectedDate={selectedDate}
            onShiftMonth={shiftMonth}
            onJumpToday={jumpToToday}
            onSelectDate={(dStr) => {
              setSelectedDate(dStr);
              setCaptureDate(dStr);
            }}
            onQuickAddDate={(dStr) => {
              setSelectedDate(dStr);
              launchQuickCapture(captureType, { autoCamera: true, targetDate: dStr });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            getDayMeta={(dStr) => {
              const dayLogs = logsByDate.get(dStr) || [];
              const firstWithPhoto = dayLogs.find((l) => Boolean(l.imageMediaId || l.imageRemoteUrl));
              return {
                hasItems: dayLogs.length > 0,
                itemCount: dayLogs.length,
                hasIncompleteWarning: getGymDayStatus(dStr).isIncomplete,
                circleContent: firstWithPhoto ? (
                  <ResolvedImage
                    mediaId={firstWithPhoto.imageMediaId || ''}
                    remoteUrl={firstWithPhoto.imageRemoteUrl}
                    alt={firstWithPhoto.title}
                    className="w-full h-full object-cover"
                  />
                ) : undefined,
              };
            }}
            onFabClick={() => {
              launchQuickCapture(captureType, {
                autoCamera: true,
                targetDate: selectedDate || todayStr,
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            fabAriaLabel={t('Capture photo', 'Chụp ảnh mới')}
          />
        </div>

        {/* Left 7 Cols: Desktop Interactive Monthly Photo Calendar */}
        <div
          className="hidden md:block xl:col-span-7 rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#11141B', border: '1px solid #222834' }}
        >
          {/* Calendar Header */}
          <div className="px-4 py-3.5 border-b border-[#222834] flex items-center justify-between gap-3 flex-wrap bg-[#0d1016]">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="w-7 h-7 rounded-lg border border-[#262e3d] bg-[#161a23] hover:border-[#eac16f]/60 text-[#cbd5e1] cursor-pointer"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="px-2.5 h-7 rounded-lg border border-[#262e3d] bg-[#161a23] hover:border-[#eac16f]/60 metadata text-[10.5px] uppercase text-[#eac16f] cursor-pointer"
                >
                  {t('Today', 'Hôm nay')}
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="w-7 h-7 rounded-lg border border-[#262e3d] bg-[#161a23] hover:border-[#eac16f]/60 text-[#cbd5e1] cursor-pointer"
                >
                  ›
                </button>
              </div>
              <h3 className="font-editorial text-[20px] capitalize text-white">
                {monthHeading}
              </h3>
            </div>

            <div className="flex items-center gap-3 metadata text-[11px] text-[#9ca3af]">
              <span>
                {t('Month photos:', 'Ảnh trong tháng:')}{' '}
                <strong className="text-white">{monthStats.totalCaptures}</strong>
              </span>
              <span>·</span>
              <span>
                {t('Active days:', 'Ngày có ảnh:')}{' '}
                <strong className="text-[#eac16f]">{monthStats.activeDays}</strong>
              </span>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-[#222834] bg-[#0d1016]">
            {weekdayHeaders.map((wd) => (
              <div
                key={wd}
                className="py-2 text-center metadata text-[10px] font-semibold tracking-widest text-[#8f98a8]"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* 42 Day Cells with Embedded Photo Thumbnails */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#1d2330]">
            {gridDays.map((cell) => {
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;
              const dayLogs = logsByDate.get(cell.dateStr) || [];
              const firstWithPhoto = dayLogs.find((l) => Boolean(l.imageMediaId || l.imageRemoteUrl));

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedDate(cell.dateStr);
                    setCaptureDate(cell.dateStr);
                  }}
                  className={`min-h-[78px] sm:min-h-[92px] p-1.5 text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#1a1f2b] ring-2 ring-inset ring-[#eac16f]'
                      : 'hover:bg-[#151922]'
                  } ${!cell.inMonth ? 'opacity-35' : ''}`}
                >
                  {/* Background Photo Cover if day has a captured photo */}
                  {firstWithPhoto && (
                    <div className="absolute inset-0 opacity-45 group-hover:opacity-65 transition-opacity">
                      <ResolvedImage
                        mediaId={firstWithPhoto.imageMediaId || ''}
                        remoteUrl={firstWithPhoto.imageRemoteUrl}
                        alt={firstWithPhoto.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d12] via-[#0b0d12]/40 to-transparent" />
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span
                      className={`metadata text-[11px] tabular-nums w-6 h-6 rounded-full inline-flex items-center justify-center font-semibold ${
                        isToday
                          ? 'bg-[#eac16f] text-[#0c0e12]'
                          : isSelected
                          ? 'bg-black/60 text-[#eac16f]'
                          : firstWithPhoto
                          ? 'bg-black/60 text-white'
                          : 'text-[#d1d5db]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    <div className="flex items-center gap-1">
                      {getGymDayStatus(cell.dateStr).isIncomplete && (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30"
                          title={t('Missing 2nd Gym photo (Body + Weight)', 'Thiếu 1 trong 2 ảnh Gym (Body + Weight)')}
                        />
                      )}
                      {dayLogs.length > 0 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium tabular-nums"
                          style={{
                            backgroundColor: 'rgba(12, 14, 18, 0.82)',
                            color: '#eac16f',
                            border: '1px solid rgba(234, 193, 111, 0.35)',
                          }}
                        >
                          {dayLogs.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Category Dots & Latest Title */}
                  {dayLogs.length > 0 && (
                    <div className="relative z-10 w-full space-y-1 mt-auto">
                      <div className="flex items-center gap-1">
                        {dayLogs.slice(0, 4).map((l) => (
                          <span
                            key={l.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: getTypeMeta(l.type).color }}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-white font-medium truncate drop-shadow">
                        {dayLogs[0].title}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Selected Day Photo Vault */}
        <div
          className="xl:col-span-5 rounded-2xl p-5 space-y-4"
          style={{ backgroundColor: '#12151C', border: '1px solid #222834' }}
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1f2532]">
            <div>
              <span className="text-[11px] font-medium" style={{ color: '#eac16f' }}>
                {selectedDate === todayStr
                  ? t('Today’s Photo Vault', 'Kho ảnh hôm nay')
                  : t('Date Photo Vault', 'Kho ảnh theo ngày')}
              </span>
              <h3 className="text-[17px] font-semibold capitalize text-white mt-0.5">
                {formatFullDateLabel(selectedDate)}
              </h3>
              <p className="metadata text-[11px] text-[#9ca3af] mt-0.5">
                {t(
                  `${selectedDateLogs.length} photo(s) / moments archived on this date`,
                  `${selectedDateLogs.length} ảnh / khoảnh khắc được lưu trong ngày này`
                )}
              </p>
              {getGymDayStatus(selectedDate).isIncomplete && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/35">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {!getGymDayStatus(selectedDate).hasBody
                    ? t('Gym incomplete: Missing Body photo', 'Gym chưa đủ 2 ảnh: Còn thiếu ảnh Body')
                    : t('Gym incomplete: Missing Weight photo', 'Gym chưa đủ 2 ảnh: Còn thiếu ảnh Weight')}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                launchQuickCapture(captureType, {
                  autoCamera: true,
                  targetDate: selectedDate,
                })
              }
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer shrink-0 transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: '#eac16f', color: '#0c0e12' }}
            >
              <span>+</span>
              <span>{t('Snap', 'Chụp')}</span>
            </button>
          </div>

          {selectedDateLogs.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl border border-dashed border-[#242a38]">
              <p className="text-[14px] text-[#9ca3af]">
                {t(
                  'No photos saved on this date yet.',
                  'Ngày này chưa có bức ảnh nào trong kho.'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
              {selectedDateLogs.map((log) => {
                const meta = getTypeMeta(log.type);
                const hasPhoto = Boolean(log.imageMediaId || log.imageRemoteUrl);
                const isCloudinary = Boolean(log.imageRemoteUrl?.includes('cloudinary.com'));

                return (
                  <div
                    key={log.id}
                    className="rounded-xl overflow-hidden p-3.5 space-y-2.5"
                    style={{ backgroundColor: '#0c0e12', border: '1px solid #222834' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: meta.bg, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          {log.type === 'gym' && log.gymPhotoKind && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/[0.08] text-[#EDEAE2]">
                              {log.gymPhotoKind === 'body' ? 'Body' : 'Weight'}
                            </span>
                          )}
                          {isCloudinary && log.imageRemoteUrl && (
                            <button
                              type="button"
                              onClick={() => copyCloudinaryUrl(log.imageRemoteUrl!)}
                              className="metadata text-[9.5px] px-2 py-0.5 rounded-full cursor-pointer"
                              style={{
                                backgroundColor: 'rgba(155, 170, 152, 0.14)',
                                color: 'var(--os-sage)',
                              }}
                            >
                              CLOUD URL
                            </button>
                          )}
                          {hasPhoto && !isCloudinary && log.imageMediaId && (
                            <button
                              type="button"
                              disabled={syncingId === log.id}
                              onClick={() => handleSyncSingleToCloudinary(log)}
                              className="metadata text-[9.5px] px-2 py-0.5 rounded-full cursor-pointer"
                              style={{
                                backgroundColor: 'rgba(234, 193, 111, 0.14)',
                                color: '#eac16f',
                              }}
                            >
                              {syncingId === log.id ? '...' : t('Push Cloud', 'Đẩy lên Cloud')}
                            </button>
                          )}
                        </div>
                        <p className="font-editorial text-[18px] text-white mt-1">{log.title}</p>
                        {(log.locationName || log.distanceMeters || log.stroke) && (
                          <p className="text-[11.5px] text-[#9ca3af]">
                            {[
                              log.locationName,
                              log.distanceMeters ? `${log.distanceMeters}m` : '',
                              log.stroke,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(log)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 cursor-pointer shrink-0"
                      >
                        {t('Delete', 'Xóa ảnh')}
                      </button>
                    </div>

                    {hasPhoto && (
                      <div
                        onClick={() => setLightboxLog(log)}
                        className="rounded-lg overflow-hidden aspect-[16/10] bg-black/40 cursor-zoom-in group"
                      >
                        <ResolvedImage
                          mediaId={log.imageMediaId || ''}
                          remoteUrl={log.imageRemoteUrl}
                          alt={log.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    )}

                    {log.details && (
                      <p className="text-[13px] text-[#cbd5e1] leading-relaxed">{log.details}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================
          CLOUDINARY CONFIGURATION MODAL
          ================================================================ */}
      <Modal
        open={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
        title={t('Cloudinary Storage Setup', 'Cấu hình Cloudinary Storage')}
      >
        <form onSubmit={handleSaveCloudConfig} className="space-y-4">
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
            {t(
              'Enter your Cloud Name and Unsigned Upload Preset (or API Key + Secret) to automatically back up your Gym, Swimming, Art, and Places photos.',
              'Nhập Cloud Name cùng Upload Preset (Unsigned) hoặc cặp API Key + API Secret từ Cloudinary để tự động sao lưu mọi bức ảnh trong Kho Ảnh.'
            )}
          </p>

          <div className="space-y-1">
            <label className="metadata text-[11px] uppercase">Cloud Name</label>
            <input
              type="text"
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              placeholder="e.g. dxyz12345"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
            />
          </div>

          <div className="space-y-1">
            <label className="metadata text-[11px] uppercase">Upload Preset (Unsigned)</label>
            <input
              type="text"
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              placeholder="e.g. noetrix_unsigned"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
            />
          </div>

          <div
            className="p-3.5 rounded-[10px] space-y-2.5"
            style={{
              backgroundColor: 'var(--os-obsidian)',
              border: '1px solid var(--os-border)',
            }}
          >
            <p className="metadata text-[10.5px] uppercase" style={{ color: 'var(--os-brass)' }}>
              {t('Or use API Key + API Secret', 'Hoặc dùng API Key + API Secret')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key..."
                className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13px]"
              />
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="API Secret..."
                className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13px]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="metadata text-[11px] uppercase">Folder</label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="noetrix"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-[10px] text-[14px] font-semibold cursor-pointer ios-pressable"
              style={{
                backgroundColor: 'var(--os-brass)',
                color: '#101114',
              }}
            >
              {t('Save Cloudinary Config', 'Lưu cấu hình Cloudinary')}
            </button>
            {cloudReady && (
              <button
                type="button"
                onClick={() => {
                  saveLocalCloudinaryConfig(null);
                  setCloudConfigTick((tk) => tk + 1);
                  setCloudModalOpen(false);
                  showToast(t('Disconnected Cloudinary', 'Đã ngắt kết nối Cloudinary'), 'info');
                }}
                className="px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--os-stone)',
                  color: 'var(--os-crimson)',
                }}
              >
                {t('Remove', 'Gỡ')}
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* ================================================================
          FULL-SCREEN LIGHTBOX FOR CAPTURED PHOTOS
          ================================================================ */}
      {lightboxLog && (
        <div
          className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxLog(null)}
        >
          <div className="absolute top-5 right-5 flex items-center gap-2">
            {lightboxLog.imageRemoteUrl && (
              <a
                href={lightboxLog.imageRemoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3.5 py-2 rounded-full bg-white/15 text-white text-[12.5px] font-medium"
              >
                {t('Open Original Cloud Link', 'Mở link gốc Cloudinary')}
              </a>
            )}
            <button
              type="button"
              onClick={() => setLightboxLog(null)}
              className="px-4 py-2 rounded-full bg-white/15 text-white text-[13px] font-medium cursor-pointer"
            >
              {t('Close', 'Đóng')}
            </button>
          </div>
          <ResolvedImage
            mediaId={lightboxLog.imageMediaId || ''}
            remoteUrl={lightboxLog.imageRemoteUrl}
            alt={lightboxLog.title}
            className="max-w-full max-h-[82dvh] object-contain rounded-[12px]"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-3 text-center space-y-1">
            <p className="font-editorial text-[18px] text-white">
              {lightboxLog.title} · {formatShortDate(lightboxLog.date)}
            </p>
            {lightboxLog.locationName && (
              <p className="metadata text-[11.5px] text-[#A7B6D2]">{lightboxLog.locationName}</p>
            )}
            {lightboxLog.details && (
              <p className="text-[13.5px] text-white/75 max-w-xl">{lightboxLog.details}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
