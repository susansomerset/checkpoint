"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { getWeeklyGrids } from '@/lib/compose/getWeeklyGrids';

// Import fixtures for getWeeklyGrids
import twoStudentsSmall from '../../../tests/fixtures/processing.getWeeklyGrids/two_students_small.json';

export const dynamic = 'force-dynamic';

function JsonViewer({ data, title }: { data: unknown; title: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpanded = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderValue = (value: unknown, key: string = '', depth: number = 0): JSX.Element => {
    const indent = '  '.repeat(depth);
    const isExpanded = expanded[key];

    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-green-600">&quot;{value}&quot;</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-600">{value.toString()}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500">[]</span>;
      }
      
      return (
        <div>
          <span 
            className="cursor-pointer text-gray-700 hover:text-blue-600"
            onClick={() => toggleExpanded(key)}
          >
            {isExpanded ? '▼' : '▶'} [
          </span>
          {isExpanded && (
            <div className="ml-4">
              {value.map((item, index) => (
                <div key={index}>
                  {indent}  {index}: {renderValue(item, `${key}[${index}]`, depth + 1)}
                </div>
              ))}
            </div>
          )}
          {!isExpanded && <span className="text-gray-500">...{value.length} items</span>}
          <span>]</span>
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="text-gray-500">{'{}'}</span>;
      }

      return (
        <div>
          <span 
            className="cursor-pointer text-gray-700 hover:text-blue-600"
            onClick={() => toggleExpanded(key)}
          >
            {isExpanded ? '▼' : '▶'} {'{'}
          </span>
          {isExpanded && (
            <div className="ml-4">
              {keys.map(objKey => (
                <div key={objKey}>
                  {indent}  <span className="text-red-600">&quot;{objKey}&quot;</span>: {renderValue((value as Record<string, unknown>)[objKey], `${key}.${objKey}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
          {!isExpanded && <span className="text-gray-500">...{keys.length} properties</span>}
          <span>{'}'}</span>
        </div>
      );
    }

    return <span className="text-gray-500">{String(value)}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="bg-gray-100 p-4 rounded border max-h-96 overflow-auto">
        <pre className="text-sm">
          {renderValue(data)}
        </pre>
      </div>
    </div>
  );
}

export default function ScratchpadPage() {
  // Run getWeeklyGrids
  const twoStudentsData = twoStudentsSmall as Record<string, unknown>;
  const weeklyGridsActual = getWeeklyGrids(
    twoStudentsData.studentData as any,
    twoStudentsData.asOf as string,
    twoStudentsData.timezone as string | undefined
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">processing.getWeeklyGrids v1.0.2</h1>
        <p className="text-lg text-gray-600 mb-2">
          Weekly grid builder for students (indexed by studentId)
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Source: spec/current.json
        </p>
        
        <div className="space-y-6">
          <div className="border-2 border-gray-300 rounded-lg p-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Two Students Small - Full Output</h3>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 text-blue-700">ACTUAL OUTPUT (indexed object)</h4>
              <JsonViewer data={weeklyGridsActual} title="" />
            </div>

            <div className="bg-white p-4 rounded border">
              <h5 className="font-semibold text-gray-900 mb-2">Quick Summary:</h5>
              {Object.entries(weeklyGridsActual).map(([studentId, studentGrid]) => (
                <div key={studentId} className="mb-3 p-3 bg-gray-50 rounded">
                  <div className="font-bold text-lg">Student: {studentId}</div>
                  <div className="text-sm mt-1">
                    <strong>Summary:</strong> {JSON.stringify(studentGrid.summary)}
                  </div>
                  <div className="text-sm mt-1">
                    <strong>Header:</strong> {studentGrid.grid.header.columns.join(' | ')}
                  </div>
                  <div className="text-sm mt-1">
                    <strong>Courses:</strong> {studentGrid.grid.rows.length}
                  </div>
                  {studentGrid.grid.rows.map((row, ridx) => (
                    <div key={ridx} className="ml-4 mt-2 p-2 bg-white rounded border">
                      <div className="font-semibold">{row.courseName} ({row.courseId})</div>
                      <div className="text-xs mt-1 grid grid-cols-2 gap-1">
                        <div>Prior: {row.cells.prior.length}</div>
                        <div>Mon: {row.cells.weekday.Mon.length}</div>
                        <div>Tue: {row.cells.weekday.Tue.length}</div>
                        <div>Wed: {row.cells.weekday.Wed.length}</div>
                        <div>Thu: {row.cells.weekday.Thu.length}</div>
                        <div>Fri: {row.cells.weekday.Fri.length}</div>
                        <div>Next: {row.cells.next.length}</div>
                        <div>NoDate: {row.cells.noDate.count}</div>
                      </div>
                      <div className="text-xs mt-1">
                        <strong>Row Summary:</strong> {JSON.stringify(row.summary)}
                      </div>
                      <div className="text-xs mt-1 text-gray-600">
                        <div><strong>Items in buckets:</strong></div>
                        {row.cells.prior.length > 0 && <div>Prior: {row.cells.prior.map(i => i.id).join(', ')}</div>}
                        {row.cells.weekday.Mon.length > 0 && <div>Mon: {row.cells.weekday.Mon.map(i => i.id).join(', ')}</div>}
                        {row.cells.weekday.Tue.length > 0 && <div>Tue: {row.cells.weekday.Tue.map(i => i.id).join(', ')}</div>}
                        {row.cells.weekday.Wed.length > 0 && <div>Wed: {row.cells.weekday.Wed.map(i => i.id).join(', ')}</div>}
                        {row.cells.weekday.Thu.length > 0 && <div>Thu: {row.cells.weekday.Thu.map(i => i.id).join(', ')}</div>}
                        {row.cells.weekday.Fri.length > 0 && <div>Fri: {row.cells.weekday.Fri.map(i => i.id).join(', ')}</div>}
                        {row.cells.next.length > 0 && <div>Next: {row.cells.next.map(i => i.id).join(', ')}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">⏸️ AWAITING PO APPROVAL</h2>
          <p className="text-blue-800 mb-3">
            <strong>processing.getWeeklyGrids v1.0.2:</strong> Review the output above:
          </p>
          <ul className="list-disc ml-6 text-blue-800 text-sm">
            <li>Verify indexed object structure (result[&apos;S1&apos;], result[&apos;S2&apos;])</li>
            <li>Verify header labels match Monday (10/6) through Friday (10/10)</li>
            <li>Verify Prior bucket contains ONLY Missing before Monday</li>
            <li>Verify Weekday buckets (Mon-Fri) use plain format (no day prefix)</li>
            <li>Verify Next bucket uses EEE prefix format</li>
            <li>Verify Submitted/Graded before current week are excluded</li>
            <li>Verify No Date summary shows count and points</li>
            <li>Verify student-level summary aggregates correctly</li>
          </ul>
          <p className="text-yellow-800 bg-yellow-50 p-3 mt-4 rounded border border-yellow-400">
            ⚠️ <strong>ATTENTION COUNTS MISMATCH DETECTED:</strong><br/>
            Vern&apos;s corrected fixture expectations show different counts than my implementation produces.<br/>
            <strong>Expected:</strong> S1 Thumb: 1, totalItems: 3<br/>
            <strong>My Output:</strong> S1 Thumb: 2 (A-2 + A-5), totalItems: 4<br/>
            <br/>
            This appears to be another fixture data issue. The input data has 2 Due assignments (both produce Thumb) but expectations show Thumb: 1.
          </p>
        </div>
      </div>
    </div>
  );
}