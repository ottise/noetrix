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
  title: string; // 'Research Overview', 'Problem Identification', ...
  subtitle: string;
  phase: 1 | 2 | 3 | 4 | 5;
  phaseLabel: string;
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
    title: 'Research Overview',
    subtitle: 'Thông tin tổng quan về nghiên cứu.',
    phase: 1,
    phaseLabel: 'Đợt 1: Khởi tạo',
  },
  {
    key: 'problem',
    code: '02',
    shortLabel: 'Problem',
    title: 'Problem Identification',
    subtitle: 'Define what you are trying to understand.',
    phase: 1,
    phaseLabel: 'Đợt 1: Khởi tạo',
  },
  {
    key: 'questions',
    code: '03',
    shortLabel: 'Questions',
    title: 'Research Questions',
    subtitle: 'Đặt câu hỏi trung tâm và ranh giới phạm vi nghiên cứu.',
    phase: 1,
    phaseLabel: 'Đợt 1: Khởi tạo',
  },
  {
    key: 'hypothesis',
    code: '04',
    shortLabel: 'Hypothesis',
    title: 'Hypothesis & Objectives',
    subtitle: 'Giả thuyết ban đầu, mục tiêu và kết quả kỳ vọng.',
    phase: 2,
    phaseLabel: 'Đợt 2: Tìm hiểu',
  },
  {
    key: 'literature',
    code: '05',
    shortLabel: 'Literature',
    title: 'Literature Review',
    subtitle: 'Tổng hợp lý thuyết nền tảng, nghiên cứu trước và khoảng trống tri thức.',
    phase: 2,
    phaseLabel: 'Đợt 2: Tìm hiểu',
  },
  {
    key: 'methodology',
    code: '06',
    shortLabel: 'Methodology',
    title: 'Research Methodology',
    subtitle: 'Thiết kế cách tiếp cận và thu thập dữ liệu (chỉ mở trường phù hợp).',
    phase: 3,
    phaseLabel: 'Đợt 3: Phân tích',
  },
  {
    key: 'evidence',
    code: '07',
    shortLabel: 'Evidence',
    title: 'Evidence & Analysis',
    subtitle: 'Thu thập phát hiện, dữ liệu, mẫu hình và bằng chứng trái chiều.',
    phase: 3,
    phaseLabel: 'Đợt 3: Phân tích',
  },
  {
    key: 'experiment',
    code: '08',
    shortLabel: 'Experiment',
    title: 'Experiment & Observation',
    subtitle: 'Thử nghiệm và ghi nhật ký quan sát thực tế (tùy chọn theo đề tài).',
    phase: 4,
    phaseLabel: 'Đợt 4: Kiểm chứng',
  },
  {
    key: 'discussion',
    code: '09',
    shortLabel: 'Discussion',
    title: 'Discussion',
    subtitle: 'Diễn giải, đối chiếu, phản biện và các giải thích thay thế.',
    phase: 4,
    phaseLabel: 'Đợt 4: Kiểm chứng',
  },
  {
    key: 'conclusion',
    code: '10',
    shortLabel: 'Conclusion',
    title: 'Conclusion',
    subtitle: 'Tóm tắt phát hiện, đánh giá giả thuyết, giới hạn và câu hỏi tiếp nối.',
    phase: 5,
    phaseLabel: 'Đợt 5: Hoàn thiện',
  },
  {
    key: 'reflection',
    code: '11',
    shortLabel: 'Reflection',
    title: 'Personal Reflection',
    subtitle: 'Đối chiếu niềm tin ban đầu, bài học và thay đổi cá nhân.',
    phase: 5,
    phaseLabel: 'Đợt 5: Hoàn thiện',
  },
  {
    key: 'references',
    code: '12',
    shortLabel: 'References',
    title: 'References',
    subtitle: 'Danh mục tài liệu tham khảo và định dạng trích dẫn.',
    phase: 5,
    phaseLabel: 'Đợt 5: Hoàn thiện',
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
  const now = Date.now();

  const src1: KnowledgeSource = {
    id: 'src_001',
    category: 'Scientific Papers',
    paperTitle: 'Predictive Reward Signal of Dopamine Neurons',
    author: 'Schultz, W.',
    publicationYear: '1998',
    journalOrPublisher: 'Journal of Neurophysiology, 80(1), 1–27',
    doiOrUrl: 'https://doi.org/10.1152/jn.1998.80.1.1',
    abstractText:
      'Dopamine neurons fire strongest not when receiving an expected reward, but during the anticipation and prediction of reward cues.',
    keyFindings:
      'Dopamine phản ứng mạnh ở pha kỳ vọng (anticipation), không phải pha hoàn tất. Lập kế hoạch quá kỹ hoặc mua sách kích hoạt phần thưởng giả trước khi bắt tay vào học.',
    limitations: 'Nghiên cứu sinh lý thần kinh ở mức tín hiệu dự đoán; cần đối chiếu thêm với tâm lý học trì hoãn ở người.',
    personalNotes: 'Giải thích trực tiếp cảm giác "lập kế hoạch xong là thấy đủ" mà không muốn bắt đầu làm thật.',
    relatedResearchIds: ['res_001'],
    createdAt: now - 3600 * 1000 * 10,
    updatedAt: now - 3600 * 1000 * 10,
  };

  const src2: KnowledgeSource = {
    id: 'src_002',
    category: 'Books',
    paperTitle: 'The Black Swan: The Impact of the Highly Improbable (Antilibrary)',
    author: 'Taleb, N. N.',
    publicationYear: '2007',
    journalOrPublisher: 'Random House',
    doiOrUrl: '',
    abstractText:
      'Unread books serve best as research tools organized around open questions rather than linear trophies.',
    keyFindings:
      'Sách chưa đọc nên được dùng làm thư viện tra cứu theo câu hỏi nghiên cứu thay vì tạo cảm giác tội lỗi hay áp lực phải đọc tuyến tính.',
    limitations: 'Góc nhìn triết học/nhận thức luận, không có số liệu thử nghiệm.',
    personalNotes: 'Giúp chuyển tư duy đọc thụ động sang đọc theo câu hỏi (question-driven reading).',
    relatedResearchIds: ['res_001'],
    createdAt: now - 3600 * 1000 * 8,
    updatedAt: now - 3600 * 1000 * 8,
  };

  const raw1: RawJournalEntry = {
    id: 'raw_001',
    title: 'Tại sao lập kế hoạch chi tiết xong lại không muốn bắt đầu?',
    date: todayStr,
    rawContent:
      'Mỗi lần vẽ lộ trình học thật đẹp hay tải tài liệu mới, não cảm thấy yên tâm như thể đã tiến bộ rồi. Nhưng ngay khi đối diện trang đầu tiên để đọc hoặc viết, một sức ỳ lớn xuất hiện.',
    tags: ['Procrastination', 'Learning', 'Focus'],
    targetSection: 'problem',
    relatedResearchIds: ['res_001'],
    createdAt: now - 3600 * 1000 * 12,
    updatedAt: now - 3600 * 1000 * 12,
  };

  const raw2: RawJournalEntry = {
    id: 'raw_002',
    title: 'Suy nghĩ vụn khi học một mình không có phản hồi ngay',
    date: todayStr,
    rawContent:
      'Những việc rèn nền tảng âm thầm dễ làm mình nản vì thiếu phản hồi tức thì, trong khi việc lên kế hoạch lại cho cảm giác kiểm soát ngay lập tức.',
    tags: ['Motivation', 'Psychology'],
    targetSection: 'evidence',
    relatedResearchIds: ['res_001'],
    createdAt: now - 3600 * 1000 * 6,
    updatedAt: now - 3600 * 1000 * 6,
  };

  const proj1: ResearchProject = {
    id: 'res_001',
    code: 'RESEARCH / 001',
    domain: 'PERSONAL PSYCHOLOGY',
    date: todayStr,
    researchStatus: 'in_progress',

    title: 'Why Do I Struggle to Learn? — Overplanning & Initiation Friction',
    abstract:
      'Nghiên cứu nguyên nhân tâm lý – nhận thức đằng sau thói quen lập kế hoạch quá chi tiết nhưng lại trì hoãn khi bước vào phiên học thực sự.',
    tags: ['Learning', 'Procrastination', 'Focus', 'Psychology'],

    background:
      'Nhiều người (và chính bản thân) đầu tư rất nhiều thời gian xây hệ thống, mua sách, lập lộ trình nhưng liên tục mắc kẹt ở bước bắt tay vào 15 phút đầu tiên.',
    observation:
      'Khi vẽ xong một kế hoạch chi tiết, mình thấy phấn khích và nhẹ nhõm — nhưng cảm giác đó lại triệt tiêu động lực làm việc thực tế ngay sau đó.',
    problemStatement:
      'Làm sao tách biệt cơ chế "thỏa mãn giả nhờ lập kế hoạch" ra khỏi hành động học thực sự để giảm ma sát bắt đầu?',
    problemContext: 'Áp dụng vào quá trình tự học kỹ năng sâu và đọc tài liệu dài hạn.',

    question:
      'Tại sao việc lập kế hoạch quá kỹ hoặc tích trữ tài liệu lại tạo cảm giác tiến bộ giả và làm tăng sự trì hoãn khi bắt đầu thực hành?',
    subQuestions:
      '1. Dopamine kỳ vọng (anticipation) tác động ra sao ở pha lập kế hoạch?\n2. Khung phiên ngắn 10–20 phút không ép kết thúc có giảm ma sát khởi đầu không?',
    scope: 'Tập trung vào hành vi tự học cá nhân trong 2–4 tuần, không khái quát hóa thành rối loạn lâm sàng.',
    researchBoundaries: 'Chỉ xét các nhiệm vụ nhận thức đòi hỏi tập trung sâu (đọc hiểu, viết, giải bài tập).',

    hypothesis:
      'Việc lập kế hoạch quá mức hoạt động như cơ chế thay thế mục tiêu (Symbolic Self-Completion) để né tránh cảm giác chưa giỏi ở bước thực hành đầu tiên.',
    objectives:
      '1. Hiểu cơ chế thần kinh/tâm lý của pha kỳ vọng.\n2. Kiểm chứng quy tắc làm việc theo từng mục ngắn 10–20 phút.',
    expectedOutcomes:
      'Giảm thời gian sửa sang kế hoạch và tăng số lần ngồi vào bàn học thực tế mà không cần chuẩn bị hoàn hảo.',

    existingTheories: 'Reward Prediction Error (Schultz, 1998); Symbolic Self-Completion; Antilibrary (Taleb, 2007).',
    literatureReview:
      '- Schultz (1998): Neuron dopamine phản ứng mạnh với tín hiệu dự đoán phần thưởng hơn là phần thưởng thực tế.\n- Taleb (2007): Sách chưa đọc nên phục vụ câu hỏi nghiên cứu hiện tại thay vì trở thành áp lực.',
    relatedConcepts: 'Cognitive friction, Perfectionism paralysis, Micro-commitments.',
    researchGaps: 'Ít tài liệu phân tích tác động của giao diện công cụ học tập lên việc khuyến khích "quản lý việc học" thay vì "thực sự học".',

    researchDesign: 'Tự quan sát hành vi kết hợp nhật ký định tính theo ngày và đối chiếu lý thuyết thần kinh – tâm lý.',
    dataCollection: 'Ghi chép tự do hàng ngày (Research Notes) + nhật ký thử nghiệm phiên 15 phút.',
    participants: 'Cá nhân (N = 1, self-study observational protocol).',
    variables: 'Biến can thiệp: Giới hạn thời gian lập kế hoạch (< 3 phút) và dùng phiên ngắn 15 phút.',
    procedure: 'Ghi nhận cảm xúc trước phiên học → thực hành 15 phút → ghi nhận lực cản sau phiên.',
    optionalMethodologyFields: {
      participants: false,
      variables: true,
      procedure: false,
    },

    findings:
      'Khi bỏ qua bước "tối ưu toàn bộ lộ trình" và chỉ mở đúng 1 đầu mục trong 15 phút, cảm giác sợ hãi trước trang trắng giảm rõ rệt.',
    evidence:
      'Trong các ngày áp dụng phiên 15 phút với quyền dừng lại bất kỳ lúc nào, số phiên bắt đầu thành công tăng lên so với những ngày viết danh sách 20 đầu việc.',
    evidenceData: '5/7 ngày hoàn thành ít nhất 1 phiên 15 phút mà không sa đà sửa kế hoạch.',
    patterns: 'Cứ khi nào cảm thấy nhiệm vụ "mơ hồ và quá lớn", não lập tức chuyển sang trạng thái tìm công cụ/lập danh sách mới.',
    contradictoryEvidence:
      'Với những môn cần nền tảng tuần tự (như Thuật toán, Cờ vua), thiếu hẳn lộ trình khung cũng gây mất phương hướng.',

    experimentNotApplicable: false,
    experimentDesign:
      'Thử nghiệm 7 ngày: giảm 45 phút mạng xã hội trước giờ học, giới hạn chuẩn bị tối đa 3 phút và bắt đầu ngay với đúng 1 mục nghiên cứu.',
    experimentDailyLogs: [
      {
        id: 'elog_1',
        date: todayStr,
        observation: 'Ngày 1–2: Vẫn có thói quen muốn mở tab mới sắp xếp lại thư mục trước khi đọc.',
        note: 'Nhận diện lực cản sớm giúp dừng lại kịp thời.',
      },
      {
        id: 'elog_2',
        date: todayStr,
        observation: 'Ngày 3–5: Khi cho phép bản thân chỉ làm 1 mục trong 15 phút rồi nghỉ, việc bắt đầu trở nên nhẹ hơn hẳn.',
        note: 'Áp lực hoàn hảo giảm đáng kể.',
      },
    ],
    experimentObservations: 'Phản xạ trì hoãn xuất hiện mạnh nhất trong 3 phút đầu tiên trước khi chạm vào nội dung.',
    experimentResults: 'Hoàn thành 5 phiên tập trung 15 phút trong tuần mà không bị ngợp bởi danh sách lớn.',

    interpretation:
      'Trì hoãn không phải do thiếu kỷ luật bẩm sinh, mà là phản ứng tự nhiên khi nhiệm vụ chưa được tách thành một đơn vị hành động đủ nhỏ và an toàn.',
    comparison:
      'Phù hợp với mô tả của Schultz (1998) về dopamine kỳ vọng: lập kế hoạch cho phần thưởng nhanh mà không chịu rủi ro thất bại.',
    counterarguments:
      'Không phải mọi việc lập kế hoạch đều xấu: bản đồ khung giúp giữ hướng đi dài hạn miễn là nó không thay thế cho giờ làm việc thực.',
    alternativeExplanations:
      'Có thể sự mệt mỏi thể chất hoặc thiếu ngủ cuối ngày cũng làm tăng tỷ lệ né tránh nhiệm vụ khó.',

    conclusion:
      'Tách biệt rõ không gian lưu cấu trúc và phiên làm việc đơn lẻ 10–20 phút. Mỗi lần mở workspace chỉ xử lý đúng 1 mục đang chọn.',
    hypothesisEvaluation: 'Được ủng hộ phần lớn (Partially Supported): cấu trúc từng mục độc lập giúp giảm rõ rệt sức ỳ khởi đầu.',
    limitations: 'Cần theo dõi thêm qua 30 ngày trong giai đoạn lịch làm việc bận rộn hơn.',
    futureQuestions: 'Cấu trúc 12 mục tuần tự nhưng không khóa thứ tự có giúp duy trì nghiên cứu dài hạn qua 2 tháng không?',

    initialBelief:
      'Mình trì hoãn vì thiếu kỷ luật và cần một dashboard thật hoành tráng với thật nhiều tính năng theo dõi.',
    currentBelief:
      'Quá nhiều bảng theo dõi chỉ làm mình tốn thời gian quản lý việc nghiên cứu hơn là thực sự nghiên cứu. Một workspace tối giản từng mục hiệu quả hơn.',
    lessonsLearned: 'Nghiên cứu không cần xong trong một ngày; mỗi phiên 10–20 phút giải quyết đúng một mục là đủ.',
    personalChanges: 'Bớt chạy theo cảm giác bận rộn giả khi tinh chỉnh hệ thống; ưu tiên viết thẳng câu hỏi và bằng chứng.',

    citationFormat: 'APA 7th',
    referenceNotes: '',

    sectionStatuses: {
      overview: 'completed',
      problem: 'completed',
      questions: 'completed',
      hypothesis: 'completed',
      literature: 'in_progress',
      methodology: 'in_progress',
      evidence: 'in_progress',
      experiment: 'in_progress',
      discussion: 'in_progress',
      conclusion: 'not_started',
      reflection: 'in_progress',
      references: 'in_progress',
    },
    sectionSavedAt: {
      overview: now - 3600 * 1000 * 10,
      problem: now - 3600 * 1000 * 9,
      questions: now - 3600 * 1000 * 8,
    },
    sourceIds: ['src_001', 'src_002'],
    igRawVi:
      'Lập kế hoạch quá kỹ nhiều khi không giúp ta làm việc tốt hơn — nó chỉ cho não một liều dopamine kỳ vọng trước khi đối diện với trang giấy trắng.',
    igEnglishRewrite:
      'Overplanning rarely improves execution — it often gives the brain an early dose of anticipation dopamine before facing the blank page.',
    igDueDate: todayStr,
    igPublished: false,
    createdAt: now - 3600 * 1000 * 11,
    updatedAt: now - 3600 * 1000,
  };

  const links: SourceClaimLink[] = [
    {
      id: 'sl_001',
      researchId: 'res_001',
      sourceId: 'src_001',
      section: 'evidence',
      claimLabel: 'Cơ chế Dopamine kỳ vọng tạo thỏa mãn giả khi lập kế hoạch',
      stance: 'supports',
      excerpt: 'Dopamine neurons fire strongest during anticipation and prediction of reward cues rather than completion.',
      createdAt: now - 3600 * 1000 * 4,
    },
    {
      id: 'sl_002',
      researchId: 'res_001',
      sourceId: 'src_002',
      section: 'discussion',
      claimLabel: 'Dùng tài liệu theo câu hỏi thay vì áp lực đọc hết',
      stance: 'context',
      excerpt: 'Antilibrary paradigm: unread books act as an active reference map anchored by real research questions.',
      createdAt: now - 3600 * 1000 * 3,
    },
  ];

  const timeline: ResearchTimelineEvent[] = [
    {
      id: 'tl_001',
      researchId: 'res_001',
      dateStr: todayStr,
      timestamp: now - 3600 * 1000 * 8,
      category: 'question',
      summary: 'Đặt câu hỏi trung tâm về nghịch lý lập kế hoạch kỹ nhưng lại trì hoãn bắt tay vào làm.',
      snapshot: proj1.question,
    },
    {
      id: 'tl_002',
      researchId: 'res_001',
      dateStr: todayStr,
      timestamp: now - 3600 * 1000 * 5,
      category: 'hypothesis',
      summary: 'Hình thành giả thuyết Symbolic Self-Completion & nỗi sợ ở bước thực hành đầu tiên.',
      snapshot: proj1.hypothesis,
    },
  ];

  return {
    activeView: { kind: 'section', key: 'problem' },
    activeCoreSection: 'problem',
    lastActiveResearchId: 'res_001',
    projects: [proj1],
    rawEntries: [raw1, raw2],
    sources: [src1, src2],
    sourceLinks: links,
    timelineEvents: timeline,
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
  const rawSources = Array.isArray(parsed.sources) ? (parsed.sources as Record<string, unknown>[]) : [];
  const rawEntriesIn = Array.isArray(parsed.rawEntries) ? (parsed.rawEntries as Record<string, unknown>[]) : [];
  const rawExperiments = Array.isArray(parsed.experiments) ? (parsed.experiments as Record<string, unknown>[]) : [];
  const rawInsights = Array.isArray(parsed.insights) ? (parsed.insights as Record<string, unknown>[]) : [];
  const rawProjects = Array.isArray(parsed.projects) ? (parsed.projects as Record<string, unknown>[]) : [];

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
    ? (parsed.sourceLinks as SourceClaimLink[])
    : fallback.sourceLinks;

  const timelineEvents: ResearchTimelineEvent[] = Array.isArray(parsed.timelineEvents)
    ? (parsed.timelineEvents as ResearchTimelineEvent[])
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
