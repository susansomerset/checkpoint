import { StudentData, Student, Assignment } from '@/lib/contracts/types';
import { isProgressAssignment } from '@/lib/filters/isProgressAssignment';
import { compareStatus } from '@/lib/comparators/status';
import { compareAssignment } from '@/lib/comparators/assignment';
import { formatPercentage } from '@/lib/formatters';

/**
 * Get all progress assignments for a student, filtered and ready for processing.
 * This is more efficient than filtering on every render.
 */
export function getProgressAssignments(student: Student): Assignment[] {
  return Object.values(student.courses || {})
    .flatMap(course => Object.values(course.assignments || {}))
    .filter(isProgressAssignment);
}

export interface ProgressTableRow {
  type: 'course' | 'status-group' | 'assignment';
  courseId: string;
  courseName: string;
  courseShortName: string;
  teacherName: string;
  period: number;
  status?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  dueDate?: string;
  pointsEarned: number;
  pointsPossible: number;
  percentage: string;
  assignmentCount: number;
  isExpanded?: boolean;
  isStatusGroupExpanded?: boolean;
}

export interface ProgressTableData {
  studentId: string;
  studentName: string;
  totalEarned: number;
  totalPossible: number;
  totalPercentage: string;
  totalAssignments: number;
  courses: CourseProgress[];
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  courseShortName: string;
  teacherName: string;
  period: number;
  totalEarned: number;
  totalPossible: number;
  percentage: string;
  assignmentCount: number;
  statusGroups: StatusGroupProgress[];
}

export interface StatusGroupProgress {
  status: string;
  assignments: Assignment[];
  totalEarned: number;
  totalPossible: number;
  percentage: string;
  assignmentCount: number;
}

/**
 * Pure function version for performance testing.
 * Processes student data into progress table format.
 */
export function selectProgressTableRows(data: StudentData, studentId: string): ProgressTableData | null {
  const student = data.students[studentId];
  if (!student) return null;

  const studentName = student.meta?.preferredName ?? student.meta?.legalName ?? 'Unknown';
  
  // Get filtered assignments once
  const allAssignments = getProgressAssignments(student);

  // Group by course
  const courseMap = new Map<string, CourseProgress>();
  
  allAssignments.forEach(assignment => {
    const courseId = assignment.courseId;
    const course = student.courses?.[courseId];
    if (!course) return;

    if (!courseMap.has(courseId)) {
      const courseProgress: CourseProgress = {
        courseId,
        courseName: course.meta?.shortName ?? course.canvas?.name ?? 'Unknown Course',
        courseShortName: course.meta?.shortName ?? course.canvas?.name ?? 'Unknown',
        teacherName: course.meta?.teacher ?? 'Unknown Teacher',
        period: course.meta?.period ?? 999,
        totalEarned: 0,
        totalPossible: 0,
        percentage: '0%',
        assignmentCount: 0,
        statusGroups: []
      };
      courseMap.set(courseId, courseProgress);
    }

    const courseProgress = courseMap.get(courseId)!;
    courseProgress.assignmentCount++;
    courseProgress.totalPossible += assignment.pointsPossible ?? assignment.canvas?.points_possible ?? 0;
    
    if (assignment.meta?.checkpointStatus === 'Graded' || assignment.meta?.checkpointStatus === 'Submitted') {
      courseProgress.totalEarned += assignment.meta?.checkpointEarnedPoints ?? 0;
    }

    // Add to status group
    const status = assignment.meta?.checkpointStatus ?? 'Unknown';
    let statusGroup = courseProgress.statusGroups.find(sg => sg.status === status);
    
    if (!statusGroup) {
      statusGroup = {
        status,
        assignments: [],
        totalEarned: 0,
        totalPossible: 0,
        percentage: '0%',
        assignmentCount: 0
      };
      courseProgress.statusGroups.push(statusGroup);
    }

    statusGroup.assignments.push(assignment);
    statusGroup.assignmentCount++;
    statusGroup.totalPossible += assignment.pointsPossible ?? assignment.canvas?.points_possible ?? 0;
    
    if (assignment.meta?.checkpointStatus === 'Graded' || assignment.meta?.checkpointStatus === 'Submitted') {
      statusGroup.totalEarned += assignment.meta?.checkpointEarnedPoints ?? 0;
    }
  });

  // Calculate percentages and sort
  const courses = Array.from(courseMap.values());
  courses.forEach(course => {
    course.percentage = formatPercentage(course.totalEarned, course.totalPossible);
    course.statusGroups.sort((a, b) => compareStatus(a.status, b.status));
    course.statusGroups.forEach(statusGroup => {
      statusGroup.percentage = formatPercentage(statusGroup.totalEarned, statusGroup.totalPossible);
      statusGroup.assignments.sort(compareAssignment);
    });
  });

  courses.sort((a, b) => {
    const pa = a.period;
    const pb = b.period;
    
    if (pa !== pb) {
      return pa - pb;
    }
    
    const nameA = a.courseShortName;
    const nameB = b.courseShortName;
    
    return nameA.localeCompare(nameB, 'en');
  });

  const totalEarned = courses.reduce((sum, course) => sum + course.totalEarned, 0);
  const totalPossible = courses.reduce((sum, course) => sum + course.totalPossible, 0);
  const totalAssignments = courses.reduce((sum, course) => sum + course.assignmentCount, 0);

  return {
    studentId,
    studentName,
    totalEarned,
    totalPossible,
    totalPercentage: formatPercentage(totalEarned, totalPossible),
    totalAssignments,
    courses
  };
}

/**
 * Hook version for React components.
 * Memoizes the result based on studentId and data version.
 */
export function useProgressTableRows(data: StudentData | null, studentId: string | null) {
  // This would be implemented with useMemo in a real component
  if (!data || !studentId) return null;
  return selectProgressTableRows(data, studentId);
}
