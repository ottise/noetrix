import React, { useEffect, useMemo, useState } from 'react';
import { createId, getLocalDateStr } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { scheduleSourceCodeSave } from '../../lib/sourceStore';
import { Modal, useToast } from '../../components/ui/Primitives';
import {
  buildInitialOsKnowledgeBaseState,
  OS_COMPARISON_MATRICES,
  OS_MODULES,
  OS_TEXTBOOKS,
  type OsFlashcard,
  type OsKnowledgeBaseState,
  type OsLearningStatus,
  type OsResearchNote,
  type OsTopic,
  type OsUnderstandingLevel,
} from './osKnowledgeData';
import { OsKnowledgeGraphView, OsTopicDiagramSvg } from './OsKnowledgeGraph';

const OS_KB_STORAGE_KEY = 'noetrix_os_knowledge_base_v1';

const STATUS_STYLE: Record<
  OsLearningStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  not_started: {
    label: 'Not Started',
    color: 'rgba(217, 213, 203, 0.55)',
    bg: 'rgba(217, 213, 203, 0.06)',
    border: 'rgba(217, 213, 203, 0.14)',
  },
  learning: {
    label: 'Learning',
    color: '#B99B79',
    bg: 'rgba(185, 155, 121, 0.13)',
    border: 'rgba(185, 155, 121, 0.35)',
  },
  completed: {
    label: 'Completed',
    color: '#9BAA98',
    bg: 'rgba(155, 170, 152, 0.14)',
    border: 'rgba(155, 170, 152, 0.38)',
  },
};

function loadOsState(): OsKnowledgeBaseState {
  try {
    const raw = localStorage.getItem(OS_KB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OsKnowledgeBaseState>;
      const fallback = buildInitialOsKnowledgeBaseState();
      if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
        return {
          activeTab: parsed.activeTab || 'dashboard',
          activeModuleId: parsed.activeModuleId || fallback.activeModuleId,
          activeTopicId: parsed.activeTopicId || fallback.activeTopicId,
          topics: parsed.topics,
          flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : fallback.flashcards,
          researchNotes: Array.isArray(parsed.researchNotes)
            ? parsed.researchNotes
            : fallback.researchNotes,
          revisionLogs: Array.isArray(parsed.revisionLogs)
            ? parsed.revisionLogs
            : fallback.revisionLogs,
        };
      }
    }
  } catch {
    // ignore corrupt JSON
  }
  return buildInitialOsKnowledgeBaseState();
}

/**
 * Rich Theory Markdown Renderer supporting headings, fenced code blocks,
 * Markdown tables, formulas ($...$ / $$...$$), and inline bold/code.
 */
function OsTheoryMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];

  const renderInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\$[^$]+\$)/g);
    return parts.map((p, idx) => {
      if (p.startsWith('`') && p.endsWith('`') && p.length >= 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded-[4px] text-[12.5px] font-mono"
            style={{ backgroundColor: 'rgba(185, 155, 121, 0.14)', color: '#B99B79' }}
          >
            {p.slice(1, -1)}
          </code>
        );
      }
      if (p.startsWith('**') && p.endsWith('**') && p.length >= 4) {
        return (
          <strong key={idx} style={{ color: '#EDEAE2', fontWeight: 600 }}>
            {p.slice(2, -2)}
          </strong>
        );
      }
      if (p.startsWith('$') && p.endsWith('$') && p.length >= 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded-[4px] text-[12.5px] font-mono"
            style={{ backgroundColor: 'rgba(167, 182, 210, 0.12)', color: '#A7B6D2' }}
          >
            {p.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={idx}>{p}</React.Fragment>;
    });
  };

  let inCode = false;
  let codeLang = '';
  let codeBuf: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];

    if (ln.trim().startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLang = ln.trim().slice(3).trim();
        codeBuf = [];
      } else {
        inCode = false;
        blocks.push(
          <pre
            key={`code-${i}`}
            className="p-3.5 rounded-[9px] text-[12.5px] font-mono overflow-x-auto my-2"
            style={{
              backgroundColor: '#0C0D10',
              border: '1px solid rgba(217, 213, 203, 0.1)',
              color: '#EDEAE2',
            }}
          >
            {codeLang && (
              <span className="metadata text-[9.5px] uppercase block mb-1" style={{ color: 'var(--os-ivory-faint)' }}>
                {codeLang}
              </span>
            )}
            <code>{codeBuf.join('\n')}</code>
          </pre>
        );
      }
      continue;
    }

    if (inCode) {
      codeBuf.push(ln);
      continue;
    }

    if (ln.trim().startsWith('$$') && ln.trim().endsWith('$$') && ln.trim().length > 4) {
      blocks.push(
        <div
          key={`math-${i}`}
          className="my-2 px-4 py-2.5 rounded-[8px] font-mono text-[13px] overflow-x-auto"
          style={{
            backgroundColor: 'rgba(167, 182, 210, 0.08)',
            border: '1px solid rgba(167, 182, 210, 0.22)',
            color: '#A7B6D2',
          }}
        >
          {ln.trim().slice(2, -2)}
        </div>
      );
      continue;
    }

    if (ln.trim().startsWith('|') && ln.trim().endsWith('|')) {
      const tableRows: string[] = [ln];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        i++;
        tableRows.push(lines[i]);
      }
      const parsed = tableRows
        .filter((r) => !r.includes('---'))
        .map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

      if (parsed.length > 0) {
        blocks.push(
          <div
            key={`tbl-${i}`}
            className="overflow-x-auto my-3 rounded-[8px] border"
            style={{ borderColor: 'rgba(217, 213, 203, 0.1)' }}
          >
            <table className="w-full text-left text-[12.5px] border-collapse">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    backgroundColor: '#16181E',
                    borderColor: 'rgba(217, 213, 203, 0.1)',
                  }}
                >
                  {parsed[0].map((cell, ci) => (
                    <th key={ci} className="px-3 py-2 font-semibold" style={{ color: '#B99B79' }}>
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(217, 213, 203, 0.07)' }}>
                {parsed.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2" style={{ color: 'var(--os-ivory-muted)' }}>
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (ln.startsWith('### ')) {
      blocks.push(
        <h4 key={`h-${i}`} className="text-[15px] font-semibold pt-2" style={{ color: '#EDEAE2' }}>
          {ln.slice(4)}
        </h4>
      );
    } else if (ln.startsWith('## ')) {
      blocks.push(
        <h3 key={`h2-${i}`} className="font-editorial text-[19px] pt-2" style={{ color: '#EDEAE2' }}>
          {ln.slice(3)}
        </h3>
      );
    } else if (ln.trim().startsWith('- ') || /^\d+\.\s/.test(ln.trim())) {
      blocks.push(
        <p key={`li-${i}`} className="text-[13.5px] leading-relaxed pl-3" style={{ color: 'var(--os-ivory-muted)' }}>
          {renderInline(ln.trim())}
        </p>
      );
    } else if (ln.trim()) {
      blocks.push(
        <p key={`p-${i}`} className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
          {renderInline(ln)}
        </p>
      );
    }
  }

  return <div className="space-y-1.5">{blocks}</div>;
}

export function OperatingSystemsLab({
  initialTopicId,
  onConsumedInitialTopic,
}: {
  initialTopicId?: string | null;
  onConsumedInitialTopic?: () => void;
}) {
  const { showToast } = useToast();
  const [state, setState] = useState<OsKnowledgeBaseState>(() => loadOsState());

  useEffect(() => {
    if (!initialTopicId) return;
    const found = state.topics.find((t) => t.id === initialTopicId);
    if (found) {
      setExpandedModules((prev) => ({ ...prev, [found.moduleId]: true }));
      setState((prev) => ({
        ...prev,
        activeTab: 'curriculum',
        activeModuleId: found.moduleId,
        activeTopicId: found.id,
      }));
    }
    onConsumedInitialTopic?.();
  }, [initialTopicId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [curriculumFilter, setCurriculumFilter] = useState<
    'all' | 'bookmarked' | 'weak' | 'learning' | 'completed'
  >('all');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => ({
    [loadOsState().activeModuleId || 'os_m07']: true,
  }));

  // Topic sub-navigation grouping so all 14 components stay organized and readable
  const [topicGroup, setTopicGroup] = useState<
    'all' | 'core' | 'mechanism' | 'code_compare' | 'practice_refs'
  >('all');
  const [editingTheory, setEditingTheory] = useState(false);
  const [openInterviewIdx, setOpenInterviewIdx] = useState<number | null>(0);
  const [linkTargetId, setLinkTargetId] = useState('');

  // Flashcard state
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcFrontInput, setFcFrontInput] = useState('');
  const [fcBackInput, setFcBackInput] = useState('');
  const [fcModalOpen, setFcModalOpen] = useState(false);

  // Research Note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteQuestion, setNoteQuestion] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTopicId, setNoteTopicId] = useState('');

  // Custom Add Topic Modal
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSub, setNewTopicSub] = useState('');
  const [newTopicModule, setNewTopicModule] = useState('os_m01');

  // Auto-save state to localStorage + src/data/noetrix-store.json
  useEffect(() => {
    try {
      localStorage.setItem(OS_KB_STORAGE_KEY, JSON.stringify(state));
      scheduleSourceCodeSave();
    } catch {
      // ignore
    }
  }, [state]);

  const activeTopic =
    state.topics.find((t) => t.id === state.activeTopicId) || state.topics[0];
  const activeModule =
    OS_MODULES.find((m) => m.id === activeTopic.moduleId) || OS_MODULES[0];

  const openTopic = (topicId: string) => {
    const found = state.topics.find((t) => t.id === topicId);
    if (!found) return;
    triggerHaptic('selection');
    setExpandedModules((prev) => ({ ...prev, [found.moduleId]: true }));
    setEditingTheory(false);
    setOpenInterviewIdx(0);
    setState((prev) => ({
      ...prev,
      activeTab: 'curriculum',
      activeModuleId: found.moduleId,
      activeTopicId: found.id,
    }));
  };

  const updateActiveTopic = (updater: (curr: OsTopic) => OsTopic) => {
    setState((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id === activeTopic.id ? { ...updater(t), updatedAt: Date.now() } : t
      ),
    }));
  };

  const logRevision = (noteText: string, newStatus?: OsLearningStatus) => {
    const statusAfter = newStatus || activeTopic.status;
    setState((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id === activeTopic.id
          ? {
              ...t,
              status: statusAfter,
              lastReviewedAt: Date.now(),
              updatedAt: Date.now(),
            }
          : t
      ),
      revisionLogs: [
        {
          id: createId('osrev'),
          topicId: activeTopic.id,
          dateStr: getLocalDateStr(),
          timestamp: Date.now(),
          note: noteText,
          statusAfter,
        },
        ...prev.revisionLogs,
      ],
    }));
    showToast('Đã ghi vào Revision Log');
  };

  // Global search results across topics, definitions, detailedTheory & notes
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return state.topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.detailedTheory.toLowerCase().includes(q) ||
        t.coreConcepts.some((c) => c.toLowerCase().includes(q)) ||
        t.definitions.some(
          (d) => d.term.toLowerCase().includes(q) || d.meaning.toLowerCase().includes(q)
        )
    );
  }, [searchQuery, state.topics]);

  const completedTopics = state.topics.filter((t) => t.status === 'completed');
  const learningTopics = state.topics.filter((t) => t.status === 'learning');
  const bookmarkedTopics = state.topics.filter((t) => t.bookmarked);
  const weakTopics = state.topics.filter((t) => t.weakFlag);
  const recentTopics = [...state.topics].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  const filteredCurriculumTopics = useMemo(() => {
    return state.topics.filter((t) => {
      if (curriculumFilter === 'bookmarked') return t.bookmarked;
      if (curriculumFilter === 'weak') return t.weakFlag;
      if (curriculumFilter === 'learning') return t.status === 'learning';
      if (curriculumFilter === 'completed') return t.status === 'completed';
      return true;
    });
  }, [state.topics, curriculumFilter]);

  const handleCreateFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcFrontInput.trim() || !fcBackInput.trim()) return;
    const card: OsFlashcard = {
      id: createId('osfc'),
      topicId: activeTopic.id,
      front: fcFrontInput.trim(),
      back: fcBackInput.trim(),
      confidence: 'learning',
      createdAt: Date.now(),
    };
    setState((prev) => ({ ...prev, flashcards: [card, ...prev.flashcards] }));
    setFcFrontInput('');
    setFcBackInput('');
    setFcModalOpen(false);
    showToast('Đã thêm Flashcard mới');
  };

  const handleAddResearchNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;
    const now = Date.now();
    const note: OsResearchNote = {
      id: createId('osrn'),
      topicId: noteTopicId || undefined,
      title: noteTitle.trim() || 'Ghi chú nghiên cứu OS',
      question: noteQuestion.trim(),
      content: noteContent.trim(),
      tags: ['OS Research'],
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({ ...prev, researchNotes: [note, ...prev.researchNotes] }));
    setNoteTitle('');
    setNoteQuestion('');
    setNoteContent('');
    setNoteTopicId('');
    showToast('Đã lưu Research Note');
  };

  const handleAddCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const mod = OS_MODULES.find((m) => m.id === newTopicModule) || OS_MODULES[0];
    const modCount = state.topics.filter((t) => t.moduleId === mod.id).length + 1;
    const code = `${mod.code}.${String(modCount).padStart(2, '0')}`;
    const newTopic: OsTopic = {
      id: createId('ostop'),
      moduleId: mod.id,
      code,
      title: newTopicTitle.trim(),
      subtitle: newTopicSub.trim() || 'Custom OS Knowledge Base Topic',
      status: 'learning',
      understanding: 'surface',
      bookmarked: false,
      weakFlag: false,
      tags: ['Custom'],
      relatedTopicIds: [],
      updatedAt: Date.now(),
      overview: newTopicSub.trim() || 'Mô tả tổng quan chủ đề mới.',
      coreConcepts: ['Khái niệm 1', 'Khái niệm 2'],
      definitions: [{ term: newTopicTitle.trim(), meaning: 'Định nghĩa thuật ngữ cốt lõi...' }],
      detailedTheory: `### ${newTopicTitle.trim()}\nGhi chép lý thuyết chi tiết, bảng và công thức tại đây.`,
      howItWorks: ['Bước 1: Khởi tạo...', 'Bước 2: Điều phối bởi Kernel...'],
      diagram: {
        title: newTopicTitle.trim(),
        boxes: [
          { id: 'b1', x: 40, y: 55, w: 175, h: 64, label: 'Input / Syscall', accent: '#A7B6D2' },
          { id: 'b2', x: 265, y: 55, w: 195, h: 64, label: newTopicTitle.trim(), accent: '#B99B79' },
          { id: 'b3', x: 505, y: 55, w: 165, h: 64, label: 'Hardware / State', accent: '#9BAA98' },
        ],
        arrows: [
          { fromX: 215, fromY: 87, toX: 265, toY: 87 },
          { fromX: 460, fromY: 87, toX: 505, toY: 87 },
        ],
      },
      diagramNotes: 'Ghi chú sơ đồ kiến trúc...',
      algorithms: [],
      codeExample: { language: 'c', title: 'Ví dụ minh họa', code: '// Code minh họa\n' },
      comparisons: [],
      realWorldApplications: ['Linux / Backend Systems'],
      commonMistakes: [],
      interviewQuestions: [],
      exercises: [],
      references: [
        {
          label: 'Operating Systems: Three Easy Pieces (OSTEP)',
          source: 'Arpaci-Dusseau',
          url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      topics: [...prev.topics, newTopic],
      activeTab: 'curriculum',
      activeModuleId: mod.id,
      activeTopicId: newTopic.id,
    }));
    setExpandedModules((prev) => ({ ...prev, [mod.id]: true }));
    setNewTopicTitle('');
    setNewTopicSub('');
    setAddTopicOpen(false);
    showToast(`Đã tạo chủ đề ${code}`);
  };

  const showCore = topicGroup === 'all' || topicGroup === 'core';
  const showMech = topicGroup === 'all' || topicGroup === 'mechanism';
  const showCodeCmp = topicGroup === 'all' || topicGroup === 'code_compare';
  const showPracRefs = topicGroup === 'all' || topicGroup === 'practice_refs';

  const currentCard = state.flashcards[fcIndex % Math.max(1, state.flashcards.length)];

  return (
    <div className="space-y-6">
      {/* =====================================================================
          OS KNOWLEDGE BASE HEADER + STATS + GLOBAL SEARCH + SUB-NAV
          ===================================================================== */}
      <header
        className="rounded-[14px] p-5 sm:p-6 space-y-5"
        style={{
          backgroundColor: '#13151B',
          border: '1px solid rgba(217, 213, 203, 0.09)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="metadata text-[10.5px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                COMPUTER SCIENCE / CORE · KNOWLEDGE BASE
              </span>
              <span
                className="metadata text-[9.5px] px-2 py-0.5 rounded-[4px]"
                style={{ backgroundColor: 'rgba(155, 170, 152, 0.14)', color: '#9BAA98' }}
              >
                CROSS-LINKED SYSTEM
              </span>
            </div>
            <h2 className="font-editorial text-[30px] sm:text-[36px] leading-tight" style={{ color: '#EDEAE2' }}>
              Operating Systems
            </h2>
            <p className="text-[13.5px] max-w-2xl" style={{ color: 'var(--os-ivory-muted)' }}>
              Understanding how computers manage hardware, processes, memory, and resources — cấu trúc học tập liên kết chéo tái sử dụng cho Backend, Database và Distributed Systems.
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div>
              <p className="font-editorial text-[24px]" style={{ color: '#EDEAE2' }}>
                {OS_MODULES.length}
              </p>
              <p className="metadata text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--os-ivory-faint)' }}>
                Core modules
              </p>
            </div>
            <div className="w-[1px] h-8 bg-[rgba(217,213,203,0.1)]" />
            <div>
              <p className="font-editorial text-[24px]" style={{ color: '#B99B79' }}>
                {state.topics.length}+
              </p>
              <p className="metadata text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--os-ivory-faint)' }}>
                Topics
              </p>
            </div>
            <div className="w-[1px] h-8 bg-[rgba(217,213,203,0.1)]" />
            <div>
              <p className="font-editorial text-[24px]" style={{ color: '#A7B6D2' }}>
                ∞
              </p>
              <p className="metadata text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--os-ivory-faint)' }}>
                Research notes ({state.researchNotes.length})
              </p>
            </div>
          </div>
        </div>

        {/* Navigation + Full-Text Search Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
          <nav aria-label="OS Knowledge Base Tabs" className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                ['dashboard', 'Dashboard'],
                ['curriculum', 'Curriculum & Theory'],
                ['graph', 'Knowledge Graph'],
                ['comparisons', 'Comparison Tables'],
                ['flashcards', `Flashcards (${state.flashcards.length})`],
                ['notes', `Research Notes (${state.researchNotes.length})`],
                ['revisions', `Revision Log (${state.revisionLogs.length})`],
              ] as const
            ).map(([id, label]) => {
              const active = state.activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setState((prev) => ({ ...prev, activeTab: id }));
                  }}
                  className="px-3 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer transition-colors"
                  style={{
                    backgroundColor: active ? '#22252F' : '#101114',
                    color: active ? '#B99B79' : 'var(--os-ivory-muted)',
                    border: active
                      ? '1px solid rgba(185, 155, 121, 0.45)'
                      : '1px solid rgba(217, 213, 203, 0.08)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Full-text search box */}
          <div className="relative w-full xl:w-[320px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm khái niệm, syscall, page fault, mutex..."
              className="w-full px-3 py-1.5 rounded-[8px] text-[12.5px]"
              style={{
                backgroundColor: '#101114',
                color: '#EDEAE2',
                border: '1px solid rgba(217, 213, 203, 0.12)',
              }}
            />
            {searchQuery.trim() && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-[10px] p-2 max-h-[300px] overflow-y-auto shadow-2xl space-y-1"
                style={{
                  backgroundColor: '#16181F',
                  border: '1px solid rgba(185, 155, 121, 0.35)',
                }}
              >
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    Tìm thấy {searchResults.length} chủ đề
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] hover:underline cursor-pointer"
                    style={{ color: '#B99B79' }}
                  >
                    Đóng
                  </button>
                </div>
                {searchResults.slice(0, 10).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      openTopic(t.id);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-[7px] hover:bg-white/5 cursor-pointer"
                  >
                    <p className="text-[12.5px] font-medium" style={{ color: '#EDEAE2' }}>
                      <span className="metadata text-[10.5px] mr-2" style={{ color: '#B99B79' }}>
                        {t.code}
                      </span>
                      {t.title}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--os-ivory-faint)' }}>
                      {t.subtitle}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          TAB 1: MAIN DASHBOARD
          ===================================================================== */}
      {state.activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Continue Learning + Learning Management Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div
              className="lg:col-span-7 rounded-[12px] p-5 flex flex-col justify-between gap-4"
              style={{
                backgroundColor: '#14161C',
                border: '1px solid rgba(185, 155, 121, 0.28)',
              }}
            >
              <div className="space-y-2">
                <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                  CONTINUE LEARNING · {activeTopic.code}
                </span>
                <h3 className="font-editorial text-[24px]" style={{ color: '#EDEAE2' }}>
                  {activeTopic.title}
                </h3>
                <p className="text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                  {activeTopic.subtitle}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
                <span className="metadata text-[11px]" style={{ color: 'var(--os-ivory-faint)' }}>
                  Module {activeModule.code}: {activeModule.title} · {activeTopic.relatedTopicIds.length} cross-links
                </span>
                <button
                  type="button"
                  onClick={() => openTopic(activeTopic.id)}
                  className="px-4 py-2 rounded-[8px] text-[12.5px] font-semibold cursor-pointer"
                  style={{ backgroundColor: '#B99B79', color: '#101114' }}
                >
                  Mở Topic Workspace →
                </button>
              </div>
            </div>

            <div
              className="lg:col-span-5 rounded-[12px] p-5 space-y-4"
              style={{
                backgroundColor: '#14161C',
                border: '1px solid rgba(217, 213, 203, 0.08)',
              }}
            >
              <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#A7B6D2' }}>
                STUDY STATISTICS
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-[9px]" style={{ backgroundColor: '#101114' }}>
                  <p className="font-editorial text-[22px]" style={{ color: '#9BAA98' }}>
                    {completedTopics.length}
                  </p>
                  <p className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    Completed
                  </p>
                </div>
                <div className="p-3 rounded-[9px]" style={{ backgroundColor: '#101114' }}>
                  <p className="font-editorial text-[22px]" style={{ color: '#B99B79' }}>
                    {learningTopics.length}
                  </p>
                  <p className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    Learning
                  </p>
                </div>
                <div className="p-3 rounded-[9px]" style={{ backgroundColor: '#101114' }}>
                  <p className="font-editorial text-[22px]" style={{ color: '#EDEAE2' }}>
                    {state.topics.length - completedTopics.length - learningTopics.length}
                  </p>
                  <p className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    Not Started
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[12px] pt-1">
                <span style={{ color: 'var(--os-ivory-muted)' }}>
                  Bookmarked: <strong style={{ color: '#B99B79' }}>{bookmarkedTopics.length}</strong>
                </span>
                <span style={{ color: 'var(--os-ivory-muted)' }}>
                  Weak to revisit: <strong style={{ color: '#C98A82' }}>{weakTopics.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setAddTopicOpen(true)}
                  className="text-[11.5px] font-medium hover:underline cursor-pointer"
                  style={{ color: '#A7B6D2' }}
                >
                  + Thêm Topic
                </button>
              </div>
            </div>
          </div>

          {/* 12 Core Modules Grid */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="metadata text-[10.5px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                12 CORE CURRICULUM MODULES
              </p>
              <span className="text-[12px]" style={{ color: 'var(--os-ivory-faint)' }}>
                Chọn một chương để mở danh sách chủ đề & ghi chép 14 mục
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {OS_MODULES.map((mod) => {
                const modTopics = state.topics.filter((t) => t.moduleId === mod.id);
                const done = modTopics.filter((t) => t.status === 'completed').length;
                const firstTopic = modTopics[0];
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      if (firstTopic) openTopic(firstTopic.id);
                    }}
                    className="p-4 rounded-[11px] text-left flex flex-col justify-between gap-3 cursor-pointer transition-colors hover:bg-[#191C24]"
                    style={{
                      backgroundColor: '#14161C',
                      border: '1px solid rgba(217, 213, 203, 0.08)',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="metadata text-[11px]" style={{ color: mod.accent }}>
                          {mod.code}
                        </span>
                        <span className="metadata text-[10.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
                          {done}/{modTopics.length} topics
                        </span>
                      </div>
                      <h4 className="text-[14.5px] font-semibold mt-1" style={{ color: '#EDEAE2' }}>
                        {mod.title}
                      </h4>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                        {mod.description}
                      </p>
                    </div>
                    <span className="metadata text-[10.5px]" style={{ color: '#B99B79' }}>
                      Explore module →
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Recently Edited / Bookmarked / Weak + Textbooks */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div
              className="lg:col-span-6 rounded-[12px] p-4 space-y-3"
              style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
            >
              <p className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                RECENTLY EDITED & BOOKMARKED CONCEPTS
              </p>
              <div className="space-y-1.5">
                {recentTopics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openTopic(t.id)}
                    className="w-full px-3 py-2 rounded-[8px] flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-white/5"
                    style={{ backgroundColor: '#101114' }}
                  >
                    <div className="min-w-0">
                      <span className="metadata text-[10.5px] mr-2" style={{ color: '#B99B79' }}>
                        {t.code}
                      </span>
                      <span className="text-[13px] truncate" style={{ color: '#EDEAE2' }}>
                        {t.title}
                      </span>
                    </div>
                    <span className="metadata text-[10px] shrink-0" style={{ color: STATUS_STYLE[t.status].color }}>
                      {t.bookmarked ? '★ ' : ''}
                      {STATUS_STYLE[t.status].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div
              className="lg:col-span-6 rounded-[12px] p-4 space-y-3"
              style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
            >
              <p className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                CANONICAL OS TEXTBOOKS & REFERENCES
              </p>
              <div className="space-y-2.5">
                {OS_TEXTBOOKS.map((book) => (
                  <div
                    key={book.id}
                    className="p-3 rounded-[9px] space-y-1"
                    style={{ backgroundColor: '#101114', border: '1px solid rgba(217, 213, 203, 0.06)' }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[13.5px] font-medium" style={{ color: '#EDEAE2' }}>
                        {book.title}
                      </span>
                      <span
                        className="metadata text-[9.5px] uppercase px-2 py-0.5 rounded-[4px]"
                        style={{ backgroundColor: 'rgba(185, 155, 121, 0.14)', color: '#B99B79' }}
                      >
                        {book.role}
                      </span>
                    </div>
                    <p className="text-[11.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
                      {book.authors} — {book.note}
                    </p>
                    <a
                      href={book.url}
                      target="_blank"
                      rel="noreferrer"
                      className="metadata text-[11px] inline-block hover:underline"
                      style={{ color: '#A7B6D2' }}
                    >
                      Mở tài liệu ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: CURRICULUM EXPLORER + 14-COMPONENT TOPIC WORKSPACE
          ===================================================================== */}
      {state.activeTab === 'curriculum' && (
        <div
          className="rounded-[14px] overflow-hidden flex flex-col lg:flex-row min-h-[780px]"
          style={{
            backgroundColor: '#101114',
            border: '1px solid rgba(217, 213, 203, 0.09)',
          }}
        >
          {/* Left Curriculum Tree (12 Expandable Modules) */}
          <aside
            className="w-full lg:w-[305px] shrink-0 p-3.5 space-y-3 border-b lg:border-b-0 lg:border-r max-h-[340px] lg:max-h-[960px] overflow-y-auto"
            style={{
              backgroundColor: '#13151B',
              borderColor: 'rgba(217, 213, 203, 0.08)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                CURRICULUM EXPLORER
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewTopicModule(activeTopic.moduleId);
                  setAddTopicOpen(true);
                }}
                className="text-[11px] hover:underline cursor-pointer"
                style={{ color: '#A7B6D2' }}
              >
                + Add Topic
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ['all', 'All'],
                  ['learning', 'Learning'],
                  ['completed', 'Completed'],
                  ['bookmarked', '★'],
                  ['weak', 'Weak'],
                ] as const
              ).map(([fk, fl]) => (
                <button
                  key={fk}
                  type="button"
                  onClick={() => setCurriculumFilter(fk)}
                  className="px-2 py-0.5 rounded-[5px] text-[10.5px] cursor-pointer"
                  style={{
                    backgroundColor: curriculumFilter === fk ? '#232631' : 'transparent',
                    color: curriculumFilter === fk ? '#B99B79' : 'var(--os-ivory-faint)',
                    border:
                      curriculumFilter === fk
                        ? '1px solid rgba(185, 155, 121, 0.35)'
                        : '1px solid rgba(217, 213, 203, 0.08)',
                  }}
                >
                  {fl}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              {OS_MODULES.map((mod) => {
                const modTopics = filteredCurriculumTopics.filter((t) => t.moduleId === mod.id);
                if (modTopics.length === 0 && curriculumFilter !== 'all') return null;
                const isOpen = expandedModules[mod.id] || mod.id === activeTopic.moduleId;
                return (
                  <div
                    key={mod.id}
                    className="rounded-[8px] overflow-hidden"
                    style={{
                      backgroundColor: '#101114',
                      border: '1px solid rgba(217, 213, 203, 0.06)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedModules((prev) => ({ ...prev, [mod.id]: !isOpen }))
                      }
                      className="w-full px-2.5 py-2 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="metadata text-[10.5px] shrink-0" style={{ color: mod.accent }}>
                          {mod.code}
                        </span>
                        <span className="text-[12px] font-medium truncate" style={{ color: '#EDEAE2' }}>
                          {mod.title}
                        </span>
                      </div>
                      <span className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                        {isOpen ? '▾' : '▸'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-1.5 pb-1.5 space-y-0.5">
                        {modTopics.map((t) => {
                          const current = t.id === activeTopic.id;
                          const dotColor =
                            t.status === 'completed'
                              ? '#9BAA98'
                              : t.status === 'learning'
                              ? '#B99B79'
                              : 'rgba(217, 213, 203, 0.22)';
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => openTopic(t.id)}
                              className="w-full px-2 py-1.5 rounded-[6px] text-left flex items-center justify-between gap-2 cursor-pointer"
                              style={{
                                backgroundColor: current ? '#1E212B' : 'transparent',
                                border: current
                                  ? '1px solid rgba(185, 155, 121, 0.35)'
                                  : '1px solid transparent',
                              }}
                            >
                              <span
                                className="text-[12px] truncate"
                                style={{
                                  color: current ? '#EDEAE2' : 'var(--os-ivory-muted)',
                                  fontWeight: current ? 600 : 400,
                                }}
                              >
                                <span className="metadata text-[10px] mr-1.5" style={{ color: 'var(--os-ivory-faint)' }}>
                                  {t.code}
                                </span>
                                {t.title}
                              </span>
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: dotColor }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Topic Page (14 Structured Knowledge Components + Cross-Links) */}
          <section className="flex-1 min-w-0 p-5 sm:p-7 space-y-6">
            {/* Topic Header & Learning Controls */}
            <div
              className="pb-5 border-b space-y-4"
              style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="metadata text-[11px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                    {activeTopic.code} // {activeModule.title.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Status Selector */}
                  <div
                    className="flex rounded-[7px] overflow-hidden"
                    style={{ backgroundColor: '#16181E', border: '1px solid rgba(217, 213, 203, 0.1)' }}
                  >
                    {(['not_started', 'learning', 'completed'] as OsLearningStatus[]).map((st) => {
                      const active = activeTopic.status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => logRevision(`Chuyển trạng thái sang ${STATUS_STYLE[st].label}`, st)}
                          className="px-2.5 py-1 text-[11px] font-medium cursor-pointer"
                          style={{
                            backgroundColor: active ? STATUS_STYLE[st].bg : 'transparent',
                            color: active ? STATUS_STYLE[st].color : 'var(--os-ivory-faint)',
                          }}
                        >
                          {STATUS_STYLE[st].label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Understanding Level */}
                  <select
                    value={activeTopic.understanding}
                    onChange={(e) =>
                      updateActiveTopic((t) => ({
                        ...t,
                        understanding: e.target.value as OsUnderstandingLevel,
                      }))
                    }
                    title="Mức độ hiểu cá nhân"
                    className="px-2 py-1 rounded-[7px] text-[11px]"
                    style={{
                      backgroundColor: '#16181E',
                      color: '#A7B6D2',
                      border: '1px solid rgba(217, 213, 203, 0.1)',
                    }}
                  >
                    <option value="surface">Hiểu sơ bộ</option>
                    <option value="solid">Hiểu vững</option>
                    <option value="deep">Làm chủ sâu</option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      updateActiveTopic((t) => ({ ...t, bookmarked: !t.bookmarked }))
                    }
                    className="px-2.5 py-1 rounded-[7px] text-[11.5px] cursor-pointer"
                    style={{
                      backgroundColor: activeTopic.bookmarked ? 'rgba(185, 155, 121, 0.16)' : '#16181E',
                      color: activeTopic.bookmarked ? '#B99B79' : 'var(--os-ivory-muted)',
                      border: '1px solid rgba(217, 213, 203, 0.1)',
                    }}
                  >
                    {activeTopic.bookmarked ? '★ Important' : '☆ Bookmark'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateActiveTopic((t) => ({ ...t, weakFlag: !t.weakFlag }))
                    }
                    className="px-2.5 py-1 rounded-[7px] text-[11.5px] cursor-pointer"
                    style={{
                      backgroundColor: activeTopic.weakFlag ? 'rgba(201, 138, 130, 0.16)' : '#16181E',
                      color: activeTopic.weakFlag ? '#C98A82' : 'var(--os-ivory-muted)',
                      border: '1px solid rgba(217, 213, 203, 0.1)',
                    }}
                  >
                    {activeTopic.weakFlag ? '⚑ Cần ôn lại' : '⚐ Weak'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFcFrontInput(activeTopic.title);
                      setFcBackInput(activeTopic.overview);
                      setFcModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-[7px] text-[11.5px] cursor-pointer"
                    style={{
                      backgroundColor: '#16181E',
                      color: '#9BAA98',
                      border: '1px solid rgba(155, 170, 152, 0.25)',
                    }}
                  >
                    + Flashcard
                  </button>
                </div>
              </div>

              <div>
                <h2 className="font-editorial text-[28px] leading-tight" style={{ color: '#EDEAE2' }}>
                  {activeTopic.title}
                </h2>
                <p className="text-[13.5px] mt-1" style={{ color: 'var(--os-ivory-muted)' }}>
                  {activeTopic.subtitle}
                </p>
              </div>

              {/* Cross-Linked Concepts Strip */}
              <div
                className="p-3 rounded-[9px] flex items-center justify-between gap-3 flex-wrap"
                style={{
                  backgroundColor: '#14161C',
                  border: '1px solid rgba(217, 213, 203, 0.08)',
                }}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="metadata text-[10px] uppercase tracking-[0.1em] mr-1" style={{ color: '#A7B6D2' }}>
                    CONNECTED CONCEPTS:
                  </span>
                  {activeTopic.relatedTopicIds.map((rid) => {
                    const rel = state.topics.find((x) => x.id === rid);
                    if (!rel) return null;
                    return (
                      <button
                        key={rid}
                        type="button"
                        onClick={() => openTopic(rid)}
                        className="px-2 py-0.5 rounded-[5px] text-[11.5px] cursor-pointer hover:opacity-85"
                        style={{
                          backgroundColor: 'rgba(167, 182, 210, 0.12)',
                          color: '#A7B6D2',
                          border: '1px solid rgba(167, 182, 210, 0.25)',
                        }}
                      >
                        {rel.code} · {rel.title} ↗
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={linkTargetId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      if (!activeTopic.relatedTopicIds.includes(val)) {
                        updateActiveTopic((t) => ({
                          ...t,
                          relatedTopicIds: [...t.relatedTopicIds, val],
                        }));
                        showToast('Đã tạo liên kết khái niệm chéo');
                      }
                      setLinkTargetId('');
                    }}
                    className="px-2 py-1 rounded-[6px] text-[11px] max-w-[175px]"
                    style={{
                      backgroundColor: '#101114',
                      color: 'var(--os-ivory-muted)',
                      border: '1px solid rgba(217, 213, 203, 0.1)',
                    }}
                  >
                    <option value="">+ Liên kết chéo Topic...</option>
                    {state.topics
                      .filter(
                        (t) => t.id !== activeTopic.id && !activeTopic.relatedTopicIds.includes(t.id)
                      )
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code} · {t.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Section Focus Filter Pills (Clean organization of the 14 components) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    ['all', 'Tất cả 14 mục'],
                    ['core', '01–04 · Overview & Detailed Theory'],
                    ['mechanism', '05–07 · How It Works, Diagrams & Algorithms'],
                    ['code_compare', '08–10 · Code, Comparisons & Real-world'],
                    ['practice_refs', '11–14 · Mistakes, Interview, Exercises & Refs'],
                  ] as const
                ).map(([gk, gl]) => (
                  <button
                    key={gk}
                    type="button"
                    onClick={() => setTopicGroup(gk)}
                    className="px-2.5 py-1 rounded-[6px] text-[11.5px] cursor-pointer"
                    style={{
                      backgroundColor: topicGroup === gk ? 'rgba(185, 155, 121, 0.14)' : '#14161C',
                      color: topicGroup === gk ? '#B99B79' : 'var(--os-ivory-faint)',
                      border:
                        topicGroup === gk
                          ? '1px solid rgba(185, 155, 121, 0.35)'
                          : '1px solid rgba(217, 213, 203, 0.08)',
                    }}
                  >
                    {gl}
                  </button>
                ))}
              </div>
            </div>

            {/* 14 STRUCTURED TOPIC SECTIONS */}
            <div className="space-y-6">
              {showCore && (
                <>
                  {/* 01 Overview */}
                  <div className="space-y-2">
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                      01 // OVERVIEW
                    </span>
                    <textarea
                      rows={2}
                      value={activeTopic.overview}
                      onChange={(e) =>
                        updateActiveTopic((t) => ({ ...t, overview: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-[9px] text-[13.5px] leading-relaxed resize-y"
                      style={{
                        backgroundColor: '#14161C',
                        color: '#EDEAE2',
                        border: '1px solid rgba(217, 213, 203, 0.09)',
                      }}
                    />
                  </div>

                  {/* 02 Core Concepts & 03 Definitions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className="p-4 rounded-[10px] space-y-2.5"
                      style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                    >
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                        02 // CORE CONCEPTS
                      </span>
                      <ul className="space-y-1.5 text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                        {activeTopic.coreConcepts.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span style={{ color: '#B99B79' }}>•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className="p-4 rounded-[10px] space-y-2.5"
                      style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                    >
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#9BAA98' }}>
                        03 // DEFINITIONS & TERMINOLOGY
                      </span>
                      <div className="space-y-2">
                        {activeTopic.definitions.map((def, idx) => (
                          <div key={idx} className="text-[12.5px]">
                            <span className="font-semibold" style={{ color: '#EDEAE2' }}>
                              {def.term}:{' '}
                            </span>
                            <span style={{ color: 'var(--os-ivory-muted)' }}>{def.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 04 Detailed Theory (Markdown + Tables + Code + Formulas Editor) */}
                  <div
                    className="p-4 rounded-[10px] space-y-3"
                    style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.09)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                        04 // DETAILED THEORY (MARKDOWN · TABLES · CODE · FORMULAS)
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingTheory((v) => !v)}
                        className="px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium cursor-pointer"
                        style={{
                          backgroundColor: editingTheory ? '#B99B79' : '#101114',
                          color: editingTheory ? '#101114' : '#EDEAE2',
                          border: '1px solid rgba(217, 213, 203, 0.12)',
                        }}
                      >
                        {editingTheory ? '✓ Xem Preview' : 'Chỉnh sửa Theory'}
                      </button>
                    </div>

                    {editingTheory ? (
                      <textarea
                        rows={11}
                        value={activeTopic.detailedTheory}
                        onChange={(e) =>
                          updateActiveTopic((t) => ({ ...t, detailedTheory: e.target.value }))
                        }
                        className="w-full px-3.5 py-3 rounded-[8px] font-mono text-[12.5px] leading-relaxed resize-y"
                        style={{
                          backgroundColor: '#0E1014',
                          color: '#EDEAE2',
                          border: '1px solid rgba(185, 155, 121, 0.35)',
                        }}
                      />
                    ) : (
                      <OsTheoryMarkdown content={activeTopic.detailedTheory} />
                    )}
                  </div>
                </>
              )}

              {showMech && (
                <>
                  {/* 05 How It Works */}
                  <div
                    className="p-4 rounded-[10px] space-y-2.5"
                    style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                  >
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                      05 // HOW IT WORKS (STEP-BY-STEP MECHANISM)
                    </span>
                    <ol className="space-y-2">
                      {activeTopic.howItWorks.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                          <span className="metadata text-[11px] px-1.5 py-0.5 rounded-[4px]" style={{ backgroundColor: '#101114', color: '#B99B79' }}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* 06 Architecture & Diagrams */}
                  <div className="space-y-2">
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                      06 // ARCHITECTURE & DIAGRAMS
                    </span>
                    <OsTopicDiagramSvg diagram={activeTopic.diagram} />
                    <input
                      type="text"
                      value={activeTopic.diagramNotes}
                      onChange={(e) =>
                        updateActiveTopic((t) => ({ ...t, diagramNotes: e.target.value }))
                      }
                      placeholder="Ghi chú thêm về sơ đồ hoặc đường dẫn hình minh họa..."
                      className="w-full px-3 py-2 rounded-[8px] text-[12px]"
                      style={{
                        backgroundColor: '#14161C',
                        color: 'var(--os-ivory-muted)',
                        border: '1px solid rgba(217, 213, 203, 0.08)',
                      }}
                    />
                  </div>

                  {/* 07 Algorithms */}
                  <div
                    className="p-4 rounded-[10px] space-y-2.5"
                    style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                  >
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#9BAA98' }}>
                      07 // ALGORITHMS & DATA STRUCTURES
                    </span>
                    {activeTopic.algorithms.length === 0 ? (
                      <p className="text-[12.5px] italic" style={{ color: 'var(--os-ivory-faint)' }}>
                        Không có thuật toán tách rời — xem phần How It Works.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activeTopic.algorithms.map((alg, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            style={{ backgroundColor: '#101114' }}
                          >
                            <div>
                              <p className="text-[13.5px] font-semibold" style={{ color: '#EDEAE2' }}>
                                {alg.name}
                              </p>
                              <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
                                {alg.summary}
                              </p>
                            </div>
                            {alg.complexity && (
                              <span
                                className="metadata text-[10.5px] px-2 py-0.5 rounded-[4px] shrink-0"
                                style={{ backgroundColor: 'rgba(155, 170, 152, 0.12)', color: '#9BAA98' }}
                              >
                                {alg.complexity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {showCodeCmp && (
                <>
                  {/* 08 Code Examples */}
                  <div
                    className="p-4 rounded-[10px] space-y-2.5"
                    style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                        08 // CODE EXAMPLE · {activeTopic.codeExample.title}
                      </span>
                      <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-ivory-faint)' }}>
                        {activeTopic.codeExample.language}
                      </span>
                    </div>
                    <pre
                      className="p-3.5 rounded-[8px] font-mono text-[12.5px] overflow-x-auto leading-relaxed"
                      style={{
                        backgroundColor: '#0B0C0F',
                        color: '#EDEAE2',
                        border: '1px solid rgba(217, 213, 203, 0.08)',
                      }}
                    >
                      <code>{activeTopic.codeExample.code}</code>
                    </pre>
                  </div>

                  {/* 09 Comparisons */}
                  <div
                    className="p-4 rounded-[10px] space-y-2.5"
                    style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                        09 // COMPARISONS
                      </span>
                      <button
                        type="button"
                        onClick={() => setState((prev) => ({ ...prev, activeTab: 'comparisons' }))}
                        className="text-[11.5px] hover:underline cursor-pointer"
                        style={{ color: '#A7B6D2' }}
                      >
                        Mở bảng so sánh tổng hợp ↗
                      </button>
                    </div>
                    <div className="space-y-2">
                      {activeTopic.comparisons.map((cmp, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-[8px] text-[12.5px]"
                          style={{ backgroundColor: '#101114' }}
                        >
                          <div className="font-semibold" style={{ color: '#B99B79' }}>
                            {cmp.aspect}
                          </div>
                          <div style={{ color: 'var(--os-ivory-muted)' }}>{cmp.optionA}</div>
                          <div style={{ color: 'var(--os-ivory-muted)' }}>{cmp.optionB}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 10 Real-world Applications */}
                  <div
                    className="p-4 rounded-[10px] space-y-2"
                    style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                  >
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#9BAA98' }}>
                      10 // REAL-WORLD APPLICATIONS (BACKEND · DATABASES · CLOUD)
                    </span>
                    <ul className="space-y-1.5 text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                      {activeTopic.realWorldApplications.map((app, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span style={{ color: '#9BAA98' }}>→</span>
                          <span>{app}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {showPracRefs && (
                <>
                  {/* 11 Common Mistakes */}
                  <div
                    className="p-4 rounded-[10px] space-y-2"
                    style={{ backgroundColor: '#14161C', border: '1px solid rgba(201, 138, 130, 0.22)' }}
                  >
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#C98A82' }}>
                      11 // COMMON MISTAKES & MISCONCEPTIONS
                    </span>
                    <ul className="space-y-1.5 text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                      {activeTopic.commonMistakes.map((m, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span style={{ color: '#C98A82' }}>!</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 12 Interview Questions */}
                  <div
                    className="p-4 rounded-[10px] space-y-2.5"
                    style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                  >
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                      12 // INTERVIEW QUESTIONS
                    </span>
                    {activeTopic.interviewQuestions.map((qa, idx) => {
                      const open = openInterviewIdx === idx;
                      return (
                        <div
                          key={idx}
                          className="rounded-[8px] overflow-hidden"
                          style={{ backgroundColor: '#101114', border: '1px solid rgba(217, 213, 203, 0.07)' }}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenInterviewIdx(open ? null : idx)}
                            className="w-full p-3 text-left flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <span className="text-[13px] font-medium" style={{ color: '#EDEAE2' }}>
                              {qa.question}
                            </span>
                            <span className="metadata text-[10.5px]" style={{ color: '#B99B79' }}>
                              {open ? 'Ẩn đáp án' : 'Xem đáp án'}
                            </span>
                          </button>
                          {open && (
                            <p
                              className="px-3 pb-3 pt-1 text-[12.5px] leading-relaxed border-t"
                              style={{
                                color: 'var(--os-ivory-muted)',
                                borderColor: 'rgba(217, 213, 203, 0.06)',
                              }}
                            >
                              {qa.answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 13 Exercises & 14 References */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className="p-4 rounded-[10px] space-y-2.5"
                      style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                    >
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#9BAA98' }}>
                        13 // EXERCISES
                      </span>
                      {activeTopic.exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="p-3 rounded-[8px] space-y-1.5"
                          style={{ backgroundColor: '#101114' }}
                        >
                          <label className="flex items-start gap-2 cursor-pointer text-[12.5px]">
                            <input
                              type="checkbox"
                              checked={ex.done}
                              onChange={() =>
                                updateActiveTopic((t) => ({
                                  ...t,
                                  exercises: t.exercises.map((item) =>
                                    item.id === ex.id ? { ...item, done: !item.done } : item
                                  ),
                                }))
                              }
                              className="mt-1"
                            />
                            <span style={{ color: ex.done ? 'var(--os-ivory-faint)' : '#EDEAE2' }}>
                              {ex.prompt}
                            </span>
                          </label>
                          <p className="text-[11.5px] pl-5" style={{ color: '#A7B6D2' }}>
                            Gợi ý: {ex.solutionHint}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div
                      className="p-4 rounded-[10px] space-y-2.5"
                      style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                    >
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                        14 // REFERENCES
                      </span>
                      <div className="space-y-2">
                        {activeTopic.references.map((ref, idx) => (
                          <div key={idx} className="p-2.5 rounded-[8px]" style={{ backgroundColor: '#101114' }}>
                            <p className="text-[12.5px] font-medium" style={{ color: '#EDEAE2' }}>
                              {ref.label}
                            </p>
                            <p className="text-[11.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
                              {ref.source}
                            </p>
                            {ref.url && (
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noreferrer"
                                className="metadata text-[10.5px] hover:underline"
                                style={{ color: '#B99B79' }}
                              >
                                {ref.url} ↗
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          TAB 3: KNOWLEDGE GRAPH & CONCEPT MAP
          ===================================================================== */}
      {state.activeTab === 'graph' && (
        <OsKnowledgeGraphView
          topics={state.topics}
          activeTopicId={activeTopic.id}
          onSelectTopic={openTopic}
        />
      )}

      {/* =====================================================================
          TAB 4: COMPARISON TABLES
          ===================================================================== */}
      {state.activeTab === 'comparisons' && (
        <div className="space-y-5">
          <div>
            <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
              COMPARISON MATRICES
            </p>
            <h2 className="font-editorial text-[24px] mt-0.5" style={{ color: '#EDEAE2' }}>
              Đối chiếu các thuật toán và cơ chế Hệ Điều Hành
            </h2>
          </div>

          {OS_COMPARISON_MATRICES.map((tbl) => (
            <div
              key={tbl.id}
              className="rounded-[12px] overflow-hidden"
              style={{
                backgroundColor: '#14161C',
                border: '1px solid rgba(217, 213, 203, 0.09)',
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
                <h3 className="text-[15px] font-semibold" style={{ color: '#EDEAE2' }}>
                  {tbl.title}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px] border-collapse">
                  <thead>
                    <tr className="border-b" style={{ backgroundColor: '#101114', borderColor: 'rgba(217, 213, 203, 0.08)' }}>
                      <th className="px-4 py-2.5 font-medium" style={{ color: '#A7B6D2' }}>
                        Tiêu chí
                      </th>
                      {tbl.columns.map((c) => (
                        <th key={c} className="px-4 py-2.5 font-semibold" style={{ color: '#B99B79' }}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(217, 213, 203, 0.06)' }}>
                    {tbl.rows.map((row) => (
                      <tr key={row.criterion}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: '#EDEAE2' }}>
                          {row.criterion}
                        </td>
                        {row.items.map((cell, idx) => (
                          <td key={idx} className="px-4 py-2.5" style={{ color: 'var(--os-ivory-muted)' }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          TAB 5: FLASHCARDS
          ===================================================================== */}
      {state.activeTab === 'flashcards' && (
        <div className="space-y-5 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                ACTIVE RECALL FLASHCARDS
              </p>
              <h2 className="font-editorial text-[24px] mt-0.5" style={{ color: '#EDEAE2' }}>
                Ghi nhớ thuật ngữ & cơ chế OS ({state.flashcards.length} thẻ)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setFcModalOpen(true)}
              className="px-3.5 py-2 rounded-[8px] text-[12.5px] font-semibold cursor-pointer"
              style={{ backgroundColor: '#B99B79', color: '#101114' }}
            >
              + Tạo Flashcard
            </button>
          </div>

          {currentCard && (
            <div
              onClick={() => setFcFlipped((f) => !f)}
              className="p-6 sm:p-8 rounded-[14px] min-h-[220px] flex flex-col justify-between cursor-pointer select-none"
              style={{
                backgroundColor: '#14161C',
                border: '1px solid rgba(185, 155, 121, 0.35)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="metadata text-[10.5px]" style={{ color: '#B99B79' }}>
                  CARD {(fcIndex % state.flashcards.length) + 1} / {state.flashcards.length} ·{' '}
                  {fcFlipped ? 'ANSWER' : 'QUESTION (Nhấn để lật)'}
                </span>
                <span className="metadata text-[10px]" style={{ color: currentCard.confidence === 'mastered' ? '#9BAA98' : '#A7B6D2' }}>
                  {currentCard.confidence.toUpperCase()}
                </span>
              </div>

              <p className="text-[17px] leading-relaxed py-4" style={{ color: '#EDEAE2' }}>
                {fcFlipped ? currentCard.back : currentCard.front}
              </p>

              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    setFcIndex((i) => (i - 1 + state.flashcards.length) % state.flashcards.length);
                    setFcFlipped(false);
                  }}
                  className="px-3 py-1 rounded-[6px] text-[12px] cursor-pointer"
                  style={{ backgroundColor: '#101114', color: 'var(--os-ivory-muted)' }}
                >
                  ← Thẻ trước
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setState((prev) => ({
                        ...prev,
                        flashcards: prev.flashcards.map((c) =>
                          c.id === currentCard.id ? { ...c, confidence: 'mastered' } : c
                        ),
                      }));
                      setFcIndex((i) => (i + 1) % state.flashcards.length);
                      setFcFlipped(false);
                    }}
                    className="px-3 py-1 rounded-[6px] text-[12px] font-medium cursor-pointer"
                    style={{ backgroundColor: 'rgba(155, 170, 152, 0.16)', color: '#9BAA98' }}
                  >
                    ✓ Đã nắm vững
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFcIndex((i) => (i + 1) % state.flashcards.length);
                      setFcFlipped(false);
                    }}
                    className="px-3 py-1 rounded-[6px] text-[12px] cursor-pointer"
                    style={{ backgroundColor: '#101114', color: '#B99B79' }}
                  >
                    Thẻ tiếp →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 6: RESEARCH NOTES (∞)
          ===================================================================== */}
      {state.activeTab === 'notes' && (
        <div className="space-y-5">
          <div>
            <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
              OUT-OF-SYLLABUS RESEARCH NOTES
            </p>
            <h2 className="font-editorial text-[24px] mt-0.5" style={{ color: '#EDEAE2' }}>
              Nghiên cứu mở rộng & Liên hệ Backend / Database
            </h2>
          </div>

          <form
            onSubmit={handleAddResearchNote}
            className="p-4 rounded-[12px] space-y-3"
            style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.09)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Tiêu đề nghiên cứu (VD: Vì sao Kafka nhanh nhờ sendfile)..."
                className="md:col-span-2 px-3 py-2 rounded-[7px] text-[13px]"
                style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
              />
              <select
                value={noteTopicId}
                onChange={(e) => setNoteTopicId(e.target.value)}
                className="px-3 py-2 rounded-[7px] text-[12.5px]"
                style={{ backgroundColor: '#101114', color: 'var(--os-ivory-muted)', border: '1px solid rgba(217, 213, 203, 0.1)' }}
              >
                <option value="">Liên kết tới Topic (tùy chọn)...</option>
                {state.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} · {t.title}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={noteQuestion}
              onChange={(e) => setNoteQuestion(e.target.value)}
              placeholder="Câu hỏi đào sâu (What/Why)..."
              className="w-full px-3 py-2 rounded-[7px] text-[13px]"
              style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
            />
            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Ghi chú câu trả lời, benchmark hoặc dẫn chứng..."
              className="w-full px-3 py-2 rounded-[7px] text-[13px] resize-y"
              style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[7px] text-[12.5px] font-semibold cursor-pointer"
                style={{ backgroundColor: '#B99B79', color: '#101114' }}
              >
                Lưu Research Note
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {state.researchNotes.map((note) => {
              const linkedTopic = state.topics.find((t) => t.id === note.topicId);
              return (
                <article
                  key={note.id}
                  className="p-4 rounded-[11px] space-y-2"
                  style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="text-[15px] font-semibold" style={{ color: '#EDEAE2' }}>
                        {note.title}
                      </h3>
                      {note.question && (
                        <p className="text-[12.5px] mt-0.5" style={{ color: '#B99B79' }}>
                          Q: {note.question}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {linkedTopic && (
                        <button
                          type="button"
                          onClick={() => openTopic(linkedTopic.id)}
                          className="metadata text-[10.5px] px-2 py-0.5 rounded-[5px] cursor-pointer"
                          style={{ backgroundColor: 'rgba(167, 182, 210, 0.12)', color: '#A7B6D2' }}
                        >
                          {linkedTopic.code} · {linkedTopic.title} ↗
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            researchNotes: prev.researchNotes.filter((n) => n.id !== note.id),
                          }))
                        }
                        className="text-[11.5px] hover:underline cursor-pointer"
                        style={{ color: 'var(--os-ivory-faint)' }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--os-ivory-muted)' }}>
                    {note.content}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: REVISION LOG
          ===================================================================== */}
      {state.activeTab === 'revisions' && (
        <div className="space-y-5">
          <div>
            <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
              REVISION TRACKING
            </p>
            <h2 className="font-editorial text-[24px] mt-0.5" style={{ color: '#EDEAE2' }}>
              Nhật ký ôn tập & cập nhật kiến thức OS
            </h2>
          </div>

          <div className="space-y-2.5">
            {state.revisionLogs.map((rev) => {
              const t = state.topics.find((x) => x.id === rev.topicId);
              return (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-[10px] flex items-center justify-between gap-3 flex-wrap"
                  style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="metadata text-[11px]" style={{ color: '#B99B79' }}>
                        {rev.dateStr}
                      </span>
                      {t && (
                        <button
                          type="button"
                          onClick={() => openTopic(t.id)}
                          className="text-[12.5px] font-medium hover:underline cursor-pointer"
                          style={{ color: '#EDEAE2' }}
                        >
                          {t.code} · {t.title}
                        </button>
                      )}
                    </div>
                    <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
                      {rev.note}
                    </p>
                  </div>
                  <span
                    className="metadata text-[10px] px-2 py-0.5 rounded-[4px]"
                    style={{
                      backgroundColor: STATUS_STYLE[rev.statusAfter].bg,
                      color: STATUS_STYLE[rev.statusAfter].color,
                    }}
                  >
                    {STATUS_STYLE[rev.statusAfter].label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM TOPIC */}
      <Modal open={addTopicOpen} onClose={() => setAddTopicOpen(false)} title="Thêm Topic mới vào OS Knowledge Base">
        <form onSubmit={handleAddCustomTopic} className="space-y-3">
          <select
            value={newTopicModule}
            onChange={(e) => setNewTopicModule(e.target.value)}
            className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13px]"
          >
            {OS_MODULES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} · {m.title}
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            placeholder="Tên Topic (VD: io_uring Deep Dive, Linux Epoll vs Select)..."
            className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13.5px]"
          />
          <input
            type="text"
            value={newTopicSub}
            onChange={(e) => setNewTopicSub(e.target.value)}
            placeholder="Mô tả ngắn..."
            className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13px]"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-[8px] text-[13px] font-semibold cursor-pointer"
            style={{ backgroundColor: '#B99B79', color: '#101114' }}
          >
            Tạo Topic 14 mục
          </button>
        </form>
      </Modal>

      {/* MODAL: CREATE FLASHCARD */}
      <Modal open={fcModalOpen} onClose={() => setFcModalOpen(false)} title="Tạo Flashcard OS mới">
        <form onSubmit={handleCreateFlashcard} className="space-y-3">
          <textarea
            rows={2}
            required
            value={fcFrontInput}
            onChange={(e) => setFcFrontInput(e.target.value)}
            placeholder="Mặt trước (Câu hỏi / Thuật ngữ)..."
            className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13.5px]"
          />
          <textarea
            rows={3}
            required
            value={fcBackInput}
            onChange={(e) => setFcBackInput(e.target.value)}
            placeholder="Mặt sau (Giải thích cốt lõi)..."
            className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13.5px]"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-[8px] text-[13px] font-semibold cursor-pointer"
            style={{ backgroundColor: '#B99B79', color: '#101114' }}
          >
            Lưu Flashcard
          </button>
        </form>
      </Modal>
    </div>
  );
}
