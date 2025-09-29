import { Assignment } from '@/lib/contracts/types';

/**
 * Single source of truth for assignment filtering.
 * Determines which assignments should be displayed in the progress table.
 * 
 * @param assignment - The assignment to check
 * @returns true if the assignment should be displayed, false otherwise
 */
export function isProgressAssignment(assignment: Assignment): boolean {
  // Exclude Vector assignments (NTN grade vectors)
  if (assignment.meta?.assignmentType === 'Vector') {
    return false;
  }
  
  // Include assignments with valid checkpoint statuses, excluding Due, Locked, Cancelled, and Closed
  const validStatuses = ['Graded', 'Submitted', 'Missing'];
  return validStatuses.includes(assignment.meta?.checkpointStatus || '');
}
