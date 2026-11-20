import React, { useEffect, useMemo, useState } from 'react';
import { createId, getLocalDateStr } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import { scheduleSourceCodeSave } from '../../lib/sourceStore';
import { Modal, useToast } from '../../components/ui/Primitives';
import { LessonVisualizeCanvas } from './LessonVisualizeCanvas';
import { OperatingSystemsLab } from './OperatingSystemsLab';
import { NetworkingLab } from './NetworkingLab';
import {
  buildInitialCodeLearningState,
  LESSON_MODULES,
  UNDERSTANDING_META,
  type AssessmentItem,
  type CodeLearningEnvState,
  type LessonExperiment,
  type LessonModuleId,
  type LessonTopic,
  type ProgrammingSubject,
  type UnderstandingState,
} from './programmingData';

export type LabTrackId = 'code' | 'leetcode' | 'chess' | 'sudoku';

const CODE_LEARNING_ENV_KEY = 'noetrix_code_learning_env_v1';

function loadCodeLearningState(): CodeLearningEnvState {
  try {
    const raw = localStorage.getItem(CODE_LEARNING_ENV_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CodeLearningEnvState>;
      if (Array.isArray(parsed.subjects) && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
        return {
          activeLevel: parsed.activeLevel || 'directory',
          activeSubjectId: parsed.activeSubjectId || parsed.subjects[0]?.id || 'subj_java',
          activeTopicId: parsed.activeTopicId || parsed.topics[0]?.id || 'top_java_hashmap',
          activeModule: parsed.activeModule || 'theory',
          subjects: parsed.subjects,
          topics: parsed.topics,
        };
      }
    }
  } catch {
    // ignore corrupt JSON
  }
  return buildInitialCodeLearningState();
}

