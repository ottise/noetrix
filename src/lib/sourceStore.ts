import { db } from '../db/database';
import { APP_CONFIG } from '../config/appConfig';

const LC100_STORAGE_KEY = 'noetrix_leetcode100_progress_v1';
const RESEARCH_JOURNAL_STORAGE_KEY = 'noetrix_personal_research_journal_v1';
const SCREENPLAY_STUDIO_STORAGE_KEY = 'noetrix_screenplay_studio_v1';
const EXCALIDRAW_STORAGE_KEY = 'noetrix_excalidraw_boards_v1';
const LAB_FIELD_NOTES_STORAGE_KEY = 'noetrix_lab_field_notes_v1';
const CODE_LEARNING_ENV_KEY = 'noetrix_code_learning_env_v1';
const OS_KB_STORAGE_KEY = 'noetrix_os_knowledge_base_v1';
const NET_KB_STORAGE_KEY = 'noetrix_net_knowledge_base_v1';

const TABLE_NAMES = [
  'profile',
  'tasks',
  'dailyLogs',
  'workflowLectures',
  'psychologyPosts',
  'codeTopics',
  'leetcodeEntries',
  'chessModules',
  'chessGames',
  'sudokuTechniques',
  'sudokuRuns',
  'books',
  'stories',
  'hobbyLogs',
  'wheelOptions',
] as const;

let saveTimer: number | null = null;

/**
 * Push current IndexedDB + LeetCode 100 state directly into `src/data/noetrix-store.json`
 * inside the project source code via the Vite middleware endpoint `/__noetrix_source_store`.
 */
export async function persistAllDataToSourceCode(): Promise<void> {
  if (!APP_CONFIG.ambient.autoSaveToSourceCodeJson) return;

  try {
    const tables: Record<string, unknown[]> = {};
    for (const name of TABLE_NAMES) {
      tables[name] = await db.table(name).toArray();
    }

    let leetcode100: unknown = null;
    let researchJournal: unknown = null;
    let screenplayStudio: unknown = null;
    let excalidrawBoards: unknown = null;
    let labFieldNotes: unknown = null;
    let codeLearningEnv: unknown = null;
    let osKnowledgeBase: unknown = null;
    let netKnowledgeBase: unknown = null;
    try {
      const rawLc = localStorage.getItem(LC100_STORAGE_KEY);
      if (rawLc) leetcode100 = JSON.parse(rawLc);
      const rawRj = localStorage.getItem(RESEARCH_JOURNAL_STORAGE_KEY);
      if (rawRj) researchJournal = JSON.parse(rawRj);
      const rawSp = localStorage.getItem(SCREENPLAY_STUDIO_STORAGE_KEY);
      if (rawSp) screenplayStudio = JSON.parse(rawSp);
      const rawEx = localStorage.getItem(EXCALIDRAW_STORAGE_KEY);
      if (rawEx) excalidrawBoards = JSON.parse(rawEx);
      const rawFn = localStorage.getItem(LAB_FIELD_NOTES_STORAGE_KEY);
      if (rawFn) labFieldNotes = JSON.parse(rawFn);
      const rawCle = localStorage.getItem(CODE_LEARNING_ENV_KEY);
      if (rawCle) codeLearningEnv = JSON.parse(rawCle);
      const rawOs = localStorage.getItem(OS_KB_STORAGE_KEY);
      if (rawOs) osKnowledgeBase = JSON.parse(rawOs);
      const rawNet = localStorage.getItem(NET_KB_STORAGE_KEY);
      if (rawNet) netKnowledgeBase = JSON.parse(rawNet);
    } catch {
      // ignore
    }

    const payload = {
      appName: APP_CONFIG.identity.appName,
      savedAt: new Date().toISOString(),
      timestamp: Date.now(),
      tables,
      leetcode100,
      researchJournal,
      screenplayStudio,
      excalidrawBoards,
      labFieldNotes,
      codeLearningEnv,
      osKnowledgeBase,
      netKnowledgeBase,
    };

    await fetch('/__noetrix_source_store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent when running as static production bundle without dev server middleware
  }
}

/**
 * Debounced auto-save to `src/data/noetrix-store.json` whenever any data changes.
 */
export function scheduleSourceCodeSave(): void {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    persistAllDataToSourceCode().catch(() => {});
  }, 900);
}

/**
 * On startup, if `src/data/noetrix-store.json` exists in source code, hydrate any missing
 * records into IndexedDB / localStorage, and then persist the latest snapshot back to source code.
 */
export async function initSourceCodeAutoSync(): Promise<void> {
  try {
    const res = await fetch('/__noetrix_source_store');
    if (res.ok) {
      const data = await res.json();
      if (data && !data.empty && data.tables) {
        const existingTasksCount = await db.tasks.count();
        // If browser IndexedDB was cleared, restore automatically from src/data/noetrix-store.json
        if (existingTasksCount === 0) {
          for (const name of TABLE_NAMES) {
            const rows = data.tables[name];
            if (Array.isArray(rows) && rows.length > 0) {
              await db.table(name).bulkPut(rows);
            }
          }
        }
        if (data.leetcode100 && !localStorage.getItem(LC100_STORAGE_KEY)) {
          localStorage.setItem(LC100_STORAGE_KEY, JSON.stringify(data.leetcode100));
        }
        if (data.researchJournal && !localStorage.getItem(RESEARCH_JOURNAL_STORAGE_KEY)) {
          localStorage.setItem(RESEARCH_JOURNAL_STORAGE_KEY, JSON.stringify(data.researchJournal));
        }
        if (data.screenplayStudio && !localStorage.getItem(SCREENPLAY_STUDIO_STORAGE_KEY)) {
          localStorage.setItem(SCREENPLAY_STUDIO_STORAGE_KEY, JSON.stringify(data.screenplayStudio));
        }
        if (data.excalidrawBoards && !localStorage.getItem(EXCALIDRAW_STORAGE_KEY)) {
          localStorage.setItem(EXCALIDRAW_STORAGE_KEY, JSON.stringify(data.excalidrawBoards));
        }
        if (data.labFieldNotes && !localStorage.getItem(LAB_FIELD_NOTES_STORAGE_KEY)) {
          localStorage.setItem(LAB_FIELD_NOTES_STORAGE_KEY, JSON.stringify(data.labFieldNotes));
        }
        if (data.codeLearningEnv && !localStorage.getItem(CODE_LEARNING_ENV_KEY)) {
          localStorage.setItem(CODE_LEARNING_ENV_KEY, JSON.stringify(data.codeLearningEnv));
        }
        if (data.osKnowledgeBase && !localStorage.getItem(OS_KB_STORAGE_KEY)) {
          localStorage.setItem(OS_KB_STORAGE_KEY, JSON.stringify(data.osKnowledgeBase));
        }
        if (data.netKnowledgeBase && !localStorage.getItem(NET_KB_STORAGE_KEY)) {
          localStorage.setItem(NET_KB_STORAGE_KEY, JSON.stringify(data.netKnowledgeBase));
        }
      }
    }
  } catch {
    // ignore if static build
  }

  // Write initial snapshot to `src/data/noetrix-store.json` so the file always exists in source code
  await persistAllDataToSourceCode();
}
