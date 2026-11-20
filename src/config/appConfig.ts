/**
 * NOETRIX — SOURCE CODE CONFIGURATION
 * Toàn bộ cấu hình hệ thống (Identity, Cloudinary, Firebase, Ambient) được lưu trực tiếp
 * tại file source code này (hoặc qua biến môi trường .env.local) thay vì hiển thị menu cài đặt trên giao diện.
 */

const env = import.meta.env;

export const APP_CONFIG = {
  identity: {
    appName: 'NOETRIX',
    tagline: 'THE ART OF BECOMING',
    motto: 'Curious by nature. Mischievous by design. Pure in pursuit.',
    subMotto: 'A mind without boundaries, a soul without a destination.',
    pillars: 'THINK · DISCOVER · CREATE · BECOME',
    theme: 'dark' as const,
    soundEnabled: true,
  },

  /**
   * Cấu hình Cloudinary để tự động lưu ảnh chụp (Vẽ, Đi bơi, Trang sách, AI Workflow)
   * Bạn có thể điền trực tiếp vào đây hoặc điền trong file .env.local
   */
  cloudinary: {
    cloudName: (env.VITE_CLOUDINARY_CLOUD_NAME || '').trim(),
    uploadPreset: (env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim(),
    apiKey: (env.VITE_CLOUDINARY_API_KEY || '').trim(),
    apiSecret: (env.VITE_CLOUDINARY_API_SECRET || '').trim(),
    folder: (env.VITE_CLOUDINARY_FOLDER || 'noetrix').trim(),
  },

  /**
   * Cấu hình Firebase Cloud (Tùy chọn nếu muốn đồng bộ thêm lên Firebase)
   */
  firebase: {
    apiKey: (env.VITE_FIREBASE_API_KEY || '').trim(),
    authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
    projectId: (env.VITE_FIREBASE_PROJECT_ID || '').trim(),
    storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
    messagingSenderId: (env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
    appId: (env.VITE_FIREBASE_APP_ID || '').trim(),
  },

  /**
   * Tự động cập nhật số Badge & thông báo Màn hình khóa ngầm trong source code
   */
  ambient: {
    autoSyncBadgeAndLockScreen: true,
    autoSaveToSourceCodeJson: true,
  },
};
