import type { MediaAttachmentRef } from '../../types';

export type ResearchCoreSectionKey =
  | 'overview'
  | 'problem'
  | 'questions'
  | 'hypothesis'
  | 'literature'
  | 'methodology'
  | 'evidence'
  | 'experiment'
  | 'discussion'
  | 'conclusion'
  | 'reflection'
  | 'references';

export type ResearchAuxiliaryKey = 'notes' | 'sources' | 'timeline';

export type ResearchWorkspaceView =
  | { kind: 'section'; key: ResearchCoreSectionKey }
  | { kind: 'auxiliary'; key: ResearchAuxiliaryKey };

export type ResearchSectionStatus = 'not_started' | 'in_progress' | 'completed';

export type CitationFormat = 'APA 7th' | 'MLA' | 'Chicago' | 'IEEE';

export interface ResearchSectionMeta {
  key: ResearchCoreSectionKey;
  code: string; // '01'..'12'
  shortLabel: string; // 'Overview', 'Problem', ...
  shortLabelVi: string;
  title: string; // 'Research Overview', 'Problem Identification', ...
  titleVi: string;
  subtitle: string;
  subtitleEn: string;
  phase: 1 | 2 | 3 | 4 | 5;
  phaseLabel: string;
  phaseLabelEn: string;
}

export const RESEARCH_PHASES: { phase: 1 | 2 | 3 | 4 | 5; title: string; range: string }[] = [
  { phase: 1, title: 'Đợt 1: Khởi tạo', range: '01–03' },
  { phase: 2, title: 'Đợt 2: Tìm hiểu', range: '04–05' },
  { phase: 3, title: 'Đợt 3: Phân tích', range: '06–07' },
  { phase: 4, title: 'Đợt 4: Kiểm chứng', range: '08–09' },
  { phase: 5, title: 'Đợt 5: Hoàn thiện', range: '10–12' },
];

