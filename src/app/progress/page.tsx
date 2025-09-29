'use client';

import { useStudentContext } from '@/contexts/StudentContext';
import { ProgressTable } from '@/components/ProgressTable';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function ProgressPageContent() {
  const { data, selectedStudentId, setSelectedStudentId } = useStudentContext();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle URL parameters for deep linking
  useEffect(() => {
    if (!isClient) return;

    const studentParam = searchParams.get('student');
    if (studentParam && studentParam !== selectedStudentId) {
      setSelectedStudentId(studentParam);
    }
  }, [searchParams, selectedStudentId, setSelectedStudentId, isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-4/5">
          <ProgressTable 
            data={data} 
            studentId={selectedStudentId}
            className="bg-white shadow rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <ProgressPageContent />
    </Suspense>
  );
}