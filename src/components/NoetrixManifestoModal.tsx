import React from 'react';
import { Modal } from './ui/Primitives';

const SEVEN_LAYERS = [
  { trait: 'Intelligence', meaning: 'Thông minh, thích tìm bản chất' },
  { trait: 'Agility', meaning: 'Lanh lẹ, nhạy bén, thích nghi' },
  { trait: 'Rationality', meaning: 'Lý trí, hoài nghi, có tư duy phản biện' },
  { trait: 'Versatility', meaning: 'Đa tài, không chịu bị đóng khung' },
  { trait: 'Mischief', meaning: 'Tinh quái, có chút xấu tính đáng yêu' },
  { trait: 'Purity', meaning: 'Tâm hồn trong sạch, có nguyên tắc riêng' },
  { trait: 'Mystery', meaning: 'Theo đuổi một điều chưa thể gọi tên' },
];

const THREE_ROOTS = [
  {
    root: 'Noesis',
    desc: 'Nhận thức, tư duy và khả năng thấu hiểu bản chất.',
  },
  {
    root: 'Trickster',
    desc: 'Sự tinh quái, lanh lẹ, nghịch ngợm và không đi theo lối mòn.',
  },
  {
    root: 'X',
    desc: 'Ẩn số, những khả năng chưa được khám phá và đích đến chưa có tên.',
  },
];

export function NoetrixManifestoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="NOETRIX · The Lexicon" maxWidth="max-w-2xl">
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
              THE ART OF BECOMING
            </p>
          </div>

          <div className="h-[1px] w-full" style={{ backgroundColor: 'var(--os-border)' }} />

          <div className="space-y-2.5">
            <p
              className="font-editorial text-[21px] sm:text-[25px] leading-snug"
              style={{ color: 'var(--os-ivory-bright)' }}
            >
              Curious by nature. Mischievous by design. Pure in pursuit.
            </p>
            <p className="text-[13.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
              A mind without boundaries, a soul without a destination.
            </p>
            <p
              className="metadata text-[10.5px] uppercase tracking-[0.22em] pt-2"
              style={{ color: 'var(--os-brass)' }}
            >
              THINK · DISCOVER · CREATE · BECOME
            </p>
          </div>
        </div>

        {/* Dictionary Definition */}
        <div className="space-y-2.5 px-1">
          <p className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
            /nō-ē-triks/ · NOUN · AN INVENTED WORD
          </p>
          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--os-ivory-bright)' }}>
            <strong>Noetrix</strong> — Một tâm trí sắc bén, tinh quái và đa diện, luôn tò mò trước những điều chưa biết; dùng lý trí để khám phá thế giới nhưng vẫn giữ một la bàn tâm hồn hướng về điều tốt đẹp.
          </p>
          <p className="text-[13.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
            Noetrix không định nghĩa một người đã trở thành ai. Nó định nghĩa một người luôn trong quá trình trở thành.
          </p>
        </div>

        {/* Three Etymological Roots */}
        <div className="space-y-2.5">
          <p className="editorial-eyebrow px-1">Nguồn cảm hứng từ nguyên</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THREE_ROOTS.map((item, idx) => (
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
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Seven Layers of NOETRIX */}
        <div className="space-y-2.5">
          <p className="editorial-eyebrow px-1">Bảy tầng ý nghĩa của NOETRIX</p>
          <div
            className="rounded-[12px] overflow-hidden divide-y divide-[var(--os-border)]"
            style={{
              backgroundColor: 'var(--os-obsidian)',
              border: '1px solid var(--os-border)',
            }}
          >
            {SEVEN_LAYERS.map((layer, idx) => (
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
                  {layer.meaning}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
