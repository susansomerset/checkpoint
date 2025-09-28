// components/RadialSection.tsx
// Client component for the radial charts section

"use client";

import { useStudent } from '@/contexts/StudentContext';
import { CourseRadialCard } from './CourseRadialCard';

export function RadialSection() {
  const studentContext = useStudent();

  // Get courses for the selected student, sorted by period
  const getCoursesForRadial = () => {
    if (!studentContext?.data || !studentContext?.selectedStudentId) {
      return [];
    }

    const student = studentContext.data.students[studentContext.selectedStudentId];
    if (!student?.courses) {
      return [];
    }

    // Get all courses and sort by period number
    return Object.entries(student.courses)
      .map(([courseId, course]) => ({
        courseId,
        period: course.meta?.period || 0,
        shortName: course.meta?.shortName || 'Unknown Course',
        teacher: course.meta?.teacher || 'Unknown Teacher'
      }))
      .sort((a, b) => {
        // Convert periods to numbers for proper sorting
        const periodA = typeof a.period === 'number' ? a.period : 
                       (typeof a.period === 'string' && !isNaN(Number(a.period))) ? Number(a.period) : 999;
        const periodB = typeof b.period === 'number' ? b.period : 
                       (typeof b.period === 'string' && !isNaN(Number(b.period))) ? Number(b.period) : 999;
        
        // Sort by period number, with non-numeric values (like 'tbd') at the end
        return periodA - periodB;
      })
      .slice(0, 6); // Limit to 6 courses for the header
  };

  const courses = getCoursesForRadial();

  if (courses.length === 0) {
    return (
      <div className="w-full bg-transparent py-6">
        <div className="flex justify-center items-center">
          <div className="text-gray-500">No courses available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent py-6">
      <div className="flex justify-center items-center space-x-8">
        {courses.map((course) => (
          <CourseRadialCard
            key={course.courseId}
            studentId={studentContext.selectedStudentId!}
            courseId={course.courseId}
            label={course.shortName}
            teacher={course.teacher}
          />
        ))}
      </div>
    </div>
  );
}
