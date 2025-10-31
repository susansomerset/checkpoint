// Shared reset logic - can be called from API routes or cron jobs

import { getCoursesForStudent } from '@/lib/canvas/courses';
import { getAssignments, Assignment } from '@/lib/canvas/assignments';
import { getSubmissionsForStudent } from '@/lib/canvas/submissions';
import { getObservees } from '@/lib/canvas/observees';
import { Submission } from '@/lib/canvas/submissions';
import { buildStudentData, CourseWithStudent } from './builder';
import { saveStudentData, kv } from '@/lib/storage';
import { k } from '@/lib/storage/prefix';
import { StudentData } from '@/lib/contracts/types';
import { augmentStudentDataOutcomes } from './augmentOutcomes';

export interface ResetResult {
  ok: boolean;
  step?: string;
  errors?: string[];
  counts?: {
    students: number;
    courses: number;
    assignments: number;
    submissions: number;
  };
  stats?: Record<string, unknown>;
}

export async function performStudentDataReset(): Promise<ResetResult> {
  try {
    // Phase M - Meta overlays
    const metaStartTime = Date.now();
    const metaEndTime = Date.now();
    console.info(`ZXQ reset.meta: ${metaEndTime - metaStartTime}ms`);
    
    const fetchStartTime = Date.now();
    // Phase F1 - Observees (kids)
    const observees = await getObservees();
    const f1EndTime = Date.now();
    console.info(`ZXQ reset.fetch.observees: ${f1EndTime - fetchStartTime}ms (count=${observees.length})`);
    
    // STOP if no observees
    if (observees.length === 0) {
      return { ok: false, step: 'observees' };
    }
    
    // Phase F2 - Courses per student (paginated)
    const allCourses: CourseWithStudent[] = [];
    for (const observee of observees) {
      const courses = await getCoursesForStudent(String(observee.id));
      const coursesWithStudentId = courses.map(course => ({
        ...course,
        studentId: String(observee.id),
        studentName: observee.name
      }));
      allCourses.push(...coursesWithStudentId);
    }
    
    const f2EndTime = Date.now();
    console.info(`ZXQ reset.fetch.courses: ${f2EndTime - fetchStartTime}ms (students=${observees.length}, totalCourses=${allCourses.length})`);
    
    if (allCourses.length === 0) {
      return { ok: false, step: 'courses' };
    }
    
    // Phase F3 - Assignments per unique course
    const uniqueCourses = Array.from(new Set(allCourses.map(c => c.id)));
    let deniedAssignments = 0;
    const assignmentPromises = uniqueCourses.map(courseId => {
      return getAssignments(String(courseId)).then(assignments => ({
        courseId: String(courseId),
        assignments
      })).catch((error: unknown) => {
        if ((error as Error).message.includes('403')) {
          deniedAssignments++;
          return { courseId: String(courseId), assignments: [], denied: true };
        } else {
          throw error;
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
    console.info(`ZXQ reset.fetch.assignments: ${f3EndTime - fetchStartTime}ms`);
    
    if (deniedAssignments === uniqueCourses.length && uniqueCourses.length > 0) {
      return { ok: false, step: 'assignments' };
    }
    
    // Phase F4 - Submissions per (student, course)
    const submissionPromises: Promise<{ courseId: string; studentId: string; submissions: Submission[] }>[] = [];
    
    for (const course of allCourses) {
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
            .catch(() => ({
              courseId: String(course.id),
              studentId: String(courseObservee.id),
              submissions: []
            }))
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
    console.info(`ZXQ reset.fetch.submissions: ${f4EndTime - fetchStartTime}ms`);
    
    // Phase B1-B4 - Build student data
    const buildStartTime = Date.now();
    
    const metadataRaw = await kv.get(k('metadata:v1'));
    const metadata = metadataRaw ? JSON.parse(metadataRaw) : null;
    
    const studentData = buildStudentData({
      courses: allCourses,
      assignmentsByCourse,
      submissionsByCourseAndStudent,
      observees,
      metadata: metadata as { students: Record<string, unknown>; courses: Record<string, unknown> } | undefined
    });
    
    const b1EndTime = Date.now();
    console.info(`ZXQ reset.build.L1-L4: ${b1EndTime - buildStartTime}ms`);
    
    // Phase A - Augment with outcome data
    // Skip scraping in serverless environments (Playwright browsers not available)
    const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
    let augmentationResult;
    
    if (isServerless) {
      console.info('ZXQ reset.augment.skipped: Playwright not available in serverless environment');
      augmentationResult = {
        ok: true,
        errors: [],
        stats: {
          studentsProcessed: 0,
          parseTypeGroups: {},
          coursesScraped: 0,
          assignmentsAugmented: 0,
          assignmentsUnmatched: 0,
          coursesWithOutcomes: 0,
          duration: 0
        }
      };
    } else {
      const augmentStartTime = Date.now();
      augmentationResult = await augmentStudentDataOutcomes(studentData);
      
      if (!augmentationResult.ok) {
        console.error(`ZXQ reset.augment.failure`);
        // Don't fail the entire reset if scraping fails - just log and continue
        console.warn('ZXQ reset.augment.warning: Scraping failed but continuing with basic data');
      }
      
      const augmentEndTime = Date.now();
      console.info(`ZXQ reset.augment.complete: ${augmentEndTime - augmentStartTime}ms`);
    }
    
    // Phase S - Atomic save
    const saveStartTime = Date.now();
    
    const contractsData = {
      ...studentData,
      lastLoadedAt: new Date().toISOString(),
      apiVersion: '1.0.0' as const,
      version: Date.now()
    } as unknown as StudentData;
    
    await saveStudentData(contractsData);
    await kv.set(k('lastLoadedAt'), JSON.stringify(new Date().toISOString()));
    
    const verifyData = await kv.get(k('studentData:v1'));
    console.info(`ZXQ reset.save.verify: ${verifyData ? 'SUCCESS' : 'FAILED'}`);
    
    const saveEndTime = Date.now();
    console.info(`ZXQ reset.save: ${saveEndTime - saveStartTime}ms`);

    return {
      ok: true,
      counts: {
        students: Object.keys(studentData.students).length,
        courses: uniqueCourses.length,
        assignments: fetchedAssignments,
        submissions: totalSubmissions
      }
    };
    
  } catch (error) {
    console.error('Student data reset failed:', error);
    return {
      ok: false,
      step: 'fetch',
      errors: [(error as Error).message]
    };
  }
}

