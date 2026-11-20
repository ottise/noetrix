import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createId, getLocalDateStr, addDaysStr, diffDaysFromToday, formatShortDate } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import type { WorkflowLecture, WorkflowStatus } from '../../types';
import { CheckDot, EmptyState, useToast } from '../../components/ui/Primitives';
import { ImageGallery } from '../../components/ImageGallery';
import { AudioRecorderPlayer } from '../../components/AudioRecorderPlayer';

const STATUS_META: Record<WorkflowStatus, { label: string; color: string }> = {
  studying: { label: 'Studying', color: 'var(--os-ivory-muted)' },
  writing: { label: 'Drafting Docs', color: 'var(--os-dusty-blue)' },
  media: { label: 'Audio & Diagrams', color: 'var(--os-brass)' },
  ready: { label: 'Ready', color: 'var(--os-sage)' },
  published: { label: 'Archived', color: 'var(--os-sage)' },
};

/**
 * Room 02: The Library — Technical Lecture Publication & Knowledge Archive
 * Spec Section 5:
 * - Library atmospheric header with '/art/room-library.jpg'
 * - When opening an AI Workflow Lecture, renders as a professional 2-column technical publication:
 *   Main Reading/Writing Canvas (8 cols) + Visual Diagrams below,
 *   Right Companion Panel (4 cols) with Audio Lecture Player/Recorder, 5-step progress, and Field Notes.
 */
