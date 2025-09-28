import React, { useState, useEffect } from 'react';
import { ProcessedAssignment, AssignmentStatus } from '../types/canvas';
import { getCoursePreferences } from '../utils/coursePreferences';
import { getPreferredNames } from '../utils/preferredNames';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Status priority mapping for consistent sorting (matching assignmentUtils.ts)
const STATUS_PRIORITY: Record<AssignmentStatus, number> = {
  'Due': 1,
  'Missing': 2,
  'Submitted (Late)': 3,
  'Submitted': 4,
  'Graded': 5,
  'Optional': 6,
  'Closed': 7,
  'Vector': 8,
  'Locked': 9
};

interface ProgressViewProps {
  data: ProcessedAssignment[];
  isLoading?: boolean;
  onNavigateToDetail?: (studentName: string, className: string) => void;
  expandCourseId?: number;
}

interface AssignmentGroup {
  status: string;
  assignments: ProcessedAssignment[];
  totalEarned: number;
  totalPossible: number;
  percentage: number;
}

interface ClassProgress {
  courseId: number;
  className: string;
  shortName: string;
  teacherName: string;
  period: string;
  periodNumber: number;
  totalEarned: number;
  totalPossible: number;
  percentage: number;
  assignmentCount: number;
  statusGroups: AssignmentGroup[];
}

interface StudentProgress {
  studentName: string;
  preferredName: string;
  totalEarned: number;
  totalPossible: number;
  percentage: number;
  assignmentCount: number;
  classes: ClassProgress[];
}

