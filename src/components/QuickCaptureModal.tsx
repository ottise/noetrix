import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createId, getLocalDateStr } from '../db/database';
import { buildAndPersistWidgetSnapshot } from '../lib/ambient';
import { useLanguage } from '../lib/i18n';
import type { TaskCategory, TaskPriority, TaskRecurrence } from '../types';
import { CheckDot, Modal, SegmentedControl, useToast } from './ui/Primitives';

export function QuickCaptureModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const focusCount =
    useLiveQuery(() =>
      db.tasks.filter((tItem) => tItem.isTodayFocus && tItem.status !== 'completed').count()
    ) || 0;
  const stories = useLiveQuery(() => db.stories.orderBy('updatedAt').reverse().toArray()) || [];

  const [mode, setMode] = useState<'task' | 'spark' | 'note'>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('learning');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [scheduledTime, setScheduledTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<string>('30');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [isTodayFocus, setIsTodayFocus] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setScheduledTime('');
    setDeadline('');
    setIsTodayFocus(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = title.trim();
    if (!cleaned) return;
    const now = Date.now();
    const today = getLocalDateStr();

    if (mode === 'task') {
      if (isTodayFocus && focusCount >= 3) {
        showToast(
          t(
            'Today’s Focus keeps at most 3 key tasks — saved to Inbox.',
            'Today’s Focus chỉ giữ tối đa 3 việc quan trọng — task sẽ được lưu vào Inbox.'
          ),
          'info'
        );
      }
      const pinFocus = isTodayFocus && focusCount < 3;
      await db.tasks.put({
        id: createId('tsk'),
        title: cleaned,
        description: description.trim(),
        category,
        project: '',
        priority,
        status: pinFocus || scheduledTime ? 'planned' : 'inbox',
        isTodayFocus: pinFocus,
        scheduledDate: pinFocus || scheduledTime ? today : undefined,
        scheduledTime: scheduledTime || undefined,
        deadline: deadline || undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        recurrence,
        createdAt: now,
        updatedAt: now,
      });
      await buildAndPersistWidgetSnapshot();
      showToast(
        pinFocus
          ? t('Added to Today’s Focus', 'Đã thêm vào Today’s Focus')
          : t('Saved task to Inbox', 'Đã lưu task vào Inbox')
      );
    } else if (mode === 'spark') {
      const target = stories[0];
      if (!target) {
        showToast(
          t('Create at least 1 story project in The Studio first.', 'Hãy tạo ít nhất 1 dự án truyện trong Studio trước.'),
          'info'
        );
        return;
      }
      await db.stories.update(target.id, {
        sparks: [{ id: createId('spk'), text: cleaned, tag: 'Quick Capture', createdAt: now }, ...target.sparks],
        updatedAt: now,
      });
      showToast(t(`Saved spark to "${target.title}"`, `Đã lưu ý tưởng vào "${target.title}"`));
    } else {
      const existing = await db.dailyLogs.get(today);
      const prevNote = existing?.dailyNote ? `${existing.dailyNote}\n` : '';
      await db.dailyLogs.put({
        date: today,
        codeDone: existing?.codeDone || false,
        codePillars: existing?.codePillars || [],
        codeMinutes: existing?.codeMinutes || 0,
        englishDone: existing?.englishDone || false,
        englishNote: existing?.englishNote || '',
        gymDone: existing?.gymDone || false,
        gymSplit: existing?.gymSplit || '',
        readDone: existing?.readDone,
        createDone: existing?.createDone,
        dailyNote: `${prevNote}• ${cleaned}`,
        xpEarned: existing?.xpEarned || 0,
        updatedAt: now,
      });
      showToast(t('Saved to today’s journal note', 'Đã ghi vào Ghi chú hôm nay'));
    }

    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('Quick Capture', 'Ghi nhanh')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: 'task', label: t('Task', 'Việc cần làm') },
            { value: 'spark', label: t('Story Spark', 'Ý tưởng truyện') },
            { value: 'note', label: t('Quick Note', 'Ghi chú nhanh') },
          ]}
        />

        <input
          type="text"
          required
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            mode === 'task'
              ? t('What needs to be done?', 'Việc cần làm là gì?')
              : mode === 'spark'
              ? t('A line of dialogue, twist, or sudden scene...', 'Câu thoại, cú twist hoặc cảnh chợt nảy ra...')
              : t('Jot down a quick thought...', 'Ghi nhanh 1 ý trong đầu...')
          }
          className="w-full px-3.5 py-3 rounded-[12px] ios-fill text-[16px] font-medium placeholder:text-[var(--ios-label-tertiary)]"
        />

        {mode === 'task' && (
          <>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Details or first step (optional)...', 'Mô tả chi tiết hoặc bước đầu tiên (tùy chọn)...')}
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px] placeholder:text-[var(--ios-label-tertiary)]"
            />

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[12px] text-[var(--ios-label-secondary)]">{t('Category', 'Danh mục')}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full mt-1 px-3 py-2 rounded-[10px] ios-fill text-[14px]"
                >
                  <option value="learning">{t('Learning', 'Học tập')}</option>
                  <option value="publishing">{t('Publishing', 'Xuất bản')}</option>
                  <option value="health">{t('Health / Gym', 'Sức khỏe / Gym')}</option>
                  <option value="creative">{t('Creative / Story', 'Sáng tạo / Truyện')}</option>
                  <option value="life">{t('Life', 'Đời sống')}</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] text-[var(--ios-label-secondary)]">{t('Priority', 'Ưu tiên')}</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full mt-1 px-3 py-2 rounded-[10px] ios-fill text-[14px]"
                >
                  <option value="high">{t('High', 'Cao')}</option>
                  <option value="medium">{t('Medium', 'Trung bình')}</option>
                  <option value="low">{t('Low', 'Thấp')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[12px] text-[var(--ios-label-secondary)]">{t('Time (Next Up)', 'Giờ (Next Up)')}</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full mt-1 px-2.5 py-2 rounded-[10px] ios-fill text-[13px] tabular-nums"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--ios-label-secondary)]">{t('Duration (m)', 'Thời lượng (p)')}</label>
                <input
                  type="number"
                  min={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full mt-1 px-2.5 py-2 rounded-[10px] ios-fill text-[13px] tabular-nums"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--ios-label-secondary)]">{t('Repeat', 'Lặp lại')}</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
                  className="w-full mt-1 px-2 py-2 rounded-[10px] ios-fill text-[13px]"
                >
                  <option value="none">{t('None', 'Không')}</option>
                  <option value="daily">{t('Daily', 'Hằng ngày')}</option>
                  <option value="every3days">{t('Every 3 days', 'Mỗi 3 ngày')}</option>
                  <option value="weekly">{t('Weekly', 'Hằng tuần')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[12px] text-[var(--ios-label-secondary)]">{t('Deadline (optional)', 'Hạn chót (tùy chọn)')}</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-[10px] ios-fill text-[14px] tabular-nums"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsTodayFocus((v) => !v)}
              className="w-full px-3.5 py-3 rounded-[12px] ios-fill flex items-center justify-between text-[14px] font-medium cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <CheckDot checked={isTodayFocus} size="sm" />
                {t('Pin to Today’s Focus', 'Ghim vào Today’s Focus')}
              </span>
              <span className="text-[12px] text-[var(--ios-label-secondary)] tabular-nums">
                {focusCount}/3
              </span>
            </button>
          </>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-[12px] text-white text-[15px] font-semibold ios-pressable cursor-pointer"
          style={{ backgroundColor: 'var(--ios-blue)' }}
        >
          {t('Save now', 'Lưu ngay')}
        </button>
      </form>
    </Modal>
  );
}
