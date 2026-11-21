import type { LessonDiagram } from '../features/learn/programmingData';

export type WorkspaceId =
  | 'home'
  | 'learning'
  | 'knowledge'
  | 'creative'
  | 'life'
  | 'playground';

// Backwards-compatible alias
export type TabId = WorkspaceId;

export type CodePillar = 'workflow_ai' | 'leetcode' | 'java' | 'csharp' | 'web';

export type TaskCategory = 'learning' | 'health' | 'creative' | 'publishing' | 'life';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'inbox' | 'planned' | 'in_progress' | 'completed' | 'paused';
export type TaskRecurrence = 'none' | 'daily' | 'every3days' | 'weekly';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  project: string;
  priority: TaskPriority;
  status: TaskStatus;
  isTodayFocus: boolean; // Max 3 manually curated by user
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  deadline?: string; // YYYY-MM-DD
  durationMinutes?: number;
  recurrence: TaskRecurrence;
  relatedNote?: string;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface WidgetSnapshot {
  version: 1;
  generatedAt: string;
  dateLabel: string;
  focusTasks: {
    id: string;
    title: string;
    done: boolean;
    category: TaskCategory;
  }[];
  focusCompleted: number;
  focusTotal: number;
  remainingCount: number;
  nextUp: {
    title: string;
    category: TaskCategory;
    time?: string;
    durationMinutes?: number;
  } | null;
  nearestDeadline: {
    title: string;
    dueDate: string;
    daysLeft: number;
  } | null;
  lifeBalance: {
    learn: boolean;
    read: boolean;
    move: boolean;
    create: boolean;
  };
}

export interface ProfileState {
  id: 'main';
  appName: string;
  motto: string;
  xp: number;
  tiktokRescues: number;
  streakShields: number;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  lastBackupAt?: number;
  updatedAt: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD (primary key)
  codeDone: boolean;
  codePillars: CodePillar[];
  codeMinutes: number;
  englishDone: boolean;
  englishNote: string;
  gymDone: boolean;
  gymSplit: string;
  readDone?: boolean;
  createDone?: boolean;
  dailyNote: string;
  xpEarned: number;
  updatedAt: number;
}

export interface MediaAttachmentRef {
  mediaId: string;
  caption: string;
  fileName: string;
  remoteUrl?: string;
  durationSec?: number;
  createdAt: number;
}

export type WorkflowStatus = 'studying' | 'writing' | 'media' | 'ready' | 'published';

export interface WorkflowLecture {
  id: string;
  title: string;
  tags: string[];
  status: WorkflowStatus;
  dueDate: string;
  publishedAt?: string;
  checklist: {
    studied: boolean;
    docVi: boolean;
    docEn: boolean;
    images: boolean;
    audio: boolean;
  };
  docVi: string;
  docEn: string;
  notes: string;
  images: MediaAttachmentRef[];
  audios: MediaAttachmentRef[];
  diagrams?: { id: string; title: string; diagram: LessonDiagram }[];
  createdAt: number;
  updatedAt: number;
}

export type PsychStatus = 'idea' | 'raw' | 'research' | 'english' | 'published';

export interface PsychologyPost {
  id: string;
  title: string;
  behaviorConcept: string;
  hook: string;
  status: PsychStatus;
  dueDate: string;
  publishedAt?: string;
  rawVi: string;
  researchNotes: string;
  sources: string;
  factChecked: boolean;
  englishRewrite: string;
  reflection: string;
  createdAt: number;
  updatedAt: number;
}

export interface CodeTopic {
  id: string;
  pillar: CodePillar;
  title: string;
  status: 'todo' | 'learning' | 'mastered';
  notes: string;
  resourceUrl: string;
  updatedAt: number;
}

export interface LeetCodeEntry {
  id: string;
  problemName: string;
  pattern: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  solvedWithoutHint: boolean;
  timeMinutes: number;
  keyIdea: string;
  date: string;
  createdAt: number;
}

export type ChessTrackPillar = 'foundation' | 'calculation' | 'strategy' | 'mastery';
export type ChessStage = 'beginner' | 'intermediate' | 'advanced';

export interface ChessResourceRef {
  label: string;
  author?: string;
  url?: string;
  note?: string;
}

