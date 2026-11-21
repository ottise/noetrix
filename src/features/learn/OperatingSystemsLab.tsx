import { useEffect, useState } from 'react';
import { createId } from '../../db/database';
import { useLanguage } from '../../lib/i18n';
import { scheduleSourceCodeSave } from '../../lib/sourceStore';
import { useToast } from '../../components/ui/Primitives';
import {
  buildInitialOsKnowledgeBaseState,
  OS_COMPARISON_MATRICES,
  OS_MODULES,
  type OsFlashcard,
  type OsKnowledgeBaseState,
  type OsLearningStatus,
} from './osKnowledgeData';
import { OsKnowledgeGraphView, OsTopicDiagramSvg } from './OsKnowledgeGraph';
import { OS_BEGINNER_GUIDES } from './osBeginnerGuides';
import { SubjectCourseView } from './SubjectCourseView';

const OS_KB_STORAGE_KEY = 'noetrix_os_knowledge_base_v1';

function loadOsState(): OsKnowledgeBaseState {
  try {
    const raw = localStorage.getItem(OS_KB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OsKnowledgeBaseState>;
      const fallback = buildInitialOsKnowledgeBaseState();
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
        };
      }
    }
  } catch {
    // ignore corrupt JSON
  }
  return buildInitialOsKnowledgeBaseState();
}

export function OperatingSystemsLab({
  initialTopicId,
  onConsumedInitialTopic,
  onExitSubject,
}: {
  initialTopicId?: string | null;
  onConsumedInitialTopic?: () => void;
  onExitSubject?: () => void;
}) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [state, setState] = useState<OsKnowledgeBaseState>(() => loadOsState());
  const [viewMode, setViewMode] = useState<'dashboard' | 'lesson'>('dashboard');

  useEffect(() => {
    if (!initialTopicId) return;
    const found = state.topics.find((tp) => tp.id === initialTopicId);
    if (found) {
      setState((prev) => ({
        ...prev,
        activeModuleId: found.moduleId,
        activeTopicId: found.id,
      }));
      setViewMode('lesson');
    }
    onConsumedInitialTopic?.();
  }, [initialTopicId]);

  useEffect(() => {
    try {
      localStorage.setItem(OS_KB_STORAGE_KEY, JSON.stringify(state));
      scheduleSourceCodeSave();
    } catch {
      // ignore storage errors
    }
  }, [state]);

  return (
    <SubjectCourseView
      subjectTitle={t('Operating Systems', 'Hệ Điều Hành')}
      subjectOverview={t(
        'Operating Systems sit between hardware (CPU, RAM, Disk) and applications. Learn step by step how processes, threads, scheduling, virtual memory, file systems, I/O, and security actually work under the hood.',
        'Hệ điều hành là lớp phần mềm đứng giữa phần cứng (CPU, RAM, Ổ đĩa) và mọi ứng dụng bạn viết. Môn học đi từng bước từ cách chương trình chạy (Process & Thread), chia RAM (Virtual Memory & Paging), lưu dữ liệu trên đĩa (File Systems) đến I/O và Bảo mật.'
      )}
      accentColor="#B99B79"
      modules={OS_MODULES}
      topics={state.topics}
      guides={OS_BEGINNER_GUIDES}
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
            const nextStatus: OsLearningStatus =
              tp.status === 'completed' ? 'not_started' : 'completed';
            return {
              ...tp,
              status: nextStatus,
              lastReviewedAt: Date.now(),
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
        return found?.diagram ? <OsTopicDiagramSvg diagram={found.diagram} /> : null;
      }}
      extraTabs={[
        {
          id: 'graph',
          label: t('Knowledge Graph', 'Sơ đồ Kiến thức'),
          render: (openLessonById) => (
            <OsKnowledgeGraphView
              topics={state.topics}
              activeTopicId={state.activeTopicId}
              onSelectTopic={openLessonById}
            />
          ),
        },
      ]}
      comparisons={OS_COMPARISON_MATRICES}
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
        const card: OsFlashcard = {
          id: createId('osfc'),
          topicId: state.activeTopicId,
          front,
          back,
          confidence: 'learning',
          createdAt: Date.now(),
        };
        setState((prev) => ({ ...prev, flashcards: [card, ...prev.flashcards] }));
        showToast(t('Added flashcard', 'Đã thêm Flashcard mới'));
      }}
    />
  );
}
