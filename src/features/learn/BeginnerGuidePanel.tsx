import React from 'react';
import { useLanguage } from '../../lib/i18n';
import type { BeginnerTopicGuide } from './osBeginnerGuides';

/**
 * Renders an accessible, zero-prerequisite step-by-step guide (analogy, rationale,
 * step-by-step mechanics, plain-language jargon glossary, and core takeaway).
 */
export function BeginnerGuidePanel({
  guide,
  accentColor,
}: {
  guide?: BeginnerTopicGuide;
  accentColor: string;
}) {
  const { t } = useLanguage();
  if (!guide) return null;

  return (
    <div
      className="rounded-[12px] p-4 sm:p-5 space-y-5"
      style={{
        backgroundColor: '#13161D',
        border: `1px solid color-mix(in srgb, ${accentColor} 28%, rgba(255, 255, 255, 0.08))`,
      }}
    >
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-medium px-2.5 py-0.5 rounded-[6px]"
            style={{
              backgroundColor: `color-mix(in srgb, ${accentColor} 16%, transparent)`,
              color: accentColor,
            }}
          >
            {t('Step-by-step guide', 'Hướng dẫn từ con số 0')}
          </span>
        </div>
      </div>

      {/* 1. Ví dụ đời thường */}
      <div className="space-y-1.5">
        <h3 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: '#EDEAE2' }}>
          <span style={{ color: accentColor }}>01.</span>
          <span>{t('Everyday Analogy (Zero Background Needed)', 'Hình dung đời thường (Cho người chưa biết gì)')}</span>
        </h3>
        <p className="text-[14px] leading-[1.65] text-[#d5dae3]">{guide.analogy}</p>
      </div>

      {/* 2. Tại sao cần sinh ra nó */}
      <div className="space-y-1.5">
        <h3 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: '#EDEAE2' }}>
          <span style={{ color: accentColor }}>02.</span>
          <span>{t('Why Does This Exist?', 'Vấn đề ban đầu & Tại sao cần sinh ra nó?')}</span>
        </h3>
        <p className="text-[14px] leading-[1.65] text-[#c7cdd8]">{guide.whyNeeded}</p>
      </div>

      {/* 3. Giải thích cặn kẽ từng bước */}
      <div className="space-y-2">
        <h3 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: '#EDEAE2' }}>
          <span style={{ color: accentColor }}>03.</span>
          <span>{t('Step-by-Step Deep Breakdown', 'Giải thích cặn kẽ từng bước bản chất')}</span>
        </h3>
        <div className="space-y-2.5">
          {guide.deepExplanation.map((para, idx) => (
            <div
              key={idx}
              className="p-3 rounded-[9px] text-[14px] leading-[1.65] text-[#d5dae3]"
              style={{
                backgroundColor: '#101218',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {para}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Từ điển giải nghĩa tiếng Anh bình dân */}
      {guide.jargonBuster.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: '#EDEAE2' }}>
            <span style={{ color: accentColor }}>04.</span>
            <span>{t('Plain-Language Glossary', 'Giải mã thuật ngữ dễ hiểu')}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {guide.jargonBuster.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[9px] space-y-1"
                style={{
                  backgroundColor: '#101218',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <p className="text-[14px] font-semibold" style={{ color: accentColor }}>
                  {item.term}
                </p>
                <p className="text-[13px] leading-[1.6] text-[#bfc6d4]">{item.plain}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Chốt lại 1 câu cốt lõi */}
      <div
        className="p-3.5 rounded-[10px]"
        style={{
          backgroundColor: `color-mix(in srgb, ${accentColor} 11%, #101218)`,
          border: `1px solid color-mix(in srgb, ${accentColor} 35%, transparent)`,
        }}
      >
        <p className="text-[11px] font-medium mb-1" style={{ color: accentColor }}>
          {t('Core takeaway', 'Chốt ý cốt lõi')}
        </p>
        <p className="text-[14px] font-medium leading-[1.65] text-[#f2efe8]">
          {guide.takeaway}
        </p>
      </div>
    </div>
  );
}
