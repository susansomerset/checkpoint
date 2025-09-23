import { k } from './prefix';
import { getRaw, setRaw, delRaw } from './redis-raw';
import type { StudentData } from '@/lib/student/schema';

export async function getStudentData(): Promise<StudentData | null> {
  const raw = await getRaw(k('studentData'));
  return raw ? (JSON.parse(raw) as StudentData) : null;
}

export async function getMetaData<T = unknown>(): Promise<T | null> {
  const raw = await getRaw(k('metaData'));
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setMetaData(meta: unknown) {
  await setRaw(k('metaData'), JSON.stringify(meta));
}

export async function getLastLoadedAt(): Promise<string | null> {
  const raw = await getRaw(k('lastLoadedAt'));
  return raw ? JSON.parse(raw) : null;
}

/** Atomic save for studentData (temp write → verify → swap → cleanup → timestamp) */
export async function saveStudentDataAtomically(draft: StudentData) {
  const body = JSON.stringify(draft);
  const tmpKey = k(`tmp:studentData:${Date.now()}`);

  await setRaw(tmpKey, body);

  const echo = await getRaw(tmpKey);
  if (echo !== body) throw new Error('Temp write verification failed');

  await setRaw(k('studentData'), echo!);
  await delRaw(tmpKey);
  await setRaw(k('lastLoadedAt'), new Date().toISOString());
}
