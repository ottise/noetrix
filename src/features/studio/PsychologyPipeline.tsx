import React, { useEffect, useRef, useState } from 'react';
import { db, createId, getLocalDateStr, addDaysStr } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { persistAllDataToSourceCode, scheduleSourceCodeSave } from '../../lib/sourceStore';
import { Modal, useToast } from '../../components/ui/Primitives';
import {
  CITATION_FORMATS,
  createBlankResearchProject,
  formatSourceCitation,
  normalizeResearchJournalState,
  RESEARCH_PHASES,
  RESEARCH_SECTIONS_META,
  SUGGESTED_RESEARCH_TAGS,
  type CitationFormat,
  type ExperimentDailyLogEntry,
  type PersonalResearchJournalState,
  type RawJournalEntry,
  type ResearchCoreSectionKey,
  type ResearchProject,
  type ResearchSectionStatus,
  type ResearchTimelineEvent,
  type SourceClaimLink,
} from './researchJournalData';
import {
  FieldBlock,
  InlineSectionSources,
  ResearchNotesPanel,
  ResearchTimelinePanel,
  SourceManagerPanel,
} from './ResearchAuxiliaryViews';

const RJ_STORAGE_KEY = 'noetrix_personal_research_journal_v1';

const STATUS_META: Record<
  ResearchSectionStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  not_started: {
    label: 'Not Started',
    color: 'rgba(217, 213, 203, 0.55)',
    bg: 'rgba(217, 213, 203, 0.06)',
    border: 'rgba(217, 213, 203, 0.14)',
  },
  in_progress: {
    label: 'In Progress',
    color: '#B99B79',
    bg: 'rgba(185, 155, 121, 0.12)',
    border: 'rgba(185, 155, 121, 0.35)',
  },
  completed: {
    label: 'Completed',
    color: '#9BAA98',
    bg: 'rgba(155, 170, 152, 0.14)',
    border: 'rgba(155, 170, 152, 0.38)',
  },
};

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'NOV 20, 2026';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr.toUpperCase();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const m = months[(parts[1] - 1 + 12) % 12] || 'NOV';
  return `${m} ${String(parts[2]).padStart(2, '0')}, ${parts[0]}`;
}

function loadResearchJournalState(): PersonalResearchJournalState {
  const today = getLocalDateStr();
  try {
    const raw = localStorage.getItem(RJ_STORAGE_KEY);
    if (raw) {
      return normalizeResearchJournalState(JSON.parse(raw), today);
    }
  } catch {
    // ignore corrupt JSON
  }
  return normalizeResearchJournalState(null, today);
}

const inputBaseStyle: React.CSSProperties = {
  backgroundColor: '#101114',
  color: '#EDEAE2',
  border: '1px solid rgba(217, 213, 203, 0.11)',
};

