import { StudentData } from './schema';

export function makeFreshStudentData(): StudentData {
  return {
    students: {
      s1: { studentId: 's1', meta: {}, courses: {} },
      s2: { studentId: 's2', meta: {}, courses: {} },
    },
  };
}

export function applyDeltas(current: StudentData): StudentData {
  // TODO: implement merge rules. Keep deterministic, id-based updates only.
  // For now, just return current data unchanged
  return current;
}

export function recomputeStatuses(doc: StudentData): StudentData {
  // TODO: traverse assignments and recompute status fields.
  return doc;
}
