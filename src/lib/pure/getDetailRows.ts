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
  coursePeriod: string;
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
    period?: string | number;
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
  score?: number;
  submittedAt?: string | null;
  gradedAt?: string | null;
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
    
    // Course period (convert to string if numeric)
    const coursePeriod = course.meta?.period?.toString() || 'zzz'; // sort unknown periods last
    
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
      
      // Get most recent submission (prefer graded, then most recent submitted)
      const submissions = Object.values(assignment.submissions || {});
      
      // Find the most relevant submission:
      // 1. Most recently graded submission (if any)
      // 2. Otherwise, most recently submitted submission
      let relevantSubmission: Submission | undefined;
      
      if (submissions.length > 0) {
        const gradedSubmissions = submissions.filter(s => s.gradedAt);
        if (gradedSubmissions.length > 0) {
          // Use most recently graded
          relevantSubmission = gradedSubmissions.sort((a, b) => 
            (b.gradedAt || '').localeCompare(a.gradedAt || '')
          )[0];
        } else {
          // Use most recently submitted
          const submittedSubmissions = submissions.filter(s => s.submittedAt);
          if (submittedSubmissions.length > 0) {
            relevantSubmission = submittedSubmissions.sort((a, b) => 
              (b.submittedAt || '').localeCompare(a.submittedAt || '')
            )[0];
          } else {
            // Fallback to first submission
            relevantSubmission = submissions[0];
          }
        }
      }
      
      // Points graded (default to 0 if missing)
      const pointsGraded = relevantSubmission?.score ?? 0;
      
      // Grade percentage (only if pointsPossible > 0)
      const gradePct = (pointsPossible !== undefined && pointsPossible > 0)
        ? Math.round((pointsGraded / pointsPossible) * 100)
        : undefined;
      
      // ISO dates
      const dueAtISO = assignment.canvas?.due_at || undefined;
      const submittedAtISO = relevantSubmission?.submittedAt || undefined;
      const gradedAtISO = relevantSubmission?.gradedAt || undefined;
      
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
        coursePeriod,
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

