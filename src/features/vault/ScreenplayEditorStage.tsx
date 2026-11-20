import React, { useEffect, useState } from 'react';
import { createId } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import { useToast } from '../../components/ui/Primitives';
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
      className={`${
        focusMode ? 'lg:col-span-12' : 'lg:col-span-10'
      } flex flex-col min-h-0 bg-[#111317] text-[#e2e2e8]`}
    >
      {/* ===================================================================
          TOP EDITOR UTILITY STRIP
          =================================================================== */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0c0e12] border-b border-[#4e4638]/25 shadow-[0_1px_4px_rgba(0,0,0,0.5)] z-20">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#eac16f]/10 text-[#eac16f] font-mono text-[10px] font-semibold">
              03
            </span>
            <span className="text-[14px] font-semibold text-[#e2e2e8] tracking-wide uppercase">
              {t('Screenplay Manuscript', 'Bản Thảo Kịch Bản')}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#1e2024] font-mono text-[10px] text-[#e2c471] border border-[#4e4638]/30">
              {project.draftSubtitle || 'DRAFT 2.4 · ACT II'}
            </span>
          </div>

          {/* Mode Switcher Pill Tabs */}
          <div className="flex items-center bg-[#1a1c20] p-1 rounded-full border border-[#4e4638]/30 gap-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShowBrainstorm(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                !showBrainstorm
                  ? 'bg-[#c6a052] text-[#261900] font-semibold shadow-sm'
                  : 'text-[#d1c5b3] hover:text-white hover:bg-[#1e2024]'
              }`}
            >
              <span>✎</span>
              <span>{t('Focus Writing', 'Tập Trung Viết')}</span>
              <span className="text-[9.5px] bg-black/20 px-1.5 py-0.2 rounded-full font-mono">
                Focus
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShowBrainstorm((b) => !b);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                showBrainstorm
                  ? 'bg-[#c6a052] text-[#261900] font-semibold shadow-sm'
                  : 'text-[#d1c5b3] hover:text-white hover:bg-[#1e2024]'
              }`}
            >
              <span>❖</span>
              <span>{t('Brainstorm & Outline', 'Brainstorm & Phác Thảo')}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[9.5px] font-mono font-semibold">
                Canvas
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="hidden xl:flex items-center gap-3 font-mono text-[10.5px] text-[#d1c5b3]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#eac16f]">⏱</span>
              <span>{t('19m 24s est. runtime', '19m 24s thời lượng ước tính')}</span>
            </div>
            <span className="text-[#4e4638]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#e2c471]">📄</span>
              <span>{t('Page 19 / 110', 'Trang 19 / 110')}</span>
            </div>
            <span className="text-[#4e4638]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#9a8f7f]">⌨</span>
              <span>4,280 {t('words', 'từ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleFocusMode}
              title={t('Toggle Full Stage Focus Mode', 'Chế độ tập trung (Ẩn/Hiện cột trái)')}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                focusMode
                  ? 'bg-[#eac16f] text-[#261900] border-[#eac16f]'
                  : 'bg-[#1e2024] hover:bg-[#282a2e] text-[#d1c5b3] border-[#4e4638]/30'
              }`}
            >
              ⤢
            </button>
            <button
              type="button"
              onClick={() => setInspectorOpen((v) => !v)}
              title={t('Toggle Scene Inspector', 'Bật/Tắt Scene Inspector')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[11px] transition-colors cursor-pointer border ${
                inspectorOpen
                  ? 'bg-[#1e2024] text-[#eac16f] border-[#eac16f]/40'
                  : 'bg-[#1e2024] text-[#d1c5b3] border-[#4e4638]/30'
              }`}
            >
              <span>◨</span>
              <span className="hidden sm:inline">Inspector</span>
            </button>
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="flex items-center gap-1 px-3 py-1 rounded bg-[#eac16f] text-[#402d00] font-mono text-[11px] font-semibold hover:bg-[#ffe08b] transition-colors shadow-sm cursor-pointer"
            >
              <span>✦</span>
              <span>{t('Save Snapshot', 'Lưu Snapshot')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================
          CENTER STAGE + RIGHT SCENE INSPECTOR DRAWER
          =================================================================== */}
      <div className="grid grid-cols-12 w-full flex-1 min-h-0">
        {/* CENTER COLUMN: Screenplay Canvas Stage */}
        <div
          className={`col-span-12 ${
            inspectorOpen ? 'xl:col-span-8' : 'xl:col-span-12'
          } flex flex-col items-center bg-[#111317] px-3 sm:px-5 py-4 overflow-y-auto`}
        >
          {/* 1. BRAINSTORM & PHÁC THẢO CẢNH PANEL */}
          {showBrainstorm && (
            <div className="w-full max-w-[820px] mb-5 p-4 rounded-lg bg-[#0c0e12] border border-[#4e4638]/30 shadow-xl flex flex-col gap-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#4e4638]/20">
                <div className="flex items-center gap-2">
                  <span className="text-[#eac16f] text-[16px]">❖</span>
                  <h3 className="text-[15px] font-semibold text-[#e2e2e8]">
                    {t(
                      `Brainstorm & Scene ${activeScene.sceneNumber} Outline`,
                      `Brainstorm & Phác Thảo Cảnh ${activeScene.sceneNumber}`
                    )}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#eac16f]/10 text-[#eac16f] font-mono text-[10.5px] font-semibold border border-[#eac16f]/20">
                    Tension: 8/10
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10.5px]">
                  <span className="text-[#9a8f7f] hidden sm:inline">
                    {t('Click any line to insert into script', 'Bấm chèn trực tiếp ý tưởng vào kịch bản')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddingNoteOpen((v) => !v)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e2024] hover:bg-[#282a2e] text-[#eac16f] font-semibold transition-colors border border-[#4e4638]/30 cursor-pointer"
                  >
                    <span>+</span>
                    <span>{t('Add Note', 'Thêm Note')}</span>
                  </button>
                </div>
              </div>

              {addingNoteOpen && (
                <form
                  onSubmit={handleCreateQuickNote}
                  className="p-3 rounded-lg bg-[#1a1c20] border border-[#eac16f]/30 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <select
                      value={newNoteKind}
                      onChange={(e) =>
                        setNewNoteKind(e.target.value as 'sudden_dialogue' | 'open_question')
                      }
                      className="px-2.5 py-1.5 rounded bg-[#0c0e12] text-[12px] text-[#eac16f] border border-[#4e4638]/40"
                    >
                      <option value="sudden_dialogue">
                        {t('💡 Sudden Dialogue Spark', '💡 Câu Thoại Chợt Lóe')}
                      </option>
                      <option value="open_question">
                        {t('? Open Story Question', '? Câu Hỏi Kịch Bản Mở')}
                      </option>
                    </select>
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder={t('Character or question label...', 'Gợi ý cho nhân vật hoặc câu hỏi...')}
                      className="flex-1 px-3 py-1.5 rounded bg-[#0c0e12] text-[12.5px] text-white border border-[#4e4638]/40"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder={t('Dialogue line or beat note...', 'Nội dung câu thoại hoặc hướng xử lý...')}
                      className="flex-1 px-3 py-1.5 rounded bg-[#0c0e12] text-[12.5px] text-white border border-[#4e4638]/40"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded bg-[#eac16f] text-[#261900] text-[12px] font-semibold cursor-pointer"
                    >
                      {t('Save', 'Lưu')}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Column 1: Dialogue Snippets & Idea Sparks */}
                <div className="flex flex-col gap-2 p-3 rounded bg-[#1a1c20] border border-[#4e4638]/20">
                  <div className="flex items-center justify-between font-mono text-[10.5px] text-[#e2c471] font-semibold">
                    <span className="flex items-center gap-1">
                      <span>💡</span>
                      {t('Sudden Dialogue Sparks', 'Câu Thoại Chợt Lóe')}
                    </span>
                    <span className="text-[10px] text-[#9a8f7f]">
                      {dialogueSparks.length} {t('sparks', 'ý tưởng')}
                    </span>
                  </div>

                  {dialogueSparks.slice(0, 3).map((sp, idx) => (
                    <div
                      key={sp.id}
                      className={`p-2 rounded bg-[#282a2e] border-l-2 ${
                        idx === 0 ? 'border-[#e2c471]' : 'border-[#9a8f7f]'
                      } text-[12px] leading-relaxed`}
                    >
                      <p className="italic text-[#e2e2e8]">{sp.content}</p>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#9a8f7f]">
                        <span className="truncate">{sp.title}</span>
                        <button
                          type="button"
                          onClick={() =>
                            appendDialogueBlock(
                              sp.content,
                              sp.title.toLowerCase().includes('út') ? 'ÚT' : 'LÀNH'
                            )
                          }
                          className="text-[#eac16f] hover:underline font-semibold shrink-0 cursor-pointer"
                        >
                          {t('Insert →', 'Chèn vào thoại →')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 2: Conflict Matrix & Subtext */}
                <div className="flex flex-col gap-2 p-3 rounded bg-[#1a1c20] border border-[#4e4638]/20">
                  <div className="flex items-center justify-between font-mono text-[10.5px] text-[#eac16f] font-semibold">
                    <span className="flex items-center gap-1">
                      <span>⚡</span>
                      {t('Subtext Conflict Matrix', 'Sơ Đồ Xung Đột Ngầm')}
                    </span>
                    <span className="text-[10px] text-[#eac16f]/80">Beat 14</span>
                  </div>

                  <div className="p-2.5 rounded bg-[#282a2e] border-l-2 border-[#eac16f] text-[12px] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#eac16f] text-[10.5px] uppercase tracking-wider">
                        {t('Dialogue Power Balance', 'Cán cân vị thế thoại')}
                      </span>
                      <input
                        type="range"
                        min={20}
                        max={85}
                        value={powerBalance}
                        onChange={(e) => setPowerBalance(Number(e.target.value))}
                        className="w-16 accent-[#eac16f] cursor-pointer"
                        title={t('Adjust scene power balance', 'Kéo để điều chỉnh cán cân áp lực trong cảnh')}
                      />
                    </div>
                    <div className="w-full h-1.5 bg-[#0c0e12] rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#e2c471] h-full transition-all"
                        style={{ width: `${powerBalance}%` }}
                      />
                      <div
                        className="bg-[#9a8f7f] h-full transition-all"
                        style={{ width: `${100 - powerBalance}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#d1c5b3] pt-0.5">
                      <span>
                        {sceneCharacters[1]?.name || 'Út'} {t('pressing', 'ép cung')} ({powerBalance}%)
                      </span>
                      <span>
                        {sceneCharacters[0]?.name || 'Lành'} {t('evading', 'né tránh')} (
                        {100 - powerBalance}%)
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[#282a2e] border-l-2 border-[#ffb4ab]/70 text-[12px] text-[#d1c5b3] leading-relaxed">
                    <span className="text-[#ffb4ab] font-semibold text-[11px] block mb-0.5">
                      {t('Emotional Breaking Point', 'Điểm Gãy Cảm Xúc (Breaking Point)')}
                    </span>
                    {activeScene.clue ||
                      'Tiếng đũa rơi xuống mâm nhôm là thời điểm phòng thủ phi ngôn ngữ của Lành sụp đổ hoàn toàn.'}
                  </div>
                </div>

                {/* Column 3: Open Story Questions & Next Beats */}
                <div className="flex flex-col gap-2 p-3 rounded bg-[#1a1c20] border border-[#4e4638]/20">
                  <div className="flex items-center justify-between font-mono text-[10.5px] text-[#e2e2e8] font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="text-[#e9c349]">?</span>
                      {t('Open Story Questions', 'Câu Hỏi Kịch Bản Mở')}
                    </span>
                    <span className="text-[10px] text-[#9a8f7f]">
                      {t('To resolve', 'Cần xử lý')}
                    </span>
                  </div>

                  {openQuestions.slice(0, 3).map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-2 rounded bg-[#282a2e] border border-dashed border-[#4e4638]/40 text-[12px] text-[#d1c5b3] flex flex-col gap-1"
                    >
                      <p className="text-[#e2e2e8] font-medium">{q.title}</p>
                      <span
                        className={`text-[10px] ${
                          idx === 1 ? 'text-[#e2c471]' : 'text-[#9a8f7f]'
                        }`}
                      >
                        {q.content}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. HOLLYWOOD STANDARD FLOATING TOOLBAR */}
          <div className="sticky top-0 z-30 w-full max-w-[820px] bg-[#0c0e12]/95 backdrop-blur-md p-1.5 rounded-lg shadow-xl mb-4 flex flex-wrap items-center justify-between gap-2 border border-[#4e4638]/30">
            {/* View mode tabs */}
            <div className="flex items-center gap-1 bg-[#1e2024] p-0.5 rounded">
              {(
                [
                  ['standard', 'Standard (8.5×11")'],
                  ['continuous', 'Continuous'],
                  ['dual', 'Dual-Beat'],
                ] as const
              ).map(([modeId, lbl]) => (
                <button
                  key={modeId}
                  type="button"
                  onClick={() => setPaperMode(modeId)}
                  className={`px-2.5 py-1 rounded font-mono text-[10.5px] transition-colors cursor-pointer ${
                    paperMode === modeId
                      ? 'bg-[#282a2e] text-[#e2e2e8] font-semibold shadow-xs'
                      : 'text-[#d1c5b3] hover:text-white'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {/* Script Element Quick-Inserters (Ctrl+1 to Ctrl+6) */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 font-mono text-[10.5px]">
              <button
                type="button"
                onClick={() => setEditingSlugline((v) => !v)}
                title="Scene Heading (Ctrl+1)"
                className="px-2 py-1 rounded bg-[#1e2024] hover:bg-[#282a2e] text-[#e2e2e8] flex items-center gap-1 cursor-pointer"
              >
                <span className="text-[#eac16f] font-bold">#</span>
                <span className="hidden sm:inline">Slugline</span>
                <kbd className="text-[9px] text-[#9a8f7f] bg-[#0c0e12] px-1 rounded">^1</kbd>
              </button>
              <button
                type="button"
                onClick={appendActionParagraph}
                title="Add Action Paragraph (Ctrl+2)"
                className="px-2 py-1 rounded bg-[#1e2024] hover:bg-[#282a2e] text-[#e2e2e8] flex items-center gap-1 cursor-pointer"
              >
                <span>Action</span>
                <kbd className="text-[9px] text-[#9a8f7f] bg-[#0c0e12] px-1 rounded">^2</kbd>
              </button>
              <button
                type="button"
                onClick={() => appendDialogueBlock()}
                title="Add Character Cue (Ctrl+3)"
                className="px-2 py-1 rounded bg-[#1e2024] hover:bg-[#282a2e] text-[#e2e2e8] flex items-center gap-1 cursor-pointer"
              >
                <span>Char</span>
                <kbd className="text-[9px] text-[#9a8f7f] bg-[#0c0e12] px-1 rounded">^3</kbd>
              </button>
              <button
                type="button"
                onClick={() => appendDialogueBlock()}
                title="Parenthetical (Ctrl+4)"
                className="px-2 py-1 rounded bg-[#1e2024] hover:bg-[#282a2e] text-[#e2e2e8] flex items-center gap-1 cursor-pointer"
              >
                <span>(Paren)</span>
                <kbd className="text-[9px] text-[#9a8f7f] bg-[#0c0e12] px-1 rounded">^4</kbd>
              </button>
              <button
                type="button"
                onClick={() => appendDialogueBlock()}
                title="Add Dialogue (Ctrl+5)"
                className="px-2 py-1 rounded bg-[#1e2024] hover:bg-[#282a2e] text-[#e2e2e8] flex items-center gap-1 cursor-pointer"
              >
                <span>Dialogue</span>
                <kbd className="text-[9px] text-[#9a8f7f] bg-[#0c0e12] px-1 rounded">^5</kbd>
              </button>
              <button
                type="button"
                onClick={cycleTransition}
                title="Cycle Transition (Ctrl+6)"
                className="px-2 py-1 rounded bg-[#1e2024] hover:bg-[#282a2e] text-[#e2e2e8] flex items-center gap-1 cursor-pointer"
              >
                <span>Trans</span>
                <kbd className="text-[9px] text-[#9a8f7f] bg-[#0c0e12] px-1 rounded">^6</kbd>
              </button>
            </div>

            {/* Export / Print */}
            <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
              <button
                type="button"
                onClick={() => onExportScript('md')}
                className="px-2 py-1 rounded bg-[#1e2024] hover:text-[#eac16f] text-[#d1c5b3] cursor-pointer"
              >
                .MD
              </button>
              <button
                type="button"
                onClick={() => onExportScript('pdf')}
                className="px-2 py-1 rounded bg-[#1e2024] hover:text-[#eac16f] text-[#d1c5b3] cursor-pointer"
              >
                Print
              </button>
            </div>
          </div>

          {/* 3. THE SCRIPT CANVAS: Simulated Archival Paper Page */}
          <article
            className={`w-full ${
              paperMode === 'dual' ? 'max-w-[960px]' : 'max-w-[820px]'
            } bg-[#0c0e12] text-[#e0e2e8] p-7 sm:p-12 md:p-14 shadow-2xl rounded-sm min-h-[920px] relative border border-[#4e4638]/30 flex flex-col justify-between`}
          >
            <div>
              {/* Archival Watermark / Script Header Marks */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[#9a8f7f] font-mono text-[10.5px] pb-6 border-b border-[#4e4638]/20 mb-8">
                <span className="tracking-widest uppercase">
                  {project.title.toUpperCase()} · {t('OCTOBER MANUSCRIPT', 'BẢN THẢO THÁNG 10')}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-[#eac16f] font-semibold">DRAFT 2 (FINAL POLISH)</span>
                  <span className="text-[#e2e2e8] font-bold">TRANG 19.</span>
                </div>
              </div>

              {/* SCRIPT CONTENT BLOCKS (Strict Industry Standard Proportions & Monospace Courier style) */}
              <div className="flex flex-col gap-6 font-mono text-[14px] leading-[22px] tracking-wide text-[#e2e2e8]">
                {/* Slugline / Scene Heading */}
                <div className="group relative flex flex-col gap-2 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-[#eac16f] text-[#402d00] font-mono text-[11px] font-bold tracking-wider">
                        SCENE {activeScene.sceneNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingSlugline((v) => !v)}
                        className="font-bold text-[15px] tracking-wider text-[#eac16f] uppercase text-left hover:underline cursor-pointer"
                      >
                        {activeScene.intExt} {activeScene.locationName} - {activeScene.timeOfDay}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 font-sans text-[11px] text-[#9a8f7f]">
                      <button
                        type="button"
                        onClick={() => setEditingSlugline((v) => !v)}
                        className="hover:text-[#eac16f] cursor-pointer"
                      >
                        {editingSlugline ? t('Done', 'Xong') : t('Edit Slugline', 'Sửa tiêu đề cảnh')}
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={appendActionParagraph}
                        className="hover:text-[#eac16f] cursor-pointer"
                      >
                        {t('+ Action Beat', '+ Thêm Beat')}
                      </button>
                    </div>
                  </div>

                  {editingSlugline && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-[#1a1c20] border border-[#eac16f]/30">
                      <select
                        value={activeScene.intExt}
                        onChange={(e) =>
                          updateActiveScene((sc) => ({
                            ...sc,
                            intExt: e.target.value as ScreenplayScene['intExt'],
                          }))
                        }
                        className="px-2.5 py-1.5 rounded bg-[#0c0e12] text-[#eac16f] font-bold text-[12.5px]"
                      >
                        <option value="INT.">INT.</option>
                        <option value="EXT.">EXT.</option>
                        <option value="INT./EXT.">INT./EXT.</option>
                      </select>
                      <input
                        type="text"
                        value={activeScene.locationName}
                        onChange={(e) =>
                          updateActiveScene((sc) => ({
                            ...sc,
                            locationName: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="LOCATION"
                        className="px-2.5 py-1.5 rounded bg-[#0c0e12] text-white font-bold uppercase text-[12.5px]"
                      />
                      <input
                        type="text"
                        value={activeScene.timeOfDay}
                        onChange={(e) =>
                          updateActiveScene((sc) => ({
                            ...sc,
                            timeOfDay: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="ĐÊM / NIGHT"
                        className="px-2.5 py-1.5 rounded bg-[#0c0e12] text-[#e2c471] font-bold uppercase text-[12.5px]"
                      />
                    </div>
                  )}
                </div>

                {/* Action Paragraph 1 */}
                {actionParagraphs[0] !== undefined ? (
                  <div className="w-full max-w-[700px]">
                    <textarea
                      rows={Math.max(2, Math.ceil(actionParagraphs[0].length / 72))}
                      value={actionParagraphs[0]}
                      onChange={(e) => updateActionParagraph(0, e.target.value)}
                      className="w-full bg-transparent text-[#d1c5b3] leading-relaxed resize-y focus:outline-none focus:bg-[#1a1c20]/60 focus:px-2 py-1 rounded transition-colors"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={appendActionParagraph}
                    className="text-left text-[13px] text-[#9a8f7f] italic hover:text-[#eac16f] cursor-pointer"
                  >
                    + {t('Click to write opening action description...', 'Bấm để viết đoạn mở đầu cảnh (Action)...')}
                  </button>
                )}

                {/* Interleaved Dialogues & Subsequent Action Paragraphs */}
                {activeScene.dialogues.map((dlg, dIdx) => (
                  <React.Fragment key={dlg.id}>
                    <div className="group relative py-1 rounded hover:bg-[#1a1c20]/40 transition-colors">
                      {/* Delete dialogue button on hover */}
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveScene((sc) => ({
                            ...sc,
                            dialogues: sc.dialogues.filter((d) => d.id !== dlg.id),
                          }))
                        }
                        className="opacity-0 group-hover:opacity-100 absolute right-2 top-1 text-[11px] text-[#9a8f7f] hover:text-[#ffb4ab] cursor-pointer"
                        title={t('Remove dialogue block', 'Xóa khối thoại này')}
                      >
                        ✕
                      </button>

                      {/* Character Cue (Centered in traditional screenplays) */}
                      <div className="flex flex-col items-center pt-1">
                        <select
                          value={dlg.characterId}
                          onChange={(e) => {
                            const cId = e.target.value;
                            const found = project.characters.find((c) => c.id === cId);
                            updateActiveScene((sc) => ({
                              ...sc,
                              dialogues: sc.dialogues.map((d) =>
                                d.id === dlg.id
                                  ? {
                                      ...d,
                                      characterId: cId,
                                      characterName: found?.name.toUpperCase() || d.characterName,
                                    }
                                  : d
                              ),
                            }));
                          }}
                          className="font-bold tracking-widest text-[15px] text-[#e2e2e8] uppercase bg-transparent text-center cursor-pointer focus:outline-none hover:text-[#eac16f]"
                        >
                          {project.characters.map((c) => (
                            <option
                              key={c.id}
                              value={c.id}
                              style={{ backgroundColor: '#1a1c20', color: '#e2e2e8' }}
                            >
                              {c.name.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Parenthetical (Centered italic) */}
                      <div className="flex flex-col items-center mt-0.5">
                        <input
                          type="text"
                          value={
                            dlg.parenthetical
                              ? dlg.parenthetical.startsWith('(')
                                ? dlg.parenthetical
                                : `(${dlg.parenthetical})`
                              : ''
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/^\(|\)$/g, '');
                            updateActiveScene((sc) => ({
                              ...sc,
                              dialogues: sc.dialogues.map((d) =>
                                d.id === dlg.id ? { ...d, parenthetical: raw } : d
                              ),
                            }));
                          }}
                          placeholder={t('(parenthetical action / tone)', '(diễn tả cảm xúc / cử chỉ)')}
                          className="italic text-[#d1c5b3]/80 text-[13px] bg-transparent text-center w-full max-w-[440px] focus:outline-none"
                        />
                      </div>

                      {/* Dialogue (Standard Indented Screenplay Width: max-w-[460px]) */}
                      <div className="mx-auto max-w-[460px] text-left text-[#e2e2e8] font-medium leading-relaxed mt-1">
                        <textarea
                          rows={Math.max(2, Math.ceil(dlg.text.length / 48))}
                          value={dlg.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveScene((sc) => ({
                              ...sc,
                              dialogues: sc.dialogues.map((d) =>
                                d.id === dlg.id ? { ...d, text: val } : d
                              ),
                            }));
                          }}
                          className="w-full bg-transparent text-[#e2e2e8] leading-relaxed resize-y focus:outline-none focus:bg-[#1a1c20]/60 px-2 py-1 rounded"
                        />
                      </div>
                    </div>

                    {/* Interleaved Action Paragraph after this dialogue if present */}
                    {actionParagraphs[dIdx + 1] !== undefined && (
                      <div
                        className={
                          dIdx + 1 === actionParagraphs.length - 1
                            ? 'relative w-full max-w-[700px] leading-relaxed pl-3 border-l-2 border-[#eac16f]/70 bg-[#1e2024]/30 py-2 rounded-r'
                            : 'w-full max-w-[700px] leading-relaxed pt-1'
                        }
                      >
                        <textarea
                          rows={Math.max(2, Math.ceil(actionParagraphs[dIdx + 1].length / 72))}
                          value={actionParagraphs[dIdx + 1]}
                          onChange={(e) => updateActionParagraph(dIdx + 1, e.target.value)}
                          className="w-full bg-transparent text-[#e2e2e8] leading-relaxed resize-y focus:outline-none"
                        />
                        {dIdx + 1 === actionParagraphs.length - 1 && (
                          <span className="inline-block w-2 h-4 bg-[#eac16f] align-middle ml-1 animate-pulse" />
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {/* Any extra trailing Action Paragraphs beyond dialogue count */}
                {actionParagraphs.slice(activeScene.dialogues.length + 1).map((para, extraIdx) => {
                  const realIdx = activeScene.dialogues.length + 1 + extraIdx;
                  const isLast = realIdx === actionParagraphs.length - 1;
                  return (
                    <div
                      key={realIdx}
                      className={
                        isLast
                          ? 'relative w-full max-w-[700px] leading-relaxed pl-3 border-l-2 border-[#eac16f]/70 bg-[#1e2024]/30 py-2 rounded-r'
                          : 'w-full max-w-[700px] leading-relaxed'
                      }
                    >
                      <textarea
                        rows={Math.max(2, Math.ceil(para.length / 72))}
                        value={para}
                        onChange={(e) => updateActionParagraph(realIdx, e.target.value)}
                        className="w-full bg-transparent text-[#e2e2e8] leading-relaxed resize-y focus:outline-none"
                      />
                    </div>
                  );
                })}

                {/* Transition (Right Aligned Hollywood Convention) */}
                <div className="flex justify-end pt-4 pr-4">
                  <button
                    type="button"
                    onClick={cycleTransition}
                    className="font-bold tracking-widest text-[13px] text-[#9a8f7f] hover:text-[#eac16f] uppercase cursor-pointer"
                    title={t('Click to cycle transition', 'Bấm để đổi kiểu chuyển cảnh')}
                  >
                    {activeScene.transition || 'CUT TO:'}
                  </button>
                </div>

                {/* Next Scene Prompt Placeholder */}
                <div className="mt-6 pt-5 border-t border-dashed border-[#4e4638]/30 flex flex-wrap items-center justify-between gap-2 text-[#9a8f7f] font-sans text-[11.5px]">
                  <button
                    type="button"
                    onClick={onAddScene}
                    className="flex items-center gap-2 hover:text-[#eac16f] cursor-pointer text-left"
                  >
                    <span className="text-[#eac16f] font-bold">+</span>
                    <span className="text-[#d1c5b3]">
                      {t('Press ', 'Bấm ')}
                      <kbd className="bg-[#1e2024] px-1.5 py-0.5 rounded text-[#eac16f] font-mono">
                        Ctrl + Enter
                      </kbd>
                      {t(
                        ' or click here to create the next Scene',
                        ' để tạo Scene tiếp theo: EXT. BỜ SÔNG TIỀN - SÁNG SỚM'
                      )}
                    </span>
                  </button>
                  <span className="text-[11px] font-mono text-[#9a8f7f]">
                    {t('Standard 55 lines / page', 'Quy chuẩn 55 dòng / trang')}
                  </span>
                </div>
              </div>
            </div>

            {/* Script Page Footer */}
            <div className="mt-12 pt-4 border-t border-[#4e4638]/20 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-[#9a8f7f]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#eac16f]" />
                <span className="text-[#d1c5b3]">
                  {t('Auto-synced to local vault', 'Đồng bộ đám mây tự động')}
                </span>
              </div>
              <span>
                {t(
                  'Copyright © Author & NOETRIX Production',
                  'Bản quyền nội dung thuộc tác giả & NOETRIX Production'
                )}
              </span>
              <span>19.</span>
            </div>
          </article>

          {/* 4. Bottom Keyboard Hints Strip */}
          <div className="w-full max-w-[820px] mt-4 mb-6 py-2 px-4 rounded bg-[#1a1c20] text-[#9a8f7f] flex flex-wrap items-center justify-between gap-3 font-mono text-[10.5px] border border-[#4e4638]/20">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-[#d1c5b3]">
                <kbd className="bg-[#0c0e12] px-1.5 py-0.5 rounded text-[#eac16f] font-bold">
                  ^3 / ^5
                </kbd>
                <span>{t('Insert Character & Dialogue', 'Thêm nhanh Character ↔ Dialogue')}</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#d1c5b3]">
                <kbd className="bg-[#0c0e12] px-1.5 py-0.5 rounded text-[#e2c471] font-bold">
                  ^2
                </kbd>
                <span>{t('Add Action Paragraph', 'Thêm đoạn Action')}</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#d1c5b3]">
                <kbd className="bg-[#0c0e12] px-1.5 py-0.5 rounded text-[#9a8f7f]">⌘K</kbd>
                <span>{t('Omnisearch character lookup', 'Omnisearch tra cứu nhân vật')}</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#eac16f]">
              <span>✓</span>
              <span>{t('Hollywood Courier Layout Active', 'Kiểm tra chính tả: Tiếng Việt (Bật)')}</span>
            </div>
          </div>
        </div>

        {/* =================================================================
            RIGHT COLUMN: SCENE INSPECTOR DRAWER (Collapsible)
            ================================================================= */}
        {inspectorOpen && (
          <aside className="col-span-12 xl:col-span-4 bg-[#0c0e12] p-4 sm:p-5 flex flex-col gap-4 border-t xl:border-t-0 xl:border-l border-[#4e4638]/25 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#4e4638]/20">
              <div className="flex items-center gap-2">
                <span className="text-[#eac16f]">◨</span>
                <h3 className="text-[15px] font-semibold text-[#e2e2e8]">
                  Scene {activeScene.sceneNumber} Inspector
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectorOpen(false)}
                className="p-1 text-[#9a8f7f] hover:text-white cursor-pointer"
                title={t('Collapse Inspector', 'Thu gọn')}
              >
                ✕
              </button>
            </div>

            {/* Scene Quick Metadata Diagnostics */}
            <div className="p-3 rounded-lg bg-[#1a1c20] border border-[#4e4638]/20 flex flex-col gap-2.5">
              <div className="flex items-center justify-between font-mono text-[10.5px]">
                <span className="text-[#9a8f7f] uppercase tracking-wider">
                  {t('Scene Structure', 'Cấu trúc cảnh')}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#eac16f]/10 text-[#eac16f] font-semibold">
                  ACT II · BEAT 14
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                <div className="p-2 rounded bg-[#1e2024]">
                  <span className="text-[#9a8f7f] block text-[9.5px]">
                    {t('SETTING', 'THIẾT LẬP BỐI CẢNH')}
                  </span>
                  <span className="font-semibold text-[#e2e2e8] mt-0.5 block">
                    {activeScene.intExt === 'INT.' ? 'Nội' : 'Ngoại'} · {activeScene.timeOfDay} (
                    {activeScene.intExt.replace('.', '')})
                  </span>
                </div>
                <div className="p-2 rounded bg-[#1e2024]">
                  <span className="text-[#9a8f7f] block text-[9.5px]">
                    {t('SCRIPT LENGTH', 'ĐỘ DÀI KỊCH BẢN')}
                  </span>
                  <span className="font-semibold text-[#e2c471] mt-0.5 block">
                    3/8 {t('Pages (~3 Min)', 'Trang (~ 3 Phút)')}
                  </span>
                </div>
                <div className="p-2 rounded bg-[#1e2024]">
                  <span className="text-[#9a8f7f] block text-[9.5px]">
                    {t('PACING', 'NHỊP PHIM (PACING)')}
                  </span>
                  <span className="font-semibold text-[#eac16f] mt-0.5 block">
                    {t('Tense / Slow Burn', 'Căng thẳng / Slow Burn')}
                  </span>
                </div>
                <div className="p-2 rounded bg-[#1e2024]">
                  <span className="text-[#9a8f7f] block text-[9.5px]">
                    {t('CONFLICT LEVEL', 'MỨC ĐỘ XUNG ĐỘT')}
                  </span>
                  <span className="font-semibold text-[#ffb4ab] mt-0.5 block">
                    {t('Psychological Peak (8/10)', 'Cao trào tâm lý (8/10)')}
                  </span>
                </div>
              </div>

              {/* Emotional Tone Tagging */}
              <div className="pt-2 border-t border-[#4e4638]/20">
                <span className="font-mono text-[10px] text-[#9a8f7f] block mb-1.5">
                  {t('DOMINANT EMOTIONAL TONE', 'TÔNG MÀU CẢM XÚC CHÍNH')}
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10.5px]">
                  <span className="px-2 py-0.5 rounded bg-[#1e2024] text-[#e2c471] border border-[#e2c471]/30">
                    {t('Hidden Guilt', 'Mặc cảm tội lỗi')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#1e2024] text-[#ffb4ab] border border-[#ffb4ab]/30">
                    {t('Grim Confrontation', 'Đối đầu nghiệt ngã')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#1e2024] text-[#9a8f7f]">
                    {t('Family Secret', 'Bí mật gia đình')}
                  </span>
                </div>
              </div>
            </div>

            {/* Linked Characters in this Scene */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-[10.5px]">
                <span className="uppercase tracking-wider text-[#9a8f7f]">
                  {t(
                    `CHARACTERS IN SCENE (${sceneCharacters.length})`,
                    `NHÂN VẬT TRONG CẢNH (${sceneCharacters.length})`
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenCharacterDossier(sceneCharacters[0]?.id || '')}
                  className="text-[#eac16f] hover:underline cursor-pointer"
                >
                  {t('Cast Dossier ↗', '+ Hồ sơ nhân vật')}
                </button>
              </div>

              {sceneCharacters.map((ch, idx) => (
                <div
                  key={ch.id}
                  className="p-2.5 rounded bg-[#1a1c20] hover:bg-[#1e2024] transition-colors border border-[#4e4638]/20 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          idx === 0
                            ? 'bg-[#eac16f]/20 text-[#eac16f]'
                            : 'bg-[#e2c471]/20 text-[#e2c471]'
                        }`}
                      >
                        {ch.initials || ch.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-semibold text-[#e2e2e8]">
                          {ch.name} ({ch.age} {t('yrs', 'tuổi')})
                        </h4>
                        <span className="text-[11px] text-[#9a8f7f]">
                          {ch.occupation || ch.role}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenCharacterDossier(ch.id)}
                      className="text-[#eac16f] font-mono text-[10.5px] flex items-center hover:underline cursor-pointer"
                    >
                      <span>{t('Dossier', 'Hồ sơ')} ↗</span>
                    </button>
                  </div>
                  <div className="text-[11.5px] text-[#d1c5b3] bg-[#0c0e12] p-2 rounded leading-relaxed">
                    <span className="text-[#eac16f] font-semibold">
                      {t('Scene psychology:', 'Tâm lý cảnh này:')}{' '}
                    </span>
                    {ch.fear || ch.want}
                  </div>
                </div>
              ))}
            </div>

            {/* Linked Story Props & Verified Research */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#9a8f7f]">
                {t('PROPS & VERIFIED RESEARCH', 'ĐẠO CỤ & TƯ LIỆU NGHIÊN CỨU')}
              </span>

              <div className="p-2.5 rounded bg-[#1a1c20] flex items-start gap-2.5 border border-[#4e4638]/15">
                <span className="text-[#eac16f] text-[15px] mt-0.5">🎫</span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12.5px] font-semibold text-[#e2e2e8]">
                      Tấm vé phà cũ Rạch Miễu 2008
                    </span>
                    <span className="text-[9px] bg-[#eac16f]/20 text-[#eac16f] px-1.5 py-0.5 rounded uppercase font-mono font-semibold">
                      Key Prop
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#d1c5b3] mt-0.5 leading-relaxed">
                    {activeScene.clue ||
                      'Được cất dưới đáy hộp bánh quy bằng thiếc gỉ sét. Đóng dấu giờ khởi hành: 23:45 ngày xảy ra tai nạn.'}
                  </p>
                </div>
              </div>

              {project.research.slice(0, 1).map((res) => (
                <div
                  key={res.id}
                  className="p-2.5 rounded bg-[#1a1c20] flex items-start gap-2.5 border border-[#4e4638]/15"
                >
                  <span className="text-[#e2c471] text-[15px] mt-0.5">📖</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12.5px] font-semibold text-[#e2e2e8]">{res.title}</span>
                      <span className="text-[9px] bg-[#e2c471]/20 text-[#e2c471] px-1.5 py-0.5 rounded uppercase font-mono font-semibold">
                        Verified Fact
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#d1c5b3] mt-0.5 leading-relaxed">
                      {res.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scene Goal & Dramatic Beat Resolution */}
            <div className="p-3 rounded bg-[#282a2e] border-l-2 border-[#eac16f] flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-[10.5px]">
                <span className="text-[#eac16f] font-bold uppercase tracking-wider">
                  {t('DRAMATIC BEAT GOAL', 'MỤC TIÊU KỊCH TÍNH (BEAT GOAL)')}
                </span>
                <span className="text-[#eac16f]">⚑</span>
              </div>
              <textarea
                rows={3}
                value={activeScene.purposeNote}
                onChange={(e) =>
                  updateActiveScene((sc) => ({ ...sc, purposeNote: e.target.value }))
                }
                className="w-full bg-transparent text-[12.5px] text-[#e2e2e8] leading-snug resize-y focus:outline-none"
              />
            </div>

            {/* Director's Visual Tone & Sound Notes */}
            <div className="p-3 rounded bg-[#1a1c20] flex flex-col gap-2 border border-[#4e4638]/15">
              <span className="font-mono text-[10px] text-[#9a8f7f] uppercase tracking-wider">
                {t('DIRECTOR VISUAL & SOUND NOTES', 'CHỈ DẪN ÂM THANH & ÁNH SÁNG (DIRECTOR NOTE)')}
              </span>
              <div className="space-y-1.5 text-[11.5px] text-[#d1c5b3] leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <span className="text-[#e2c471]">☀</span>
                  <span>
                    {t(
                      'Lighting: Low-key pale blue neon, harsh contrast across Lành’s profile.',
                      'Ánh sáng: Low-key neon xanh nhợt, độ tương phản gắt trên nửa gương mặt Lành.'
                    )}
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-[#e2c471]">♪</span>
                  <span>
                    {t(
                      'Sound: No score; emphasize rhythmic water drips and distant night ferry horn.',
                      'Âm thanh: Không dùng nhạc nền; đặc tả tiếng nước nhỏ giọt đều đặn và tiếng còi phà đêm xa xa.'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
