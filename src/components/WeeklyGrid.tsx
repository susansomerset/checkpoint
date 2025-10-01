/**
 * ui.WeeklyGrid v1.0.1
 * Spec: spec/current.json
 * 
 * WeeklyGrid table view (render-only over processing.getWeeklyGrids)
 * Pure presentation component - no data processing, bucketing, or sorting
 */

'use client';

import React from 'react';
import { getDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Types from processing.getWeeklyGrids
interface AttentionCounts {
  Check: number;
  Thumb: number;
  Question: number;
  Warning: number;
}

interface GridItem {
  id: string;
  title: string;
  url: string;
  attentionType: 'Check' | 'Thumb' | 'Question' | 'Warning' | 'Hand';
}

interface NoDateCell {
  count: number;
  points: number;
  label: string;
  deepLinkUrl: string;
}

interface WeekdayCells {
  Mon: GridItem[];
  Tue: GridItem[];
  Wed: GridItem[];
  Thu: GridItem[];
  Fri: GridItem[];
}

interface CourseCells {
  prior: GridItem[];
  weekday: WeekdayCells;
  next: GridItem[];
  noDate: NoDateCell;
}

interface CourseRow {
  courseId: string;
  courseName: string;
  cells: CourseCells;
  summary: {
    attentionCounts: AttentionCounts;
    totalItems: number;
  };
}

interface WeeklyGridHeader {
  studentHeader: string;
  columns: string[];
  monday: string;
  timezone: string;
}

interface WeeklyGrid {
  header: WeeklyGridHeader;
  rows: CourseRow[];
}

interface StudentWeeklyGrid {
  summary: {
    attentionCounts: AttentionCounts;
    totalItems: number;
  };
  grid: WeeklyGrid;
}

export interface WeeklyGridProps {
  grids: Record<string, StudentWeeklyGrid>;
  selectedStudentId?: string;
}

/**
 * WeeklyGrid component - pure presentation of processing.getWeeklyGrids output
 */
export function WeeklyGrid({ grids, selectedStudentId }: WeeklyGridProps) {
  // Filter students if selectedStudentId provided
  const studentIds = selectedStudentId 
    ? [selectedStudentId] 
    : Object.keys(grids);
  
  // Get first student's grid for header (all students share same header)
  const firstStudentId = studentIds[0];
  if (!firstStudentId || !grids[firstStudentId]) {
    return (
      <div className="p-8 text-center text-gray-500">
        No grid data available
      </div>
    );
  }
  
  const header = grids[firstStudentId].grid.header;
  
  // Determine which column to highlight (today's column)
  const todayColumnIndex = getTodayColumnIndex(header);
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100 sticky top-0">
          {/* Student header row */}
          <tr className="bg-gray-50 border-b-2 border-gray-400">
            <th colSpan={header.columns.length} className="px-4 py-3 text-left font-bold text-lg">
              {header.studentHeader}
            </th>
          </tr>
          {/* Column headers row */}
          <tr>
            {header.columns.map((col, idx) => {
              // Split day columns like "Mon (10/6)" into two lines
              const formattedCol = col.match(/^(Mon|Tue|Wed|Thu|Fri) \((.+)\)$/)
                ? col.replace(/^(Mon|Tue|Wed|Thu|Fri) \((.+)\)$/, '$1<br/>($2)')
                : col;
              
              return (
                <th
                  key={idx}
                  scope="col"
                  className={`border border-gray-300 px-4 py-2 text-center font-semibold ${
                    idx === todayColumnIndex ? 'bg-blue-100 border-blue-400' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: formattedCol }}
                />
              );
            })}
          </tr>
        </thead>
        <tbody>
          {studentIds.map(studentId => {
            const studentGrid = grids[studentId];
            if (!studentGrid) return null;
            
            return (
              <React.Fragment key={studentId}>
                {/* Course rows */}
                {studentGrid.grid.rows.map(row => (
                  <tr key={row.courseId} className="hover:bg-gray-50">
                    {/* Course Name */}
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {row.courseName}
                    </td>
                    
                    {/* Prior Weeks */}
                    <td className="border border-gray-300 px-2 py-2">
                      {renderGridItems(row.cells.prior)}
                    </td>
                    
                    {/* Mon */}
                    <td className="border border-gray-300 px-2 py-2">
                      {renderGridItems(row.cells.weekday.Mon)}
                    </td>
                    
                    {/* Tue */}
                    <td className="border border-gray-300 px-2 py-2">
                      {renderGridItems(row.cells.weekday.Tue)}
                    </td>
                    
                    {/* Wed */}
                    <td className="border border-gray-300 px-2 py-2">
                      {renderGridItems(row.cells.weekday.Wed)}
                    </td>
                    
                    {/* Thu */}
                    <td className="border border-gray-300 px-2 py-2">
                      {renderGridItems(row.cells.weekday.Thu)}
                    </td>
                    
                    {/* Fri */}
                    <td className="border border-gray-300 px-2 py-2">
                      {renderGridItems(row.cells.weekday.Fri)}
                    </td>
                    
                    {/* Next Week */}
                    <td className="border border-gray-300 px-2 py-2">
                      {renderGridItems(row.cells.next)}
                    </td>
                    
                    {/* No Date */}
                    <td className="border border-gray-300 px-2 py-2">
                      {renderNoDate(row.cells.noDate)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Render array of GridItems with icons as bullets and proper text wrapping
 */
function renderGridItems(items: GridItem[]): React.ReactNode {
  if (items.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-1">
      {items.map(item => (
        <div key={item.id} className="flex items-start gap-1">
          {/* Icon as bullet */}
          <span className="flex-shrink-0 mt-0.5">
            {getAttentionTypeIcon(item.attentionType)}
          </span>
          {/* Text with wrapping and indentation */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded flex-1 ${getAttentionTypeStyles(item.attentionType)}`}
          >
            {item.title}
          </a>
        </div>
      ))}
    </div>
  );
}

/**
 * Render No Date cell with label and optional link
 */
function renderNoDate(noDate: NoDateCell): React.ReactNode {
  if (noDate.count === 0) {
    return null;
  }
  
  if (noDate.deepLinkUrl) {
    return (
      <a
        href={noDate.deepLinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
      >
        {noDate.label}
      </a>
    );
  }
  
  return <span className="text-sm text-gray-700">{noDate.label}</span>;
}

/**
 * Get icon prefix for attentionType
 */
function getAttentionTypeIcon(type: string): string {
  switch (type) {
    case 'Check': return '✓';
    case 'Thumb': return '👍';
    case 'Question': return '❓';
    case 'Warning': return '⚠️';
    default: return '';
  }
}

/**
 * Get CSS classes for attentionType styling
 */
function getAttentionTypeStyles(type: string): string {
  switch (type) {
    case 'Check': return 'text-green-600';
    case 'Thumb': return 'text-blue-600';
    case 'Question': return 'text-red-600';
    case 'Warning': return 'text-red-600 bg-yellow-100 px-1 rounded';
    default: return 'text-gray-600';
  }
}

/**
 * Determine which column index should be highlighted for "today"
 * Returns column index (0-8) or -1 if no highlight
 */
function getTodayColumnIndex(header: WeeklyGridHeader): number {
  try {
    const now = new Date();
    const nowInTz = toZonedTime(now, header.timezone);
    const todayWeekday = getDay(nowInTz); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    
    // Weekend (Sat/Sun) → highlight Monday
    if (todayWeekday === 0 || todayWeekday === 6) {
      return 2; // Mon column is index 2 (after "Class Name" and "Prior Weeks")
    }
    
    // Mon = 1 → column 2, Tue = 2 → column 3, etc.
    if (todayWeekday >= 1 && todayWeekday <= 5) {
      return 1 + todayWeekday; // Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
    }
    
    return -1; // No highlight
  } catch {
    return -1; // Error in timezone handling, no highlight
  }
}
