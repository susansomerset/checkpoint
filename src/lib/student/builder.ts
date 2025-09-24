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
  students: Record<string, Student>;
  assignments: Record<string, Assignment[]>;
  lastUpdated: string;
}

export interface Student {
  id: string;
  name: string;
  courses: StudentCourse[];
}

export interface StudentCourse {
  courseId: number;
  courseName: string;
  courseCode?: string;
  startAt?: string;
  endAt?: string;
  workflowState: string;
  enrollmentType: string;
  enrollmentState: string;
  enrollmentRole: string;
  enrollmentCreatedAt: string;
  enrollmentUpdatedAt: string;
  courseMetadata: Course;
}

export interface BuilderInput {
  courses: CourseWithStudent[];
  assignmentsByCourse: Record<string, Assignment[]>;
  submissionsByCourseAndStudent: Record<string, Record<string, Submission[]>>;
  observees: User[];
}

export function buildStudentData(input: BuilderInput): StudentData {
  const { courses, assignmentsByCourse, submissionsByCourseAndStudent, observees } = input;
  
  const students: Record<string, Student> = {};
  const assignments: Record<string, Assignment[]> = { ...assignmentsByCourse };
  
  // Build student data from courses (now with studentId attached)
  for (const course of courses) {
    // Skip if no studentId attached (shouldn't happen with our new approach)
    if (!course.studentId) continue;
    
    const studentId = String(course.studentId);
    const studentName = course.studentName || `Student ${studentId}`;
    
    // Create student if not exists
    if (!students[studentId]) {
      students[studentId] = {
        id: studentId,
        name: studentName,
        courses: []
      };
    }
    
    // Add course to student
    const studentCourse: StudentCourse = {
      courseId: course.id,
      courseName: course.name,
      courseCode: course.course_code,
      startAt: course.start_at,
      endAt: course.end_at,
      workflowState: course.workflow_state,
      enrollmentType: 'StudentEnrollment', // We know this is a student course
      enrollmentState: 'active', // Assume active since we got the course
      enrollmentRole: 'student',
      enrollmentCreatedAt: course.created_at || new Date().toISOString(),
      enrollmentUpdatedAt: course.updated_at || new Date().toISOString(),
      courseMetadata: course
    };
    
    students[studentId].courses.push(studentCourse);
  }
  
  return {
    students,
    assignments,
    lastUpdated: new Date().toISOString()
  };
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
