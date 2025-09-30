"use client";

import { useState } from 'react';
import { toGridItems } from '@/lib/pure/toGridItems';

// Import fixtures
import weekdayBatch from '../../../tests/fixtures/processing.toGridItems/weekday_batch.json';
import priorBatch from '../../../tests/fixtures/processing.toGridItems/prior_batch.json';
import nextBatch from '../../../tests/fixtures/processing.toGridItems/next_batch.json';

export const dynamic = 'force-dynamic';

// Expected outputs from spec
const expectations = {
  weekdayBatch: [
    { id: "A-100", title: "Weekly Reflection #3 (25)", dueAt: "2025-10-02T23:59:00-07:00", points: 25, url: "https://canvas.example/courses/42/assignments/100", attentionType: "Thumb" },
    { id: "A-101", title: "Lab 2: Vectors (10)", dueAt: "2025-09-15T12:00:00Z", points: 10, url: "https://canvas.example/courses/42/assignments/101", attentionType: "Check" },
    { id: "A-102", title: "Project Draft (50)", dueAt: "2025-09-10T09:00:00Z", points: 50, url: "https://canvas.example/courses/42/assignments/102", attentionType: "Check" },
    { id: "A-103", title: "Quiz 1 (5)", dueAt: "2025-10-03T17:00:00-07:00", points: 5, url: "https://canvas.example/courses/42/assignments/103", attentionType: "Question" },
    { id: "A-104", title: "Short Response (3)", dueAt: "2025-10-07T17:00:00-07:00", points: 3, url: "https://canvas.example/courses/42/assignments/104", attentionType: "Question" },
    { id: "A-105", title: "Problem Set (20)", dueAt: "2025-10-01T17:00:00-07:00", points: 20, url: "https://canvas.example/courses/42/assignments/105", attentionType: "Warning" }
  ],
  priorBatch: [
    { id: "A-103", title: "10/3: Quiz 1 (5)", dueAt: "2025-10-03T17:00:00-07:00", points: 5, url: "https://canvas.example/courses/42/assignments/103", attentionType: "Question" }
  ],
  nextBatch: [
    { id: "A-105", title: "Wed: Problem Set (20)", dueAt: "2025-10-01T17:00:00-07:00", points: 20, url: "https://canvas.example/courses/42/assignments/105", attentionType: "Warning" }
  ]
};

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

interface TestCaseProps {
  label: string;
  fixture: any;
  expected: any;
}

interface Mismatch {
  index: number;
  field: string;
  expectedValue: any;
  actualValue: any;
}

function TestCase({ label, fixture, expected }: TestCaseProps) {
  let actual;
  let error;
  const mismatches: Mismatch[] = [];
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual = toGridItems(
      fixture.entries,
      fixture.formatType,
      fixture.asOf,
      fixture.timezone
    );
    
    // Deep comparison to find specific mismatches
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) {
        mismatches.push({
          index: -1,
          field: 'length',
          expectedValue: expected.length,
          actualValue: actual.length
        });
      } else {
        // Check each element
        actual.forEach((item, index) => {
          const exp = expected[index];
          if (exp) {
            // Check each field
            const allKeys = new Set([...Object.keys(item), ...Object.keys(exp)]);
            allKeys.forEach(key => {
              const actualVal = (item as any)[key];
              const expVal = (exp as any)[key];
              if (JSON.stringify(actualVal) !== JSON.stringify(expVal)) {
                const itemId = (item as any).id || `item-${index}`;
                mismatches.push({
                  index,
                  field: `${itemId}.${key}`,
                  expectedValue: expVal,
                  actualValue: actualVal
                });
              }
            });
          }
        });
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const matches = !error && mismatches.length === 0;

  return (
    <div className="border-2 border-gray-300 rounded-lg p-6 mb-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-900">{label}</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* INPUT */}
        <div>
          <h4 className="text-lg font-semibold mb-2 text-blue-700">INPUT</h4>
          <JsonViewer data={fixture} title="" />
        </div>

        {/* EXPECTED */}
        <div>
          <h4 className="text-lg font-semibold mb-2 text-purple-700">EXPECTED</h4>
          <JsonViewer data={expected} title="" />
        </div>

        {/* ACTUAL */}
        <div>
          <h4 className="text-lg font-semibold mb-2 text-orange-700">ACTUAL OUTPUT</h4>
          {error ? (
            <div className="bg-red-50 p-4 rounded border border-red-300">
              <p className="text-red-700 font-mono text-sm">ERROR: {error}</p>
            </div>
          ) : (
            <JsonViewer data={actual} title="" />
          )}
        </div>
      </div>

      {/* MATCH/MISMATCH with details */}
      <div className="mt-4 p-4 rounded text-center font-bold text-lg">
        {error ? (
          <div className="bg-red-100 text-red-800 border-2 border-red-400">
            ❌ ERROR
          </div>
        ) : matches ? (
          <div className="bg-green-100 text-green-800 border-2 border-green-400">
            ✅ MATCH
          </div>
        ) : (
          <div className="bg-yellow-100 text-yellow-800 border-2 border-yellow-400">
            <div>⚠️ MISMATCH</div>
            <div className="mt-2 text-sm font-normal text-left">
              <div className="font-semibold mb-1">Differences found:</div>
              {mismatches.map((m, idx) => (
                <div key={idx} className="mb-2 p-2 bg-white rounded border border-yellow-600">
                  {m.index === -1 ? (
                    <div className="font-mono text-xs">
                      <strong>Array {m.field}:</strong> expected {JSON.stringify(m.expectedValue)}, got {JSON.stringify(m.actualValue)}
                    </div>
                  ) : (
                    <div className="font-mono text-xs">
                      <div className="font-semibold text-gray-900 mb-1">
                        ⚠️ Array index [{m.index}] - {m.field}
                      </div>
                      <div>
                        <span className="text-purple-700">Expected:</span> {JSON.stringify(m.expectedValue)}
                      </div>
                      <div>
                        <span className="text-orange-700">Actual:</span> {JSON.stringify(m.actualValue)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScratchpadPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">toGridItems Function Test Results</h1>
        <p className="text-lg text-gray-600 mb-2">
          Spec: processing.toGridItems v1.1.0 (batched)
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Source: spec/current.json
        </p>
        
        <div className="space-y-6">
          <TestCase 
            label="Weekday batch (6)" 
            fixture={weekdayBatch} 
            expected={expectations.weekdayBatch} 
          />

          <TestCase 
            label="Prior (prev Friday)" 
            fixture={priorBatch} 
            expected={expectations.priorBatch} 
          />

          <TestCase 
            label="Next (EEE prefix)" 
            fixture={nextBatch} 
            expected={expectations.nextBatch} 
          />
        </div>

        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">⏸️ AWAITING PO APPROVAL</h2>
          <p className="text-blue-800">
            Please review the 3 test cases above. Each test case shows:
          </p>
          <ul className="list-disc ml-6 mt-2 text-blue-800">
            <li><strong>INPUT:</strong> The fixture data (entries + formatType + asOf + timezone)</li>
            <li><strong>EXPECTED:</strong> The expected output from spec/current.json</li>
            <li><strong>ACTUAL OUTPUT:</strong> The computed result from toGridItems() function</li>
            <li><strong>Status:</strong> ✅ MATCH / ⚠️ MISMATCH / ❌ ERROR</li>
          </ul>
          <p className="text-blue-800 mt-4">
            <strong>Note:</strong> All tests should show ✅ MATCH. If any show mismatch or error, 
            implementation needs adjustment before commit.
          </p>
        </div>
      </div>
    </div>
  );
}