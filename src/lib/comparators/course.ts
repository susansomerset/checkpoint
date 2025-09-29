import { Course } from '@/lib/contracts/types';

/**
 * Deterministic course comparator for consistent sorting.
 * Sorts by period number first, then by course short name.
 */
export function compareCourse(a: Course, b: Course) {
  const pa = a.meta?.period ?? 999;
  const pb = b.meta?.period ?? 999;
  
  if (pa !== pb) {
    return pa - pb;
  }
  
  const nameA = a.meta?.shortName ?? a.meta?.legalName ?? '';
  const nameB = b.meta?.shortName ?? b.meta?.legalName ?? '';
  
  return nameA.localeCompare(nameB, 'en');
}
