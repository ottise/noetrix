import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { addDaysStr, createId, db, getLocalDateStr } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import { saveLocalKvAndTouch } from '../../lib/kvSync';
import { scheduleSourceCodeSave } from '../../lib/sourceStore';
import type { MediaAttachmentRef, WorkflowLecture } from '../../types';
import { AudioRecorderPlayer } from '../../components/AudioRecorderPlayer';
import { Card, SegmentedControl, useToast } from '../../components/ui/Primitives';
import {
  createBlankResearchProject,
  normalizeResearchJournalState,
  type PersonalResearchJournalState,
} from './researchJournalData';
import {
  buildInitialScreenplayState,
  buildStarterProject,
  type ScreenplayScene,
  type ScreenplayStudioState,
} from '../vault/screenplayStudioData';

const RJ_STORAGE_KEY = 'noetrix_personal_research_journal_v1';
const SP_STORAGE_KEY = 'noetrix_screenplay_studio_v1';

function CompactPicker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => {
          triggerHaptic('selection');
          setOpen((v) => !v);
        }}
        className="w-full min-h-[38px] px-3 py-1.5 rounded-[10px] text-[13px] font-medium flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
        style={{
          backgroundColor: 'var(--os-stone)',
          color: 'var(--os-ivory-bright)',
          border: open ? '1px solid rgba(203, 168, 106, 0.5)' : '1px solid var(--os-border)',
        }}
      >
        <span className="truncate">{current?.label || ''}</span>
        <span className="text-[11px] shrink-0 text-[#9ca3af]">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          className="mt-1.5 w-full rounded-[10px] p-1 max-h-[180px] overflow-y-auto space-y-0.5 shadow-xl"
          style={{
            backgroundColor: '#161922',
            border: '1px solid rgba(217, 213, 203, 0.14)',
          }}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-[7px] text-[13px] text-left flex items-center justify-between gap-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? 'rgba(203, 168, 106, 0.14)' : 'transparent',
                  color: active ? '#cba86a' : '#e1e4ea',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span className="truncate">{opt.label}</span>
                {active && <span className="text-[11px] shrink-0">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function loadResearchState(): PersonalResearchJournalState {
  const today = getLocalDateStr();
  try {
    const raw = localStorage.getItem(RJ_STORAGE_KEY);
    if (raw) return normalizeResearchJournalState(JSON.parse(raw), today);
  } catch {
    // ignore corrupt localStorage
  }
  return normalizeResearchJournalState(null, today);
}

function loadScreenplayState(): ScreenplayStudioState {
  try {
    const raw = localStorage.getItem(SP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ScreenplayStudioState>;
      if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        const projects = parsed.projects.filter(
          (p) => p.id !== 'proj_chimera' && p.id !== 'proj_01'
        );
        const list = projects.length > 0 ? projects : [buildStarterProject(Date.now())];
        const activeId = list.some((p) => p.id === parsed.activeProjectId)
          ? String(parsed.activeProjectId)
          : list[0].id;
        return {
          activeProjectId: activeId,
          activeModule: 'screenplay',
          projects: list,
        };
      }
    }
  } catch {
    // ignore corrupt localStorage
  }
  return buildInitialScreenplayState();
}

