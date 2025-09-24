/**
 * Submissions fetcher - thin wrapper, no business logic
 * 
 * Fetches student submissions for a specific course using Canvas API.
 * Uses the main CanvasClient with rate limiting and retry logic.
 * 
 * Note: Canvas requires literal brackets in student_ids[] parameter,
 * so we use a custom approach instead of the standard client.paginate()
 */

import { createCanvasClient } from './client';

export interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  workflow_state: string;
  score?: number;
  grade?: string;
  submitted_at?: string;
}

/**
 * Fetch all submissions for a specific student in a course
 * 
 * Uses Canvas /courses/{courseId}/students/submissions endpoint with
 * student_ids[] parameter for bulk submission retrieval.
 * 
 * @param courseId - Canvas course ID
 * @param studentId - Canvas student/user ID
 * @returns Promise resolving to array of submission objects
 * @throws Error if Canvas API request fails
 */
export async function getSubmissionsForStudent(courseId: string, studentId: string): Promise<Submission[]> {
  const client = createCanvasClient();
  
  // Canvas requires literal brackets in student_ids[] parameter
  // We need to manually construct the URL and use custom pagination
  const canvasBaseUrl = process.env.CANVAS_BASE_URL;
  if (!canvasBaseUrl) {
    throw new Error('CANVAS_BASE_URL not configured');
  }
  
  const submissionsUrl = `${canvasBaseUrl}/api/v1/courses/${courseId}/students/submissions?per_page=100&student_ids[]=${studentId}`;
  
  // Use client's internal pagination method with custom URL
  return client.paginateCustomUrl<Submission>(submissionsUrl);
}