function addDaysFromToday(days: number): string {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatRelTime(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

/** Lightweight, safe Inkwell-style Markdown renderer for Notes */
function MarkdownNotesPreview({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n');
  const blocks: React.ReactNode[] = [];
  let inCode = false;
  let codeLang = '';
  let codeBuf: string[] = [];

  const renderInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((p, idx) => {
      if (p.startsWith('`') && p.endsWith('`') && p.length >= 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded-[4px] text-[12.5px] font-mono"
            style={{ backgroundColor: 'rgba(185,155,121,0.14)', color: 'var(--os-brass)' }}
          >
            {p.slice(1, -1)}
          </code>
        );
      }
      if (p.startsWith('**') && p.endsWith('**') && p.length >= 4) {
        return (
          <strong key={idx} style={{ color: 'var(--os-ivory-bright)', fontWeight: 600 }}>
            {p.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={idx}>{p}</React.Fragment>;
    });
  };

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
              backgroundColor: '#0D0E11',
              border: '1px solid var(--os-border)',
              color: 'var(--os-ivory)',
            }}
          >
            {codeLang && (
              <span className="metadata text-[9.5px] uppercase block mb-1.5" style={{ color: 'var(--os-ivory-faint)' }}>
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

    // Markdown Table row
    if (ln.trim().startsWith('|') && ln.trim().endsWith('|')) {
      const tableRows: string[] = [ln];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        i++;
        tableRows.push(lines[i]);
      }
      const parsedRows = tableRows
        .filter((r) => !/^\|[\s:-]+\|$/.test(r.replace(/\|/g, '|').trim()) && !r.includes('---'))
        .map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

      if (parsedRows.length > 0) {
        blocks.push(
          <div key={`tbl-${i}`} className="overflow-x-auto my-3 rounded-[8px] border border-[var(--os-border)]">
            <table className="w-full text-left text-[12.5px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--os-border)]" style={{ backgroundColor: 'rgba(27,29,34,0.8)' }}>
                  {parsedRows[0].map((cell, ci) => (
                    <th key={ci} className="px-3 py-2 font-medium" style={{ color: 'var(--os-brass)' }}>
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--os-border)]">
                {parsedRows.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2" style={{ color: 'var(--os-ivory)' }}>
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
        <h4 key={i} className="font-editorial text-[17px] mt-4 mb-1.5" style={{ color: 'var(--os-ivory-bright)' }}>
          {renderInline(ln.slice(4))}
        </h4>
      );
    } else if (ln.startsWith('## ')) {
      blocks.push(
        <h3 key={i} className="font-editorial text-[20px] mt-5 mb-2" style={{ color: 'var(--os-ivory-bright)' }}>
          {renderInline(ln.slice(3))}
        </h3>
      );
    } else if (ln.startsWith('# ')) {
      blocks.push(
        <h2 key={i} className="font-editorial text-[23px] mt-5 mb-2" style={{ color: 'var(--os-ivory-bright)' }}>
          {renderInline(ln.slice(2))}
        </h2>
      );
    } else if (ln.trim().startsWith('- ')) {
      blocks.push(
        <li key={i} className="ml-4 list-disc text-[13.5px] leading-[1.68] my-0.5" style={{ color: 'var(--os-ivory)' }}>
          {renderInline(ln.trim().slice(2))}
        </li>
      );
    } else if (ln.trim() === '') {
      blocks.push(<div key={i} className="h-2" />);
    } else {
      blocks.push(
        <p key={i} className="text-[13.5px] leading-[1.7]" style={{ color: 'var(--os-ivory)' }}>
          {renderInline(ln)}
        </p>
      );
    }
  }

  return <div className="space-y-0.5">{blocks}</div>;
}

/**
 * LEVEL 1..4 CODE LEARNING ENVIRONMENT
 * Learn -> Take Notes -> Explain -> Visualize -> Practice -> Experiment -> Assess -> Review
 */
export function CodeLab({
  onSwitchTrack,
}: {
  onSwitchTrack?: (track: LabTrackId) => void;
}) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [codeSubArea, setCodeSubArea] = useState<'programming' | 'os' | 'networking'>('programming');
  const [pendingOsTopicId, setPendingOsTopicId] = useState<string | null>(null);
  const [env, setEnv] = useState<CodeLearningEnvState>(() => loadCodeLearningState());

  // Local workspace UI states (lightweight & contextual)
  const [lessonSidebarOpen, setLessonSidebarOpen] = useState(true);
  const [editingTheory, setEditingTheory] = useState(false);
  const [notesMode, setNotesMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [revealRef, setRevealRef] = useState(false);

  // Practice Sandbox Runner states
  const [practiceLang, setPracticeLang] = useState<'js' | 'java'>('js');
  const [codeDraftByTask, setCodeDraftByTask] = useState<Record<string, string>>({});
  const [runOutput, setRunOutput] = useState<{ status: 'idle' | 'pass' | 'fail' | 'error'; logs: string[] }>({
    status: 'idle',
    logs: [],
  });
  const [showSolution, setShowSolution] = useState(false);

  // New Topic / New Subject / New Experiment / New Question Modals
  const [newSubjectOpen, setNewSubjectOpen] = useState(false);
  const [sTitle, setSTitle] = useState('');
  const [sSub, setSSub] = useState('');

  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [tTitle, setTTitle] = useState('');
  const [tGroup, setTGroup] = useState('01 · Core Concepts');
  const [tSub, setTSub] = useState('');
  const [tDef, setTDef] = useState('');

  const [newExpOpen, setNewExpOpen] = useState(false);
  const [eTitle, setETitle] = useState('');
  const [eHyp, setEHyp] = useState('');
  const [eSteps, setESteps] = useState('');
  const [eCode, setECode] = useState('');

  const [newAssessOpen, setNewAssessOpen] = useState(false);
  const [aKind, setAKind] = useState<AssessmentItem['kind']>('predict_output');
  const [aPrompt, setAPrompt] = useState('');
  const [aCode, setACode] = useState('');
  const [aAns, setAAns] = useState('');
  const [aExp, setAExp] = useState('');

  // Persist to localStorage & auto-save to src/data/noetrix-store.json
  useEffect(() => {
    try {
      localStorage.setItem(CODE_LEARNING_ENV_KEY, JSON.stringify(env));
      scheduleSourceCodeSave();
    } catch {
      // ignore
    }
  }, [env]);

  const activeSubject =
    env.subjects.find((s) => s.id === env.activeSubjectId) || env.subjects[0];
  const activeTopic =
    env.topics.find((t) => t.id === env.activeTopicId) ||
    env.topics.find((t) => t.subjectId === activeSubject.id) ||
    env.topics[0];

  const subjectTopics = useMemo(
    () => env.topics.filter((t) => t.subjectId === activeSubject.id),
    [env.topics, activeSubject.id]
  );

  // Topics due for review today or earlier
  const todayStr = getLocalDateStr();
  const dueReviewTopics = useMemo(
    () => env.topics.filter((t) => t.review.nextReviewDate <= todayStr),
    [env.topics, todayStr]
  );

  const openSubject = (subjectId: string) => {
    triggerHaptic('selection');
    setEnv((prev) => ({
      ...prev,
      activeLevel: 'subject',
      activeSubjectId: subjectId,
    }));
  };

  const openLesson = (topic: LessonTopic, mod?: LessonModuleId) => {
    triggerHaptic('selection');
    setRevealRef(false);
    setShowSolution(false);
    setRunOutput({ status: 'idle', logs: [] });
    setEnv((prev) => ({
      ...prev,
      activeLevel: 'lesson',
      activeSubjectId: topic.subjectId,
      activeTopicId: topic.id,
      activeModule: mod || topic.lastStudiedModule || 'theory',
      topics: prev.topics.map((t) =>
        t.id === topic.id ? { ...t, updatedAt: Date.now() } : t
      ),
    }));
  };

  const switchLessonModule = (mod: LessonModuleId) => {
    triggerHaptic('selection');
    setRevealRef(false);
    setEnv((prev) => ({
      ...prev,
      activeModule: mod,
      topics: prev.topics.map((t) =>
        t.id === activeTopic.id
          ? { ...t, lastStudiedModule: mod, updatedAt: Date.now() }
          : t
      ),
    }));
  };

  const updateActiveTopic = (updater: (curr: LessonTopic) => LessonTopic) => {
    setEnv((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id === activeTopic.id
          ? { ...updater(t), updatedAt: Date.now() }
          : t
      ),
    }));
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sTitle.trim()) return;
    const id = createId('subj');
    const code = `SUBJ.${String(env.subjects.length + 1).padStart(2, '0')}`;
    const newSubj: ProgrammingSubject = {
      id,
      code,
      title: sTitle.trim(),
      subtitle: sSub.trim() || 'Core concepts & internals',
      focusArea: 'Deep foundational mastery',
      accent: 'var(--os-brass)',
    };
    setEnv((prev) => ({
      ...prev,
      subjects: [...prev.subjects, newSubj],
      activeSubjectId: id,
      activeLevel: 'subject',
    }));
    setSTitle('');
    setSSub('');
    setNewSubjectOpen(false);
    showToast(`Đã tạo môn học ${newSubj.title}`);
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return;
    const id = createId('top');
    const newTopic: LessonTopic = {
      id,
      subjectId: activeSubject.id,
      moduleGroup: tGroup.trim() || '01 · Core Concepts',
      title: tTitle.trim(),
      subtitle: tSub.trim() || 'Mechanism & Practical Implementation',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: Date.now(),
      relatedTopicIds: [],
      theory: {
        definition: tDef.trim() || 'Viết định nghĩa cốt lõi của khái niệm này...',
        why: 'Vấn đề nào dẫn đến sự ra đời của cơ chế này?',
        how: 'Tóm tắt cách hoạt động ở mức tổng quan.',
        internalMechanism: ['Bước 1: Khởi tạo và lưu trữ trong bộ nhớ...', 'Bước 2: Xử lý trường hợp biên...'],
        codeLanguage: 'java',
        codeExample: '// Code minh họa cơ chế bên trong\n',
        tradeOffs: { pros: ['Ưu điểm cốt lõi...'], cons: ['Đánh đổi về tài nguyên/độ phức tạp...'] },
        misconceptions: ['Hiểu lầm phổ biến cần tránh...'],
        references: [],
      },
      notes: {
        markdown: `### Ghi chú riêng: ${tTitle.trim()}\n- Điểm quan trọng nhất:\n- Câu hỏi cần làm rõ:`,
        pitfallsAndFixes: '',
        tags: [],
      },
      explain: {
        whatIsIt: '',
        whyItExists: '',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Nếu thay đổi điều kiện đầu vào hoặc giới hạn tài nguyên thì sao?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: `${tTitle.trim()} — Mechanism Diagram`,
        kind: 'Architecture',
        nodes: [
          { id: 'n1', type: 'box', x: 60, y: 70, w: 165, h: 64, label: 'Input / Trigger', color: '#EDEAE2' },
          { id: 'n2', type: 'box', x: 290, y: 70, w: 185, h: 64, label: tTitle.trim(), color: '#B99B79' },
        ],
        edges: [{ id: 'e1', fromX: 225, fromY: 102, toX: 290, toY: 102, label: 'flow', color: '#B99B79' }],
      },
      practice: {
        activeTaskId: 'pr_custom_1',
        tasks: [
          {
            id: 'pr_custom_1',
            level: 'Easy',
            title: `Thực hành cốt lõi: ${tTitle.trim()}`,
            prompt: 'Viết hàm minh họa hoặc triển khai lại cơ chế vừa học.',
            testCasesText: 'Kiểm chứng output đúng kỳ vọng.',
            starterJava: '// Viết code Java tại đây',
            starterJs: 'function solve() {\n  return true;\n}',
            referenceSolution: '// Solution mẫu',
            solutionNotes: '',
            jsVerifierFnBody: 'return solve() === true;',
          },
        ],
      },
      experiments: [],
      assessments: [],
      review: {
        weakConcepts: '',
        realProjectApplication: '',
        nextReviewDate: addDaysFromToday(3),
        intervalDays: 3,
        reviewCount: 0,
      },
    };
    setEnv((prev) => ({
      ...prev,
      topics: [...prev.topics, newTopic],
      activeTopicId: id,
      activeLevel: 'lesson',
      activeModule: 'theory',
    }));
    setTTitle('');
    setTSub('');
    setTDef('');
    setNewTopicOpen(false);
    showToast('Đã khởi tạo Lesson Workspace 8 bước');
  };

  // Run JS code safely inside browser sandbox
  const activeTask =
    activeTopic.practice.tasks.find((t) => t.id === activeTopic.practice.activeTaskId) ||
    activeTopic.practice.tasks[0] ||
    null;

  const currentCodeText = activeTask
    ? codeDraftByTask[`${activeTask.id}_${practiceLang}`] ??
      (practiceLang === 'js' ? activeTask.starterJs : activeTask.starterJava)
    : '';

  const runSandboxCode = () => {
    if (!activeTask) return;
    triggerHaptic('selection');
    if (practiceLang === 'java') {
      showToast('Chuyển sang tab JavaScript Sandbox để chạy kiểm thử trực tiếp trên trình duyệt!');
      return;
    }

    const logs: string[] = [];
    const customConsole = {
      log: (...args: unknown[]) =>
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
    };

    try {
      const verifier = activeTask.jsVerifierFnBody || 'return true;';
      const fn = new Function(
        'console',
        `"use strict";\n${currentCodeText}\n;\nreturn (function(){ ${verifier} })();`
      );
      const passed = Boolean(fn(customConsole));
      setRunOutput({
        status: passed ? 'pass' : 'fail',
        logs: [
          ...logs,
          passed
            ? '✓ TEST SUITE PASSED — Kết quả khớp toàn bộ kỳ vọng.'
            : '✗ TEST SUITE FAILED — Chưa khớp kỳ vọng, kiểm tra lại logic hoặc edge cases.',
        ],
      });
    } catch (err) {
      setRunOutput({
        status: 'error',
        logs: [...logs, `Runtime Error: ${err instanceof Error ? err.message : String(err)}`],
      });
    }
  };

  // ===========================================================================
  // TOP SWITCHER BAR: PROGRAMMING & AI vs OPERATING SYSTEMS KNOWLEDGE BASE
  // ===========================================================================
  const areaSwitcherBar = (
    <div
      className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
      style={{ borderColor: 'var(--os-border)' }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setCodeSubArea('programming');
          }}
          className="px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium cursor-pointer transition-colors"
          style={{
            backgroundColor: codeSubArea === 'programming' ? '#1E2129' : 'transparent',
            color: codeSubArea === 'programming' ? 'var(--os-ivory-bright)' : 'var(--os-ivory-muted)',
            border:
              codeSubArea === 'programming'
                ? '1px solid rgba(185, 155, 121, 0.45)'
                : '1px solid rgba(217, 213, 203, 0.1)',
          }}
        >
          {t('Programming', 'Lập trình')}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setCodeSubArea('os');
          }}
          className="px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium cursor-pointer transition-colors"
          style={{
            backgroundColor: codeSubArea === 'os' ? '#1E2129' : 'transparent',
            color: codeSubArea === 'os' ? 'var(--os-brass)' : 'var(--os-ivory-muted)',
            border:
              codeSubArea === 'os'
                ? '1px solid rgba(185, 155, 121, 0.45)'
                : '1px solid rgba(217, 213, 203, 0.1)',
          }}
        >
          {t('Operating Systems', 'Hệ điều hành')}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setCodeSubArea('networking');
          }}
          className="px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium cursor-pointer transition-colors"
          style={{
            backgroundColor: codeSubArea === 'networking' ? '#1E2129' : 'transparent',
            color: codeSubArea === 'networking' ? 'var(--os-dusty-blue)' : 'var(--os-ivory-muted)',
            border:
              codeSubArea === 'networking'
                ? '1px solid rgba(167, 182, 210, 0.45)'
                : '1px solid rgba(217, 213, 203, 0.1)',
          }}
        >
          {t('Computer Networking', 'Mạng máy tính')}
        </button>
      </div>
    </div>
  );

  if (codeSubArea === 'os') {
    return (
      <div className="space-y-6">
        {areaSwitcherBar}
        <OperatingSystemsLab
          initialTopicId={pendingOsTopicId}
          onConsumedInitialTopic={() => setPendingOsTopicId(null)}
        />
      </div>
    );
  }

  if (codeSubArea === 'networking') {
    return (
      <div className="space-y-6">
        {areaSwitcherBar}
        <NetworkingLab
          onJumpToOsTopic={(osTopicId) => {
            triggerHaptic('selection');
            setPendingOsTopicId(osTopicId);
            setCodeSubArea('os');
          }}
        />
      </div>
    );
  }

  // ===========================================================================
  // RENDER LEVEL 1 & 2: PROGRAMMING DIRECTORY (Overview + Subjects)
  // ===========================================================================
  if (env.activeLevel === 'directory') {
    const exposedCount = env.topics.filter((tp) => tp.understanding === 'exposed').length;
    const understoodCount = env.topics.filter((tp) => tp.understanding === 'understood').length;
    const appliedCount = env.topics.filter((tp) => tp.understanding === 'applied').length;
    const activeModMeta = LESSON_MODULES.find((m) => m.id === activeTopic.lastStudiedModule) || LESSON_MODULES[0];

    return (
      <div className="space-y-6">
        {areaSwitcherBar}

        {/* TOP STUDY SESSION BANNER — Unified Learning Continuum & Metrics Capsule */}
        <header
          aria-label="Resume Last Learning Session"
          className="rounded-xl border border-[#1f2530] bg-[#11141b]/95 backdrop-blur-md px-5 py-4"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openLesson(activeTopic)}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#f0f2f5] hover:bg-white text-[#0d0f14] font-semibold text-[13.5px] transition-all shadow-sm cursor-pointer"
              >
                <span>
                  {t(
                    `Resume Lesson (${activeModMeta.num} ${activeModMeta.label})`,
                    `Vào học tiếp (${activeModMeta.num} ${activeModMeta.label})`
                  )}
                </span>
                <span className="text-xs metadata text-[#0d0f14]">↗</span>
              </button>
              <button
                type="button"
                onClick={() => openLesson(activeTopic, 'explain')}
                className="inline-flex items-center px-3.5 py-2.5 rounded-lg bg-[#12161f] hover:bg-[#181d28] border border-[#272e3d] hover:border-[#384152] text-[#cbd5e1] hover:text-white font-medium text-[13.5px] transition-colors cursor-pointer"
              >
                {t('Self-Explain (03 Explain)', 'Tự giải thích (03 Explain)')}
              </button>
            </div>
          </div>
        </header>

        {/* LEVEL 2: SUBJECTS DIRECTORY (Java, C#, Web Core, AI Workflow, SQL, OS, Networking) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 pb-1">
            <div className="metadata text-[12.5px] tracking-wider text-[#cba86a] uppercase font-semibold">
              {t('PROGRAMMING SUBJECTS', 'DANH MỤC MÔN HỌC LẬP TRÌNH')}
            </div>
            <button
              type="button"
              onClick={() => setNewSubjectOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2b3343] hover:border-[#cba86a]/60 bg-[#12161f] hover:bg-[#181d28] text-[#cba86a] hover:text-[#faebd7] metadata text-[12px] uppercase tracking-wider font-semibold transition-all cursor-pointer"
            >
              <span className="text-base leading-none font-bold">+</span>
              <span>{t('NEW SUBJECT', 'THÊM MÔN HỌC')}</span>
            </button>
          </div>

          <div className="space-y-3">
            {env.subjects.map((subj) => {
              const list = env.topics.filter((tp) => tp.subjectId === subj.id);
              const applied = list.filter((tp) => tp.understanding === 'applied').length;
              const understood = list.filter((tp) => tp.understanding === 'understood').length;
              return (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => openSubject(subj.id)}
                  className="group relative w-full bg-[#12151c] hover:bg-[#161a23] border border-[#222834] hover:border-[#384152] rounded-xl px-6 py-5 transition-all duration-200 glow-gold-hover text-left cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center flex-wrap gap-3">
                        <span className="metadata text-[12px] font-bold text-[#cba86a] tracking-wider">
                          {subj.code}
                        </span>
                        <h3 className="text-[20px] font-bold text-white tracking-tight group-hover:text-[#f3f4f6]">
                          {subj.title}
                        </h3>
                        <span className="metadata text-[11.5px] text-[#9ca3af] bg-[#1a1f29] px-2.5 py-0.5 rounded-full border border-[#262e3d]">
                          {list.length} {t('topics', 'chủ đề')}
                        </span>
                      </div>
                      <p className="text-[14px] text-[#9ca3af] group-hover:text-[#cbd5e1] transition-colors">
                        {subj.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#1f2532]">
                      <div className="flex items-center gap-3 metadata text-[12.5px]">
                        {understood > 0 && (
                          <span className="inline-flex items-center text-[#cba86a] font-semibold">
                            <span className="w-2 h-2 rounded-full bg-[#cba86a] mr-2" />
                            {understood} {t('Understood', 'Đã hiểu')}
                          </span>
                        )}
                        {applied > 0 && (
                          <span className="inline-flex items-center text-emerald-400 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_#34d399]" />
                            {applied} {t('Applied', 'Thực hành')}
                          </span>
                        )}
                        {understood === 0 && applied === 0 && (
                          <span className="inline-flex items-center text-[#9ca3af] font-medium">
                            <span className="w-2 h-2 rounded-full bg-[#64748b] mr-2" />
                            {t('Exposed only', 'Mới tiếp xúc')}
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a202c] group-hover:bg-[#cba86a] text-[#faebd7] group-hover:text-[#0c0f13] border border-[#2e3747] group-hover:border-transparent font-medium text-[13.5px] transition-all">
                        <span>{t('Open Subject', 'Mở môn học')}</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Dedicated Entry: Operating Systems Knowledge Base */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setCodeSubArea('os');
              }}
              className="group relative w-full bg-[#12151c] hover:bg-[#161a23] border border-[#222834] hover:border-[#384152] rounded-xl px-6 py-5 transition-all duration-200 glow-gold-hover text-left cursor-pointer"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center flex-wrap gap-3">
                    <span className="metadata text-[12px] font-bold text-emerald-400 tracking-wider">
                      CS.OS
                    </span>
                    <h3 className="text-[20px] font-bold text-white tracking-tight group-hover:text-[#f3f4f6]">
                      {t('Operating Systems — Knowledge Base', 'Hệ điều hành — Knowledge Base')}
                    </h3>
                    <span className="metadata text-[11.5px] text-[#9ca3af] bg-[#1a1f29] px-2.5 py-0.5 rounded-full border border-[#262e3d]">
                      {t('12 modules · 60+ topics', '12 chương · 60+ chủ đề')}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#9ca3af] group-hover:text-[#cbd5e1] transition-colors">
                    Kernel, Process, Threads, Scheduling, Synchronization, Memory, File Systems, I/O, Storage, Security &amp; Virtualization.
                  </p>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#1f2532]">
                  <span className="metadata text-[12px] text-[#a7b6d2]">Knowledge Graph · Flashcards</span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a202c] group-hover:bg-[#cba86a] text-[#faebd7] group-hover:text-[#0c0f13] border border-[#2e3747] group-hover:border-transparent font-medium text-[13.5px] transition-all">
                    <span>{t('Open OS KB', 'Mở kho OS')}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>
            </button>

            {/* Dedicated Entry: Computer Networking Knowledge Base */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setCodeSubArea('networking');
              }}
              className="group relative w-full bg-[#12151c] hover:bg-[#161a23] border border-[#222834] hover:border-[#384152] rounded-xl px-6 py-5 transition-all duration-200 glow-gold-hover text-left cursor-pointer"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center flex-wrap gap-3">
                    <span className="metadata text-[12px] font-bold text-[#a7b6d2] tracking-wider">
                      CS.NET
                    </span>
                    <h3 className="text-[20px] font-bold text-white tracking-tight group-hover:text-[#f3f4f6]">
                      {t('Computer Networking — Knowledge Base', 'Mạng máy tính — Knowledge Base')}
                    </h3>
                    <span className="metadata text-[11.5px] text-[#9ca3af] bg-[#1a1f29] px-2.5 py-0.5 rounded-full border border-[#262e3d]">
                      {t('14 modules · 70+ topics', '14 chương · 70+ chủ đề')}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#9ca3af] group-hover:text-[#cbd5e1] transition-colors">
                    OSI/TCP-IP, Subnetting, Routing, TCP/UDP/QUIC, DNS, HTTP/3, Security, Sockets, Cloud VPC &amp; Kubernetes Networking.
                  </p>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#1f2532]">
                  <span className="metadata text-[12px] text-emerald-400">Packet Lab · Topology Sim</span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a202c] group-hover:bg-[#a7b6d2] text-[#faebd7] group-hover:text-[#0c0f13] border border-[#2e3747] group-hover:border-transparent font-medium text-[13.5px] transition-all">
                    <span>{t('Open Network KB', 'Mở kho Mạng')}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* BOTTOM QUEUE INDICATORS & INTERACTIVE DRAWER */}
        <footer className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f1218] border border-[#1e2430]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#cba86a]" />
                <span className="metadata text-[12px] tracking-wider text-[#cbd5e1] uppercase font-semibold">
                  {t('REVIEW & RETRIEVAL QUEUE', 'HÀNG ĐỢI ÔN TẬP & TRUY XUẤT')}
                </span>
              </div>
              <span className="metadata text-[12px] text-[#9ca3af] bg-[#1a1f2a] px-3 py-1 rounded-md border border-[#262f3f]">
                {dueReviewTopics.length} {t('due', 'đến hạn')}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f1218] border border-[#1e2430]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="metadata text-[12px] tracking-wider text-[#cbd5e1] uppercase font-semibold">
                  {t('PARALLEL DISCIPLINES', 'CHUYÊN ĐỀ SONG SONG')}
                </span>
              </div>
              <span className="metadata text-[12px] text-[#9ca3af] bg-[#1a1f2a] px-3 py-1 rounded-md border border-[#262f3f]">
                {t('3 active', '3 đang chạy')}
              </span>
            </div>
          </div>

          {dueReviewTopics.length > 0 && (
            <div className="rounded-xl bg-[#0f1218] border border-[#1e2430] divide-y divide-[#1b2029]">
              {dueReviewTopics.slice(0, 4).map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => openLesson(topic, 'review')}
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#161a23] cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium truncate text-[#e1e4ea]">{topic.title}</p>
                    <p className="text-[11.5px] truncate text-[#6b7280]">
                      {t('Due', 'Đến hạn')} {topic.review.nextReviewDate} · {t('Click for retrieval practice', 'Nhấn để tự kiểm tra từ trí nhớ')}
                    </p>
                  </div>
                  <span className="metadata text-[11px] shrink-0 text-[#cba86a]">{t('Review →', 'Ôn tập →')}</span>
                </button>
              ))}
            </div>
          )}
        </footer>

        {/* MODAL: NEW SUBJECT */}
        <Modal open={newSubjectOpen} onClose={() => setNewSubjectOpen(false)} title={t('Create Programming Subject', 'Tạo Môn Học Lập Trình')}>
          <form onSubmit={handleAddSubject} className="space-y-3">
            <input
              type="text"
              required
              value={sTitle}
              onChange={(e) => setSTitle(e.target.value)}
              placeholder={t('Subject name (e.g. System Design, Spring Boot, Docker)...', 'Tên môn học (vd: System Design, Spring Boot, Docker)...')}
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14.5px]"
            />
            <input
              type="text"
              value={sSub}
              onChange={(e) => setSSub(e.target.value)}
              placeholder={t('Research focus (e.g. Caching · Message Queue · Load Balancing)...', 'Trọng tâm nghiên cứu (vd: Caching · Message Queue · Load Balancing)...')}
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[13.5px]"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-[10px] text-[13.5px] font-semibold cursor-pointer"
              style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
            >
              {t('Create New Subject', 'Tạo môn học mới')}
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  // ===========================================================================
  // RENDER LEVEL 3: SUBJECT WORKSPACE (Syllabus & Topics)
  // ===========================================================================
  if (env.activeLevel === 'subject') {
    const grouped = new Map<string, LessonTopic[]>();
    subjectTopics.forEach((t) => {
      const grp = t.moduleGroup || '01 · Core';
      grouped.set(grp, [...(grouped.get(grp) || []), t]);
    });

    return (
      <div className="space-y-8">
        {/* Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--os-border)]">
          <div className="flex items-center gap-2 metadata text-[11px] uppercase tracking-[0.1em]">
            <button
              type="button"
              onClick={() => setEnv((prev) => ({ ...prev, activeLevel: 'directory' }))}
              className="hover:underline cursor-pointer"
              style={{ color: 'var(--os-ivory-muted)' }}
            >
              ← Programming
            </button>
            <span style={{ color: 'var(--os-ivory-faint)' }}>/</span>
            <span style={{ color: 'var(--os-brass)' }}>{activeSubject.title}</span>
          </div>

          <button
            type="button"
            onClick={() => setNewTopicOpen(true)}
            className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
          >
            + New Topic Lesson
          </button>
        </div>

        {/* Subject Header */}
        <div className="space-y-1">
          <span className="metadata text-[10.5px] uppercase tracking-[0.14em]" style={{ color: activeSubject.accent }}>
            {activeSubject.code}
          </span>
          <h2 className="editorial-h1">{activeSubject.title}</h2>
        </div>

        {/* Curriculum List grouped by Module */}
        {subjectTopics.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[var(--os-border)] rounded-[12px] space-y-3">
            <p className="text-[14px]" style={{ color: 'var(--os-ivory-muted)' }}>
              Môn học này chưa có bài giảng nào.
            </p>
            <button
              type="button"
              onClick={() => setNewTopicOpen(true)}
              className="px-4 py-2 rounded-[9px] text-[13px] font-medium cursor-pointer"
              style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
            >
              + Tạo chủ đề đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-7">
            {Array.from(grouped.entries()).map(([groupName, list]) => (
              <div key={groupName} className="space-y-2">
                <span className="metadata text-[10.5px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-dusty-blue)' }}>
                  {groupName}
                </span>

                <div className="divide-y divide-[var(--os-border)] border-y border-[var(--os-border)]">
                  {list.map((topic) => {
                    const uMeta = UNDERSTANDING_META[topic.understanding];
                    const modMeta = LESSON_MODULES.find((m) => m.id === topic.lastStudiedModule) || LESSON_MODULES[0];
                    return (
                      <div
                        key={topic.id}
                        onClick={() => openLesson(topic)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') openLesson(topic);
                        }}
                        className="py-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[rgba(217,213,203,0.025)] transition-colors group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: uMeta.color }}
                            />
                            <h3 className="text-[16px] font-medium group-hover:text-white" style={{ color: 'var(--os-ivory-bright)' }}>
                              {topic.title}
                            </h3>
                          </div>
                          <p className="text-[12.5px] pl-4.5 truncate" style={{ color: 'var(--os-ivory-muted)' }}>
                            {topic.subtitle}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 pl-4 sm:pl-0">
                          <span className="metadata text-[10.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
                            Last: {modMeta.num} {modMeta.label}
                          </span>
                          <span
                            className="metadata text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[5px]"
                            style={{
                              backgroundColor: 'rgba(27,29,34,0.9)',
                              color: uMeta.color,
                              border: '1px solid var(--os-border)',
                            }}
                          >
                            {uMeta.label}
                          </span>
                          <span className="metadata text-[12px] group-hover:translate-x-1 transition-transform" style={{ color: 'var(--os-brass)' }}>
                            Study →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: New Topic */}
        <Modal open={newTopicOpen} onClose={() => setNewTopicOpen(false)} title={`New Topic in ${activeSubject.title}`}>
          <form onSubmit={handleAddTopic} className="space-y-3">
            <input
              type="text"
              required
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              placeholder="Tên bài học (vd: Java ConcurrentHashMap, Spring DI Container)..."
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14.5px]"
            />
            <input
              type="text"
              value={tGroup}
              onChange={(e) => setTGroup(e.target.value)}
              placeholder="Nhóm chương trình (vd: 03 · Concurrency)"
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[13px]"
            />
            <input
              type="text"
              value={tSub}
              onChange={(e) => setTSub(e.target.value)}
              placeholder="Các khái niệm chính (vd: CAS · Lock Striping · Volatile)..."
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[13px]"
            />
            <textarea
              rows={3}
              value={tDef}
              onChange={(e) => setTDef(e.target.value)}
              placeholder="Định nghĩa ban đầu (có thể bổ sung chi tiết trong Theory Workspace)..."
              className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[13px]"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-[10px] text-[13.5px] font-semibold cursor-pointer"
              style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
            >
              Mở Lesson Workspace
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  // ===========================================================================
  // RENDER LEVEL 4: LESSON WORKSPACE (8 Modules · Dreams of Code × Inkwell)
  // ===========================================================================
  const uMeta = UNDERSTANDING_META[activeTopic.understanding];

  return (
    <div
      className="rounded-[14px] overflow-hidden flex flex-col"
      style={{
        backgroundColor: '#101114',
        border: '1px solid var(--os-border)',
        minHeight: '760px',
      }}
    >
      {/* TOP BAR (Dreams of Code Breadcrumbs + Understanding Calibration) */}
      <header
        className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3"
        style={{
          backgroundColor: '#13151A',
          borderBottom: '1px solid var(--os-border)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <button
            type="button"
            onClick={() => setLessonSidebarOpen((o) => !o)}
            title="Ẩn/Hiện danh sách bài học"
            className="w-7 h-7 rounded-[6px] flex items-center justify-center cursor-pointer hover:bg-white/5"
            style={{ color: 'var(--os-ivory-muted)', border: '1px solid var(--os-border)' }}
          >
            ◧
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 metadata text-[10.5px] flex-wrap">
            <button
              type="button"
              onClick={() => setEnv((p) => ({ ...p, activeLevel: 'directory' }))}
              className="hover:underline cursor-pointer"
              style={{ color: 'var(--os-ivory-faint)' }}
            >
              PROGRAMMING
            </button>
            <span style={{ color: 'var(--os-ivory-faint)' }}>/</span>
            <button
              type="button"
              onClick={() => setEnv((p) => ({ ...p, activeLevel: 'subject' }))}
              className="hover:underline cursor-pointer"
              style={{ color: 'var(--os-ivory-muted)' }}
            >
              {activeSubject.title.toUpperCase()}
            </button>
            <span style={{ color: 'var(--os-ivory-faint)' }}>/</span>
            <span style={{ color: 'var(--os-brass)' }}>{activeTopic.title}</span>
          </nav>
        </div>

        {/* Honest 3-State Mastery Calibration (Exposed -> Understood -> Applied) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center rounded-[8px] p-0.5"
            style={{ backgroundColor: '#191B21', border: '1px solid var(--os-border)' }}
            title="Phân biệt: Đã đọc (Exposed) vs Tự giải thích được (Understood) vs Tự code được (Applied)"
          >
            {(['exposed', 'understood', 'applied'] as const).map((st) => {
              const active = activeTopic.understanding === st;
              const m = UNDERSTANDING_META[st];
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    updateActiveTopic((t) => ({ ...t, understanding: st }));
                    showToast(`Cập nhật mức hiểu: ${m.label} (${m.vi})`);
                  }}
                  className="px-2.5 py-1 rounded-[6px] metadata text-[10px] uppercase tracking-[0.06em] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: active ? '#282B34' : 'transparent',
                    color: active ? m.color : 'var(--os-ivory-faint)',
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          <span className="metadata text-[9.5px] hidden sm:inline" style={{ color: 'var(--os-sage)' }}>
            ● SAVED
          </span>
        </div>
      </header>

      {/* 8-MODULE NAVIGATION STRIP (01 Theory -> 08 Review) */}
      <nav
        aria-label="Lesson Modules"
        className="flex items-center overflow-x-auto no-scrollbar border-b px-3"
        style={{
          backgroundColor: '#121418',
          borderColor: 'var(--os-border)',
        }}
      >
        {LESSON_MODULES.map((m) => {
          const active = env.activeModule === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => switchLessonModule(m.id)}
              className="px-3.5 py-2.5 shrink-0 flex items-center gap-2 text-left transition-colors cursor-pointer hover:bg-white/[0.02]"
              style={{
                borderBottom: active ? '2px solid var(--os-brass)' : '2px solid transparent',
              }}
            >
              <span
                className="metadata text-[10px]"
                style={{ color: active ? 'var(--os-brass)' : 'var(--os-ivory-faint)' }}
              >
                {m.num}
              </span>
              <span
                className="text-[12.5px] font-medium"
                style={{ color: active ? 'var(--os-ivory-bright)' : 'var(--os-ivory-muted)' }}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* MAIN WORKSPACE BODY (Optional Collapsible Sidebar + Active Module Canvas) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {lessonSidebarOpen && (
          <aside
            className="w-full lg:w-[240px] shrink-0 p-4 space-y-5 border-b lg:border-b-0 lg:border-r"
            style={{ backgroundColor: '#121418', borderColor: 'var(--os-border)' }}
          >
            <div className="space-y-1">
              <span className="metadata text-[9.5px] uppercase tracking-[0.12em]" style={{ color: activeSubject.accent }}>
                {activeSubject.title}
              </span>
              <p className="text-[12px]" style={{ color: 'var(--os-ivory-muted)' }}>
                {subjectTopics.length} lessons · Click để chuyển nhanh
              </p>
            </div>

            <div className="space-y-1">
              {subjectTopics.map((tp) => {
                const isCur = tp.id === activeTopic.id;
                const um = UNDERSTANDING_META[tp.understanding];
                return (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => openLesson(tp, env.activeModule)}
                    className="w-full px-2.5 py-2 rounded-[7px] text-left flex items-start gap-2 transition-colors cursor-pointer"
                    style={{
                      backgroundColor: isCur ? '#1C1E24' : 'transparent',
                      borderLeft: isCur ? '2px solid var(--os-brass)' : '2px solid transparent',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: um.color }}
                    />
                    <span
                      className="text-[12.5px] leading-snug"
                      style={{
                        color: isCur ? 'var(--os-ivory-bright)' : 'var(--os-ivory-muted)',
                        fontWeight: isCur ? 500 : 400,
                      }}
                    >
                      {tp.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* ACTIVE LESSON MODULE VIEWPORT */}
        <div className="flex-1 p-5 sm:p-8 overflow-y-auto">
          {/* ---------------------------------------------------------------
              01 — THEORY (Structured Reading + Internal Mechanism + Code)
              --------------------------------------------------------------- */}
          {env.activeModule === 'theory' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">
              {/* Left Reading Column (7 cols) */}
              <div className="xl:col-span-7 space-y-6">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--os-border)]">
                  <div className="space-y-1.5">
                    <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
                      01 // THEORY · {activeTopic.moduleGroup.toUpperCase()}
                    </span>
                    <h2 className="font-editorial-vi text-[26px] sm:text-[30px] leading-tight" style={{ color: 'var(--os-ivory-bright)' }}>
                      {activeTopic.title}
                    </h2>
                    <p className="text-[13.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                      {activeTopic.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingTheory((v) => !v)}
                    className="metadata text-[10.5px] px-2.5 py-1 rounded-[6px] shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: editingTheory ? 'var(--os-brass)' : '#1B1D22',
                      color: editingTheory ? '#101114' : 'var(--os-ivory)',
                      border: '1px solid var(--os-border)',
                    }}
                  >
                    {editingTheory ? 'Xong' : 'Chỉnh sửa'}
                  </button>
                </div>

                {editingTheory ? (
                  <div className="space-y-4">
                    {(
                      [
                        ['definition', 'Definition — Khái niệm là gì?'],
                        ['why', 'Why — Tại sao nó tồn tại?'],
                        ['how', 'How — Cơ chế tổng quan?'],
                      ] as const
                    ).map(([field, lbl]) => (
                      <div key={field} className="space-y-1">
                        <label className="metadata text-[10px] uppercase" style={{ color: 'var(--os-brass)' }}>
                          {lbl}
                        </label>
                        <textarea
                          rows={3}
                          value={activeTopic.theory[field]}
                          onChange={(e) =>
                            updateActiveTopic((t) => ({
                              ...t,
                              theory: { ...t.theory, [field]: e.target.value },
                            }))
                          }
                          className="w-full p-3 rounded-[9px] text-[13.5px] bg-[#16181D] border border-[var(--os-border)] text-[#EDEAE2]"
                        />
                      </div>
                    ))}
                    <div className="space-y-1">
                      <label className="metadata text-[10px] uppercase" style={{ color: 'var(--os-brass)' }}>
                        Code Example
                      </label>
                      <textarea
                        rows={8}
                        value={activeTopic.theory.codeExample}
                        onChange={(e) =>
                          updateActiveTopic((t) => ({
                            ...t,
                            theory: { ...t.theory, codeExample: e.target.value },
                          }))
                        }
                        className="w-full p-3 rounded-[9px] font-mono text-[12.5px] bg-[#0D0E11] border border-[var(--os-border)] text-[#EDEAE2]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-dusty-blue)' }}>
                        Definition · Khái niệm
                      </span>
                      <p className="text-[14.5px] leading-[1.72]" style={{ color: 'var(--os-ivory-bright)' }}>
                        {activeTopic.theory.definition}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-[var(--os-border)]">
                      <div className="space-y-1.5">
                        <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                          Why · Tại sao cần nó?
                        </span>
                        <p className="text-[13.5px] leading-[1.68]" style={{ color: 'var(--os-ivory-muted)' }}>
                          {activeTopic.theory.why}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-sage)' }}>
                          How · Cách hoạt động
                        </span>
                        <p className="text-[13.5px] leading-[1.68]" style={{ color: 'var(--os-ivory-muted)' }}>
                          {activeTopic.theory.how}
                        </p>
                      </div>
                    </div>

                    {/* Internal Mechanism */}
                    <div className="space-y-3 pt-4 border-t border-[var(--os-border)]">
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                        Internal Mechanism · Cơ chế bên trong
                      </span>
                      <div className="space-y-2.5 pl-3 border-l border-[var(--os-border)]">
                        {activeTopic.theory.internalMechanism.map((step, i) => (
                          <p key={i} className="text-[13.5px] leading-[1.68]" style={{ color: 'var(--os-ivory)' }}>
                            {step}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Trade-offs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--os-border)]">
                      <div className="space-y-1.5">
                        <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-sage)' }}>
                          Advantages · Ưu điểm
                        </span>
                        <ul className="space-y-1 text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                          {activeTopic.theory.tradeOffs.pros.map((p, i) => (
                            <li key={i}>+ {p}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-1.5">
                        <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-crimson)' }}>
                          Trade-offs · Hạn chế
                        </span>
                        <ul className="space-y-1 text-[13px]" style={{ color: 'var(--os-ivory-muted)' }}>
                          {activeTopic.theory.tradeOffs.cons.map((c, i) => (
                            <li key={i}>− {c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Common Misconceptions */}
                    <div className="space-y-2 pt-4 border-t border-[var(--os-border)]">
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-crimson)' }}>
                        Common Misconceptions · Hiểu lầm cần tránh
                      </span>
                      <div className="space-y-2">
                        {activeTopic.theory.misconceptions.map((m, i) => (
                          <p
                            key={i}
                            className="text-[13px] leading-relaxed p-3 rounded-[8px]"
                            style={{ backgroundColor: '#15171C', border: '1px solid var(--os-border)', color: 'var(--os-ivory)' }}
                          >
                            {m}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* References */}
                    {activeTopic.theory.references.length > 0 && (
                      <div className="pt-3 flex flex-wrap items-center gap-3">
                        <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-ivory-faint)' }}>
                          References:
                        </span>
                        {activeTopic.theory.references.map((ref, i) => (
                          <a
                            key={i}
                            href={ref.url}
                            target="_blank"
                            rel="noreferrer"
                            className="metadata text-[11px] hover:underline"
                            style={{ color: 'var(--os-dusty-blue)' }}
                          >
                            {ref.label} ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Code Example & Quick Actions (5 cols — Dreams of Code Split Layout) */}
              <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-4">
                <div
                  className="rounded-[12px] overflow-hidden"
                  style={{ backgroundColor: '#0B0C0F', border: '1px solid var(--os-border)' }}
                >
                  <div
                    className="px-4 py-2.5 flex items-center justify-between border-b"
                    style={{ backgroundColor: '#14161B', borderColor: 'var(--os-border)' }}
                  >
                    <span className="metadata text-[10.5px] uppercase" style={{ color: 'var(--os-brass)' }}>
                      {activeTopic.theory.codeLanguage || 'CODE'} · MECHANISM TRACE
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(activeTopic.theory.codeExample);
                        showToast('Đã copy đoạn code minh họa');
                      }}
                      className="metadata text-[10px] px-2 py-0.5 rounded-[5px] hover:bg-white/10 cursor-pointer"
                      style={{ color: 'var(--os-ivory-muted)' }}
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-4 text-[12.5px] font-mono leading-[1.65] overflow-x-auto" style={{ color: '#EDEAE2' }}>
                    <code>{activeTopic.theory.codeExample}</code>
                  </pre>
                </div>

                {/* Next Meaningful Learning Loop CTA */}
                <div
                  className="p-4 rounded-[12px] space-y-3"
                  style={{ backgroundColor: '#15171C', border: '1px solid var(--os-border)' }}
                >
                  <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-ivory-faint)' }}>
                    NEXT IN LEARNING CYCLE
                  </span>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                    Đọc xong lý thuyết chỉ mới ở mức <strong>Exposed</strong>. Để thật sự hiểu, hãy đóng tài liệu lại và thử tự giải thích bằng lời hoặc viết code thử nghiệm.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => switchLessonModule('explain')}
                      className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
                      style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
                    >
                      03 Explain (Self-Test) →
                    </button>
                    <button
                      type="button"
                      onClick={() => switchLessonModule('practice')}
                      className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
                      style={{ backgroundColor: '#1E2027', color: 'var(--os-ivory)', border: '1px solid var(--os-border)' }}
                    >
                      05 Practice Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              02 — NOTES (Inkwell-style Markdown Knowledge Workspace)
              --------------------------------------------------------------- */}
          {env.activeModule === 'notes' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--os-border)]">
                <div>
                  <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
                    02 // NOTES · MARKDOWN KNOWLEDGE WORKSPACE
                  </span>
                  <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
                    Không chép lại Theory. Hãy tóm tắt bằng ngôn ngữ của bạn, lưu code snippet, bảng so sánh & lỗi hay gặp.
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded-[8px] p-0.5" style={{ backgroundColor: '#16181D', border: '1px solid var(--os-border)' }}>
                  {(['split', 'edit', 'preview'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNotesMode(m)}
                      className="px-2.5 py-1 rounded-[6px] metadata text-[10.5px] uppercase cursor-pointer"
                      style={{
                        backgroundColor: notesMode === m ? '#282B34' : 'transparent',
                        color: notesMode === m ? 'var(--os-brass)' : 'var(--os-ivory-muted)',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`grid grid-cols-1 ${notesMode === 'split' ? 'lg:grid-cols-2' : ''} gap-5`}>
                {notesMode !== 'preview' && (
                  <textarea
                    rows={16}
                    value={activeTopic.notes.markdown}
                    onChange={(e) =>
                      updateActiveTopic((t) => ({
                        ...t,
                        notes: { ...t.notes, markdown: e.target.value },
                      }))
                    }
                    placeholder="Viết Markdown tại đây (# Tiêu đề, - Danh sách, **in đậm**, `code`, ```java ... ```, | Bảng |)..."
                    className="w-full p-4 rounded-[10px] font-mono text-[13px] leading-[1.7] resize-y"
                    style={{
                      backgroundColor: '#0D0E11',
                      border: '1px solid var(--os-border)',
                      color: 'var(--os-ivory)',
                    }}
                  />
                )}

                {notesMode !== 'edit' && (
                  <div
                    className="p-5 rounded-[10px] overflow-y-auto max-h-[480px]"
                    style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}
                  >
                    <MarkdownNotesPreview markdown={activeTopic.notes.markdown} />
                  </div>
                )}
              </div>

              {/* Pitfalls & Related Topics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 border-t border-[var(--os-border)]">
                <div className="lg:col-span-7 space-y-1.5">
                  <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-crimson)' }}>
                    Bug & Pitfalls Log · Lỗi hay gặp & Cách khắc phục
                  </span>
                  <textarea
                    rows={3}
                    value={activeTopic.notes.pitfallsAndFixes}
                    onChange={(e) =>
                      updateActiveTopic((t) => ({
                        ...t,
                        notes: { ...t.notes, pitfallsAndFixes: e.target.value },
                      }))
                    }
                    placeholder="Ghi lại lỗi thực tế từng gặp với chủ đề này và cách sửa dứt điểm..."
                    className="w-full p-3 rounded-[9px] text-[13px] leading-relaxed"
                    style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)', color: 'var(--os-ivory)' }}
                  />
                </div>

                <div className="lg:col-span-5 space-y-2">
                  <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-dusty-blue)' }}>
                    Linked Topics · Liên kết kiến thức
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeTopic.relatedTopicIds.map((rid) => {
                      const rel = env.topics.find((x) => x.id === rid);
                      if (!rel) return null;
                      return (
                        <button
                          key={rid}
                          type="button"
                          onClick={() => openLesson(rel, 'theory')}
                          className="px-3 py-1.5 rounded-[8px] text-[12px] cursor-pointer hover:border-[var(--os-brass)]"
                          style={{
                            backgroundColor: '#16181D',
                            border: '1px solid var(--os-border)',
                            color: 'var(--os-ivory)',
                          }}
                        >
                          ↗ {rel.title}
                        </button>
                      );
                    })}
                    {activeTopic.relatedTopicIds.length === 0 && (
                      <p className="text-[12px]" style={{ color: 'var(--os-ivory-faint)' }}>
                        Chưa gắn liên kết bài học khác.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              03 — EXPLAIN (Pure Feynman Retrieval Practice · NO AI Chatbot)
              --------------------------------------------------------------- */}
          {env.activeModule === 'explain' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--os-border)]">
                <div>
                  <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
                    03 // EXPLAIN FROM MEMORY · FEYNMAN RETRIEVAL
                  </span>
                  <h3 className="font-editorial text-[22px] mt-1" style={{ color: 'var(--os-ivory-bright)' }}>
                    Tự diễn giải lại {activeTopic.title}
                  </h3>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
                    Đừng nhìn tài liệu gốc. Tự tái hiện câu trả lời từ trí nhớ, sau đó bấm <strong>Reveal Reference</strong> để tự soi lại lỗ hổng.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setRevealRef((r) => !r);
                  }}
                  className="px-4 py-2 rounded-[9px] text-[12.5px] font-semibold cursor-pointer"
                  style={{
                    backgroundColor: revealRef ? 'var(--os-brass)' : '#1E2027',
                    color: revealRef ? '#101114' : 'var(--os-ivory-bright)',
                    border: '1px solid var(--os-border)',
                  }}
                >
                  {revealRef ? 'Ẩn Reference Comparison' : 'Reveal Reference Comparison ↗'}
                </button>
              </div>

              <div className={`grid grid-cols-1 ${revealRef ? 'xl:grid-cols-12' : ''} gap-6 items-start`}>
                <div className={`${revealRef ? 'xl:col-span-7' : ''} space-y-4`}>
                  {(
                    [
                      ['whatIsIt', '1. What is it? — Nó là gì (bằng ngôn ngữ đời thường)?'],
                      ['whyItExists', '2. Why does it exist? — Tại sao ta không dùng giải pháp đơn giản hơn?'],
                      ['howItWorks', '3. How does it work? — Luồng vận hành từ đầu đến cuối?'],
                      ['whatHappensInternally', '4. What happens internally? — Chi tiết bên trong bộ nhớ / thuật toán?'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field} className="space-y-1.5">
                      <label className="metadata text-[10.5px] uppercase tracking-[0.06em]" style={{ color: 'var(--os-dusty-blue)' }}>
                        {label}
                      </label>
                      <textarea
                        rows={3}
                        value={activeTopic.explain[field]}
                        onChange={(e) =>
                          updateActiveTopic((t) => ({
                            ...t,
                            explain: { ...t.explain, [field]: e.target.value },
                          }))
                        }
                        placeholder="Đóng tài liệu và viết lời giải thích của riêng bạn..."
                        className="w-full p-3.5 rounded-[9px] text-[13.5px] leading-relaxed"
                        style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)', color: 'var(--os-ivory)' }}
                      />
                    </div>
                  ))}

                  {/* What if...? */}
                  <div className="p-4 rounded-[10px] space-y-2" style={{ backgroundColor: '#15171C', border: '1px solid rgba(185,155,121,0.3)' }}>
                    <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-brass)' }}>
                      5. What if...? — Tình huống giả định
                    </span>
                    <p className="text-[13.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                      {activeTopic.explain.whatIfScenarioPrompt}
                    </p>
                    <textarea
                      rows={3}
                      value={activeTopic.explain.whatIfAnswer}
                      onChange={(e) =>
                        updateActiveTopic((t) => ({
                          ...t,
                          explain: { ...t.explain, whatIfAnswer: e.target.value },
                        }))
                      }
                      placeholder="Suy luận hệ quả nếu điều kiện thay đổi..."
                      className="w-full p-3 rounded-[8px] text-[13px] bg-[#0D0E11] border border-[var(--os-border)] text-[#EDEAE2]"
                    />
                  </div>

                  {/* Self check */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !activeTopic.explain.canExplainWithoutLooking;
                        updateActiveTopic((t) => ({
                          ...t,
                          understanding: nextVal && t.understanding === 'exposed' ? 'understood' : t.understanding,
                          explain: { ...t.explain, canExplainWithoutLooking: nextVal },
                        }));
                        if (nextVal) showToast('Tuyệt vời — Chuyển mức hiểu lên Understood');
                      }}
                      className="px-4 py-2 rounded-[9px] text-[13px] font-medium flex items-center gap-2.5 cursor-pointer"
                      style={{
                        backgroundColor: activeTopic.explain.canExplainWithoutLooking
                          ? 'rgba(155, 170, 152, 0.16)'
                          : '#181A20',
                        color: activeTopic.explain.canExplainWithoutLooking
                          ? 'var(--os-sage)'
                          : 'var(--os-ivory)',
                        border: '1px solid var(--os-border)',
                      }}
                    >
                      <span>{activeTopic.explain.canExplainWithoutLooking ? '✓' : '○'}</span>
                      <span>Tôi có thể giải thích trôi chảy không cần nhìn tài liệu</span>
                    </button>
                  </div>
                </div>

                {/* Reveal Reference Comparison Panel */}
                {revealRef && (
                  <aside
                    className="xl:col-span-5 p-5 rounded-[12px] space-y-4 xl:sticky xl:top-4"
                    style={{ backgroundColor: '#15171D', border: '1px solid rgba(185,155,121,0.4)' }}
                  >
                    <div className="flex items-center justify-between border-b border-[var(--os-border)] pb-2.5">
                      <span className="metadata text-[10.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                        REFERENCE COMPARISON · ĐỐI CHIẾU GỐC
                      </span>
                    </div>

                    <div className="space-y-3 text-[13px] leading-relaxed">
                      <div>
                        <span className="metadata text-[9.5px] uppercase block" style={{ color: 'var(--os-dusty-blue)' }}>Definition</span>
                        <p style={{ color: 'var(--os-ivory)' }}>{activeTopic.theory.definition}</p>
                      </div>
                      <div>
                        <span className="metadata text-[9.5px] uppercase block" style={{ color: 'var(--os-sage)' }}>Internal Steps</span>
                        <ul className="space-y-1.5 mt-1" style={{ color: 'var(--os-ivory-muted)' }}>
                          {activeTopic.theory.internalMechanism.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--os-border)] space-y-1.5">
                      <span className="metadata text-[9.5px] uppercase" style={{ color: 'var(--os-crimson)' }}>
                        Lỗ hổng phát hiện sau khi đối chiếu (Gap Notes)
                      </span>
                      <textarea
                        rows={3}
                        value={activeTopic.explain.selfGapNotes}
                        onChange={(e) =>
                          updateActiveTopic((t) => ({
                            ...t,
                            explain: { ...t.explain, selfGapNotes: e.target.value },
                          }))
                        }
                        placeholder="Phần nào bạn quên hoặc giải thích còn mơ hồ?"
                        className="w-full p-2.5 rounded-[8px] text-[12.5px] bg-[#0D0E11] border border-[var(--os-border)] text-[#EDEAE2]"
                      />
                    </div>
                  </aside>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              04 — VISUALIZE (Interactive Mechanism & Memory Diagram)
              --------------------------------------------------------------- */}
          {env.activeModule === 'visualize' && (
            <div className="space-y-4">
              <div>
                <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
                  04 // VISUALIZE MECHANISM · BẢNG VẼ TƯ DUY
                </span>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
                  Tự vẽ lại sơ đồ bộ nhớ (Stack/Heap), cấu trúc dữ liệu (Buckets/Nodes) hoặc luồng xử lý của <strong>{activeTopic.title}</strong>.
                </p>
              </div>
              <LessonVisualizeCanvas
                diagram={activeTopic.visualize}
                onChange={(nextDiagram) =>
                  updateActiveTopic((t) => ({ ...t, visualize: nextDiagram }))
                }
              />
            </div>
          )}

          {/* ---------------------------------------------------------------
              05 — PRACTICE (Dreams of Code Split Code Editor + Live Runner)
              --------------------------------------------------------------- */}
          {env.activeModule === 'practice' && activeTask && (
            <div className="space-y-5">
              {/* Task Selector Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--os-border)]">
                <div className="flex items-center gap-2 flex-wrap">
                  {activeTopic.practice.tasks.map((tk) => {
                    const isAct = tk.id === activeTask.id;
                    return (
                      <button
                        key={tk.id}
                        type="button"
                        onClick={() => {
                          updateActiveTopic((t) => ({
                            ...t,
                            practice: { ...t.practice, activeTaskId: tk.id },
                          }));
                          setRunOutput({ status: 'idle', logs: [] });
                          setShowSolution(false);
                        }}
                        className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
                        style={{
                          backgroundColor: isAct ? '#23262F' : '#15171C',
                          color: isAct ? 'var(--os-brass)' : 'var(--os-ivory-muted)',
                          border: isAct ? '1px solid rgba(185,155,121,0.45)' : '1px solid var(--os-border)',
                        }}
                      >
                        [{tk.level}] {tk.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left: Problem Statement, Test Cases & Solution Comparison (5 cols) */}
                <div className="xl:col-span-5 space-y-4">
                  <div className="space-y-2">
                    <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-sage)' }}>
                      {activeTask.level} CHALLENGE
                    </span>
                    <h3 className="font-editorial text-[20px]" style={{ color: 'var(--os-ivory-bright)' }}>
                      {activeTask.title}
                    </h3>
                    <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--os-ivory)' }}>
                      {activeTask.prompt}
                    </p>
                  </div>

                  <div
                    className="p-3.5 rounded-[10px] space-y-1.5"
                    style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}
                  >
                    <span className="metadata text-[9.5px] uppercase" style={{ color: 'var(--os-dusty-blue)' }}>
                      Test Cases & Expected Output
                    </span>
                    <pre className="text-[12px] font-mono whitespace-pre-wrap" style={{ color: 'var(--os-ivory-muted)' }}>
                      {activeTask.testCasesText}
                    </pre>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setShowSolution((s) => !s)}
                      className="metadata text-[11px] uppercase tracking-[0.08em] hover:underline cursor-pointer"
                      style={{ color: 'var(--os-brass)' }}
                    >
                      {showSolution ? 'Ẩn Solution Comparison ▲' : 'So sánh với Reference Solution ▼'}
                    </button>

                    {showSolution && (
                      <div
                        className="mt-2 p-3.5 rounded-[10px] space-y-2"
                        style={{ backgroundColor: '#0D0E11', border: '1px solid var(--os-border)' }}
                      >
                        <pre className="text-[12px] font-mono overflow-x-auto" style={{ color: '#EDEAE2' }}>
                          <code>{activeTask.referenceSolution}</code>
                        </pre>
                        {activeTask.solutionNotes && (
                          <p className="text-[12px] pt-2 border-t border-[var(--os-border)]" style={{ color: 'var(--os-ivory-muted)' }}>
                            {activeTask.solutionNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Code Editor + Interactive Test Runner (7 cols) */}
                <div className="xl:col-span-7 space-y-3">
                  <div
                    className="rounded-[12px] overflow-hidden"
                    style={{ backgroundColor: '#0B0C0F', border: '1px solid var(--os-border)' }}
                  >
                    {/* Editor Header Bar */}
                    <div
                      className="px-4 py-2 flex items-center justify-between gap-2 border-b"
                      style={{ backgroundColor: '#15171D', borderColor: 'var(--os-border)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPracticeLang('js')}
                          className="px-2.5 py-1 rounded-[6px] metadata text-[10.5px] cursor-pointer"
                          style={{
                            backgroundColor: practiceLang === 'js' ? '#282B34' : 'transparent',
                            color: practiceLang === 'js' ? 'var(--os-brass)' : 'var(--os-ivory-faint)',
                          }}
                        >
                          JavaScript (Live Sandbox)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPracticeLang('java')}
                          className="px-2.5 py-1 rounded-[6px] metadata text-[10.5px] cursor-pointer"
                          style={{
                            backgroundColor: practiceLang === 'java' ? '#282B34' : 'transparent',
                            color: practiceLang === 'java' ? 'var(--os-dusty-blue)' : 'var(--os-ivory-faint)',
                          }}
                        >
                          Java (Reference Sketch)
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const key = `${activeTask.id}_${practiceLang}`;
                            setCodeDraftByTask((prev) => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            });
                            setRunOutput({ status: 'idle', logs: [] });
                          }}
                          className="metadata text-[10.5px] px-2.5 py-1 rounded-[6px] hover:bg-white/5 cursor-pointer"
                          style={{ color: 'var(--os-ivory-muted)' }}
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={runSandboxCode}
                          className="px-3.5 py-1 rounded-[6px] text-[12px] font-semibold cursor-pointer"
                          style={{ backgroundColor: 'var(--os-sage)', color: '#101114' }}
                        >
                          ▶ Run Tests
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={14}
                      spellCheck={false}
                      value={currentCodeText}
                      onChange={(e) => {
                        const val = e.target.value;
                        const key = `${activeTask.id}_${practiceLang}`;
                        setCodeDraftByTask((prev) => ({ ...prev, [key]: val }));
                      }}
                      className="w-full p-4 bg-transparent font-mono text-[13px] leading-[1.6] resize-y"
                      style={{ color: '#EDEAE2' }}
                    />
                  </div>

                  {/* Execution Output Console */}
                  {runOutput.status !== 'idle' && (
                    <div
                      className="p-3.5 rounded-[10px] font-mono text-[12px] space-y-1"
                      style={{
                        backgroundColor: '#0D0E11',
                        border:
                          runOutput.status === 'pass'
                            ? '1px solid rgba(155, 170, 152, 0.5)'
                            : '1px solid rgba(194, 123, 118, 0.5)',
                        color:
                          runOutput.status === 'pass' ? 'var(--os-sage)' : 'var(--os-crimson)',
                      }}
                    >
                      {runOutput.logs.map((ln, i) => (
                        <div key={i}>{ln}</div>
                      ))}
                      {runOutput.status === 'pass' && activeTopic.understanding !== 'applied' && (
                        <button
                          type="button"
                          onClick={() => {
                            updateActiveTopic((t) => ({ ...t, understanding: 'applied' }));
                            showToast('Đã nâng mức hiểu lên Applied!');
                          }}
                          className="mt-2 px-3 py-1 rounded-[6px] text-[11px] font-semibold cursor-pointer"
                          style={{ backgroundColor: 'var(--os-sage)', color: '#101114' }}
                        >
                          Đánh dấu chủ đề này là Applied ✓
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              06 — EXPERIMENT (Hypothesis -> Experiment -> Observation)
              --------------------------------------------------------------- */}
          {env.activeModule === 'experiment' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--os-border)]">
                <div>
                  <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
                    06 // EXPERIMENT LAB · HYPOTHESIS-DRIVEN LEARNING
                  </span>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
                    Practice là giải bài tập. Experiment là tự đặt giả thuyết &quot;Nếu làm thế này thì sao?&quot; rồi kiểm chứng thực tế.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewExpOpen(true)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-semibold cursor-pointer"
                  style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
                >
                  + New Hypothesis
                </button>
              </div>

              {activeTopic.experiments.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-[var(--os-border)] rounded-[12px] space-y-2">
                  <p className="text-[14px]" style={{ color: 'var(--os-ivory-muted)' }}>
                    Chưa có thí nghiệm nào cho chủ đề này.
                  </p>
                  <button
                    type="button"
                    onClick={() => setNewExpOpen(true)}
                    className="metadata text-[11.5px] hover:underline cursor-pointer"
                    style={{ color: 'var(--os-brass)' }}
                  >
                    + Tạo giả thuyết đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {activeTopic.experiments.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className="p-5 rounded-[12px] space-y-4"
                      style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="metadata text-[10.5px]" style={{ color: 'var(--os-brass)' }}>
                            EXP.0{idx + 1}
                          </span>
                          <h4 className="font-editorial text-[18px]" style={{ color: 'var(--os-ivory-bright)' }}>
                            {exp.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveTopic((t) => ({
                              ...t,
                              experiments: t.experiments.map((x) =>
                                x.id === exp.id ? { ...x, verified: !x.verified } : x
                              ),
                            }))
                          }
                          className="metadata text-[10px] px-2.5 py-1 rounded-[6px] cursor-pointer"
                          style={{
                            backgroundColor: exp.verified ? 'rgba(155,170,152,0.16)' : '#1C1E24',
                            color: exp.verified ? 'var(--os-sage)' : 'var(--os-ivory-muted)',
                            border: '1px solid var(--os-border)',
                          }}
                        >
                          {exp.verified ? '✓ VERIFIED' : 'MARK VERIFIED'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-[var(--os-border)]">
                        <div className="space-y-1">
                          <span className="metadata text-[9.5px] uppercase" style={{ color: 'var(--os-dusty-blue)' }}>
                            1. Hypothesis · Giả thuyết
                          </span>
                          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--os-ivory)' }}>
                            {exp.hypothesis}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="metadata text-[9.5px] uppercase" style={{ color: 'var(--os-brass)' }}>
                            2. Experiment · Cách thử
                          </span>
                          <p className="text-[12.5px] whitespace-pre-line leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                            {exp.experimentSteps}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="metadata text-[9.5px] uppercase" style={{ color: 'var(--os-sage)' }}>
                            3. Observation · Quan sát thực tế
                          </span>
                          <textarea
                            rows={3}
                            value={exp.observation}
                            onChange={(e) =>
                              updateActiveTopic((t) => ({
                                ...t,
                                experiments: t.experiments.map((x) =>
                                  x.id === exp.id ? { ...x, observation: e.target.value } : x
                                ),
                              }))
                            }
                            placeholder="Ghi lại kết quả thực tế sau khi thử..."
                            className="w-full p-2.5 rounded-[8px] text-[12.5px] bg-[#0D0E11] border border-[var(--os-border)] text-[#EDEAE2]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------
              07 — ASSESSMENT (Predict Output, Debug, Compare — No "Read = Done")
              --------------------------------------------------------------- */}
          {env.activeModule === 'assessment' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--os-border)]">
                <div>
                  <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
                    07 // ASSESSMENT · PREDICT THE OUTPUT & CONCEPT CHECKS
                  </span>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
                    Đọc code và tự dự đoán kết quả TRƯỚC khi mở đáp án để kiểm tra năng lực suy luận thật sự.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewAssessOpen(true)}
                  className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
                  style={{ backgroundColor: '#1B1D22', color: 'var(--os-brass)', border: '1px solid var(--os-border)' }}
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-5">
                {activeTopic.assessments.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-5 rounded-[12px] space-y-3.5"
                    style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-dusty-blue)' }}>
                        Q.0{idx + 1} · {q.kind.replace('_', ' ')}
                      </span>
                      {q.revealed && (
                        <span
                          className="metadata text-[10px]"
                          style={{
                            color: q.userAnswer.trim() === q.correctAnswer.trim() ? 'var(--os-sage)' : 'var(--os-brass)',
                          }}
                        >
                          {q.options && q.userAnswer === q.correctAnswer ? '✓ EXACT MATCH' : 'REVIEW EXPLANATION'}
                        </span>
                      )}
                    </div>

                    <p className="text-[14.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                      {q.prompt}
                    </p>

                    {q.code && (
                      <pre
                        className="p-3.5 rounded-[9px] text-[12.5px] font-mono overflow-x-auto"
                        style={{ backgroundColor: '#0B0C0F', border: '1px solid var(--os-border)', color: '#EDEAE2' }}
                      >
                        <code>{q.code}</code>
                      </pre>
                    )}

                    {q.options ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => {
                          const picked = q.userAnswer === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                updateActiveTopic((t) => ({
                                  ...t,
                                  assessments: t.assessments.map((x) =>
                                    x.id === q.id ? { ...x, userAnswer: opt } : x
                                  ),
                                }))
                              }
                              className="px-3.5 py-2 rounded-[8px] text-left text-[13px] cursor-pointer transition-colors"
                              style={{
                                backgroundColor: picked ? '#252832' : '#101114',
                                border: picked ? '1px solid var(--os-brass)' : '1px solid var(--os-border)',
                                color: 'var(--os-ivory)',
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea
                        rows={3}
                        value={q.userAnswer}
                        onChange={(e) =>
                          updateActiveTopic((t) => ({
                            ...t,
                            assessments: t.assessments.map((x) =>
                              x.id === q.id ? { ...x, userAnswer: e.target.value } : x
                            ),
                          }))
                        }
                        placeholder="Viết dự đoán hoặc câu trả lời của bạn trước khi xem giải thích..."
                        className="w-full p-3 rounded-[9px] text-[13px] bg-[#0D0E11] border border-[var(--os-border)] text-[#EDEAE2]"
                      />
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveTopic((t) => ({
                            ...t,
                            assessments: t.assessments.map((x) =>
                              x.id === q.id ? { ...x, revealed: !x.revealed } : x
                            ),
                          }))
                        }
                        className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-semibold cursor-pointer"
                        style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
                      >
                        {q.revealed ? 'Ẩn đáp án' : 'Verify & Reveal Answer'}
                      </button>
                    </div>

                    {q.revealed && (
                      <div
                        className="p-3.5 rounded-[9px] space-y-1.5 text-[13px]"
                        style={{ backgroundColor: '#101114', border: '1px solid rgba(155,170,152,0.35)' }}
                      >
                        <p className="font-semibold" style={{ color: 'var(--os-sage)' }}>
                          Đáp án chuẩn: {q.correctAnswer}
                        </p>
                        <p style={{ color: 'var(--os-ivory-muted)' }}>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              08 — REVIEW (Spaced Repetition · Weak Concepts · Project Link)
              --------------------------------------------------------------- */}
          {env.activeModule === 'review' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[var(--os-border)]">
                <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--os-brass)' }}>
                  08 // REVIEW & SPACED REPETITION
                </span>
                <h3 className="font-editorial text-[22px] mt-1" style={{ color: 'var(--os-ivory-bright)' }}>
                  Củng cố & Kết nối {activeTopic.title}
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  <div className="space-y-1.5">
                    <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-crimson)' }}>
                      Weak Concepts & Gaps · Điểm còn yếu / hay nhầm
                    </span>
                    <textarea
                      rows={4}
                      value={activeTopic.review.weakConcepts}
                      onChange={(e) =>
                        updateActiveTopic((t) => ({
                          ...t,
                          review: { ...t.review, weakConcepts: e.target.value },
                        }))
                      }
                      placeholder="Khái niệm nào bạn trả lời sai ở Assessment hoặc giải thích chưa mượt ở Explain?"
                      className="w-full p-3.5 rounded-[9px] text-[13.5px] bg-[#14161B] border border-[var(--os-border)] text-[#EDEAE2]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="metadata text-[10px] uppercase" style={{ color: 'var(--os-sage)' }}>
                      Real Project Application · Ứng dụng vào dự án thật
                    </span>
                    <textarea
                      rows={3}
                      value={activeTopic.review.realProjectApplication}
                      onChange={(e) =>
                        updateActiveTopic((t) => ({
                          ...t,
                          review: { ...t.review, realProjectApplication: e.target.value },
                        }))
                      }
                      placeholder="Kiến thức này dùng ở đâu trong backend Java / hệ thống thực tế?"
                      className="w-full p-3.5 rounded-[9px] text-[13.5px] bg-[#14161B] border border-[var(--os-border)] text-[#EDEAE2]"
                    />
                  </div>
                </div>

                {/* Spaced Repetition Scheduler */}
                <div
                  className="lg:col-span-5 p-5 rounded-[12px] space-y-4"
                  style={{ backgroundColor: '#14161B', border: '1px solid var(--os-border)' }}
                >
                  <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--os-brass)' }}>
                    SPACED REPETITION SCHEDULE
                  </span>

                  <div className="space-y-1">
                    <p className="text-[12.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                      Lịch ôn tập kế tiếp:
                    </p>
                    <p className="font-editorial text-[24px]" style={{ color: 'var(--os-ivory-bright)' }}>
                      {activeTopic.review.nextReviewDate}
                    </p>
                    <p className="metadata text-[10.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
                      Đã ôn {activeTopic.review.reviewCount} lần · Chu kỳ hiện tại: {activeTopic.review.intervalDays} ngày
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[var(--os-border)]">
                    <span className="metadata text-[9.5px] uppercase" style={{ color: 'var(--os-ivory-faint)' }}>
                      Chọn lịch nhắc lại sau khi vừa ôn xong:
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 3, 7, 14, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => {
                            const nextDate = addDaysFromToday(days);
                            updateActiveTopic((t) => ({
                              ...t,
                              review: {
                                ...t.review,
                                intervalDays: days,
                                nextReviewDate: nextDate,
                                reviewCount: t.review.reviewCount + 1,
                              },
                            }));
                            showToast(`Đã lên lịch ôn lại sau ${days} ngày (${nextDate})`);
                          }}
                          className="py-2 rounded-[7px] metadata text-[11px] cursor-pointer hover:bg-[var(--os-brass)] hover:text-[#101114] transition-colors"
                          style={{
                            backgroundColor:
                              activeTopic.review.intervalDays === days ? 'var(--os-stone)' : '#101114',
                            color: 'var(--os-ivory)',
                            border: '1px solid var(--os-border)',
                          }}
                        >
                          +{days}d
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--os-border)] space-y-1.5">
                    <span className="metadata text-[9.5px] uppercase" style={{ color: 'var(--os-dusty-blue)' }}>
                      Trạng thái hiểu hiện tại
                    </span>
                    <p className="text-[12.5px]" style={{ color: uMeta.color }}>
                      <strong>{uMeta.label}</strong> — {uMeta.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NEW EXPERIMENT */}
      <Modal open={newExpOpen} onClose={() => setNewExpOpen(false)} title="New Scientific Code Experiment">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!eTitle.trim()) return;
            const exp: LessonExperiment = {
              id: createId('exp'),
              title: eTitle.trim(),
              hypothesis: eHyp.trim(),
              experimentSteps: eSteps.trim(),
              codeSnippet: eCode.trim(),
              observation: '',
              verified: false,
            };
            updateActiveTopic((t) => ({ ...t, experiments: [...t.experiments, exp] }));
            setETitle('');
            setEHyp('');
            setESteps('');
            setECode('');
            setNewExpOpen(false);
            showToast('Đã tạo thí nghiệm kiểm chứng');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={eTitle}
            onChange={(e) => setETitle(e.target.value)}
            placeholder="Tên thí nghiệm (vd: Nếu Load Factor = 1.0 trên HashMap 10k phần tử)..."
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
          />
          <textarea
            rows={2}
            value={eHyp}
            onChange={(e) => setEHyp(e.target.value)}
            placeholder="Giả thuyết: Dự đoán điều gì sẽ xảy ra?"
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[13px]"
          />
          <textarea
            rows={3}
            value={eSteps}
            onChange={(e) => setESteps(e.target.value)}
            placeholder="Các bước thực nghiệm..."
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[13px]"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-[10px] text-[13.5px] font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
          >
            Tạo Experiment
          </button>
        </form>
      </Modal>

      {/* MODAL: NEW ASSESSMENT QUESTION */}
      <Modal open={newAssessOpen} onClose={() => setNewAssessOpen(false)} title="Add Assessment Question">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!aPrompt.trim()) return;
            const item: AssessmentItem = {
              id: createId('as'),
              kind: aKind,
              prompt: aPrompt.trim(),
              code: aCode.trim() || undefined,
              correctAnswer: aAns.trim(),
              userAnswer: '',
              revealed: false,
              explanation: aExp.trim(),
            };
            updateActiveTopic((t) => ({ ...t, assessments: [...t.assessments, item] }));
            setAPrompt('');
            setACode('');
            setAAns('');
            setAExp('');
            setNewAssessOpen(false);
            showToast('Đã thêm câu hỏi kiểm tra');
          }}
          className="space-y-3"
        >
          <select
            value={aKind}
            onChange={(e) => setAKind(e.target.value as AssessmentItem['kind'])}
            className="w-full px-3 py-2 rounded-[9px] ios-fill text-[13px]"
          >
            <option value="predict_output">Predict The Output</option>
            <option value="debug">Debugging Challenge</option>
            <option value="recall">Recall From Memory</option>
            <option value="compare">Compare Concepts</option>
          </select>
          <input
            type="text"
            required
            value={aPrompt}
            onChange={(e) => setAPrompt(e.target.value)}
            placeholder="Câu hỏi kiểm tra hiểu sâu..."
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
          />
          <textarea
            rows={3}
            value={aCode}
            onChange={(e) => setACode(e.target.value)}
            placeholder="Đoạn code cần dự đoán output (tùy chọn)..."
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill font-mono text-[12.5px]"
          />
          <input
            type="text"
            required
            value={aAns}
            onChange={(e) => setAAns(e.target.value)}
            placeholder="Đáp án đúng..."
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[13px]"
          />
          <textarea
            rows={2}
            value={aExp}
            onChange={(e) => setAExp(e.target.value)}
            placeholder="Giải thích bản chất..."
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[13px]"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-[10px] text-[13.5px] font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--os-brass)', color: '#101114' }}
          >
            Lưu câu hỏi
          </button>
        </form>
      </Modal>
    </div>
  );
}