export function WorkflowVault() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const lectures =
    useLiveQuery(() => db.workflowLectures.orderBy('updatedAt').reverse().toArray()) || [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WorkflowStatus>('all');
  const [docLang, setDocLang] = useState<'vi' | 'en' | 'both'>('vi');
  const [newTagInput, setNewTagInput] = useState('');

  const selected = lectures.find((l) => l.id === selectedId) || null;

  const createNewLecture = async () => {
    triggerHaptic('light');
    const today = getLocalDateStr();
    const published = lectures
      .filter((l) => l.publishedAt)
      .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    const baseDate = published[0]?.publishedAt || today;
    const suggestedDue = addDaysStr(baseDate, 3) >= today ? addDaysStr(baseDate, 3) : addDaysStr(today, 3);

    const item: WorkflowLecture = {
      id: createId('wf'),
      title: `Bài giảng Workflow #${lectures.length + 1}`,
      tags: ['AI Workflow'],
      status: 'studying',
      dueDate: suggestedDue,
      checklist: { studied: false, docVi: false, docEn: false, images: false, audio: false },
      docVi: '',
      docEn: '',
      notes: '',
      images: [],
      audios: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.workflowLectures.put(item);
    setSelectedId(item.id);
    showToast('Đã khởi tạo trang bài giảng Workflow mới');
  };

  const updateLecture = async (id: string, patch: Partial<WorkflowLecture>) => {
    await db.workflowLectures.update(id, { ...patch, updatedAt: Date.now() });
  };

  const toggleCheck = async (lec: WorkflowLecture, key: keyof WorkflowLecture['checklist']) => {
    triggerHaptic('selection');
    const nextChecklist = { ...lec.checklist, [key]: !lec.checklist[key] };
    const allDone = Object.values(nextChecklist).every(Boolean);
    await updateLecture(lec.id, {
      checklist: nextChecklist,
      status: lec.status === 'published' ? 'published' : allDone ? 'ready' : lec.status,
    });
  };

  const markPublished = async (lec: WorkflowLecture) => {
    const today = getLocalDateStr();
    const wasPublished = lec.status === 'published';
    await updateLecture(lec.id, {
      status: wasPublished ? 'ready' : 'published',
      publishedAt: wasPublished ? undefined : today,
    });
    if (!wasPublished) {
      await awardXp(60);
      const hasUpcoming = lectures.some((l) => l.id !== lec.id && l.status !== 'published');
      if (!hasUpcoming) {
        const nextDue = addDaysStr(today, 3);
        await db.workflowLectures.put({
          id: createId('wf'),
          title: `Bài giảng Workflow #${lectures.length + 1}`,
          tags: ['AI Workflow'],
          status: 'studying',
          dueDate: nextDue,
          checklist: { studied: false, docVi: false, docEn: false, images: false, audio: false },
          docVi: '',
          docEn: '',
          notes: '',
          images: [],
          audios: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        showToast('Đã lưu trữ bài giảng · Tự tạo chu kỳ 3 ngày tiếp theo');
        return;
      }
      showToast('Đã xuất bản và lưu trữ bài giảng');
    }
  };

  const deleteLecture = async (id: string) => {
    if (!window.confirm('Xóa bài giảng Workflow này?')) return;
    await db.workflowLectures.delete(id);
    setSelectedId(null);
    showToast('Đã xóa bài giảng', 'info');
  };

  const copyText = async (text: string, label: string) => {
    if (!text.trim()) {
      showToast(`${label} đang trống`, 'info');
      return;
    }
    await navigator.clipboard.writeText(text);
    showToast(`Đã copy ${label}`);
  };

  // =========================================================================
  // 2-COLUMN TECHNICAL PUBLICATION PAGE (When a Lecture is opened)
  // =========================================================================
  if (selected) {
    const checkCount = Object.values(selected.checklist).filter(Boolean).length;
    const daysLeft = diffDaysFromToday(selected.dueDate);

    return (
      <div className="space-y-6">
        {/* Top Quiet Editorial Navigation Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 pb-4"
          style={{ borderBottom: '1px solid var(--os-border)' }}
        >
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-[13.5px] font-medium cursor-pointer"
            style={{ color: 'var(--os-ivory-muted)' }}
          >
            ← {t('Back to Archive', 'Quay lại Kho lưu trữ')}
          </button>

          <div className="flex items-center gap-3">
            <select
              value={selected.status}
              onChange={(e) => updateLecture(selected.id, { status: e.target.value as WorkflowStatus })}
              className="px-3 py-1.5 rounded-full text-[12px] ios-fill cursor-pointer"
            >
              {Object.entries(STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => markPublished(selected)}
              className="px-4 py-1.5 rounded-full text-[12.5px] font-medium cursor-pointer"
              style={
                selected.status === 'published'
                  ? {
                      backgroundColor: 'rgba(155, 170, 152, 0.16)',
                      color: 'var(--os-sage)',
                      border: '1px solid rgba(155, 170, 152, 0.3)',
                    }
                  : { backgroundColor: 'var(--os-brass)', color: '#101114' }
              }
            >
              {selected.status === 'published'
                ? t('Published & Archived', 'Đã xuất bản & Lưu trữ')
                : t('Publish Lesson', 'Xuất bản bài giảng')}
            </button>

            <button
              type="button"
              onClick={() => deleteLecture(selected.id)}
              className="text-[12.5px] cursor-pointer"
              style={{ color: 'var(--os-ivory-faint)' }}
            >
              {t('Delete', 'Xóa')}
            </button>
          </div>
        </div>

        {/* Title & Metadata Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-[11.5px] tabular-nums" style={{ color: 'var(--os-ivory-faint)' }}>
            <span className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
              TECHNICAL MONOGRAPH · 3-DAY CYCLE
            </span>
            <span>·</span>
            <label className="inline-flex items-center gap-1">
              <span>Due:</span>
              <input
                type="date"
                value={selected.dueDate}
                onChange={(e) => updateLecture(selected.id, { dueDate: e.target.value })}
                className="bg-transparent font-medium"
                style={{ color: 'var(--os-ivory-muted)' }}
              />
            </label>
            {selected.status !== 'published' && (
              <span style={{ color: daysLeft < 0 ? 'var(--os-crimson)' : 'var(--os-dusty-blue)' }}>
                ({daysLeft < 0 ? `Overdue ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`})
              </span>
            )}
          </div>

          <input
            type="text"
            value={selected.title}
            onChange={(e) => updateLecture(selected.id, { title: e.target.value })}
            placeholder="Lecture Title..."
            className="w-full bg-transparent font-editorial-vi text-[28px] sm:text-[36px] leading-[1.15]"
            style={{ color: 'var(--os-ivory-bright)' }}
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {selected.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px]"
                style={{
                  backgroundColor: 'var(--os-graphite)',
                  border: '1px solid var(--os-border)',
                  color: 'var(--os-ivory-muted)',
                }}
              >
                #{t}
                <button
                  type="button"
                  onClick={() =>
                    updateLecture(selected.id, { tags: selected.tags.filter((x) => x !== t) })
                  }
                  className="opacity-60 hover:opacity-100 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleaned = newTagInput.trim();
                if (cleaned && !selected.tags.includes(cleaned)) {
                  updateLecture(selected.id, { tags: [...selected.tags, cleaned] });
                }
                setNewTagInput('');
              }}
            >
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="+ tag"
                className="w-20 bg-transparent text-[12px]"
                style={{ color: 'var(--os-ivory-faint)' }}
              />
            </form>
          </div>
        </div>

        {/* 2-COLUMN TECHNICAL PUBLICATION GRID:
            Left 8 cols: Main Bilingual Documentation + Visual Diagrams
            Right 4 cols: Audio Lecture Player/Recorder + 5-Step Checklist + Field Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Publication Column (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div
              className="rounded-[14px] p-5 sm:p-7 space-y-4"
              style={{
                backgroundColor: 'var(--os-graphite)',
                border: '1px solid var(--os-border)',
              }}
            >
              <div
                className="flex flex-wrap items-center justify-between gap-2 pb-3"
                style={{ borderBottom: '1px solid var(--os-border)' }}
              >
                <div className="flex items-center gap-1.5">
                  {(['vi', 'en', 'both'] as const).map((lang) => {
                    const active = docLang === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setDocLang(lang)}
                        className={`px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer ${
                          lang === 'both' ? 'hidden sm:inline-block' : ''
                        }`}
                        style={{
                          backgroundColor: active ? 'var(--os-stone)' : 'transparent',
                          color: active ? 'var(--os-brass)' : 'var(--os-ivory-muted)',
                          border: active ? '1px solid var(--os-border)' : '1px solid transparent',
                        }}
                      >
                        {lang === 'vi' ? 'Tiếng Việt' : lang === 'en' ? 'English' : 'Compare VI · EN'}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 text-[12px]" style={{ color: 'var(--os-dusty-blue)' }}>
                  <button type="button" onClick={() => copyText(selected.docVi, 'Doc VI')} className="cursor-pointer">
                    Copy VI
                  </button>
                  <button type="button" onClick={() => copyText(selected.docEn, 'Doc EN')} className="cursor-pointer">
                    Copy EN
                  </button>
                </div>
              </div>

              <div className={`grid gap-4 ${docLang === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {(docLang === 'vi' || docLang === 'both') && (
                  <div className="space-y-2">
                    <label className="editorial-eyebrow">Vietnamese Documentation</label>
                    <textarea
                      rows={16}
                      value={selected.docVi}
                      onChange={(e) => updateLecture(selected.id, { docVi: e.target.value })}
                      placeholder={t(
                        'Draft Vietnamese documentation for workflow architecture, steps, and key takeaways...',
                        'Soạn tài liệu giải thích kiến trúc workflow, từng bước xử lý và bài học thực tế...'
                      )}
                      className="w-full p-4 rounded-[12px] text-[15px] leading-[1.78] resize-y"
                      style={{
                        backgroundColor: 'var(--os-obsidian)',
                        border: '1px solid var(--os-border)',
                        color: 'var(--os-ivory)',
                      }}
                    />
                  </div>
                )}

                {(docLang === 'en' || docLang === 'both') && (
                  <div className="space-y-2">
                    <label className="editorial-eyebrow">English Documentation</label>
                    <textarea
                      rows={16}
                      value={selected.docEn}
                      onChange={(e) => updateLecture(selected.id, { docEn: e.target.value })}
                      placeholder="Write the English technical documentation for your international portfolio and IG..."
                      className="w-full p-4 rounded-[12px] text-[15px] leading-[1.78] resize-y"
                      style={{
                        backgroundColor: 'var(--os-obsidian)',
                        border: '1px solid var(--os-border)',
                        color: 'var(--os-ivory)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Visual Diagrams & Figures directly below article */}
            <div
              className="rounded-[14px] p-5 sm:p-7"
              style={{
                backgroundColor: 'var(--os-graphite)',
                border: '1px solid var(--os-border)',
              }}
            >
              <ImageGallery
                images={selected.images}
                onChange={(images) =>
                  updateLecture(selected.id, {
                    images,
                    checklist: { ...selected.checklist, images: images.length > 0 },
                  })
                }
                label="Figures & Architecture Diagrams"
              />
            </div>
          </div>

          {/* Right Companion Column (4 cols): Audio Lecture Studio + Progress + Notes */}
          <div className="lg:col-span-4 space-y-6">
            {/* Audio Lecture Recorder & Player */}
            <div
              className="rounded-[14px] p-5"
              style={{
                backgroundColor: 'var(--os-graphite)',
                border: '1px solid var(--os-border)',
              }}
            >
              <AudioRecorderPlayer
                audios={selected.audios}
                onChange={(audios) =>
                  updateLecture(selected.id, {
                    audios,
                    checklist: { ...selected.checklist, audio: audios.length > 0 },
                  })
                }
              />
            </div>

            {/* 5-Step Production Checklist */}
            <div
              className="rounded-[14px] p-5 space-y-3"
              style={{
                backgroundColor: 'var(--os-graphite)',
                border: '1px solid var(--os-border)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="editorial-eyebrow">Lesson Readiness</span>
                <span className="text-[12px] tabular-nums" style={{ color: 'var(--os-brass)' }}>
                  0{checkCount} / 05
                </span>
              </div>

              <div className="divide-y divide-[var(--os-border)]">
                {(
                  [
                    ['studied', '1. Deeply understood workflow'],
                    ['docVi', '2. Vietnamese documentation'],
                    ['docEn', '3. English documentation'],
                    ['images', '4. Visual diagrams attached'],
                    ['audio', '5. Voice lecture recorded'],
                  ] as const
                ).map(([key, label]) => {
                  const checked = selected.checklist[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleCheck(selected, key)}
                      className="w-full py-2.5 flex items-center gap-3 text-left text-[13.5px] cursor-pointer"
                      style={{
                        color: checked ? 'var(--os-sage)' : 'var(--os-ivory-muted)',
                      }}
                    >
                      <CheckDot checked={checked} size="sm" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Side Field Notes */}
            <div
              className="rounded-[14px] p-5 space-y-2.5"
              style={{
                backgroundColor: 'var(--os-graphite)',
                border: '1px solid var(--os-border)',
              }}
            >
              <span className="editorial-eyebrow">Marginalia & Field Notes</span>
              <textarea
                rows={8}
                value={selected.notes}
                onChange={(e) => updateLecture(selected.id, { notes: e.target.value })}
                placeholder="Edge cases, bugs encountered, or sparks for the next workflow..."
                className="w-full p-3.5 rounded-[10px] text-[13.5px] leading-relaxed resize-y"
                style={{
                  backgroundColor: 'var(--os-obsidian)',
                  border: '1px solid var(--os-border)',
                  color: 'var(--os-ivory)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ARCHIVE COLLECTION OVERVIEW
  // =========================================================================
  const filtered = lectures.filter((l) => {
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchQuery =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.tags.some((t) => t.toLowerCase().includes(q)) ||
      l.docVi.toLowerCase().includes(q) ||
      l.notes.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const publishedCount = lectures.filter((l) => l.status === 'published').length;

  return (
    <div className="space-y-8">
      {/* Library Featured Showcase Banner */}
      <div
        className="relative rounded-[14px] overflow-hidden"
        style={{
          backgroundColor: 'var(--os-graphite)',
          border: '1px solid var(--os-border)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          <div className="md:col-span-5 relative min-h-[170px] overflow-hidden">
            <img
              src="/art/room-library.jpg"
              alt="The Library archive"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(27,29,34,0.12) 0%, rgba(27,29,34,0.88) 100%)',
              }}
            />
          </div>

          <div className="md:col-span-7 p-6 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <p className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
                {t('Technical Archive · Every 3 Days', 'Lưu trữ Kỹ thuật · Chu kỳ 3 ngày')}
              </p>
              <h2 className="editorial-h2">{t('AI Workflow Monographs', 'Hồ sơ Bài giảng AI Workflow')}</h2>
              <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                {t(
                  'Each lecture is a complete knowledge dossier with bilingual VI–EN docs, architecture diagrams, voice recordings, and field notes.',
                  'Mỗi bài giảng là một hồ sơ tri thức hoàn chỉnh gồm tài liệu song ngữ Việt – Anh, sơ đồ kiến trúc, bản ghi âm giảng bài và ghi chú thực nghiệm.'
                )}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[12.5px] tabular-nums" style={{ color: 'var(--os-ivory-faint)' }}>
                {publishedCount} {t('archived', 'đã lưu trữ')} · {lectures.length}{' '}
                {t('total volumes', 'tổng số bài')}
              </span>
              <button
                type="button"
                onClick={createNewLecture}
                className="px-4 py-2 rounded-full text-[13px] font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
              >
                {t('+ New Volume', '+ Tạo bài mới')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search volumes by title, tag, documentation, or notes..."
          className="flex-1 px-4 py-2.5 rounded-[10px] text-[14px]"
          style={{
            backgroundColor: 'var(--os-graphite)',
            border: '1px solid var(--os-border)',
            color: 'var(--os-ivory)',
          }}
        />

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'studying', 'writing', 'media', 'ready', 'published'] as const).map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium shrink-0 cursor-pointer"
                style={{
                  backgroundColor: active ? 'var(--os-stone)' : 'transparent',
                  color: active ? 'var(--os-brass)' : 'var(--os-ivory-muted)',
                  border: active ? '1px solid var(--os-border)' : '1px solid transparent',
                }}
              >
                {st === 'all' ? 'All Volumes' : STATUS_META[st].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editorial Archive List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No volumes in this shelf"
          subtitle="Create a new AI Workflow volume to store bilingual docs, diagrams, voice lectures, and notes."
          action={
            <button
              type="button"
              onClick={createNewLecture}
              className="px-4 py-2 rounded-full text-[13px] font-medium cursor-pointer"
              style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
            >
              + Create First Volume
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((lec, index) => {
            const doneSteps = Object.values(lec.checklist).filter(Boolean).length;
            const daysLeft = diffDaysFromToday(lec.dueDate);
            const meta = STATUS_META[lec.status];
            return (
              <button
                key={lec.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedId(lec.id);
                }}
                className="group p-5 rounded-[14px] text-left flex flex-col justify-between gap-4 transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--os-graphite)',
                  border: '1px solid var(--os-border)',
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] tabular-nums">
                    <span className="editorial-eyebrow">
                      VOL. {String(lectures.length - index).padStart(2, '0')}
                    </span>
                    <span style={{ color: meta.color }}>{meta.label}</span>
                  </div>
                  <h3 className="font-editorial-vi text-[21px] leading-snug group-hover:underline" style={{ color: 'var(--os-ivory-bright)' }}>
                    {lec.title}
                  </h3>
                  {lec.docVi && (
                    <p className="text-[13px] line-clamp-2 leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                      {lec.docVi.replace(/#+/g, '').trim()}
                    </p>
                  )}
                </div>

                <div
                  className="pt-3 flex items-center justify-between text-[12px] tabular-nums"
                  style={{
                    borderTop: '1px solid var(--os-border)',
                    color: 'var(--os-ivory-faint)',
                  }}
                >
                  <span>
                    {doneSteps}/5 steps · {lec.images.length} fig · {lec.audios.length} audio
                  </span>
                  <span style={{ color: daysLeft < 0 && lec.status !== 'published' ? 'var(--os-crimson)' : 'var(--os-brass)' }}>
                    {lec.status === 'published'
                      ? formatShortDate(lec.publishedAt)
                      : daysLeft < 0
                      ? `Overdue ${Math.abs(daysLeft)}d`
                      : `Due ${formatShortDate(lec.dueDate)}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
