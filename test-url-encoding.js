// Quick test to see URL encoding
const url = new URL('https://djusd.instructure.com/api/v1/courses/22785/students/submissions');
url.searchParams.set('per_page', '100');
url.searchParams.append('student_ids[]', '19904');

console.log('Generated URL:', url.toString());
console.log('Expected: https://djusd.instructure.com/api/v1/courses/22785/students/submissions?per_page=100&student_ids%5B%5D=19904');
