// Builder/transform layer - pure functions that join raw arrays into schema
// No I/O, deterministic, unit-testable

import { Course, Enrollment } from '../canvas/courses';
import { Assignment } from '../canvas/assignments';
import { Submission } from '../canvas/submissions';
import { User } from '../canvas/observees';

// Extended course interface with student data attached
export interface CourseWithStudent extends Course {
  studentId: string;
  studentName: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentData {
  students: Record<string, StudentNode>;
}

export interface StudentNode {
  studentId: string;
  meta: {
    legalName?: string;
    preferredName?: string;
  };
  courses: Record<string, CourseNode>;
}

export interface CourseNode {
  courseId: string;
  canvas: Record<string, any>;
  meta: {
    shortName?: string;
    teacher?: string;
    period?: number;
  };
  assignments: Record<string, AssignmentNode>;
  orphanSubmissions: Record<string, SubmissionNode>;
}

export interface AssignmentNode {
  assignmentId: string;
  courseId: string;
  canvas: Record<string, any>;
  pointsPossible?: number;
  link: string;
  submissions: Record<string, SubmissionNode>;
}

export interface SubmissionNode {
  submissionId: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  canvas: Record<string, any>;
  status: 'missing' | 'submittedLate' | 'submittedOnTime' | 'graded' | 'noDueDate';
  score?: number;
  gradedAt?: string;
  submittedAt?: string;
}

export interface BuilderInput {
  courses: CourseWithStudent[];
  assignmentsByCourse: Record<string, Assignment[]>;
  submissionsByCourseAndStudent: Record<string, Record<string, Submission[]>>;
  observees: User[];
}

export function buildStudentData(input: BuilderInput): StudentData {
  const { courses, assignmentsByCourse, submissionsByCourseAndStudent, observees } = input;
  
  const students: Record<string, StudentNode> = {};
  
  // Build student data from courses (now with studentId attached)
  for (const course of courses) {
    // Skip if no studentId attached (shouldn't happen with our new approach)
    if (!course.studentId) continue;
    
    const studentId = String(course.studentId);
    const studentName = course.studentName || `Student ${studentId}`;
    
    // Create student if not exists
    if (!students[studentId]) {
      students[studentId] = {
        studentId: studentId,
        meta: {
          legalName: studentName,
          preferredName: studentName
        },
        courses: {}
      };
    }
    
    // Create course node
    const courseId = String(course.id);
    const courseNode: CourseNode = {
      courseId: courseId,
      canvas: { ...course },
      meta: {
        shortName: course.course_code || course.name,
        teacher: 'Unknown', // TODO: Extract from course data if available
        period: extractPeriodFromCourseName(course.name, course.course_code)
      },
      assignments: {},
      orphanSubmissions: {}
    };
    
    // Add assignments for this course
    const courseAssignments = assignmentsByCourse[courseId] || [];
    for (const assignment of courseAssignments) {
      const assignmentId = String(assignment.id);
      const assignmentNode: AssignmentNode = {
        assignmentId: assignmentId,
        courseId: courseId,
        canvas: { ...assignment },
        pointsPossible: assignment.points_possible,
        link: '', // TODO: Get html_url from Canvas API if needed
        submissions: {}
      };
      
      // Add submissions for this assignment
      const courseSubmissions = submissionsByCourseAndStudent[courseId]?.[studentId] || [];
      const assignmentSubmissions = courseSubmissions.filter(s => s.assignment_id === assignment.id);
      
      for (const submission of assignmentSubmissions) {
        const submissionId = String(submission.id);
        const submissionNode: SubmissionNode = {
          submissionId: submissionId,
          assignmentId: assignmentId,
          courseId: courseId,
          studentId: studentId,
          canvas: { ...submission },
          status: mapSubmissionStatus(submission),
          score: submission.score,
          gradedAt: submission.graded_at,
          submittedAt: submission.submitted_at
        };
        
        assignmentNode.submissions[submissionId] = submissionNode;
      }
      
      courseNode.assignments[assignmentId] = assignmentNode;
    }
    
    students[studentId].courses[courseId] = courseNode;
  }
  
  return {
    students
  };
}

function mapSubmissionStatus(submission: any): 'missing' | 'submittedLate' | 'submittedOnTime' | 'graded' | 'noDueDate' {
  if (submission.workflow_state === 'graded') {
    return 'graded';
  }
  if (submission.workflow_state === 'submitted') {
    // TODO: Check if submitted late based on due date
    return 'submittedOnTime';
  }
  if (submission.workflow_state === 'unsubmitted') {
    return 'missing';
  }
  return 'noDueDate';
}

function extractPeriodFromCourseName(courseName: string, courseCode?: string): number | undefined {
  // Try to extract period from course name patterns like:
  // "P1-Math", "Period 2 Science", "P3-Physics", "1st Period English", etc.
  const text = `${courseName} ${courseCode || ''}`.toLowerCase();
  
  // Pattern 1: P1, P2, P3, etc.
  const pMatch = text.match(/p(\d+)/);
  if (pMatch) {
    return parseInt(pMatch[1], 10);
  }
  
  // Pattern 2: Period 1, Period 2, etc.
  const periodMatch = text.match(/period\s+(\d+)/);
  if (periodMatch) {
    return parseInt(periodMatch[1], 10);
  }
  
  // Pattern 3: 1st Period, 2nd Period, etc.
  const ordinalMatch = text.match(/(\d+)(?:st|nd|rd|th)\s+period/);
  if (ordinalMatch) {
    return parseInt(ordinalMatch[1], 10);
  }
  
  // Pattern 4: Just a number at the start (e.g., "1 Math", "2 Science")
  const numberMatch = text.match(/^(\d+)\s+/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    if (num >= 1 && num <= 8) { // Reasonable period range
      return num;
    }
  }
  
  return undefined;
}

export function deriveCourseAggregates(course: Course, submissions: Submission[]): {
  earned: number;
  submitted: number;
  missing: number;
  lost: number;
  turnedInPct: number;
} {
  const graded = submissions.filter(s => s.workflow_state === 'graded');
  const submitted = submissions.filter(s => s.workflow_state === 'submitted' || s.workflow_state === 'graded');
  const missing = submissions.filter(s => s.workflow_state === 'unsubmitted');
  const lost = submissions.filter(s => s.workflow_state === 'deleted');
  
  const total = submissions.length;
  const turnedInPct = total > 0 ? Math.round((submitted.length / total) * 100) : 0;
  
  return {
    earned: graded.length,
    submitted: submitted.length,
    missing: missing.length,
    lost: lost.length,
    turnedInPct
  };
}
