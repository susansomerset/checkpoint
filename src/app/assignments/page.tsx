/**
 * page.Assignments v1.0.1
 * Spec: spec/current.json
 * 
 * Assignments page — route-level container for WeeklyGrid
 */

'use client';

import { useStudent } from '@/contexts/StudentContext';
import { WeeklyGrid } from '@/components/WeeklyGrid';
import { getWeeklyGrids } from '@/lib/compose/getWeeklyGrids';
import { useMemo } from 'react';

export default function AssignmentsPage() {
  const { selectedStudentId, data, loading, error } = useStudent();
  
  // Generate weekly grids from student data
  const grids = useMemo(() => {
    if (!data) return {};
    
    // Transform StudentData to format expected by getWeeklyGrids
    const studentData = {
      students: Object.values(data.students || {}).map(student => ({
        id: student.studentId,
        name: student.meta?.preferredName || student.meta?.legalName || 'Unknown',
        courses: Object.values(student.courses || {}).map(course => ({
          id: course.courseId,
          name: course.meta?.shortName || course.canvas?.name || 'Unknown Course',
          assignments: Object.values(course.assignments || {}).map(assignment => ({
            id: assignment.assignmentId,
            name: assignment.meta?.title || assignment.canvas?.name || 'Untitled',
            points: assignment.pointsPossible,
            dueAt: assignment.meta?.dueDate,
            checkpointStatus: (assignment.meta?.checkpointStatus || 'Due') as 'Due' | 'Missing' | 'Submitted' | 'Graded',
            url: assignment.canvas?.html_url || `https://canvas.instructure.com/courses/${course.courseId}/assignments/${assignment.assignmentId}`
          }))
        }))
      }))
    };
    
    // Get current time in Pacific timezone
    const now = new Date().toISOString();
    
    return getWeeklyGrids(studentData, now, 'America/Los_Angeles');
  }, [data]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Error loading data: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!selectedStudentId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Please select a student from the header.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <WeeklyGrid 
          grids={grids}
          selectedStudentId={selectedStudentId}
        />
      </div>
    </div>
  );
}