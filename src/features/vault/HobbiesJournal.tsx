import React, { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createId, getLocalDateStr, formatShortDate } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
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
import type { HobbyLog } from '../../types';
import {
  Card,
  EmptyState,
  IOSListGroup,
  Modal,
  SegmentedControl,
  useToast,
} from '../../components/ui/Primitives';
import { ResolvedImage } from '../../components/ImageGallery';

export function HobbiesJournal() {
  const { showToast } = useToast();
  const logs = useLiveQuery(() => db.hobbyLogs.orderBy('createdAt').reverse().toArray()) || [];

  const [hobbyFilter, setHobbyFilter] = useState<'all' | 'drawing' | 'swimming'>('all');
  const [modalType, setModalType] = useState<'drawing' | 'swimming' | null>(null);

  // Entry form state
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [details, setDetails] = useState('');
  const [distanceMeters, setDistanceMeters] = useState(500);
  const [stroke, setStroke] = useState('Bơi sải / Bơi ếch');
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

  // File inputs
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

  const drawingLogs = logs.filter((l) => l.type === 'drawing');
  const swimmingLogs = logs.filter((l) => l.type === 'swimming');
  const totalMeters = swimmingLogs.reduce((s, l) => s + (l.distanceMeters || 0), 0);

  const logsWithPhoto = logs.filter((l) => Boolean(l.imageMediaId || l.imageRemoteUrl));
  const logsOnCloudinary = logs.filter((l) => Boolean(l.imageRemoteUrl?.includes('cloudinary.com')));
  const unsyncedLogs = logs.filter(
    (l) => Boolean(l.imageMediaId) && !l.imageRemoteUrl?.includes('cloudinary.com')
  );

  const displayed =
    hobbyFilter === 'all' ? logs : logs.filter((l) => l.type === hobbyFilter);

  // Generate preview URL whenever pendingFile changes
  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  // Stop camera stream helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Cleanup camera when modal closes or unmounts
  useEffect(() => {
    if (!modalType) {
      stopCameraStream();
    }
    return () => stopCameraStream();
  }, [modalType]);

  // Support Ctrl+V image paste inside modal
  useEffect(() => {
    if (!modalType) return;
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
            stopCameraStream();
            showToast('Đã dán ảnh từ Clipboard');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [modalType, showToast]);

  const startLiveCamera = async (nextFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    stopCameraStream();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Trình duyệt không hỗ trợ mở camera trực tiếp. Hãy dùng nút Chọn/Chụp ảnh.');
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
      setCameraError('Không thể truy cập trực tiếp camera (hoặc chưa cấp quyền). Đã mở trình chọn ảnh.');
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

    // Mirror horizontally if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `noetrix-${modalType || 'photo'}-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        setPendingFile(capturedFile);
        stopCameraStream();
        showToast('Đã chụp ảnh · Sẵn sàng tải lên Cloudinary');
      },
      'image/jpeg',
      0.9
    );
  };

  const openModal = (type: 'drawing' | 'swimming', autoStartCamera = false) => {
    triggerHaptic('light');
    setModalType(type);
    setTitle(type === 'drawing' ? 'Phác thảo / Vẽ tự do' : 'Buổi bơi thư giãn');
    setDuration(type === 'drawing' ? 30 : 45);
    setDetails('');
    setPendingFile(null);
    setCameraError(null);
    if (autoStartCamera) {
      setTimeout(() => {
        startLiveCamera('environment');
      }, 180);
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
      setCloudConfigTick((t) => t + 1);
      setCloudModalOpen(false);
      showToast('Đã xóa cấu hình Cloudinary', 'info');
      return;
    }
    if (!uploadPreset.trim() && (!apiKey.trim() || !apiSecret.trim())) {
      showToast('Hãy nhập Upload Preset (Unsigned) hoặc cặp API Key + API Secret.', 'error');
      return;
    }
    saveLocalCloudinaryConfig({
      cloudName,
      uploadPreset,
      apiKey,
      apiSecret,
      folder: folder || 'noetrix',
    });
    setCloudConfigTick((t) => t + 1);
    setCloudModalOpen(false);
    showToast(`Đã kết nối Cloudinary (${cloudName.trim()})`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;
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
          { subFolder: `hobbies/${modalType}` }
        );
        imageMediaId = saved.mediaId;
        imageRemoteUrl = saved.remoteUrl;
        uploadedToCloudinary = saved.provider === 'cloudinary';
        cloudinaryErr = saved.uploadError;
      }

      const item: HobbyLog = {
        id: createId('hb'),
        type: modalType,
        date: getLocalDateStr(),
        title: title.trim() || (modalType === 'drawing' ? 'Buổi vẽ' : 'Buổi bơi'),
        durationMinutes: Math.max(5, Number(duration) || 30),
        details: details.trim(),
        distanceMeters: modalType === 'swimming' ? Number(distanceMeters) || 0 : undefined,
        stroke: modalType === 'swimming' ? stroke : undefined,
        imageMediaId,
        imageRemoteUrl,
        createdAt: Date.now(),
      };

      await db.hobbyLogs.put(item);
      await awardXp(25);
      setModalType(null);

      if (pendingFile && uploadedToCloudinary) {
        showToast('Đã chụp & lưu ảnh lên Cloudinary · +25 XP');
      } else if (pendingFile && cloudinaryErr) {
        showToast(`Đã lưu tại máy (Cloudinary: ${cloudinaryErr})`, 'info');
      } else if (pendingFile && !cloudReady) {
        showToast('Đã lưu ảnh tại máy · Kết nối Cloudinary để đồng bộ Cloud', 'info');
      } else {
        showToast(
          modalType === 'drawing'
            ? 'Đã lưu vào sổ tay Vẽ · +25 XP'
            : 'Đã ghi nhận buổi Đi bơi · +25 XP'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSyncSingleToCloudinary = async (log: HobbyLog) => {
    if (!log.imageMediaId) return;
    if (!isCloudinaryConfigured()) {
      openCloudConfigModal();
      showToast('Hãy nhập Cloud Name & Upload Preset để đẩy ảnh lên Cloudinary', 'info');
      return;
    }
    setSyncingId(log.id);
    try {
      const secureUrl = await syncLocalMediaToCloudinary(
        log.imageMediaId,
        `hobbies/${log.type}`
      );
      await db.hobbyLogs.update(log.id, { imageRemoteUrl: secureUrl });
      showToast('Đã tải ảnh lên Cloudinary thành công');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi tải lên Cloudinary', 'error');
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
      showToast(`Đã đồng bộ ${okCount} ảnh lên Cloudinary`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : `Đã đồng bộ ${okCount} ảnh, một số ảnh lỗi`,
        'error'
      );
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDelete = async (log: HobbyLog) => {
    if (log.imageMediaId) await deleteMediaBlob(log.imageMediaId);
    await db.hobbyLogs.delete(log.id);
    showToast('Đã xóa ghi nhận', 'info');
  };

  const copyCloudinaryUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Đã copy link ảnh Cloudinary');
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Force re-read when cloudConfigTick increments
  void cloudConfigTick;

  return (
    <div className="space-y-5">
      {/* ================================================================
          SUMMARY & QUICK CAMERA CAPTURE CARD
          ================================================================ */}
      <Card className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-0">
          <div className="sm:pr-5 space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-[12.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                Buổi Vẽ / Sketch
              </p>
              <span className="metadata text-[11px]" style={{ color: 'var(--os-ivory-faint)' }}>
                ART & SKETCHBOOK
              </span>
            </div>
            <p className="text-[28px] leading-none font-medium tabular-nums" style={{ color: 'var(--os-ivory-bright)' }}>
              {drawingLogs.length}
            </p>
            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => openModal('drawing', true)}
                className="px-3 py-1.5 rounded-[9px] text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'var(--os-brass)',
                  color: '#101114',
                }}
              >
                Chụp ảnh tranh vẽ
              </button>
              <button
                type="button"
                onClick={() => openModal('drawing', false)}
                className="text-[13px] font-medium cursor-pointer"
                style={{ color: 'var(--os-dusty-blue)' }}
              >
                + Lưu buổi vẽ
              </button>
            </div>
          </div>

          <div
            className="sm:pl-5 pt-4 sm:pt-0 space-y-2 border-t sm:border-t-0 sm:border-l"
            style={{ borderColor: 'var(--os-border)' }}
          >
            <div className="flex items-baseline justify-between">
              <p className="text-[12.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                Tổng cự ly bơi
              </p>
              <span className="metadata text-[11px]" style={{ color: 'var(--os-ivory-faint)' }}>
                SWIMMING LOG
              </span>
            </div>
            <p
              className="text-[28px] leading-none font-medium tabular-nums"
              style={{ color: 'var(--os-sage)' }}
            >
              {totalMeters.toLocaleString('vi-VN')}m
            </p>
            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => openModal('swimming', true)}
                className="px-3 py-1.5 rounded-[9px] text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'var(--os-stone)',
                  color: 'var(--os-ivory-bright)',
                  border: '1px solid var(--os-border)',
                }}
              >
                Chụp ảnh buổi bơi
              </button>
              <button
                type="button"
                onClick={() => openModal('swimming', false)}
                className="text-[13px] font-medium cursor-pointer"
                style={{ color: 'var(--os-dusty-blue)' }}
              >
                + Ghi buổi bơi
              </button>
            </div>
          </div>
        </div>
      </Card>

      <SegmentedControl
        value={hobbyFilter}
        onChange={setHobbyFilter}
        options={[
          { value: 'all', label: 'Tất cả', badge: logs.length },
          { value: 'drawing', label: 'Vẽ', badge: drawingLogs.length },
          { value: 'swimming', label: 'Đi bơi', badge: swimmingLogs.length },
        ]}
      />

      {displayed.length === 0 ? (
        <EmptyState
          title="Chưa có ghi nhận thú vui nào"
          subtitle="Thỉnh thoảng đi bơi hoặc vẽ xong cứ chụp lại lưu lên Cloudinary — không áp lực chuỗi ngày."
          action={
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openModal('drawing', true)}
                className="px-4 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
              >
                Chụp ảnh tranh vẽ
              </button>
              <button
                type="button"
                onClick={() => openModal('swimming', true)}
                className="px-4 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--os-stone)',
                  color: 'var(--os-ivory-bright)',
                  border: '1px solid var(--os-border)',
                }}
              >
                Chụp ảnh đi bơi
              </button>
            </div>
          }
        />
      ) : (
        <IOSListGroup header={`Nhật ký & Lưu trữ Cloudinary (${displayed.length})`}>
          {displayed.map((log) => {
            const isCloudinary = Boolean(log.imageRemoteUrl?.includes('cloudinary.com'));
            const hasPhoto = Boolean(log.imageMediaId || log.imageRemoteUrl);

            return (
              <div key={log.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="metadata text-[11px] uppercase tracking-[0.08em]"
                        style={{ color: log.type === 'drawing' ? 'var(--os-brass)' : 'var(--os-sage)' }}
                      >
                        {log.type === 'drawing' ? 'DRAWING' : 'SWIMMING'} · {formatShortDate(log.date)}
                      </span>

                      {isCloudinary && log.imageRemoteUrl && (
                        <button
                          type="button"
                          onClick={() => copyCloudinaryUrl(log.imageRemoteUrl!)}
                          className="metadata text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: 'rgba(155, 170, 152, 0.14)',
                            color: 'var(--os-sage)',
                            border: '1px solid rgba(155, 170, 152, 0.3)',
                          }}
                          title="Chạm để copy URL Cloudinary"
                        >
                          CLOUDINARY ✓ · COPY URL
                        </button>
                      )}

                      {hasPhoto && !isCloudinary && log.imageMediaId && (
                        <button
                          type="button"
                          disabled={syncingId === log.id}
                          onClick={() => handleSyncSingleToCloudinary(log)}
                          className="metadata text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{
                            backgroundColor: 'rgba(185, 155, 121, 0.14)',
                            color: 'var(--os-brass)',
                            border: '1px solid rgba(185, 155, 121, 0.3)',
                          }}
                        >
                          {syncingId === log.id ? 'UPLOADING...' : 'LOCAL · ĐẨY LÊN CLOUDINARY ↑'}
                        </button>
                      )}
                    </div>

                    <p className="font-editorial text-[19px] leading-snug" style={{ color: 'var(--os-ivory-bright)' }}>
                      {log.title}
                    </p>
                    <p className="text-[12.5px] tabular-nums" style={{ color: 'var(--os-ivory-muted)' }}>
                      {log.durationMinutes} phút
                      {log.distanceMeters ? ` · ${log.distanceMeters}m` : ''}
                      {log.stroke ? ` · ${log.stroke}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isCloudinary && log.imageRemoteUrl && (
                      <a
                        href={log.imageRemoteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-medium hover:underline"
                        style={{ color: 'var(--os-dusty-blue)' }}
                      >
                        Mở Cloud ↗
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(log)}
                      className="text-[12.5px] font-medium cursor-pointer"
                      style={{ color: 'var(--os-crimson)' }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {hasPhoto && (
                  <div
                    onClick={() => setLightboxLog(log)}
                    className="rounded-[12px] overflow-hidden aspect-[16/10] sm:aspect-[16/9] max-h-[360px] bg-black/25 cursor-zoom-in relative group"
                    style={{ border: '1px solid var(--os-border)' }}
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
                  <p className="text-[14px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                    {log.details}
                  </p>
                )}
              </div>
            );
          })}
        </IOSListGroup>
      )}

      {/* ================================================================
          CAPTURE & LOG MODAL (Supports Live Camera, iOS Camera, Gallery & Paste)
          ================================================================ */}
      <Modal
        open={modalType !== null}
        onClose={() => setModalType(null)}
        title={modalType === 'drawing' ? 'Chụp & Lưu Buổi Vẽ' : 'Chụp & Ghi nhận Buổi Đi Bơi'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* PHOTO CAPTURE STUDIO BOX */}
          <div
            className="rounded-[12px] p-3.5 space-y-3"
            style={{
              backgroundColor: 'var(--os-obsidian)',
              border: '1px solid var(--os-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
                {cloudReady
                  ? `PHOTO CAPTURE → CLOUDINARY (${savedCloud?.cloudName})`
                  : 'PHOTO CAPTURE (LOCAL + CLOUDINARY)'}
              </span>
              {pendingFile && (
                <button
                  type="button"
                  onClick={() => setPendingFile(null)}
                  className="text-[11.5px] cursor-pointer"
                  style={{ color: 'var(--os-crimson)' }}
                >
                  Chụp lại / Xóa ảnh
                </button>
              )}
            </div>

            {/* 1. Live Camera Viewfinder */}
            {cameraActive && (
              <div className="space-y-2.5">
                <div className="relative rounded-[10px] overflow-hidden aspect-[4/3] bg-black">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`w-full h-full object-cover ${
                      facingMode === 'user' ? 'scale-x-[-1]' : ''
                    }`}
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        startLiveCamera(facingMode === 'environment' ? 'user' : 'environment')
                      }
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer"
                      style={{
                        backgroundColor: 'rgba(16, 17, 20, 0.75)',
                        color: 'var(--os-ivory-bright)',
                        border: '1px solid var(--os-border)',
                      }}
                    >
                      Đổi Camera ({facingMode === 'environment' ? 'Sau' : 'Trước'})
                    </button>
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer"
                      style={{
                        backgroundColor: 'rgba(16, 17, 20, 0.75)',
                        color: 'var(--os-crimson)',
                      }}
                    >
                      Đóng
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={capturePhotoFromVideo}
                  className="w-full py-2.5 rounded-[10px] text-[14px] font-semibold cursor-pointer ios-pressable"
                  style={{
                    backgroundColor: 'var(--os-brass)',
                    color: '#101114',
                  }}
                >
                  ● Bấm Chụp Ảnh Ngay
                </button>
              </div>
            )}

            {/* 2. Captured / Selected Photo Preview */}
            {!cameraActive && previewUrl && (
              <div className="space-y-2">
                <div className="relative rounded-[10px] overflow-hidden aspect-[4/3] bg-black/40">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="metadata text-[11px] text-center" style={{ color: 'var(--os-sage)' }}>
                  ✓ Đã sẵn sàng: {pendingFile?.name} (sẽ tự động nén & tải lên Cloudinary khi bấm Lưu)
                </p>
              </div>
            )}

            {/* 3. Capture Action Buttons */}
            {!cameraActive && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => startLiveCamera('environment')}
                  className="py-3 px-3 rounded-[10px] text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--os-graphite)',
                    color: 'var(--os-brass)',
                    border: '1px solid rgba(185, 155, 121, 0.35)',
                  }}
                >
                  Chụp trực tiếp bằng Camera
                </button>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="py-3 px-3 rounded-[10px] text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--os-graphite)',
                    color: 'var(--os-dusty-blue)',
                    border: '1px solid var(--os-border)',
                  }}
                >
                  Chọn ảnh từ máy / Dán Ctrl+V
                </button>
              </div>
            )}

            {cameraError && (
              <p className="text-[12px]" style={{ color: 'var(--os-brass)' }}>
                {cameraError}
              </p>
            )}

            {/* Hidden Native File & Camera Inputs */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                if (f) setPendingFile(f);
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
                if (f) setPendingFile(f);
              }}
            />
          </div>

          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={modalType === 'drawing' ? 'Chủ đề tranh vẽ...' : 'Tiêu đề buổi bơi...'}
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[15px]"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[12px] text-[var(--ios-label-secondary)]">Thời lượng (phút)</label>
              <input
                type="number"
                min={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-[10px] ios-fill text-[15px] tabular-nums"
              />
            </div>

            {modalType === 'swimming' && (
              <div>
                <label className="text-[12px] text-[var(--ios-label-secondary)]">Cự ly (mét)</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={distanceMeters}
                  onChange={(e) => setDistanceMeters(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-[10px] ios-fill text-[15px] tabular-nums"
                />
              </div>
            )}
          </div>

          {modalType === 'swimming' && (
            <input
              type="text"
              value={stroke}
              onChange={(e) => setStroke(e.target.value)}
              placeholder="Kiểu bơi (Bơi ếch, Bơi sải...)"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
            />
          )}

          <textarea
            rows={2}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Ghi chú cảm xúc hoặc chi tiết buổi hôm nay..."
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-[12px] text-[15px] font-semibold ios-pressable cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: 'var(--os-brass)',
              color: '#101114',
            }}
          >
            {saving
              ? pendingFile && cloudReady
                ? 'Đang tải ảnh lên Cloudinary...'
                : 'Đang lưu...'
              : pendingFile && cloudReady
              ? 'Lưu & Tải ảnh lên Cloudinary (+25 XP)'
              : 'Lưu kỷ niệm (+25 XP)'}
          </button>
        </form>
      </Modal>

      {/* ================================================================
          CLOUDINARY CONFIGURATION MODAL
          ================================================================ */}
      <Modal
        open={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
        title="Cấu hình Cloudinary Storage"
      >
        <form onSubmit={handleSaveCloudConfig} className="space-y-4">
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
            Nhập <strong>Cloud Name</strong> cùng <strong>Upload Preset (Unsigned)</strong> hoặc cặp{' '}
            <strong>API Key + API Secret</strong> từ Cloudinary Dashboard. Mọi bức ảnh chụp ở mục Vẽ, Đi bơi, Sách và AI Workflow sẽ tự động được lưu lên Cloudinary.
          </p>

          <div className="space-y-1">
            <label className="metadata text-[11px] uppercase">Cloud Name (Bắt buộc)</label>
            <input
              type="text"
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              placeholder="Ví dụ: dxyz12345"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
            />
          </div>

          <div className="space-y-1">
            <label className="metadata text-[11px] uppercase">
              Cách 1: Upload Preset (Chế độ Unsigned — Khuyên dùng)
            </label>
            <input
              type="text"
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              placeholder="Ví dụ: noetrix_unsigned"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
            />
            <p className="text-[11.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
              Tạo trong Cloudinary Settings → Upload → Upload presets → Add upload preset (Signing Mode: Unsigned).
            </p>
          </div>

          <div
            className="p-3.5 rounded-[10px] space-y-2.5"
            style={{
              backgroundColor: 'var(--os-obsidian)',
              border: '1px solid var(--os-border)',
            }}
          >
            <p className="metadata text-[10.5px] uppercase" style={{ color: 'var(--os-brass)' }}>
              Cách 2: Hoặc dùng API Key + API Secret (Tự động ký SHA-1)
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
            <label className="metadata text-[11px] uppercase">Thư mục trên Cloudinary (Folder)</label>
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
              Lưu cấu hình Cloudinary
            </button>
            {cloudReady && (
              <button
                type="button"
                onClick={() => {
                  saveLocalCloudinaryConfig(null);
                  setCloudConfigTick((t) => t + 1);
                  setCloudModalOpen(false);
                  showToast('Đã ngắt kết nối Cloudinary', 'info');
                }}
                className="px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--os-stone)',
                  color: 'var(--os-crimson)',
                }}
              >
                Gỡ
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* ================================================================
          FULL-SCREEN LIGHTBOX FOR HOBBY PHOTOS
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
                Mở link gốc Cloudinary ↗
              </a>
            )}
            <button
              type="button"
              onClick={() => setLightboxLog(null)}
              className="px-4 py-2 rounded-full bg-white/15 text-white text-[13px] font-medium cursor-pointer"
            >
              Đóng
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
            <p className="font-editorial text-[18px] text-white">{lightboxLog.title}</p>
            {lightboxLog.details && (
              <p className="text-[13.5px] text-white/75 max-w-xl">{lightboxLog.details}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