export function StudioIOSLite({
  sub,
  onChangeSub,
}: {
  sub: 'psychology' | 'lectures' | 'stories';
  onChangeSub: (next: 'psychology' | 'lectures' | 'stories') => void;
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  // --- 1. AI Workflow Lectures (Dexie) ---
  const lectures =
    useLiveQuery(() => db.workflowLectures.orderBy('updatedAt').reverse().toArray()) || [];
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const activeLecture =
    lectures.find((l) => l.id === selectedLectureId) || lectures[0] || null;

  // --- 2. Psychology Research (localStorage synced via kvSync) ---
  const [rjState, setRjState] = useState<PersonalResearchJournalState>(() => loadResearchState());
  // --- 3. Writing Room / Story Studio (localStorage synced via kvSync) ---
  const [spState, setSpState] = useState<ScreenplayStudioState>(() => loadScreenplayState());

  useEffect(() => {
    const reload = () => {
      setRjState(loadResearchState());
      setSpState(loadScreenplayState());
    };
    window.addEventListener('noetrix-kv-synced', reload);
    return () => window.removeEventListener('noetrix-kv-synced', reload);
  }, []);

  const persistResearch = (updater: (curr: PersonalResearchJournalState) => PersonalResearchJournalState) => {
    setRjState((curr) => {
      const next = updater(curr);
      saveLocalKvAndTouch(RJ_STORAGE_KEY, next);
      scheduleSourceCodeSave();
      return next;
    });
  };

  const persistScreenplay = (updater: (curr: ScreenplayStudioState) => ScreenplayStudioState) => {
    setSpState((curr) => {
      const next = updater(curr);
      saveLocalKvAndTouch(SP_STORAGE_KEY, next);
      scheduleSourceCodeSave();
      return next;
    });
  };

  // --- Handlers: AI Workflow ---
  const handleCreateLecture = async () => {
    triggerHaptic('light');
    const today = getLocalDateStr();
    const item: WorkflowLecture = {
      id: createId('wf'),
      title: `Bài giảng Workflow #${lectures.length + 1}`,
      tags: ['AI Workflow'],
      status: 'studying',
      dueDate: addDaysStr(today, 3),
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
    setSelectedLectureId(item.id);
    showToast(t('Created new AI Workflow note', 'Đã tạo trang ghi chú AI Workflow mới'));
  };

  const updateLectureField = async (
    id: string,
    patch: Partial<WorkflowLecture>
  ) => {
    await db.workflowLectures.update(id, { ...patch, updatedAt: Date.now() });
  };

  const handleDeleteLecture = async () => {
    if (!activeLecture) return;
    if (!window.confirm(t(`Delete "${activeLecture.title}"?`, `Xóa "${activeLecture.title}"?`))) return;
    triggerHaptic('warning');
    await db.workflowLectures.delete(activeLecture.id);
    setSelectedLectureId('');
    showToast(t('Deleted lecture', 'Đã xóa bài giảng'), 'info');
  };

  // --- Handlers: Psychology ---
  const activeResearch =
    rjState.projects.find((p) => p.id === rjState.lastActiveResearchId) ||
    rjState.projects[0] ||
    null;

  const handleCreateResearch = () => {
    triggerHaptic('light');
    const today = getLocalDateStr();
    const created = createBlankResearchProject(
      rjState.projects.length + 1,
      today,
      t(`Research Note #${rjState.projects.length + 1}`, `Nghiên cứu mới #${rjState.projects.length + 1}`)
    );
    persistResearch((curr) => ({
      ...curr,
      lastActiveResearchId: created.id,
      projects: [created, ...curr.projects],
    }));
    showToast(t('Created new research note', 'Đã tạo nghiên cứu mới'));
  };

  const handleDeleteResearch = () => {
    if (!activeResearch) return;
    if (!window.confirm(t(`Delete "${activeResearch.title}"?`, `Xóa "${activeResearch.title}"?`))) return;
    triggerHaptic('warning');
    if (rjState.projects.length <= 1) {
      const today = getLocalDateStr();
      const blank = createBlankResearchProject(1, today, 'Nghiên cứu mới', 'PERSONAL PSYCHOLOGY');
      persistResearch((curr) => ({
        ...curr,
        lastActiveResearchId: blank.id,
        projects: [blank],
      }));
      db.psychologyPosts.delete(activeResearch.igPostId || `psy_${activeResearch.id}`).catch(() => {});
    } else {
      const remaining = rjState.projects.filter((p) => p.id !== activeResearch.id);
      persistResearch((curr) => ({
        ...curr,
        lastActiveResearchId: remaining[0].id,
        projects: remaining,
      }));
      db.psychologyPosts.delete(activeResearch.igPostId || `psy_${activeResearch.id}`).catch(() => {});
    }
    showToast(t('Deleted research note', 'Đã xóa nghiên cứu'), 'info');
  };

  const updateActiveResearch = (
    patch: Partial<{ quickNote: string; audios: MediaAttachmentRef[]; problemStatement: string }>
  ) => {
    if (!activeResearch) return;
    persistResearch((curr) => ({
      ...curr,
      projects: curr.projects.map((p) =>
        p.id === activeResearch.id ? { ...p, ...patch, updatedAt: Date.now() } : p
      ),
    }));
  };

  // --- Handlers: Writing Room ---
  const activeStory =
    spState.projects.find((p) => p.id === spState.activeProjectId) || spState.projects[0] || null;
  const activeScene: ScreenplayScene | null = activeStory
    ? activeStory.scenes.find((s) => s.id === activeStory.lastOpenedSceneId) ||
      activeStory.scenes[0] ||
      null
    : null;

  const updateActiveScene = (patch: Partial<ScreenplayScene>) => {
    if (!activeStory || !activeScene) return;
    persistScreenplay((curr) => ({
      ...curr,
      projects: curr.projects.map((proj) =>
        proj.id !== activeStory.id
          ? proj
          : {
              ...proj,
              updatedAt: Date.now(),
              scenes: proj.scenes.map((sc) =>
                sc.id === activeScene.id ? { ...sc, ...patch, updatedAt: Date.now() } : sc
              ),
            }
      ),
    }));
  };

  const handleAddChapter = () => {
    if (!activeStory) return;
    triggerHaptic('light');
    const nextNum = String(activeStory.scenes.length + 1).padStart(2, '0');
    const newScene: ScreenplayScene = {
      id: createId('sc'),
      sceneNumber: nextNum,
      title: `Phân đoạn ${nextNum}`,
      act: 'Act I — Thiết lập',
      status: 'Draft',
      intExt: 'INT.',
      locationId: '',
      locationName: 'BỐI CẢNH MỚI',
      timeOfDay: 'ĐÊM',
      actionDescription: '',
      dialogues: [],
      transition: 'CUT TO:',
      characterIds: [],
      relatedEventIds: [],
      clue: '',
      purposeNote: '',
      audios: [],
      updatedAt: Date.now(),
    };
    persistScreenplay((curr) => ({
      ...curr,
      projects: curr.projects.map((p) =>
        p.id === activeStory.id
          ? {
              ...p,
              scenes: [...p.scenes, newScene],
              lastOpenedSceneId: newScene.id,
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
    showToast(t(`Added Chapter ${nextNum}`, `Đã thêm Chương ${nextNum}`));
  };

  const handleDeleteChapter = () => {
    if (!activeStory || !activeScene) return;
    if (
      !window.confirm(
        t(`Delete Chapter ${activeScene.sceneNumber}?`, `Xóa Chương ${activeScene.sceneNumber}?`)
      )
    ) {
      return;
    }
    triggerHaptic('warning');
    if (activeStory.scenes.length <= 1) {
      updateActiveScene({ purposeNote: '', audios: [] });
      showToast(t(`Cleared Chapter ${activeScene.sceneNumber}`, `Đã dọn sạch Chương ${activeScene.sceneNumber}`), 'info');
      return;
    }

    const filtered = activeStory.scenes
      .filter((s) => s.id !== activeScene.id)
      .map((s, idx) => ({
        ...s,
        sceneNumber: String(idx + 1).padStart(2, '0'),
      }));
    persistScreenplay((curr) => ({
      ...curr,
      projects: curr.projects.map((p) =>
        p.id === activeStory.id
          ? {
              ...p,
              scenes: filtered,
              lastOpenedSceneId: filtered[0]?.id,
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
    showToast(t(`Deleted Chapter ${activeScene.sceneNumber}`, `Đã xóa Chương ${activeScene.sceneNumber}`), 'info');
  };

  return (
    <div className="space-y-4 pb-6">
      <SegmentedControl
        value={sub}
        onChange={onChangeSub}
        options={[
          { value: 'lectures', label: t('AI Workflow', 'AI Workflow') },
          { value: 'psychology', label: t('Psychology', 'Tâm lý học') },
          { value: 'stories', label: t('Writing', 'Phòng Viết') },
        ]}
      />

      {/* =====================================================================
          1. AI WORKFLOW — NOTE + VOICE ONLY
         ===================================================================== */}
      {sub === 'lectures' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="ios-section-header">
                {t('Select Workflow Lecture', 'Chọn bài giảng Workflow')}
              </label>
              <div className="flex items-center gap-2">
                {activeLecture && (
                  <button
                    type="button"
                    onClick={handleDeleteLecture}
                    className="px-2.5 py-1 rounded-full text-[12px] font-medium cursor-pointer ios-pressable"
                    style={{
                      backgroundColor: 'rgba(194, 123, 118, 0.14)',
                      color: 'var(--os-crimson)',
                      border: '1px solid rgba(194, 123, 118, 0.35)',
                    }}
                  >
                    {t('Delete', 'Xóa')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCreateLecture}
                  className="px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer ios-pressable"
                  style={{
                    backgroundColor: 'rgba(203, 168, 106, 0.14)',
                    color: 'var(--os-brass)',
                    border: '1px solid rgba(203, 168, 106, 0.35)',
                  }}
                >
                  {t('+ New', '+ Tạo mới')}
                </button>
              </div>
            </div>

            {lectures.length === 0 ? (
              <p className="text-[13px] py-2" style={{ color: 'var(--os-ivory-muted)' }}>
                {t('No lectures yet. Tap + New to start.', 'Chưa có bài giảng nào. Bấm + Tạo mới để ghi nhanh.')}
              </p>
            ) : (
              <CompactPicker
                value={activeLecture?.id || ''}
                options={lectures.map((lec) => ({ value: lec.id, label: lec.title }))}
                onChange={(val) => setSelectedLectureId(val)}
              />
            )}
          </Card>

          {activeLecture && (
            <>
              <Card>
                <div className="space-y-2">
                  <span className="ios-section-header block">
                    {t('Quick Note', 'Ghi chú (Field Notes)')}
                  </span>
                  <textarea
                    rows={5}
                    value={activeLecture.notes || ''}
                    onChange={(e) =>
                      updateLectureField(activeLecture.id, { notes: e.target.value })
                    }
                    placeholder={t(
                      'Jot down key takeaways, prompts, or fixes...',
                      'Ghi chú nhanh ý tưởng, prompt hoặc điểm cần sửa...'
                    )}
                    className="w-full p-3.5 rounded-[12px] text-[14px] leading-relaxed resize-y"
                    style={{
                      backgroundColor: 'var(--os-stone)',
                      color: 'var(--os-ivory-bright)',
                      border: '1px solid var(--os-border)',
                    }}
                  />
                </div>
              </Card>

              <Card>
                <AudioRecorderPlayer
                  compactMobile
                  title={t('Voice Note · Workflow', 'Ghi âm · AI Workflow')}
                  emptyHint={t(
                    'Tap Record to explain this workflow using your iPhone mic.',
                    'Bấm Ghi âm để thu nhanh ý tưởng AI Workflow trên iPhone.'
                  )}
                  audios={activeLecture.audios || []}
                  onChange={(next) =>
                    updateLectureField(activeLecture.id, {
                      audios: next,
                      checklist: { ...activeLecture.checklist, audio: next.length > 0 },
                    })
                  }
                />
              </Card>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          2. PSYCHOLOGY RESEARCH — NOTE + VOICE ONLY
         ===================================================================== */}
      {sub === 'psychology' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="ios-section-header">
                {t('Research Project', 'Dự án Nghiên cứu')}
              </label>
              <div className="flex items-center gap-2">
                {activeResearch && (
                  <button
                    type="button"
                    onClick={handleDeleteResearch}
                    className="px-2.5 py-1 rounded-full text-[12px] font-medium cursor-pointer ios-pressable"
                    style={{
                      backgroundColor: 'rgba(194, 123, 118, 0.14)',
                      color: 'var(--os-crimson)',
                      border: '1px solid rgba(194, 123, 118, 0.35)',
                    }}
                  >
                    {t('Delete', 'Xóa')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCreateResearch}
                  className="px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer ios-pressable"
                  style={{
                    backgroundColor: 'rgba(203, 168, 106, 0.14)',
                    color: 'var(--os-brass)',
                    border: '1px solid rgba(203, 168, 106, 0.35)',
                  }}
                >
                  {t('+ New', '+ Tạo mới')}
                </button>
              </div>
            </div>

            {activeResearch && (
              <CompactPicker
                value={activeResearch.id}
                options={rjState.projects.map((p) => ({
                  value: p.id,
                  label: `${p.code} — ${p.title}`,
                }))}
                onChange={(val) =>
                  persistResearch((curr) => ({ ...curr, lastActiveResearchId: val }))
                }
              />
            )}
          </Card>

          {activeResearch && (
            <>
              <Card>
                <div className="space-y-2">
                  <span className="ios-section-header block">
                    {t('Research Note', 'Ghi chú nghiên cứu')}
                  </span>
                  <textarea
                    rows={5}
                    value={activeResearch.quickNote ?? activeResearch.observation ?? ''}
                    onChange={(e) => updateActiveResearch({ quickNote: e.target.value })}
                    placeholder={t(
                      'Capture psychological observations, patterns, or quick notes...',
                      'Ghi chú nhanh quan sát tâm lý, hiện tượng hoặc câu hỏi vừa nảy ra...'
                    )}
                    className="w-full p-3.5 rounded-[12px] text-[14px] leading-relaxed resize-y"
                    style={{
                      backgroundColor: 'var(--os-stone)',
                      color: 'var(--os-ivory-bright)',
                      border: '1px solid var(--os-border)',
                    }}
                  />
                </div>
              </Card>

              <Card>
                <AudioRecorderPlayer
                  compactMobile
                  title={t('Voice Note · Research', 'Ghi âm · Nghiên cứu')}
                  emptyHint={t(
                    'Tap Record to save a voice memo for this study.',
                    'Bấm Ghi âm để lưu voice note cho dự án nghiên cứu này.'
                  )}
                  audios={activeResearch.audios || []}
                  onChange={(next) => updateActiveResearch({ audios: next })}
                />
              </Card>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          3. WRITING ROOM (STORY STUDIO) — CHAPTER NOTE + VOICE ONLY
         ===================================================================== */}
      {sub === 'stories' && activeStory && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-3">
              <div>
                <label className="ios-section-header block mb-1.5">
                  {t('Story Project', 'Dự án Truyện / Kịch bản')}
                </label>
                <CompactPicker
                  value={activeStory.id}
                  options={spState.projects.map((p) => ({ value: p.id, label: p.title }))}
                  onChange={(val) =>
                    persistScreenplay((curr) => ({ ...curr, activeProjectId: val }))
                  }
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="ios-section-header">
                    {t('Chapter', 'Chương / Phân đoạn')}
                  </label>
                  <div className="flex items-center gap-2">
                    {activeScene && (
                      <button
                        type="button"
                        onClick={handleDeleteChapter}
                        className="px-2.5 py-1 rounded-full text-[12px] font-medium cursor-pointer ios-pressable"
                        style={{
                          backgroundColor: 'rgba(194, 123, 118, 0.14)',
                          color: 'var(--os-crimson)',
                          border: '1px solid rgba(194, 123, 118, 0.35)',
                        }}
                      >
                        {t('Delete', 'Xóa')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddChapter}
                      className="px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer ios-pressable"
                      style={{
                        backgroundColor: 'rgba(203, 168, 106, 0.14)',
                        color: 'var(--os-brass)',
                        border: '1px solid rgba(203, 168, 106, 0.35)',
                      }}
                    >
                      {t('+ Chapter', '+ Chương')}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {activeStory.scenes.map((sc) => {
                    const selected = activeScene?.id === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          persistScreenplay((curr) => ({
                            ...curr,
                            projects: curr.projects.map((p) =>
                              p.id === activeStory.id
                                ? { ...p, lastOpenedSceneId: sc.id }
                                : p
                            ),
                          }));
                        }}
                        className="shrink-0 min-h-[38px] px-3.5 py-1.5 rounded-full text-[13px] font-medium cursor-pointer transition-colors"
                        style={{
                          backgroundColor: selected ? 'var(--os-brass)' : 'var(--os-stone)',
                          color: selected ? '#141311' : 'var(--os-ivory)',
                          border: selected
                            ? '1px solid var(--os-brass)'
                            : '1px solid var(--os-border)',
                        }}
                      >
                        Ch. {sc.sceneNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {activeScene && (
            <>
              <Card>
                <div className="space-y-2">
                  <span className="ios-section-header block">
                    {t(`Chapter ${activeScene.sceneNumber} Note`, `Ghi chú Chương ${activeScene.sceneNumber}`)}
                  </span>
                  <textarea
                    rows={5}
                    value={activeScene.purposeNote || ''}
                    onChange={(e) => updateActiveScene({ purposeNote: e.target.value })}
                    placeholder={t(
                      'Jot down chapter plot beats, dialogue sparks, or reminders...',
                      'Ghi chú nhanh diễn biến chương, câu thoại chợt nghĩ ra...'
                    )}
                    className="w-full p-3.5 rounded-[12px] text-[14px] leading-relaxed resize-y"
                    style={{
                      backgroundColor: 'var(--os-stone)',
                      color: 'var(--os-ivory-bright)',
                      border: '1px solid var(--os-border)',
                    }}
                  />
                </div>
              </Card>

              <Card>
                <AudioRecorderPlayer
                  compactMobile
                  title={t('Voice Note · Chapter', 'Ghi âm · Chương truyện')}
                  emptyHint={t(
                    'Tap Record to capture spoken dialogue or story ideas.',
                    'Bấm Ghi âm để thu nhanh thoại hoặc ý tưởng cho chương này.'
                  )}
                  audios={activeScene.audios || []}
                  onChange={(next) => updateActiveScene({ audios: next })}
                />
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
