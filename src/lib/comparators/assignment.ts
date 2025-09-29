import { Assignment } from '@/lib/contracts/types';

/**
 * Deterministic assignment comparator for consistent sorting.
 * Sorts by due date first, then by assignment title.
 */
export function compareAssignment(a: Assignment, b: Assignment) {
  // Sort by due date (assignments without due date go to end)
  const dateA = a.meta?.dueDate ? new Date(a.meta.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  const dateB = b.meta?.dueDate ? new Date(b.meta.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  
  if (dateA !== dateB) {
    return dateA - dateB;
  }
  
  // Then by assignment title
  const titleA = a.meta?.title ?? '';
  const titleB = b.meta?.title ?? '';
  
  return titleA.localeCompare(titleB, 'en');
}
