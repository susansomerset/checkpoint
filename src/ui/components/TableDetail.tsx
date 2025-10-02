'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DetailModal } from './DetailModal';

interface DetailRow {
  studentId: string;
  studentPreferredName: string;
  courseId: string;
  courseShortName: string;
  coursePeriod: string;
  teacherName: string;
  assignmentId: string;
  assignmentName: string;
  assignmentUrl: string;
  checkpointStatus: string;
  pointsPossible?: number;
  pointsGraded: number;
  gradePct?: number;
  dueAtISO?: string;
  submittedAtISO?: string;
  gradedAtISO?: string;
  dueAtDisplay?: string;
  submittedAtDisplay?: string;
  gradedAtDisplay?: string;
}

interface TableDetailProps {
  baseHeaders: string[];
  rows: DetailRow[];
  selectedStudentId: string;
  initialSort?: { by: string; dir: 'asc' | 'desc' };
}

type SortDir = 'asc' | 'desc';

interface SortState {
  by: string;
  dir: SortDir;
}

interface CourseOption {
  courseId: string;
  label: string;
}

const SORTABLE_HEADERS = [
  'Student',
  'Course',
  'Teacher',
  'Assignment',
  'Status',
  'Points',
  'Grade',
  '%',
  'Due',
  'Turned in',
  'Graded on',
];

