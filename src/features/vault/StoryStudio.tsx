import React, { useEffect, useMemo, useState } from 'react';
import { createId } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { scheduleSourceCodeSave } from '../../lib/sourceStore';
import { Modal, useToast } from '../../components/ui/Primitives';
import {
  buildInitialScreenplayState,
  buildProjectChimera,
  NOTE_CATEGORY_META,
  type CharacterDynamic,
  type DialogueLine,
  type ScreenplayCharacter,
  type ScreenplayLocation,
  type ScreenplayModuleId,
  type ScreenplayProject,
  type ScreenplayResearchItem,
  type ScreenplayScene,
  type ScreenplayStudioState,
  type StoryNoteCategory,
  type StoryNoteItem,
  type TimelineEvent,
} from './screenplayStudioData';

const SP_STORAGE_KEY = 'noetrix_screenplay_studio_v1';

interface StudioModuleItem {
  id: ScreenplayModuleId;
  group: '2.1' | '2.2' | '2.3' | '2.4';
  label: string;
  tag: string;
}

const STUDIO_SIDEBAR_GROUPS: {
  code: string;
  title: string;
  modules: StudioModuleItem[];
}[] = [
  {
    code: '2.1',
    title: 'OVERVIEW',
    modules: [
      { id: 'overview', group: '2.1', label: 'Story Overview', tag: 'Logline' },
      { id: 'story_bible', group: '2.1', label: 'Story Structure', tag: '5-Act' },
    ],
  },
  {
    code: '2.2',
    title: 'STORY DEVELOPMENT',
    modules: [
      { id: 'characters', group: '2.2', label: 'Characters', tag: '12' },
      { id: 'locations', group: '2.2', label: 'Locations & Settings', tag: '8' },
      { id: 'timeline', group: '2.2', label: 'Timeline & Chronology', tag: 'Day 1-7' },
    ],
  },
  {
    code: '2.3',
    title: 'WRITING',
    modules: [
      { id: 'screenplay', group: '2.3', label: 'Screenplay Editor', tag: 'P.43' },
    ],
  },
  {
    code: '2.4',
    title: 'RESEARCH & RESOURCES',
    modules: [
      { id: 'research', group: '2.4', label: 'Research Library', tag: 'Cybernetics' },
      { id: 'notes', group: '2.4', label: 'Notes & Idea Sparks', tag: '4' },
    ],
  },
];

const ACTS: TimelineEvent['act'][] = [
  'Act I — Thiết lập',
  'Act II-A — Đối đầu',
  'Act II-B — Biến cố',
  'Act III — Cao trào',
];

function countSceneWords(sc: ScreenplayScene): number {
  const actionW = sc.actionDescription.trim() ? sc.actionDescription.trim().split(/\s+/).length : 0;
  const dlgW = sc.dialogues.reduce(
    (acc, d) => acc + (d.text.trim() ? d.text.trim().split(/\s+/).length : 0),
    0
  );
  return actionW + dlgW;
}

function loadScreenplayState(): ScreenplayStudioState {
  try {
    const raw = localStorage.getItem(SP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ScreenplayStudioState>;
      if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        // Ensure Project Chimera exists in the list for the user
        const hasChimera = parsed.projects.some((p) => p.id === 'proj_chimera');
        const chimera = buildProjectChimera(Date.now());
        const projects = hasChimera ? parsed.projects : [chimera, ...parsed.projects];

        return {
          activeProjectId: parsed.activeProjectId || 'proj_chimera',
          activeModule: parsed.activeModule || 'characters',
          projects,
        };
      }
    }
  } catch {
    // ignore
  }
  return buildInitialScreenplayState();
}

const ROLE_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Protagonist: { bg: 'rgba(185, 155, 121, 0.15)', text: '#B99B79', border: 'rgba(185, 155, 121, 0.35)' },
  Deuteragonist: { bg: 'rgba(167, 182, 210, 0.15)', text: '#A7B6D2', border: 'rgba(167, 182, 210, 0.35)' },
  Antagonist: { bg: 'rgba(194, 123, 118, 0.15)', text: '#C27B76', border: 'rgba(194, 123, 118, 0.35)' },
  Supporting: { bg: 'rgba(155, 170, 152, 0.15)', text: '#9BAA98', border: 'rgba(155, 170, 152, 0.35)' },
};

const FRICTION_TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'High Friction': { bg: 'rgba(217, 119, 6, 0.18)', text: '#f59e0b' },
  Hostile: { bg: 'rgba(239, 68, 68, 0.18)', text: '#ef4444' },
  Confidant: { bg: 'rgba(16, 185, 129, 0.18)', text: '#10b981' },
  Alliance: { bg: 'rgba(59, 130, 246, 0.18)', text: '#60a5fa' },
  Neutral: { bg: 'rgba(160, 160, 160, 0.15)', text: '#9ca3af' },
};

