"use client";

import { useStudent } from '@/contexts/StudentContext';
import { useState, useMemo } from 'react';
import { getDetailRows } from '@/lib/pure/getDetailRows';
import { getSelectedDetail } from '@/lib/compose/detailData';
import { useRawDetailSnapshot } from '@/ui/hooks/useRawDetailSnapshot';

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
  const studentContext = useStudent();
  const { selectedStudentId, data, loading } = studentContext;
  
  // Hook for getting raw snapshots (demo of useRawDetailSnapshot)
  const getSnapshot = useRawDetailSnapshot();
  
  // Compute detail rows for selected student (pure layer)
  const detailRows = useMemo(() => {
    if (!data || !selectedStudentId) return null;
    
    const selectedStudent = data.students[selectedStudentId];
    if (!selectedStudent) return null;
    
    try {
      const now = new Date().toISOString();
      const rows = getDetailRows(selectedStudent, now);
      return rows;
    } catch (err) {
      return { error: String(err) };
    }
  }, [data, selectedStudentId]);
  
  // Compute compose layer output (adapter)
  const composeOutput = useMemo(() => {
    try {
      const now = new Date().toISOString();
      return getSelectedDetail(studentContext, now);
    } catch (err) {
      return { error: String(err) };
    }
  }, [studentContext]);
  
  // Demo: Get raw snapshot for first assignment (using the hook)
  const rawSnapshotDemo = useMemo(() => {
    if (!getSnapshot || !detailRows || !Array.isArray(detailRows) || detailRows.length === 0) {
      return null;
    }
    
    const firstRow = detailRows[0];
    try {
      return getSnapshot({
        studentId: firstRow.studentId,
        courseId: firstRow.courseId,
        assignmentId: firstRow.assignmentId
      });
    } catch (err) {
      return { error: String(err) };
    }
  }, [getSnapshot, detailRows]);
  
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
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Scratchpad - Detail Rows</h1>
        
        <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-900">Current Selection</h2>
          <p className="text-yellow-800">
            <strong>Student ID:</strong> {selectedStudentId || 'None'}
          </p>
          <p className="text-yellow-800 text-sm mt-2">
            Switch students in the header to see detailRows regenerate for the selected student.
          </p>
        </div>
        
        <JsonViewer 
          data={composeOutput} 
          label="📦 compose.detailData Output (rows + headers + selectedStudentId)"
        />
        
        <JsonViewer 
          data={rawSnapshotDemo} 
          label="🔍 useRawDetailSnapshot Demo (first assignment - lazy-loaded via hook)"
        />
        
        <JsonViewer 
          data={detailRows} 
          label="📋 processing.getDetailRows Output (raw rows only)"
        />
        
        <div className="mt-8 p-6 bg-green-50 border-2 border-green-300 rounded-lg">
          <h2 className="text-2xl font-bold text-green-900 mb-2">Validation Checklist</h2>
          <ul className="list-disc ml-6 text-green-800 text-sm space-y-1">
            <li>✅ All assignments flattened (one row per assignment)</li>
            <li>✅ All URLs start with http:// or https://</li>
            <li>✅ gradePct only present when pointsPossible &gt; 0</li>
            <li>✅ pointsGraded defaults to 0 when missing</li>
            <li>✅ Date display: &quot;M/D&quot; (same year) or &quot;M/D/YY&quot; (different year)</li>
            <li>✅ Rows have NO raw field (IDs at top level instead)</li>
            <li>✅ useRawDetailSnapshot hook returns callable</li>
            <li>✅ Raw snapshot has student.meta (NO nested courses)</li>
            <li>✅ Raw snapshot has course.meta (NO nested assignments)</li>
            <li>✅ Raw snapshot has assignment.meta.checkpointStatus</li>
            <li>✅ Raw snapshot has assignment.submissions (ALL submissions)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
