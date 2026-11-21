import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createId } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import { useToast } from '../../components/ui/Primitives';
import { AudioRecorderPlayer } from '../../components/AudioRecorderPlayer';
import type {
  DialogueLine,
  ScreenplayProject,
  ScreenplayScene,
  StoryNoteItem,
} from './screenplayStudioData';

export function ScreenplayEditorStage({
  project,
  activeScene,
  focusMode,
  onToggleFocusMode,
  onUpdateProject,
  onAddScene,
  onOpenCharacterDossier,
  onExportScript,
}: {
  project: ScreenplayProject;
  activeScene: ScreenplayScene;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onUpdateProject: (
    patch: Partial<ScreenplayProject> | ((curr: ScreenplayProject) => ScreenplayProject)
  ) => void;
  onAddScene: () => void;
  onOpenCharacterDossier: (charId: string) => void;
  onExportScript: (fmt: 'md' | 'pdf') => void;
}) {
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [showBrainstorm, setShowBrainstorm] = useState(true);
  const storyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = storyTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  }, [activeScene.id, activeScene.actionDescription, focusMode]);

  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        onToggleFocusMode();
      }
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && focusMode) {
        onToggleFocusMode();
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [focusMode, onToggleFocusMode]);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [paperMode, setPaperMode] = useState<'standard' | 'continuous' | 'dual'>('standard');
  const [editingSlugline, setEditingSlugline] = useState(false);
  const [powerBalance, setPowerBalance] = useState(65);
  const [addingNoteOpen, setAddingNoteOpen] = useState(false);
  const [newNoteKind, setNewNoteKind] = useState<'sudden_dialogue' | 'open_question'>('sudden_dialogue');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const updateActiveScene = (updater: (sc: ScreenplayScene) => ScreenplayScene) => {
    onUpdateProject((curr) => ({
      ...curr,
      scenes: curr.scenes.map((s) =>
        s.id === activeScene.id ? { ...updater(s), updatedAt: Date.now() } : s
      ),
    }));
  };

  // Split actionDescription into paragraphs so we can interleave them with dialogues on the archival page
  const actionParagraphs = (activeScene.actionDescription || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const updateActionParagraph = (idx: number, nextText: string) => {
    const copy = [...actionParagraphs];
    copy[idx] = nextText;
    updateActiveScene((sc) => ({
      ...sc,
      actionDescription: copy.filter((p) => p.trim().length > 0).join('\n\n'),
    }));
  };

  const appendActionParagraph = () => {
    triggerHaptic('light');
    const nextPara = t(
      'New action beat — describe visual movement, atmosphere, or physical subtext...',
      'Mô tả hành động, ánh sáng hoặc cử chỉ phi ngôn ngữ mới trong cảnh...'
    );
    updateActiveScene((sc) => ({
      ...sc,
      actionDescription: sc.actionDescription.trim()
        ? `${sc.actionDescription.trim()}\n\n${nextPara}`
        : nextPara,
    }));
    showToast(t('Added new Action paragraph', 'Đã thêm đoạn Action mới vào trang kịch bản'));
  };

  const appendDialogueBlock = (prefillText?: string, prefillCharName?: string) => {
    triggerHaptic('light');
    const firstChar =
      project.characters.find(
        (c) => prefillCharName && c.name.toLowerCase() === prefillCharName.toLowerCase()
      ) ||
      project.characters[activeScene.dialogues.length % Math.max(1, project.characters.length)];
    const newDlg: DialogueLine = {
      id: createId('dlg'),
      characterId: firstChar?.id || '',
      characterName: (prefillCharName || firstChar?.name || 'LÀNH').toUpperCase(),
      parenthetical: t('speaking quietly,Measured cadence', 'giọng trầm thấp, ánh mắt dừng lại'),
      text:
        prefillText?.replace(/^[“"]|[”"]$/g, '') ||
        t('Enter character dialogue here...', 'Nhập lời thoại nhân vật tại đây...'),
    };
    updateActiveScene((sc) => ({
      ...sc,
      dialogues: [...sc.dialogues, newDlg],
    }));
    showToast(
      t(
        `Inserted dialogue for ${newDlg.characterName}`,
        `Đã chèn lời thoại của ${newDlg.characterName} vào kịch bản`
      )
    );
  };

  const cycleTransition = () => {
    const list = ['CUT TO:', 'DISSOLVE TO:', 'SMASH CUT TO:', 'MATCH CUT TO:', 'FADE OUT.'];
    const curIdx = list.indexOf(activeScene.transition || 'CUT TO:');
    const next = list[(curIdx + 1) % list.length];
    updateActiveScene((sc) => ({ ...sc, transition: next }));
    showToast(`${t('Transition:', 'Chuyển cảnh:')} ${next}`);
  };

  const handleSaveSnapshot = () => {
    triggerHaptic('success');
    const totalWords = project.scenes.reduce((acc, sc) => {
      const aw = sc.actionDescription.trim() ? sc.actionDescription.trim().split(/\s+/).length : 0;
      const dw = sc.dialogues.reduce(
        (s, d) => s + (d.text.trim() ? d.text.trim().split(/\s+/).length : 0),
        0
      );
      return acc + aw + dw;
    }, 0);
    const snapId = createId('ver');
    onUpdateProject((curr) => ({
      ...curr,
      versions: [
        {
          id: snapId,
          label: `Snapshot v2.${curr.versions.length + 4} — Scene ${activeScene.sceneNumber} (${activeScene.locationName})`,
          createdAt: Date.now(),
          sceneCount: curr.scenes.length,
          totalWords,
          scenesSnapshot: curr.scenes,
        },
        ...curr.versions,
      ],
    }));
    showToast(
      t(
        `Saved Snapshot · Scene ${activeScene.sceneNumber}`,
        `Đã lưu Snapshot kịch bản · Scene ${activeScene.sceneNumber}`
      )
    );
  };

  // Keyboard shortcuts Ctrl+1..6 and Ctrl+Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onAddScene();
      } else if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setEditingSlugline((v) => !v);
      } else if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        appendActionParagraph();
      } else if (e.ctrlKey && (e.key === '3' || e.key === '5')) {
        e.preventDefault();
        appendDialogueBlock();
      } else if (e.ctrlKey && e.key === '6') {
        e.preventDefault();
        cycleTransition();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const dialogueSparks = project.notes.filter((n) => n.category === 'sudden_dialogue');
  const openQuestions = project.notes.filter((n) => n.category === 'open_question');

  const sceneCharacters =
    project.characters.filter((c) => activeScene.characterIds.includes(c.id)).length > 0
      ? project.characters.filter((c) => activeScene.characterIds.includes(c.id))
      : project.characters.slice(0, 2);

  const handleCreateQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    const item: StoryNoteItem = {
      id: createId('snote'),
      category: newNoteKind,
      title: newNoteTitle.trim() || t('Scene 06 Note', 'Ghi chú cảnh'),
      content: newNoteContent.trim(),
      resolved: false,
      createdAt: Date.now(),
    };
    onUpdateProject((curr) => ({
      ...curr,
      notes: [item, ...curr.notes],
    }));
    setNewNoteTitle('');
    setNewNoteContent('');
    setAddingNoteOpen(false);
    showToast(t('Added note to Brainstorm Canvas', 'Đã thêm ghi chú vào bảng Brainstorm'));
  };

  return (
    <div
      className="flex-1 min-w-0 flex flex-col min-h-0 bg-[#111317] text-[#e2e2e8]"
    >
      {/* ===================================================================
          TOP EDITOR UTILITY STRIP
          =================================================================== */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0c0e12] border-b border-[#4e4638]/25 shadow-[0_1px_4px_rgba(0,0,0,0.5)] z-20">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[14px] font-semibold text-[#e2e2e8]">
            {t(`Chapter ${activeScene.sceneNumber}`, `Chương ${activeScene.sceneNumber}`)}
          </span>

          {/* Mode Switcher Pill Tabs */}
          <div className="flex items-center bg-[#1a1c20] p-1 rounded-full border border-[#4e4638]/30 gap-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShowBrainstorm(false);
              }}
              className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer ${
                !showBrainstorm
                  ? 'bg-[#c6a052] text-[#261900] font-semibold shadow-sm'
                  : 'text-[#d1c5b3] hover:text-white hover:bg-[#1e2024]'
              }`}
            >
              {t('Write', 'Viết truyện')}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShowBrainstorm((b) => !b);
              }}
              className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer ${
                showBrainstorm
                  ? 'bg-[#c6a052] text-[#261900] font-semibold shadow-sm'
                  : 'text-[#d1c5b3] hover:text-white hover:bg-[#1e2024]'
              }`}
            >
              {t('Note & Voice', 'Note & Thu âm')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!focusMode) {
                document.documentElement.requestFullscreen?.().catch(() => {});
              } else if (document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
              }
              onToggleFocusMode();
            }}
            title={t('Focus Writing Page (only the page)', 'Chỉ hiện trang viết toàn màn hình')}
            className={`px-2.5 py-1 rounded text-[11.5px] font-medium transition-colors cursor-pointer border flex items-center gap-1 ${
              focusMode
                ? 'bg-[#eac16f] text-[#261900] border-[#eac16f]'
                : 'bg-[#1e2024] hover:bg-[#282a2e] text-[#d1c5b3] border-[#4e4638]/30'
            }`}
          >
            <span>⤢</span>
            <span>{t('Focus', 'Tập trung')}</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSnapshot}
            className="px-3 py-1 rounded bg-[#eac16f] text-[#402d00] text-[11.5px] font-semibold hover:bg-[#ffe08b] transition-colors shadow-sm cursor-pointer"
          >
            {t('Save', 'Lưu')}
          </button>
        </div>
      </header>

      {/* ===================================================================
          CENTER STAGE + RIGHT SCENE INSPECTOR DRAWER
          =================================================================== */}
      <div className="grid grid-cols-12 w-full flex-1 min-h-0">
        {/* CENTER COLUMN: Chapter Writing Stage */}
        <div className="col-span-12 flex flex-col items-center bg-[#111317] px-3 sm:px-5 py-6 overflow-y-auto">
          {/* 1. SIMPLE CHAPTER NOTE & AUDIO RECORDER PANEL */}
          {showBrainstorm && (
            <div className="w-full max-w-[820px] mb-5 p-4 rounded-lg bg-[#0c0e12] border border-[#4e4638]/30 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="metadata text-[10.5px] uppercase tracking-[0.12em] text-[#eac16f] block">
                  {t('Chapter Note', 'Ghi chú chương')}
                </span>
                <textarea
                  rows={5}
                  value={activeScene.purposeNote || ''}
                  onChange={(e) =>
                    updateActiveScene((sc) => ({ ...sc, purposeNote: e.target.value }))
                  }
                  placeholder={t(
                    'Jot down notes, ideas, or reminders for this chapter...',
                    'Ghi chú nhanh ý tưởng hoặc dàn ý cho chương này...'
                  )}
                  className="w-full p-3 rounded-lg bg-[#1a1c20] border border-[#4e4638]/30 text-[13px] text-[#e2e2e8] leading-relaxed resize-y"
                />
              </div>

              <div className="space-y-2">
                <span className="metadata text-[10.5px] uppercase tracking-[0.12em] text-[#A7B6D2] block">
                  {t('Voice Note', 'Thu âm ý tưởng')}
                </span>
                <AudioRecorderPlayer
                  audios={activeScene.audios || []}
                  onChange={(next) => updateActiveScene((sc) => ({ ...sc, audios: next }))}
                />
              </div>
            </div>
          )}

          {/* 3. CLEAN CHAPTER WRITING PAGE */}
          <article className="w-full max-w-[820px] bg-[#0c0e12] text-[#e0e2e8] p-7 sm:p-10 md:p-12 shadow-2xl rounded-xl relative border border-[#4e4638]/30 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Chapter Title */}
              <div className="pb-4 border-b border-[#4e4638]/20 space-y-1.5">
                <span className="metadata text-[10.5px] uppercase tracking-[0.14em] text-[#eac16f]">
                  {t(`CHAPTER ${activeScene.sceneNumber}`, `CHƯƠNG ${activeScene.sceneNumber}`)}
                </span>
                <input
                  type="text"
                  value={activeScene.title || activeScene.locationName || ''}
                  onChange={(e) =>
                    updateActiveScene((sc) => ({
                      ...sc,
                      title: e.target.value,
                      locationName: e.target.value,
                    }))
                  }
                  placeholder={t('Enter chapter title...', 'Nhập tiêu đề chương...')}
                  className="w-full bg-transparent font-editorial text-[26px] sm:text-[30px] font-semibold text-[#edeae2] focus:outline-none placeholder:text-[#4b5563]"
                />
              </div>

              {/* Auto-growing Story Writing Area */}
              <textarea
                ref={storyTextareaRef}
                rows={4}
                value={activeScene.actionDescription}
                onChange={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.max(120, el.scrollHeight)}px`;
                  updateActiveScene((sc) => ({
                    ...sc,
                    actionDescription: e.target.value,
                  }));
                }}
                placeholder={t('Start writing your story here...', 'Bắt đầu viết nội dung truyện tại đây...')}
                className="w-full min-h-[120px] overflow-hidden bg-transparent text-[15.5px] leading-[1.85] text-[#e0e2e8] resize-none focus:outline-none placeholder:text-[#4b5563]"
              />
            </div>

            {/* Clean Chapter Footer */}
            <div className="mt-8 pt-4 border-t border-[#4e4638]/20 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#9a8f7f]">
              <button
                type="button"
                onClick={onAddScene}
                className="flex items-center gap-1.5 text-[#eac16f] hover:underline cursor-pointer"
              >
                <span>+</span>
                <span>{t('New Chapter', 'Tạo chương tiếp theo')}</span>
              </button>
              <span>
                {(activeScene.actionDescription.trim()
                  ? activeScene.actionDescription.trim().split(/\s+/).length
                  : 0
                ).toLocaleString()}{' '}
                {t('words', 'từ')}
              </span>
            </div>
          </article>
        </div>
      </div>

      {focusMode &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-[#0c0e12] text-[#e0e2e8] flex flex-col w-screen h-dvh">
            {/* Minimal Top Bar */}
            <div className="w-full px-6 sm:px-14 py-3.5 border-b border-[#1c202a] flex items-center justify-between shrink-0">
              <span className="metadata text-[11px] uppercase tracking-[0.16em] text-[#eac16f]">
                {t(`CHAPTER ${activeScene.sceneNumber}`, `CHƯƠNG ${activeScene.sceneNumber}`)}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen?.().catch(() => {});
                  }
                  onToggleFocusMode();
                }}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#181c24] hover:bg-[#222834] text-[#eac16f] border border-[#2d3545] cursor-pointer"
              >
                {t('Exit Focus (Esc)', 'Thoát toàn màn hình (Esc)')}
              </button>
            </div>

            {/* Full-screen Story Writing Area */}
            <div className="flex-1 w-full flex flex-col px-6 sm:px-14 md:px-24 py-6 overflow-y-auto min-h-0">
              <input
                type="text"
                value={activeScene.title || activeScene.locationName || ''}
                onChange={(e) =>
                  updateActiveScene((sc) => ({
                    ...sc,
                    title: e.target.value,
                    locationName: e.target.value,
                  }))
                }
                placeholder={t('Enter chapter title...', 'Nhập tiêu đề chương...')}
                className="w-full pb-4 mb-6 border-b border-[#1c202a] bg-transparent font-editorial text-[28px] sm:text-[34px] font-semibold text-[#edeae2] focus:outline-none placeholder:text-[#4b5563] shrink-0"
              />

              <textarea
                value={activeScene.actionDescription}
                onChange={(e) =>
                  updateActiveScene((sc) => ({
                    ...sc,
                    actionDescription: e.target.value,
                  }))
                }
                placeholder={t('Start writing your story here...', 'Bắt đầu viết nội dung truyện tại đây...')}
                className="flex-1 w-full min-h-[240px] bg-transparent text-[17px] leading-[1.9] text-[#e0e2e8] resize-none focus:outline-none placeholder:text-[#4b5563]"
              />
            </div>

            {/* Minimal Bottom Bar */}
            <div className="w-full px-6 sm:px-14 py-3 border-t border-[#1c202a] flex items-center justify-between font-mono text-[11.5px] text-[#9a8f7f] shrink-0">
              <button
                type="button"
                onClick={onAddScene}
                className="flex items-center gap-1.5 text-[#eac16f] hover:underline cursor-pointer"
              >
                <span>+</span>
                <span>{t('New Chapter', 'Tạo chương tiếp theo')}</span>
              </button>
              <span>
                {(activeScene.actionDescription.trim()
                  ? activeScene.actionDescription.trim().split(/\s+/).length
                  : 0
                ).toLocaleString()}{' '}
                {t('words', 'từ')}
              </span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