export const RESEARCH_SECTIONS_META: ResearchSectionMeta[] = [
  {
    key: 'overview',
    code: '01',
    shortLabel: 'Overview',
    shortLabelVi: 'Tổng quan',
    title: 'Research Overview',
    titleVi: 'Tổng quan nghiên cứu',
    subtitle: 'Thông tin tổng quan về nghiên cứu.',
    subtitleEn: 'High-level overview of this study.',
    phase: 1,
    phaseLabel: 'Đợt 1: Khởi tạo',
    phaseLabelEn: 'Phase 1: Initiation',
  },
  {
    key: 'problem',
    code: '02',
    shortLabel: 'Problem',
    shortLabelVi: 'Vấn đề',
    title: 'Problem Identification',
    titleVi: 'Xác định vấn đề',
    subtitle: 'Xác định rõ vấn đề bạn đang muốn tìm hiểu.',
    subtitleEn: 'Define what you are trying to understand.',
    phase: 1,
    phaseLabel: 'Đợt 1: Khởi tạo',
    phaseLabelEn: 'Phase 1: Initiation',
  },
  {
    key: 'questions',
    code: '03',
    shortLabel: 'Questions',
    shortLabelVi: 'Câu hỏi',
    title: 'Research Questions',
    titleVi: 'Câu hỏi nghiên cứu',
    subtitle: 'Đặt câu hỏi trung tâm và ranh giới phạm vi nghiên cứu.',
    subtitleEn: 'Frame the core questions and scope.',
    phase: 1,
    phaseLabel: 'Đợt 1: Khởi tạo',
    phaseLabelEn: 'Phase 1: Initiation',
  },
  {
    key: 'hypothesis',
    code: '04',
    shortLabel: 'Hypothesis',
    shortLabelVi: 'Giả thuyết',
    title: 'Hypothesis & Objectives',
    titleVi: 'Giả thuyết & Mục tiêu',
    subtitle: 'Giả thuyết ban đầu, mục tiêu và kết quả kỳ vọng.',
    subtitleEn: 'Initial hypothesis, objectives, and expected outcomes.',
    phase: 2,
    phaseLabel: 'Đợt 2: Tìm hiểu',
    phaseLabelEn: 'Phase 2: Exploration',
  },
  {
    key: 'literature',
    code: '05',
    shortLabel: 'Literature',
    shortLabelVi: 'Tài liệu nền',
    title: 'Literature Review',
    titleVi: 'Tổng quan tài liệu',
    subtitle: 'Tổng hợp lý thuyết nền tảng, nghiên cứu trước và khoảng trống tri thức.',
    subtitleEn: 'Synthesize foundational theory, prior work, and gaps.',
    phase: 2,
    phaseLabel: 'Đợt 2: Tìm hiểu',
    phaseLabelEn: 'Phase 2: Exploration',
  },
  {
    key: 'methodology',
    code: '06',
    shortLabel: 'Methodology',
    shortLabelVi: 'Phương pháp',
    title: 'Research Methodology',
    titleVi: 'Phương pháp nghiên cứu',
    subtitle: 'Thiết kế cách tiếp cận và thu thập dữ liệu.',
    subtitleEn: 'Design your approach and data collection.',
    phase: 3,
    phaseLabel: 'Đợt 3: Phân tích',
    phaseLabelEn: 'Phase 3: Analysis',
  },
  {
    key: 'evidence',
    code: '07',
    shortLabel: 'Evidence',
    shortLabelVi: 'Bằng chứng',
    title: 'Evidence & Analysis',
    titleVi: 'Bằng chứng & Phân tích',
    subtitle: 'Thu thập phát hiện, dữ liệu, mẫu hình và bằng chứng trái chiều.',
    subtitleEn: 'Collect findings, data, patterns, and counter-evidence.',
    phase: 3,
    phaseLabel: 'Đợt 3: Phân tích',
    phaseLabelEn: 'Phase 3: Analysis',
  },
  {
    key: 'experiment',
    code: '08',
    shortLabel: 'Experiment',
    shortLabelVi: 'Thử nghiệm',
    title: 'Experiment & Observation',
    titleVi: 'Thử nghiệm & Quan sát',
    subtitle: 'Thử nghiệm và ghi nhật ký quan sát thực tế.',
    subtitleEn: 'Run experiments and log real-world observations.',
    phase: 4,
    phaseLabel: 'Đợt 4: Kiểm chứng',
    phaseLabelEn: 'Phase 4: Validation',
  },
  {
    key: 'discussion',
    code: '09',
    shortLabel: 'Discussion',
    shortLabelVi: 'Thảo luận',
    title: 'Discussion',
    titleVi: 'Thảo luận & Phản biện',
    subtitle: 'Diễn giải, đối chiếu, phản biện và các giải thích thay thế.',
    subtitleEn: 'Interpret, compare, critique, and explore alternatives.',
    phase: 4,
    phaseLabel: 'Đợt 4: Kiểm chứng',
    phaseLabelEn: 'Phase 4: Validation',
  },
  {
    key: 'conclusion',
    code: '10',
    shortLabel: 'Conclusion',
    shortLabelVi: 'Kết luận',
    title: 'Conclusion',
    titleVi: 'Kết luận',
    subtitle: 'Tóm tắt phát hiện, đánh giá giả thuyết, giới hạn và câu hỏi tiếp nối.',
    subtitleEn: 'Summarize findings, evaluate hypothesis, and note next questions.',
    phase: 5,
    phaseLabel: 'Đợt 5: Hoàn thiện',
    phaseLabelEn: 'Phase 5: Synthesis',
  },
  {
    key: 'reflection',
    code: '11',
    shortLabel: 'Reflection',
    shortLabelVi: 'Chiêm nghiệm',
    title: 'Personal Reflection',
    titleVi: 'Chiêm nghiệm cá nhân',
    subtitle: 'Đối chiếu niềm tin ban đầu, bài học và thay đổi cá nhân.',
    subtitleEn: 'Compare initial beliefs, lessons learned, and personal shifts.',
    phase: 5,
    phaseLabel: 'Đợt 5: Hoàn thiện',
    phaseLabelEn: 'Phase 5: Synthesis',
  },
  {
    key: 'references',
    code: '12',
    shortLabel: 'References',
    shortLabelVi: 'Tham khảo',
    title: 'References',
    titleVi: 'Tài liệu tham khảo',
    subtitle: 'Danh mục tài liệu tham khảo và định dạng trích dẫn.',
    subtitleEn: 'Bibliography and citation list.',
    phase: 5,
    phaseLabel: 'Đợt 5: Hoàn thiện',
    phaseLabelEn: 'Phase 5: Synthesis',
  },
];

