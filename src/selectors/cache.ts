// selectors/cache.ts
// Memoized selectors with version-based caching

import { StudentData } from '@/lib/contracts/types';
import { HeaderRadialVM, bucketsForCourse, radialVMFromBuckets } from './radial';

type Key = string; // `${version}:${studentId}:${courseId}`
const cache = new Map<Key, HeaderRadialVM>();

export function getRadialVM(
  data: StudentData,
  studentId: string,
  courseId: string
): HeaderRadialVM {
  const key = `${data.version || 0}:${studentId}:${courseId}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const raw = data.students[studentId];
  const buckets = bucketsForCourse(raw, courseId);
  const vm = radialVMFromBuckets(buckets);
  cache.set(key, vm);
  return vm;
}

// Optional: when you set new data, you can clear the cache to avoid growth
export function resetRadialCache() { 
  cache.clear(); 
}