export interface ChessModule {
  id: string;
  phase: 1 | 2 | 3 | 4 | 5;
  phaseTitle: string;
  title: string;
  description: string;
  done: boolean;
  notes: string;
  stage?: ChessStage;
  eloRange?: string;
  trackPillar?: ChessTrackPillar;
  concept?: string;
  example?: string;
  exercise?: string;
  mistake?: string;
  openQuestion?: string;
  reviewDate?: string;
  resources?: ChessResourceRef[];
  updatedAt: number;
}

export interface ChessGameLog {
  id: string;
  date: string;
  platform: 'Lichess' | 'Chess.com' | 'OTB';
  rating: number;
  result: 'win' | 'loss' | 'draw';
  blunderType: string;
  gameUrl: string;
  takeaway: string;
  turningPointMove?: string;
  missedCandidateMove?: string;
  calculatedOrGuessed?: 'calculated' | 'guessed' | 'mixed';
  errorCategory?: 'tactics' | 'strategy' | 'time' | 'endgame' | 'opening';
  createdAt: number;
}

export type SudokuSkillBranch =
  | 'fundamentals'
  | 'elimination'
  | 'patterns'
  | 'chains'
  | 'expert_solving';

export interface SudokuTechnique {
  id: string;
  tier: 'basic' | 'intermediate' | 'expert' | 'mastery';
  skillBranch?: SudokuSkillBranch;
  difficultyRange?: string;
  name: string;
  summary: string;
  howToSpot: string;
  example?: string;
  mastery: 'unknown' | 'practicing' | 'mastered';
  notes: string;
  updatedAt: number;
}

export interface SudokuRun {
  id: string;
  date: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master' | 'Extreme';
  durationMinutes: number;
  pureLogic: boolean;
  guessCount?: number;
  mistakeCount?: number;
  techniquesUsed: string[];
  stuckAtMinute?: number;
  stuckNote: string;
  createdAt: number;
}

export interface BookQuote {
  id: string;
  text: string;
  note?: string;
  page?: string;
  imageMediaId?: string;
  imageRemoteUrl?: string;
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  status: 'unread' | 'reading' | 'finished';
  totalPages: number;
  currentPage: number;
  whyBought: string;
  quotes: BookQuote[];
  createdAt: number;
  updatedAt: number;
}

export interface StoryCharacter {
  id: string;
  name: string;
  role: string;
  traits: string;
  motivation: string;
  arc: string;
}

export interface StoryWorldItem {
  id: string;
  category: 'Địa điểm' | 'Quy tắc' | 'Tổ chức' | 'Dòng thời gian' | 'Khác';
  title: string;
  content: string;
}

export interface StoryChapter {
  id: string;
  order: number;
  title: string;
  status: 'outline' | 'draft' | 'revising' | 'done';
  summary: string;
  content: string;
  notes: string;
  updatedAt: number;
}

export interface StorySpark {
  id: string;
  text: string;
  tag: string;
  createdAt: number;
}

export interface Story {
  id: string;
  title: string;
  genre: string;
  logline: string;
  synopsis: string;
  targetWords: number;
  characters: StoryCharacter[];
  worldItems: StoryWorldItem[];
  chapters: StoryChapter[];
  sparks: StorySpark[];
  createdAt: number;
  updatedAt: number;
}

export type HobbyLogType = 'gym' | 'swimming' | 'drawing' | 'places';

export interface HobbyLog {
  id: string;
  type: HobbyLogType;
  date: string;
  title: string;
  durationMinutes: number;
  details: string;
  distanceMeters?: number;
  stroke?: string;
  gymSplit?: string;
  gymPhotoKind?: 'body' | 'scale';
  locationName?: string;
  imageMediaId?: string;
  imageRemoteUrl?: string;
  createdAt: number;
}

export type WheelDuration = 'quick' | 'medium' | 'deep' | 'relax';

export interface WheelOption {
  id: string;
  label: string;
  category: string;
  duration: WheelDuration;
  suggestedMinutes: number;
  color: string;
  enabled: boolean;
  xpReward: number;
}

export interface LocalMediaBlob {
  id: string;
  kind: 'image' | 'audio';
  mimeType: string;
  blob: Blob;
  fileName: string;
  size: number;
  remoteUrl?: string;
  createdAt: number;
}
