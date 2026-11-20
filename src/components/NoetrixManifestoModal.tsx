import React from 'react';
import { useLanguage } from '../lib/i18n';
import { Modal } from './ui/Primitives';

const SEVEN_LAYERS_DATA = [
  {
    trait: 'Intelligence',
    en: 'Sharp mind, drawn to first principles',
    vi: 'Thông minh, thích tìm bản chất',
  },
  {
    trait: 'Agility',
    en: 'Quick, observant, adaptable',
    vi: 'Lanh lẹ, nhạy bén, thích nghi',
  },
  {
    trait: 'Rationality',
    en: 'Reasoned, skeptical, critical thinker',
    vi: 'Lý trí, hoài nghi, có tư duy phản biện',
  },
  {
    trait: 'Versatility',
    en: 'Multifaceted, refuses to be boxed in',
    vi: 'Đa tài, không chịu bị đóng khung',
  },
  {
    trait: 'Mischief',
    en: 'Playful edge with endearing wit',
    vi: 'Tinh quái, có chút xấu tính đáng yêu',
  },
  {
    trait: 'Purity',
    en: 'Clear spirit anchored in personal principles',
    vi: 'Tâm hồn trong sạch, có nguyên tắc riêng',
  },
  {
    trait: 'Mystery',
    en: 'Pursuing something still unnamed',
    vi: 'Theo đuổi một điều chưa thể gọi tên',
  },
];

const THREE_ROOTS_DATA = [
  {
    root: 'Noesis',
    en: 'Cognition, thought, and the capacity to grasp essence.',
    vi: 'Nhận thức, tư duy và khả năng thấu hiểu bản chất.',
  },
  {
    root: 'Trickster',
    en: 'Wit, nimbleness, playfulness, and stepping off worn paths.',
    vi: 'Sự tinh quái, lanh lẹ, nghịch ngợm và không đi theo lối mòn.',
  },
  {
    root: 'X',
    en: 'The unknown variable, uncharted possibilities, and an unnamed destination.',
    vi: 'Ẩn số, những khả năng chưa được khám phá và đích đến chưa có tên.',
  },
];