interface ExpandedState {
  students: Set<string>;
  classes: Set<string>;
  statusGroups: Set<string>;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ data, isLoading = false, onNavigateToDetail, expandCourseId }) => {
  const [coursePreferences, setCoursePreferences] = useState<{[courseId: number]: { shortName: string; teacherName: string; period: number }}>({});
  const [preferredNames, setPreferredNames] = useState<{[legalName: string]: string}>({});
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({
    students: new Set(),
    classes: new Set(),
    statusGroups: new Set()
  });

  // No longer need local student filter since we have global filtering

  useEffect(() => {
    const loadData = async () => {
      try {
        const [preferences, names] = await Promise.all([
          getCoursePreferences(),
          getPreferredNames()
        ]);
        setCoursePreferences(preferences);
        setPreferredNames(names);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    // Helper function to get display name for a course
    const getCourseDisplayName = (assignment: ProcessedAssignment): string => {
      const preference = coursePreferences[assignment.courseId];
      return preference?.shortName || assignment.className;
    };

    // Helper function to get teacher display name
    const getTeacherDisplayName = (assignment: ProcessedAssignment): string => {
      const preference = coursePreferences[assignment.courseId];
      return preference?.teacherName || assignment.teacherName;
    };

    // Helper function to get period number (manual entry takes precedence)
    const getPeriodNumber = (assignment: ProcessedAssignment): number => {
      const preference = coursePreferences[assignment.courseId];
      return preference?.period || parseInt(assignment.classPeriod) || 999;
    };

    // Filter assignments: include all graded and submitted assignments (regardless of due date),
    // but exclude unsubmitted assignments with no due date and exclude Vector assignments
    const includedAssignments = data.filter(assignment => {
      // Exclude Vector assignments (NTN grade vectors)
      if (assignment.status === 'Vector') return false;
      
      // Include if it's graded (regardless of due date)
      if (assignment.status === 'Graded') return true;
      
      // Include if it's submitted (regardless of due date)
      if (assignment.status === 'Submitted' || assignment.status === 'Submitted (Late)') return true;
      
      // Include if it's missing but has a due date (past due)
      if (assignment.status === 'Missing' && assignment.dateDue) {
        const dueDate = new Date(assignment.dateDue);
        const now = new Date();
        return dueDate <= now;
      }
      
      // Exclude everything else (unsubmitted assignments with no due date, etc.)
      return false;
    });

    // Group by student
    const studentMap = new Map<string, StudentProgress>();
    
    includedAssignments.forEach(assignment => {
      const studentName = preferredNames[assignment.studentName] || assignment.studentName;
      
      if (!studentMap.has(studentName)) {
        studentMap.set(studentName, {
          studentName: assignment.studentName,
          preferredName: studentName,
          totalEarned: 0,
          totalPossible: 0,
          percentage: 0,
          assignmentCount: 0,
          classes: []
        });
      }
      
      const student = studentMap.get(studentName)!;
      student.assignmentCount++;
      
      // Find or create class
      let classProgress = student.classes.find(c => c.courseId === assignment.courseId);
      
      if (!classProgress) {
        classProgress = {
          courseId: assignment.courseId,
          className: assignment.className,
          shortName: getCourseDisplayName(assignment),
          teacherName: getTeacherDisplayName(assignment),
          period: assignment.classPeriod,
          periodNumber: getPeriodNumber(assignment),
          totalEarned: 0,
          totalPossible: 0,
          percentage: 0,
          assignmentCount: 0,
          statusGroups: []
        };
        student.classes.push(classProgress);
      }
      
      classProgress.assignmentCount++;
      
      // Find or create status group
      let statusGroup = classProgress.statusGroups.find(g => g.status === assignment.status);
      
      if (!statusGroup) {
        statusGroup = {
          status: assignment.status,
          assignments: [],
          totalEarned: 0,
          totalPossible: 0,
          percentage: 0
        };
        classProgress.statusGroups.push(statusGroup);
      }
      
      statusGroup.assignments.push(assignment);
      
      // Add to status group totals
      const pointValue = assignment.pointValue || 0;
      const pointsAwarded = assignment.pointsAwarded || 0;
      
      // Always add to total possible points (including missing assignments)
      statusGroup.totalPossible += pointValue;
      classProgress.totalPossible += pointValue;
      student.totalPossible += pointValue;
      
      // Only add earned points for submitted/graded assignments (not missing)
      if (assignment.status === 'Submitted' || assignment.status === 'Submitted (Late)' || assignment.status === 'Graded') {
        statusGroup.totalEarned += pointsAwarded;
        classProgress.totalEarned += pointsAwarded;
        student.totalEarned += pointsAwarded;
      }
      // Missing assignments contribute 0 earned points (already handled by using 0 for pointsAwarded)
    });

    // Calculate percentages and sort
    studentMap.forEach(student => {
      student.classes.sort((a, b) => a.periodNumber - b.periodNumber);
      
      student.classes.forEach(classProgress => {
        classProgress.statusGroups.sort((a, b) => {
          const priorityA = STATUS_PRIORITY[a.status as AssignmentStatus] || 999;
          const priorityB = STATUS_PRIORITY[b.status as AssignmentStatus] || 999;
          return priorityA - priorityB;
        });
        
        classProgress.statusGroups.forEach(statusGroup => {
          if (statusGroup.totalPossible > 0) {
            statusGroup.percentage = (statusGroup.totalEarned / statusGroup.totalPossible) * 100;
          }
        });
        
        if (classProgress.totalPossible > 0) {
          classProgress.percentage = (classProgress.totalEarned / classProgress.totalPossible) * 100;
        }
      });
      
      if (student.totalPossible > 0) {
        student.percentage = (student.totalEarned / student.totalPossible) * 100;
      }
    });

    const sortedStudents = Array.from(studentMap.values()).sort((a, b) => 
      a.preferredName.localeCompare(b.preferredName)
    );

    setProgressData(sortedStudents);
  }, [data, coursePreferences, preferredNames]);

  // Auto-expand course when expandCourseId is provided
  useEffect(() => {
    if (expandCourseId && progressData.length > 0) {
      const student = progressData[0]; // Assuming single student view
      const course = student?.classes.find(c => c.courseId === expandCourseId);
      if (course) {
        const key = `${student.studentName}-${expandCourseId}`;
        setExpanded(prev => {
          const newClasses = new Set(prev.classes);
          newClasses.add(key);
          return {
            ...prev,
            classes: newClasses
          };
        });
      }
    }
  }, [expandCourseId, progressData]);

  const formatPercentage = (percentage: number): string => {
    return `${Math.round(percentage)}%`;
  };


  const toggleClass = (studentName: string, courseId: number) => {
    const key = `${studentName}-${courseId}`;
    const newExpanded = { ...expanded };
    if (newExpanded.classes.has(key)) {
      newExpanded.classes.delete(key);
      // Also collapse all status groups for this class
      const classProgress = progressData.find(s => s.studentName === studentName)?.classes.find(c => c.courseId === courseId);
      classProgress?.statusGroups.forEach(statusGroup => {
        newExpanded.statusGroups.delete(`${key}-${statusGroup.status}`);
      });
    } else {
      newExpanded.classes.add(key);
    }
    setExpanded(newExpanded);
  };

  const toggleStatusGroup = (studentName: string, courseId: number, status: string) => {
    const key = `${studentName}-${courseId}-${status}`;
    const newExpanded = { ...expanded };
    if (newExpanded.statusGroups.has(key)) {
      newExpanded.statusGroups.delete(key);
    } else {
      newExpanded.statusGroups.add(key);
    }
    setExpanded(newExpanded);
  };

  const navigateToDetailWithCourseFilter = (courseId: number) => {
    if (onNavigateToDetail) {
      // Find the course name to filter by
      const course = progressData
        .flatMap(student => student.classes)
        .find(classProgress => classProgress.courseId === courseId);
      
      if (course) {
        // We need a student name, but we don't know which one, so we'll use empty string
        // The Detail view should filter by course name only
        onNavigateToDetail('', course.className);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading progress data...</span>
      </div>
    );
  }

  if (progressData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No progress data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Class Name
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assignment Count
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Points Graded
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Points Possible
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Graded %
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {progressData.map((student) => (
            <React.Fragment key={student.studentName}>
              {/* Class Rows - Start directly here */}
              {student.classes.map((classProgress) => (
                <React.Fragment key={`${student.studentName}-${classProgress.courseId}`}>
                  <tr 
                    className="bg-blue-50 hover:bg-blue-100 cursor-pointer border-b-2 border-blue-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleClass(student.studentName, classProgress.courseId);
                    }}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      <div className="flex items-center">
                        {expanded.classes.has(`${student.studentName}-${classProgress.courseId}`) ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        <button
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToDetailWithCourseFilter(classProgress.courseId);
                          }}
                        >
                          {classProgress.shortName}
                        </button>
                        <span className="text-gray-500 ml-2">(P-{classProgress.periodNumber})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {classProgress.assignmentCount}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {classProgress.totalEarned}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {classProgress.totalPossible}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatPercentage(classProgress.percentage)}
                    </td>
                  </tr>

                  {/* Status Group Header - Only show if class is expanded */}

                  {/* Status Group Rows - Only show if class is expanded */}
                  {expanded.classes.has(`${student.studentName}-${classProgress.courseId}`) && classProgress.statusGroups.map((statusGroup) => (
                    <React.Fragment key={`${student.studentName}-${classProgress.courseId}-${statusGroup.status}`}>
                      <tr 
                        className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatusGroup(student.studentName, classProgress.courseId, statusGroup.status);
                        }}
                      >
                        <td className="px-8 py-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            {expanded.statusGroups.has(`${student.studentName}-${classProgress.courseId}-${statusGroup.status}`) ? (
                              <ChevronDown className="h-4 w-4 mr-2" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mr-2" />
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusGroup.status === 'Missing' 
                                ? 'bg-red-100 text-red-800'
                                : statusGroup.status === 'Submitted (Late)'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {statusGroup.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-2 text-sm text-gray-600 text-right">
                          {statusGroup.assignments.length}
                        </td>
                        <td className="px-8 py-2 text-sm text-gray-600 text-right">
                          {statusGroup.totalEarned}
                        </td>
                        <td className="px-8 py-2 text-sm text-gray-600 text-right">
                          {statusGroup.totalPossible}
                        </td>
                        <td className="px-8 py-2 text-sm text-gray-600 text-right">
                          {formatPercentage(statusGroup.percentage)}
                        </td>
                      </tr>

                      {/* Individual Assignment Rows - Only show if status group is expanded */}
                      {expanded.statusGroups.has(`${student.studentName}-${classProgress.courseId}-${statusGroup.status}`) && statusGroup.assignments.map((assignment) => (
                        <tr key={assignment.assignmentId} className="bg-white hover:bg-gray-50">
                              <td className="px-12 py-2 text-sm text-gray-600">
                                <a
                                  href={assignment.canvasDeepLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {assignment.assignmentTitle}
                                  {assignment.dateDue ? (
                                    <span className="text-gray-500 font-normal"> (due {new Date(assignment.dateDue).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })})</span>
                                  ) : (
                                    <span className="text-gray-500 font-normal"> (no due date)</span>
                                  )}
                                </a>
                              </td>
                          <td className="px-4 py-2 text-sm text-gray-600 text-right">
                            {/* No assignment count for individual assignments */}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 text-right">
                            {assignment.status === 'Missing' ? '-' : (assignment.pointsAwarded || 0)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 text-right">
                            {assignment.pointValue}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 text-right">
                            {assignment.status === 'Missing' ? '-' : formatPercentage(((assignment.pointsAwarded || 0) / (assignment.pointValue || 1)) * 100)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
        </div>
      </div>
    </div>
  );
};