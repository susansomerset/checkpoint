import { StudentData } from '@/lib/contracts/types';
// import { getRaw, setRaw } from './redis-raw';
// import { getWithFallback, setWithDualWrite } from './fallback';
import { k } from './prefix';
import './startup-check'; // Validate storage config on startup

/**
 * KVLike interface for storage abstraction
 */
export interface KVLike {
  get: (_k: string) => Promise<string | null>;
  set: (_k: string, _v: string) => Promise<void>;
  del: (_k: string) => Promise<void>;
  mget: (..._ks: string[]) => Promise<(string | null)[]>;
}

/**
 * Upstash-backed KV implementation
 */
export const kv: KVLike = {
  get: async (key) => {
    const { getRaw } = await import('./redis-raw');
    return getRaw(key);
  },
  set: async (key, value) => {
    const { setRaw } = await import('./redis-raw');
    return setRaw(key, value);
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
  const { getRaw } = await import('./redis-raw');
  const raw = await getRaw(k('studentData:v1'));
  if (!raw) return null;
  
  const studentData = JSON.parse(raw) as StudentData;
  
  // Add lastLoadedAt from separate key
  const lastLoadedAt = await getRaw(k('lastLoadedAt'));
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
  const { setRaw } = await import('./redis-raw');
  await setRaw(k('studentData:v1'), JSON.stringify(doc));
}

// Atomic save function
export async function saveStudentDataAtomically(doc: StudentData): Promise<void> {
  await saveStudentData(doc);
}
