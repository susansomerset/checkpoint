"use client";

import { useStudent } from '@/contexts/StudentContext';
import { useState, useMemo } from 'react';

interface JsonViewerProps {
  data: unknown;
  label: string;
}

function JsonViewer({ data, label }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <div className="mb-6 border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left font-bold text-lg text-blue-900 mb-2 hover:text-blue-700"
      >
        {isExpanded ? '▼' : '▶'} {label}
      </button>
      {isExpanded && (
        <pre className="bg-white p-4 rounded border border-gray-300 overflow-auto max-h-96 text-xs font-mono" style={{ color: '#000000' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function ScratchpadPage() {
  const { selectedStudentId, data, weeklyGrids, loading } = useStudent();
  
  // Run adapter locally to see what it produces
  const adapterOutput = useMemo(() => {
    if (!data || !selectedStudentId) return null;
    
    // Same filtering as StudentContext
    const selectedStudentData = {
      students: {
        [selectedStudentId]: data.students[selectedStudentId]
      }
    };
    
    // Inline adapter logic to debug
    try {
      const adapted = {
        students: Object.values(selectedStudentData.students).map((student) => ({
          id: student.studentId,
          name: student.meta?.preferredName || student.meta?.legalName || student.studentId,
          courses: Object.values(student.courses).map((course) => {
            const canvasCourse = course.canvas as Record<string, unknown>;
            return {
              id: course.courseId,
              name: course.meta?.shortName || (canvasCourse.name as string) || 'Unknown',
              assignments: Object.values(course.assignments).map((assignment) => {
                const canvasAssignment = assignment.canvas as Record<string, unknown>;
                return {
                  id: assignment.assignmentId,
                  name: (canvasAssignment.name as string) || 'Untitled',
                  points: assignment.pointsPossible,
                  dueAt: canvasAssignment.due_at as string | undefined,
                  checkpointStatus: assignment.meta.checkpointStatus,
                  // eslint-disable-next-line camelcase
                  html_url: (canvasAssignment.html_url as string) || `https://djusd.instructure.com/courses/${course.courseId}/assignments/${assignment.assignmentId}`
                };
              })
            };
          })
        }))
      };
      return adapted;
    } catch (err) {
      return { error: String(err) };
    }
  }, [data, selectedStudentId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Scratchpad - WeeklyGrids Debug</h1>
        
        <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-900">Current Selection</h2>
          <p className="text-yellow-800">
            <strong>Student ID:</strong> {selectedStudentId || 'None'}
          </p>
        </div>
        
        <JsonViewer 
          data={adapterOutput} 
          label="Adapter Output (StudentData → StudentDataInput)"
        />
        
        <JsonViewer 
          data={weeklyGrids} 
          label="weeklyGrids (from StudentContext - final output)"
        />
        
        <JsonViewer 
          data={data} 
          label="StudentData (raw from context - input)"
        />
        
        <div className="mt-8 p-6 bg-green-50 border-2 border-green-300 rounded-lg">
          <h2 className="text-2xl font-bold text-green-900 mb-2">Instructions</h2>
          <p className="text-green-800 mb-3">
            Change the selected student in the header and watch the weeklyGrids update.
          </p>
          <ul className="list-disc ml-6 text-green-800 text-sm">
            <li>Verify weeklyGrids regenerates when student changes</li>
            <li>Verify grid.header.studentHeader shows student&apos;s preferredName</li>
            <li>Verify assignments have dueAt populated from canvas.due_at</li>
            <li>Verify Prior/Weekday/Next buckets have items (not all in NoDate)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
