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

export interface AssignmentMetadata {
  checkpointStatus: 'Locked' | 'Closed' | 'Due' | 'Missing' | 'Vector' | 'Submitted' | 'Graded' | 'Cancelled';
  checkpointEarnedPoints: number;
  checkpointLostPoints: number;
  checkpointSubmittedPoints: number;
  checkpointMissingPoints: number;
  assignmentType: 'Pointed' | 'Vector';
}

export interface AssignmentNode {
  assignmentId: string;
  courseId: string;
  canvas: Record<string, any>;
  pointsPossible?: number;
  link: string;
  submissions: Record<string, SubmissionNode>;
  meta: AssignmentMetadata;
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
  metadata?: {
    students: Record<string, any>;
    courses: Record<string, any>;
  };
}

function getAssignmentStatus(assignmentNode: AssignmentNode): 'Locked' | 'Closed' | 'Due' | 'Missing' | 'Vector' | 'Submitted' | 'Graded' | 'Cancelled' {
  const now = new Date();
  const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, now.getDate());
  const academicYear = sevenMonthsAgo.getFullYear();
  const academicYearStart = new Date(academicYear, 6, 1); // July 1st of academic year
  
  // Get assignment data
  const assignment = assignmentNode.canvas;
  const submissions = Object.values(assignmentNode.submissions);
  const hasSubmission = submissions.length > 0;
  const submission = hasSubmission ? submissions[0] : null;
  
  // Check if submission has been graded AND score is exactly 40% of possible points
  if (submission && submission.canvas?.workflow_state === 'graded' && submission.canvas?.score !== null) {
    const score = submission.canvas.score;
    const possiblePoints = assignmentNode.pointsPossible || 0;
    const expectedMissingScore = possiblePoints * 0.4;
    
    if (score === expectedMissingScore) {
      return 'Missing';
    } else if (score > 0 && score !== expectedMissingScore) {
      return 'Graded';
    }
  }
  
  // If submission has been turned in, status is "Submitted" (pattern match for "submitted")
   if (hasSubmission && submission?.canvas?.workflow_state && 
    submission.canvas?.workflow_state === 'submitted') {
     return 'Submitted';
   }
  
  // Check if assignment is locked (unlock_date in future)
  if (assignment.unlock_at) {
    const unlockDate = new Date(assignment.unlock_at);
    if (unlockDate > now) {
      return 'Locked';
    }
  }
  
  // Check if assignment is closed (lock_date or due_date before July 1 of academic year)
  if (assignment.lock_at) {
    const lockDate = new Date(assignment.lock_at);
    if (lockDate < academicYearStart) {
      return 'Closed';
    }
  }
  
  if (assignment.due_at) {
    const dueDate = new Date(assignment.due_at);
    if (dueDate < academicYearStart) {
      return 'Closed';
    }
  }
  
  // If no due date, status is "Due"
  if (!assignment.due_at) {
    return 'Due';
  }
  
  // If due date is in the past, status is "Missing"
  const dueDate = new Date(assignment.due_at);
  if (dueDate < now) {
    return 'Missing';
  }
  
  // If no submission and due date is today or future, status is "Due"
  return 'Due';
}

function calculateAssignmentPoints(assignmentNode: AssignmentNode): void {
  const status = assignmentNode.meta.checkpointStatus;
  const pointsPossible = assignmentNode.pointsPossible || 0;
  
  // Reset all point values to zero first
  assignmentNode.meta.checkpointEarnedPoints = 0;
  assignmentNode.meta.checkpointLostPoints = 0;
  assignmentNode.meta.checkpointSubmittedPoints = 0;
  assignmentNode.meta.checkpointMissingPoints = 0;
  
  if (status === 'Graded') {
    // Get the submission score (may have up to 2 decimals)
    const submissions = Object.values(assignmentNode.submissions);
    const submission = submissions.length > 0 ? submissions[0] : null;
    
    if (submission && submission.canvas?.score !== null) {
      assignmentNode.meta.checkpointEarnedPoints = submission.canvas.score;
      assignmentNode.meta.checkpointLostPoints = Math.round((pointsPossible - submission.canvas.score) * 100) / 100;
    }
    // Stop processing - remaining values stay zero
  } else if (status === 'Missing') {
    assignmentNode.meta.checkpointMissingPoints = pointsPossible;
  } else if (status === 'Submitted') {
    assignmentNode.meta.checkpointSubmittedPoints = pointsPossible;
  }
  // For all other statuses (Locked, Closed, Due, Vector, Cancelled), all values remain zero
}

export function buildStudentData(input: BuilderInput): StudentData {
  const { courses, assignmentsByCourse, submissionsByCourseAndStudent, observees, metadata } = input;
  
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
          preferredName: metadata?.students?.[studentId]?.preferredName || studentName
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
        shortName: metadata?.courses?.[courseId]?.shortName || course.course_code || course.name,
        teacher: metadata?.courses?.[courseId]?.teacher || 'Unknown',
        period: metadata?.courses?.[courseId]?.period || 'tbd'
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
        submissions: {},
        meta: {
          checkpointStatus: 'Due',
          checkpointEarnedPoints: 0,
          checkpointLostPoints: 0,
          checkpointSubmittedPoints: 0,
          checkpointMissingPoints: 0,
          assignmentType: assignment.grading_type === 'points' ? 'Pointed' : 'Vector'
        }
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
      
      // Set the checkpoint status based on the fully assembled assignment node
      assignmentNode.meta.checkpointStatus = getAssignmentStatus(assignmentNode);
      
      // Calculate the points classifications based on the status
      calculateAssignmentPoints(assignmentNode);
      
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