export interface ExperimentDailyLogEntry {
  id: string;
  date: string;
  observation: string;
  note?: string;
}

export interface ResearchProject {
  id: string;
  code: string; // e.g. 'RESEARCH / 001'
  domain: string; // e.g. 'PERSONAL PSYCHOLOGY'
  date: string; // YYYY-MM-DD
  researchStatus: ResearchSectionStatus;

  // 01 Research Overview
  title: string;
  abstract: string;
  tags: string[];

  // 02 Problem Identification
  background: string;
  observation: string; // Personal Observation
  problemStatement: string;
  problemContext: string;

  // 03 Research Questions
  question: string; // Main Question
  subQuestions: string;
  scope: string;
  researchBoundaries: string;

  // 04 Hypothesis & Objectives
  hypothesis: string;
  objectives: string;
  expectedOutcomes: string;

  // 05 Literature Review
  existingTheories: string;
  literatureReview: string; // Previous Studies
  relatedConcepts: string;
  researchGaps: string;

  // 06 Research Methodology
  researchDesign: string;
  dataCollection: string;
  participants: string;
  variables: string;
  procedure: string;
  optionalMethodologyFields: {
    participants: boolean;
    variables: boolean;
    procedure: boolean;
  };

  // 07 Evidence & Analysis
  findings: string;
  evidence: string; // Evidence Notes
  evidenceData: string;
  patterns: string;
  contradictoryEvidence: string;

  // 08 Experiment & Observation
  experimentNotApplicable: boolean;
  experimentDesign: string;
  experimentDailyLogs: ExperimentDailyLogEntry[];
  experimentObservations: string;
  experimentResults: string;

  // 09 Discussion
  interpretation: string;
  comparison: string;
  counterarguments: string;
  alternativeExplanations: string;

  // 10 Conclusion
  conclusion: string; // Findings Summary
  hypothesisEvaluation: string;
  limitations: string;
  futureQuestions: string;

  // 11 Personal Reflection
  initialBelief: string;
  currentBelief: string;
  lessonsLearned: string;
  personalChanges: string;

  // 12 References
  citationFormat: CitationFormat;
  referenceNotes: string;

  // Independent per-section progress
  sectionStatuses: Record<ResearchCoreSectionKey, ResearchSectionStatus>;
  sectionSavedAt: Partial<Record<ResearchCoreSectionKey, number>>;

  // Relations & backward compatibility
  sourceIds: string[];
  quickNote?: string;
  audios?: MediaAttachmentRef[];
  igPostId?: string;
  igRawVi?: string;
  igEnglishRewrite?: string;
  igDueDate?: string;
  igPublished?: boolean;

  createdAt: number;
  updatedAt: number;
}

