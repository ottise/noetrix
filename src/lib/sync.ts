import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, getLocalDateStr } from '../db/database';
import { initFirebaseIfConfigured } from './firebase';
import {
  SYNCABLE_KV_KEYS,
  readLocalKvWithTimestamp,
  writeLocalKvFromSync,
  backfillMediaUrlInKvStores,
  notifyKvSynced,
} from './kvSync';

const SYNC_TABLES = [
  { name: 'profile', keyField: 'id' },
  { name: 'dailyLogs', keyField: 'date' },
  { name: 'tasks', keyField: 'id' },
  { name: 'workflowLectures', keyField: 'id' },
  { name: 'psychologyPosts', keyField: 'id' },
  { name: 'codeTopics', keyField: 'id' },
  { name: 'leetcodeEntries', keyField: 'id' },
  { name: 'chessModules', keyField: 'id' },
  { name: 'chessGames', keyField: 'id' },
  { name: 'sudokuTechniques', keyField: 'id' },
  { name: 'sudokuRuns', keyField: 'id' },
  { name: 'books', keyField: 'id' },
  { name: 'stories', keyField: 'id' },
  { name: 'hobbyLogs', keyField: 'id' },
  { name: 'wheelOptions', keyField: 'id' },
] as const;

type SyncTableName = (typeof SYNC_TABLES)[number]['name'];

function getTimestamp(item: Record<string, unknown>): number {
  if (typeof item.updatedAt === 'number') return item.updatedAt;
  if (typeof item.createdAt === 'number') return item.createdAt;
  return 0;
}

/**
 * Bidirectional Last-Write-Wins sync between local IndexedDB and Firestore under users/{uid}/{table}/{docId}
 */
