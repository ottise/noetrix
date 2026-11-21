import React, { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createId } from '../../db/database';
import { incrementTiktokRescue } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import type { WheelDuration, WheelOption } from '../../types';
import { Card, IOSListGroup, Modal, useToast } from '../../components/ui/Primitives';

const DURATION_FILTERS: { id: 'all' | WheelDuration; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'quick', label: '5–10p' },
  { id: 'medium', label: '15–20p' },
  { id: 'deep', label: '30p+' },
  { id: 'relax', label: 'Thư giãn' },
];

// Dark Academia × Obsidian & Antique Brass wheel slice palette
const APPLE_WHEEL_TONES = [
  '#1B1D22',
  '#292A2D',
  '#38322B',
  '#21262E',
  '#252A26',
  '#1B1D22',
  '#2F2B26',
  '#23272F',
  '#292A2D',
  '#342E27',
];

function playSubtleChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.05, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.36);
    });
  } catch {
    // Ignore
  }
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function SpinWheelView() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const DURATION_LABELS: Record<'all' | WheelDuration, string> = {
    all: t('All', 'Tất cả'),
    quick: t('5–10m', '5–10p'),
    medium: t('15–20m', '15–20p'),
    deep: t('30m+', '30p+'),
    relax: t('Relax', 'Thư giãn'),
  };
  const profile = useLiveQuery(() => db.profile.get('main'));
  const allOptions = useLiveQuery(() => db.wheelOptions.toArray()) || [];

  const [filter, setFilter] = useState<'all' | WheelDuration>('all');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<WheelOption | null>(null);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const [manageOpen, setManageOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCat, setNewCat] = useState('Học tập');
  const [newDuration, setNewDuration] = useState<WheelDuration>('quick');
  const [newMins, setNewMins] = useState(10);

  const timerRef = useRef<number | null>(null);

  const activeSlices = allOptions.filter(
    (o) => o.enabled && (filter === 'all' || o.duration === filter)
  );

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            setTimerRunning(false);
            if (profile?.soundEnabled) playSubtleChime();
            showToast('Hết giờ tập trung · Bấm Đã làm xong để ghi nhận', 'info');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [timerRunning, timerSeconds, profile?.soundEnabled, showToast]);

  const handleSpin = () => {
    if (spinning) return;
    if (activeSlices.length === 0) {
      showToast('Không có lựa chọn nào trong bộ lọc này!', 'info');
      return;
    }

    setSpinning(true);
    setWinner(null);
    setTimerRunning(false);
    triggerHaptic('medium');

    const chosenIndex = Math.floor(Math.random() * activeSlices.length);
    const chosen = activeSlices[chosenIndex];
    const sliceAngle = 360 / activeSlices.length;
    const sliceCenter = chosenIndex * sliceAngle + sliceAngle / 2;
    const jitter = (Math.random() - 0.5) * sliceAngle * 0.55;
    const targetMod = (360 - ((sliceCenter + jitter) % 360) + 360) % 360;

    const currentMod = ((rotation % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    const fullSpins = 5 * 360;
    const nextRotation = rotation + fullSpins + delta;

    setRotation(nextRotation);

    window.setTimeout(() => {
      setSpinning(false);
      setWinner(chosen);
      setTimerSeconds(chosen.suggestedMinutes * 60);
      triggerHaptic('success');
      if (profile?.soundEnabled) playSubtleChime();
    }, 3600);
  };

  const completeQuest = async () => {
    if (!winner) return;
    setTimerRunning(false);
    await incrementTiktokRescue(0);
    showToast(`Hoàn thành: ${winner.label}`);
    setWinner(null);
  };

  const addCustomSlice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const item: WheelOption = {
      id: createId('wh'),
      label: newLabel.trim(),
      category: newCat.trim() || 'Tùy chọn',
      duration: newDuration,
      suggestedMinutes: Math.max(3, Number(newMins) || 10),
      color: APPLE_WHEEL_TONES[allOptions.length % APPLE_WHEEL_TONES.length],
      enabled: true,
      xpReward: newDuration === 'deep' ? 40 : newDuration === 'medium' ? 30 : 25,
    };
    await db.wheelOptions.put(item);
    setNewLabel('');
    showToast('Đã thêm lựa chọn mới');
  };

  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;

  return (
    <div className="space-y-5">
      {/* Summary Header Card */}
      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] text-[var(--ios-label-secondary)]">
            {t('TikTok Rescues Completed', 'Số lần tự cứu khỏi TikTok')}
          </p>
          <p
            className="text-[28px] leading-[34px] font-bold tabular-nums mt-0.5"
            style={{ color: 'var(--ios-green)' }}
          >
            {profile?.tiktokRescues || 0}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setManageOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-full ios-fill text-[13px] font-medium ios-pressable cursor-pointer"
          style={{ color: 'var(--ios-blue)' }}
        >
          {t('Customize Slices', 'Tùy chỉnh ô')}
        </button>
      </Card>

      {/* Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {DURATION_FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              disabled={spinning}
              onClick={() => {
                triggerHaptic('selection');
                setFilter(f.id);
                setWinner(null);
              }}
              className="px-3.5 py-1.5 rounded-full text-[13px] font-medium shrink-0 cursor-pointer"
              style={{
                backgroundColor: active ? 'var(--ios-blue)' : 'var(--ios-fill)',
                color: active ? '#ffffff' : 'var(--ios-label-secondary)',
              }}
            >
              {DURATION_LABELS[f.id]}
            </button>
          );
        })}
      </div>

      {/* Borderless Wheel Card */}
      <Card className="flex flex-col items-center py-6">
        <div className="relative z-20 -mb-2.5">
          <div
            className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px]"
            style={{ borderTopColor: 'var(--ios-label)' }}
          />
        </div>

        <div className="relative w-72 h-72 sm:w-80 sm:h-80 select-none">
          <svg
            viewBox="0 0 320 320"
            className="w-full h-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 3.55s cubic-bezier(0.14, 0.85, 0.18, 1)' : 'none',
            }}
          >
            {activeSlices.length === 1 ? (
              <circle cx="160" cy="160" r="150" fill="#0A84FF" />
            ) : (
              activeSlices.map((slice, idx) => {
                const sliceAngle = 360 / activeSlices.length;
                const start = idx * sliceAngle;
                const end = start + sliceAngle;
                const mid = start + sliceAngle / 2;
                const labelPos = polarToCartesian(160, 160, 102, mid);
                const fillTone = APPLE_WHEEL_TONES[idx % APPLE_WHEEL_TONES.length];
                return (
                  <g key={slice.id}>
                    <path
                      d={describeSlice(160, 160, 152, start, end)}
                      fill={fillTone}
                      stroke="#000000"
                      strokeOpacity="0.4"
                      strokeWidth="1.2"
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#ffffff"
                      fontSize={activeSlices.length > 8 ? '10.5' : '12'}
                      fontWeight="600"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${mid - 90}, ${labelPos.x}, ${labelPos.y})`}
                    >
                      {slice.category.length > 12 ? `${slice.category.slice(0, 11)}…` : slice.category}
                    </text>
                  </g>
                );
              })
            )}
          </svg>

          <button
            type="button"
            disabled={spinning || activeSlices.length === 0}
            onClick={handleSpin}
            className="absolute inset-0 m-auto w-[78px] h-[78px] rounded-full font-editorial text-[16px] shadow-xl flex items-center justify-center ios-pressable cursor-pointer disabled:opacity-60 z-10"
            style={{
              backgroundColor: 'var(--os-obsidian)',
              color: 'var(--os-brass)',
              border: '1px solid rgba(185, 155, 121, 0.45)',
            }}
          >
            {spinning ? '...' : 'Spin'}
          </button>
        </div>

        <p className="text-[12px] text-[var(--ios-label-secondary)] mt-4 tabular-nums">
          {activeSlices.length} hoạt động sẵn sàng
        </p>
      </Card>

      {/* Winner Quest Card (Borderless #1C1C1E) */}
      {winner && (
        <Card className="space-y-4">
          <div>
            <p className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--ios-blue)' }}>
              {winner.category} · {winner.suggestedMinutes} phút
            </p>
            <h3 className="text-[19px] font-semibold leading-snug mt-1">{winner.label}</h3>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-[12px] ios-fill gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--ios-label-secondary)] font-semibold">
                Đồng hồ tập trung
              </p>
              <p className="text-[28px] leading-[34px] font-bold tabular-nums mt-0.5">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className="px-4 py-2 rounded-full text-white text-[13px] font-semibold ios-pressable cursor-pointer"
                style={{ backgroundColor: 'var(--ios-blue)' }}
              >
                {timerRunning ? 'Tạm dừng' : 'Bắt đầu'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(winner.suggestedMinutes * 60);
                }}
                className="px-3 py-2 rounded-full text-[13px] font-medium text-[var(--ios-label-secondary)] cursor-pointer"
              >
                Đặt lại
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={completeQuest}
              className="flex-1 py-3 rounded-[12px] text-white text-[15px] font-semibold ios-pressable cursor-pointer"
              style={{ backgroundColor: 'var(--ios-green)' }}
            >
              Đã làm xong
            </button>
            <button
              type="button"
              onClick={handleSpin}
              className="px-4 py-3 rounded-[12px] ios-fill text-[14px] font-medium ios-pressable cursor-pointer"
            >
              Quay lại
            </button>
          </div>
        </Card>
      )}

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Tùy chỉnh Vòng Quay">
        <div className="space-y-5">
          <form onSubmit={addCustomSlice} className="space-y-2.5">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Tên hành động cụ thể (vd: Học 10p Java Core)..."
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[15px]"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Nhãn ngắn"
                className="px-3 py-2 rounded-[10px] ios-fill text-[13px]"
              />
              <select
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value as WheelDuration)}
                className="px-2.5 py-2 rounded-[10px] ios-fill text-[13px]"
              >
                <option value="quick">5–10p</option>
                <option value="medium">15–20p</option>
                <option value="deep">30p+</option>
                <option value="relax">Thư giãn</option>
              </select>
              <input
                type="number"
                min={3}
                max={90}
                value={newMins}
                onChange={(e) => setNewMins(Number(e.target.value))}
                placeholder="Phút"
                className="px-3 py-2 rounded-[10px] ios-fill text-[13px] tabular-nums"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-[12px] text-white text-[14px] font-semibold ios-pressable cursor-pointer"
              style={{ backgroundColor: 'var(--ios-blue)' }}
            >
              + Thêm vào vòng quay
            </button>
          </form>

          <IOSListGroup header="Các ô hiện có">
            {allOptions.map((opt) => (
              <div key={opt.id} className="px-4 py-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => db.wheelOptions.update(opt.id, { enabled: !opt.enabled })}
                  className="text-left flex-1 min-w-0 cursor-pointer"
                >
                  <p
                    className={`text-[15px] font-medium truncate ${
                      opt.enabled ? '' : 'line-through text-[var(--ios-label-tertiary)]'
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[12px] text-[var(--ios-label-secondary)] tabular-nums">
                    {opt.category} · {opt.suggestedMinutes}p
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => db.wheelOptions.delete(opt.id)}
                  className="text-[13px] font-medium cursor-pointer shrink-0"
                  style={{ color: 'var(--ios-red)' }}
                >
                  Xóa
                </button>
              </div>
            ))}
          </IOSListGroup>
        </div>
      </Modal>
    </div>
  );
}