export function TableDetail({
  baseHeaders,
  rows,
  selectedStudentId,
  initialSort,
}: TableDetailProps) {
  // Validate baseHeaders at runtime
  if (baseHeaders.length !== 11) {
    console.warn(
      `TableDetail: baseHeaders.length is ${baseHeaders.length}, expected 11`
    );
  }

  // Derive display headers (baseHeaders + Actions)
  const headers = useMemo(() => [...baseHeaders, 'Actions'], [baseHeaders]);

  // Local state
  const [selectedCourseId, setSelectedCourseId] = useState<string>(''); // single value, empty = all
  const [selectedStatus, setSelectedStatus] = useState<string>(''); // single value, empty = all
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortState>(
    initialSort || { by: 'Due', dir: 'asc' }
  );
  const [modalRow, setModalRow] = useState<{
    studentId: string;
    courseId: string;
    assignmentId: string;
  } | null>(null);

  // Reset filters when selectedStudentId changes
  useEffect(() => {
    setSelectedCourseId('');
    setSelectedStatus('');
    setQ('');
    setSort(initialSort || { by: 'Due', dir: 'asc' });
    setModalRow(null);
  }, [selectedStudentId, initialSort]);

  // Derive course options
  const courseOptions = useMemo(() => {
    const uniqueCourses = new Map<string, CourseOption & { period: string }>();
    for (const row of rows) {
      if (!uniqueCourses.has(row.courseId)) {
        uniqueCourses.set(row.courseId, {
          courseId: row.courseId,
          label: `${row.courseShortName} (${row.teacherName})`,
          period: row.coursePeriod,
        });
      }
    }
    // Sort by period first, then by label
    return Array.from(uniqueCourses.values()).sort((a, b) => {
      const periodCmp = a.period.localeCompare(b.period);
      if (periodCmp !== 0) return periodCmp;
      return a.label.localeCompare(b.label);
    });
  }, [rows]);

  // Derive status options
  const statusOptions = useMemo(() => {
    const uniqueStatuses = new Set<string>();
    for (const row of rows) {
      if (row.checkpointStatus) {
        uniqueStatuses.add(row.checkpointStatus);
      }
    }
    return Array.from(uniqueStatuses).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // Filter and sort rows
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Course filter
    if (selectedCourseId) {
      result = result.filter((row) => row.courseId === selectedCourseId);
    }

    // Status filter
    if (selectedStatus) {
      result = result.filter((row) => row.checkpointStatus === selectedStatus);
    }

    // Keyword filter (tokenize by whitespace, AND logic)
    if (q.trim()) {
      const tokens = q
        .trim()
        .toLowerCase()
        .split(/\s+/);
      result = result.filter((row) => {
        // Coerce numeric fields to strings once
        const pointsPossibleStr = row.pointsPossible?.toString() || '';
        const pointsGradedStr = row.pointsGraded.toString();
        const gradePctStr = row.gradePct?.toString() || '';

        const searchableText = [
          row.assignmentName,
          row.courseShortName,
          row.teacherName,
          row.checkpointStatus,
          row.studentPreferredName,
          row.dueAtDisplay || '',
          row.submittedAtDisplay || '',
          row.gradedAtDisplay || '',
          row.dueAtISO || '',
          row.submittedAtISO || '',
          row.gradedAtISO || '',
          row.studentId,
          row.courseId,
          row.assignmentId,
          pointsPossibleStr,
          pointsGradedStr,
          gradePctStr,
        ]
          .join(' ')
          .toLowerCase();

        return tokens.every((token) => searchableText.includes(token));
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;

      switch (sort.by) {
        case 'Student':
          cmp = a.studentPreferredName.localeCompare(b.studentPreferredName);
          break;
        case 'Course':
          cmp = a.courseShortName.localeCompare(b.courseShortName);
          break;
        case 'Teacher':
          cmp = a.teacherName.localeCompare(b.teacherName);
          break;
        case 'Assignment':
          cmp = a.assignmentName.localeCompare(b.assignmentName);
          break;
        case 'Status':
          cmp = a.checkpointStatus.localeCompare(b.checkpointStatus);
          break;
        case 'Points':
          cmp = compareNumeric(a.pointsPossible, b.pointsPossible, sort.dir);
          break;
        case 'Grade':
          cmp = compareNumeric(a.pointsGraded, b.pointsGraded, sort.dir);
          break;
        case '%':
          cmp = compareNumeric(a.gradePct, b.gradePct, sort.dir);
          break;
        case 'Due':
          cmp = compareDate(a.dueAtISO, b.dueAtISO, sort.dir);
          break;
        case 'Turned in':
          cmp = compareDate(a.submittedAtISO, b.submittedAtISO, sort.dir);
          break;
        case 'Graded on':
          cmp = compareDate(a.gradedAtISO, b.gradedAtISO, sort.dir);
          break;
      }

      return sort.dir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [rows, selectedCourseId, selectedStatus, q, sort]);

  // Handle header click (toggle sort)
  const handleHeaderClick = (header: string) => {
    // Actions column is not sortable
    if (header === 'Actions' || !SORTABLE_HEADERS.includes(header)) {
      return;
    }

    if (sort.by === header) {
      // Toggle direction
      setSort({ by: header, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      // New column, default to asc
      setSort({ by: header, dir: 'asc' });
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCourseId('');
    setSelectedStatus('');
    setQ('');
  };

  const hasActiveFilters =
    selectedCourseId || selectedStatus || q.trim();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Course filter */}
        <div className="text-sm">
          <label className="font-medium text-gray-900">
            Course<br />
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="border rounded px-2 py-1 text-sm text-gray-900 min-w-[250px]"
          >
            <option value="">All Courses</option>
            {courseOptions.map((option) => (
              <option key={option.courseId} value={option.courseId}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="text-sm">
          <label className="font-medium text-gray-900">
            Status<br />
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border rounded px-2 py-1 text-sm text-gray-900 min-w-[150px]"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Keyword search */}
        <div className="flex-1 min-w-[200px] text-sm">
          <label className="font-medium text-gray-900">
            Search<br />
          </label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search assignments, courses, teachers, IDs…"
            className="border rounded px-2 py-1 text-sm text-gray-900 w-full placeholder-gray-500"
          />
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <div>
            <button
              onClick={handleClearFilters}
              className="border rounded px-3 py-1 text-sm text-gray-900 hover:bg-gray-100"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Row count */}
      <div className="text-sm text-gray-600" style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>
        Showing {filteredAndSortedRows.length} of {rows.length} assignments
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ marginTop: '0.25rem' }}>
        <table className="min-w-full border-collapse border">
          <caption className="sr-only">
            Detail view: {rows.length} total assignments for {selectedStudentId}
          </caption>
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {headers.map((header) => {
                const isSortable =
                  header !== 'Actions' && SORTABLE_HEADERS.includes(header);
                const isActive = sort.by === header;
                const ariaSort = isActive
                  ? sort.dir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined;

                // Determine if column should be center-aligned (numeric/date columns)
                const isNumericOrDate = [
                  'Points',
                  'Grade',
                  '%',
                  'Due',
                  'Turned in',
                  'Graded on',
                ].includes(header);
                const alignClass = isNumericOrDate ? 'text-center' : 'text-left';

                return (
                  <th
                    key={header}
                    scope="col"
                    aria-sort={ariaSort}
                    onClick={() => isSortable && handleHeaderClick(header)}
                    className={`border px-2 py-2 ${alignClass} text-sm font-semibold text-gray-900 ${
                      isSortable ? 'cursor-pointer hover:bg-gray-200' : ''
                    }`}
                  >
                    {header}
                    {isActive && (
                      <span className="ml-1">
                        {sort.dir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="border px-2 py-4 text-center text-gray-500">
                  {hasActiveFilters
                    ? 'No assignments match your filters.'
                    : 'No assignments found.'}
                </td>
              </tr>
            )}
            {filteredAndSortedRows.map((row) => {
              const rowKey = `${row.studentId}:${row.courseId}:${row.assignmentId}`;

              // Format Points cell (only show pointsPossible)
              const pointsDisplay = row.pointsPossible !== undefined
                ? row.pointsPossible.toString()
                : '-';

              // Format Grade cell
              const gradeDisplay =
                row.pointsGraded !== undefined
                  ? row.pointsGraded.toString()
                  : '-';

              // Format % cell (rounded to integer)
              const pctDisplay =
                row.gradePct !== undefined
                  ? `${Math.round(row.gradePct)}%`
                  : '-';

              // Validate assignmentUrl
              let isValidUrl = false;
              try {
                const url = new URL(row.assignmentUrl);
                isValidUrl =
                  url.protocol === 'http:' || url.protocol === 'https:';
              } catch {
                isValidUrl = false;
              }

              return (
                <tr key={rowKey}>
                  <td className="border px-2 py-1 text-sm text-gray-900">
                    {row.studentPreferredName}
                  </td>
                  <td className="border px-2 py-1 text-sm text-gray-900">
                    {row.courseShortName}
                  </td>
                  <td className="border px-2 py-1 text-sm text-gray-900">
                    {row.teacherName}
                  </td>
                  <td className="border px-2 py-1 text-sm text-gray-900">
                    {isValidUrl ? (
                      <a
                        href={row.assignmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {row.assignmentName}
                      </a>
                    ) : (
                      row.assignmentName
                    )}
                  </td>
                  <td className="border px-2 py-1 text-sm text-gray-900">
                    {row.checkpointStatus}
                  </td>
                  <td className="border px-2 py-1 text-sm text-gray-900 text-center">{pointsDisplay}</td>
                  <td className="border px-2 py-1 text-sm text-gray-900 text-center">{gradeDisplay}</td>
                  <td className="border px-2 py-1 text-sm text-gray-900 text-center">{pctDisplay}</td>
                  <td className="border px-2 py-1 text-sm text-gray-900 text-center">
                    {row.dueAtDisplay || '-'}
                  </td>
                  <td className="border px-2 py-1 text-sm text-gray-900 text-center">
                    {row.submittedAtDisplay || '-'}
                  </td>
                  <td className="border px-2 py-1 text-sm text-gray-900 text-center">
                    {row.gradedAtDisplay || '-'}
                  </td>
                  <td className="border px-2 py-1 text-sm text-center">
                    <button
                      onClick={() =>
                        setModalRow({
                          studentId: row.studentId,
                          courseId: row.courseId,
                          assignmentId: row.assignmentId,
                        })
                      }
                      aria-label={`View details for ${row.assignmentName}`}
                      className="hover:bg-gray-100 rounded px-2 py-1"
                    >
                      🔍
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <DetailModal
        row={modalRow}
        isOpen={!!modalRow}
        onClose={() => setModalRow(null)}
      />
    </div>
  );
}

// Helper: compare numeric values with undefined handling
function compareNumeric(
  a: number | undefined,
  b: number | undefined,
  dir: SortDir
): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return dir === 'asc' ? 1 : -1; // undefined last on asc, first on desc
  if (b === undefined) return dir === 'asc' ? -1 : 1;
  return a - b;
}

// Helper: compare date strings with undefined handling
function compareDate(
  a: string | undefined,
  b: string | undefined,
  dir: SortDir
): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return dir === 'asc' ? 1 : -1; // undefined last on asc, first on desc
  if (b === undefined) return dir === 'asc' ? -1 : 1;
  return a.localeCompare(b);
}

