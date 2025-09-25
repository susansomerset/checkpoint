export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { getCoursesForStudent } from '@/lib/canvas/courses';
import { getAssignments, Assignment } from '@/lib/canvas/assignments';
import { getSubmissionsForStudent } from '@/lib/canvas/submissions';
import { getObservees } from '@/lib/canvas/observees';
import { Submission } from '@/lib/canvas/submissions';
import { buildStudentData, CourseWithStudent } from '@/lib/student/builder';
import { getMetadata } from '@/lib/storage/kv';
import { saveStudentData } from '@/lib/storage';
import * as kv from '@/lib/storage/kv';

export async function POST(req: NextRequest) {
  try {
    
    // Session check using Vern's fix
    const res = new NextResponse();
    const session = await getSession(req, res);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // const startTime = Date.now(); // Not used in current implementation
    
    // Phase M - Meta overlays
    const metaStartTime = Date.now();
    // TODO: Add meta data reading when available
    const metaEndTime = Date.now();
    console.info(`ZXQ reset.meta: ${metaEndTime - metaStartTime}ms`);
    
    const fetchStartTime = Date.now();
    // Phase F1 - Observees (kids)
    const observees = await getObservees();
    const f1EndTime = Date.now();
    console.info(`ZXQ reset.fetch.observees: ${f1EndTime - fetchStartTime}ms (count=${observees.length})`);
    
    // STOP if no observees
    if (observees.length === 0) {
      return NextResponse.json({ ok: false, step: 'observees' }, { status: 400 });
    }
    
    // Phase F2 - Courses per student (paginated)
    const allCourses: CourseWithStudent[] = [];
    for (const observee of observees) {
      const courses = await getCoursesForStudent(String(observee.id));
      // Add student ID to each course to make builder's job easier
      const coursesWithStudentId = courses.map(course => ({
        ...course,
        studentId: String(observee.id),
        studentName: observee.name
      }));
      allCourses.push(...coursesWithStudentId);
    }
    
    const f2EndTime = Date.now();
    console.info(`ZXQ reset.fetch.courses: ${f2EndTime - fetchStartTime}ms (students=${observees.length}, totalCourses=${allCourses.length}, paginatedCalls≈${observees.length})`);
    
    // STOP if no courses
    if (allCourses.length === 0) {
      return NextResponse.json({ ok: false, step: 'courses' }, { status: 400 });
    }
    
    // Phase F3 - Assignments per unique course (paginated)
    const uniqueCourses = Array.from(new Set(allCourses.map(c => c.id)));
    let deniedAssignments = 0;
    const assignmentPromises = uniqueCourses.map(courseId => {
      return getAssignments(String(courseId)).then(assignments => ({
        courseId: String(courseId),
        assignments
      })).catch((error: unknown) => {
        if ((error as Error).message.includes('403')) {
          console.warn(`ZXQ WARN: 403 for assignments in course ${courseId} - continuing`);
          deniedAssignments++;
          return {
            courseId: String(courseId),
            assignments: [],
            denied: true
          };
        } else {
          console.error(`ZXQ Error fetching assignments for course ${courseId}:`, (error as Error).message);
          throw error; // Re-throw non-403 errors to trigger stop rule
        }
      });
    });
    
    const assignmentResults = await Promise.all(assignmentPromises);
    const assignmentsByCourse = assignmentResults.reduce((acc, { courseId, assignments }) => {
      acc[courseId] = assignments;
      return acc;
    }, {} as Record<string, Assignment[]>);
    
    const f3EndTime = Date.now();
    const fetchedAssignments = Object.values(assignmentsByCourse).flat().length;
    console.info(`ZXQ reset.fetch.assignments: ${f3EndTime - fetchStartTime}ms (uniqueCourses=${uniqueCourses.length}, paginatedCalls≈${uniqueCourses.length}, totalAssignments=${fetchedAssignments}, deniedCourses=${deniedAssignments})`);
    
    // STOP if all courses denied assignments
    if (deniedAssignments === uniqueCourses.length && uniqueCourses.length > 0) {
      return NextResponse.json({ ok: false, step: 'assignments' }, { status: 403 });
    }
    
    // Phase F4 - Submissions per (kid, course) bulk + paginated
    const submissionPromises: Promise<{ courseId: string; studentId: string; submissions: Submission[]; denied?: boolean }>[] = [];
    let deniedPairs = 0;
    
    for (const course of allCourses) {
      // Find which observee this course belongs to
      const courseObservee = observees.find(obs => 
        course.enrollments?.some((e: unknown) => (e as { type: string; user_id: number }).type === 'student' && (e as { type: string; user_id: number }).user_id === obs.id)
      );
      
      if (courseObservee) {
        submissionPromises.push(
          getSubmissionsForStudent(String(course.id), String(courseObservee.id))
            .then(submissions => ({
              courseId: String(course.id),
              studentId: String(courseObservee.id),
              submissions
            }))
            .catch((error: unknown) => {
              if ((error as Error).message.includes('403')) {
                console.warn(`ZXQ WARN: 403 for course ${course.id}, student ${courseObservee.id} - continuing`);
                deniedPairs++;
                return {
                  courseId: String(course.id),
                  studentId: String(courseObservee.id),
                  submissions: [],
                  denied: true
                };
              } else {
                console.error(`ZXQ Error fetching submissions for course ${course.id}, student ${courseObservee.id}:`, (error as Error).message);
                throw error; // Re-throw non-403 errors to trigger stop rule
              }
            })
        );
      }
    }
    
    const submissionResults = await Promise.all(submissionPromises);
    const submissionsByCourseAndStudent = submissionResults.reduce((acc, { courseId, studentId, submissions }) => {
      if (!acc[courseId]) acc[courseId] = {};
      acc[courseId][studentId] = submissions;
      return acc;
    }, {} as Record<string, Record<string, Submission[]>>);
    
    const f4EndTime = Date.now();
    const totalSubmissions = Object.values(submissionsByCourseAndStudent).flatMap(courseSubs => Object.values(courseSubs)).flat().length;
    const totalPairs = submissionPromises.length;
    console.info(`ZXQ reset.fetch.submissions: ${f4EndTime - fetchStartTime}ms (pairs=${totalPairs}, paginatedCalls≈${totalPairs}, totalSubmissions=${totalSubmissions}, deniedPairs=${deniedPairs})`);
    
    // STOP if all pairs denied
    if (deniedPairs === totalPairs && totalPairs > 0) {
      return NextResponse.json({ ok: false, step: 'submissions' }, { status: 403 });
    }
    
    const fetchEndTime = Date.now();
    console.info(`ZXQ reset.fetch: ${fetchEndTime - fetchStartTime}ms`);
    
    // Phase B1 - Build L1: Students baseline
    const buildStartTime = Date.now();
    
    // Load metadata for merging
    const metadata = await getMetadata();
    console.info(`ZXQ reset.metadata: ${metadata ? 'LOADED' : 'NOT_FOUND'} - ${metadata ? Object.keys(metadata).length : 0} top-level keys`);
    
    const studentData = buildStudentData({
      courses: allCourses,
      assignmentsByCourse,
      submissionsByCourseAndStudent,
      observees,
      metadata: metadata as { students: Record<string, unknown>; courses: Record<string, unknown> } | undefined
    });
    
    const b1EndTime = Date.now();
    console.info(`ZXQ reset.build.L1.students: ${b1EndTime - buildStartTime}ms (students=${Object.keys(studentData.students).length})`);
    
    // Phase B2 - Build L2: Courses attached + filtered (handled in builder)
    const b2EndTime = Date.now();
    const keptCourses = allCourses.length; // Builder handles filtering
    const droppedCourses = 0; // TODO: Track dropped courses in builder
    console.info(`ZXQ reset.build.L2.courses: ${b2EndTime - buildStartTime}ms (students=${Object.keys(studentData.students).length}, keptCourses=${keptCourses}, droppedCourses=${droppedCourses})`);
    
    // Phase B3 - Build L3: Assignments attached
    const b3EndTime = Date.now();
    const coursesWithAssignments = Object.keys(assignmentsByCourse).length;
    const totalAssignments = Object.values(assignmentsByCourse).flat().length;
    console.info(`ZXQ reset.build.L3.assignments: ${b3EndTime - buildStartTime}ms (coursesWithAssignments=${coursesWithAssignments}/${keptCourses}, totalAssignments=${totalAssignments})`);
    
    // Phase B4 - Build L4: Submissions attached
    const b4EndTime = Date.now();
    const attachedSubmissions = totalSubmissions;
    const orphanSubmissions = 0; // TODO: Track orphan submissions
    console.info(`ZXQ reset.build.L4.submissions: ${b4EndTime - buildStartTime}ms (attached=${attachedSubmissions}, orphans=${orphanSubmissions})`);
    
    // Phase S - Atomic save (only on success)
    const saveStartTime = Date.now();
    console.info(`ZXQ reset.save.start: ${Object.keys(studentData.students).length} students, ${Object.keys(studentData).length} top-level keys`);
    
    await saveStudentData(studentData);
    
    // Verify save
    const verifyData = await kv.get('studentData:v1');
    console.info(`ZXQ reset.save.verify: ${verifyData ? 'SUCCESS' : 'FAILED'} - ${verifyData ? verifyData.length : 0} bytes saved`);
    
    const saveEndTime = Date.now();
    console.info(`ZXQ reset.save: ${saveEndTime - saveStartTime}ms (students=${Object.keys(studentData.students).length}, courses=${keptCourses}, assignments=${totalAssignments}, submissions=${attachedSubmissions})`);

    return Response.json({ 
      ok: true, 
      counts: {
        students: Object.keys(studentData.students).length,
        courses: keptCourses,
        assignments: totalAssignments,
        submissions: attachedSubmissions
      }
    });
    
  } catch (error) {
    console.error('Student data reset failed:', error);
    return Response.json({ 
      ok: false, 
      step: 'fetch'
    }, { status: 500 });
  }
}