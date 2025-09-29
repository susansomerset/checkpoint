"use client";

import { useStudent } from '@/contexts/StudentContext';
import { useState } from 'react';

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
  const studentContext = useStudent();

  if (!studentContext) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Zach&apos;s Int Math 2 Data</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Find Zach's student ID
  const zachStudentId = studentContext?.data?.students ? 
    Object.keys(studentContext.data.students).find(id => {
      const student = studentContext.data?.students?.[id];
      const name = student?.meta?.preferredName || student?.meta?.legalName || '';
      return name.toLowerCase().includes('zach');
    }) : null;

  // Find Int Math 2 course
  const intMath2CourseId = zachStudentId && studentContext?.data?.students?.[zachStudentId]?.courses ?
    Object.keys(studentContext.data.students[zachStudentId].courses).find(id => {
      const course = studentContext.data?.students?.[zachStudentId]?.courses?.[id];
      const name = course?.meta?.shortName || course?.canvas?.name || '';
      return name.toLowerCase().includes('int math 2') || name.toLowerCase().includes('integrated math 2');
    }) : null;

  const zachStudent = zachStudentId && studentContext?.data?.students ? studentContext.data.students[zachStudentId] : null;
  const intMath2Course = intMath2CourseId && zachStudent ? zachStudent.courses[intMath2CourseId] : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Zach&apos;s Int Math 2 Data</h1>
        
        <div className="space-y-6">
          <JsonViewer 
            data={zachStudent} 
            title={`Zach's Student Data (ID: ${zachStudentId})`}
          />
          
          <JsonViewer 
            data={intMath2Course} 
            title={`Int Math 2 Course Data (ID: ${intMath2CourseId})`}
          />
          
          <JsonViewer 
            data={studentContext} 
            title="Full StudentContext Object"
          />
        </div>
      </div>
    </div>
  );
}