export function PsychologyPipeline() {
  const { showToast } = useToast();
  const [state, setState] = useState<PersonalResearchJournalState>(() => loadResearchJournalState());
  const [phaseFilter, setPhaseFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [customTagInput, setCustomTagInput] = useState('');
  const [autoSavedAt, setAutoSavedAt] = useState<number>(() => Date.now());
  const [savingExplicit, setSavingExplicit] = useState(false);

  // New Research Project Modal
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('PERSONAL PSYCHOLOGY');

  // Experiment daily log composer inside Section 08
  const [dailyLogObs, setDailyLogObs] = useState('');
  const [dailyLogNote, setDailyLogNote] = useState('');

  // Quick Note modal inside section view so user can jot a thought anytime
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [quickNoteBody, setQuickNoteBody] = useState('');

  // Snapshot refs for automatic timeline logging on explicit Save section
  const lastSavedSnapshotRef = useRef<{
    projectId: string;
    question: string;
    hypothesis: string;
    conclusion: string;
    currentBelief: string;
  } | null>(null);

  const activeProject =
    state.projects.find((p) => p.id === state.lastActiveResearchId) || state.projects[0];

  useEffect(() => {
    if (!activeProject) return;
    if (!lastSavedSnapshotRef.current || lastSavedSnapshotRef.current.projectId !== activeProject.id) {
      lastSavedSnapshotRef.current = {
        projectId: activeProject.id,
        question: activeProject.question,
        hypothesis: activeProject.hypothesis,
        conclusion: activeProject.conclusion,
        currentBelief: activeProject.currentBelief,
      };
    }
  }, [activeProject]);

  // Auto-save to localStorage + source code (`src/data/noetrix-store.json`) + silent Dexie mirror
  useEffect(() => {
    try {
      localStorage.setItem(RJ_STORAGE_KEY, JSON.stringify(state));
      scheduleSourceCodeSave();
      setAutoSavedAt(Date.now());
    } catch {
      // ignore storage errors
    }

    const syncToDexie = async () => {
      for (const proj of state.projects) {
        const postId = proj.igPostId || `psy_${proj.id}`;
        await db.psychologyPosts.put({
          id: postId,
          title: proj.title,
          behaviorConcept: proj.code,
          hook: proj.question,
          status: proj.igPublished
            ? 'published'
            : proj.researchStatus === 'completed'
            ? 'english'
            : proj.evidence.trim()
            ? 'research'
            : 'raw',
          dueDate: proj.igDueDate || addDaysStr(getLocalDateStr(), 7),
          publishedAt: proj.igPublished ? getLocalDateStr() : undefined,
          rawVi: proj.background || proj.observation,
          researchNotes: `${proj.hypothesis}\n\n${proj.literatureReview}\n\n${proj.evidence}`,
          sources: state.sources
            .filter(
              (s) =>
                proj.sourceIds.includes(s.id) ||
                state.sourceLinks.some((l) => l.researchId === proj.id && l.sourceId === s.id)
            )
            .map((s) => formatSourceCitation(s, proj.citationFormat))
            .join('\n'),
          factChecked: proj.researchStatus === 'completed',
          englishRewrite: proj.igEnglishRewrite || '',
          reflection: proj.currentBelief,
          createdAt: proj.createdAt,
          updatedAt: proj.updatedAt,
        });
      }
    };
    syncToDexie().catch(() => {});
  }, [state]);

  const updateProject = (
    updater: (proj: ResearchProject) => ResearchProject,
    touchedSection?: ResearchCoreSectionKey
  ) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== activeProject.id) return p;
        const nextProj = updater(p);
        const nextStatuses = { ...nextProj.sectionStatuses };
        if (touchedSection && nextStatuses[touchedSection] === 'not_started') {
          nextStatuses[touchedSection] = 'in_progress';
        }
        const completedCount = Object.values(nextStatuses).filter((s) => s === 'completed').length;
        const anyStarted = Object.values(nextStatuses).some((s) => s !== 'not_started');
        const nextOverall: ResearchSectionStatus =
          completedCount === 12
            ? 'completed'
            : anyStarted
            ? nextProj.researchStatus === 'completed'
              ? 'in_progress'
              : 'in_progress'
            : 'not_started';

        return {
          ...nextProj,
          sectionStatuses: nextStatuses,
          researchStatus:
            nextProj.researchStatus !== p.researchStatus ? nextProj.researchStatus : nextOverall,
          updatedAt: Date.now(),
        };
      }),
    }));
  };

  const setSectionStatus = (key: ResearchCoreSectionKey, status: ResearchSectionStatus) => {
    triggerHaptic('selection');
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== activeProject.id) return p;
        const nextStatuses = { ...p.sectionStatuses, [key]: status };
        const completedCount = Object.values(nextStatuses).filter((s) => s === 'completed').length;
        const anyStarted = Object.values(nextStatuses).some((s) => s !== 'not_started');
        return {
          ...p,
          sectionStatuses: nextStatuses,
          researchStatus:
            completedCount === 12 ? 'completed' : anyStarted ? 'in_progress' : 'not_started',
          updatedAt: Date.now(),
        };
      }),
    }));
  };

  const handleSaveSection = async (key: ResearchCoreSectionKey) => {
    setSavingExplicit(true);
    triggerHaptic('light');
    const nowTs = Date.now();
    const today = getLocalDateStr();
    const meta = RESEARCH_SECTIONS_META.find((m) => m.key === key)!;

    // Detect meaningful shifts in Questions / Hypothesis / Conclusion / Reflection for Research Timeline
    const newTimelineEntries: ResearchTimelineEvent[] = [];
    const snap = lastSavedSnapshotRef.current;
    if (snap && snap.projectId === activeProject.id) {
      if (key === 'questions' && activeProject.question.trim() && activeProject.question !== snap.question) {
        newTimelineEntries.push({
          id: createId('tl'),
          researchId: activeProject.id,
          dateStr: today,
          timestamp: nowTs,
          category: 'question',
          summary: 'Cập nhật Main Research Question.',
          snapshot: activeProject.question.trim(),
        });
        snap.question = activeProject.question;
      }
      if (key === 'hypothesis' && activeProject.hypothesis.trim() && activeProject.hypothesis !== snap.hypothesis) {
        newTimelineEntries.push({
          id: createId('tl'),
          researchId: activeProject.id,
          dateStr: today,
          timestamp: nowTs,
          category: 'hypothesis',
          summary: 'Điều chỉnh Hypothesis trong mục 04.',
          snapshot: activeProject.hypothesis.trim(),
        });
        snap.hypothesis = activeProject.hypothesis;
      }
      if (key === 'conclusion' && activeProject.conclusion.trim() && activeProject.conclusion !== snap.conclusion) {
        newTimelineEntries.push({
          id: createId('tl'),
          researchId: activeProject.id,
          dateStr: today,
          timestamp: nowTs,
          category: 'conclusion',
          summary: 'Lưu bản cập nhật Findings Summary / Conclusion.',
          snapshot: activeProject.conclusion.trim(),
        });
        snap.conclusion = activeProject.conclusion;
      }
      if (
        key === 'reflection' &&
        activeProject.currentBelief.trim() &&
        activeProject.currentBelief !== snap.currentBelief
      ) {
        newTimelineEntries.push({
          id: createId('tl'),
          researchId: activeProject.id,
          dateStr: today,
          timestamp: nowTs,
          category: 'reflection',
          summary: 'Cập nhật nhận thức cá nhân (Current Belief).',
          snapshot: activeProject.currentBelief.trim(),
        });
        snap.currentBelief = activeProject.currentBelief;
      }
    }

    const nextState: PersonalResearchJournalState = {
      ...state,
      projects: state.projects.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              sectionSavedAt: { ...p.sectionSavedAt, [key]: nowTs },
              updatedAt: nowTs,
            }
          : p
      ),
      timelineEvents:
        newTimelineEntries.length > 0
          ? [...newTimelineEntries, ...state.timelineEvents]
          : state.timelineEvents,
    };

    setState(nextState);
    try {
      localStorage.setItem(RJ_STORAGE_KEY, JSON.stringify(nextState));
      await persistAllDataToSourceCode();
      setAutoSavedAt(nowTs);
    } catch {
      // ignore
    } finally {
      setSavingExplicit(false);
    }

    showToast(
      newTimelineEntries.length > 0
        ? `Đã lưu ${meta.code} · ${meta.shortLabel} & ghi mốc Timeline`
        : `Đã lưu ${meta.code} · ${meta.shortLabel}`
    );
  };

  const selectCoreSection = (key: ResearchCoreSectionKey) => {
    triggerHaptic('selection');
    setState((prev) => ({
      ...prev,
      activeCoreSection: key,
      activeView: { kind: 'section', key },
    }));
  };

  const selectAuxiliary = (key: 'notes' | 'sources' | 'timeline') => {
    triggerHaptic('selection');
    setState((prev) => ({
      ...prev,
      activeView: { kind: 'auxiliary', key },
    }));
  };

  const handleCreateProject = (e: React.FormEvent, presetTitle?: string) => {
    e.preventDefault();
    const titleToUse = (presetTitle ?? newTitle).trim() || 'Why Do I Struggle to Learn?';
    const domainToUse = newDomain.trim() || 'PERSONAL PSYCHOLOGY';
    const nextProj = createBlankResearchProject(
      state.projects.length + 1,
      getLocalDateStr(),
      titleToUse,
      domainToUse
    );
    setState((prev) => ({
      ...prev,
      lastActiveResearchId: nextProj.id,
      activeCoreSection: 'overview',
      activeView: { kind: 'section', key: 'overview' },
      projects: [...prev.projects, nextProj],
    }));
    setNewTitle('');
    setNewProjectOpen(false);
    showToast(`Đã tạo ${nextProj.code}`);
  };

  const handlePushNoteToSection = (note: RawJournalEntry, targetKey: ResearchCoreSectionKey) => {
    const snippet = note.rawContent.trim()
      ? `[Note · ${note.date}] ${note.title}: ${note.rawContent.trim()}`
      : `[Note · ${note.date}] ${note.title}`;

    updateProject((p) => {
      if (targetKey === 'problem') {
        return { ...p, observation: p.observation ? `${p.observation}\n\n${snippet}` : snippet };
      }
      if (targetKey === 'questions') {
        return { ...p, subQuestions: p.subQuestions ? `${p.subQuestions}\n${snippet}` : snippet };
      }
      if (targetKey === 'literature') {
        return { ...p, literatureReview: p.literatureReview ? `${p.literatureReview}\n\n${snippet}` : snippet };
      }
      if (targetKey === 'evidence') {
        return { ...p, evidence: p.evidence ? `${p.evidence}\n\n${snippet}` : snippet };
      }
      if (targetKey === 'discussion') {
        return { ...p, interpretation: p.interpretation ? `${p.interpretation}\n\n${snippet}` : snippet };
      }
      if (targetKey === 'reflection') {
        return { ...p, lessonsLearned: p.lessonsLearned ? `${p.lessonsLearned}\n\n${snippet}` : snippet };
      }
      return p;
    }, targetKey);

    setState((prev) => ({
      ...prev,
      activeCoreSection: targetKey,
      activeView: { kind: 'section', key: targetKey },
      rawEntries: prev.rawEntries.map((r) =>
        r.id === note.id ? { ...r, targetSection: targetKey } : r
      ),
    }));
    showToast(`Đã chèn ghi chú vào mục ${targetKey.toUpperCase()}`);
  };

  const completedCount = Object.values(activeProject.sectionStatuses).filter(
    (s) => s === 'completed'
  ).length;
  const projectStatusMeta = STATUS_META[activeProject.researchStatus];

  const visibleSections =
    phaseFilter === 0
      ? RESEARCH_SECTIONS_META
      : RESEARCH_SECTIONS_META.filter((m) => m.phase === phaseFilter);

  const activeSectionKey =
    state.activeView.kind === 'section' ? state.activeView.key : state.activeCoreSection;
  const activeMetaIndex = RESEARCH_SECTIONS_META.findIndex((m) => m.key === activeSectionKey);
  const activeMeta = RESEARCH_SECTIONS_META[activeMetaIndex] || RESEARCH_SECTIONS_META[0];
  const prevMeta = activeMetaIndex > 0 ? RESEARCH_SECTIONS_META[activeMetaIndex - 1] : null;
  const nextMeta =
    activeMetaIndex >= 0 && activeMetaIndex < RESEARCH_SECTIONS_META.length - 1
      ? RESEARCH_SECTIONS_META[activeMetaIndex + 1]
      : null;

  const projectLinks = state.sourceLinks.filter((l) => l.researchId === activeProject.id);
  const projectSources = state.sources.filter(
    (s) =>
      activeProject.sourceIds.includes(s.id) ||
      s.relatedResearchIds.includes(activeProject.id) ||
      projectLinks.some((l) => l.sourceId === s.id)
  );
  const projectNotesCount = state.rawEntries.filter(
    (n) => n.relatedResearchIds.length === 0 || n.relatedResearchIds.includes(activeProject.id)
  ).length;
  const projectTimelineCount = state.timelineEvents.filter(
    (e) => e.researchId === activeProject.id
  ).length;

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Toggle tags inside Section 01 Overview
  const toggleTag = (tag: string) => {
    updateProject(
      (p) => ({
        ...p,
        tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag],
      }),
      'overview'
    );
  };

  const addCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const t = customTagInput.trim();
    if (!t) return;
    if (!activeProject.tags.includes(t)) {
      updateProject((p) => ({ ...p, tags: [...p.tags, t] }), 'overview');
    }
    setCustomTagInput('');
  };

  const addDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyLogObs.trim()) return;
    const entry: ExperimentDailyLogEntry = {
      id: createId('elog'),
      date: getLocalDateStr(),
      observation: dailyLogObs.trim(),
      note: dailyLogNote.trim() || undefined,
    };
    updateProject(
      (p) => ({
        ...p,
        experimentDailyLogs: [entry, ...p.experimentDailyLogs],
      }),
      'experiment'
    );
    setDailyLogObs('');
    setDailyLogNote('');
  };

  const handleSaveQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteBody.trim() && !quickNoteTitle.trim()) return;
    const now = Date.now();
    const targetSec = state.activeView.kind === 'section' ? state.activeView.key : undefined;
    const note: RawJournalEntry = {
      id: createId('note'),
      title: quickNoteTitle.trim() || `Ghi chú khi làm ${activeMeta.code} ${activeMeta.shortLabel}`,
      date: getLocalDateStr(),
      rawContent: quickNoteBody.trim(),
      tags: [],
      targetSection: targetSec,
      relatedResearchIds: [activeProject.id],
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({ ...prev, rawEntries: [note, ...prev.rawEntries] }));
    setQuickNoteTitle('');
    setQuickNoteBody('');
    setQuickNoteOpen(false);
    showToast('Đã lưu vào Research Notes');
  };

  return (
    <div
      className="rounded-[14px] overflow-hidden flex flex-col lg:flex-row min-h-[760px]"
      style={{
        backgroundColor: '#101114',
        border: '1px solid rgba(217, 213, 203, 0.09)',
      }}
    >
      {/* =====================================================================
          LEFT SIDEBAR — PROJECT CONTEXT + 12 RESEARCH SECTIONS + 3 AUXILIARY AREAS
          ===================================================================== */}
      <aside
        className="w-full lg:w-[295px] shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r"
        style={{
          backgroundColor: '#14161B',
          borderColor: 'rgba(217, 213, 203, 0.08)',
        }}
      >
        <div className="p-4 space-y-5">
          {/* Project Header Block */}
          <div className="space-y-2.5 pb-4 border-b" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
            <div className="flex items-center justify-between gap-2">
              <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                {activeProject.code}
              </span>
              <span
                className="metadata text-[9.5px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[5px]"
                style={{
                  backgroundColor: projectStatusMeta.bg,
                  color: projectStatusMeta.color,
                  border: `1px solid ${projectStatusMeta.border}`,
                }}
              >
                {projectStatusMeta.label}
              </span>
            </div>

            <h2
              className="font-editorial text-[20px] leading-snug"
              style={{ color: 'var(--os-ivory-bright)' }}
            >
              {activeProject.title || 'Untitled Research Study'}
            </h2>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="metadata text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--os-ivory-faint)' }}>
                {activeProject.domain} · {formatDisplayDate(activeProject.date)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="metadata text-[11px]" style={{ color: 'var(--os-ivory-muted)' }}>
                {completedCount} / 12 sections
              </span>

              {/* Project Switcher & Create */}
              <div className="flex items-center gap-1.5">
                {state.projects.length > 1 && (
                  <select
                    value={activeProject.id}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, lastActiveResearchId: e.target.value }))
                    }
                    title="Chuyển đề tài nghiên cứu"
                    className="px-2 py-1 rounded-[5px] text-[11px] max-w-[115px] truncate cursor-pointer"
                    style={{
                      backgroundColor: '#101114',
                      color: 'var(--os-ivory-muted)',
                      border: '1px solid rgba(217, 213, 203, 0.1)',
                    }}
                  >
                    {state.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => setNewProjectOpen(true)}
                  className="px-2 py-1 rounded-[5px] text-[11px] font-medium cursor-pointer hover:bg-white/5"
                  style={{
                    color: '#B99B79',
                    border: '1px solid rgba(185, 155, 121, 0.3)',
                  }}
                >
                  + Đề tài mới
                </button>
              </div>
            </div>
          </div>

          {/* 5-Stage Practical Phase Filter (Non-locking helper) */}
          <div className="space-y-1.5">
            <span className="metadata text-[9.5px] uppercase tracking-[0.12em] block" style={{ color: 'var(--os-ivory-faint)' }}>
              GIAI ĐOẠN THỰC HIỆN (TÙY CHỌN LỌC)
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setPhaseFilter(0)}
                className="px-2 py-0.5 rounded-[5px] text-[10.5px] cursor-pointer"
                style={{
                  backgroundColor: phaseFilter === 0 ? '#23262F' : 'transparent',
                  color: phaseFilter === 0 ? '#EDEAE2' : 'var(--os-ivory-faint)',
                  border:
                    phaseFilter === 0
                      ? '1px solid rgba(217, 213, 203, 0.16)'
                      : '1px solid transparent',
                }}
              >
                All (12)
              </button>
              {RESEARCH_PHASES.map((ph) => {
                const active = phaseFilter === ph.phase;
                return (
                  <button
                    key={ph.phase}
                    type="button"
                    title={ph.title}
                    onClick={() => setPhaseFilter(ph.phase)}
                    className="px-2 py-0.5 rounded-[5px] text-[10.5px] cursor-pointer"
                    style={{
                      backgroundColor: active ? 'rgba(185, 155, 121, 0.14)' : 'transparent',
                      color: active ? '#B99B79' : 'var(--os-ivory-faint)',
                      border: active
                        ? '1px solid rgba(185, 155, 121, 0.3)'
                        : '1px solid transparent',
                    }}
                  >
                    Đợt {ph.phase}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 12 Core Research Sections */}
          <nav aria-label="Research Sections" className="space-y-1">
            <p className="metadata text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--os-ivory-faint)' }}>
              RESEARCH SECTIONS
            </p>
            {visibleSections.map((sec) => {
              const isActive =
                state.activeView.kind === 'section' && state.activeView.key === sec.key;
              const status = activeProject.sectionStatuses[sec.key] || 'not_started';
              const dotColor =
                status === 'completed'
                  ? '#9BAA98'
                  : status === 'in_progress'
                  ? '#B99B79'
                  : 'rgba(217, 213, 203, 0.22)';

              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => selectCoreSection(sec.key)}
                  className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-[7px] text-left transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isActive ? '#1D2028' : 'transparent',
                    border: isActive
                      ? '1px solid rgba(185, 155, 121, 0.35)'
                      : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="metadata text-[11px] w-5 shrink-0"
                      style={{ color: isActive ? '#B99B79' : 'var(--os-ivory-faint)' }}
                    >
                      {sec.code}
                    </span>
                    <span
                      className="text-[13px] truncate"
                      style={{
                        color: isActive ? '#EDEAE2' : 'var(--os-ivory-muted)',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {sec.shortLabel}
                    </span>
                  </div>

                  <span
                    title={STATUS_META[status].label}
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3 Cross-Cutting Auxiliary Tools (Strictly Outside 12 Sections) */}
        <div
          className="p-4 border-t space-y-1.5"
          style={{
            backgroundColor: '#121318',
            borderColor: 'rgba(217, 213, 203, 0.08)',
          }}
        >
          <p className="metadata text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: '#A7B6D2' }}>
            WORKSPACE TOOLS
          </p>
          {(
            [
              { key: 'notes', label: 'Research Notes', count: projectNotesCount },
              { key: 'sources', label: 'Source Manager', count: state.sources.length },
              { key: 'timeline', label: 'Research Timeline', count: projectTimelineCount },
            ] as const
          ).map((tool) => {
            const active =
              state.activeView.kind === 'auxiliary' && state.activeView.key === tool.key;
            return (
              <button
                key={tool.key}
                type="button"
                onClick={() => selectAuxiliary(tool.key)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[7px] text-left cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? '#1D2028' : 'transparent',
                  border: active
                    ? '1px solid rgba(167, 182, 210, 0.35)'
                    : '1px solid transparent',
                }}
              >
                <span
                  className="text-[12.5px] font-medium"
                  style={{ color: active ? '#EDEAE2' : 'var(--os-ivory-muted)' }}
                >
                  {tool.label}
                </span>
                <span
                  className="metadata text-[10.5px] px-1.5 py-0.5 rounded-[4px]"
                  style={{
                    backgroundColor: 'rgba(217, 213, 203, 0.06)',
                    color: active ? '#A7B6D2' : 'var(--os-ivory-faint)',
                  }}
                >
                  {tool.count}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* =====================================================================
          RIGHT MAIN CONTENT — SHOWS ONLY SELECTED SECTION OR AUXILIARY PANEL
          ===================================================================== */}
      <section className="flex-1 min-w-0 p-5 sm:p-7 lg:p-9 flex flex-col justify-between gap-8">
        {state.activeView.kind === 'auxiliary' ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => selectCoreSection(state.activeCoreSection)}
                className="text-[12px] font-medium hover:underline cursor-pointer"
                style={{ color: '#B99B79' }}
              >
                ← Quay lại {activeMeta.code} · {activeMeta.shortLabel}
              </button>
            </div>

            {state.activeView.key === 'notes' && (
              <ResearchNotesPanel
                project={activeProject}
                notes={state.rawEntries}
                onAddNote={(entry) =>
                  setState((prev) => ({ ...prev, rawEntries: [entry, ...prev.rawEntries] }))
                }
                onDeleteNote={(id) =>
                  setState((prev) => ({
                    ...prev,
                    rawEntries: prev.rawEntries.filter((n) => n.id !== id),
                  }))
                }
                onPushNoteToSection={handlePushNoteToSection}
              />
            )}

            {state.activeView.key === 'sources' && (
              <SourceManagerPanel
                project={activeProject}
                sources={state.sources}
                sourceLinks={state.sourceLinks}
                citationFormat={activeProject.citationFormat}
                onAddSource={(src) =>
                  setState((prev) => ({
                    ...prev,
                    sources: [src, ...prev.sources],
                    projects: prev.projects.map((p) =>
                      p.id === activeProject.id && !p.sourceIds.includes(src.id)
                        ? { ...p, sourceIds: [...p.sourceIds, src.id] }
                        : p
                    ),
                  }))
                }
                onDeleteSource={(id) =>
                  setState((prev) => ({
                    ...prev,
                    sources: prev.sources.filter((s) => s.id !== id),
                    sourceLinks: prev.sourceLinks.filter((l) => l.sourceId !== id),
                  }))
                }
                onAddLink={(link) =>
                  setState((prev) => ({ ...prev, sourceLinks: [link, ...prev.sourceLinks] }))
                }
                onRemoveLink={(linkId) =>
                  setState((prev) => ({
                    ...prev,
                    sourceLinks: prev.sourceLinks.filter((l) => l.id !== linkId),
                  }))
                }
              />
            )}

            {state.activeView.key === 'timeline' && (
              <ResearchTimelinePanel
                project={activeProject}
                events={state.timelineEvents}
                onAddEvent={(ev) =>
                  setState((prev) => ({
                    ...prev,
                    timelineEvents: [ev, ...prev.timelineEvents],
                  }))
                }
                onDeleteEvent={(id) =>
                  setState((prev) => ({
                    ...prev,
                    timelineEvents: prev.timelineEvents.filter((e) => e.id !== id),
                  }))
                }
              />
            )}
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {/* Active Section Header */}
              <header
                className="pb-5 border-b space-y-4"
                style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="metadata text-[11px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                      {activeMeta.code} / {activeMeta.shortLabel.toUpperCase()}
                    </span>
                    <span
                      className="metadata text-[10px] px-2 py-0.5 rounded-[5px]"
                      style={{
                        backgroundColor: 'rgba(217, 213, 203, 0.05)',
                        color: 'var(--os-ivory-faint)',
                      }}
                    >
                      {activeMeta.phaseLabel}
                    </span>
                  </div>

                  {/* Quick Note + Status Selector + Save Section */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setQuickNoteOpen(true)}
                      className="px-2.5 py-1.5 rounded-[7px] text-[11.5px] font-medium cursor-pointer hover:bg-white/5"
                      style={{
                        backgroundColor: '#16181E',
                        color: 'var(--os-ivory-muted)',
                        border: '1px solid rgba(217, 213, 203, 0.1)',
                      }}
                    >
                      + Research Note
                    </button>

                    <div
                      className="flex items-center rounded-[7px] overflow-hidden"
                      style={{
                        backgroundColor: '#16181E',
                        border: '1px solid rgba(217, 213, 203, 0.1)',
                      }}
                    >
                      {(['not_started', 'in_progress', 'completed'] as ResearchSectionStatus[]).map(
                        (st) => {
                          const current = activeProject.sectionStatuses[activeMeta.key] === st;
                          const stMeta = STATUS_META[st];
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setSectionStatus(activeMeta.key, st)}
                              className="px-2.5 py-1.5 text-[11px] font-medium cursor-pointer transition-colors"
                              style={{
                                backgroundColor: current ? stMeta.bg : 'transparent',
                                color: current ? stMeta.color : 'var(--os-ivory-faint)',
                              }}
                            >
                              {stMeta.label}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={savingExplicit}
                      onClick={() => handleSaveSection(activeMeta.key)}
                      className="px-3.5 py-1.5 rounded-[7px] text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#B99B79', color: '#101114' }}
                    >
                      {savingExplicit ? 'Saving...' : 'Save section'}
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <h2
                      className="font-editorial text-[28px] sm:text-[32px] leading-tight"
                      style={{ color: 'var(--os-ivory-bright)' }}
                    >
                      {activeMeta.title}
                    </h2>
                    <p className="text-[13.5px] mt-1" style={{ color: 'var(--os-ivory-muted)' }}>
                      {activeMeta.subtitle}
                    </p>
                  </div>

                  <span className="metadata text-[10.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    Tự động lưu lúc {formatTime(autoSavedAt)}
                    {activeProject.sectionSavedAt[activeMeta.key]
                      ? ` · Đã xác nhận lúc ${formatTime(activeProject.sectionSavedAt[activeMeta.key])}`
                      : ''}
                  </span>
                </div>
              </header>

              {/* ===============================================================
                  SECTION-SPECIFIC FIELDS (01..12)
                  =============================================================== */}
              {activeMeta.key === 'overview' && (
                <div className="space-y-5">
                  <FieldBlock label="Title" hint="Tên gọi rõ ràng cho đề tài hoặc câu hỏi nghiên cứu này.">
                    <input
                      type="text"
                      value={activeProject.title}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, title: e.target.value }), 'overview')
                      }
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[14.5px] font-medium"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FieldBlock label="Research Status" hint="Trạng thái chung của toàn bộ nghiên cứu.">
                      <select
                        value={activeProject.researchStatus}
                        onChange={(e) =>
                          updateProject(
                            (p) => ({
                              ...p,
                              researchStatus: e.target.value as ResearchSectionStatus,
                            }),
                            'overview'
                          )
                        }
                        className="w-full px-3 py-2.5 rounded-[8px] text-[13px]"
                        style={inputBaseStyle}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </FieldBlock>

                    <FieldBlock label="Date" hint="Ngày khởi tạo hoặc mốc hiện tại.">
                      <input
                        type="date"
                        value={activeProject.date}
                        onChange={(e) =>
                          updateProject((p) => ({ ...p, date: e.target.value }), 'overview')
                        }
                        className="w-full px-3 py-2.5 rounded-[8px] text-[13px]"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>

                    <FieldBlock label="Domain / Field" hint="Lĩnh vực (VD: PERSONAL PSYCHOLOGY).">
                      <input
                        type="text"
                        value={activeProject.domain}
                        onChange={(e) =>
                          updateProject(
                            (p) => ({ ...p, domain: e.target.value.toUpperCase() }),
                            'overview'
                          )
                        }
                        className="w-full px-3 py-2.5 rounded-[8px] text-[13px]"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>
                  </div>

                  <FieldBlock label="Abstract" hint="Tóm tắt ngắn gọn bức tranh toàn cảnh của nghiên cứu này.">
                    <textarea
                      rows={4}
                      value={activeProject.abstract}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, abstract: e.target.value }), 'overview')
                      }
                      placeholder="Nghiên cứu này tập trung tìm hiểu điều gì, vì sao quan trọng và hướng tiếp cận chính là gì..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Tags" hint="Gắn chủ đề để dễ đối chiếu giữa các nghiên cứu.">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set([...SUGGESTED_RESEARCH_TAGS, ...activeProject.tags])).map(
                        (tag) => {
                          const selected = activeProject.tags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className="px-2.5 py-1 rounded-[6px] text-[11.5px] cursor-pointer transition-colors"
                              style={{
                                backgroundColor: selected
                                  ? 'rgba(185, 155, 121, 0.16)'
                                  : '#16181E',
                                color: selected ? '#B99B79' : 'var(--os-ivory-muted)',
                                border: selected
                                  ? '1px solid rgba(185, 155, 121, 0.4)'
                                  : '1px solid rgba(217, 213, 203, 0.1)',
                              }}
                            >
                              {tag}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <form onSubmit={addCustomTag} className="flex gap-2 mt-2 max-w-xs">
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="+ Thêm tag..."
                        className="flex-1 px-2.5 py-1.5 rounded-[6px] text-[12px]"
                        style={inputBaseStyle}
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-[6px] text-[11.5px] font-medium cursor-pointer"
                        style={{
                          backgroundColor: '#1B1D24',
                          color: 'var(--os-ivory-bright)',
                          border: '1px solid rgba(217, 213, 203, 0.12)',
                        }}
                      >
                        Thêm
                      </button>
                    </form>
                  </FieldBlock>
                </div>
              )}

              {activeMeta.key === 'problem' && (
                <div className="space-y-5">
                  <FieldBlock label="Background" hint="Why is this problem worth investigating?">
                    <textarea
                      rows={4}
                      value={activeProject.background}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, background: e.target.value }), 'problem')
                      }
                      placeholder="Bối cảnh nảy sinh vấn đề và vì sao câu hỏi này đáng bỏ công tìm hiểu..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Personal Observation" hint="What have you experienced?">
                    <textarea
                      rows={4}
                      value={activeProject.observation}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, observation: e.target.value }), 'problem')
                      }
                      placeholder="Những biểu hiện thực tế bạn tự quan sát thấy ở bản thân hoặc xung quanh..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Problem Statement" hint="Describe the specific problem.">
                    <textarea
                      rows={3}
                      value={activeProject.problemStatement}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, problemStatement: e.target.value }), 'problem')
                      }
                      placeholder="Phát biểu cô đọng điểm nghẽn cốt lõi cần giải mã..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Context" hint="Hoàn cảnh cụ thể khi vấn đề này xuất hiện (môi trường, thời điểm, tác nhân).">
                    <textarea
                      rows={3}
                      value={activeProject.problemContext}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, problemContext: e.target.value }), 'problem')
                      }
                      placeholder="Vấn đề xảy ra trong điều kiện nào..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>
                </div>
              )}

              {activeMeta.key === 'questions' && (
                <div className="space-y-5">
                  <FieldBlock label="Main Question" hint="Câu hỏi nghiên cứu trung tâm bạn muốn trả lời.">
                    <textarea
                      rows={3}
                      value={activeProject.question}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, question: e.target.value }), 'questions')
                      }
                      placeholder="Câu hỏi lớn nhất định hướng toàn bộ quá trình tìm hiểu..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[14px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Sub-questions" hint="Các câu hỏi nhánh giúp bóc tách câu hỏi chính thành phần nhỏ hơn.">
                    <textarea
                      rows={4}
                      value={activeProject.subQuestions}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, subQuestions: e.target.value }), 'questions')
                      }
                      placeholder="1. ...\n2. ..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldBlock label="Scope" hint="Phạm vi bạn chọn để nghiên cứu giữ được chiều sâu.">
                      <textarea
                        rows={3}
                        value={activeProject.scope}
                        onChange={(e) =>
                          updateProject((p) => ({ ...p, scope: e.target.value }), 'questions')
                        }
                        placeholder="Ví dụ: Chỉ xét thói quen tự học trong 30 ngày gần đây..."
                        className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>

                    <FieldBlock label="Research Boundaries" hint="Những khía cạnh chủ đích KHÔNG đưa vào đề tài này.">
                      <textarea
                        rows={3}
                        value={activeProject.researchBoundaries}
                        onChange={(e) =>
                          updateProject(
                            (p) => ({ ...p, researchBoundaries: e.target.value }),
                            'questions'
                          )
                        }
                        placeholder="Giới hạn để tránh lan man sang vấn đề khác..."
                        className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>
                  </div>
                </div>
              )}

              {activeMeta.key === 'hypothesis' && (
                <div className="space-y-5">
                  <FieldBlock label="Hypotheses" hint="Giả thuyết giải thích ban đầu trước khi đối chiếu bằng chứng.">
                    <textarea
                      rows={4}
                      value={activeProject.hypothesis}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, hypothesis: e.target.value }), 'hypothesis')
                      }
                      placeholder="Nếu nguyên nhân nằm ở X, thì hiện tượng Y xảy ra vì..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Research Objectives" hint="Những mục tiêu cụ thể cần làm rõ trong bài nghiên cứu này.">
                    <textarea
                      rows={4}
                      value={activeProject.objectives}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, objectives: e.target.value }), 'hypothesis')
                      }
                      placeholder="1. Làm rõ...\n2. Kiểm chứng..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Expected Outcomes" hint="Kết quả hoặc sự thấu hiểu kỳ vọng đạt được sau nghiên cứu.">
                    <textarea
                      rows={3}
                      value={activeProject.expectedOutcomes}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, expectedOutcomes: e.target.value }),
                          'hypothesis'
                        )
                      }
                      placeholder="Nếu giả thuyết đúng (hoặc sai), mình sẽ hiểu được điều gì..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>
                </div>
              )}

              {activeMeta.key === 'literature' && (
                <div className="space-y-5">
                  <FieldBlock label="Existing Theories" hint="Các học thuyết, mô hình khoa học hoặc khái niệm nền liên quan.">
                    <textarea
                      rows={3}
                      value={activeProject.existingTheories}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, existingTheories: e.target.value }),
                          'literature'
                        )
                      }
                      placeholder="Tên học thuyết / mô hình tâm lý - nhận thức..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Previous Studies" hint="Tổng hợp phát hiện từ các nghiên cứu hoặc sách đã đọc.">
                    <textarea
                      rows={5}
                      value={activeProject.literatureReview}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, literatureReview: e.target.value }),
                          'literature'
                        )
                      }
                      placeholder="Tác giả (Năm): Họ phát hiện điều gì liên quan tới câu hỏi của bạn..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldBlock label="Related Concepts" hint="Thuật ngữ và khái niệm liên đới cần phân biệt.">
                      <textarea
                        rows={3}
                        value={activeProject.relatedConcepts}
                        onChange={(e) =>
                          updateProject(
                            (p) => ({ ...p, relatedConcepts: e.target.value }),
                            'literature'
                          )
                        }
                        placeholder="Ví dụ: Cognitive friction, Symbolic self-completion..."
                        className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>

                    <FieldBlock label="Research Gaps" hint="Điểm mà tài liệu hiện có chưa giải thích trọn vẹn cho tình huống của bạn.">
                      <textarea
                        rows={3}
                        value={activeProject.researchGaps}
                        onChange={(e) =>
                          updateProject(
                            (p) => ({ ...p, researchGaps: e.target.value }),
                            'literature'
                          )
                        }
                        placeholder="Điều gì còn thiếu hoặc chưa rõ trong bối cảnh thực tế..."
                        className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>
                  </div>

                  <InlineSectionSources
                    sectionKey="literature"
                    project={activeProject}
                    sources={state.sources}
                    sourceLinks={state.sourceLinks}
                    onAddLink={(lnk) =>
                      setState((prev) => ({ ...prev, sourceLinks: [lnk, ...prev.sourceLinks] }))
                    }
                    onRemoveLink={(id) =>
                      setState((prev) => ({
                        ...prev,
                        sourceLinks: prev.sourceLinks.filter((l) => l.id !== id),
                      }))
                    }
                    onOpenSourceManager={() => selectAuxiliary('sources')}
                  />
                </div>
              )}

              {activeMeta.key === 'methodology' && (
                <div className="space-y-5">
                  <FieldBlock label="Research Design" hint="Cách bạn tiếp cận (nghiên cứu tài liệu, tự quan sát định tính, thử nghiệm nhỏ...).">
                    <textarea
                      rows={3}
                      value={activeProject.researchDesign}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, researchDesign: e.target.value }),
                          'methodology'
                        )
                      }
                      placeholder="Mô tả thiết kế nghiên cứu phù hợp với đề tài này..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Data Collection" hint="Bạn thu thập thông tin bằng cách nào (đọc tài liệu, nhật ký hành vi, phỏng vấn...)?">
                    <textarea
                      rows={3}
                      value={activeProject.dataCollection}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, dataCollection: e.target.value }),
                          'methodology'
                        )
                      }
                      placeholder="Nguồn dữ liệu và cách ghi nhận bằng chứng..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  {/* Optional Methodology Fields Toolbar */}
                  <div
                    className="p-3.5 rounded-[9px] space-y-4"
                    style={{
                      backgroundColor: '#13151B',
                      border: '1px solid rgba(217, 213, 203, 0.08)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[12px]" style={{ color: 'var(--os-ivory-muted)' }}>
                        Các trường tùy chọn (bật nếu đề tài thực sự cần):
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(
                          [
                            ['participants', 'Participants'],
                            ['variables', 'Variables'],
                            ['procedure', 'Procedure'],
                          ] as const
                        ).map(([optKey, optLabel]) => {
                          const enabled = activeProject.optionalMethodologyFields[optKey];
                          return (
                            <button
                              key={optKey}
                              type="button"
                              onClick={() =>
                                updateProject(
                                  (p) => ({
                                    ...p,
                                    optionalMethodologyFields: {
                                      ...p.optionalMethodologyFields,
                                      [optKey]: !enabled,
                                    },
                                  }),
                                  'methodology'
                                )
                              }
                              className="px-2.5 py-1 rounded-[6px] text-[11.5px] cursor-pointer"
                              style={{
                                backgroundColor: enabled
                                  ? 'rgba(167, 182, 210, 0.14)'
                                  : '#101114',
                                color: enabled ? '#A7B6D2' : 'var(--os-ivory-faint)',
                                border: enabled
                                  ? '1px solid rgba(167, 182, 210, 0.35)'
                                  : '1px solid rgba(217, 213, 203, 0.1)',
                              }}
                            >
                              {enabled ? `✓ ${optLabel}` : `+ ${optLabel}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {activeProject.optionalMethodologyFields.participants && (
                      <FieldBlock
                        label="Participants"
                        optionalLabel="Optional"
                        onRemoveOptional={() =>
                          updateProject((p) => ({
                            ...p,
                            optionalMethodologyFields: {
                              ...p.optionalMethodologyFields,
                              participants: false,
                            },
                          }))
                        }
                      >
                        <textarea
                          rows={2}
                          value={activeProject.participants}
                          onChange={(e) =>
                            updateProject(
                              (p) => ({ ...p, participants: e.target.value }),
                              'methodology'
                            )
                          }
                          placeholder="Ai tham gia hoặc đối tượng quan sát (VD: Cá nhân N=1)..."
                          className="w-full px-3 py-2 rounded-[7px] text-[13px] resize-y"
                          style={inputBaseStyle}
                        />
                      </FieldBlock>
                    )}

                    {activeProject.optionalMethodologyFields.variables && (
                      <FieldBlock
                        label="Variables"
                        optionalLabel="Optional"
                        onRemoveOptional={() =>
                          updateProject((p) => ({
                            ...p,
                            optionalMethodologyFields: {
                              ...p.optionalMethodologyFields,
                              variables: false,
                            },
                          }))
                        }
                      >
                        <textarea
                          rows={2}
                          value={activeProject.variables}
                          onChange={(e) =>
                            updateProject(
                              (p) => ({ ...p, variables: e.target.value }),
                              'methodology'
                            )
                          }
                          placeholder="Biến độc lập / biến phụ thuộc / điều kiện thay đổi..."
                          className="w-full px-3 py-2 rounded-[7px] text-[13px] resize-y"
                          style={inputBaseStyle}
                        />
                      </FieldBlock>
                    )}

                    {activeProject.optionalMethodologyFields.procedure && (
                      <FieldBlock
                        label="Procedure"
                        optionalLabel="Optional"
                        onRemoveOptional={() =>
                          updateProject((p) => ({
                            ...p,
                            optionalMethodologyFields: {
                              ...p.optionalMethodologyFields,
                              procedure: false,
                            },
                          }))
                        }
                      >
                        <textarea
                          rows={2}
                          value={activeProject.procedure}
                          onChange={(e) =>
                            updateProject(
                              (p) => ({ ...p, procedure: e.target.value }),
                              'methodology'
                            )
                          }
                          placeholder="Trình tự các bước thực hiện..."
                          className="w-full px-3 py-2 rounded-[7px] text-[13px] resize-y"
                          style={inputBaseStyle}
                        />
                      </FieldBlock>
                    )}
                  </div>
                </div>
              )}

              {activeMeta.key === 'evidence' && (
                <div className="space-y-5">
                  <FieldBlock label="Findings" hint="Những phát hiện quan trọng rút ra từ dữ liệu và tài liệu.">
                    <textarea
                      rows={3}
                      value={activeProject.findings}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, findings: e.target.value }), 'evidence')
                      }
                      placeholder="Phát hiện chính sau khi thu thập bằng chứng..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Evidence Notes" hint="Ghi chép chi tiết các bằng chứng ủng hộ hoặc làm rõ vấn đề.">
                    <textarea
                      rows={4}
                      value={activeProject.evidence}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, evidence: e.target.value }), 'evidence')
                      }
                      placeholder="Bằng chứng cụ thể từ tài liệu, ví dụ thực tế hoặc ghi nhận..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldBlock label="Data" hint="Số liệu, tần suất, hoặc dữ liệu thô thu được.">
                      <textarea
                        rows={3}
                        value={activeProject.evidenceData}
                        onChange={(e) =>
                          updateProject(
                            (p) => ({ ...p, evidenceData: e.target.value }),
                            'evidence'
                          )
                        }
                        placeholder="Ví dụ: 5/7 ngày hoàn thành phiên 15 phút..."
                        className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>

                    <FieldBlock label="Patterns" hint="Quy luật lặp đi lặp lại nhận thấy qua dữ liệu.">
                      <textarea
                        rows={3}
                        value={activeProject.patterns}
                        onChange={(e) =>
                          updateProject((p) => ({ ...p, patterns: e.target.value }), 'evidence')
                        }
                        placeholder="Mẫu hình hành vi / nhận thức xuất hiện nhiều lần..."
                        className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>
                  </div>

                  <FieldBlock label="Contradictory Evidence" hint="Bằng chứng mâu thuẫn hoặc ngoại lệ không khớp với giả thuyết.">
                    <textarea
                      rows={3}
                      value={activeProject.contradictoryEvidence}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, contradictoryEvidence: e.target.value }),
                          'evidence'
                        )
                      }
                      placeholder="Trường hợp nào kết quả đi ngược lại suy đoán ban đầu..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <InlineSectionSources
                    sectionKey="evidence"
                    project={activeProject}
                    sources={state.sources}
                    sourceLinks={state.sourceLinks}
                    onAddLink={(lnk) =>
                      setState((prev) => ({ ...prev, sourceLinks: [lnk, ...prev.sourceLinks] }))
                    }
                    onRemoveLink={(id) =>
                      setState((prev) => ({
                        ...prev,
                        sourceLinks: prev.sourceLinks.filter((l) => l.id !== id),
                      }))
                    }
                    onOpenSourceManager={() => selectAuxiliary('sources')}
                  />
                </div>
              )}

              {activeMeta.key === 'experiment' && (
                <div className="space-y-5">
                  <div
                    className="p-3.5 rounded-[9px] flex items-center justify-between gap-3 flex-wrap"
                    style={{
                      backgroundColor: '#13151B',
                      border: '1px solid rgba(217, 213, 203, 0.08)',
                    }}
                  >
                    <p className="text-[12.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                      Mục này dành cho thử nghiệm & quan sát thực tế. Có thể bỏ qua nếu nghiên cứu hoàn toàn dựa trên tài liệu.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        updateProject((p) => ({
                          ...p,
                          experimentNotApplicable: !p.experimentNotApplicable,
                        }))
                      }
                      className="px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium cursor-pointer"
                      style={{
                        backgroundColor: activeProject.experimentNotApplicable
                          ? 'rgba(167, 182, 210, 0.14)'
                          : '#101114',
                        color: activeProject.experimentNotApplicable
                          ? '#A7B6D2'
                          : 'var(--os-ivory-muted)',
                        border: '1px solid rgba(217, 213, 203, 0.12)',
                      }}
                    >
                      {activeProject.experimentNotApplicable
                        ? '✓ Đang ẩn (Nghiên cứu không dùng thử nghiệm)'
                        : 'Đánh dấu: Không cần thử nghiệm'}
                    </button>
                  </div>

                  {!activeProject.experimentNotApplicable && (
                    <>
                      <FieldBlock label="Experiment Design" hint="Bạn thay đổi điều kiện gì, trong bao lâu và đo lường thế nào?">
                        <textarea
                          rows={3}
                          value={activeProject.experimentDesign}
                          onChange={(e) =>
                            updateProject(
                              (p) => ({ ...p, experimentDesign: e.target.value }),
                              'experiment'
                            )
                          }
                          placeholder="Mô tả thiết kế thử nghiệm tự quan sát..."
                          className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                          style={inputBaseStyle}
                        />
                      </FieldBlock>

                      {/* Daily Logs */}
                      <div
                        className="p-4 rounded-[10px] space-y-3"
                        style={{
                          backgroundColor: '#13151B',
                          border: '1px solid rgba(217, 213, 203, 0.08)',
                        }}
                      >
                        <div>
                          <label className="text-[13.5px] font-medium block" style={{ color: 'var(--os-ivory-bright)' }}>
                            Daily Logs
                          </label>
                          <p className="text-[12px]" style={{ color: 'var(--os-ivory-faint)' }}>
                            Ghi nhanh quan sát từng ngày trong quá trình thử nghiệm.
                          </p>
                        </div>

                        <form onSubmit={addDailyLog} className="space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={dailyLogObs}
                              onChange={(e) => setDailyLogObs(e.target.value)}
                              placeholder="Quan sát hôm nay..."
                              className="md:col-span-2 px-3 py-2 rounded-[7px] text-[13px]"
                              style={inputBaseStyle}
                            />
                            <input
                              type="text"
                              value={dailyLogNote}
                              onChange={(e) => setDailyLogNote(e.target.value)}
                              placeholder="Ghi chú thêm (tùy chọn)..."
                              className="px-3 py-2 rounded-[7px] text-[12.5px]"
                              style={inputBaseStyle}
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer"
                              style={{
                                backgroundColor: 'rgba(185, 155, 121, 0.14)',
                                color: '#B99B79',
                                border: '1px solid rgba(185, 155, 121, 0.3)',
                              }}
                            >
                              + Thêm nhật ký ngày
                            </button>
                          </div>
                        </form>

                        {activeProject.experimentDailyLogs.length > 0 && (
                          <div className="space-y-2 pt-1">
                            {activeProject.experimentDailyLogs.map((log) => (
                              <div
                                key={log.id}
                                className="p-3 rounded-[8px] flex items-start justify-between gap-3"
                                style={{
                                  backgroundColor: '#101114',
                                  border: '1px solid rgba(217, 213, 203, 0.06)',
                                }}
                              >
                                <div className="space-y-0.5">
                                  <span className="metadata text-[10.5px]" style={{ color: '#B99B79' }}>
                                    {log.date}
                                  </span>
                                  <p className="text-[13px]" style={{ color: 'var(--os-ivory-bright)' }}>
                                    {log.observation}
                                  </p>
                                  {log.note && (
                                    <p className="text-[12px]" style={{ color: 'var(--os-ivory-muted)' }}>
                                      {log.note}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateProject((p) => ({
                                      ...p,
                                      experimentDailyLogs: p.experimentDailyLogs.filter(
                                        (x) => x.id !== log.id
                                      ),
                                    }))
                                  }
                                  className="text-[11px] hover:underline cursor-pointer shrink-0"
                                  style={{ color: 'var(--os-ivory-faint)' }}
                                >
                                  Xóa
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldBlock label="Observations" hint="Tổng hợp những gì thực sự diễn ra khi quan sát.">
                          <textarea
                            rows={3}
                            value={activeProject.experimentObservations}
                            onChange={(e) =>
                              updateProject(
                                (p) => ({ ...p, experimentObservations: e.target.value }),
                                'experiment'
                              )
                            }
                            className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                            style={inputBaseStyle}
                          />
                        </FieldBlock>

                        <FieldBlock label="Results" hint="Kết quả cuối cùng sau đợt thử nghiệm.">
                          <textarea
                            rows={3}
                            value={activeProject.experimentResults}
                            onChange={(e) =>
                              updateProject(
                                (p) => ({ ...p, experimentResults: e.target.value }),
                                'experiment'
                              )
                            }
                            className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                            style={inputBaseStyle}
                          />
                        </FieldBlock>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeMeta.key === 'discussion' && (
                <div className="space-y-5">
                  <FieldBlock label="Interpretation" hint="Ý nghĩa thực sự của các bằng chứng vừa tìm thấy là gì?">
                    <textarea
                      rows={4}
                      value={activeProject.interpretation}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, interpretation: e.target.value }),
                          'discussion'
                        )
                      }
                      placeholder="Diễn giải cơ chế đằng sau dữ liệu thu thập được..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Comparison" hint="Kết quả của bạn giống hoặc khác gì so với tài liệu đã đọc ở mục 05?">
                    <textarea
                      rows={3}
                      value={activeProject.comparison}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, comparison: e.target.value }), 'discussion')
                      }
                      placeholder="Đối chiếu giữa thực nghiệm cá nhân và nghiên cứu trước..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Counterarguments" hint="Nếu phản biện lại chính lập luận của mình, luận điểm mạnh nhất là gì?">
                    <textarea
                      rows={4}
                      value={activeProject.counterarguments}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, counterarguments: e.target.value }),
                          'discussion'
                        )
                      }
                      placeholder="Phản biện góc nhìn hiện tại để tránh thiên kiến xác nhận (confirmation bias)..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Alternative Explanations" hint="Còn cách giải thích nào khác cho cùng hiện tượng này không?">
                    <textarea
                      rows={3}
                      value={activeProject.alternativeExplanations}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, alternativeExplanations: e.target.value }),
                          'discussion'
                        )
                      }
                      placeholder="Các yếu tố nhiễu hoặc giả thuyết thay thế..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <InlineSectionSources
                    sectionKey="discussion"
                    project={activeProject}
                    sources={state.sources}
                    sourceLinks={state.sourceLinks}
                    onAddLink={(lnk) =>
                      setState((prev) => ({ ...prev, sourceLinks: [lnk, ...prev.sourceLinks] }))
                    }
                    onRemoveLink={(id) =>
                      setState((prev) => ({
                        ...prev,
                        sourceLinks: prev.sourceLinks.filter((l) => l.id !== id),
                      }))
                    }
                    onOpenSourceManager={() => selectAuxiliary('sources')}
                  />
                </div>
              )}

              {activeMeta.key === 'conclusion' && (
                <div className="space-y-5">
                  <FieldBlock label="Findings Summary" hint="Kết luận đúc kết trả lời cho câu hỏi nghiên cứu ở mục 03.">
                    <textarea
                      rows={4}
                      value={activeProject.conclusion}
                      onChange={(e) =>
                        updateProject((p) => ({ ...p, conclusion: e.target.value }), 'conclusion')
                      }
                      placeholder="Tóm tắt câu trả lời rút ra sau toàn bộ quá trình nghiên cứu..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Hypothesis Evaluation" hint="Giả thuyết ban đầu được ủng hộ, đúng một phần hay bị bác bỏ?">
                    <textarea
                      rows={3}
                      value={activeProject.hypothesisEvaluation}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, hypothesisEvaluation: e.target.value }),
                          'conclusion'
                        )
                      }
                      placeholder="Supported / Partially Supported / Refuted — và lý do..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldBlock label="Limitations" hint="Điểm yếu của cỡ mẫu, thời gian theo dõi hoặc phương pháp.">
                      <textarea
                        rows={3}
                        value={activeProject.limitations}
                        onChange={(e) =>
                          updateProject(
                            (p) => ({ ...p, limitations: e.target.value }),
                            'conclusion'
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>

                    <FieldBlock label="Future Questions" hint="Những câu hỏi mới nảy sinh cần tìm hiểu ở đề tài tiếp theo.">
                      <textarea
                        rows={3}
                        value={activeProject.futureQuestions}
                        onChange={(e) =>
                          updateProject(
                            (p) => ({ ...p, futureQuestions: e.target.value }),
                            'conclusion'
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>
                  </div>
                </div>
              )}

              {activeMeta.key === 'reflection' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldBlock label="Initial Belief" hint="Trước khi nghiên cứu, bạn từng tin điều gì?">
                      <textarea
                        rows={4}
                        value={activeProject.initialBelief}
                        onChange={(e) =>
                          updateProject(
                            (p) => ({ ...p, initialBelief: e.target.value }),
                            'reflection'
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>

                    <FieldBlock label="Current Belief" hint="Sau khi tìm hiểu và kiểm chứng, nhận thức hiện tại thay đổi ra sao?">
                      <textarea
                        rows={4}
                        value={activeProject.currentBelief}
                        onChange={(e) =>
                          updateProject(
                            (p) => ({ ...p, currentBelief: e.target.value }),
                            'reflection'
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                        style={inputBaseStyle}
                      />
                    </FieldBlock>
                  </div>

                  <FieldBlock label="Lessons Learned" hint="Bài học quan trọng nhất về tư duy hoặc cách đặt vấn đề.">
                    <textarea
                      rows={3}
                      value={activeProject.lessonsLearned}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, lessonsLearned: e.target.value }),
                          'reflection'
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>

                  <FieldBlock label="Personal Changes" hint="Thay đổi cụ thể trong hành vi hoặc thói quen sau nghiên cứu này.">
                    <textarea
                      rows={3}
                      value={activeProject.personalChanges}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, personalChanges: e.target.value }),
                          'reflection'
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>
                </div>
              )}

              {activeMeta.key === 'references' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="metadata text-[11px] uppercase tracking-[0.1em]" style={{ color: 'var(--os-ivory-faint)' }}>
                        Citation Format:
                      </span>
                      <div className="flex gap-1">
                        {CITATION_FORMATS.map((fmt) => {
                          const active = activeProject.citationFormat === fmt;
                          return (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() =>
                                updateProject(
                                  (p) => ({ ...p, citationFormat: fmt as CitationFormat }),
                                  'references'
                                )
                              }
                              className="px-2.5 py-1 rounded-[6px] text-[11.5px] cursor-pointer"
                              style={{
                                backgroundColor: active
                                  ? 'rgba(185, 155, 121, 0.16)'
                                  : '#16181E',
                                color: active ? '#B99B79' : 'var(--os-ivory-muted)',
                                border: active
                                  ? '1px solid rgba(185, 155, 121, 0.4)'
                                  : '1px solid rgba(217, 213, 203, 0.1)',
                              }}
                            >
                              {fmt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectAuxiliary('sources')}
                        className="px-3 py-1.5 rounded-[7px] text-[12px] cursor-pointer"
                        style={{
                          backgroundColor: '#16181E',
                          color: '#A7B6D2',
                          border: '1px solid rgba(167, 182, 210, 0.28)',
                        }}
                      >
                        Quản lý nguồn trong Source Manager ↗
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const text = projectSources
                            .map((s, i) => `[${i + 1}] ${formatSourceCitation(s, activeProject.citationFormat)}`)
                            .join('\n');
                          navigator.clipboard?.writeText(text || activeProject.referenceNotes);
                          showToast('Đã copy danh mục tài liệu tham khảo');
                        }}
                        className="px-3 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer"
                        style={{
                          backgroundColor: '#16181E',
                          color: '#EDEAE2',
                          border: '1px solid rgba(217, 213, 203, 0.12)',
                        }}
                      >
                        Copy Bibliography
                      </button>
                    </div>
                  </div>

                  {/* Structured References Table from Source Manager */}
                  <div
                    className="rounded-[10px] overflow-hidden"
                    style={{
                      backgroundColor: '#13151B',
                      border: '1px solid rgba(217, 213, 203, 0.08)',
                    }}
                  >
                    <div
                      className="px-4 py-2.5 border-b flex items-center justify-between"
                      style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}
                    >
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                        PAPERS · BOOKS · AUTHORS · DOI · URLS ({projectSources.length})
                      </span>
                      <span className="text-[11.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
                        Định dạng: {activeProject.citationFormat}
                      </span>
                    </div>

                    {projectSources.length === 0 ? (
                      <p className="p-4 text-[12.5px] italic" style={{ color: 'var(--os-ivory-faint)' }}>
                        Chưa có nguồn nào gắn với đề tài này. Thêm từ Source Manager hoặc ghi chú bên dưới.
                      </p>
                    ) : (
                      <div className="divide-y" style={{ borderColor: 'rgba(217, 213, 203, 0.06)' }}>
                        {projectSources.map((src, idx) => {
                          const linkedClaims = projectLinks.filter((l) => l.sourceId === src.id);
                          return (
                            <div key={src.id} className="p-4 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="metadata text-[11px]" style={{ color: '#B99B79' }}>
                                  [{idx + 1}]
                                </span>
                                <span
                                  className="metadata text-[9.5px] uppercase px-1.5 py-0.5 rounded-[4px]"
                                  style={{
                                    backgroundColor: 'rgba(217, 213, 203, 0.06)',
                                    color: 'var(--os-ivory-muted)',
                                  }}
                                >
                                  {src.category}
                                </span>
                                <span className="text-[12px]" style={{ color: 'var(--os-ivory-faint)' }}>
                                  Authors: {src.author || 'Unknown'}
                                </span>
                              </div>

                              <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory-bright)' }}>
                                {formatSourceCitation(src, activeProject.citationFormat)}
                              </p>

                              {src.doiOrUrl && (
                                <p className="metadata text-[11px] break-all" style={{ color: '#A7B6D2' }}>
                                  DOI / URL: {src.doiOrUrl}
                                </p>
                              )}

                              {linkedClaims.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {linkedClaims.map((c) => (
                                    <span
                                      key={c.id}
                                      className="text-[11px] px-2 py-0.5 rounded-[5px]"
                                      style={{
                                        backgroundColor: 'rgba(155, 170, 152, 0.1)',
                                        color: '#9BAA98',
                                      }}
                                    >
                                      Dùng ở [{c.section}]: {c.claimLabel}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <FieldBlock
                    label="Additional References / URLs"
                    hint="Danh sách bổ sung link, sách hoặc bài báo chưa kịp đưa vào Source Manager."
                  >
                    <textarea
                      rows={4}
                      value={activeProject.referenceNotes}
                      onChange={(e) =>
                        updateProject(
                          (p) => ({ ...p, referenceNotes: e.target.value }),
                          'references'
                        )
                      }
                      placeholder="URLs, DOI hoặc ghi chú nguồn tham khảo thêm..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] text-[13px] leading-relaxed resize-y"
                      style={inputBaseStyle}
                    />
                  </FieldBlock>
                </div>
              )}
            </div>

            {/* Bottom Non-Blocking Section Navigation */}
            <footer
              className="pt-5 border-t flex items-center justify-between gap-3 flex-wrap"
              style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}
            >
              <div>
                {prevMeta && (
                  <button
                    type="button"
                    onClick={() => selectCoreSection(prevMeta.key)}
                    className="px-3 py-1.5 rounded-[7px] text-[12.5px] cursor-pointer hover:bg-white/5"
                    style={{
                      color: 'var(--os-ivory-muted)',
                      border: '1px solid rgba(217, 213, 203, 0.1)',
                    }}
                  >
                    ← {prevMeta.code} · {prevMeta.shortLabel}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSaveSection(activeMeta.key)}
                  className="px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-medium cursor-pointer"
                  style={{
                    backgroundColor: '#171920',
                    color: '#9BAA98',
                    border: '1px solid rgba(155, 170, 152, 0.3)',
                  }}
                >
                  Save section
                </button>
                {nextMeta && (
                  <button
                    type="button"
                    onClick={() => selectCoreSection(nextMeta.key)}
                    className="px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium cursor-pointer hover:bg-white/5"
                    style={{
                      color: '#EDEAE2',
                      border: '1px solid rgba(185, 155, 121, 0.35)',
                    }}
                  >
                    {nextMeta.code} · {nextMeta.shortLabel} →
                  </button>
                )}
              </div>
            </footer>
          </>
        )}
      </section>

      {/* =====================================================================
          MODAL: NEW RESEARCH PROJECT
          ===================================================================== */}
      <Modal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        title="Tạo Research Project mới"
      >
        <form onSubmit={(e) => handleCreateProject(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium block" style={{ color: 'var(--os-ivory-bright)' }}>
              Tiêu đề nghiên cứu
            </label>
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ví dụ: Why Do I Struggle to Learn?"
              className="w-full px-3 py-2 rounded-[8px] text-[13.5px]"
              style={inputBaseStyle}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium block" style={{ color: 'var(--os-ivory-bright)' }}>
              Lĩnh vực (Domain)
            </label>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="PERSONAL PSYCHOLOGY"
              className="w-full px-3 py-2 rounded-[8px] text-[13px]"
              style={inputBaseStyle}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
            <button
              type="button"
              onClick={(e) => handleCreateProject(e, 'Why Do I Struggle to Learn?')}
              className="px-3 py-1.5 rounded-[7px] text-[12px] cursor-pointer"
              style={{
                backgroundColor: 'rgba(167, 182, 210, 0.12)',
                color: '#A7B6D2',
                border: '1px solid rgba(167, 182, 210, 0.28)',
              }}
            >
              Dùng mẫu “Why Do I Struggle to Learn?”
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[8px] text-[13px] font-semibold cursor-pointer"
              style={{ backgroundColor: '#B99B79', color: '#101114' }}
            >
              Tạo dự án (0 / 12 sections)
            </button>
          </div>
        </form>
      </Modal>

      {/* =====================================================================
          MODAL: QUICK RESEARCH NOTE CAPTURE
          ===================================================================== */}
      <Modal
        open={quickNoteOpen}
        onClose={() => setQuickNoteOpen(false)}
        title={`Ghi nhanh vào Research Notes (${activeMeta.code} · ${activeMeta.shortLabel})`}
      >
        <form onSubmit={handleSaveQuickNote} className="space-y-3.5">
          <input
            autoFocus
            type="text"
            value={quickNoteTitle}
            onChange={(e) => setQuickNoteTitle(e.target.value)}
            placeholder="Tiêu đề suy nghĩ hoặc câu hỏi thoáng qua..."
            className="w-full px-3 py-2 rounded-[8px] text-[13.5px]"
            style={inputBaseStyle}
          />
          <textarea
            rows={4}
            value={quickNoteBody}
            onChange={(e) => setQuickNoteBody(e.target.value)}
            placeholder="Viết nhanh ý tưởng để không bị ngắt mạch mục đang làm..."
            className="w-full px-3 py-2 rounded-[8px] text-[13.5px] leading-relaxed resize-y"
            style={inputBaseStyle}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-[8px] text-[13px] font-semibold cursor-pointer"
              style={{ backgroundColor: '#B99B79', color: '#101114' }}
            >
              Lưu vào Research Notes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
