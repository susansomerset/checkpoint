// Test to see if there's a difference between our approach and the working approach
const canvasBaseUrl = 'https://djusd.instructure.com';
const courseId = '22785';
const studentId = '19904';

// Approach 1: Full URL (like working debug route)
const fullUrl = `${canvasBaseUrl}/api/v1/courses/${courseId}/students/submissions?per_page=100&student_ids[]=${studentId}`;
console.log('Full URL approach:', fullUrl);

// Approach 2: Path + query (like our current implementation)
const url = new URL('/api/v1/courses/22785/students/submissions', canvasBaseUrl);
url.searchParams.set('per_page', '100');
url.searchParams.append('student_ids[]', '19904');
console.log('Path + query approach:', url.toString());

// Check if they're the same
console.log('Are they the same?', fullUrl === url.toString());