export interface RawJournalEntry {
  id: string;
  title: string;
  date: string;
  rawContent: string;
  tags: string[];
  targetSection?: ResearchCoreSectionKey;
  relatedResearchIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type KnowledgeSourceCategory =
  | 'Scientific Papers'
  | 'Books'
  | 'Articles'
  | 'Research Reports'
  | 'Videos / Lectures';

export interface KnowledgeSource {
  id: string;
  category: KnowledgeSourceCategory;
  paperTitle: string;
  author: string;
  publicationYear: string;
  journalOrPublisher: string;
  doiOrUrl: string;
  abstractText: string;
  keyFindings: string;
  limitations: string;
  personalNotes: string;
  relatedResearchIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SourceClaimLink {
  id: string;
  researchId: string;
  sourceId: string;
  section: 'literature' | 'evidence' | 'discussion' | 'references';
  claimLabel: string;
  stance: 'supports' | 'contrasts' | 'context';
  excerpt: string;
  createdAt: number;
}

export interface ResearchTimelineEvent {
  id: string;
  researchId: string;
  dateStr: string;
  timestamp: number;
  category: 'question' | 'hypothesis' | 'conclusion' | 'reflection' | 'milestone';
  summary: string;
  snapshot?: string;
}

export interface PersonalResearchJournalState {
  activeView: ResearchWorkspaceView;
  activeCoreSection: ResearchCoreSectionKey;
  lastActiveResearchId: string;
  projects: ResearchProject[];
  rawEntries: RawJournalEntry[]; // Research Notes
  sources: KnowledgeSource[]; // Source Manager
  sourceLinks: SourceClaimLink[]; // Links between Sources and Evidence/Discussion arguments
  timelineEvents: ResearchTimelineEvent[]; // Evolution of Question, Hypothesis, Conclusion
}

export const SUGGESTED_RESEARCH_TAGS = [
  'Psychology',
  'Learning',
  'Focus',
  'Procrastination',
  'Motivation',
  'Cognition',
  'Behavior',
  'Identity',
];

export const SOURCE_CATEGORIES: KnowledgeSourceCategory[] = [
  'Scientific Papers',
  'Books',
  'Articles',
  'Research Reports',
  'Videos / Lectures',
];

export const CITATION_FORMATS: CitationFormat[] = ['APA 7th', 'MLA', 'Chicago', 'IEEE'];

export function createEmptySectionStatuses(
  initial: ResearchSectionStatus = 'not_started'
): Record<ResearchCoreSectionKey, ResearchSectionStatus> {
  return {
    overview: initial,
    problem: initial,
    questions: initial,
    hypothesis: initial,
    literature: initial,
    methodology: initial,
    evidence: initial,
    experiment: initial,
    discussion: initial,
    conclusion: initial,
    reflection: initial,
    references: initial,
  };
}

export function formatSourceCitation(
  src: KnowledgeSource,
  format: CitationFormat = 'APA 7th'
): string {
  const author = src.author.trim() || 'Unknown Author';
  const year = src.publicationYear.trim() || 'n.d.';
  const title = src.paperTitle.trim() || 'Untitled Work';
  const pub = src.journalOrPublisher.trim();
  const rawLink = src.doiOrUrl.trim();
  const link = rawLink.startsWith('10.') ? `https://doi.org/${rawLink}` : rawLink;

  if (format === 'MLA') {
    return [
      `${author}.`,
      `"${title}."`,
      pub ? `${pub},` : '',
      `${year}${link ? `, ${link}` : ''}.`,
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (format === 'Chicago') {
    return [
      `${author}.`,
      `${year}.`,
      `"${title}."`,
      pub ? `${pub}.` : '',
      link,
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (format === 'IEEE') {
    return [
      `${author},`,
      `"${title},"`,
      pub ? `${pub},` : '',
      `${year}.`,
      link,
    ]
      .filter(Boolean)
      .join(' ');
  }

  // Default: APA 7th
  let citation = `${author} (${year}). ${title}.`;
  if (pub) citation += ` ${pub}.`;
  if (link) citation += ` ${link}`;
  return citation;
}

export const formatAPA7Citation = (src: KnowledgeSource) => formatSourceCitation(src, 'APA 7th');

export function createBlankResearchProject(
  indexNumber: number,
  todayStr: string,
  title = 'Untitled Research Study',
  domain = 'PERSONAL PSYCHOLOGY'
): ResearchProject {
  const padded = String(indexNumber).padStart(3, '0');
  const now = Date.now();
  return {
    id: `res_${now.toString(36)}`,
    code: `RESEARCH / ${padded}`,
    domain: domain.toUpperCase(),
    date: todayStr,
    researchStatus: 'not_started',

    title,
    abstract: '',
    tags: [],

    background: '',
    observation: '',
    problemStatement: '',
    problemContext: '',

    question: '',
    subQuestions: '',
    scope: '',
    researchBoundaries: '',

    hypothesis: '',
    objectives: '',
    expectedOutcomes: '',

    existingTheories: '',
    literatureReview: '',
    relatedConcepts: '',
    researchGaps: '',

    researchDesign: '',
    dataCollection: '',
    participants: '',
    variables: '',
    procedure: '',
    optionalMethodologyFields: {
      participants: false,
      variables: false,
      procedure: false,
    },

    findings: '',
    evidence: '',
    evidenceData: '',
    patterns: '',
    contradictoryEvidence: '',

    experimentNotApplicable: false,
    experimentDesign: '',
    experimentDailyLogs: [],
    experimentObservations: '',
    experimentResults: '',

    interpretation: '',
    comparison: '',
    counterarguments: '',
    alternativeExplanations: '',

    conclusion: '',
    hypothesisEvaluation: '',
    limitations: '',
    futureQuestions: '',

    initialBelief: '',
    currentBelief: '',
    lessonsLearned: '',
    personalChanges: '',

    citationFormat: 'APA 7th',
    referenceNotes: '',

    sectionStatuses: createEmptySectionStatuses('not_started'),
    sectionSavedAt: {},
    sourceIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function buildInitialResearchJournalState(todayStr: string): PersonalResearchJournalState {
  const blankProj = createBlankResearchProject(1, todayStr, 'Nghiên cứu mới', 'PERSONAL PSYCHOLOGY');
  return {
    activeView: { kind: 'section', key: 'overview' },
    activeCoreSection: 'overview',
    lastActiveResearchId: blankProj.id,
    projects: [blankProj],
    rawEntries: [],
    sources: [],
    sourceLinks: [],
    timelineEvents: [],
  };
}

/**
 * Safely migrate both old `PersonalResearchJournalState` records (with 6 tabs,
 * separate experiments/insights arrays) and new 12-section records without losing data.
 */
export function normalizeResearchJournalState(
  rawInput: unknown,
  todayStr: string
): PersonalResearchJournalState {
  const fallback = buildInitialResearchJournalState(todayStr);
  if (!rawInput || typeof rawInput !== 'object') return fallback;

  const parsed = rawInput as Record<string, unknown>;
  const rawSources = Array.isArray(parsed.sources)
    ? (parsed.sources as Record<string, unknown>[]).filter(
        (s) => s.id !== 'src_001' && s.id !== 'src_002'
      )
    : [];
  const rawEntriesIn = Array.isArray(parsed.rawEntries)
    ? (parsed.rawEntries as Record<string, unknown>[]).filter(
        (r) => r.id !== 'raw_001' && r.id !== 'raw_002'
      )
    : [];
  const rawExperiments = Array.isArray(parsed.experiments) ? (parsed.experiments as Record<string, unknown>[]) : [];
  const rawInsights = Array.isArray(parsed.insights) ? (parsed.insights as Record<string, unknown>[]) : [];
  const rawProjects = Array.isArray(parsed.projects)
    ? (parsed.projects as Record<string, unknown>[]).filter(
        (p) =>
          p.id !== 'res_001' &&
          !String(p.title || '').includes('Giải mã nghịch lý Lập kế hoạch quá mức')
      )
    : [];

  if (rawProjects.length === 0) return fallback;

  const sources: KnowledgeSource[] =
    rawSources.length > 0
      ? rawSources.map((s, idx) => ({
          id: String(s.id || `src_${idx}`),
          category: (SOURCE_CATEGORIES.includes(s.category as KnowledgeSourceCategory)
            ? s.category
            : 'Scientific Papers') as KnowledgeSourceCategory,
          paperTitle: String(s.paperTitle || ''),
          author: String(s.author || ''),
          publicationYear: String(s.publicationYear || ''),
          journalOrPublisher: String(s.journalOrPublisher || ''),
          doiOrUrl: String(s.doiOrUrl || ''),
          abstractText: String(s.abstractText || ''),
          keyFindings: String(s.keyFindings || ''),
          limitations: String(s.limitations || ''),
          personalNotes: String(s.personalNotes || ''),
          relatedResearchIds: Array.isArray(s.relatedResearchIds)
            ? s.relatedResearchIds.map(String)
            : [],
          createdAt: Number(s.createdAt) || Date.now(),
          updatedAt: Number(s.updatedAt) || Date.now(),
        }))
      : fallback.sources;

  const rawEntries: RawJournalEntry[] = rawEntriesIn.map((r, idx) => ({
    id: String(r.id || `raw_${idx}`),
    title: String(r.title || 'Untitled Note'),
    date: String(r.date || todayStr),
    rawContent: String(r.rawContent || ''),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    targetSection: r.targetSection as ResearchCoreSectionKey | undefined,
    relatedResearchIds: Array.isArray(r.relatedResearchIds) ? r.relatedResearchIds.map(String) : [],
    createdAt: Number(r.createdAt) || Date.now(),
    updatedAt: Number(r.updatedAt) || Date.now(),
  }));

  const projects: ResearchProject[] = rawProjects.map((p, idx) => {
    const id = String(p.id || `res_${idx + 1}`);
    const linkedExp = rawExperiments.find(
      (e) => Array.isArray(e.relatedResearchIds) && e.relatedResearchIds.includes(id)
    );
    const linkedInsight = rawInsights.find((ins) => ins.discoveredThroughResearchId === id);

    const oldStatuses =
      p.sectionStatuses && typeof p.sectionStatuses === 'object'
        ? (p.sectionStatuses as Partial<Record<ResearchCoreSectionKey, ResearchSectionStatus>>)
        : undefined;

    const inferStatus = (hasContent: boolean): ResearchSectionStatus =>
      hasContent ? 'in_progress' : 'not_started';

    const background = String(p.background || '');
    const observation = String(p.observation || '');
    const problemStatement = String(p.problemStatement || '');
    const question = String(p.question || '');
    const hypothesis = String(p.hypothesis || '');
    const objectives = String(p.objectives || '');
    const literatureReview = String(p.literatureReview || '');
    const evidence = String(p.evidence || '');
    const counterarguments = String(p.counterarguments || '');
    const conclusion = String(p.conclusion || '');
    const limitations = String(p.limitations || '');
    const initialBelief = String(p.initialBelief || '');
    const currentBelief = String(p.currentBelief || '');
    const sourceIds = Array.isArray(p.sourceIds) ? p.sourceIds.map(String) : [];

    const experimentDesign = String(
      p.experimentDesign || (linkedExp ? `${linkedExp.experiment || ''}\n${linkedExp.method || ''}`.trim() : '')
    );
    const experimentObservations = String(
      p.experimentObservations || (linkedExp ? String(linkedExp.dailyObservation || '') : '')
    );
    const experimentResults = String(
      p.experimentResults || (linkedExp ? String(linkedExp.results || '') : '')
    );

    const participants = String(p.participants || '');
    const variables = String(p.variables || (linkedExp ? String(linkedExp.variable || '') : ''));
    const procedure = String(p.procedure || '');

    const rawOpt =
      p.optionalMethodologyFields && typeof p.optionalMethodologyFields === 'object'
        ? (p.optionalMethodologyFields as Partial<ResearchProject['optionalMethodologyFields']>)
        : undefined;

    const existingLogs = Array.isArray(p.experimentDailyLogs)
      ? (p.experimentDailyLogs as ExperimentDailyLogEntry[])
      : experimentObservations.trim()
      ? [
          {
            id: `elog_migrated_${id}`,
            date: String(p.date || todayStr),
            observation: experimentObservations.trim(),
          },
        ]
      : [];

    const sectionStatuses: Record<ResearchCoreSectionKey, ResearchSectionStatus> = {
      overview: oldStatuses?.overview || inferStatus(Boolean(p.title || p.abstract)),
      problem: oldStatuses?.problem || inferStatus(Boolean(background || observation || problemStatement)),
      questions: oldStatuses?.questions || inferStatus(Boolean(question || p.subQuestions)),
      hypothesis: oldStatuses?.hypothesis || inferStatus(Boolean(hypothesis || objectives)),
      literature: oldStatuses?.literature || inferStatus(Boolean(literatureReview || p.existingTheories)),
      methodology:
        oldStatuses?.methodology ||
        inferStatus(Boolean(p.researchDesign || p.dataCollection || variables)),
      evidence: oldStatuses?.evidence || inferStatus(Boolean(p.findings || evidence)),
      experiment:
        oldStatuses?.experiment ||
        inferStatus(Boolean(experimentDesign || existingLogs.length > 0 || experimentResults)),
      discussion:
        oldStatuses?.discussion ||
        inferStatus(Boolean(p.interpretation || counterarguments)),
      conclusion: oldStatuses?.conclusion || inferStatus(Boolean(conclusion || limitations)),
      reflection:
        oldStatuses?.reflection ||
        inferStatus(Boolean(initialBelief || currentBelief || p.lessonsLearned)),
      references: oldStatuses?.references || inferStatus(Boolean(sourceIds.length > 0 || p.referenceNotes)),
    };

    const completedCount = Object.values(sectionStatuses).filter((s) => s === 'completed').length;
    const anyStarted = Object.values(sectionStatuses).some((s) => s !== 'not_started');

    const mappedStatus: ResearchSectionStatus =
      p.researchStatus === 'not_started' || p.researchStatus === 'in_progress' || p.researchStatus === 'completed'
        ? (p.researchStatus as ResearchSectionStatus)
        : p.status === 'completed' || completedCount === 12
        ? 'completed'
        : anyStarted
        ? 'in_progress'
        : 'not_started';

    const rawCode = String(p.code || `RESEARCH / ${String(idx + 1).padStart(3, '0')}`);
    const normalizedCode = rawCode.includes('/')
      ? rawCode
      : rawCode.replace(/^RESEARCH\s+/i, 'RESEARCH / ');

    return {
      id,
      code: normalizedCode,
      domain: String(p.domain || 'PERSONAL PSYCHOLOGY').toUpperCase(),
      date: String(p.date || todayStr),
      researchStatus: mappedStatus,

      title: String(p.title || 'Untitled Research'),
      abstract: String(p.abstract || ''),
      tags: Array.isArray(p.tags) ? p.tags.map(String) : ['Psychology'],

      background,
      observation,
      problemStatement,
      problemContext: String(p.problemContext || ''),

      question,
      subQuestions: String(p.subQuestions || ''),
      scope: String(p.scope || ''),
      researchBoundaries: String(p.researchBoundaries || ''),

      hypothesis,
      objectives,
      expectedOutcomes: String(p.expectedOutcomes || ''),

      existingTheories: String(p.existingTheories || ''),
      literatureReview,
      relatedConcepts: String(p.relatedConcepts || ''),
      researchGaps: String(p.researchGaps || ''),

      researchDesign: String(p.researchDesign || ''),
      dataCollection: String(p.dataCollection || ''),
      participants,
      variables,
      procedure,
      optionalMethodologyFields: {
        participants: rawOpt?.participants ?? Boolean(participants.trim()),
        variables: rawOpt?.variables ?? Boolean(variables.trim()),
        procedure: rawOpt?.procedure ?? Boolean(procedure.trim()),
      },

      findings: String(p.findings || ''),
      evidence,
      evidenceData: String(p.evidenceData || ''),
      patterns: String(p.patterns || ''),
      contradictoryEvidence: String(p.contradictoryEvidence || ''),

      experimentNotApplicable: Boolean(p.experimentNotApplicable),
      experimentDesign,
      experimentDailyLogs: existingLogs,
      experimentObservations,
      experimentResults,

      interpretation: String(p.interpretation || ''),
      comparison: String(p.comparison || ''),
      counterarguments,
      alternativeExplanations: String(p.alternativeExplanations || ''),

      conclusion,
      hypothesisEvaluation: String(p.hypothesisEvaluation || ''),
      limitations,
      futureQuestions: String(p.futureQuestions || ''),

      initialBelief,
      currentBelief,
      lessonsLearned: String(
        p.lessonsLearned || (linkedInsight ? String(linkedInsight.reflection || '') : '')
      ),
      personalChanges: String(p.personalChanges || ''),

      citationFormat: (CITATION_FORMATS.includes(p.citationFormat as CitationFormat)
        ? p.citationFormat
        : 'APA 7th') as CitationFormat,
      referenceNotes: String(p.referenceNotes || ''),

      sectionStatuses,
      sectionSavedAt:
        p.sectionSavedAt && typeof p.sectionSavedAt === 'object'
          ? (p.sectionSavedAt as Partial<Record<ResearchCoreSectionKey, number>>)
          : {},

      sourceIds,
      quickNote: typeof p.quickNote === 'string' ? p.quickNote : '',
      audios: Array.isArray(p.audios) ? (p.audios as MediaAttachmentRef[]) : [],
      igPostId: p.igPostId ? String(p.igPostId) : undefined,
      igRawVi: p.igRawVi ? String(p.igRawVi) : undefined,
      igEnglishRewrite: p.igEnglishRewrite ? String(p.igEnglishRewrite) : undefined,
      igDueDate: p.igDueDate ? String(p.igDueDate) : undefined,
      igPublished: Boolean(p.igPublished),

      createdAt: Number(p.createdAt) || Date.now(),
      updatedAt: Number(p.updatedAt) || Date.now(),
    };
  });

  const sourceLinks: SourceClaimLink[] = Array.isArray(parsed.sourceLinks)
    ? (parsed.sourceLinks as SourceClaimLink[]).filter(
        (l) => l.id !== 'sl_001' && l.id !== 'sl_002'
      )
    : fallback.sourceLinks;

  const timelineEvents: ResearchTimelineEvent[] = Array.isArray(parsed.timelineEvents)
    ? (parsed.timelineEvents as ResearchTimelineEvent[]).filter(
        (tl) => tl.id !== 'tl_001' && tl.id !== 'tl_002'
      )
    : fallback.timelineEvents;

  const activeCoreSection: ResearchCoreSectionKey = RESEARCH_SECTIONS_META.some(
    (m) => m.key === parsed.activeCoreSection
  )
    ? (parsed.activeCoreSection as ResearchCoreSectionKey)
    : 'overview';

  const parsedView = parsed.activeView as ResearchWorkspaceView | undefined;
  const activeView: ResearchWorkspaceView =
    parsedView &&
    ((parsedView.kind === 'section' &&
      RESEARCH_SECTIONS_META.some((m) => m.key === parsedView.key)) ||
      (parsedView.kind === 'auxiliary' &&
        (['notes', 'sources', 'timeline'] as ResearchAuxiliaryKey[]).includes(parsedView.key)))
      ? parsedView
      : { kind: 'section', key: activeCoreSection };

  const lastActiveResearchId = projects.some((p) => p.id === parsed.lastActiveResearchId)
    ? String(parsed.lastActiveResearchId)
    : projects[0].id;

  return {
    activeView,
    activeCoreSection,
    lastActiveResearchId,
    projects,
    rawEntries,
    sources,
    sourceLinks,
    timelineEvents,
  };
}