export async function syncWithFirebaseCloud(): Promise<{
  pushed: number;
  pulled: number;
  mediaUploaded: number;
}> {
  const { auth, firestore, storage } = initFirebaseIfConfigured();
  if (!auth?.currentUser || !firestore) {
    throw new Error('Cần đăng nhập Firebase trước khi đồng bộ.');
  }

  const uid = auth.currentUser.uid;
  let pushed = 0;
  let pulled = 0;
  let mediaUploaded = 0;

  // 1. Upload pending local media blobs to Firebase Storage (best effort)
  if (storage) {
    const allMedia = await db.mediaBlobs.toArray();
    for (const media of allMedia) {
      if (!media.remoteUrl && media.blob) {
        try {
          const ext = media.fileName.split('.').pop() || (media.kind === 'image' ? 'jpg' : 'm4a');
          const storageRef = ref(storage, `users/${uid}/media/${media.id}.${ext}`);
          await uploadBytes(storageRef, media.blob, { contentType: media.mimeType });
          const remoteUrl = await getDownloadURL(storageRef);
          await db.mediaBlobs.update(media.id, { remoteUrl });
          mediaUploaded++;

          // Backfill remoteUrl into workflowLectures & hobbyLogs
          const lectures = await db.workflowLectures.toArray();
          for (const lec of lectures) {
            let changed = false;
            const images = lec.images.map((im) => {
              if (im.mediaId === media.id && !im.remoteUrl) {
                changed = true;
                return { ...im, remoteUrl };
              }
              return im;
            });
            const audios = lec.audios.map((au) => {
              if (au.mediaId === media.id && !au.remoteUrl) {
                changed = true;
                return { ...au, remoteUrl };
              }
              return au;
            });
            if (changed) {
              await db.workflowLectures.update(lec.id, { images, audios, updatedAt: Date.now() });
            }
          }

          const hobbies = await db.hobbyLogs.toArray();
          for (const hb of hobbies) {
            if (hb.imageMediaId === media.id && !hb.imageRemoteUrl) {
              await db.hobbyLogs.update(hb.id, { imageRemoteUrl: remoteUrl });
            }
          }

          backfillMediaUrlInKvStores(media.id, remoteUrl);
        } catch (err) {
          console.warn('Skipped media upload:', media.id, err);
        }
      }
    }
  }

  // 2. Sync each structured table
  for (const tableSpec of SYNC_TABLES) {
    const table = db[tableSpec.name as SyncTableName] as unknown as {
      toArray: () => Promise<Record<string, unknown>[]>;
      put: (item: Record<string, unknown>) => Promise<unknown>;
    };

    const localItems = await table.toArray();
    const localMap = new Map<string, Record<string, unknown>>();
    for (const item of localItems) {
      const k = String(item[tableSpec.keyField]);
      localMap.set(k, item);
    }

    const colRef = collection(firestore, 'users', uid, tableSpec.name);
    const snap = await getDocs(colRef);
    const remoteMap = new Map<string, Record<string, unknown>>();
    snap.forEach((docSnap) => {
      remoteMap.set(docSnap.id, docSnap.data() as Record<string, unknown>);
    });

    const allKeys = new Set([...localMap.keys(), ...remoteMap.keys()]);
    for (const key of allKeys) {
      const localItem = localMap.get(key);
      const remoteItem = remoteMap.get(key);

      if (localItem && !remoteItem) {
        await setDoc(doc(colRef, key), localItem);
        pushed++;
      } else if (!localItem && remoteItem) {
        await table.put(remoteItem);
        pulled++;
      } else if (localItem && remoteItem) {
        const lt = getTimestamp(localItem);
        const rt = getTimestamp(remoteItem);
        if (lt > rt) {
          await setDoc(doc(colRef, key), localItem);
          pushed++;
        } else if (rt > lt) {
          await table.put(remoteItem);
          pulled++;
        }
      }
    }
  }

  // 3. Sync localStorage workspaces (Psychology, Writing Room, LeetCode, OS/Net KB)
  const kvColRef = collection(firestore, 'users', uid, 'kvState');
  const kvSnap = await getDocs(kvColRef);
  const remoteKv = new Map<string, { raw: string; updatedAt: number }>();
  kvSnap.forEach((docSnap) => {
    const data = docSnap.data() as { raw?: unknown; updatedAt?: unknown };
    if (typeof data.raw === 'string') {
      remoteKv.set(docSnap.id, {
        raw: data.raw,
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
      });
    }
  });

  let anyKvPulled = false;
  for (const key of SYNCABLE_KV_KEYS) {
    const localKv = readLocalKvWithTimestamp(key);
    const remKv = remoteKv.get(key);
    if (localKv && !remKv) {
      await setDoc(doc(kvColRef, key), { raw: localKv.raw, updatedAt: localKv.updatedAt });
      pushed++;
    } else if (!localKv && remKv) {
      writeLocalKvFromSync(key, remKv.raw, remKv.updatedAt);
      pulled++;
      anyKvPulled = true;
    } else if (localKv && remKv) {
      if (localKv.updatedAt > remKv.updatedAt) {
        await setDoc(doc(kvColRef, key), { raw: localKv.raw, updatedAt: localKv.updatedAt });
        pushed++;
      } else if (remKv.updatedAt > localKv.updatedAt && localKv.raw !== remKv.raw) {
        writeLocalKvFromSync(key, remKv.raw, remKv.updatedAt);
        pulled++;
        anyKvPulled = true;
      }
    }
  }
  if (anyKvPulled) {
    notifyKvSynced();
  }

  return { pushed, pulled, mediaUploaded };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(dataUrl: string, fallbackMime: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : fallbackMime;
  const bin = atob(parts[1] || '');
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function exportFullBackupJson(includeMedia = true): Promise<void> {
  const payload: Record<string, unknown> = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {},
    media: [],
  };

  const tablesObj: Record<string, unknown[]> = {};
  for (const spec of SYNC_TABLES) {
    const table = db[spec.name as SyncTableName] as unknown as {
      toArray: () => Promise<unknown[]>;
    };
    tablesObj[spec.name] = await table.toArray();
  }
  payload.tables = tablesObj;

  if (includeMedia) {
    const mediaRows = await db.mediaBlobs.toArray();
    const serialized = [];
    for (const row of mediaRows) {
      const dataUrl = await blobToBase64(row.blob);
      serialized.push({
        id: row.id,
        kind: row.kind,
        mimeType: row.mimeType,
        fileName: row.fileName,
        size: row.size,
        remoteUrl: row.remoteUrl,
        createdAt: row.createdAt,
        dataUrl,
      });
    }
    payload.media = serialized;
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifeos-backup-${getLocalDateStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFullBackupJson(file: File): Promise<{ restoredRecords: number; restoredMedia: number }> {
  const text = await file.text();
  const parsed = JSON.parse(text) as {
    tables?: Record<string, Record<string, unknown>[]>;
    media?: Array<{
      id: string;
      kind: 'image' | 'audio';
      mimeType: string;
      fileName: string;
      size: number;
      remoteUrl?: string;
      createdAt: number;
      dataUrl: string;
    }>;
  };

  let restoredRecords = 0;
  let restoredMedia = 0;

  if (parsed.tables) {
    for (const spec of SYNC_TABLES) {
      const rows = parsed.tables[spec.name];
      if (Array.isArray(rows) && rows.length > 0) {
        const table = db[spec.name as SyncTableName] as unknown as {
          bulkPut: (items: unknown[]) => Promise<unknown>;
        };
        await table.bulkPut(rows);
        restoredRecords += rows.length;
      }
    }
  }

  if (Array.isArray(parsed.media)) {
    for (const item of parsed.media) {
      if (item.dataUrl) {
        const blob = base64ToBlob(item.dataUrl, item.mimeType);
        await db.mediaBlobs.put({
          id: item.id,
          kind: item.kind,
          mimeType: item.mimeType,
          blob,
          fileName: item.fileName,
          size: item.size || blob.size,
          remoteUrl: item.remoteUrl,
          createdAt: item.createdAt || Date.now(),
        });
        restoredMedia++;
      }
    }
  }

  return { restoredRecords, restoredMedia };
}
