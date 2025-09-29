'use client';

import { useStudent } from '@/contexts/StudentContext';
import { useParams } from 'next/navigation';
import React from 'react';

export default function DetailPage() {
  const { selectedStudentId, data, loading, error } = useStudent();
  const params = useParams();
  const courseId = params?.courseId as string | undefined; // Assuming courseId can be passed as a param

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Detail View</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Loading student data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Detail View</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-red-600">Error loading data: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedStudentId || !data || !data.students[selectedStudentId]) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Detail View</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">No student selected or data available.</p>
          </div>
        </div>
      </div>
    );
  }

  const student = data.students[selectedStudentId];
  const studentName = student.meta?.preferredName || student.meta?.legalName || 'Unknown Student';
  const course = courseId ? student.courses[courseId] : null;
  const courseName = course?.meta?.shortName || course?.canvas?.name || 'Unknown Course';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Detail View for {studentName}</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {course ? `Course: ${courseName}` : 'Student Overview'}
          </h2>
          <p className="text-gray-700">Student ID: {selectedStudentId}</p>
          {course && <p className="text-gray-700">Course ID: {courseId}</p>}
          {/* Add more detailed information here as needed for Phase 5 */}
          <p className="mt-4 text-gray-600">This is the detail page. Content will be expanded in Phase 5.</p>
        </div>
      </div>
    </div>
  );
}