/**
 * URL helper for progress table deep-linking.
 * Generates consistent URLs for testing and navigation.
 */
export function progressTableUrl(params: {
  studentId: string;
  courseId?: string;
  open?: string[];
  q?: string;
}): string {
  const url = new URL('/progress', window.location.origin);
  
  url.searchParams.set('student', params.studentId);
  
  if (params.courseId) {
    url.searchParams.set('course', params.courseId);
  }
  
  if (params.open && params.open.length > 0) {
    url.searchParams.set('open', params.open.join(','));
  }
  
  if (params.q) {
    url.searchParams.set('q', params.q);
  }
  
  return url.toString();
}
