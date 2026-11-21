import { useEffect, useState } from 'react';
import { createId } from '../../db/database';
import { useLanguage } from '../../lib/i18n';
import { scheduleSourceCodeSave } from '../../lib/sourceStore';
import { useToast } from '../../components/ui/Primitives';
import {
  buildInitialNetKnowledgeBaseState,
  NET_COMPARISON_MATRICES,
  NET_MODULES,
  type NetFlashcard,
  type NetKnowledgeBaseState,
  type NetLearningStatus,
} from './netKnowledgeData';
import {
  NetTopicDiagramSvg,
  PacketAndCommandLabView,
  TopologySimulatorView,
} from './NetResearchTools';
import { NET_BEGINNER_GUIDES } from './netBeginnerGuides';
import { SubjectCourseView } from './SubjectCourseView';

const NET_KB_STORAGE_KEY = 'noetrix_net_knowledge_base_v1';

function loadNetState(): NetKnowledgeBaseState {
  try {
    const raw = localStorage.getItem(NET_KB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NetKnowledgeBaseState>;
      const fallback = buildInitialNetKnowledgeBaseState();
      if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
        return {
          ...fallback,
          activeTab: 'dashboard',
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
          topologyNodes: Array.isArray(parsed.topologyNodes)
            ? parsed.topologyNodes
            : fallback.topologyNodes,
          topologyEdges: Array.isArray(parsed.topologyEdges)
            ? parsed.topologyEdges
            : fallback.topologyEdges,
        };
      }
    }
  } catch {
    // ignore corrupt JSON
  }
  return buildInitialNetKnowledgeBaseState();
}

export function NetworkingLab({
  onExitSubject,
}: {
  onJumpToOsTopic?: (osTopicId: string) => void;
  onExitSubject?: () => void;
}) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [state, setState] = useState<NetKnowledgeBaseState>(() => loadNetState());
  const [viewMode, setViewMode] = useState<'dashboard' | 'lesson'>('dashboard');

  useEffect(() => {
    try {
      localStorage.setItem(NET_KB_STORAGE_KEY, JSON.stringify(state));
      scheduleSourceCodeSave();
    } catch {
      // ignore storage errors
    }
  }, [state]);

  return (
    <SubjectCourseView
      subjectTitle={t('Computer Networking', 'Mạng Máy Tính')}
      subjectOverview={t(
        'Computer Networking explains how machines find each other and reliably move data across the internet. Learn from physical signals, MAC/ARP, IP & Subnetting, Routing, TCP/UDP/HTTP/DNS to Sockets, TLS, and Cloud infrastructure.',
        'Mạng máy tính giải thích cách các máy tìm thấy nhau và truyền dữ liệu tin cậy qua Internet. Môn học đi tuần tự từ tín hiệu vật lý, MAC/ARP, IP & Subnetting, Định tuyến (Routing), TCP/UDP/HTTP/DNS đến Socket, Bảo mật TLS và Mạng Cloud.'
      )}
      accentColor="#A7B6D2"
      modules={NET_MODULES}
      topics={state.topics}
      guides={NET_BEGINNER_GUIDES}
      activeTopicId={state.activeTopicId}
      viewMode={viewMode}
      onChangeView={setViewMode}
      onExitSubject={onExitSubject}
      onSelectTopic={(topicId) => {
        const found = state.topics.find((tp) => tp.id === topicId);
        if (!found) return;
        setState((prev) => ({
          ...prev,
          activeModuleId: found.moduleId,
          activeTopicId: found.id,
        }));
      }}
      onToggleCompleted={(topicId) => {
        setState((prev) => ({
          ...prev,
          topics: prev.topics.map((tp) => {
            if (tp.id !== topicId) return tp;
            const nextStatus: NetLearningStatus =
              tp.status === 'completed' ? 'not_started' : 'completed';
            return {
              ...tp,
              status: nextStatus,
              updatedAt: Date.now(),
            };
          }),
        }));
      }}
      onUpdateNote={(topicId, noteText) => {
        setState((prev) => ({
          ...prev,
          topics: prev.topics.map((tp) =>
            tp.id === topicId ? { ...tp, overview: noteText, updatedAt: Date.now() } : tp
          ),
        }));
      }}
      renderDiagram={(topicId) => {
        const found = state.topics.find((tp) => tp.id === topicId);
        return found?.diagram ? (
          <NetTopicDiagramSvg
            title={found.diagram.title}
            boxes={found.diagram.boxes}
            arrows={found.diagram.arrows}
          />
        ) : null;
      }}
      extraTabs={[
        {
          id: 'topology',
          label: t('Topology Diagram', 'Sơ đồ Topology'),
          render: () => (
            <TopologySimulatorView
              nodes={state.topologyNodes}
              edges={state.topologyEdges}
              onAddNode={(node) =>
                setState((prev) => ({
                  ...prev,
                  topologyNodes: [...prev.topologyNodes, node],
                }))
              }
              onAddEdge={(edge) =>
                setState((prev) => ({
                  ...prev,
                  topologyEdges: [...prev.topologyEdges, edge],
                }))
              }
              onDeleteNode={(nodeId) =>
                setState((prev) => ({
                  ...prev,
                  topologyNodes: prev.topologyNodes.filter((n) => n.id !== nodeId),
                  topologyEdges: prev.topologyEdges.filter(
                    (e) => e.fromId !== nodeId && e.toId !== nodeId
                  ),
                }))
              }
            />
          ),
        },
        {
          id: 'packets_cli',
          label: t('Packets & CLI', 'Gói tin & Lệnh'),
          render: () => <PacketAndCommandLabView />,
        },
      ]}
      comparisons={NET_COMPARISON_MATRICES}
      flashcards={state.flashcards}
      onToggleCardMastered={(cardId) => {
        setState((prev) => ({
          ...prev,
          flashcards: prev.flashcards.map((c) =>
            c.id === cardId ? { ...c, confidence: 'mastered' } : c
          ),
        }));
      }}
      onCreateFlashcard={(front, back) => {
        const card: NetFlashcard = {
          id: createId('netfc'),
          topicId: state.activeTopicId,
          front,
          back,
          confidence: 'learning',
          createdAt: Date.now(),
        };
        setState((prev) => ({ ...prev, flashcards: [card, ...prev.flashcards] }));
        showToast(t('Added flashcard', 'Đã lưu Flashcard mới'));
      }}
    />
  );
}