export function StoryStudio() {
  const { showToast } = useToast();
  const [state, setState] = useState<ScreenplayStudioState>(() => loadScreenplayState());

  const project =
    state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];

  // Sub-selections inside modules
  const [selectedCharId, setSelectedCharId] = useState<string>(
    () => project.characters[0]?.id || ''
  );
  const [selectedLocId, setSelectedLocId] = useState<string>(
    () => project.locations[0]?.id || ''
  );
  const [selectedEventId, setSelectedEventId] = useState<string>(
    () => project.timeline[0]?.id || ''
  );
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    () => project.lastOpenedSceneId || project.scenes[0]?.id || ''
  );

  // Character filtering & view toggles
  const [castSearch, setCastSearch] = useState('');
  const [castRoleFilter, setCastRoleFilter] = useState<'All' | 'Protagonist' | 'Antagonist' | 'Supporting' | 'Synthetic'>('All');
  const [castViewMode, setCastViewMode] = useState<'list' | 'matrix'>('list');
  const [editingCharacter, setEditingCharacter] = useState(false);

  // Global Quick Create modal
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<'scene' | 'character' | 'location' | 'note'>('character');

  // New item modal inputs
  const [qcName, setQcName] = useState('');
  const [qcExtra, setQcExtra] = useState('');

  // Universal Search & Command Palette in studio
  const [universalSearch, setUniversalSearch] = useState('');

  // Persist to localStorage & auto-save to source store
  useEffect(() => {
    try {
      localStorage.setItem(SP_STORAGE_KEY, JSON.stringify(state));
      scheduleSourceCodeSave();
    } catch {
      // ignore
    }
  }, [state]);

  const setModule = (mod: ScreenplayModuleId) => {
    triggerHaptic('selection');
    setState((prev) => ({ ...prev, activeModule: mod }));
  };

  const updateProject = (
    patch: Partial<ScreenplayProject> | ((curr: ScreenplayProject) => ScreenplayProject)
  ) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== project.id) return p;
        const next =
          typeof patch === 'function'
            ? patch(p)
            : { ...p, ...patch, updatedAt: Date.now() };
        return next;
      }),
    }));
  };

  const activeChar =
    project.characters.find((c) => c.id === selectedCharId) || project.characters[0] || null;
  const activeLoc =
    project.locations.find((l) => l.id === selectedLocId) || project.locations[0] || null;
  const activeEvent =
    project.timeline.find((e) => e.id === selectedEventId) || project.timeline[0] || null;
  const activeScene =
    project.scenes.find((s) => s.id === selectedSceneId) ||
    project.scenes.find((s) => s.id === project.lastOpenedSceneId) ||
    project.scenes[0] ||
    null;

  // Add Character
  const addCharacter = (name?: string, role?: ScreenplayCharacter['role']) => {
    triggerHaptic('light');
    const id = createId('char');
    const charName = name?.trim() || `Character #${project.characters.length + 1}`;
    const initials = charName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newChar: ScreenplayCharacter = {
      id,
      name: charName,
      initials,
      roleTag: role ? `${role.toUpperCase()} · SUPPORTING` : 'SUPPORTING · CAST',
      archetype: 'The Enigmatic Figure',
      age: '32',
      statusLabel: 'Active in Story',
      gender: 'Unspecified',
      occupation: 'Field Operative',
      role: role || 'Supporting',
      appearance: 'Distinct silhouette, purposeful movement.',
      personality: 'Guarded, observant.',
      speechStyle: 'Restrained, measured tone.',
      signatureProp: 'Silver lighter',
      debutScene: `Scene ${project.scenes[0]?.sceneNumber || '01'}`,
      backstory: 'Connected to the central incident through unverified telemetry.',
      want: 'Wants to discover the truth behind the primary anomaly;',
      need: 'Needs to confront the personal sacrifice required.',
      fatalFlaw: 'Over-reliance on rational deduction.',
      fear: 'Loss of autonomy.',
      motivation: 'Resolve the unsolved mystery.',
      secret: 'Witnessed the turning point event.',
      arc: 'From hesitant bystander to decisive participant.',
      relationships: [],
      keyDynamics: [],
      featuredSceneIds: [],
    };

    updateProject((curr) => ({
      ...curr,
      characters: [...curr.characters, newChar],
      updatedAt: Date.now(),
    }));
    setSelectedCharId(id);
    setModule('characters');
    showToast(`Đã thêm nhân vật: ${charName}`);
  };

  // Add Scene
  const addScene = (actName?: TimelineEvent['act']) => {
    triggerHaptic('light');
    const id = createId('sc');
    const num = String(project.scenes.length + 1).padStart(2, '0');
    const newSc: ScreenplayScene = {
      id,
      sceneNumber: num,
      title: `Phân đoạn ${num}`,
      act: actName || 'Act II-A — Đối đầu',
      status: 'Draft',
      intExt: 'INT.',
      locationId: project.locations[0]?.id || '',
      locationName: project.locations[0]?.name?.toUpperCase() || 'PHÒNG NGHIÊN CỨU',
      timeOfDay: 'ĐÊM',
      actionDescription: 'Không gian tĩnh lặng. Tiếng thiết bị rì rầm trong bóng tối.',
      dialogues: [],
      transition: 'CUT TO:',
      characterIds: activeChar ? [activeChar.id] : [],
      relatedEventIds: [],
      clue: 'Chưa xác định',
      purposeNote: 'Đẩy cao mâu thuẫn kịch tính.',
      updatedAt: Date.now(),
    };
    updateProject((curr) => ({
      ...curr,
      scenes: [...curr.scenes, newSc],
      lastOpenedSceneId: id,
      updatedAt: Date.now(),
    }));
    setSelectedSceneId(id);
    setModule('screenplay');
    showToast(`Đã tạo Scene ${num}`);
  };

  // Update Character
  const updateCharacter = (charId: string, patch: Partial<ScreenplayCharacter>) => {
    updateProject((curr) => {
      const oldChar = curr.characters.find((c) => c.id === charId);
      const oldName = oldChar?.name?.trim() || '';
      const newName = patch.name !== undefined ? patch.name.trim() : oldName;
      const nameChanged = Boolean(oldName && newName && oldName !== newName);

      const nextChars = curr.characters.map((c) =>
        c.id === charId ? { ...c, ...patch } : c
      );

      const nextScenes = nameChanged
        ? curr.scenes.map((sc) => {
            const updatedDialogues = sc.dialogues.map((d) =>
              d.characterId === charId
                ? { ...d, characterName: newName.toUpperCase() }
                : d
            );
            return { ...sc, dialogues: updatedDialogues };
          })
        : curr.scenes;

      return {
        ...curr,
        characters: nextChars,
        scenes: nextScenes,
        updatedAt: Date.now(),
      };
    });
  };

  // Filtered Characters List
  const filteredCharacters = useMemo(() => {
    const q = (castSearch || universalSearch).trim().toLowerCase();
    return project.characters.filter((c) => {
      if (castRoleFilter === 'Protagonist' && c.role !== 'Protagonist') return false;
      if (castRoleFilter === 'Antagonist' && c.role !== 'Antagonist') return false;
      if (castRoleFilter === 'Supporting' && c.role !== 'Supporting') return false;
      if (
        castRoleFilter === 'Synthetic' &&
        !c.roleTag?.toLowerCase().includes('synthetic') &&
        !c.gender.toLowerCase().includes('synthetic')
      ) {
        return false;
      }
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.roleTag && c.roleTag.toLowerCase().includes(q)) ||
        (c.archetype && c.archetype.toLowerCase().includes(q)) ||
        c.personality.toLowerCase().includes(q) ||
        c.want.toLowerCase().includes(q)
      );
    });
  }, [project.characters, castSearch, universalSearch, castRoleFilter]);

  // Export screenplay
  const handleExportScript = (format: 'pdf' | 'doc' | 'md') => {
    triggerHaptic('light');
    if (format === 'md') {
      const mdContent = `# ${project.title}\n\n**Thể loại:** ${project.genre} · ${project.format}\n\n**Logline:** ${project.bible.logline}\n\n---\n\n` +
        project.scenes
          .map(
            (sc) =>
              `### SCENE ${sc.sceneNumber} — ${sc.intExt} ${sc.locationName} - ${sc.timeOfDay}\n\n${sc.actionDescription}\n\n` +
              sc.dialogues
                .map((d) => `**${d.characterName}**${d.parenthetical ? ` *(${d.parenthetical})*` : ''}\n${d.text}`)
                .join('\n\n')
          )
          .join('\n\n---\n\n');

      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-screenplay.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã xuất kịch bản sang Markdown (.md)');
      return;
    }

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${project.title}</title>
<style>
body { font-family: "Courier Prime", Courier, monospace; font-size: 12pt; line-height: 1.4; padding: 40px; max-width: 780px; margin: 0 auto; color: #111; }
h1 { text-align: center; text-transform: uppercase; margin-bottom: 24px; font-size: 18pt; }
.meta { text-align: center; margin-bottom: 40px; font-size: 11pt; color: #444; }
.slugline { font-weight: bold; text-transform: uppercase; margin-top: 30px; margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
.action { margin-bottom: 16px; white-space: pre-wrap; }
.char { text-align: center; font-weight: bold; text-transform: uppercase; margin-top: 16px; margin-bottom: 2px; }
.paren { text-align: center; font-style: italic; margin-bottom: 2px; }
.dlg { max-width: 440px; margin: 0 auto 16px auto; }
</style></head><body>
<h1>${project.title}</h1><div class="meta">${project.genre} · ${project.format}<br/><br/>Logline: ${project.bible.logline}</div>
${project.scenes.map((sc) => `
<div class="scene">
  <div class="slugline">SCENE ${sc.sceneNumber} — ${sc.intExt} ${sc.locationName} - ${sc.timeOfDay}</div>
  <div class="action">${sc.actionDescription}</div>
  ${sc.dialogues.map((d) => `<div class="char">${d.characterName}</div>${d.parenthetical ? `<div class="paren">(${d.parenthetical})</div>` : ''}<div class="dlg">${d.text}</div>`).join('')}
</div>`).join('')}
</body></html>`;

    if (format === 'doc') {
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-screenplay.doc`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã xuất kịch bản sang Word (.doc)');
      return;
    }

    const printWin = window.open('', '_blank', 'width=840,height=900');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => printWin.print(), 300);
      showToast('Đã mở bản in kịch bản chuẩn Hollywood');
    }
  };

  return (
    <div
      className="rounded-[16px] overflow-hidden flex flex-col"
      style={{
        backgroundColor: '#101114',
        border: '1px solid rgba(217, 213, 203, 0.085)',
        minHeight: '840px',
      }}
    >
      {/* ================================================================
          TOP STUDIO HEADER BAR (Matches Screenshot Header exactly)
          [NOETRIX STUDIO] | Projects / Project Chimera (Draft 2) ▾ / Story Dev ...
          ================================================================ */}
      <header
        className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0"
        style={{
          backgroundColor: '#121418',
          borderBottom: '1px solid rgba(217, 213, 203, 0.08)',
        }}
      >
        {/* Left Branding & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="font-editorial text-[14.5px] font-semibold tracking-[-0.02em]"
              style={{ color: '#EDEAE2' }}
            >
              NOETRIX
            </span>
            <span
              className="text-[9.5px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-[4px]"
              style={{
                backgroundColor: '#B99B79',
                color: '#101114',
              }}
            >
              STUDIO
            </span>
          </div>

          <span className="text-[13px]" style={{ color: 'rgba(217, 213, 203, 0.25)' }}>
            /
          </span>

          {/* Project Switcher Dropdown */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="metadata text-[11px]" style={{ color: 'rgba(217, 213, 203, 0.45)' }}>
              Projects /
            </span>
            <select
              value={project.id}
              onChange={(e) => {
                const nextId = e.target.value;
                if (nextId === '__new__') {
                  const id = createId('proj');
                  const newProj: ScreenplayProject = {
                    id,
                    title: `Project #${state.projects.length + 1}`,
                    genre: 'Neo-Noir / Thriller',
                    format: 'Feature Film',
                    status: 'Development',
                    draftSubtitle: 'Draft 1 · Act I',
                    currentTasks: 'Set up world bible & primary cast.',
                    nextStep: 'Draft Scene 01.',
                    bible: {
                      logline: '',
                      synopsis: '',
                      themeAndMessage: '',
                      historicalSocialSetting: '',
                      worldRulesAndCoreTruths: '',
                      toneAndVisualStyle: '',
                    },
                    characters: [],
                    locations: [],
                    timeline: [],
                    scenes: [],
                    research: [],
                    notes: [],
                    versions: [],
                    lastOpenedSceneId: '',
                    updatedAt: Date.now(),
                  };
                  setState((prev) => ({
                    ...prev,
                    activeProjectId: id,
                    projects: [newProj, ...prev.projects],
                  }));
                  showToast('Đã khởi tạo dự án mới');
                  return;
                }
                setState((prev) => ({ ...prev, activeProjectId: nextId }));
              }}
              className="bg-transparent text-[13px] font-semibold cursor-pointer truncate max-w-[200px]"
              style={{ color: '#EDEAE2' }}
            >
              {state.projects.map((p) => (
                <option key={p.id} value={p.id} style={{ backgroundColor: '#1B1D22', color: '#EDEAE2' }}>
                  {p.title}
                </option>
              ))}
              <option value="__new__" style={{ backgroundColor: '#1B1D22', color: '#B99B79' }}>
                + New Project...
              </option>
            </select>
            <span className="metadata text-[11px]" style={{ color: 'rgba(217, 213, 203, 0.45)' }}>
              / {state.activeModule === 'characters' ? 'Story Development' : state.activeModule.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Center Universal Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block mx-4">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-[8px]"
            style={{
              backgroundColor: '#191B20',
              border: '1px solid rgba(217, 213, 203, 0.08)',
            }}
          >
            <span className="text-[12px]" style={{ color: 'rgba(217, 213, 203, 0.35)' }}>
              🔍
            </span>
            <input
              type="text"
              value={universalSearch}
              onChange={(e) => setUniversalSearch(e.target.value)}
              placeholder="Search screenplay, characters, locations, beat cards..."
              className="w-full bg-transparent text-[12.5px]"
              style={{ color: '#EDEAE2' }}
            />
            <span
              className="metadata text-[9.5px] px-1.5 py-0.5 rounded-[4px] shrink-0"
              style={{
                backgroundColor: 'rgba(217, 213, 203, 0.08)',
                color: 'rgba(217, 213, 203, 0.45)',
              }}
            >
              ⌘K
            </span>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setQuickCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{
              backgroundColor: '#B99B79',
              color: '#101114',
            }}
          >
            <span>+</span> Quick Create
          </button>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] metadata text-[10.5px]"
            style={{
              backgroundColor: '#191B20',
              color: 'rgba(217, 213, 203, 0.65)',
              border: '1px solid rgba(217, 213, 203, 0.06)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10b981' }} />
            Cloud Synced
          </div>

          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold"
            style={{
              backgroundColor: '#292A2D',
              color: '#B99B79',
              border: '1px solid rgba(185, 155, 121, 0.4)',
            }}
          >
            QL
          </div>
        </div>
      </header>

      {/* ================================================================
          MAIN WORKSPACE LAYOUT:
          - Left Sidebar (230px): 4 Grouped Sections (2.1..2.4)
          - Rest of Canvas: When in 'characters' -> Center List + Right Dossier
          ================================================================ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* ==============================================================
            LEFT STUDIO SIDEBAR (2.5 cols / ~230px): 4 Technical Groups
            ============================================================== */}
        <aside
          className="lg:col-span-2 p-4 space-y-6 flex flex-col justify-between"
          style={{
            backgroundColor: '#121418',
            borderRight: '1px solid rgba(217, 213, 203, 0.08)',
          }}
        >
          <div className="space-y-6">
            {/* Project Workspace Card */}
            <div
              className="p-3 rounded-[10px] space-y-1"
              style={{
                backgroundColor: '#181A20',
                border: '1px solid rgba(217, 213, 203, 0.08)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="metadata text-[9.5px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                  PROJECT WORKSPACE
                </span>
                <span
                  className="metadata text-[8.5px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-[4px]"
                  style={{
                    backgroundColor: 'rgba(185, 155, 121, 0.18)',
                    color: '#B99B79',
                  }}
                >
                  Beta Feature
                </span>
              </div>
              <p className="font-editorial text-[14px] font-semibold leading-tight truncate" style={{ color: '#EDEAE2' }}>
                {project.title}
              </p>
              <p className="metadata text-[10px]" style={{ color: 'rgba(217, 213, 203, 0.45)' }}>
                {project.draftSubtitle || 'Draft 2 · Act II Sequence 4'}
              </p>
            </div>

            {/* 4 Technical Groups (2.1 OVERVIEW, 2.2 STORY DEV, 2.3 WRITING, 2.4 RESEARCH) */}
            <nav className="space-y-5">
              {STUDIO_SIDEBAR_GROUPS.map((grp) => (
                <div key={grp.code} className="space-y-1.5">
                  <span
                    className="metadata text-[9.5px] uppercase tracking-[0.14em] block px-1"
                    style={{ color: 'rgba(217, 213, 203, 0.4)' }}
                  >
                    {grp.code} {grp.title}
                  </span>
                  <div className="space-y-0.5">
                    {grp.modules.map((mod) => {
                      const active = state.activeModule === mod.id;
                      let badgeVal = mod.tag;
                      if (mod.id === 'characters') badgeVal = String(project.characters.length);
                      if (mod.id === 'locations') badgeVal = String(project.locations.length);
                      if (mod.id === 'screenplay') badgeVal = `${project.scenes.length} Sc`;
                      if (mod.id === 'notes') badgeVal = String(project.notes.length);

                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => setModule(mod.id)}
                          className="w-full px-2.5 py-1.5 rounded-[7px] text-left flex items-center justify-between gap-2 transition-all cursor-pointer group"
                          style={{
                            backgroundColor: active ? '#1E2026' : 'transparent',
                            color: active ? '#EDEAE2' : 'rgba(217, 213, 203, 0.65)',
                            borderLeft: active ? '2px solid #B99B79' : '2px solid transparent',
                          }}
                        >
                          <span className="text-[12.5px] font-medium truncate">
                            {mod.label}
                          </span>
                          <span
                            className="metadata text-[9.5px] tabular-nums shrink-0 px-1.5 py-0.5 rounded-[4px]"
                            style={{
                              backgroundColor: active ? 'rgba(185, 155, 121, 0.2)' : 'rgba(217, 213, 203, 0.05)',
                              color: active ? '#B99B79' : 'rgba(217, 213, 203, 0.4)',
                            }}
                          >
                            {badgeVal}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Bottom Action: + Add Scene */}
          <div className="pt-4 border-t border-[rgba(217,213,203,0.08)]">
            <button
              type="button"
              onClick={() => addScene('Act II-B — Biến cố')}
              className="w-full py-2 px-3 rounded-[8px] text-[12px] font-medium transition-colors hover:bg-[rgba(185,155,121,0.12)] cursor-pointer text-left flex items-center justify-between"
              style={{
                backgroundColor: 'transparent',
                color: '#B99B79',
                border: '1px dashed rgba(185, 155, 121, 0.4)',
              }}
            >
              <span>+ Add Scene to Act II</span>
              <span className="metadata text-[10px]">↵</span>
            </button>
          </div>
        </aside>

        {/* ==============================================================
            MODULE 03: CHARACTERS (Matches the Single Column List + Dossier)
            ============================================================== */}
        {state.activeModule === 'characters' && (
          <div className="lg:col-span-10 grid grid-cols-1 lg:grid-cols-12 min-h-0">
            {/* ----------------------------------------------------------
                CENTER COLUMN (5 cols / ~44%): Characters & Cast List
                ---------------------------------------------------------- */}
            <section
              className="lg:col-span-5 p-5 sm:p-6 space-y-4 flex flex-col justify-between"
              style={{
                backgroundColor: '#14161B',
                borderRight: '1px solid rgba(217, 213, 203, 0.08)',
              }}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="font-editorial text-[20px] font-semibold" style={{ color: '#EDEAE2' }}>
                        Characters & Cast
                      </h2>
                      <span
                        className="metadata text-[10px] px-2 py-0.5 rounded-[5px]"
                        style={{
                          backgroundColor: '#1E2026',
                          color: '#B99B79',
                          border: '1px solid rgba(185, 155, 121, 0.25)',
                        }}
                      >
                        {project.characters.length} Total
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => addCharacter()}
                      className="px-2.5 py-1 rounded-[6px] text-[11.5px] font-semibold cursor-pointer"
                      style={{
                        backgroundColor: '#B99B79',
                        color: '#101114',
                      }}
                    >
                      + New Character
                    </button>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(217, 213, 203, 0.55)' }}>
                    Core psychological arcs, voice signatures, and cast dynamics
                  </p>
                </div>

                {/* Filter View Controls */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    {(['All Cast', 'Dossiers', 'Matrix'] as const).map((m, idx) => {
                      const active = (idx === 0 && castViewMode === 'list') || (idx === 2 && castViewMode === 'matrix');
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCastViewMode(idx === 2 ? 'matrix' : 'list')}
                          className="px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium transition-colors cursor-pointer"
                          style={{
                            backgroundColor: active ? '#23262D' : 'transparent',
                            color: active ? '#EDEAE2' : 'rgba(217, 213, 203, 0.5)',
                          }}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    value={castSearch}
                    onChange={(e) => setCastSearch(e.target.value)}
                    placeholder="Filter cast..."
                    className="w-32 px-2 py-1 rounded-[6px] text-[11.5px]"
                    style={{
                      backgroundColor: '#181A20',
                      border: '1px solid rgba(217, 213, 203, 0.08)',
                      color: '#EDEAE2',
                    }}
                  />
                </div>

                {/* Secondary Category Pills */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] metadata pb-1 border-b border-[rgba(217,213,203,0.06)]">
                  {(['All', 'Protagonist', 'Antagonist', 'Supporting', 'Synthetic'] as const).map((r) => {
                    const active = castRoleFilter === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setCastRoleFilter(r)}
                        className="px-2 py-0.5 rounded-[5px] transition-colors cursor-pointer"
                        style={{
                          backgroundColor: active ? '#2A2D35' : 'transparent',
                          color: active ? '#B99B79' : 'rgba(217, 213, 203, 0.45)',
                        }}
                      >
                        {r === 'All' ? `(${project.characters.length})` : r}
                      </button>
                    );
                  })}
                </div>

                {/* Character List Cards */}
                <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                  {filteredCharacters.map((char) => {
                    const isSelected = activeChar?.id === char.id;
                    const initials =
                      char.initials ||
                      char.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();
                    const badgeMeta = ROLE_BADGE_COLORS[char.role] || ROLE_BADGE_COLORS.Supporting;

                    return (
                      <div
                        key={char.id}
                        onClick={() => {
                          triggerHaptic('selection');
                          setSelectedCharId(char.id);
                        }}
                        className="p-3.5 rounded-[12px] flex items-start gap-3 transition-all cursor-pointer group"
                        style={{
                          backgroundColor: isSelected ? '#1E2027' : '#17191E',
                          border: isSelected
                            ? '1px solid rgba(185, 155, 121, 0.65)'
                            : '1px solid rgba(217, 213, 203, 0.08)',
                        }}
                      >
                        {/* Avatar Box with Initials */}
                        <div
                          className="w-10 h-10 rounded-[8px] flex items-center justify-center font-mono font-bold text-[13px] shrink-0"
                          style={{
                            backgroundColor: '#121418',
                            color: badgeMeta.text,
                            border: `1px solid ${badgeMeta.border}`,
                          }}
                        >
                          {initials}
                        </div>

                        {/* Character Details */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className="font-editorial text-[14.5px] font-semibold leading-tight truncate"
                              style={{ color: isSelected ? '#EDEAE2' : 'rgba(237, 234, 226, 0.9)' }}
                            >
                              {char.name}
                            </p>
                            <span
                              className="metadata text-[9.5px] shrink-0"
                              style={{ color: isSelected ? '#B99B79' : 'rgba(217, 213, 203, 0.35)' }}
                            >
                              {isSelected ? '# Active Dossier →' : 'Inspect →'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="metadata text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-[3px]"
                              style={{
                                backgroundColor: badgeMeta.bg,
                                color: badgeMeta.text,
                              }}
                            >
                              {char.roleTag || `${char.role.toUpperCase()} · CAST`}
                            </span>
                            <span className="metadata text-[9.5px]" style={{ color: 'rgba(217, 213, 203, 0.4)' }}>
                              · {char.featuredSceneIds?.length || 1} Scenes
                            </span>
                          </div>

                          <p
                            className="text-[11.5px] leading-relaxed line-clamp-1"
                            style={{ color: 'rgba(217, 213, 203, 0.55)' }}
                          >
                            {char.want || char.backstory || 'Key character profile.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Card: Add Supporting Cast */}
              <button
                type="button"
                onClick={() => addCharacter('Supporting Witness', 'Supporting')}
                className="w-full py-2.5 px-3 rounded-[9px] text-[12px] font-medium text-left flex items-center justify-center gap-2 transition-colors hover:bg-[rgba(217,213,203,0.06)] cursor-pointer mt-3"
                style={{
                  backgroundColor: '#17191E',
                  color: 'rgba(217, 213, 203, 0.65)',
                  border: '1px dashed rgba(217, 213, 203, 0.15)',
                }}
              >
                <span>+</span> Add Supporting Cast — Ensemble, witnesses, antagonists
              </button>
            </section>

            {/* ----------------------------------------------------------
                RIGHT COLUMN (7 cols / ~56%): Character Dossier Inspector
                ---------------------------------------------------------- */}
            <main className="lg:col-span-7 p-6 sm:p-8 space-y-6 overflow-y-auto">
              {activeChar ? (
                <div className="space-y-6">
                  {/* Top Dossier Header */}
                  <div className="space-y-2 pb-4 border-b border-[rgba(217,213,203,0.08)]">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="metadata text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-[4px]"
                        style={{
                          backgroundColor: 'rgba(185, 155, 121, 0.18)',
                          color: '#B99B79',
                          border: '1px solid rgba(185, 155, 121, 0.35)',
                        }}
                      >
                        {activeChar.roleTag || `${activeChar.role.toUpperCase()} · LEAD`}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCharacter((v) => !v)}
                          className="metadata text-[10.5px] px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer"
                          style={{
                            backgroundColor: editingCharacter ? '#B99B79' : '#1E2026',
                            color: editingCharacter ? '#101114' : '#EDEAE2',
                            border: '1px solid rgba(217, 213, 203, 0.1)',
                          }}
                        >
                          {editingCharacter ? 'Done Editing' : 'Edit Dossier ✏'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Xóa nhân vật ${activeChar.name}?`)) {
                              updateProject((curr) => ({
                                ...curr,
                                characters: curr.characters.filter((c) => c.id !== activeChar.id),
                              }));
                              showToast('Đã xóa nhân vật');
                            }
                          }}
                          className="metadata text-[10.5px] px-2 py-1 rounded-[6px] transition-colors hover:text-red-400 cursor-pointer"
                          style={{
                            backgroundColor: '#1E2026',
                            color: 'rgba(217, 213, 203, 0.45)',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {editingCharacter ? (
                      <div className="space-y-2 pt-2">
                        <input
                          type="text"
                          value={activeChar.name}
                          onChange={(e) => updateCharacter(activeChar.id, { name: e.target.value })}
                          className="font-editorial text-[26px] font-bold w-full bg-transparent border-b border-[#B99B79]"
                          style={{ color: '#EDEAE2' }}
                        />
                        <input
                          type="text"
                          value={activeChar.archetype || ''}
                          onChange={(e) => updateCharacter(activeChar.id, { archetype: e.target.value })}
                          placeholder="Archetype (e.g., The Damaged Truth-seeker)"
                          className="text-[13px] w-full bg-transparent border-b border-[rgba(217,213,203,0.1)]"
                          style={{ color: 'rgba(217, 213, 203, 0.65)' }}
                        />
                      </div>
                    ) : (
                      <div>
                        <h1 className="font-editorial text-[30px] sm:text-[34px] font-semibold leading-tight" style={{ color: '#EDEAE2' }}>
                          {activeChar.name}
                        </h1>
                        <p className="text-[13px] mt-0.5" style={{ color: 'rgba(217, 213, 203, 0.55)' }}>
                          Archetype: {activeChar.archetype || 'The Damaged Truth-seeker'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Section: PSYCHOLOGICAL DRIVE (Want vs. Need) */}
                  <div className="space-y-3">
                    <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                      PSYCHOLOGICAL DRIVE & INNER DEMONS
                    </span>

                    {editingCharacter ? (
                      <div className="space-y-3">
                        <div>
                          <label className="metadata text-[9.5px] uppercase">Want vs. Need</label>
                          <textarea
                            rows={3}
                            value={activeChar.want}
                            onChange={(e) => updateCharacter(activeChar.id, { want: e.target.value })}
                            className="w-full mt-1 p-2 rounded-[8px] text-[13px] bg-[#181A20] border border-[rgba(217,213,203,0.1)] text-[#EDEAE2]"
                          />
                        </div>
                        <div>
                          <label className="metadata text-[9.5px] uppercase">Fatal Flaw / Inner Demon</label>
                          <textarea
                            rows={2}
                            value={activeChar.fatalFlaw || activeChar.fear || ''}
                            onChange={(e) => updateCharacter(activeChar.id, { fatalFlaw: e.target.value })}
                            className="w-full mt-1 p-2 rounded-[8px] text-[13px] bg-[#181A20] border border-[rgba(217,213,203,0.1)] text-[#EDEAE2]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-[14px] leading-relaxed font-medium" style={{ color: '#EDEAE2' }}>
                          {activeChar.want || 'Wants to uncover the suppressed truth; Needs to face personal accountability.'}
                        </p>

                        <div
                          className="p-3.5 rounded-[10px] flex items-start gap-2.5"
                          style={{
                            backgroundColor: '#181A20',
                            border: '1px solid rgba(217, 213, 203, 0.08)',
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#B99B79' }} />
                          <p className="text-[12.5px] leading-relaxed italic" style={{ color: 'rgba(217, 213, 203, 0.75)' }}>
                            {activeChar.fatalFlaw || activeChar.fear || 'Crippling paranoia of his own perception; Terror of discovering his emotional anchor is an algorithm.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section: SPECIFICATIONS / VITALS (2x2 Grid) */}
                  <div className="space-y-3">
                    <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#A7B6D2' }}>
                      SPECIFICATIONS & CHARACTER TRAITS
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className="p-3 rounded-[9px] space-y-1"
                        style={{
                          backgroundColor: '#16181D',
                          border: '1px solid rgba(217, 213, 203, 0.06)',
                        }}
                      >
                        <span className="metadata text-[9px] uppercase block" style={{ color: 'rgba(217, 213, 203, 0.4)' }}>
                          AGE / STATUS
                        </span>
                        <p className="text-[12.5px] font-medium" style={{ color: '#EDEAE2' }}>
                          {activeChar.age} · {activeChar.statusLabel || activeChar.occupation || 'Active'}
                        </p>
                      </div>

                      <div
                        className="p-3 rounded-[9px] space-y-1"
                        style={{
                          backgroundColor: '#16181D',
                          border: '1px solid rgba(217, 213, 203, 0.06)',
                        }}
                      >
                        <span className="metadata text-[9px] uppercase block" style={{ color: 'rgba(217, 213, 203, 0.4)' }}>
                          VOICE CADENCE
                        </span>
                        <p className="text-[12.5px] font-medium" style={{ color: '#EDEAE2' }}>
                          {activeChar.speechStyle || 'Low, clipped noir cadence'}
                        </p>
                      </div>

                      <div
                        className="p-3 rounded-[9px] space-y-1"
                        style={{
                          backgroundColor: '#16181D',
                          border: '1px solid rgba(217, 213, 203, 0.06)',
                        }}
                      >
                        <span className="metadata text-[9px] uppercase block" style={{ color: 'rgba(217, 213, 203, 0.4)' }}>
                          SIGNATURE PROP
                        </span>
                        <p className="text-[12.5px] font-medium" style={{ color: '#EDEAE2' }}>
                          {activeChar.signatureProp || 'Brass ticking pocket watch'}
                        </p>
                      </div>

                      <div
                        className="p-3 rounded-[9px] space-y-1"
                        style={{
                          backgroundColor: '#16181D',
                          border: '1px solid rgba(217, 213, 203, 0.06)',
                        }}
                      >
                        <span className="metadata text-[9px] uppercase block" style={{ color: 'rgba(217, 213, 203, 0.4)' }}>
                          DEBUT SCENE
                        </span>
                        <p className="text-[12.5px] font-medium" style={{ color: '#EDEAE2' }}>
                          {activeChar.debutScene || 'Scene 1 (Page 1)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section: KEY DYNAMICS (Matches Key Dynamics from Screenshot) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#9BAA98' }}>
                        KEY DYNAMICS & FRICTION
                      </span>
                      <button
                        type="button"
                        onClick={() => setModule('locations')}
                        className="metadata text-[9.5px] uppercase tracking-[0.08em] hover:underline cursor-pointer"
                        style={{ color: '#B99B79' }}
                      >
                        View Graph ↗
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activeChar.keyDynamics && activeChar.keyDynamics.length > 0 ? (
                        activeChar.keyDynamics.map((dyn, idx) => {
                          const frictionMeta = FRICTION_TAG_COLORS[dyn.frictionTag] || FRICTION_TAG_COLORS.Neutral;
                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-[9px] flex items-center justify-between gap-3"
                              style={{
                                backgroundColor: '#17191E',
                                border: '1px solid rgba(217, 213, 203, 0.06)',
                              }}
                            >
                              <div className="min-w-0 space-y-0.5">
                                <p className="text-[13px] font-semibold" style={{ color: '#EDEAE2' }}>
                                  {dyn.targetName}
                                </p>
                                <p className="text-[11.5px] truncate max-w-md" style={{ color: 'rgba(217, 213, 203, 0.55)' }}>
                                  {dyn.note}
                                </p>
                              </div>
                              <span
                                className="metadata text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px] shrink-0"
                                style={{
                                  backgroundColor: frictionMeta.bg,
                                  color: frictionMeta.text,
                                }}
                              >
                                {dyn.frictionTag}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[12px] italic py-1" style={{ color: 'rgba(217, 213, 203, 0.45)' }}>
                          Chưa cấu hình liên kết xung đột cho nhân vật này.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Section: SCREENPLAY SCENES (Matches Screenplay Scenes from Screenshot) */}
                  <div className="space-y-3 pt-2">
                    <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#C27B76' }}>
                      SCREENPLAY SCENES ({project.scenes.filter((sc) => sc.characterIds.includes(activeChar.id)).length} TOTAL)
                    </span>

                    <div className="space-y-2">
                      {project.scenes
                        .filter((sc) => sc.characterIds.includes(activeChar.id) || sc.actionDescription.includes(activeChar.name))
                        .map((sc) => (
                          <button
                            key={sc.id}
                            type="button"
                            onClick={() => {
                              setSelectedSceneId(sc.id);
                              setModule('screenplay');
                            }}
                            className="w-full p-3 rounded-[9px] flex items-center justify-between text-left transition-colors hover:bg-[#1E2026] cursor-pointer"
                            style={{
                              backgroundColor: '#16181D',
                              border: '1px solid rgba(217, 213, 203, 0.08)',
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="metadata text-[11px] font-bold" style={{ color: '#B99B79' }}>
                                Sc. {sc.sceneNumber}
                              </span>
                              <span className="text-[12.5px] font-medium" style={{ color: '#EDEAE2' }}>
                                {sc.intExt} {sc.locationName}
                              </span>
                              {sc.status === 'Draft' && (
                                <span
                                  className="metadata text-[8.5px] uppercase px-1.5 py-0.5 rounded-[3px]"
                                  style={{ backgroundColor: 'rgba(185, 155, 121, 0.2)', color: '#B99B79' }}
                                >
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[13px]" style={{ color: 'rgba(217, 213, 203, 0.35)' }}>
                              &gt;
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-2">
                  <p className="text-[15px] font-medium" style={{ color: '#EDEAE2' }}>
                    Chưa chọn nhân vật nào
                  </p>
                  <p className="text-[13px]" style={{ color: 'rgba(217, 213, 203, 0.45)' }}>
                    Chọn một nhân vật bên danh sách để xem toàn bộ hồ sơ tâm lý và cảnh quay.
                  </p>
                </div>
              )}
            </main>
          </div>
        )}

        {/* ==============================================================
            MODULE 01: STORY OVERVIEW & BIBLE
            ============================================================== */}
        {state.activeModule === 'overview' && (
          <div className="lg:col-span-10 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[rgba(217,213,203,0.08)] pb-4">
              <div>
                <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                  2.1 OVERVIEW · DỰ ÁN KỊCH BẢN
                </span>
                <h2 className="font-editorial text-[26px] font-semibold mt-1" style={{ color: '#EDEAE2' }}>
                  {project.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportScript('pdf')}
                  className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
                  style={{ backgroundColor: '#1E2026', color: '#EDEAE2', border: '1px solid rgba(217,213,203,0.1)' }}
                >
                  Print PDF ↗
                </button>
                <button
                  type="button"
                  onClick={() => handleExportScript('doc')}
                  className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
                  style={{ backgroundColor: '#B99B79', color: '#101114' }}
                >
                  Export Word (.doc)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="metadata text-[10px] uppercase tracking-[0.1em]" style={{ color: '#B99B79' }}>
                    Logline (Cốt truyện trong 1-2 câu)
                  </label>
                  <textarea
                    rows={4}
                    value={project.bible.logline}
                    onChange={(e) =>
                      updateProject((curr) => ({
                        ...curr,
                        bible: { ...curr.bible, logline: e.target.value },
                      }))
                    }
                    className="w-full p-3 rounded-[9px] text-[13.5px] leading-relaxed bg-[#16181D] border border-[rgba(217,213,203,0.1)] text-[#EDEAE2]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="metadata text-[10px] uppercase tracking-[0.1em]" style={{ color: '#A7B6D2' }}>
                    Synopsis (Tóm tắt cốt truyện hoàn chỉnh)
                  </label>
                  <textarea
                    rows={8}
                    value={project.bible.synopsis}
                    onChange={(e) =>
                      updateProject((curr) => ({
                        ...curr,
                        bible: { ...curr.bible, synopsis: e.target.value },
                      }))
                    }
                    className="w-full p-3 rounded-[9px] text-[13.5px] leading-relaxed bg-[#16181D] border border-[rgba(217,213,203,0.1)] text-[#EDEAE2]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="metadata text-[10px] uppercase tracking-[0.1em]" style={{ color: '#9BAA98' }}>
                    Chủ đề & Thông điệp (Theme & Message)
                  </label>
                  <textarea
                    rows={3}
                    value={project.bible.themeAndMessage}
                    onChange={(e) =>
                      updateProject((curr) => ({
                        ...curr,
                        bible: { ...curr.bible, themeAndMessage: e.target.value },
                      }))
                    }
                    className="w-full p-3 rounded-[9px] text-[13px] bg-[#16181D] border border-[rgba(217,213,203,0.1)] text-[#EDEAE2]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="metadata text-[10px] uppercase tracking-[0.1em]" style={{ color: '#C27B76' }}>
                    Quy tắc thế giới & Sự thật cốt lõi
                  </label>
                  <textarea
                    rows={4}
                    value={project.bible.worldRulesAndCoreTruths}
                    onChange={(e) =>
                      updateProject((curr) => ({
                        ...curr,
                        bible: { ...curr.bible, worldRulesAndCoreTruths: e.target.value },
                      }))
                    }
                    className="w-full p-3 rounded-[9px] text-[13px] bg-[#16181D] border border-[rgba(217,213,203,0.1)] text-[#EDEAE2]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="metadata text-[10px] uppercase tracking-[0.1em]" style={{ color: '#B99B79' }}>
                    Tông màu & Phong cách kể chuyện (Tone & Visual Style)
                  </label>
                  <textarea
                    rows={3}
                    value={project.bible.toneAndVisualStyle}
                    onChange={(e) =>
                      updateProject((curr) => ({
                        ...curr,
                        bible: { ...curr.bible, toneAndVisualStyle: e.target.value },
                      }))
                    }
                    className="w-full p-3 rounded-[9px] text-[13px] bg-[#16181D] border border-[rgba(217,213,203,0.1)] text-[#EDEAE2]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            MODULE 02: LOCATIONS & SETTINGS
            ============================================================== */}
        {state.activeModule === 'locations' && (
          <div className="lg:col-span-10 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[rgba(217,213,203,0.08)] pb-4">
              <div>
                <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#A7B6D2' }}>
                  2.2 STORY DEVELOPMENT · BỐI CẢNH & ĐỊA ĐIỂM ({project.locations.length})
                </span>
                <h2 className="font-editorial text-[24px] font-semibold mt-1" style={{ color: '#EDEAE2' }}>
                  Locations & Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  const id = createId('loc');
                  const loc: ScreenplayLocation = {
                    id,
                    name: 'Địa điểm mới',
                    intExt: 'INT.',
                    defaultTime: 'NIGHT',
                    spatialContext: 'Không gian kiến trúc',
                    architecture: '',
                    lighting: '',
                    soundscape: '',
                    regularCharacterIds: [],
                    referenceImageUrl: '',
                  };
                  updateProject((curr) => ({ ...curr, locations: [...curr.locations, loc] }));
                  setSelectedLocId(id);
                }}
                className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold cursor-pointer"
                style={{ backgroundColor: '#B99B79', color: '#101114' }}
              >
                + New Location
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.locations.map((loc) => {
                const isSelected = activeLoc?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocId(loc.id)}
                    className="p-4 rounded-[12px] space-y-3 cursor-pointer transition-all"
                    style={{
                      backgroundColor: isSelected ? '#1E2026' : '#15171C',
                      border: isSelected ? '1px solid #B99B79' : '1px solid rgba(217,213,203,0.08)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="metadata text-[10px] font-bold px-2 py-0.5 rounded-[4px] bg-[#101114] text-[#B99B79]">
                        {loc.intExt}
                      </span>
                      <span className="metadata text-[10px]" style={{ color: 'rgba(217,213,203,0.45)' }}>
                        {loc.defaultTime}
                      </span>
                    </div>

                    <h3 className="font-editorial text-[18px] font-semibold" style={{ color: '#EDEAE2' }}>
                      {loc.name}
                    </h3>
                    <p className="text-[12.5px] leading-relaxed line-clamp-2" style={{ color: 'rgba(217,213,203,0.6)' }}>
                      {loc.spatialContext || 'Chưa có mô tả bối cảnh'}
                    </p>

                    <div className="text-[11px] space-y-1 pt-2 border-t border-[rgba(217,213,203,0.06)] metadata" style={{ color: 'rgba(217,213,203,0.45)' }}>
                      <p>💡 {loc.lighting || 'Chưa thiết lập ánh sáng'}</p>
                      <p>🔊 {loc.soundscape || 'Chưa thiết lập âm thanh'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==============================================================
            MODULE 04: SCREENPLAY EDITOR (Hollywood Scriptwriter)
            ============================================================== */}
        {state.activeModule === 'screenplay' && activeScene && (
          <div className="lg:col-span-10 grid grid-cols-1 lg:grid-cols-12 min-h-0">
            {/* Left Scenes Outline (4 cols) */}
            <div
              className="lg:col-span-4 p-5 space-y-4 border-r border-[rgba(217,213,203,0.08)] overflow-y-auto"
              style={{ backgroundColor: '#13151A' }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(217,213,203,0.06)]">
                <div>
                  <span className="metadata text-[9.5px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                    SCENES ({project.scenes.length})
                  </span>
                  <p className="text-[12px]" style={{ color: 'rgba(217,213,203,0.45)' }}>
                    Tổng: {project.scenes.reduce((sum, sc) => sum + countSceneWords(sc), 0)} từ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addScene()}
                  className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold cursor-pointer"
                  style={{ backgroundColor: '#B99B79', color: '#101114' }}
                >
                  + Add Scene
                </button>
              </div>

              <div className="space-y-2">
                {project.scenes.map((sc) => {
                  const isCur = activeScene.id === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => {
                        setSelectedSceneId(sc.id);
                        updateProject({ lastOpenedSceneId: sc.id });
                      }}
                      className="p-3 rounded-[9px] cursor-pointer transition-colors space-y-1"
                      style={{
                        backgroundColor: isCur ? '#1F2229' : '#17191E',
                        border: isCur ? '1px solid #B99B79' : '1px solid rgba(217,213,203,0.06)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="metadata text-[10.5px] font-bold" style={{ color: '#B99B79' }}>
                          Scene {sc.sceneNumber}
                        </span>
                        <span className="metadata text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[#101114] text-[rgba(217,213,203,0.6)]">
                          {sc.status}
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#EDEAE2' }}>
                        {sc.intExt} {sc.locationName}
                      </p>
                      <p className="text-[11.5px] truncate" style={{ color: 'rgba(217,213,203,0.45)' }}>
                        {sc.actionDescription || 'Chưa có mô tả hành động...'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center Script Canvas (8 cols) */}
            <div className="lg:col-span-8 p-6 sm:p-8 space-y-6 overflow-y-auto" style={{ backgroundColor: '#101114' }}>
              {/* Scene Slugline Bar */}
              <div
                className="p-4 rounded-[10px] space-y-3"
                style={{
                  backgroundColor: '#16181D',
                  border: '1px solid rgba(217, 213, 203, 0.08)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="metadata text-[11px] font-bold" style={{ color: '#B99B79' }}>
                    SLUGLINE · SCENE {activeScene.sceneNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportScript('pdf')}
                      className="metadata text-[10.5px] px-2 py-1 rounded-[5px] bg-[#101114] hover:text-[#B99B79] cursor-pointer"
                    >
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportScript('md')}
                      className="metadata text-[10.5px] px-2 py-1 rounded-[5px] bg-[#101114] hover:text-[#B99B79] cursor-pointer"
                    >
                      .MD
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={activeScene.intExt}
                    onChange={(e) => {
                      const val = e.target.value as ScreenplayScene['intExt'];
                      updateProject((curr) => ({
                        ...curr,
                        scenes: curr.scenes.map((s) => (s.id === activeScene.id ? { ...s, intExt: val } : s)),
                      }));
                    }}
                    className="p-2 rounded-[6px] bg-[#101114] text-[12px] font-mono font-bold text-[#EDEAE2]"
                  >
                    <option value="INT.">INT.</option>
                    <option value="EXT.">EXT.</option>
                    <option value="INT./EXT.">INT./EXT.</option>
                  </select>

                  <input
                    type="text"
                    value={activeScene.locationName}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      updateProject((curr) => ({
                        ...curr,
                        scenes: curr.scenes.map((s) => (s.id === activeScene.id ? { ...s, locationName: val } : s)),
                      }));
                    }}
                    placeholder="LOCATION"
                    className="p-2 rounded-[6px] bg-[#101114] text-[12px] font-mono font-bold uppercase text-[#EDEAE2]"
                  />

                  <input
                    type="text"
                    value={activeScene.timeOfDay}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      updateProject((curr) => ({
                        ...curr,
                        scenes: curr.scenes.map((s) => (s.id === activeScene.id ? { ...s, timeOfDay: val } : s)),
                      }));
                    }}
                    placeholder="TIME (NIGHT/DAY)"
                    className="p-2 rounded-[6px] bg-[#101114] text-[12px] font-mono font-bold uppercase text-[#EDEAE2]"
                  />
                </div>
              </div>

              {/* Action Description */}
              <div className="space-y-1.5">
                <label className="metadata text-[10px] uppercase tracking-[0.1em]" style={{ color: 'rgba(217,213,203,0.45)' }}>
                  Action Description (Hành động & Bối cảnh trực quan)
                </label>
                <textarea
                  rows={5}
                  value={activeScene.actionDescription}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateProject((curr) => ({
                      ...curr,
                      scenes: curr.scenes.map((s) => (s.id === activeScene.id ? { ...s, actionDescription: val } : s)),
                    }));
                  }}
                  className="w-full p-4 rounded-[10px] text-[13.5px] font-mono leading-relaxed bg-[#16181D] border border-[rgba(217,213,203,0.08)] text-[#EDEAE2]"
                />
              </div>

              {/* Dialogues */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[rgba(217,213,203,0.06)] pb-2">
                  <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                    DIALOGUE SEQUENCES ({activeScene.dialogues.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const id = createId('dlg');
                      const firstChar = project.characters[0];
                      const newDlg: DialogueLine = {
                        id,
                        characterId: firstChar?.id || '',
                        characterName: firstChar?.name?.toUpperCase() || 'NHÂN VẬT',
                        parenthetical: '',
                        text: 'Lời thoại mới...',
                      };
                      updateProject((curr) => ({
                        ...curr,
                        scenes: curr.scenes.map((s) =>
                          s.id === activeScene.id ? { ...s, dialogues: [...s.dialogues, newDlg] } : s
                        ),
                      }));
                    }}
                    className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold cursor-pointer"
                    style={{ backgroundColor: '#1E2026', color: '#B99B79', border: '1px solid rgba(185,155,121,0.3)' }}
                  >
                    + Add Dialogue
                  </button>
                </div>

                <div className="space-y-4 max-w-xl mx-auto">
                  {activeScene.dialogues.map((dlg, idx) => (
                    <div
                      key={dlg.id}
                      className="p-4 rounded-[10px] space-y-2 bg-[#14161B] border border-[rgba(217,213,203,0.08)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={dlg.characterId}
                          onChange={(e) => {
                            const cId = e.target.value;
                            const ch = project.characters.find((c) => c.id === cId);
                            updateProject((curr) => ({
                              ...curr,
                              scenes: curr.scenes.map((s) =>
                                s.id === activeScene.id
                                  ? {
                                      ...s,
                                      dialogues: s.dialogues.map((d) =>
                                        d.id === dlg.id
                                          ? { ...d, characterId: cId, characterName: ch?.name?.toUpperCase() || d.characterName }
                                          : d
                                      ),
                                    }
                                  : s
                              ),
                            }));
                          }}
                          className="font-mono text-[13px] font-bold uppercase bg-transparent text-[#B99B79] cursor-pointer"
                        >
                          {project.characters.map((c) => (
                            <option key={c.id} value={c.id} style={{ backgroundColor: '#1B1D22', color: '#EDEAE2' }}>
                              {c.name.toUpperCase()}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            updateProject((curr) => ({
                              ...curr,
                              scenes: curr.scenes.map((s) =>
                                s.id === activeScene.id
                                  ? { ...s, dialogues: s.dialogues.filter((d) => d.id !== dlg.id) }
                                  : s
                              ),
                            }));
                          }}
                          className="metadata text-[10px] text-[rgba(217,213,203,0.35)] hover:text-red-400 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <input
                        type="text"
                        value={dlg.parenthetical}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateProject((curr) => ({
                            ...curr,
                            scenes: curr.scenes.map((s) =>
                              s.id === activeScene.id
                                ? {
                                    ...s,
                                    dialogues: s.dialogues.map((d) =>
                                      d.id === dlg.id ? { ...d, parenthetical: val } : d
                                    ),
                                  }
                                : s
                            ),
                          }));
                        }}
                        placeholder="(parenthetical action or voice tone)"
                        className="w-full text-[12px] italic font-mono bg-transparent text-[rgba(217,213,203,0.6)] border-b border-[rgba(217,213,203,0.06)]"
                      />

                      <textarea
                        rows={3}
                        value={dlg.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateProject((curr) => ({
                            ...curr,
                            scenes: curr.scenes.map((s) =>
                              s.id === activeScene.id
                                ? {
                                    ...s,
                                    dialogues: s.dialogues.map((d) =>
                                      d.id === dlg.id ? { ...d, text: val } : d
                                    ),
                                  }
                                : s
                            ),
                          }));
                        }}
                        className="w-full text-[13.5px] font-mono leading-relaxed bg-transparent text-[#EDEAE2]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            MODULE 05: TIMELINE, RESEARCH, NOTES
            ============================================================== */}
        {(state.activeModule === 'timeline' || state.activeModule === 'research' || state.activeModule === 'notes') && (
          <div className="lg:col-span-10 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[rgba(217,213,203,0.08)] pb-4">
              <div>
                <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                  {state.activeModule.toUpperCase()} DOSSIER
                </span>
                <h2 className="font-editorial text-[24px] font-semibold mt-1" style={{ color: '#EDEAE2' }}>
                  {state.activeModule === 'timeline'
                    ? 'Timeline & Chronology'
                    : state.activeModule === 'research'
                    ? 'Research Library'
                    : 'Notes & Idea Sparks'}
                </h2>
              </div>
            </div>

            {state.activeModule === 'timeline' && (
              <div className="space-y-4">
                {project.timeline.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-[12px] space-y-2 bg-[#16181D] border border-[rgba(217,213,203,0.08)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="metadata text-[10px] uppercase font-bold" style={{ color: '#B99B79' }}>
                        {ev.act} · {ev.timeMark}
                      </span>
                    </div>
                    <h3 className="font-editorial text-[17px] font-semibold" style={{ color: '#EDEAE2' }}>
                      {ev.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 pt-2 text-[12.5px] leading-relaxed">
                      <div>
                        <span className="metadata text-[9.5px] uppercase block" style={{ color: '#A7B6D2' }}>
                          Sự thật thực tế
                        </span>
                        <p style={{ color: '#EDEAE2' }}>{ev.objectiveTruth}</p>
                      </div>
                      <div>
                        <span className="metadata text-[9.5px] uppercase block" style={{ color: '#C27B76' }}>
                          Khán giả được biết
                        </span>
                        <p style={{ color: 'rgba(217,213,203,0.7)' }}>{ev.audienceKnowledge}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {state.activeModule === 'research' && (
              <div className="space-y-4">
                {project.research.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-[12px] space-y-2 bg-[#16181D] border border-[rgba(217,213,203,0.08)]"
                  >
                    <span className="metadata text-[9.5px] uppercase" style={{ color: '#A7B6D2' }}>
                      {res.category} · {res.verificationStatus}
                    </span>
                    <h3 className="font-editorial text-[16px] font-semibold" style={{ color: '#EDEAE2' }}>
                      {res.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(217,213,203,0.75)' }}>
                      {res.notes}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {state.activeModule === 'notes' && (
              <div className="space-y-4">
                {project.notes.map((note) => {
                  const meta = NOTE_CATEGORY_META[note.category] || NOTE_CATEGORY_META.unplaced_idea;
                  return (
                    <div
                      key={note.id}
                      className="p-4 rounded-[12px] space-y-1.5 bg-[#16181D] border border-[rgba(217,213,203,0.08)]"
                    >
                      <span className="metadata text-[9.5px] uppercase" style={{ color: meta.color }}>
                        {meta.badge}
                      </span>
                      <h3 className="font-editorial text-[15px] font-semibold" style={{ color: '#EDEAE2' }}>
                        {note.title}
                      </h3>
                      <p className="text-[13px] leading-relaxed italic" style={{ color: 'rgba(217,213,203,0.85)' }}>
                        {note.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Quick Create Modal */}
      <Modal open={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} title="Quick Create to Screenplay">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {(['character', 'scene', 'location', 'note'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setQuickCreateType(t)}
                className="py-2 rounded-[8px] text-[12px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                style={{
                  backgroundColor: quickCreateType === t ? '#B99B79' : '#1E2026',
                  color: quickCreateType === t ? '#101114' : '#EDEAE2',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <input
              type="text"
              value={qcName}
              onChange={(e) => setQcName(e.target.value)}
              placeholder={quickCreateType === 'character' ? 'Character Name (e.g., Detective Vance)...' : 'Title / Identifier...'}
              className="w-full p-3 rounded-[9px] text-[13.5px] bg-[#181A20] border border-[rgba(217,213,203,0.1)] text-[#EDEAE2]"
            />
            <textarea
              rows={3}
              value={qcExtra}
              onChange={(e) => setQcExtra(e.target.value)}
              placeholder="Core notes, dramatic hook or initial idea..."
              className="w-full p-3 rounded-[9px] text-[13px] bg-[#181A20] border border-[rgba(217,213,203,0.1)] text-[#EDEAE2]"
            />
            <button
              type="button"
              onClick={() => {
                if (!qcName.trim()) return;
                if (quickCreateType === 'character') {
                  addCharacter(qcName.trim());
                } else if (quickCreateType === 'scene') {
                  addScene();
                } else if (quickCreateType === 'location') {
                  const id = createId('loc');
                  const newLoc: ScreenplayLocation = {
                    id,
                    name: qcName.trim(),
                    intExt: 'INT.',
                    defaultTime: 'ĐÊM',
                    spatialContext: qcExtra.trim(),
                    architecture: '',
                    lighting: '',
                    soundscape: '',
                    regularCharacterIds: [],
                    referenceImageUrl: '',
                  };
                  updateProject((curr) => ({ ...curr, locations: [...curr.locations, newLoc] }));
                  setSelectedLocId(id);
                  setModule('locations');
                } else {
                  const id = createId('note');
                  const newNote: StoryNoteItem = {
                    id,
                    category: 'sudden_dialogue',
                    title: qcName.trim(),
                    content: qcExtra.trim(),
                    createdAt: Date.now(),
                  };
                  updateProject((curr) => ({ ...curr, notes: [...curr.notes, newNote] }));
                  setModule('notes');
                }
                setQcName('');
                setQcExtra('');
                setQuickCreateOpen(false);
              }}
              className="w-full py-2.5 rounded-[9px] text-[13px] font-semibold cursor-pointer"
              style={{ backgroundColor: '#B99B79', color: '#101114' }}
            >
              Create Now
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
