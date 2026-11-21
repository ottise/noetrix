import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, createId } from '../db/database';
import { initFirebaseIfConfigured } from './firebase';
import {
  isCloudinaryConfigured,
  uploadBlobToCloudinary,
  getCloudinaryConfig,
  saveCloudinaryConfig,
} from './cloudinary';
import type { LocalMediaBlob } from '../types';

export { isCloudinaryConfigured, getCloudinaryConfig, saveCloudinaryConfig };

/** Detect iOS / iPadOS Safari & WebKit where WebM audio playback is unsupported or unreliable */
export function isIosWebKit(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /iP(hone|ad|od)/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** Rewrite Cloudinary .webm audio/video URLs to f_mp3 when needed on iOS Safari */
export function getIosSafeAudioUrl(url?: string): string | undefined {
  if (!url) return url;
  if (!isIosWebKit()) return url;
  if (
    url.includes('res.cloudinary.com/') &&
    url.includes('/upload/') &&
    /\.webm($|\?)/i.test(url) &&
    !/\/f_(mp3|aac|mp4|m4a)\b/i.test(url)
  ) {
    return url.replace('/upload/', '/upload/f_mp3/').replace(/\.webm($|\?)/i, '.mp3$1');
  }
  return url;
}

/** Pick the safest MediaRecorder MIME type across iOS Safari (mp4) and Desktop Chrome/Edge (webm) */
export function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

/** Compress large iPhone / PC screenshots to keep IndexedDB & Cloudinary super fast */
export async function compressImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<{ blob: Blob; mimeType: string; fileName: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ blob: file, mimeType: file.type || 'image/jpeg', fileName: file.name });
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (out) => {
          if (!out) {
            resolve({ blob: file, mimeType: file.type || 'image/jpeg', fileName: file.name });
          } else {
            const base = (file.name || 'capture').replace(/\.[^.]+$/, '');
            resolve({
              blob: out,
              mimeType: 'image/jpeg',
              fileName: `${base}.jpg`,
            });
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob: file, mimeType: file.type || 'image/jpeg', fileName: file.name || 'capture.jpg' });
    };
    img.src = url;
  });
}

export async function saveMediaLocalAndMaybeUpload(
  kind: 'image' | 'audio',
  blob: Blob,
  fileName: string,
  options?: { subFolder?: string; requireCloudinary?: boolean }
): Promise<{
  mediaId: string;
  remoteUrl?: string;
  provider?: 'cloudinary' | 'firebase' | 'local';
  uploadError?: string;
}> {
  const mediaId = createId(kind === 'image' ? 'img' : 'aud');
  const mimeType = blob.type || (kind === 'image' ? 'image/jpeg' : 'audio/mp4');

  const record: LocalMediaBlob = {
    id: mediaId,
    kind,
    mimeType,
    blob,
    fileName,
    size: blob.size,
    createdAt: Date.now(),
  };

  await db.mediaBlobs.put(record);

  let remoteUrl: string | undefined;
  let provider: 'cloudinary' | 'firebase' | 'local' = 'local';
  let uploadError: string | undefined;

  // 1. Primary Cloud Storage: Cloudinary (when configured)
  if (isCloudinaryConfigured()) {
    try {
      const res = await uploadBlobToCloudinary(
        blob,
        fileName,
        options?.subFolder || (kind === 'image' ? 'photos' : 'audio')
      );
      remoteUrl = res.secureUrl;
      provider = 'cloudinary';
      await db.mediaBlobs.update(mediaId, { remoteUrl });
      return { mediaId, remoteUrl, provider };
    } catch (err) {
      uploadError = err instanceof Error ? err.message : 'Lỗi tải ảnh lên Cloudinary';
      console.warn('Cloudinary upload error (kept in local IndexedDB):', err);
      if (options?.requireCloudinary) {
        throw err;
      }
    }
  }

  // 2. Fallback Cloud Storage: Firebase Storage (if authenticated)
  try {
    const { auth, storage } = initFirebaseIfConfigured();
    if (auth?.currentUser && storage) {
      const uid = auth.currentUser.uid;
      const ext = fileName.split('.').pop() || (kind === 'image' ? 'jpg' : 'm4a');
      const storageRef = ref(storage, `users/${uid}/media/${mediaId}.${ext}`);
      await uploadBytes(storageRef, blob, { contentType: mimeType });
      remoteUrl = await getDownloadURL(storageRef);
      provider = 'firebase';
      await db.mediaBlobs.update(mediaId, { remoteUrl });
    }
  } catch (err) {
    console.warn('Media stored locally (Firebase Storage upload skipped):', err);
  }

  return { mediaId, remoteUrl, provider, uploadError };
}

/** Push an existing local IndexedDB media blob to Cloudinary on demand */
export async function syncLocalMediaToCloudinary(
  mediaId: string,
  subFolder = 'hobbies'
): Promise<string> {
  const local = await db.mediaBlobs.get(mediaId);
  if (!local?.blob) {
    throw new Error('Không tìm thấy dữ liệu ảnh gốc trong bộ nhớ máy.');
  }
  const res = await uploadBlobToCloudinary(local.blob, local.fileName || `${mediaId}.jpg`, subFolder);
  await db.mediaBlobs.update(mediaId, { remoteUrl: res.secureUrl });
  return res.secureUrl;
}

export async function resolveMediaPlayableUrl(
  mediaId?: string,
  remoteUrl?: string
): Promise<{ url: string; revoke: () => void } | null> {
  if (mediaId) {
    const local = await db.mediaBlobs.get(mediaId);
    const localIsIncompatibleWebm =
      isIosWebKit() && Boolean(local?.mimeType?.includes('webm') && (local?.remoteUrl || remoteUrl));
    if (local?.blob && !localIsIncompatibleWebm) {
      const url = URL.createObjectURL(local.blob);
      return { url, revoke: () => URL.revokeObjectURL(url) };
    }
    const safeRemote = getIosSafeAudioUrl(local?.remoteUrl || remoteUrl);
    if (safeRemote) {
      return { url: safeRemote, revoke: () => {} };
    }
  }
  const safeRemote = getIosSafeAudioUrl(remoteUrl);
  if (safeRemote) {
    return { url: safeRemote, revoke: () => {} };
  }
  return null;
}

export async function deleteMediaBlob(mediaId: string): Promise<void> {
  await db.mediaBlobs.delete(mediaId);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
