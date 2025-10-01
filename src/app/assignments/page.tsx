/**
 * page.Assignments v1.0.1
 * Spec: spec/current.json
 * 
 * Assignments page — route-level container for WeeklyGrid
 */

'use client';

import { useStudent } from '@/contexts/StudentContext';
import { WeeklyGrid } from '@/components/WeeklyGrid';

export default function AssignmentsPage() {
  const { selectedStudentId, weeklyGrids, loading, error } = useStudent();
  
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
  
  if (!weeklyGrids || Object.keys(weeklyGrids).length === 0) {
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
          grids={weeklyGrids}
          selectedStudentId={selectedStudentId}
        />
      </div>
    </div>
  );
}