'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { StudentData } from '@/lib/contracts/types';
import { selectProgressTableRows } from '@/selectors/progressTable';
import { formatPoints, formatPercentage, formatDue } from '@/lib/formatters';

interface ProgressTableProps {
  data: StudentData | null;
  studentId: string | null;
  className?: string;
}

// Status color mapping (matching radial chart colors)
const STATUS_COLORS = {
  'Missing': '#ef4444',      // Red
  'Submitted (Late)': '#3b82f6', // Blue  
  'Submitted': '#3b82f6',    // Blue
  'Graded': '#22c55e',       // Green (replacing Earned)
} as const;

export function ProgressTable({ data, studentId, className = '' }: ProgressTableProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedStatusGroups, setExpandedStatusGroups] = useState<Set<string>>(new Set());

  const progressData = useMemo(() => {
    if (!data || !studentId) return null;
    return selectProgressTableRows(data, studentId);
  }, [data, studentId]);

  // Handle URL parameters for deep linking
  useEffect(() => {
    if (typeof window === 'undefined' || !progressData) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const courseParam = urlParams.get('course');
    const openParam = urlParams.get('open');
    
    if (courseParam) {
      setExpandedCourses(new Set([courseParam]));
    }
    
    if (openParam) {
      const statuses = openParam.split(',').map(s => s.trim());
      const statusGroups = new Set<string>();
      statuses.forEach(status => {
        progressData.courses.forEach(course => {
          statusGroups.add(`${course.courseId}-${status}`);
        });
      });
      setExpandedStatusGroups(statusGroups);
    }
  }, [progressData]);

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const toggleStatusGroup = (courseId: string, status: string) => {
    const key = `${courseId}-${status}`;
    setExpandedStatusGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  if (!progressData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Please select a student to view progress</div>
      </div>
    );
  }

  return (
    <div className={`progress-table ${className}`} data-testid="progress-table">

      {/* Progress table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class Name
              </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Graded
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Possible
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Graded %
                  </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {progressData.courses.map((course) => {
              const isCourseExpanded = expandedCourses.has(course.courseId);
              
              return (
                <React.Fragment key={course.courseId}>
                  {/* Course header row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleCourse(course.courseId)}
                        className="flex items-center text-left font-medium text-gray-900 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                        aria-expanded={isCourseExpanded}
                        aria-label={`${isCourseExpanded ? 'Collapse' : 'Expand'} ${course.courseName} course details`}
                      >
                        <div className="text-sm font-medium">
                          {course.courseName} - {course.teacherName} <span className="text-gray-500">({course.assignmentCount} assignments)</span>
                        </div>
                      </button>
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatPoints(course.totalEarned)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatPoints(course.totalPossible)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {course.percentage}
                        </td>
                  </tr>

                  {/* Status group rows (when course is expanded) */}
                  {isCourseExpanded && course.statusGroups.map((statusGroup) => {
                    const statusKey = `${course.courseId}-${statusGroup.status}`;
                    const isStatusExpanded = expandedStatusGroups.has(statusKey);
                    
                    return (
                      <React.Fragment key={statusKey}>
                        {/* Status group header */}
                        <tr className="bg-gray-25">
                          <td className="px-6 py-3 pl-12">
                            <button
                              onClick={() => toggleStatusGroup(course.courseId, statusGroup.status)}
                              className="flex items-center text-left text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                              aria-expanded={isStatusExpanded}
                              aria-label={`${isStatusExpanded ? 'Collapse' : 'Expand'} ${statusGroup.status} assignments`}
                            >
                              <div 
                                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                                style={{ backgroundColor: STATUS_COLORS[statusGroup.status as keyof typeof STATUS_COLORS] || '#6b7280' }}
                              />
                                  <span className="capitalize">{statusGroup.status}</span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({statusGroup.assignmentCount} assignments)
                                  </span>
                            </button>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 text-right">
                            {formatPoints(statusGroup.totalEarned)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 text-right">
                            {formatPoints(statusGroup.totalPossible)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 text-right">
                            {statusGroup.percentage}
                          </td>
                        </tr>

                        {/* Assignment rows (when status group is expanded) */}
                        {isStatusExpanded && statusGroup.assignments.map((assignment) => (
                          <tr key={assignment.assignmentId} className="bg-gray-10">
                            <td className="px-6 py-2 pl-16 text-sm text-gray-600">
                              <div className="flex items-center">
                                <a
                                  href={assignment.link || (assignment.canvas as { html_url?: string })?.html_url || `https://djusd.instructure.com/courses/${assignment.courseId}/assignments/${assignment.assignmentId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {assignment.canvas?.name || 'Untitled Assignment'}
                                  {assignment.canvas?.due_at && (
                                    <span className="ml-2 text-xs text-gray-400">
                                      (due {formatDue(assignment.canvas.due_at)})
                                    </span>
                                  )}
                                </a>
                              </div>
                            </td>
                            <td className="px-6 py-2 text-sm text-gray-500 text-right">
                              {formatPoints(assignment.meta?.checkpointEarnedPoints)}
                            </td>
                                <td className="px-6 py-2 text-sm text-gray-500 text-right">
                                  {formatPoints(assignment.pointsPossible || (assignment.meta?.pointValue ?? 0))}
                                </td>
                            <td className="px-6 py-2 text-sm text-gray-500 text-right">
                              {formatPercentage(
                                assignment.meta?.checkpointEarnedPoints ?? 0,
                                (assignment.pointsPossible || (assignment.meta?.pointValue ?? 0)) ?? 0
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {progressData.courses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No assignments found</div>
          <div className="text-gray-400 text-sm mt-2">
            This student has no assignments that meet the display criteria.
          </div>
        </div>
      )}
    </div>
  );
}
