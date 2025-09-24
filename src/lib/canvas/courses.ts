// Courses fetcher - thin wrapper, no business logic
import { createCanvasClient } from './client';

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
  return client.paginate<Course>('/api/v1/courses', { per_page: '100' });
}

export async function getCoursesForStudent(studentId: string): Promise<Course[]> {
  const client = createCanvasClient();
  return client.paginate<Course>(`/api/v1/users/${studentId}/courses`, { per_page: '100' });
}
