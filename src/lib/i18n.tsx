import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { WorkspaceId } from '../types';

export type AppLanguage = 'en' | 'vi';

const LANG_STORAGE_KEY = 'noetrix_language_v1';

export function getAppLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
  } catch {
    // ignore storage access issues
  }
  return 'en';
}

export function tr(en: string, vi: string, lang: AppLanguage = getAppLanguage()): string {
  return lang === 'en' ? en : vi;
}

export interface RoomLocaleMeta {
  id: WorkspaceId;
  index: string;
  label: string;
  mobileLabel: string;
  micro: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function getRoomsMeta(lang: AppLanguage): RoomLocaleMeta[] {
  const t = (en: string, vi: string) => (lang === 'en' ? en : vi);
  return [
    {
      id: 'home',
      index: '00',
      label: t('Home', 'Trang Chủ'),
      mobileLabel: t('Home', 'Chính'),
      micro: t('Sanctuary & Daily Orbit', 'Không gian & Nhịp sống ngày'),
      eyebrow: t('THE LIVING SPACE / 00', 'KHÔNG GIAN SỐNG / 00'),
      title: t('Home.', 'Trang Chủ.'),
      subtitle: t('Your private digital room.', 'Căn phòng số riêng tư của bạn.'),
    },
    {
      id: 'learning',
      index: '01',
      label: t('The Lab', 'Phòng Lab'),
      mobileLabel: t('Lab', 'Lab'),
      micro: t('Research & Deep Systems', 'Nghiên cứu & Hệ thống sâu'),
      eyebrow: t('YOUR RESEARCH SPACE / 01', 'KHÔNG GIAN NGHIÊN CỨU / 01'),
      title: t('The Lab.', 'The Lab.'),
      subtitle: '',
    },
    {
      id: 'knowledge',
      index: '02',
      label: t('The Library', 'Thư Viện'),
      mobileLabel: t('Library', 'Thư viện'),
      micro: t('Bookshelf & Quiet Reading', 'Kệ sách & Đọc sách tĩnh lặng'),
      eyebrow: t('A READING SANCTUARY / 02', 'PHÒNG ĐỌC SÁCH / 02'),
      title: t('The Library.', 'Thư Viện Sách.'),
      subtitle: t(
        'Read slowly. Collect highlights and keep wisdom alive.',
        'Đọc chậm rãi, lưu giữ trích dẫn hay và suy ngẫm sâu.'
      ),
    },
    {
      id: 'creative',
      index: '03',
      label: t('The Studio', 'Studio Làm Việc'),
      mobileLabel: t('Studio', 'Studio'),
      micro: t('Workflows, Research & Writing', 'AI Workflow, Nghiên cứu & Sáng tác'),
      eyebrow: t('A SPACE TO WORK & CREATE / 03', 'KHÔNG GIAN LÀM VIỆC & SÁNG TẠO / 03'),
      title: t('The Studio.', 'Studio.'),
      subtitle: t(
        'Research, build AI workflows, draft manuscripts, and diagram ideas.',
        'Nghiên cứu tâm lý, soạn AI Workflow, viết kịch bản và vẽ sơ đồ.'
      ),
    },
    {
      id: 'playground',
      index: '04',
      label: t('The Playground', 'Sân Chơi'),
      mobileLabel: t('Play', 'Chơi'),
      micro: t('Logic, Chess & Play', 'Logic, Cờ vua & Giải trí'),
      eyebrow: t('QUIET LEISURE / 04', 'THƯ GIÃN TĨNH LẶNG / 04'),
      title: t('The Playground.', 'Sân Chơi.'),
      subtitle: t(
        'Take a little break. Not everything needs to be productive.',
        'Nghỉ ngơi một chút. Không phải điều gì cũng cần tạo ra năng suất.'
      ),
    },
    {
      id: 'life',
      index: '05',
      label: t('Life', 'Đời Sống'),
      mobileLabel: t('Life', 'Sống'),
      micro: t('Rhythm & Everyday Life', 'Nhịp điệu & Cuộc sống thường nhật'),
      eyebrow: t('YOUR EVERYDAY LIFE / 05', 'CUỘC SỐNG THƯỜNG NGÀY / 05'),
      title: t('Life, outside the screen.', 'Cuộc sống ngoài màn hình.'),
      subtitle: t('Take care of yourself.', 'Chăm sóc bản thân thật tốt.'),
    },
  ];
}

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (next: AppLanguage) => void;
  toggleLang: () => void;
  t: (en: string, vi: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(() => getAppLanguage());

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: AppLanguage = prev === 'en' ? 'vi' : 'en';
      try {
        localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = useCallback(
    (en: string, vi: string) => (lang === 'en' ? en : vi),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Graceful fallback if ever used outside LanguageProvider (e.g. Document PiP)
    const fallbackLang = getAppLanguage();
    return {
      lang: fallbackLang,
      setLang: () => {},
      toggleLang: () => {},
      t: (en: string, vi: string) => (fallbackLang === 'en' ? en : vi),
    };
  }
  return ctx;
}
