/**
 * processing.getDetailRows v1.0.0
 * Spec: spec/current.json
 * 
 * Pure function: Flattens selected student's courses/assignments into DetailRow[]
 * No filtering, no sorting - just flattening with computed display fields
 */

import { parseISO, getYear } from 'date-fns';

export interface DetailRow {
  studentId: string;
  studentPreferredName: string;
  courseId: string;
  courseShortName: string;
  teacherName: string;
  assignmentId: string;
  assignmentName: string;
  assignmentUrl: string;
  checkpointStatus: string;
  pointsPossible?: number;
  pointsGraded: number;
  gradePct?: number;
  dueAtISO?: string;
  submittedAtISO?: string;
  gradedAtISO?: string;
  dueAtDisplay?: string;
  submittedAtDisplay?: string;
  gradedAtDisplay?: string;
}

interface Student {
  studentId: string;
  meta?: {
    preferredName?: string;
    legalName?: string;
  };
  courses: Record<string, Course>;
}

interface Course {
  courseId: string;
  canvas?: {
    name?: string;
  };
  meta?: {
    shortName?: string;
    teacher?: string;
    instructor?: string;
  };
  assignments: Record<string, Assignment>;
}

interface Assignment {
  assignmentId: string;
  courseId: string;
  canvas?: {
    name?: string;
    html_url?: string;
    due_at?: string | null;
  };
  link?: string;
  meta?: {
    checkpointStatus?: string;
  };
  pointsPossible?: number;
  submissions?: Record<string, Submission>;
}

interface Submission {
  graded_points?: number;
  score?: number;
  submitted_at?: string | null;
  graded_at?: string | null;
}

/**
 * Format ISO date for display based on year comparison
 * Same year as now: "M/D"
 * Different year: "M/D/YY"
 */
function formatDateDisplay(isoDate: string | undefined | null, nowISO: string): string | undefined {
  if (!isoDate) return undefined;
  
  try {
    const date = parseISO(isoDate);
    const nowDate = parseISO(nowISO);
    const dateYear = getYear(date);
    const nowYear = getYear(nowDate);
    
    const month = date.getMonth() + 1; // 0-indexed
    const day = date.getDate();
    
    if (dateYear === nowYear) {
      return `${month}/${day}`;
    } else {
      const yearShort = String(dateYear).slice(-2);
      return `${month}/${day}/${yearShort}`;
    }
  } catch {
    return undefined;
  }
}

/**
 * Pure function: Flattens a single student's data into DetailRow[] format
 * 
 * @param student - Single student node from StudentData
 * @param nowISO - Reference date for display formatting (defaults to current time)
 * @returns Array of flattened rows (one per assignment across all courses)
 */
export function getDetailRows(
  student: Student,
  nowISO?: string
): DetailRow[] {
  const now = nowISO || new Date().toISOString();
  const rows: DetailRow[] = [];
  
  // Student display name (resolve once)
  const studentPreferredName = 
    student.meta?.preferredName || 
    student.meta?.legalName || 
    student.studentId;
  
  // Iterate through all courses
  for (const course of Object.values(student.courses)) {
    // Course display name
    const courseShortName = 
      course.meta?.shortName || 
      course.canvas?.name || 
      course.courseId;
    
    // Teacher name
    const teacherName = 
      course.meta?.teacher || 
      course.meta?.instructor || 
      '';
    
    // Iterate through all assignments in this course
    for (const assignment of Object.values(course.assignments)) {
      // Assignment URL (prefer canvas.html_url, fallback to link if http(s))
      let assignmentUrl = assignment.canvas?.html_url || '';
      if (!assignmentUrl && assignment.link) {
        if (assignment.link.startsWith('http://') || assignment.link.startsWith('https://')) {
          assignmentUrl = assignment.link;
        }
      }
      
      // Skip if no valid URL
      if (!assignmentUrl) {
        continue;
      }
      
      // Checkpoint status (open set)
      const checkpointStatus = assignment.meta?.checkpointStatus || '';
      
      // Points possible (numeric ≥0 or undefined)
      const pointsPossible = (assignment.pointsPossible !== undefined && assignment.pointsPossible >= 0)
        ? assignment.pointsPossible
        : undefined;
      
      // Points graded (default to 0 if missing)
      const submissions = Object.values(assignment.submissions || {});
      const firstSubmission = submissions[0];
      const pointsGraded = firstSubmission?.graded_points ?? firstSubmission?.score ?? 0;
      
      // Grade percentage (only if pointsPossible > 0)
      const gradePct = (pointsPossible !== undefined && pointsPossible > 0)
        ? Math.round((pointsGraded / pointsPossible) * 100)
        : undefined;
      
      // ISO dates
      const dueAtISO = assignment.canvas?.due_at || undefined;
      const submittedAtISO = firstSubmission?.submitted_at || undefined;
      const gradedAtISO = firstSubmission?.graded_at || undefined;
      
      // Display dates
      const dueAtDisplay = formatDateDisplay(dueAtISO, now);
      const submittedAtDisplay = formatDateDisplay(submittedAtISO, now);
      const gradedAtDisplay = formatDateDisplay(gradedAtISO, now);
      
      // Build row (IDs at top level, no raw field duplication)
      rows.push({
        studentId: student.studentId,
        studentPreferredName,
        courseId: course.courseId,
        courseShortName,
        teacherName,
        assignmentId: assignment.assignmentId,
        assignmentName: assignment.canvas?.name || 'Untitled',
        assignmentUrl,
        checkpointStatus,
        pointsPossible,
        pointsGraded,
        gradePct,
        dueAtISO,
        submittedAtISO,
        gradedAtISO,
        dueAtDisplay,
        submittedAtDisplay,
        gradedAtDisplay
      });
    }
  }
  
  return rows;
}

