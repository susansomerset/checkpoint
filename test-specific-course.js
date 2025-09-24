// Test with the specific course that's failing
const courseId = '22593'; // Integrated Mathematics 2
const studentId = '19904'; // Student 19904

console.log('Testing course:', courseId);
console.log('Testing student:', studentId);
console.log('URL would be:', `https://djusd.instructure.com/api/v1/courses/${courseId}/students/submissions?per_page=100&student_ids[]=${studentId}`);

// Let's also test with the course that was working in the debug route
const workingCourseId = '23758'; // Bio/Lit
console.log('\nWorking course:', workingCourseId);
console.log('Working URL would be:', `https://djusd.instructure.com/api/v1/courses/${workingCourseId}/students/submissions?per_page=100&student_ids[]=${studentId}`);
