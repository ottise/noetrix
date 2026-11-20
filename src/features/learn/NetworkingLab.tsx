import React, { useEffect, useMemo, useState } from 'react';
import { createId, getLocalDateStr } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import { scheduleSourceCodeSave } from '../../lib/sourceStore';
import { Modal, useToast } from '../../components/ui/Primitives';
import {
  buildInitialNetKnowledgeBaseState,
  NET_COMPARISON_MATRICES,
  NET_MODULES,
  NET_TEXTBOOKS,
  type NetFlashcard,
  type NetKnowledgeBaseState,
  type NetLearningStatus,
  type NetResearchNote,
  type NetTopic,
  type NetUnderstandingLevel,
} from './netKnowledgeData';
import {
  NetTopicDiagramSvg,
  PacketAndCommandLabView,
  TopologySimulatorView,
} from './NetResearchTools';

const NET_KB_STORAGE_KEY = 'noetrix_net_knowledge_base_v1';

const STATUS_STYLE: Record<
  NetLearningStatus,
  { label: string; color: string; bg: string }
> = {
  not_started: {
    label: 'Not Started',
    color: 'rgba(217, 213, 203, 0.55)',
    bg: 'rgba(217, 213, 203, 0.06)',
  },
  learning: {
    label: 'Learning',
    color: '#B99B79',
    bg: 'rgba(185, 155, 121, 0.14)',
  },
  completed: {
    label: 'Completed',
    color: '#9BAA98',
    bg: 'rgba(155, 170, 152, 0.14)',
  },
};

