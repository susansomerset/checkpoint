import React, { useMemo, useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
  PaginationState,
} from '@tanstack/react-table';
import { ProcessedAssignment } from '../types/canvas';
import { 
  getStatusColor, 
  getDaysDueColor, 
  formatDate, 
  formatDateTime 
} from '../utils/assignmentUtils';
import { getCoursePreferences } from '../utils/coursePreferences';
import { ChevronUp, ChevronDown, ExternalLink, Filter, X } from 'lucide-react';

const columnHelper = createColumnHelper<ProcessedAssignment>();

interface AssignmentTableProps {
  data: ProcessedAssignment[];
  isLoading?: boolean;
  initialFilters?: {
    studentName?: string;
    className?: string;
    status?: string;
    noDueDate?: boolean;
  };
  onFiltersChange?: (filters: {
    studentName?: string;
    className?: string;
    status?: string;
    noDueDate?: boolean;
  }) => void;
}

export const AssignmentTable: React.FC<AssignmentTableProps> = ({ 
  data, 
  isLoading = false,
  initialFilters,
  onFiltersChange
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [coursePreferences, setCoursePreferences] = useState<{[courseId: number]: { shortName: string; teacherName: string }}>({});

  // Load course preferences on component mount
  useEffect(() => {
    const loadCoursePreferences = async () => {
      try {
        const preferences = await getCoursePreferences();
        setCoursePreferences(preferences);
      } catch (error) {
        console.error('Error loading course preferences:', error);
      }
    };
    loadCoursePreferences();
  }, []);

  // Apply initial filters when they change
  useEffect(() => {
    if (initialFilters) {
      const newFilters: ColumnFiltersState = [];
      
      if (initialFilters.studentName) {
        newFilters.push({ id: 'studentName', value: initialFilters.studentName });
      }
      if (initialFilters.className) {
        newFilters.push({ id: 'className', value: initialFilters.className });
      }
      if (initialFilters.status) {
        newFilters.push({ id: 'status', value: initialFilters.status });
      }
      if (initialFilters.noDueDate) {
        newFilters.push({ id: 'dateDue', value: null }); // Filter for null due dates
      }
      
      setColumnFilters(newFilters);
    }
  }, [initialFilters]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('studentName', {
        header: 'Student Name',
        cell: (info) => (
          <div className="font-medium text-gray-900">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('className', {
        header: 'Class Name',
        cell: (info) => {
          const assignment = info.row.original;
          const preference = coursePreferences[assignment.courseId];
          const displayName = preference?.shortName || assignment.className;
          return (
            <div className="text-gray-900">
              {displayName}
            </div>
          );
        },
      }),
      columnHelper.accessor('classPeriod', {
        header: 'Period',
        cell: (info) => (
          <div className="text-sm text-gray-600">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('teacherName', {
        header: 'Teacher',
        cell: (info) => {
          const assignment = info.row.original;
          const preference = coursePreferences[assignment.courseId];
          const displayName = preference?.teacherName || assignment.teacherName;
          return (
            <div className="text-gray-900">
              {displayName}
            </div>
          );
        },
      }),
      columnHelper.accessor('assignmentTitle', {
        header: 'Assignment',
        cell: (info) => (
          <div className="font-medium text-gray-900 max-w-xs truncate">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('pointValue', {
        header: 'Points',
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="text-center">
              {value ? value.toString() : 'N/A'}
            </div>
          );
        },
      }),
      columnHelper.accessor('dateAssigned', {
        header: 'Assigned',
        cell: (info) => (
          <div className="text-sm text-gray-600">
            {formatDate(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('dateDue', {
        header: 'Due Date',
        cell: (info) => (
          <div className="text-sm text-gray-600">
            {formatDate(info.getValue())}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const cellValue = row.getValue(columnId) as string | null;
          if (filterValue === null) {
            // Filter for null values (no due date)
            return cellValue === null;
          }
          // Default string filtering for other cases
          return String(cellValue).includes(String(filterValue));
        },
      }),
      columnHelper.accessor('daysDue', {
        header: 'Days Due',
        cell: (info) => {
          const days = info.getValue();
          if (days === null) {
            return (
              <div className="text-center text-gray-400">
                —
              </div>
            );
          }
          const colorClass = getDaysDueColor(days || 0);
          return (
            <div className={`text-center font-medium ${colorClass}`}>
              {days === 999 ? '∞' : days! > 0 ? `+${days}` : days!.toString()}
            </div>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          const colorClass = getStatusColor(status);
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
              {status}
            </span>
          );
        },
      }),
      columnHelper.accessor('dateSubmitted', {
        header: 'Submitted',
        cell: (info) => {
          const submittedDate = info.getValue();
          return (
            <div className="text-sm text-gray-600">
              {submittedDate ? formatDateTime(submittedDate) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('pointsAwarded', {
        header: 'Score',
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="text-center font-medium">
              {value ? value.toString() : '-'}
            </div>
          );
        },
      }),
      columnHelper.accessor('canvasDeepLink', {
        header: 'Link',
        cell: (info) => (
          <a
            href={info.getValue()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        ),
      }),
    ],
    [coursePreferences]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(data.map(item => item.status)));
    return statuses.sort();
  }, [data]);

  const classOptions = useMemo(() => {
    const classes = Array.from(new Set(data.map(item => item.className)));
    return classes.sort();
  }, [data]);

  const studentOptions = useMemo(() => {
    const students = Array.from(new Set(data.map(item => item.studentName)));
    return students.sort();
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          {/* Global Search */}
          <input
            type="text"
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Status Filter */}
          <select
            value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              table.getColumn('status')?.setFilterValue(value || undefined);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={(table.getColumn('className')?.getFilterValue() as string) ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              table.getColumn('className')?.setFilterValue(value || undefined);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Classes</option>
            {classOptions.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>

          {/* Student Filter */}
          <select
            value={(table.getColumn('studentName')?.getFilterValue() as string) ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              table.getColumn('studentName')?.setFilterValue(value || undefined);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Students</option>
            {studentOptions.map((studentName) => (
              <option key={studentName} value={studentName}>
                {studentName}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(globalFilter || columnFilters.length > 0) && (
            <button
              onClick={() => {
                setGlobalFilter('');
                setColumnFilters([]);
              }}
              className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {table.getFilteredRowModel().rows.length} of {data.length} assignments
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1">
                        <span>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </span>
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            <ChevronUp
                              className={`h-3 w-3 ${
                                header.column.getIsSorted() === 'asc'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`}
                            />
                            <ChevronDown
                              className={`h-3 w-3 -mt-1 ${
                                header.column.getIsSorted() === 'desc'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}
                </span>{' '}
                of{' '}
                <span className="font-medium">
                  {table.getFilteredRowModel().rows.length}
                </span>{' '}
                results
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => table.setPageSize(10)}
                className={`px-3 py-1 text-sm rounded ${
                  table.getState().pagination.pageSize === 10
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                10
              </button>
              <button
                onClick={() => table.setPageSize(25)}
                className={`px-3 py-1 text-sm rounded ${
                  table.getState().pagination.pageSize === 25
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                25
              </button>
              <button
                onClick={() => table.setPageSize(50)}
                className={`px-3 py-1 text-sm rounded ${
                  table.getState().pagination.pageSize === 50
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                50
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};