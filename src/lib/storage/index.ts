import { StudentData } from '@/lib/contracts/types';
// import { getRaw, setRaw } from './redis-raw';
// import { getWithFallback, setWithDualWrite } from './fallback';
import { k } from './prefix';
import './startup-check'; // Validate storage config on startup

/**
 * KVLike interface for storage abstraction
 */
export interface KVLike {
  get: (k: string) => Promise<string | null>;
  set: (k: string, v: string, opts?: { ex?: number }) => Promise<void>;
  del: (k: string) => Promise<void>;
  mget: (...ks: string[]) => Promise<(string | null)[]>;
}

/**
 * Upstash-backed KV implementation
 */
export const kv: KVLike = {
  get: async (key) => {
    const { getRaw } = await import('./redis-raw');
    return getRaw(key);
  },
  set: async (key, value, opts) => {
    const { setRaw } = await import('./redis-raw');
    return setRaw(key, value, opts);
  },
  del: async (key) => {
    const { delRaw } = await import('./redis-raw');
    await delRaw(key);
  },
  mget: async (...keys) => {
    const { getRaw } = await import('./redis-raw');
    return Promise.all(keys.map(key => getRaw(key)));
  },
};

export async function loadStudentData(): Promise<StudentData | null> {
  const raw = await getWithFallback(k('studentData:v1'));
  if (!raw) return null;
  
  const studentData = JSON.parse(raw) as StudentData;
  
  // Add lastLoadedAt from separate key
  const lastLoadedAt = await getWithFallback(k('lastLoadedAt'));
  if (lastLoadedAt) {
    try {
      const timestamp = JSON.parse(lastLoadedAt);
      return { ...studentData, lastLoadedAt: timestamp };
    } catch {
      // If parsing fails, use current time as fallback
      return { ...studentData, lastLoadedAt: new Date().toISOString() };
    }
  }
  
  // If no lastLoadedAt, use current time
  return { ...studentData, lastLoadedAt: new Date().toISOString() };
}

export async function saveStudentData(doc: StudentData): Promise<void> {
  await setWithDualWrite(k('studentData:v1'), JSON.stringify(doc));
}

// Atomic save function
export async function saveStudentDataAtomically(doc: StudentData): Promise<void> {
  await saveStudentData(doc);
}
