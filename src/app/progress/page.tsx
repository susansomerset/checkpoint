"use client";

import { useStudent } from "@/contexts/StudentContext";

export default function ProgressPage() {
  const { selectedStudentId, data, loading, error } = useStudent();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Loading progress data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="text-red-500">Error loading progress data: {error}</div>
        </div>
      </div>
    );
  }

  if (!selectedStudentId || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Please select a student to view progress</div>
        </div>
      </div>
    );
  }

  const student = data.students[selectedStudentId];
  if (!student) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Student not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Progress Overview
            </h1>
            <p className="mt-2 text-gray-600">
              Progress charts are displayed above. This page provides additional details about your academic progress.
            </p>
          </div>
          <div className="flex gap-4">
            <a 
              href="/dashboard" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Dashboard
            </a>
            <a 
              href="/assignments" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Assignments
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Student: {student.meta.preferredName || student.meta.legalName}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(student.courses)
            .filter(course => course.meta.period && course.meta.period <= 6)
            .sort((a, b) => (a.meta.period || 0) - (b.meta.period || 0))
            .map(course => {
              const assignments = Object.values(course.assignments)
                .filter(assignment => assignment.meta.assignmentType !== 'Vector');
              
              const totalPoints = assignments.reduce((sum, assignment) => sum + (assignment.pointsPossible || 0), 0);
              const earnedPoints = assignments
                .filter(assignment => assignment.meta.checkpointStatus === 'Graded')
                .reduce((sum, assignment) => sum + (assignment.pointsPossible || 0), 0);
              
              const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
              
              return (
                <div key={course.courseId} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">
                    Period {course.meta.period}: {course.meta.shortName || course.canvas.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {course.meta.teacher}
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Points Earned</span>
                      <span className="font-medium">{earnedPoints} / {totalPoints}</span>
                    </div>
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600 mt-1">
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
