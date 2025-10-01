/**
 * React hook wrapper for getRawDetailSnapshot
 * 
 * Provides a callable that accesses StudentContext internally,
 * avoiding prop drilling through UI components.
 * 
 * Usage:
 *   const getSnapshot = useRawDetailSnapshot();
 *   if (getSnapshot) {
 *     const snapshot = getSnapshot({ studentId, courseId, assignmentId });
 *   }
 */

import { useMemo } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { getRawDetailSnapshot, RawDetailSnapshot } from '@/lib/compose/detailData';

type SnapshotGetter = (_ids: {
  studentId: string;
  courseId: string;
  assignmentId: string;
}) => RawDetailSnapshot | null;

/**
 * Hook that returns a callable for getting raw detail snapshots
 * Returns null if StudentData not yet loaded
 */
export function useRawDetailSnapshot(): SnapshotGetter | null {
  const { data: studentData } = useStudent();

  return useMemo<SnapshotGetter | null>(() => {
    if (!studentData) return null;

    return ({ studentId, courseId, assignmentId }) =>
      getRawDetailSnapshot(studentData, studentId, courseId, assignmentId);
  }, [studentData]);
}

