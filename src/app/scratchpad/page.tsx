"use client";

import { useStudent } from '@/contexts/StudentContext';
import { useState, useMemo, useEffect } from 'react';

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
  const { selectedStudentId, data, weeklyGrids, loading, refreshData } = useStudent();
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  
  // Extract lastLoadedAt from data if it exists
  useEffect(() => {
    if (data) {
      const dataWithMeta = data as Record<string, unknown>;
      if (dataWithMeta.lastLoadedAt) {
        setLastLoadedAt(dataWithMeta.lastLoadedAt);
      }
    }
  }, [data]);
  
  // Find most recent assignment update across all students
  const mostRecentAssignmentUpdate = useMemo(() => {
    if (!data) return null;
    
    let maxUpdatedAt: string | null = null;
    let assignmentId: string | null = null;
    let studentId: string | null = null;
    let courseId: string | null = null;
    
    Object.entries(data.students).forEach(([sid, student]) => {
      Object.entries(student.courses).forEach(([cid, course]) => {
        Object.entries(course.assignments).forEach(([aid, assignment]) => {
          const canvas = assignment.canvas as Record<string, unknown>;
          const updatedAt = canvas?.updated_at as string | undefined;
          
          if (updatedAt) {
            if (!maxUpdatedAt || updatedAt > maxUpdatedAt) {
              maxUpdatedAt = updatedAt;
              assignmentId = aid;
              studentId = sid;
              courseId = cid;
            }
          }
        });
      });
    });
    
    return { maxUpdatedAt, assignmentId, studentId, courseId };
  }, [data]);
  
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
          <h2 className="text-xl font-bold text-yellow-900">Current Selection & Data Info</h2>
          <div className="space-y-2 text-yellow-800">
            <p>
              <strong>Student ID:</strong> {selectedStudentId || 'None'}
            </p>
            <p>
              <strong>Data Last Loaded:</strong> {lastLoadedAt ? new Date(lastLoadedAt).toLocaleString() : 'Unknown'}
            </p>
            {mostRecentAssignmentUpdate?.maxUpdatedAt && (
              <div className="mt-3 p-2 bg-white rounded border border-yellow-600">
                <p className="font-bold text-yellow-900">Most Recent Assignment Update:</p>
                <p className="text-sm">
                  <strong>Date:</strong> {new Date(mostRecentAssignmentUpdate.maxUpdatedAt).toLocaleString()}
                </p>
                <p className="text-sm">
                  <strong>Assignment:</strong> {mostRecentAssignmentUpdate.assignmentId}
                </p>
                <p className="text-sm">
                  <strong>Student:</strong> {mostRecentAssignmentUpdate.studentId} | <strong>Course:</strong> {mostRecentAssignmentUpdate.courseId}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={async () => {
              if (confirm('Reset student data? This will reload all data from Canvas.')) {
                try {
                  const response = await fetch('/api/student-data/reset', { method: 'POST' });
                  if (response.ok) {
                    await refreshData();
                    alert('Student data reset successfully! Page will reload.');
                    window.location.reload();
                  } else {
                    alert('Failed to reset student data.');
                  }
                } catch (err) {
                  console.error('Error resetting data:', err);
                  alert('Error resetting student data.');
                }
              }
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
          >
            🔄 Reset Student Data
          </button>
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
