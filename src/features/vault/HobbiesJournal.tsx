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
import {
  Card,
  EmptyState,
  Modal,
  SegmentedControl,
  useToast,
} from '../../components/ui/Primitives';
import { ResolvedImage } from '../../components/ImageGallery';

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

  const [hobbyFilter, setHobbyFilter] = useState<'all' | HobbyLogType>('all');
  const [vaultView, setVaultView] = useState<'by_date' | 'gallery'>('by_date');

  // Photo Calendar state
  const [viewCursor, setViewCursor] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Quick Capture Studio Drawer (inline on page!)
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [captureType, setCaptureType] = useState<HobbyLogType>('gym');
  const [captureDate, setCaptureDate] = useState<string>(todayStr);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(45);
  const [details, setDetails] = useState('');
  const [distanceMeters, setDistanceMeters] = useState(500);
  const [stroke, setStroke] = useState('Bơi sải / Bơi ếch');
  const [gymSplit, setGymSplit] = useState(GYM_SPLITS[0]);
  const [locationName, setLocationName] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

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

  const gymLogs = logs.filter((l) => l.type === 'gym');
  const swimmingLogs = logs.filter((l) => l.type === 'swimming');
  const drawingLogs = logs.filter((l) => l.type === 'drawing');
  const placesLogs = logs.filter((l) => l.type === 'places');
  const totalMeters = swimmingLogs.reduce((s, l) => s + (l.distanceMeters || 0), 0);

  const unsyncedLogs = logs.filter(
    (l) => Boolean(l.imageMediaId) && !l.imageRemoteUrl?.includes('cloudinary.com')
  );

  const filteredLogs = useMemo(
    () => (hobbyFilter === 'all' ? logs : logs.filter((l) => l.type === hobbyFilter)),
    [logs, hobbyFilter]
  );

  // Group all filtered logs by YYYY-MM-DD for Calendar & Date Vault
  const logsByDate = useMemo(() => {
    const map = new Map<string, HobbyLog[]>();
    for (const item of filteredLogs) {
      const d = item.date || todayStr;
      const list = map.get(d) || [];
      list.push(item);
      map.set(d, list);
    }
    return map;
  }, [filteredLogs, todayStr]);

  // Sorted list of dates that have captures
  const sortedDateGroups = useMemo(() => {
    return Array.from(logsByDate.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [logsByDate]);

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
    setTitle(defaultTitleForType(type));
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
      const item: HobbyLog = {
        id: createId('hb'),
        type: captureType,
        date: finalDate,
        title: title.trim() || defaultTitleForType(captureType),
        durationMinutes: Math.max(5, Number(duration) || 30),
        details: details.trim(),
        distanceMeters: captureType === 'swimming' ? Number(distanceMeters) || 0 : undefined,
        stroke: captureType === 'swimming' ? stroke : undefined,
        gymSplit: captureType === 'gym' ? gymSplit : undefined,
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
      setQuickCaptureOpen(false);

      if (pendingFile && uploadedToCloudinary) {
        showToast(
          t(
            `Saved photo to ${formatShortDate(finalDate)} & Cloudinary · +25 XP`,
            `Đã lưu ảnh vào kho ngày ${formatShortDate(finalDate)} & Cloudinary · +25 XP`
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
            `Saved to Photo Vault (${formatShortDate(finalDate)}) · +25 XP`,
            `Đã lưu vào Kho Ảnh ngày ${formatShortDate(finalDate)} · +25 XP`
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

  const handleSyncAllToCloudinary = async () => {
    if (!isCloudinaryConfigured()) {
      openCloudConfigModal();
      return;
    }
    if (unsyncedLogs.length === 0) return;
    setSyncingAll(true);
    let okCount = 0;
    try {
      for (const log of unsyncedLogs) {
        if (!log.imageMediaId) continue;
        const secureUrl = await syncLocalMediaToCloudinary(
          log.imageMediaId,
          `hobbies/${log.type}`
        );
        await db.hobbyLogs.update(log.id, { imageRemoteUrl: secureUrl });
        okCount++;
      }
      showToast(t(`Synced ${okCount} photos to Cloudinary`, `Đã đồng bộ ${okCount} ảnh lên Cloudinary`));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t(`Synced ${okCount} photos, some failed`, `Đã đồng bộ ${okCount} ảnh, một số ảnh lỗi`),
        'error'
      );
    } finally {
      setSyncingAll(false);
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

  return (
    <div className="space-y-6">
      {/* ================================================================
          01. INSTANT QUICK SNAP BAR + INLINE CAMERA STUDIO
          ================================================================ */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          backgroundColor: '#12151C',
          border: '1px solid rgba(234, 193, 111, 0.25)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="metadata text-[10.5px] uppercase tracking-[0.16em]" style={{ color: '#eac16f' }}>
              {t('INSTANT PHOTO CAPTURE · DAILY MEMORY VAULT', 'CHỤP ẢNH NHANH · KHO LƯU ẢNH THEO NGÀY')}
            </span>
            <h2 className="font-editorial text-[24px] sm:text-[26px] leading-tight text-white">
              {t(
                'Snap your Gym, Swim, Sketches & Interesting Places',
                'Chụp nhanh Tập Gym, Đi Bơi, Tranh Vẽ & Những Nơi Thú Vị'
              )}
            </h2>
            <p className="text-[12.5px] text-[#9ca3af]">
              {t(
                'Click Quick Snap below, or press Ctrl+V anywhere on this page to paste a photo directly into your date calendar.',
                'Bấm Chụp Ảnh Nhanh để mở Camera tức thì, hoặc bấm Ctrl+V ở bất kỳ đâu trên trang này để dán ảnh vào lịch.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                launchQuickCapture(captureType, {
                  autoCamera: true,
                  targetDate: selectedDate,
                })
              }
              className="px-4 py-2.5 rounded-xl text-[13.5px] font-semibold cursor-pointer transition-transform hover:scale-[1.02] shadow-lg"
              style={{ backgroundColor: '#eac16f', color: '#0c0e12' }}
            >
              {t('Quick Snap Camera', 'Chụp Ảnh Nhanh')}
            </button>
          </div>
        </div>

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

        {/* 4 Category Quick-Snap Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {(
            [
              {
                type: 'gym' as HobbyLogType,
                title: t('Gym & Workouts', 'Đi Tập Gym'),
                count: `${gymLogs.length} ${t('photos', 'lần')}`,
                btn: t('Snap Gym', 'Chụp Gym'),
                color: '#eac16f',
              },
              {
                type: 'swimming' as HobbyLogType,
                title: t('Swimming', 'Đi Bơi'),
                count: `${totalMeters.toLocaleString('vi-VN')}m · ${swimmingLogs.length} ${t('sessions', 'buổi')}`,
                btn: t('Snap Swim', 'Chụp Đi Bơi'),
                color: 'var(--os-sage)',
              },
              {
                type: 'drawing' as HobbyLogType,
                title: t('Art & Sketch', 'Vẽ / Sketch'),
                count: `${drawingLogs.length} ${t('works', 'bức vẽ')}`,
                btn: t('Snap Sketch', 'Chụp Tranh Vẽ'),
                color: 'var(--os-brass)',
              },
              {
                type: 'places' as HobbyLogType,
                title: t('Interesting Places', 'Nơi Thú Vị'),
                count: `${placesLogs.length} ${t('places', 'điểm đến')}`,
                btn: t('Snap Place', 'Chụp Nơi Thú Vị'),
                color: 'var(--os-dusty-blue)',
              },
            ] as const
          ).map((card) => (
            <div
              key={card.type}
              className="p-3.5 rounded-xl flex flex-col justify-between gap-2.5"
              style={{
                backgroundColor: '#0e1117',
                border: '1px solid #222834',
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[13px] font-semibold text-white">{card.title}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: card.color }}
                  />
                </div>
                <p className="metadata text-[11px] mt-1" style={{ color: card.color }}>
                  {card.count}
                </p>
              </div>
                <button
                  type="button"
                  onClick={() =>
                    launchQuickCapture(card.type, {
                      autoCamera: true,
                      targetDate: selectedDate,
                    })
                  }
                  className="w-full py-1.5 px-2.5 rounded-lg text-[12px] font-semibold cursor-pointer text-center"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#EDEAE2',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {card.btn}
                </button>
            </div>
          ))}
        </div>

        {/* ==============================================================
            INLINE QUICK CAPTURE STUDIO DRAWER (OPENS RIGHT HERE)
            ============================================================== */}
        {quickCaptureOpen && (
          <form
            onSubmit={handleSave}
            className="mt-4 p-4 sm:p-5 rounded-xl space-y-4"
            style={{
              backgroundColor: '#0c0e12',
              border: '1px solid #eac16f',
            }}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#1f2532] pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="metadata text-[11px] font-bold uppercase" style={{ color: '#eac16f' }}>
                  {t('QUICK SNAP STUDIO', 'KHUNG CHỤP & LƯU ẢNH NHANH')}
                </span>
                <span className="text-[#4b5563]">·</span>
                <span className="metadata text-[11px] text-[#9ca3af]">
                  {t('Saving to date:', 'Lưu vào ngày:')} {formatShortDate(captureDate)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setQuickCaptureOpen(false);
                }}
                className="text-[12px] text-[#9ca3af] hover:text-white cursor-pointer"
              >
                {t('Close', 'Đóng')}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left 6 Cols: Live Camera Viewfinder OR Photo Preview */}
              <div className="lg:col-span-6 space-y-3">
                {cameraActive ? (
                  <div className="space-y-2.5">
                    <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black border border-[#262e3d]">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className={`w-full h-full object-cover ${
                          facingMode === 'user' ? 'scale-x-[-1]' : ''
                        }`}
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startLiveCamera(facingMode === 'environment' ? 'user' : 'environment')
                          }
                          className="px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer bg-black/75 text-white border border-white/15"
                        >
                          {t(
                            `Camera: ${facingMode === 'environment' ? 'Back' : 'Front'}`,
                            `Đổi Camera (${facingMode === 'environment' ? 'Sau' : 'Trước'})`
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={stopCameraStream}
                          className="px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer bg-black/75 text-red-400"
                        >
                          {t('Stop', 'Tắt Cam')}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={capturePhotoFromVideo}
                      className="w-full py-3 rounded-xl text-[14px] font-bold cursor-pointer"
                      style={{ backgroundColor: '#eac16f', color: '#0c0e12' }}
                    >
                      {t('SNAP PHOTO NOW', 'BẤM CHỤP ẢNH NGAY')}
                    </button>
                  </div>
                ) : previewUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black/50 border border-[#262e3d]">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPendingFile(null)}
                        className="absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-medium bg-black/80 text-red-400 cursor-pointer"
                      >
                        {t('Retake / Change', 'Chụp lại / Đổi ảnh')}
                      </button>
                    </div>
                    <p className="metadata text-[11px] text-emerald-400">
                      {t('Photo ready to save to vault', 'Ảnh đã sẵn sàng lưu vào kho')} ({pendingFile?.name})
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-xl p-6 aspect-[4/3] flex flex-col items-center justify-center text-center gap-3 border border-dashed border-[#2b3344]"
                    style={{ backgroundColor: '#12151C' }}
                  >
                    <p className="text-[14px] font-medium text-white">
                      {t('Capture or drop a photo here', 'Mở Camera chụp trực tiếp hoặc chọn/dán ảnh (Ctrl+V)')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => startLiveCamera('environment')}
                        className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer"
                        style={{ backgroundColor: '#eac16f', color: '#0c0e12' }}
                      >
                        {t('Start Live Camera', 'Mở Camera Ngay')}
                      </button>
                    </div>
                    {cameraError && (
                      <p className="text-[12px] text-[#eac16f] max-w-sm">{cameraError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right 6 Cols: Category, Date & Save */}
              <div className="lg:col-span-6 space-y-4">
                <SegmentedControl
                  value={captureType}
                  onChange={switchCaptureType}
                  options={[
                    { value: 'gym', label: t('Gym', 'Tập Gym') },
                    { value: 'swimming', label: t('Swim', 'Đi Bơi') },
                    { value: 'drawing', label: t('Art', 'Vẽ') },
                    { value: 'places', label: t('Places', 'Nơi thú vị') },
                  ]}
                />

                <div>
                  <label className="metadata text-[10.5px] uppercase text-[#9ca3af]">
                    {t('Date in Vault', 'Ngày lưu lịch')}
                  </label>
                  <input
                    type="date"
                    value={captureDate}
                    onChange={(e) => setCaptureDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-lg text-[13.5px] bg-[#141821] border border-[#252c3b] text-white tabular-nums"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl text-[14px] font-bold cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#eac16f', color: '#0c0e12' }}
                >
                  {saving
                    ? t('Saving...', 'Đang lưu...')
                    : t(
                        `Save Photo (${formatShortDate(captureDate)})`,
                        `Lưu Ảnh (${formatShortDate(captureDate)})`
                      )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ================================================================
          02. CATEGORY FILTER BAR
          ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <SegmentedControl
            value={hobbyFilter}
            onChange={setHobbyFilter}
            options={[
              { value: 'all', label: t('All Captures', 'Tất cả ảnh'), badge: logs.length },
              { value: 'gym', label: t('Gym', 'Tập Gym'), badge: gymLogs.length },
              { value: 'swimming', label: t('Swim', 'Đi Bơi'), badge: swimmingLogs.length },
              { value: 'drawing', label: t('Art', 'Vẽ'), badge: drawingLogs.length },
              { value: 'places', label: t('Places', 'Nơi thú vị'), badge: placesLogs.length },
            ]}
          />
        </div>

        {unsyncedLogs.length > 0 && (
          <button
            type="button"
            disabled={syncingAll}
            onClick={handleSyncAllToCloudinary}
            className="px-3.5 py-1.5 rounded-xl metadata text-[11px] cursor-pointer shrink-0"
            style={{
              backgroundColor: 'rgba(185, 155, 121, 0.14)',
              color: 'var(--os-brass)',
              border: '1px solid rgba(185, 155, 121, 0.3)',
            }}
          >
            {syncingAll
              ? t('Syncing...', 'Đang đồng bộ...')
              : t(`Sync ${unsyncedLogs.length} to Cloudinary`, `Đồng bộ ${unsyncedLogs.length} ảnh lên Cloud`)}
          </button>
        )}
      </div>

      {/* ================================================================
          03. PHOTO CALENDAR & SELECTED DAY PHOTO VAULT
          ================================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Interactive Monthly Photo Calendar */}
        <div
          className="xl:col-span-7 rounded-2xl overflow-hidden"
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

                    {dayLogs.length > 0 && (
                      <span
                        className="metadata text-[9.5px] px-1.5 py-0.5 rounded-full font-bold"
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
              <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#eac16f' }}>
                {selectedDate === todayStr
                  ? t('TODAY’S PHOTO VAULT', 'KHO ẢNH HÔM NAY')
                  : t('DATE PHOTO VAULT', 'KHO ẢNH THEO NGÀY')}
              </span>
              <h3 className="font-editorial text-[20px] capitalize text-white mt-0.5">
                {formatFullDateLabel(selectedDate)}
              </h3>
              <p className="metadata text-[11px] text-[#9ca3af] mt-0.5">
                {t(
                  `${selectedDateLogs.length} photo(s) / moments archived on this date`,
                  `${selectedDateLogs.length} ảnh / khoảnh khắc được lưu trong ngày này`
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                launchQuickCapture(captureType, {
                  autoCamera: true,
                  targetDate: selectedDate,
                })
              }
              className="px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer shrink-0"
              style={{ backgroundColor: '#eac16f', color: '#0c0e12' }}
            >
              {t('+ Snap for Day', '+ Chụp cho ngày này')}
            </button>
          </div>

          {selectedDateLogs.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl border border-dashed border-[#242a38] space-y-3">
              <p className="text-[14px] text-[#9ca3af]">
                {t(
                  'No photos saved on this date yet.',
                  'Ngày này chưa có bức ảnh nào trong kho.'
                )}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    launchQuickCapture('gym', {
                      autoCamera: true,
                      targetDate: selectedDate,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer"
                  style={{ backgroundColor: '#eac16f', color: '#0c0e12' }}
                >
                  {t('Snap Camera', 'Mở Camera chụp')}
                </button>
              </div>
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
                            className="metadata text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ backgroundColor: meta.bg, color: meta.color }}
                          >
                            {meta.label}
                          </span>
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
                        <p className="text-[11.5px] text-[#9ca3af]">
                          {log.locationName ? `${log.locationName} · ` : ''}
                          {log.gymSplit ? `${log.gymSplit} · ` : ''}
                          {log.distanceMeters ? `${log.distanceMeters}m · ` : ''}
                          {log.stroke ? `${log.stroke} · ` : ''}
                          {log.durationMinutes} {t('min', 'phút')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(log)}
                        className="text-[11.5px] text-[#6b7280] hover:text-red-400 cursor-pointer"
                      >
                        {t('Delete', 'Xóa')}
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
          04. CHRONOLOGICAL PHOTO VAULT BY DATE (KHO LƯU ẢNH THEO TỪNG NGÀY)
          ================================================================ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="metadata text-[10.5px] uppercase tracking-[0.14em]" style={{ color: '#eac16f' }}>
              {t('CHRONOLOGICAL PHOTO VAULT', 'KHO LƯU TRỮ ẢNH THEO NGÀY')}
            </span>
            <h3 className="font-editorial text-[22px] text-white">
              {t(
                `All Captured Days (${sortedDateGroups.length} days · ${filteredLogs.length} entries)`,
                `Toàn bộ Kho Ảnh (${sortedDateGroups.length} ngày · ${filteredLogs.length} khoảnh khắc)`
              )}
            </h3>
          </div>

          <div
            className="flex items-center p-1 rounded-xl"
            style={{ backgroundColor: '#12151C', border: '1px solid #222834' }}
          >
            <button
              type="button"
              onClick={() => setVaultView('by_date')}
              className="px-3 py-1 rounded-lg text-[12px] font-medium cursor-pointer"
              style={{
                backgroundColor: vaultView === 'by_date' ? '#1e2430' : 'transparent',
                color: vaultView === 'by_date' ? '#ffffff' : '#9ca3af',
              }}
            >
              {t('Grouped by Date', 'Xếp theo từng ngày')}
            </button>
            <button
              type="button"
              onClick={() => setVaultView('gallery')}
              className="px-3 py-1 rounded-lg text-[12px] font-medium cursor-pointer"
              style={{
                backgroundColor: vaultView === 'gallery' ? '#1e2430' : 'transparent',
                color: vaultView === 'gallery' ? '#ffffff' : '#9ca3af',
              }}
            >
              {t('Photo Wall', 'Tường ảnh')}
            </button>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <EmptyState
            title={t('Your Photo Vault is empty', 'Kho ảnh của bạn đang trống')}
            subtitle={t(
              'Use Quick Snap at the top to capture your Gym workouts, Swimming sessions, Sketches, and Interesting Places.',
              'Bấm nút Chụp Ảnh Nhanh ở phía trên để lưu hình tập Gym, đi bơi, vẽ tranh và những nơi thú vị bạn ghé qua.'
            )}
          />
        ) : vaultView === 'gallery' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredLogs.map((log) => {
              const meta = getTypeMeta(log.type);
              const hasPhoto = Boolean(log.imageMediaId || log.imageRemoteUrl);
              return (
                <div
                  key={log.id}
                  className="rounded-xl overflow-hidden flex flex-col justify-between"
                  style={{ backgroundColor: '#12151C', border: '1px solid #222834' }}
                >
                  {hasPhoto ? (
                    <div
                      onClick={() => setLightboxLog(log)}
                      className="aspect-[4/3] bg-black/40 overflow-hidden cursor-zoom-in relative group"
                    >
                      <ResolvedImage
                        mediaId={log.imageMediaId || ''}
                        remoteUrl={log.imageRemoteUrl}
                        alt={log.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <span
                        className="absolute top-2.5 left-2.5 metadata text-[10px] px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 'rgba(12, 14, 18, 0.82)',
                          color: meta.color,
                        }}
                      >
                        {meta.label} · {formatShortDate(log.date)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 pb-0">
                      <span className="metadata text-[10px]" style={{ color: meta.color }}>
                        {meta.label} · {formatShortDate(log.date)}
                      </span>
                    </div>
                  )}
                  <div className="p-3.5 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-editorial text-[16px] text-white truncate">{log.title}</p>
                      <button
                        type="button"
                        onClick={() => handleDelete(log)}
                        className="text-[11px] text-[#6b7280] hover:text-red-400 cursor-pointer shrink-0"
                      >
                        {t('Del', 'Xóa')}
                      </button>
                    </div>
                    <p className="text-[11.5px] text-[#9ca3af] truncate">
                      {log.locationName || log.gymSplit || (log.distanceMeters ? `${log.distanceMeters}m` : `${log.durationMinutes}m`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-5">
            {sortedDateGroups.map(([dateStr, dayList]) => (
              <Card key={dateStr} className="space-y-3.5">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--os-border)] flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="metadata text-[11px] px-2.5 py-1 rounded-lg font-bold"
                      style={{
                        backgroundColor: 'rgba(234, 193, 111, 0.14)',
                        color: '#eac16f',
                      }}
                    >
                      {formatShortDate(dateStr)}
                    </span>
                    <h4 className="font-editorial text-[18px] capitalize text-white">
                      {formatFullDateLabel(dateStr)}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="metadata text-[11px] text-[#9ca3af]">
                      {dayList.length} {t('captures', 'ảnh')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        launchQuickCapture(captureType, {
                          autoCamera: true,
                          targetDate: dateStr,
                        });
                      }}
                      className="text-[12px] font-medium cursor-pointer"
                      style={{ color: '#eac16f' }}
                    >
                      {t('+ Add to this date', '+ Thêm ảnh vào ngày này')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayList.map((log) => {
                    const meta = getTypeMeta(log.type);
                    const hasPhoto = Boolean(log.imageMediaId || log.imageRemoteUrl);
                    return (
                      <div
                        key={log.id}
                        className="rounded-xl overflow-hidden flex flex-col justify-between"
                        style={{ backgroundColor: '#0e1117', border: '1px solid #222834' }}
                      >
                        {hasPhoto && (
                          <div
                            onClick={() => setLightboxLog(log)}
                            className="aspect-[16/10] bg-black/40 overflow-hidden cursor-zoom-in relative group"
                          >
                            <ResolvedImage
                              mediaId={log.imageMediaId || ''}
                              remoteUrl={log.imageRemoteUrl}
                              alt={log.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                            <span
                              className="absolute top-2.5 left-2.5 metadata text-[10px] px-2.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: 'rgba(12, 14, 18, 0.82)',
                                color: meta.color,
                              }}
                            >
                              {meta.label}
                            </span>
                          </div>
                        )}
                        <div className="p-3.5 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {!hasPhoto && (
                                <span className="metadata text-[10px]" style={{ color: meta.color }}>
                                  {meta.label}
                                </span>
                              )}
                              <p className="font-editorial text-[17px] text-white leading-snug">
                                {log.title}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDelete(log)}
                              className="text-[11.5px] text-[#6b7280] hover:text-red-400 cursor-pointer shrink-0"
                            >
                              {t('Delete', 'Xóa')}
                            </button>
                          </div>

                          <p className="text-[12px] text-[#9ca3af]">
                            {log.locationName ? `${log.locationName} · ` : ''}
                            {log.gymSplit ? `${log.gymSplit} · ` : ''}
                            {log.distanceMeters ? `${log.distanceMeters}m · ` : ''}
                            {log.stroke ? `${log.stroke} · ` : ''}
                            {log.durationMinutes} {t('min', 'phút')}
                          </p>
                          {log.details && (
                            <p className="text-[12.5px] text-[#cbd5e1] line-clamp-2">{log.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
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
