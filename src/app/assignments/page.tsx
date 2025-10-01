/**
 * page.Assignments v1.0.1
 * Spec: spec/current.json
 * 
 * Assignments page — route-level container for WeeklyGrid
 */

'use client';

import { useStudent } from '@/contexts/StudentContext';
import { WeeklyGrid } from '@/components/WeeklyGrid';
import { useMemo } from 'react';

export default function AssignmentsPage() {
  const { selectedStudentId, data, loading, error } = useStudent();
  
  // Generate weekly grids from student data
  const grids = useMemo(() => {
    if (!data) return {};
    
    // TODO: Call getWeeklyGrids once it's updated to accept StudentData
    return {};
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
  
  if (Object.keys(grids).length === 0 && data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Unable to load assignments. Please refresh the page or contact support.</p>
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