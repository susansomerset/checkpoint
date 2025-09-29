/**
 * Centralized formatters for consistency across components.
 * These match the formatting used in header radials to avoid mismatches.
 */

export const formatPoints = (n: number | null | undefined): string => 
  (n ?? 0).toLocaleString('en-US');

export const formatPercentage = (earned: number, possible: number): string => {
  const pct = possible ? Math.round((100 * earned) / possible) : 0;
  return `${pct}%`;
};

export const formatDue = (dueDate?: string | Date): string => {
  if (!dueDate) return '(no due date)';
  
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit'
  });
};
