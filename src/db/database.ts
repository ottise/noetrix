import Dexie, { type Table } from 'dexie';
import type {
  ProfileState,
  DailyLog,
  TaskItem,
  WorkflowLecture,
  PsychologyPost,
  CodeTopic,
  LeetCodeEntry,
  ChessModule,
  ChessGameLog,
  SudokuTechnique,
  SudokuRun,
  Book,
  Story,
  HobbyLog,
  WheelOption,
  LocalMediaBlob,
} from '../types';

export class LifeOSDatabase extends Dexie {
  profile!: Table<ProfileState, string>;
  dailyLogs!: Table<DailyLog, string>;
  tasks!: Table<TaskItem, string>;
  workflowLectures!: Table<WorkflowLecture, string>;
  psychologyPosts!: Table<PsychologyPost, string>;
  codeTopics!: Table<CodeTopic, string>;
  leetcodeEntries!: Table<LeetCodeEntry, string>;
  chessModules!: Table<ChessModule, string>;
  chessGames!: Table<ChessGameLog, string>;
  sudokuTechniques!: Table<SudokuTechnique, string>;
  sudokuRuns!: Table<SudokuRun, string>;
  books!: Table<Book, string>;
  stories!: Table<Story, string>;
  hobbyLogs!: Table<HobbyLog, string>;
  wheelOptions!: Table<WheelOption, string>;
  mediaBlobs!: Table<LocalMediaBlob, string>;

  constructor() {
    super('LifeOS_Personal_DB');

    this.version(1).stores({
      profile: 'id',
      dailyLogs: 'date, updatedAt',
      workflowLectures: 'id, status, dueDate, publishedAt, updatedAt',
      psychologyPosts: 'id, status, dueDate, publishedAt, updatedAt',
      codeTopics: 'id, pillar, status, updatedAt',
      leetcodeEntries: 'id, date, difficulty, createdAt',
      chessModules: 'id, phase, done',
      chessGames: 'id, date, result, createdAt',
      sudokuTechniques: 'id, tier, mastery',
      sudokuRuns: 'id, date, difficulty, pureLogic, createdAt',
      books: 'id, status, updatedAt',
      stories: 'id, updatedAt',
      hobbyLogs: 'id, type, date, createdAt',
      wheelOptions: 'id, duration, enabled',
      mediaBlobs: 'id, kind, createdAt',
    });

    // Version 2: Domain-separated Task Engine (Focus-first + Ambient Display)
    this.version(2).stores({
      profile: 'id',
      dailyLogs: 'date, updatedAt',
      tasks: 'id, status, isTodayFocus, scheduledDate, deadline, category, updatedAt',
      workflowLectures: 'id, status, dueDate, publishedAt, updatedAt',
      psychologyPosts: 'id, status, dueDate, publishedAt, updatedAt',
      codeTopics: 'id, pillar, status, updatedAt',
      leetcodeEntries: 'id, date, difficulty, createdAt',
      chessModules: 'id, phase, done',
      chessGames: 'id, date, result, createdAt',
      sudokuTechniques: 'id, tier, mastery',
      sudokuRuns: 'id, date, difficulty, pureLogic, createdAt',
      books: 'id, status, updatedAt',
      stories: 'id, updatedAt',
      hobbyLogs: 'id, type, date, createdAt',
      wheelOptions: 'id, duration, enabled',
      mediaBlobs: 'id, kind, createdAt',
    });

    // Version 3: Add createdAt index on tasks for fast chronological queries
    this.version(3).stores({
      profile: 'id',
      dailyLogs: 'date, updatedAt',
      tasks: 'id, status, isTodayFocus, scheduledDate, deadline, category, createdAt, updatedAt',
      workflowLectures: 'id, status, dueDate, publishedAt, updatedAt',
      psychologyPosts: 'id, status, dueDate, publishedAt, updatedAt',
      codeTopics: 'id, pillar, status, updatedAt',
      leetcodeEntries: 'id, date, difficulty, createdAt',
      chessModules: 'id, phase, done',
      chessGames: 'id, date, result, createdAt',
      sudokuTechniques: 'id, tier, mastery',
      sudokuRuns: 'id, date, difficulty, pureLogic, createdAt',
      books: 'id, status, updatedAt',
      stories: 'id, updatedAt',
      hobbyLogs: 'id, type, date, createdAt',
      wheelOptions: 'id, duration, enabled',
      mediaBlobs: 'id, kind, createdAt',
    });
  }
}

export const db = new LifeOSDatabase();

export function createId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function getLocalDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysStr(baseDateStr: string, days: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + days);
  return getLocalDateStr(dt);
}

export function diffDaysFromToday(targetDateStr: string): number {
  const today = getLocalDateStr();
  const [ty, tm, td] = today.split('-').map(Number);
  const [gy, gm, gd] = targetDateStr.split('-').map(Number);
  const t1 = new Date(ty, tm - 1, td).getTime();
  const t2 = new Date(gy, gm - 1, gd).getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
