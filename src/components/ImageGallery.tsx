import React, { useEffect, useState, useRef } from 'react';
import type { MediaAttachmentRef } from '../types';
import {
  compressImageFile,
  saveMediaLocalAndMaybeUpload,
  resolveMediaPlayableUrl,
  deleteMediaBlob,
} from '../lib/media';
import { useToast } from './ui/Primitives';

export function ResolvedImage({
  mediaId,
  remoteUrl,
  alt,
  className = '',
  onClick,
}: {
  mediaId?: string;
  remoteUrl?: string;
  alt: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let active = true;
    let revokeFn = () => {};
    resolveMediaPlayableUrl(mediaId, remoteUrl).then((res) => {
      if (!active) {
        res?.revoke();
        return;
      }
      if (res) {
        setSrc(res.url);
        revokeFn = res.revoke;
      }
    });
    return () => {
      active = false;
      revokeFn();
    };
  }, [mediaId, remoteUrl]);

  if (!src) {
    return (
      <div className={`ios-fill animate-pulse flex items-center justify-center ${className}`}>
        <span className="text-[12px] text-[var(--ios-label-secondary)]">Đang tải ảnh...</span>
      </div>
    );
  }

  return <img src={src} alt={alt} onClick={onClick} className={className} loading="lazy" />;
}

export function ImageGallery({
  images,
  onChange,
  label = 'Hình ảnh minh họa / Sơ đồ',
}: {
  images: MediaAttachmentRef[];
  onChange: (next: MediaAttachmentRef[]) => void;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<MediaAttachmentRef | null>(null);
  const { showToast } = useToast();

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const added: MediaAttachmentRef[] = [];
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith('image/')) continue;
        const { blob, fileName } = await compressImageFile(file);
        const { mediaId, remoteUrl } = await saveMediaLocalAndMaybeUpload('image', blob, fileName);
        added.push({
          mediaId,
          fileName,
          caption: '',
          remoteUrl,
          createdAt: Date.now(),
        });
      }
      if (added.length > 0) {
        onChange([...images, ...added]);
        showToast(`Đã thêm ${added.length} hình ảnh`);
      }
    } catch (err) {
      console.error(err);
      showToast('Không thể lưu ảnh, thử lại nhé!', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async (mediaId: string) => {
    await deleteMediaBlob(mediaId);
    onChange(images.filter((im) => im.mediaId !== mediaId));
    showToast('Đã xóa ảnh', 'info');
  };

  const handleCaptionChange = (mediaId: string, caption: string) => {
    onChange(images.map((im) => (im.mediaId === mediaId ? { ...im, caption } : im)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="ios-section-header">
          {label} ({images.length})
        </span>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="px-3.5 py-1.5 rounded-full text-white text-[13px] font-medium ios-pressable cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--ios-blue)' }}
        >
          {uploading ? 'Đang xử lý...' : '+ Thêm ảnh'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full py-6 px-4 rounded-[12px] ios-fill flex flex-col items-center justify-center gap-1 ios-pressable cursor-pointer"
        >
          <span className="text-[14px] font-medium" style={{ color: 'var(--ios-blue)' }}>
            Chạm để thêm sơ đồ workflow hoặc ảnh chụp màn hình
          </span>
          <span className="text-[12px] text-[var(--ios-label-secondary)]">
            Tự động nén gọn để đồng bộ nhanh trên iPhone & Firebase
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {images.map((img) => (
            <div key={img.mediaId} className="rounded-[12px] overflow-hidden ios-fill">
              <div className="relative aspect-video bg-black/20 overflow-hidden">
                <ResolvedImage
                  mediaId={img.mediaId}
                  remoteUrl={img.remoteUrl}
                  alt={img.caption || img.fileName}
                  onClick={() => setLightbox(img)}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLightbox(img)}
                    className="px-2.5 py-1 rounded-full bg-black/65 text-white text-[11px] font-medium cursor-pointer"
                  >
                    Xem lớn
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(img.mediaId)}
                    className="px-2.5 py-1 rounded-full text-white text-[11px] font-medium cursor-pointer"
                    style={{ backgroundColor: 'var(--ios-red)' }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
              <div className="p-2.5">
                <input
                  type="text"
                  value={img.caption}
                  onChange={(e) => handleCaptionChange(img.mediaId, e.target.value)}
                  placeholder="Chú thích hình ảnh..."
                  className="w-full bg-transparent text-[13px] placeholder:text-[var(--ios-label-tertiary)]"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 px-4 py-2 rounded-full bg-white/15 text-white text-[13px] font-medium cursor-pointer"
          >
            Đóng
          </button>
          <ResolvedImage
            mediaId={lightbox.mediaId}
            remoteUrl={lightbox.remoteUrl}
            alt={lightbox.caption || lightbox.fileName}
            className="max-w-full max-h-[82dvh] object-contain rounded-[12px]"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.caption && (
            <p className="mt-3 text-[14px] text-white/80 text-center max-w-xl">{lightbox.caption}</p>
          )}
        </div>
      )}
    </div>
  );
}
