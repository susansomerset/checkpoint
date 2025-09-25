// Courses fetcher - thin wrapper, no business logic
import { createCanvasClient } from './client';

// Calculate academic year start (June 1st of year from 7 months ago)
function getAcademicYearStart(): string {
  const now = new Date();
  const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, now.getDate());
  const year = sevenMonthsAgo.getFullYear();
  return `${year}-06-01T00:00:00Z`;
}

export interface Course {
  id: number;
  name: string;
  course_code?: string;
  start_at?: string;
  end_at?: string;
  workflow_state: string;
  enrollments?: Enrollment[];
}

export interface Enrollment {
  id: number;
  user_id: number;
  type: string;
  enrollment_state: string;
  role: string;
  created_at: string;
  updated_at: string;
  associated_user_id?: number;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
}

export async function getCoursesForSelf(): Promise<Course[]> {
  const client = createCanvasClient();
  const academicYearStart = getAcademicYearStart();
  console.info(`ZXQ getCoursesForSelf: Fetching all courses, will filter by created_at >= ${academicYearStart}`);
  
  // Fetch all courses first
  const allCourses = await client.paginate<Course>('/api/v1/courses', { per_page: '100' });
  
  // Filter courses created on or after academic year start
  const filteredCourses = allCourses.filter(course => {
    if (!course.created_at) return false;
    const createdAt = new Date(course.created_at);
    const academicYearStartDate = new Date(academicYearStart);
    return createdAt >= academicYearStartDate;
  });
  
  console.info(`ZXQ getCoursesForSelf: Filtered ${allCourses.length} courses down to ${filteredCourses.length} courses`);
  return filteredCourses;
}

export async function getCoursesForStudent(studentId: string): Promise<Course[]> {
  const client = createCanvasClient();
  const academicYearStart = getAcademicYearStart();
  console.info(`ZXQ getCoursesForStudent(${studentId}): Fetching all courses, will filter by created_at >= ${academicYearStart}`);
  
  // Fetch all courses first
  const allCourses = await client.paginate<Course>(`/api/v1/users/${studentId}/courses`, { per_page: '100' });
  
  // Filter courses created on or after academic year start
  const filteredCourses = allCourses.filter(course => {
    if (!course.created_at) return false;
    const createdAt = new Date(course.created_at);
    const academicYearStartDate = new Date(academicYearStart);
    return createdAt >= academicYearStartDate;
  });
  
  console.info(`ZXQ getCoursesForStudent(${studentId}): Filtered ${allCourses.length} courses down to ${filteredCourses.length} courses`);
  return filteredCourses;
}
