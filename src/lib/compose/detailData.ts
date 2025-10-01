/**
 * compose.detailData v1.0.0
 * Spec: spec/current.json
 * 
 * Adapter from StudentContext → DetailRow[] for the selected student
 * Thin wrapper that calls processing.getDetailRows with the selected student
 * Also provides on-demand raw snapshot retrieval for modal display
 */

import { getDetailRows, DetailRow } from '@/lib/pure/getDetailRows';

interface StudentContextType {
  selectedStudentId: string | null;
  data: {
    students: Record<string, unknown>;
  } | null;
}

export interface SelectedDetailData {
  rows: DetailRow[];
  selectedStudentId: string;
  headers: string[];
}

// Static headers (order matters for table rendering)
const HEADERS = [
  'Student',
  'Course',
  'Teacher',
  'Assignment',
  'Status',
  'Points',
  'Grade',
  '%',
  'Due',
  'Turned in',
  'Graded on'
];

/**
 * Get detail rows for the selected student from StudentContext
 * 
 * @param studentContext - StudentContext (must have selectedStudentId and data)
 * @param nowISO - Optional reference date for display formatting
 * @returns Object with rows, selectedStudentId, and headers
 */
export function getSelectedDetail(
  studentContext: StudentContextType,
  nowISO?: string
): SelectedDetailData {
  const { selectedStudentId, data } = studentContext;
  
  // If no student selected or no data, return empty with headers
  if (!selectedStudentId || !data || !data.students) {
    return {
      rows: [],
      selectedStudentId: selectedStudentId || '',
      headers: HEADERS
    };
  }
  
  // Resolve the selected student node
  const selectedStudent = data.students[selectedStudentId];
  
  if (!selectedStudent) {
    return {
      rows: [],
      selectedStudentId,
      headers: HEADERS
    };
  }
  
  // Call processing.getDetailRows to flatten
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = getDetailRows(selectedStudent as any, nowISO);
  
  return {
    rows,
    selectedStudentId,
    headers: HEADERS
  };
}

export interface RawDetailSnapshot {
  student: {
    studentId: string;
    meta?: unknown;
  };
  course: {
    courseId: string;
    meta?: unknown;
    canvas?: unknown;
  };
  assignment: {
    assignmentId: string;
    courseId: string;
    canvas?: unknown;
    meta?: unknown;
    pointsPossible?: number;
    link?: string;
    submissions?: Record<string, unknown>;
  };
}

/**
 * Get raw data snapshot for a specific assignment (for JSON modal)
 * Called on-demand when user clicks "View JSON" on a row
 * 
 * @param studentData - Full StudentData from context
 * @param studentId - Student ID
 * @param courseId - Course ID  
 * @param assignmentId - Assignment ID
 * @returns Full raw data for this specific student/course/assignment combo
 */
export function getRawDetailSnapshot(
  studentData: { students: Record<string, unknown> },
  studentId: string,
  courseId: string,
  assignmentId: string
): RawDetailSnapshot | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const student = studentData.students[studentId] as any;
  if (!student) return null;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = student.courses?.[courseId] as any;
  if (!course) return null;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignment = course.assignments?.[assignmentId] as any;
  if (!assignment) return null;
  
  return {
    student: {
      studentId: student.studentId,
      meta: student.meta
    },
    course: {
      courseId: course.courseId,
      meta: course.meta,
      canvas: course.canvas
    },
    assignment: {
      assignmentId: assignment.assignmentId,
      courseId: assignment.courseId,
      canvas: assignment.canvas,
      meta: assignment.meta,  // ← Includes checkpointStatus!
      pointsPossible: assignment.pointsPossible,
      link: assignment.link,
      submissions: assignment.submissions  // ALL submissions for this assignment
    }
  };
}