function loadNetState(): NetKnowledgeBaseState {
  try {
    const raw = localStorage.getItem(NET_KB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NetKnowledgeBaseState>;
      const fallback = buildInitialNetKnowledgeBaseState();
      if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
        return {
          activeTab: parsed.activeTab || 'dashboard',
          activeModuleId: parsed.activeModuleId || fallback.activeModuleId,
          activeTopicId: parsed.activeTopicId || fallback.activeTopicId,
          topics: parsed.topics,
          topologyNodes:
            Array.isArray(parsed.topologyNodes) && parsed.topologyNodes.length > 0
              ? parsed.topologyNodes
              : fallback.topologyNodes,
          topologyEdges: Array.isArray(parsed.topologyEdges)
            ? parsed.topologyEdges
            : fallback.topologyEdges,
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
  return buildInitialNetKnowledgeBaseState();
}

function NetTheoryMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const renderInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\$[^$]+\$)/g);
    return parts.map((p, idx) => {
      if (p.startsWith('`') && p.endsWith('`') && p.length >= 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded-[4px] text-[12.5px] font-mono"
            style={{ backgroundColor: 'rgba(167, 182, 210, 0.14)', color: '#A7B6D2' }}
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
            style={{ backgroundColor: 'rgba(185, 155, 121, 0.12)', color: '#B99B79' }}
          >
            {p.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={idx}>{p}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-1.5">
      {lines.map((ln, idx) => {
        if (ln.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-[15px] font-semibold pt-2" style={{ color: '#EDEAE2' }}>
              {ln.slice(4)}
            </h4>
          );
        }
        if (ln.trim().startsWith('$$') && ln.trim().endsWith('$$')) {
          return (
            <div
              key={idx}
              className="my-2 px-3.5 py-2 rounded-[8px] font-mono text-[12.5px]"
              style={{
                backgroundColor: 'rgba(167, 182, 210, 0.08)',
                border: '1px solid rgba(167, 182, 210, 0.22)',
                color: '#A7B6D2',
              }}
            >
              {ln.trim().slice(2, -2)}
            </div>
          );
        }
        if (ln.trim().startsWith('- ') || /^\d+\.\s/.test(ln.trim())) {
          return (
            <p key={idx} className="text-[13.5px] leading-relaxed pl-3" style={{ color: 'var(--os-ivory-muted)' }}>
              {renderInline(ln.trim())}
            </p>
          );
        }
        if (!ln.trim()) return null;
        return (
          <p key={idx} className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
            {renderInline(ln)}
          </p>
        );
      })}
    </div>
  );
}

export function NetworkingLab({
  onJumpToOsTopic,
}: {
  onJumpToOsTopic?: (osTopicId: string) => void;
}) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [state, setState] = useState<NetKnowledgeBaseState>(() => loadNetState());
  const [searchQuery, setSearchQuery] = useState('');
  const [curriculumFilter, setCurriculumFilter] = useState<
    'all' | 'bookmarked' | 'weak' | 'learning' | 'completed'
  >('all');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => ({
    [loadNetState().activeModuleId || 'net_m06']: true,
  }));
  const [topicGroup, setTopicGroup] = useState<
    'all' | 'foundation' | 'specs_packets' | 'ops_sec' | 'practice_refs'
  >('all');
  const [editingTheory, setEditingTheory] = useState(false);
  const [openInterviewIdx, setOpenInterviewIdx] = useState<number | null>(0);
  const [linkTargetId, setLinkTargetId] = useState('');

  // Flashcards & Notes & Custom Topic states
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcModalOpen, setFcModalOpen] = useState(false);
  const [fcFrontInput, setFcFrontInput] = useState('');
  const [fcBackInput, setFcBackInput] = useState('');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteQuestion, setNoteQuestion] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTopicId, setNoteTopicId] = useState('');

  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSub, setNewTopicSub] = useState('');
  const [newTopicModule, setNewTopicModule] = useState('net_m01');

  useEffect(() => {
    try {
      localStorage.setItem(NET_KB_STORAGE_KEY, JSON.stringify(state));
      scheduleSourceCodeSave();
    } catch {
      // ignore
    }
  }, [state]);

  const activeTopic =
    state.topics.find((t) => t.id === state.activeTopicId) || state.topics[0];
  const activeModule =
    NET_MODULES.find((m) => m.id === activeTopic.moduleId) || NET_MODULES[0];

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

  const updateActiveTopic = (updater: (curr: NetTopic) => NetTopic) => {
    setState((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id === activeTopic.id ? { ...updater(t), updatedAt: Date.now() } : t
      ),
    }));
  };

  const logRevision = (noteText: string, statusAfter?: NetLearningStatus) => {
    const nextStatus = statusAfter || activeTopic.status;
    setState((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id === activeTopic.id ? { ...t, status: nextStatus, updatedAt: Date.now() } : t
      ),
      revisionLogs: [
        {
          id: createId('netrev'),
          topicId: activeTopic.id,
          dateStr: getLocalDateStr(),
          timestamp: Date.now(),
          note: noteText,
          statusAfter: nextStatus,
        },
        ...prev.revisionLogs,
      ],
    }));
    showToast('Đã ghi nhận tiến độ & Revision Log');
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return state.topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.detailedTheory.toLowerCase().includes(q) ||
        t.protocolSpecs.portsOrProto.toLowerCase().includes(q) ||
        t.coreConcepts.some((c) => c.toLowerCase().includes(q))
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
    const card: NetFlashcard = {
      id: createId('netfc'),
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
    showToast('Đã lưu Flashcard Networking');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;
    const now = Date.now();
    const note: NetResearchNote = {
      id: createId('netrn'),
      topicId: noteTopicId || undefined,
      title: noteTitle.trim() || 'Ghi chú Networking',
      question: noteQuestion.trim(),
      content: noteContent.trim(),
      tags: ['Networking'],
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

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const mod = NET_MODULES.find((m) => m.id === newTopicModule) || NET_MODULES[0];
    const modCount = state.topics.filter((t) => t.moduleId === mod.id).length + 1;
    const code = `${mod.code}.${String(modCount).padStart(2, '0')}`;
    const newTopic: NetTopic = {
      id: createId('nettop'),
      moduleId: mod.id,
      code,
      title: newTopicTitle.trim(),
      subtitle: newTopicSub.trim() || 'Custom Networking Topic',
      status: 'learning',
      understanding: 'surface',
      bookmarked: false,
      weakFlag: false,
      tags: ['Custom'],
      relatedTopicIds: [],
      crossSystemLinks: [],
      updatedAt: Date.now(),
      overview: newTopicSub.trim() || 'Tổng quan chủ đề mạng mới.',
      coreConcepts: ['Khái niệm chính 1', 'Khái niệm chính 2'],
      definitions: [{ term: newTopicTitle.trim(), meaning: 'Định nghĩa giao thức/thuật ngữ...' }],
      detailedTheory: `### ${newTopicTitle.trim()}\nGhi chép lý thuyết chi tiết tại đây.`,
      howItWorks: ['Bước 1: Khởi tạo...', 'Bước 2: Truyền nhận gói tin...'],
      protocolSpecs: {
        rfcOrStandard: 'Custom / RFC',
        layer: mod.title,
        portsOrProto: 'TCP / UDP',
        keyFields: 'Header fields...',
      },
      diagram: {
        title: newTopicTitle.trim(),
        boxes: [
          { id: 'b1', x: 35, y: 55, w: 175, h: 64, label: 'Client / Node', accent: '#A7B6D2' },
          { id: 'b2', x: 265, y: 55, w: 185, h: 64, label: newTopicTitle.trim(), accent: '#B99B79' },
          { id: 'b3', x: 500, y: 55, w: 175, h: 64, label: 'Peer / Server', accent: '#9BAA98' },
        ],
        arrows: [
          { fromX: 210, fromY: 87, toX: 265, toY: 87 },
          { fromX: 450, fromY: 87, toX: 500, toY: 87 },
        ],
      },
      packetAnalysis: {
        frameSummary: 'Custom packet breakdown notes',
        layers: [{ layerName: 'L4/L7', detail: 'Ghi chú chi tiết header/flags...' }],
      },
      codeAndCommands: { language: 'bash', title: 'CLI Inspection', snippet: 'ss -tulnp' },
      comparisons: [],
      realWorldApplications: ['Backend / Distributed Systems'],
      troubleshooting: ['Kiểm tra route, port và firewall rules.'],
      securityConsiderations: ['Xác thực & mã hóa kênh truyền.'],
      interviewQuestions: [],
      exercises: [],
      references: [
        {
          label: 'Computer Networking: A Top-Down Approach (8th Ed.)',
          source: 'Kurose & Ross',
          url: 'https://gaia.cs.umass.edu/kurose_ross/index.php',
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

  const showFoundation = topicGroup === 'all' || topicGroup === 'foundation';
  const showSpecsPackets = topicGroup === 'all' || topicGroup === 'specs_packets';
  const showOpsSec = topicGroup === 'all' || topicGroup === 'ops_sec';
  const showPracticeRefs = topicGroup === 'all' || topicGroup === 'practice_refs';

  const currentCard = state.flashcards[fcIndex % Math.max(1, state.flashcards.length)];

  return (
    <div className="space-y-6">
      {/* =====================================================================
          NETWORKING KNOWLEDGE BASE HEADER + METRICS + NAVIGATION + SEARCH
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
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="metadata text-[10.5px] uppercase tracking-[0.14em]" style={{ color: '#A7B6D2' }}>
                COMPUTER SCIENCE / CORE · NETWORK ENGINEERING
              </span>
              <span
                className="metadata text-[9.5px] px-2 py-0.5 rounded-[4px]"
                style={{ backgroundColor: 'rgba(185, 155, 121, 0.14)', color: '#B99B79' }}
              >
                OS ↔ NETWORKING ↔ BACKEND ↔ DISTRIBUTED
              </span>
            </div>
            <h2 className="font-editorial text-[30px] sm:text-[36px] leading-tight" style={{ color: '#EDEAE2' }}>
              {t('Computer Networking', 'Mạng Máy Tính (Networking)')}
            </h2>
            <p className="text-[13.5px] max-w-2xl" style={{ color: 'var(--os-ivory-muted)' }}>
              {t(
                'Understanding how devices communicate, exchange data, and build interconnected systems — foundations for Backend APIs, Cloud VPC, Kubernetes, and Security.',
                'Hiểu cách thiết bị giao tiếp, trao đổi dữ liệu và xây dựng hệ thống kết nối — nền tảng cho Backend API, Cloud VPC, Kubernetes và Bảo mật.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div>
              <p className="font-editorial text-[24px]" style={{ color: '#EDEAE2' }}>
                {NET_MODULES.length}
              </p>
              <p className="metadata text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--os-ivory-faint)' }}>
                {t('Core modules', 'Chương cốt lõi')}
              </p>
            </div>
            <div className="w-[1px] h-8 bg-[rgba(217,213,203,0.1)]" />
            <div>
              <p className="font-editorial text-[24px]" style={{ color: '#A7B6D2' }}>
                {state.topics.length}+
              </p>
              <p className="metadata text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--os-ivory-faint)' }}>
                {t('Topics', 'Chủ đề')}
              </p>
            </div>
            <div className="w-[1px] h-8 bg-[rgba(217,213,203,0.1)]" />
            <div>
              <p className="font-editorial text-[24px]" style={{ color: '#B99B79' }}>
                ∞
              </p>
              <p className="metadata text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--os-ivory-faint)' }}>
                {t(`Research notes (${state.researchNotes.length})`, `Ghi chú nghiên cứu (${state.researchNotes.length})`)}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation + Full-Text Search */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
          <nav aria-label="Networking Knowledge Base Tabs" className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                ['dashboard', t('Dashboard', 'Tổng quan')],
                ['curriculum', t('Curriculum & Theory', 'Giáo trình & Lý thuyết')],
                ['packets_cli', t('Packet & Command Lab', 'Phân tích Gói tin & Lệnh')],
                ['topology', t('Topology Simulator', 'Mô phỏng Topology')],
                ['comparisons', t('Comparison Tables', 'Bảng so sánh')],
                ['flashcards', `Flashcards (${state.flashcards.length})`],
                ['notes', t(`Notes & Revisions (${state.researchNotes.length})`, `Ghi chú & Ôn tập (${state.researchNotes.length})`)],
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
                    color: active ? '#A7B6D2' : 'var(--os-ivory-muted)',
                    border: active
                      ? '1px solid rgba(167, 182, 210, 0.45)'
                      : '1px solid rgba(217, 213, 203, 0.08)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="relative w-full xl:w-[320px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm TCP, BGP, CIDR, QUIC, epoll, VXLAN..."
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
                  border: '1px solid rgba(167, 182, 210, 0.35)',
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
                    style={{ color: '#A7B6D2' }}
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
                      <span className="metadata text-[10.5px] mr-2" style={{ color: '#A7B6D2' }}>
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
          TAB 1: MAIN DASHBOARD + CROSS-DISCIPLINE KNOWLEDGE CONNECTIONS
          ===================================================================== */}
      {state.activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div
              className="lg:col-span-7 rounded-[12px] p-5 flex flex-col justify-between gap-4"
              style={{
                backgroundColor: '#14161C',
                border: '1px solid rgba(167, 182, 210, 0.3)',
              }}
            >
              <div className="space-y-2">
                <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#A7B6D2' }}>
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
                  Module {activeModule.code}: {activeModule.title}
                </span>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => openTopic(activeTopic.id)}
                  className="px-4 py-2 rounded-[8px] text-[12.5px] font-semibold cursor-pointer"
                  style={{ backgroundColor: '#A7B6D2', color: '#101114' }}
                >
                  Mở Topic Workspace →
                </button>
                <button
                  type="button"
                  onClick={() => setAddTopicOpen(true)}
                  className="px-3.5 py-2 rounded-[8px] text-[12px] font-medium cursor-pointer border border-[#2a3140] text-[#A7B6D2] hover:bg-[#1a1f29]"
                >
                  + Thêm Topic
                </button>
              </div>
            </div>
            </div>
          </div>

          {/* Knowledge Connections Bridge (Section 6 of User Spec) */}
          <section
            className="rounded-[12px] p-5 space-y-3"
            style={{
              backgroundColor: '#12141A',
              border: '1px solid rgba(185, 155, 121, 0.28)',
            }}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                  COMPUTER SCIENCE KNOWLEDGE CONNECTIONS
                </p>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
                  Không học tách rời: kết nối thẳng Networking với Operating Systems, Backend Engineering và Distributed Systems.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  title: 'Operating Systems',
                  items: 'Process · Thread · Memory · Socket FD · epoll',
                  accent: '#9BAA98',
                  actionLabel: 'Mở Socket & File Descriptors trong OS ↗',
                  onClick: () => onJumpToOsTopic?.('os_08_01'),
                },
                {
                  title: 'Computer Networking',
                  items: 'TCP/IP · DNS · HTTP/3 · Routing · Packets',
                  accent: '#A7B6D2',
                  actionLabel: 'Mở TCP Three-Way Handshake ↗',
                  onClick: () => openTopic('net_06_03'),
                },
                {
                  title: 'Backend Engineering',
                  items: 'REST API · WebSocket · DB Pool · Auth & TLS',
                  accent: '#B99B79',
                  actionLabel: 'Mở Reverse Proxy & API Tuning ↗',
                  onClick: () => openTopic('net_08_04'),
                },
                {
                  title: 'Distributed Systems',
                  items: 'Load Balancing · Service Discovery · K8s CNI',
                  accent: '#EDEAE2',
                  actionLabel: 'Mở Cloud VPC & Service Discovery ↗',
                  onClick: () => openTopic('net_14_03'),
                },
              ].map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={card.onClick}
                  className="p-3.5 rounded-[10px] text-left flex flex-col justify-between gap-2.5 cursor-pointer hover:bg-white/5"
                  style={{
                    backgroundColor: '#16181F',
                    border: '1px solid rgba(217, 213, 203, 0.08)',
                  }}
                >
                  <div>
                    <p className="text-[13.5px] font-semibold" style={{ color: card.accent }}>
                      {card.title}
                    </p>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--os-ivory-muted)' }}>
                      {card.items}
                    </p>
                  </div>
                  <span className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    {card.actionLabel}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* 14 Core Curriculum Modules Grid */}
          <section className="space-y-3">
            <p className="metadata text-[10.5px] uppercase tracking-[0.14em]" style={{ color: '#A7B6D2' }}>
              14 CORE CURRICULUM MODULES
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {NET_MODULES.map((mod) => {
                const modTopics = state.topics.filter((t) => t.moduleId === mod.id);
                const done = modTopics.filter((t) => t.status === 'completed').length;
                const firstTopic = modTopics[0];
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => firstTopic && openTopic(firstTopic.id)}
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
                    <span className="metadata text-[10.5px]" style={{ color: '#A7B6D2' }}>
                      Explore module →
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Recently Edited + Canonical Textbooks */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div
              className="lg:col-span-6 rounded-[12px] p-4 space-y-3"
              style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
            >
              <p className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                RECENTLY EDITED & BOOKMARKED PROTOCOLS
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
                      <span className="metadata text-[10.5px] mr-2" style={{ color: '#A7B6D2' }}>
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
              <p className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                CANONICAL NETWORKING TEXTBOOKS
              </p>
              <div className="space-y-2.5">
                {NET_TEXTBOOKS.map((book) => (
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
                        style={{ backgroundColor: 'rgba(167, 182, 210, 0.14)', color: '#A7B6D2' }}
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
                      style={{ color: '#B99B79' }}
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
          TAB 2: CURRICULUM EXPLORER + 16-COMPONENT TOPIC PAGE
          ===================================================================== */}
      {state.activeTab === 'curriculum' && (
        <div
          className="rounded-[14px] overflow-hidden flex flex-col lg:flex-row min-h-[780px]"
          style={{
            backgroundColor: '#101114',
            border: '1px solid rgba(217, 213, 203, 0.09)',
          }}
        >
          {/* Left 14-Module Expandable Tree */}
          <aside
            className="w-full lg:w-[305px] shrink-0 p-3.5 space-y-3 border-b lg:border-b-0 lg:border-r max-h-[340px] lg:max-h-[980px] overflow-y-auto"
            style={{
              backgroundColor: '#13151B',
              borderColor: 'rgba(217, 213, 203, 0.08)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                14 MODULES EXPLORER
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewTopicModule(activeTopic.moduleId);
                  setAddTopicOpen(true);
                }}
                className="text-[11px] hover:underline cursor-pointer"
                style={{ color: '#B99B79' }}
              >
                + Add Topic
              </button>
            </div>

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
                    color: curriculumFilter === fk ? '#A7B6D2' : 'var(--os-ivory-faint)',
                    border:
                      curriculumFilter === fk
                        ? '1px solid rgba(167, 182, 210, 0.35)'
                        : '1px solid rgba(217, 213, 203, 0.08)',
                  }}
                >
                  {fl}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              {NET_MODULES.map((mod) => {
                const modTopics = filteredCurriculumTopics.filter((t) => t.moduleId === mod.id);
                if (modTopics.length === 0 && curriculumFilter !== 'all') return null;
                const isOpen = expandedModules[mod.id] || mod.id === activeTopic.moduleId;
                return (
                  <div
                    key={mod.id}
                    className="rounded-[8px] overflow-hidden"
                    style={{ backgroundColor: '#101114', border: '1px solid rgba(217, 213, 203, 0.06)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedModules((prev) => ({ ...prev, [mod.id]: !isOpen }))}
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
                                  ? '1px solid rgba(167, 182, 210, 0.4)'
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
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
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

          {/* Right 16-Component Topic Page */}
          <section className="flex-1 min-w-0 p-5 sm:p-7 space-y-6">
            <div className="pb-5 border-b space-y-4" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="metadata text-[11px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                  {activeTopic.code} // {activeModule.title.toUpperCase()}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <div
                    className="flex rounded-[7px] overflow-hidden"
                    style={{ backgroundColor: '#16181E', border: '1px solid rgba(217, 213, 203, 0.1)' }}
                  >
                    {(['not_started', 'learning', 'completed'] as NetLearningStatus[]).map((st) => {
                      const active = activeTopic.status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => logRevision(`Cập nhật sang ${STATUS_STYLE[st].label}`, st)}
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

                  <select
                    value={activeTopic.understanding}
                    onChange={(e) =>
                      updateActiveTopic((t) => ({
                        ...t,
                        understanding: e.target.value as NetUnderstandingLevel,
                      }))
                    }
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
                    onClick={() => updateActiveTopic((t) => ({ ...t, bookmarked: !t.bookmarked }))}
                    className="px-2.5 py-1 rounded-[7px] text-[11.5px] cursor-pointer"
                    style={{
                      backgroundColor: activeTopic.bookmarked ? 'rgba(185, 155, 121, 0.16)' : '#16181E',
                      color: activeTopic.bookmarked ? '#B99B79' : 'var(--os-ivory-muted)',
                      border: '1px solid rgba(217, 213, 203, 0.1)',
                    }}
                  >
                    {activeTopic.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                  </button>

                  <button
                    type="button"
                    onClick={() => updateActiveTopic((t) => ({ ...t, weakFlag: !t.weakFlag }))}
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

              {/* Cross-Linked Networking + OS/Backend/Distributed Knowledge Connections */}
              <div
                className="p-3.5 rounded-[10px] space-y-2.5"
                style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="metadata text-[10px] uppercase tracking-[0.1em] mr-1" style={{ color: '#A7B6D2' }}>
                      RELATED NETWORKING:
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
                        showToast('Đã liên kết chéo Topic');
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

                {activeTopic.crossSystemLinks.length > 0 && (
                  <div className="pt-2 border-t flex flex-wrap gap-2 items-center" style={{ borderColor: 'rgba(217, 213, 203, 0.06)' }}>
                    <span className="metadata text-[10px] uppercase tracking-[0.1em]" style={{ color: '#B99B79' }}>
                      OS / BACKEND CONNECTIONS:
                    </span>
                    {activeTopic.crossSystemLinks.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (c.osTopicId && onJumpToOsTopic) onJumpToOsTopic(c.osTopicId);
                          else if (c.netTopicId) openTopic(c.netTopicId);
                        }}
                        title={c.reason}
                        className="px-2.5 py-0.5 rounded-[5px] text-[11px] cursor-pointer"
                        style={{
                          backgroundColor: 'rgba(185, 155, 121, 0.12)',
                          color: '#B99B79',
                          border: '1px solid rgba(185, 155, 121, 0.28)',
                        }}
                      >
                        [{c.discipline}] {c.targetLabel} {(c.osTopicId || c.netTopicId) ? '↗' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Section Focus Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    ['all', 'Tất cả 16 mục'],
                    ['foundation', '01–05 · Overview, Concepts & Theory'],
                    ['specs_packets', '06–09 · Specs, Diagrams, Packets & CLI'],
                    ['ops_sec', '10–13 · Compare, Apps, Troubleshoot & Security'],
                    ['practice_refs', '14–16 · Interview, Labs & Refs'],
                  ] as const
                ).map(([gk, gl]) => (
                  <button
                    key={gk}
                    type="button"
                    onClick={() => setTopicGroup(gk)}
                    className="px-2.5 py-1 rounded-[6px] text-[11.5px] cursor-pointer"
                    style={{
                      backgroundColor: topicGroup === gk ? 'rgba(167, 182, 210, 0.14)' : '#14161C',
                      color: topicGroup === gk ? '#A7B6D2' : 'var(--os-ivory-faint)',
                      border:
                        topicGroup === gk
                          ? '1px solid rgba(167, 182, 210, 0.35)'
                          : '1px solid rgba(217, 213, 203, 0.08)',
                    }}
                  >
                    {gl}
                  </button>
                ))}
              </div>
            </div>

            {/* 16 STRUCTURED NETWORKING COMPONENTS */}
            <div className="space-y-6">
              {showFoundation && (
                <>
                  {/* 01 Overview */}
                  <div className="space-y-1.5">
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                      01 // OVERVIEW
                    </span>
                    <textarea
                      rows={2}
                      value={activeTopic.overview}
                      onChange={(e) => updateActiveTopic((t) => ({ ...t, overview: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-[9px] text-[13.5px] leading-relaxed resize-y"
                      style={{ backgroundColor: '#14161C', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.09)' }}
                    />
                  </div>

                  {/* 02 Core Concepts & 03 Definitions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-[10px] space-y-2.5" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                        02 // CORE CONCEPTS
                      </span>
                      <ul className="space-y-1.5 text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                        {activeTopic.coreConcepts.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span style={{ color: '#A7B6D2' }}>•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-[10px] space-y-2.5" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#9BAA98' }}>
                        03 // DEFINITIONS & TERMINOLOGY
                      </span>
                      <div className="space-y-2">
                        {activeTopic.definitions.map((d, idx) => (
                          <div key={idx} className="text-[12.5px]">
                            <span className="font-semibold" style={{ color: '#EDEAE2' }}>{d.term}: </span>
                            <span style={{ color: 'var(--os-ivory-muted)' }}>{d.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 04 Detailed Theory */}
                  <div className="p-4 rounded-[10px] space-y-3" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.09)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                        04 // DETAILED THEORY (MARKDOWN & FORMULAS)
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingTheory((v) => !v)}
                        className="px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium cursor-pointer"
                        style={{
                          backgroundColor: editingTheory ? '#A7B6D2' : '#101114',
                          color: editingTheory ? '#101114' : '#EDEAE2',
                          border: '1px solid rgba(217, 213, 203, 0.12)',
                        }}
                      >
                        {editingTheory ? '✓ Preview' : 'Chỉnh sửa Theory'}
                      </button>
                    </div>
                    {editingTheory ? (
                      <textarea
                        rows={10}
                        value={activeTopic.detailedTheory}
                        onChange={(e) => updateActiveTopic((t) => ({ ...t, detailedTheory: e.target.value }))}
                        className="w-full px-3.5 py-3 rounded-[8px] font-mono text-[12.5px] leading-relaxed resize-y"
                        style={{ backgroundColor: '#0E1014', color: '#EDEAE2', border: '1px solid rgba(167, 182, 210, 0.35)' }}
                      />
                    ) : (
                      <NetTheoryMarkdown content={activeTopic.detailedTheory} />
                    )}
                  </div>

                  {/* 05 How It Works */}
                  <div className="p-4 rounded-[10px] space-y-2.5" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                      05 // HOW IT WORKS
                    </span>
                    <ol className="space-y-2">
                      {activeTopic.howItWorks.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                          <span className="metadata text-[11px] px-1.5 py-0.5 rounded-[4px]" style={{ backgroundColor: '#101114', color: '#A7B6D2' }}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}

              {showSpecsPackets && (
                <>
                  {/* 06 Protocol Specifications */}
                  <div className="p-4 rounded-[10px] space-y-3" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                      06 // PROTOCOL SPECIFICATIONS
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[12.5px]">
                      <div className="p-2.5 rounded-[7px]" style={{ backgroundColor: '#101114' }}>
                        <span className="metadata text-[9.5px] block" style={{ color: 'var(--os-ivory-faint)' }}>RFC / STANDARD</span>
                        <span style={{ color: '#EDEAE2' }}>{activeTopic.protocolSpecs.rfcOrStandard}</span>
                      </div>
                      <div className="p-2.5 rounded-[7px]" style={{ backgroundColor: '#101114' }}>
                        <span className="metadata text-[9.5px] block" style={{ color: 'var(--os-ivory-faint)' }}>OSI LAYER</span>
                        <span style={{ color: '#A7B6D2' }}>{activeTopic.protocolSpecs.layer}</span>
                      </div>
                      <div className="p-2.5 rounded-[7px]" style={{ backgroundColor: '#101114' }}>
                        <span className="metadata text-[9.5px] block" style={{ color: 'var(--os-ivory-faint)' }}>PORTS / PROTO</span>
                        <span style={{ color: '#9BAA98' }}>{activeTopic.protocolSpecs.portsOrProto}</span>
                      </div>
                      <div className="p-2.5 rounded-[7px]" style={{ backgroundColor: '#101114' }}>
                        <span className="metadata text-[9.5px] block" style={{ color: 'var(--os-ivory-faint)' }}>KEY HEADER FIELDS</span>
                        <span style={{ color: 'var(--os-ivory-muted)' }}>{activeTopic.protocolSpecs.keyFields}</span>
                      </div>
                    </div>
                  </div>

                  {/* 07 Network Diagrams */}
                  <div className="space-y-2">
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                      07 // NETWORK DIAGRAMS
                    </span>
                    <NetTopicDiagramSvg
                      title={activeTopic.diagram.title}
                      boxes={activeTopic.diagram.boxes}
                      arrows={activeTopic.diagram.arrows}
                    />
                  </div>

                  {/* 08 Packet Analysis */}
                  <div className="p-4 rounded-[10px] space-y-2.5" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#9BAA98' }}>
                        08 // PACKET ANALYSIS (WIRESHARK BREAKDOWN)
                      </span>
                      <button
                        type="button"
                        onClick={() => setState((prev) => ({ ...prev, activeTab: 'packets_cli' }))}
                        className="text-[11.5px] hover:underline cursor-pointer"
                        style={{ color: '#A7B6D2' }}
                      >
                        Mở Packet Analyzer Lab ↗
                      </button>
                    </div>
                    <p className="font-mono text-[12px] px-3 py-2 rounded-[6px]" style={{ backgroundColor: '#101114', color: '#B99B79' }}>
                      {activeTopic.packetAnalysis.frameSummary}
                    </p>
                    <div className="space-y-1.5">
                      {activeTopic.packetAnalysis.layers.map((lay, idx) => (
                        <div key={idx} className="text-[12.5px] px-3 py-1.5 rounded-[6px]" style={{ backgroundColor: '#101114' }}>
                          <span className="metadata text-[11px] mr-2" style={{ color: '#A7B6D2' }}>
                            [{lay.layerName}]
                          </span>
                          <span style={{ color: 'var(--os-ivory-muted)' }}>{lay.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 09 Code & Commands */}
                  <div className="p-4 rounded-[10px] space-y-2.5" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                    <div className="flex items-center justify-between">
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                        09 // CODE & COMMANDS · {activeTopic.codeAndCommands.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(activeTopic.codeAndCommands.snippet);
                          showToast('Đã copy snippet / CLI command');
                        }}
                        className="text-[11px] hover:underline cursor-pointer"
                        style={{ color: '#9BAA98' }}
                      >
                        Copy
                      </button>
                    </div>
                    <pre
                      className="p-3.5 rounded-[8px] font-mono text-[12.5px] overflow-x-auto leading-relaxed"
                      style={{ backgroundColor: '#0B0C0F', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.08)' }}
                    >
                      <code>{activeTopic.codeAndCommands.snippet}</code>
                    </pre>
                  </div>
                </>
              )}

              {showOpsSec && (
                <>
                  {/* 10 Comparisons & 11 Real-world Applications */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 rounded-[10px] space-y-2.5" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                        10 // COMPARISONS
                      </span>
                      {activeTopic.comparisons.map((cmp, idx) => (
                        <div key={idx} className="p-3 rounded-[8px] space-y-1 text-[12.5px]" style={{ backgroundColor: '#101114' }}>
                          <p className="font-semibold" style={{ color: '#B99B79' }}>{cmp.aspect}</p>
                          <p style={{ color: 'var(--os-ivory-muted)' }}>• {cmp.optionA}</p>
                          <p style={{ color: 'var(--os-ivory-muted)' }}>• {cmp.optionB}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-[10px] space-y-2.5" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#9BAA98' }}>
                        11 // REAL-WORLD APPLICATIONS
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
                  </div>

                  {/* 12 Troubleshooting & 13 Security Considerations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 rounded-[10px] space-y-2" style={{ backgroundColor: '#14161C', border: '1px solid rgba(185, 155, 121, 0.25)' }}>
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                        12 // TROUBLESHOOTING & DEBUGGING
                      </span>
                      <ul className="space-y-1.5 text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                        {activeTopic.troubleshooting.map((tr, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span style={{ color: '#B99B79' }}>⚡</span>
                            <span>{tr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-[10px] space-y-2" style={{ backgroundColor: '#14161C', border: '1px solid rgba(201, 138, 130, 0.25)' }}>
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#C98A82' }}>
                        13 // SECURITY CONSIDERATIONS
                      </span>
                      <ul className="space-y-1.5 text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                        {activeTopic.securityConsiderations.map((sec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span style={{ color: '#C98A82' }}>🛡</span>
                            <span>{sec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {showPracticeRefs && (
                <>
                  {/* 14 Interview Questions */}
                  <div className="p-4 rounded-[10px] space-y-2.5" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
                      14 // INTERVIEW QUESTIONS
                    </span>
                    {activeTopic.interviewQuestions.map((qa, idx) => {
                      const open = openInterviewIdx === idx;
                      return (
                        <div key={idx} className="rounded-[8px] overflow-hidden" style={{ backgroundColor: '#101114', border: '1px solid rgba(217, 213, 203, 0.07)' }}>
                          <button
                            type="button"
                            onClick={() => setOpenInterviewIdx(open ? null : idx)}
                            className="w-full p-3 text-left flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <span className="text-[13px] font-medium" style={{ color: '#EDEAE2' }}>{qa.question}</span>
                            <span className="metadata text-[10.5px]" style={{ color: '#A7B6D2' }}>{open ? 'Ẩn' : 'Xem đáp án'}</span>
                          </button>
                          {open && (
                            <p className="px-3 pb-3 pt-1 text-[12.5px] leading-relaxed border-t" style={{ color: 'var(--os-ivory-muted)', borderColor: 'rgba(217, 213, 203, 0.06)' }}>
                              {qa.answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 15 Exercises & Labs + 16 References */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-[10px] space-y-2.5" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#9BAA98' }}>
                        15 // EXERCISES & LABS
                      </span>
                      {activeTopic.exercises.map((ex) => (
                        <div key={ex.id} className="p-3 rounded-[8px] space-y-1.5" style={{ backgroundColor: '#101114' }}>
                          <label className="flex items-start gap-2 cursor-pointer text-[12.5px]">
                            <input
                              type="checkbox"
                              checked={ex.done}
                              onChange={() =>
                                updateActiveTopic((t) => ({
                                  ...t,
                                  exercises: t.exercises.map((i) => (i.id === ex.id ? { ...i, done: !i.done } : i)),
                                }))
                              }
                              className="mt-1"
                            />
                            <span style={{ color: ex.done ? 'var(--os-ivory-faint)' : '#EDEAE2' }}>{ex.prompt}</span>
                          </label>
                          <p className="text-[11.5px] pl-5" style={{ color: '#A7B6D2' }}>Gợi ý: {ex.solutionHint}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-[10px] space-y-2.5" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                        16 // REFERENCES
                      </span>
                      <div className="space-y-2">
                        {activeTopic.references.map((ref, idx) => (
                          <div key={idx} className="p-2.5 rounded-[8px]" style={{ backgroundColor: '#101114' }}>
                            <p className="text-[12.5px] font-medium" style={{ color: '#EDEAE2' }}>{ref.label}</p>
                            <p className="text-[11.5px]" style={{ color: 'var(--os-ivory-faint)' }}>{ref.source}</p>
                            {ref.url && (
                              <a href={ref.url} target="_blank" rel="noreferrer" className="metadata text-[10.5px] hover:underline" style={{ color: '#A7B6D2' }}>
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

      {/* TAB 3: PACKET ANALYZER & COMMAND LABORATORY */}
      {state.activeTab === 'packets_cli' && <PacketAndCommandLabView />}

      {/* TAB 4: TOPOLOGY SIMULATOR */}
      {state.activeTab === 'topology' && (
        <TopologySimulatorView
          nodes={state.topologyNodes}
          edges={state.topologyEdges}
          onAddNode={(n) => setState((prev) => ({ ...prev, topologyNodes: [...prev.topologyNodes, n] }))}
          onAddEdge={(e) => setState((prev) => ({ ...prev, topologyEdges: [...prev.topologyEdges, e] }))}
          onDeleteNode={(id) =>
            setState((prev) => ({
              ...prev,
              topologyNodes: prev.topologyNodes.filter((n) => n.id !== id),
              topologyEdges: prev.topologyEdges.filter((e) => e.fromId !== id && e.toId !== id),
            }))
          }
        />
      )}

      {/* TAB 5: COMPARISON TABLES */}
      {state.activeTab === 'comparisons' && (
        <div className="space-y-5">
          <div>
            <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#A7B6D2' }}>
              PROTOCOL & INFRASTRUCTURE COMPARISONS
            </p>
            <h2 className="font-editorial text-[24px] mt-0.5" style={{ color: '#EDEAE2' }}>
              Bảng đối chiếu các công nghệ Mạng
            </h2>
          </div>
          {NET_COMPARISON_MATRICES.map((tbl) => (
            <div key={tbl.id} className="rounded-[12px] overflow-hidden" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.09)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
                <h3 className="text-[15px] font-semibold" style={{ color: '#EDEAE2' }}>{tbl.title}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px] border-collapse">
                  <thead>
                    <tr className="border-b" style={{ backgroundColor: '#101114', borderColor: 'rgba(217, 213, 203, 0.08)' }}>
                      <th className="px-4 py-2.5 font-medium" style={{ color: '#B99B79' }}>Tiêu chí</th>
                      {tbl.columns.map((c) => (
                        <th key={c} className="px-4 py-2.5 font-semibold" style={{ color: '#A7B6D2' }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(217, 213, 203, 0.06)' }}>
                    {tbl.rows.map((row) => (
                      <tr key={row.criterion}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: '#EDEAE2' }}>{row.criterion}</td>
                        {row.items.map((cell, idx) => (
                          <td key={idx} className="px-4 py-2.5" style={{ color: 'var(--os-ivory-muted)' }}>{cell}</td>
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

      {/* TAB 6: FLASHCARDS */}
      {state.activeTab === 'flashcards' && (
        <div className="space-y-5 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#A7B6D2' }}>
                ACTIVE RECALL FLASHCARDS
              </p>
              <h2 className="font-editorial text-[24px] mt-0.5" style={{ color: '#EDEAE2' }}>
                Ôn tập giao thức & khái niệm Mạng ({state.flashcards.length} thẻ)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setFcModalOpen(true)}
              className="px-3.5 py-2 rounded-[8px] text-[12.5px] font-semibold cursor-pointer"
              style={{ backgroundColor: '#A7B6D2', color: '#101114' }}
            >
              + Tạo Flashcard
            </button>
          </div>

          {currentCard && (
            <div
              onClick={() => setFcFlipped((f) => !f)}
              className="p-6 sm:p-8 rounded-[14px] min-h-[220px] flex flex-col justify-between cursor-pointer select-none"
              style={{ backgroundColor: '#14161C', border: '1px solid rgba(167, 182, 210, 0.35)' }}
            >
              <div className="flex items-center justify-between">
                <span className="metadata text-[10.5px]" style={{ color: '#A7B6D2' }}>
                  CARD {(fcIndex % state.flashcards.length) + 1} / {state.flashcards.length} · {fcFlipped ? 'ANSWER' : 'QUESTION (Nhấn để lật)'}
                </span>
                <span className="metadata text-[10px]" style={{ color: currentCard.confidence === 'mastered' ? '#9BAA98' : '#B99B79' }}>
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
                        flashcards: prev.flashcards.map((c) => (c.id === currentCard.id ? { ...c, confidence: 'mastered' } : c)),
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
                    style={{ backgroundColor: '#101114', color: '#A7B6D2' }}
                  >
                    Thẻ tiếp →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: RESEARCH NOTES & REVISIONS */}
      {state.activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-editorial text-[24px]" style={{ color: '#EDEAE2' }}>
              Networking Research Notes ({state.researchNotes.length})
            </h2>
            <form onSubmit={handleAddNote} className="p-4 rounded-[12px] space-y-3" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.09)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Tiêu đề ghi chú..."
                  className="sm:col-span-2 px-3 py-2 rounded-[7px] text-[13px]"
                  style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
                />
                <select
                  value={noteTopicId}
                  onChange={(e) => setNoteTopicId(e.target.value)}
                  className="px-3 py-2 rounded-[7px] text-[12px]"
                  style={{ backgroundColor: '#101114', color: 'var(--os-ivory-muted)', border: '1px solid rgba(217, 213, 203, 0.1)' }}
                >
                  <option value="">Gắn Topic (tùy chọn)...</option>
                  {state.topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.code} · {t.title}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={noteQuestion}
                onChange={(e) => setNoteQuestion(e.target.value)}
                placeholder="Câu hỏi đào sâu..."
                className="w-full px-3 py-2 rounded-[7px] text-[13px]"
                style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
              />
              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Ghi chú phân tích gói tin, sự cố hoặc liên kết Backend..."
                className="w-full px-3 py-2 rounded-[7px] text-[13px] resize-y"
                style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
              />
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-1.5 rounded-[7px] text-[12.5px] font-semibold cursor-pointer" style={{ backgroundColor: '#A7B6D2', color: '#101114' }}>
                  Lưu Research Note
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {state.researchNotes.map((n) => {
                const rel = state.topics.find((t) => t.id === n.topicId);
                return (
                  <article key={n.id} className="p-4 rounded-[11px] space-y-2" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="text-[15px] font-semibold" style={{ color: '#EDEAE2' }}>{n.title}</h3>
                        {n.question && <p className="text-[12.5px] mt-0.5" style={{ color: '#B99B79' }}>Q: {n.question}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {rel && (
                          <button type="button" onClick={() => openTopic(rel.id)} className="metadata text-[10.5px] px-2 py-0.5 rounded-[5px] cursor-pointer" style={{ backgroundColor: 'rgba(167, 182, 210, 0.12)', color: '#A7B6D2' }}>
                            {rel.code} ↗
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setState((prev) => ({ ...prev, researchNotes: prev.researchNotes.filter((x) => x.id !== n.id) }))}
                          className="text-[11px] hover:underline cursor-pointer"
                          style={{ color: 'var(--os-ivory-faint)' }}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--os-ivory-muted)' }}>{n.content}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h2 className="font-editorial text-[24px]" style={{ color: '#EDEAE2' }}>
              Revision Log ({state.revisionLogs.length})
            </h2>
            <div className="space-y-2.5">
              {state.revisionLogs.map((rev) => {
                const t = state.topics.find((x) => x.id === rev.topicId);
                return (
                  <div key={rev.id} className="p-3.5 rounded-[10px] space-y-1" style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="metadata text-[10.5px]" style={{ color: '#A7B6D2' }}>{rev.dateStr}</span>
                      <span className="metadata text-[10px]" style={{ color: STATUS_STYLE[rev.statusAfter].color }}>{STATUS_STYLE[rev.statusAfter].label}</span>
                    </div>
                    {t && (
                      <button type="button" onClick={() => openTopic(t.id)} className="text-[13px] font-medium hover:underline text-left block cursor-pointer" style={{ color: '#EDEAE2' }}>
                        {t.code} · {t.title}
                      </button>
                    )}
                    <p className="text-[12px]" style={{ color: 'var(--os-ivory-muted)' }}>{rev.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM TOPIC */}
      <Modal open={addTopicOpen} onClose={() => setAddTopicOpen(false)} title="Thêm Topic mới vào Computer Networking KB">
        <form onSubmit={handleAddTopic} className="space-y-3">
          <select value={newTopicModule} onChange={(e) => setNewTopicModule(e.target.value)} className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13px]">
            {NET_MODULES.map((m) => (
              <option key={m.id} value={m.id}>{m.code} · {m.title}</option>
            ))}
          </select>
          <input type="text" required value={newTopicTitle} onChange={(e) => setNewTopicTitle(e.target.value)} placeholder="Tên Topic (VD: gRPC Flow Control, BGP Anycast Lab)..." className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13.5px]" />
          <input type="text" value={newTopicSub} onChange={(e) => setNewTopicSub(e.target.value)} placeholder="Mô tả ngắn..." className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13px]" />
          <button type="submit" className="w-full py-2.5 rounded-[8px] text-[13px] font-semibold cursor-pointer" style={{ backgroundColor: '#A7B6D2', color: '#101114' }}>
            Tạo Topic 16 mục
          </button>
        </form>
      </Modal>

      {/* MODAL: CREATE FLASHCARD */}
      <Modal open={fcModalOpen} onClose={() => setFcModalOpen(false)} title="Tạo Flashcard Networking mới">
        <form onSubmit={handleCreateFlashcard} className="space-y-3">
          <textarea rows={2} required value={fcFrontInput} onChange={(e) => setFcFrontInput(e.target.value)} placeholder="Mặt trước (Câu hỏi / Giao thức)..." className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13.5px]" />
          <textarea rows={3} required value={fcBackInput} onChange={(e) => setFcBackInput(e.target.value)} placeholder="Mặt sau (Giải thích)..." className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13.5px]" />
          <button type="submit" className="w-full py-2.5 rounded-[8px] text-[13px] font-semibold cursor-pointer" style={{ backgroundColor: '#A7B6D2', color: '#101114' }}>
            Lưu Flashcard
          </button>
        </form>
      </Modal>
    </div>
  );
}
