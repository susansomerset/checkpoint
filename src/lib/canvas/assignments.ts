// Assignments fetcher - thin wrapper, no business logic
import { createCanvasClient } from './client';

export interface Assignment {
  id: number;
  name: string;
  points_possible: number;
  due_at?: string;
  description?: string;
  assignment_group_id: number;
  published: boolean;
}

export async function getAssignments(courseId: string): Promise<Assignment[]> {
  const client = createCanvasClient();
  return client.paginate<Assignment>(`/api/v1/courses/${courseId}/assignments`, { per_page: '100' });
}
