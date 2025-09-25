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
  graded_at?: string;
  late?: boolean;
  excused?: boolean;
  missing?: boolean;
  points_deducted?: number;
  points_possible?: number;
  html_url?: string;
  preview_url?: string;
  body?: string;
  attempt?: number;
  url?: string;
  submission_type?: string;
  attachments?: unknown[];
  discussion_entries?: unknown[];
  media_comment?: unknown;
  media_comment_id?: number;
  media_comment_type?: string;
  turnitin_data?: unknown;
  vericite_data?: unknown;
  turnitin_settings?: unknown;
  grade_matches_current_submission?: boolean;
  graded_anonymously?: boolean;
  posted_at?: string;
  read_status?: string;
  redo_request?: boolean;
  seconds_late?: number;
  extra_attempts?: number;
  anonymous_id?: string;
  cached_due_date?: string;
  excused_after_due?: boolean;
  grading_period_id?: number;
  grading_period_title?: string;
  score_statistics?: unknown;
  user?: {
    id: number;
    name: string;
    created_at: string;
    sortable_name: string;
    short_name: string;
    sis_user_id?: string;
    integration_id?: string;
    login_id?: string;
    avatar_url?: string;
    enrollments?: unknown[];
    email?: string;
    locale?: string;
    last_login?: string;
    time_zone?: string;
    bio?: string;
  };
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
