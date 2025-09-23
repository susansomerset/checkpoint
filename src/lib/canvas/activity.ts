import { canvasFetch } from './client';

export async function fetchActivityStream(perPage = 50) {
  return canvasFetch(`/api/v1/users/self/activity_stream?per_page=${perPage}`);
}

export async function fetchSubmissionsSince(courseId: string, params: { submittedSince?: string; gradedSince?: string } = {}) {
  const search = new URLSearchParams();
  if (params.submittedSince) search.set('submitted_since', params.submittedSince);
  if (params.gradedSince) search.set('graded_since', params.gradedSince);
  if (!search.has('per_page')) search.set('per_page', '100');
  return canvasFetch(`/api/v1/courses/${courseId}/students/submissions?${search.toString()}`);
}

export async function fetchCanvasDeltas() {
  // TODO: combine activity/submissions as needed and return normalized deltas
  return [] as unknown[];
}
