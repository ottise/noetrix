/**
 * NOETRIX — Cloudinary Client-Side Upload Engine
 * Supports:
 * 1. Unsigned Upload (Cloud Name + Upload Preset)
 * 2. Signed Upload (Cloud Name + API Key + API Secret via Web Crypto SHA-1)
 * Can be configured via .env.local (VITE_CLOUDINARY_*) or directly in the UI (localStorage).
 */

import { APP_CONFIG } from '../config/appConfig';

const CLOUDINARY_STORAGE_KEY = 'noetrix_cloudinary_config_v1';

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset?: string;
  apiKey?: string;
  apiSecret?: string;
  folder?: string;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export function getEnvCloudinaryConfig(): CloudinaryConfig | null {
  const { cloudName, uploadPreset, apiKey, apiSecret, folder } = APP_CONFIG.cloudinary;
  if (!cloudName) return null;
  return {
    cloudName,
    uploadPreset: uploadPreset || undefined,
    apiKey: apiKey || undefined,
    apiSecret: apiSecret || undefined,
    folder: folder || 'noetrix',
  };
}

export function getSavedCloudinaryConfig(): CloudinaryConfig | null {
  try {
    const raw = localStorage.getItem(CLOUDINARY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CloudinaryConfig;
      if (parsed?.cloudName?.trim()) {
        return {
          cloudName: parsed.cloudName.trim(),
          uploadPreset: parsed.uploadPreset?.trim() || undefined,
          apiKey: parsed.apiKey?.trim() || undefined,
          apiSecret: parsed.apiSecret?.trim() || undefined,
          folder: parsed.folder?.trim() || 'noetrix',
        };
      }
    }
  } catch {
    // ignore JSON errors
  }
  return getEnvCloudinaryConfig();
}

export function saveLocalCloudinaryConfig(cfg: CloudinaryConfig | null): void {
  if (!cfg || !cfg.cloudName.trim()) {
    localStorage.removeItem(CLOUDINARY_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    CLOUDINARY_STORAGE_KEY,
    JSON.stringify({
      cloudName: cfg.cloudName.trim(),
      uploadPreset: cfg.uploadPreset?.trim() || '',
      apiKey: cfg.apiKey?.trim() || '',
      apiSecret: cfg.apiSecret?.trim() || '',
      folder: cfg.folder?.trim() || 'noetrix',
    })
  );
}

export function getCloudinaryConfig(): {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  apiSecret?: string;
  folder: string;
} {
  const cfg = getSavedCloudinaryConfig();
  return {
    cloudName: cfg?.cloudName || '',
    uploadPreset: cfg?.uploadPreset || '',
    apiKey: cfg?.apiKey || '',
    apiSecret: cfg?.apiSecret || '',
    folder: cfg?.folder || 'noetrix',
  };
}

export function saveCloudinaryConfig(cfg: {
  cloudName: string;
  uploadPreset?: string;
  apiKey?: string;
  apiSecret?: string;
  folder?: string;
}): void {
  saveLocalCloudinaryConfig(cfg);
}

export function isCloudinaryConfigured(): boolean {
  const cfg = getSavedCloudinaryConfig();
  if (!cfg || !cfg.cloudName) return false;
  return Boolean(cfg.uploadPreset || (cfg.apiKey && cfg.apiSecret));
}

/** Generate SHA-1 hex signature in browser using Web Crypto API for Signed Uploads */
async function sha1Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload an image or audio Blob directly to Cloudinary.
 */
export async function uploadBlobToCloudinary(
  blob: Blob,
  fileName: string,
  subFolder?: string
): Promise<CloudinaryUploadResult> {
  const cfg = getSavedCloudinaryConfig();
  if (!cfg || !cfg.cloudName) {
    throw new Error('Chưa cấu hình Cloudinary Cloud Name.');
  }

  const hasPreset = Boolean(cfg.uploadPreset);
  const hasSignedCreds = Boolean(cfg.apiKey && cfg.apiSecret);
  if (!hasPreset && !hasSignedCreds) {
    throw new Error('Cần nhập Upload Preset (Unsigned) hoặc cặp API Key + API Secret của Cloudinary.');
  }

  const baseFolder = cfg.folder || 'noetrix';
  const targetFolder = subFolder ? `${baseFolder}/${subFolder}` : baseFolder;

  const formData = new FormData();
  formData.append('file', blob, fileName);

  if (hasPreset && cfg.uploadPreset) {
    formData.append('upload_preset', cfg.uploadPreset);
    formData.append('folder', targetFolder);
  } else if (cfg.apiKey && cfg.apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // Parameters to sign must be sorted alphabetically: folder, timestamp
    const toSign = `folder=${targetFolder}&timestamp=${timestamp}${cfg.apiSecret}`;
    const signature = await sha1Hex(toSign);
    formData.append('api_key', cfg.apiKey);
    formData.append('timestamp', timestamp);
    formData.append('folder', targetFolder);
    formData.append('signature', signature);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/auto/upload`;
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    const errMsg =
      data?.error?.message ||
      'Tải lên Cloudinary thất bại. Hãy kiểm tra Cloud Name hoặc Upload Preset (chế độ Unsigned).';
    throw new Error(errMsg);
  }

  return {
    secureUrl: data.secure_url || data.url,
    publicId: data.public_id,
    format: data.format,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
  };
}
