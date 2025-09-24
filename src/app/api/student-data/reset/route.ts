export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { getCoursesForSelf, getCoursesForStudent } from '@/lib/canvas/courses';
import { getAssignments } from '@/lib/canvas/assignments';
import { getSubmissionsForStudent } from '@/lib/canvas/submissions';
import { getObservees } from '@/lib/canvas/observees';
import { buildStudentData } from '@/lib/student/builder';
import * as kv from '@/lib/storage/kv';

// Simple storage function for test data
async function saveTestData(data: any): Promise<void> {
  await kv.set('test-student-data', JSON.stringify(data));
}

export async function POST(req: NextRequest) {
  try {
    
    // Session check using Vern's fix
    const res = new NextResponse();
    const session = await getSession(req, res);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const startTime = Date.now();
    console.log(`ZXQ Reset Start: ${new Date().toISOString()} - 0ms`);
    
    const fetchStartTime = Date.now();
    // Get observees from the correct endpoint
    const observees = await getObservees();
    
    // Get courses for each observee and add student ID to each course
    const allCourses: any[] = [];
    for (const observee of observees) {
      const courses = await getCoursesForStudent(String(observee.id));
      // Add student ID to each course to make builder's job easier
      const coursesWithStudentId = courses.map(course => ({
        ...course,
        studentId: observee.id,
        studentName: observee.name
      }));
      allCourses.push(...coursesWithStudentId);
    }
    
    // Get assignments for all courses (parallel, no cap for testing)
    // Only fetch assignments for courses where we have observees enrolled
    // All courses are already associated with observees
    
    const assignmentPromises = allCourses.map(course => {
      
      return getAssignments(String(course.id)).then(assignments => ({
        courseId: String(course.id),
        assignments
      })).catch((error: any) => {
        return {
          courseId: String(course.id),
          courseName: course.name,
          assignments: [],
          error: error.message
        };
      });
    });
    const assignmentResults = await Promise.all(assignmentPromises);
    const assignmentsByCourse = assignmentResults.reduce((acc, { courseId, assignments }) => {
      acc[courseId] = assignments;
      return acc;
    }, {} as Record<string, any[]>);
    
    // Get submissions for each (course, observee) combination (no cap for testing)
    // Only fetch submissions for students who actually have observer enrollments in that specific course
    const submissionPromises: Promise<{ courseId: string; studentId: string; submissions: any[] }>[] = [];
    
    for (const course of allCourses) {
      
      // Find which observee this course belongs to
      const courseObservee = observees.find(obs => 
        course.enrollments?.some((e: any) => e.type === 'student' && e.user_id === obs.id)
      );
      
      
      if (courseObservee) {
        submissionPromises.push(
          getSubmissionsForStudent(String(course.id), String(courseObservee.id))
            .then(submissions => ({
              courseId: String(course.id),
              studentId: String(courseObservee.id),
              submissions
            }))
            .catch((error: any) => {
              console.error(`ZXQ Error fetching submissions for course ${course.id} (${course.name}), student ${courseObservee.id}:`, error.message);
              return {
                courseId: String(course.id),
                courseName: course.name,
                studentId: String(courseObservee.id),
                submissions: [],
                error: error.message
              };
            })
        );
      }
    }
    
    const submissionResults = await Promise.all(submissionPromises);
    const submissionsByCourseAndStudent = submissionResults.reduce((acc, { courseId, studentId, submissions }) => {
      if (!acc[courseId]) acc[courseId] = {};
      acc[courseId][studentId] = submissions;
      return acc;
    }, {} as Record<string, Record<string, any[]>>);
    
    const fetchEndTime = Date.now();
    console.log(`ZXQ reset.fetch: ${fetchEndTime - fetchStartTime}ms`);
    
    // 3. Build simple data structure for testing
    const buildStartTime = Date.now();
    console.log(`ZXQ Progress 8. <about to call student data builder>: ${new Date().toISOString()} - ${Date.now() - fetchStartTime}ms`);
    
    // Call the proper student data builder with assembled arrays
    const studentData = buildStudentData({
      courses: allCourses,
      assignmentsByCourse,
      submissionsByCourseAndStudent,
      observees
    });
    
    const buildEndTime = Date.now();
    console.log(`ZXQ Progress 9. <built data structure, about to save>: ${new Date().toISOString()} - ${Date.now() - fetchStartTime}ms`);
    console.log(`ZXQ reset.build: ${buildEndTime - buildStartTime}ms`);
    
    // 4. Atomic save
    const saveStartTime = Date.now();
    console.log(`ZXQ Progress 10. <about to save to storage>: ${new Date().toISOString()} - ${Date.now() - fetchStartTime}ms`);
    await saveTestData(studentData);
    const saveEndTime = Date.now();
    console.log(`ZXQ reset.save: ${saveEndTime - saveStartTime}ms`);

    return Response.json({ 
      ok: true, 
      message: 'Student data reset successfully',
      counts: {
        students: Object.keys(studentData.students).length,
        courses: allCourses.length,
        assignments: Object.values(studentData.assignments).flat().length,
        submissions: Object.values(submissionsByCourseAndStudent).flatMap(courseSubs => Object.values(courseSubs)).flat().length
      }
    });
    
  } catch (error) {
    console.error('Student data reset failed:', error);
    return Response.json({ 
      ok: false, 
      error: 'Failed to reset student data', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    }, { status: 500 });
  }
}