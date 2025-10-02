'use client';

import { useStudent } from '@/contexts/StudentContext';
import { getSelectedDetail } from '@/lib/compose/detailData';
import { TableDetail } from '@/ui/components/TableDetail';
import React, { useMemo } from 'react';

export default function DetailPage() {
  const studentContext = useStudent();
  const { selectedStudentId, data, loading, error } = studentContext;

  // Compute detail data using compose layer
  const detailData = useMemo(() => {
    if (!selectedStudentId || !data) {
      return null;
    }
    return getSelectedDetail(studentContext);
  }, [studentContext, selectedStudentId, data]);

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

  if (!detailData || detailData.rows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Detail View</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              {selectedStudentId
                ? 'No assignment data available for selected student.'
                : 'No student selected.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <TableDetail
            baseHeaders={detailData.headers}
            rows={detailData.rows}
            selectedStudentId={detailData.selectedStudentId}
          />
        </div>
      </div>
    </div>
  );
}