import type { MediaAttachmentRef } from '../types';

export const SYNCABLE_KV_KEYS = [
  'noetrix_personal_research_journal_v1',
  'noetrix_screenplay_studio_v1',
  'noetrix_leetcode100_progress_v1',
  'noetrix_os_knowledge_base_v1',
  'noetrix_net_knowledge_base_v1',
  'noetrix_lab_field_notes_v1',
] as const;

export type SyncableKvKey = (typeof SYNCABLE_KV_KEYS)[number];

const KV_META_KEY = 'noetrix_kv_sync_meta_v1';

interface KvSyncMetaEntry {
  hash: string;
  updatedAt: number;
}

function fastHash(str: string): string {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${str.length}:${(h >>> 0).toString(16)}`;
}

function loadKvMeta(): Record<string, KvSyncMetaEntry> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KV_META_KEY);
    if (raw) return JSON.parse(raw) as Record<string, KvSyncMetaEntry>;
  } catch {
    // ignore corrupt meta
  }
  return {};
}

function saveKvMeta(meta: Record<string, KvSyncMetaEntry>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KV_META_KEY, JSON.stringify(meta));
  } catch {
    // ignore storage limits
  }
}

export function readLocalKvWithTimestamp(key: SyncableKvKey): {
  raw: string;
  updatedAt: number;
} | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  const hash = fastHash(raw);
  const meta = loadKvMeta();
  const prev = meta[key];
  if (!prev || prev.hash !== hash) {
    const now = Date.now();
    meta[key] = { hash, updatedAt: now };
    saveKvMeta(meta);
    return { raw, updatedAt: now };
  }
  return { raw, updatedAt: prev.updatedAt };
}

export function writeLocalKvFromSync(
  key: SyncableKvKey,
  raw: string,
  updatedAt: number
): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, raw);
    const meta = loadKvMeta();
    meta[key] = { hash: fastHash(raw), updatedAt };
    saveKvMeta(meta);
  } catch {
    // ignore storage errors
  }
}

export function saveLocalKvAndTouch(key: SyncableKvKey, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  const raw = JSON.stringify(value);
  const now = Date.now();
  writeLocalKvFromSync(key, raw, now);
}

/** Backfill uploaded media remoteUrl into localStorage JSON structures (Research & Writing Room) */
export function backfillMediaUrlInKvStores(mediaId: string, remoteUrl: string): void {
  if (typeof localStorage === 'undefined') return;

  const patchAudios = (list?: MediaAttachmentRef[]) => {
    if (!Array.isArray(list)) return { changed: false, next: list };
    let changed = false;
    const next = list.map((a) => {
      if (a.mediaId === mediaId && !a.remoteUrl) {
        changed = true;
        return { ...a, remoteUrl };
      }
      return a;
    });
    return { changed, next };
  };

  try {
    const rawRj = localStorage.getItem('noetrix_personal_research_journal_v1');
    if (rawRj) {
      const parsed = JSON.parse(rawRj) as { projects?: Array<{ audios?: MediaAttachmentRef[]; updatedAt?: number }> };
      if (Array.isArray(parsed.projects)) {
        let changed = false;
        parsed.projects = parsed.projects.map((p) => {
          const res = patchAudios(p.audios);
          if (res.changed) {
            changed = true;
            return { ...p, audios: res.next, updatedAt: Date.now() };
          }
          return p;
        });
        if (changed) saveLocalKvAndTouch('noetrix_personal_research_journal_v1', parsed);
      }
    }
  } catch {
    // ignore
  }

  try {
    const rawSp = localStorage.getItem('noetrix_screenplay_studio_v1');
    if (rawSp) {
      const parsed = JSON.parse(rawSp) as {
        projects?: Array<{
          scenes?: Array<{ audios?: MediaAttachmentRef[]; updatedAt?: number }>;
          updatedAt?: number;
        }>;
      };
      if (Array.isArray(parsed.projects)) {
        let changed = false;
        parsed.projects = parsed.projects.map((proj) => {
          if (!Array.isArray(proj.scenes)) return proj;
          let projChanged = false;
          const scenes = proj.scenes.map((sc) => {
            const res = patchAudios(sc.audios);
            if (res.changed) {
              projChanged = true;
              changed = true;
              return { ...sc, audios: res.next, updatedAt: Date.now() };
            }
            return sc;
          });
          return projChanged ? { ...proj, scenes, updatedAt: Date.now() } : proj;
        });
        if (changed) saveLocalKvAndTouch('noetrix_screenplay_studio_v1', parsed);
      }
    }
  } catch {
    // ignore
  }
}

export function notifyKvSynced(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('noetrix-kv-synced'));
  }
}