export function NoetrixManifestoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lang, t } = useLanguage();
  return (
    <Modal open={open} onClose={onClose} title={t('NOETRIX · The Lexicon', 'NOETRIX · Từ Điển Bản Thể')} maxWidth="max-w-2xl">
      <div className="space-y-8 py-2">
        {/* Hero Crest — SF Pro Display Semibold (Logo) + SF Pro Display Medium (Heading) + SF Pro Text + SF Mono */}
        <div
          className="p-6 sm:p-8 rounded-[14px] text-center space-y-5"
          style={{
            backgroundColor: 'var(--os-obsidian)',
            border: '1px solid var(--os-border)',
          }}
        >
          <div className="space-y-1.5">
            <h2
              className="noetrix-logo text-[36px] sm:text-[42px] leading-none"
              style={{ color: 'var(--os-ivory-bright)' }}
            >
              NOETRIX
            </h2>
            <p
              className="metadata text-[11px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--os-brass)' }}
            >
              {t('THE ART OF BECOMING', 'NGHỆ THUẬT TRỞ THÀNH')}
            </p>
          </div>

          <div className="h-[1px] w-full" style={{ backgroundColor: 'var(--os-border)' }} />

          <div className="space-y-2.5">
            <p
              className="font-editorial text-[21px] sm:text-[25px] leading-snug"
              style={{ color: 'var(--os-ivory-bright)' }}
            >
              {t(
                'Curious by nature. Mischievous by design. Pure in pursuit.',
                'Tò mò bẩm sinh. Tinh nghịch có chủ đích. Thuần khiết trong hành trình.'
              )}
            </p>
            <p className="text-[13.5px] italic" style={{ color: 'var(--os-ivory-muted)' }}>
              {t(
                'A restless mind, an untamed imagination, and a soul forever in the making.',
                'Một tâm trí không ngừng trăn trở, một trí tưởng tượng không bị thuần hóa, và một tâm hồn mãi đang thành hình.'
              )}
            </p>
            <p
              className="metadata text-[10.5px] uppercase tracking-[0.22em] pt-2"
              style={{ color: 'var(--os-brass)' }}
            >
              {t(
                'THINK · WANDER · QUESTION · CREATE · BECOME',
                'SUY TƯ · LANG THANG · CHẤT VẤN · KIẾN TẠO · TRỞ THÀNH'
              )}
            </p>
          </div>
        </div>

        {/* Dictionary Definition */}
        <div className="space-y-3 px-1">
          <p className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
            {t('/NŌ-É-TRĬKS/ · NOUN · AN INVENTED WORD', '/NŌ-É-TRĬKS/ · DANH TỪ · TỪ TỰ TẠO')}
          </p>
          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--os-ivory-bright)' }}>
            <strong>Noetrix</strong> —{' '}
            {t(
              'A curious mind with a taste for the extraordinary; sharp in thought, playful in spirit, and boundless in imagination.',
              'Một tâm trí tò mò với gu thẩm mỹ dành cho những điều phi thường; sắc bén trong tư duy, tinh nghịch trong tinh thần và vô biên trong trí tưởng tượng.'
            )}
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
            {t(
              'An ever-evolving interplay of intellect and intuition, reason and wonder. A mind that questions the obvious, wanders beyond the familiar, and finds beauty in the pursuit of things yet unknown.',
              'Sự giao thoa không ngừng tiến hóa giữa trí tuệ và trực giác, lý trí và sự kinh ngạc. Một tâm trí biết chất vấn điều hiển nhiên, bước ra ngoài vùng quen thuộc, và tìm thấy vẻ đẹp trong hành trình theo đuổi những điều chưa từng biết.'
            )}
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
            {t(
              'Neither confined by convention nor defined by destination. It embraces contradiction, welcomes uncertainty, and finds its meaning in the freedom to explore, create, and reinvent.',
              'Không bị trói buộc bởi quy chuẩn cũ kỹ, cũng chẳng bị định nghĩa bởi bất kỳ đích đến cố định nào. Nó đón nhận sự mâu thuẫn, chào đón điều bất định, và tìm thấy ý nghĩa trong sự tự do khám phá, sáng tạo và tái định nghĩa chính mình.'
            )}
          </p>
          <p className="text-[14.5px] font-semibold leading-relaxed pt-1" style={{ color: 'var(--os-ivory-bright)' }}>
            {t(
              'Noetrix is not who one has become, but the endless possibility of who one might yet be.',
              'Noetrix không phải là con người bạn đã trở thành, mà là khả năng vô tận của phiên bản bạn có thể vươn tới.'
            )}
          </p>
        </div>

        {/* Three Etymological Roots */}
        <div className="space-y-2.5">
          <p className="editorial-eyebrow px-1">{t('Etymological Roots', 'Nguồn cảm hứng từ nguyên')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THREE_ROOTS_DATA.map((item, idx) => (
              <div
                key={item.root}
                className="p-4 rounded-[12px] space-y-1.5"
                style={{
                  backgroundColor: 'var(--os-obsidian)',
                  border: '1px solid var(--os-border)',
                }}
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-editorial text-[20px]" style={{ color: 'var(--os-brass)' }}>
                    {item.root}
                  </p>
                  <span className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    0{idx + 1}
                  </span>
                </div>
                <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                  {lang === 'en' ? item.en : item.vi}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Seven Layers of NOETRIX */}
        <div className="space-y-2.5">
          <p className="editorial-eyebrow px-1">{t('Seven Layers of NOETRIX', 'Bảy tầng ý nghĩa của NOETRIX')}</p>
          <div
            className="rounded-[12px] overflow-hidden divide-y divide-[var(--os-border)]"
            style={{
              backgroundColor: 'var(--os-obsidian)',
              border: '1px solid var(--os-border)',
            }}
          >
            {SEVEN_LAYERS_DATA.map((layer, idx) => (
              <div
                key={layer.trait}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="metadata text-[11px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    0{idx + 1}
                  </span>
                  <span className="font-editorial text-[17px]" style={{ color: 'var(--os-ivory-bright)' }}>
                    {layer.trait}
                  </span>
                </div>
                <span className="text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                  {lang === 'en' ? layer.en : layer.vi}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
