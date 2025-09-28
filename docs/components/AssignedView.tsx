import React from 'react';
import { ProcessedAssignment, AssignmentStatus } from '../types/canvas';
import { getCoursePreferences } from '../utils/coursePreferences';

interface AssignedViewProps {
  data: ProcessedAssignment[];
  isLoading: boolean;
  onNavigateToDetail: (studentName: string, className: string) => void;
}

interface AssignmentByDay {
  [key: string]: ProcessedAssignment[];
}

interface StudentData {
  name: string;
  classes: {
    [className: string]: {
      courseId: number;
      assignments: AssignmentByDay;
    };
  };
}

const DAYS = ['Prior weeks', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Next Week', 'No Due Date'];

export function AssignedView({ data, isLoading, onNavigateToDetail }: AssignedViewProps) {
  const [coursePreferences, setCoursePreferences] = React.useState<{[courseId: number]: { shortName: string; teacherName: string; period: number }}>({});

  // Load course preferences on component mount
  React.useEffect(() => {
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

  // Helper function to get display name for a course
  const getCourseDisplayName = (assignment: ProcessedAssignment): string => {
    const preference = coursePreferences[assignment.courseId];
    return preference?.shortName || assignment.className;
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading assignments...</div>
      </div>
    );
  }

  // Group assignments by student and class
  const studentData: { [studentName: string]: StudentData } = {};
  
  // Debug: Log all assignments to understand the data - CACHE BUST TEST
  
  data.forEach(assignment => {
    // Debug logging for all assignments to see the pattern
    if (assignment.assignmentTitle && assignment.assignmentTitle.toLowerCase().includes('poe')) {
      console.log('Poe-related assignment:', {
        id: assignment.assignmentId,
        title: assignment.assignmentTitle,
        dueDate: assignment.dateDue,
        status: assignment.status
      });
    }
    
    // Skip optional assignments (zero-point assignments) - they won't appear in the view
    if ((assignment.status as AssignmentStatus) === 'Optional') {
      return; // Skip this assignment entirely
    }
    
    if (!studentData[assignment.studentName]) {
      studentData[assignment.studentName] = {
        name: assignment.studentName,
        classes: {}
      };
    }
    
    if (!studentData[assignment.studentName].classes[assignment.className]) {
      studentData[assignment.studentName].classes[assignment.className] = {
        courseId: assignment.courseId,
        assignments: {
          'Prior weeks': [],
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          'Next Week': [],
          'No Due Date': []
        }
      };
    }
    
    // Determine which day column this assignment belongs in
    let dayColumn = 'No Due Date';
    
    if (assignment.dateDue) {
      // Canvas dates are in UTC but represent Pacific time due dates
      const dueDateUTC = new Date(assignment.dateDue);
      
      // Manual timezone conversion: Canvas stores 11:59 PM Pacific as 6:59 AM UTC next day (PDT) or 7:59 AM UTC next day (PST)
      // We need to subtract the timezone offset to get the actual Pacific date
      
      // Check if this is a year issue - Canvas portal shows 2024 but API returns 2025
      // If the due date is in 2025 but we're in 2024, adjust it back
      const currentYear = new Date().getFullYear();
      if (dueDateUTC.getFullYear() > currentYear) {
        dueDateUTC.setFullYear(currentYear);
      }
      
      // Canvas stores due dates in UTC, but they represent Pacific time
      // For example: 2025-09-13T06:59:59.000Z = Friday 9/12 at 11:59 PM Pacific
      // We need to convert UTC to Pacific time by subtracting the timezone offset
      // Pacific time is UTC-8 (or UTC-7 during DST)
      const pacificOffset = -8 * 60 * 60 * 1000; // 8 hours in milliseconds
      const dueDatePacific = new Date(dueDateUTC.getTime() + pacificOffset);
      
      const today = new Date();
      
      // Use Pacific timezone for consistent date calculations
      const pacificToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
      
      // Get the current day of week (0=Sunday, 1=Monday, etc.)
      const currentDayOfWeek = pacificToday.getDay();
      
      // Find the reference Monday based on the same logic as header dates:
      // If it's Saturday (6) or Sunday (0), use NEXT Monday
      // Otherwise, use the Monday of the CURRENT week
      let referenceMonday;
      if (currentDayOfWeek === 0 || currentDayOfWeek === 6) { // Saturday or Sunday
        // Go to NEXT Monday
        const daysUntilNextMonday = currentDayOfWeek === 0 ? 1 : 2; // Sunday: 1 day, Saturday: 2 days
        referenceMonday = new Date(pacificToday.getTime() + (daysUntilNextMonday * 24 * 60 * 60 * 1000));
      } else {
        // Use Monday of CURRENT week
        const daysBackToMonday = currentDayOfWeek - 1;
        referenceMonday = new Date(pacificToday.getTime() - (daysBackToMonday * 24 * 60 * 60 * 1000));
      }
      referenceMonday.setHours(0, 0, 0, 0);
      
      // Use reference Monday as start of this week
      const startOfThisWeek = referenceMonday;
      
      
      // Calculate the start of next week (Monday)
      const startOfNextWeek = new Date(startOfThisWeek);
      startOfNextWeek.setDate(startOfThisWeek.getDate() + 7);
      
      // Calculate the end of next week (Sunday)
      const endOfNextWeek = new Date(startOfNextWeek);
      endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
      endOfNextWeek.setHours(23, 59, 59, 999);
      
      if (dueDatePacific >= startOfThisWeek && dueDatePacific < startOfNextWeek) {
        // This week - put in the specific day (regardless of status)
        const dayOfWeek = dueDatePacific.getDay();
        
        // Handle weekend assignments differently - no Saturday/Sunday columns
        if (dayOfWeek === 0) { // Sunday
          dayColumn = 'Next Week'; // Move Sunday assignments to Next Week
        } else if (dayOfWeek === 6) { // Saturday
          dayColumn = 'Next Week'; // Move all Saturday assignments to Next Week
        } else {
          // Weekday assignments (Mon-Fri)
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          dayColumn = dayNames[dayOfWeek];
        }
      } else if (dueDatePacific >= startOfNextWeek && dueDatePacific <= endOfNextWeek) {
        // Next week
        dayColumn = 'Next Week';
      } else if (dueDatePacific < startOfThisWeek && assignment.status === 'Missing') {
        // Prior weeks - only show missing assignments
        dayColumn = 'Prior weeks';
      } else {
        // Beyond next week or completed assignments from prior weeks - exclude from view
        return; // Skip this assignment
      }
    } else {
      // No due date - check if it's optional
      if ((assignment.status as AssignmentStatus) === 'Optional') {
        // Skip optional assignments - they won't appear in the view
        return;
      } else {
        // No due date but has points - show in No Due Date column
        dayColumn = 'No Due Date';
      }
    }
    
    // Calculate isActuallyYesterday for consistent styling
    let isActuallyYesterday = false;
    if (assignment.dateDue) {
      // Convert due date from UTC to Pacific time (same logic as assignment categorization)
      const dueDateUTC = new Date(assignment.dateDue);
      const pacificOffset = -8 * 60 * 60 * 1000; // 8 hours in milliseconds
      const dueDatePacific = new Date(dueDateUTC.getTime() + pacificOffset);
      
      const today = new Date();
      const pacificToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
      
      // Get the previous weekday based on current day
      let previousWeekday: Date;
      const currentDayOfWeek = pacificToday.getDay();
      
      if (currentDayOfWeek === 1) { // Monday - previous weekday is Friday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 3);
      } else if (currentDayOfWeek === 2) { // Tuesday - previous weekday is Monday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 1);
      } else if (currentDayOfWeek === 3) { // Wednesday - previous weekday is Tuesday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 1);
      } else if (currentDayOfWeek === 4) { // Thursday - previous weekday is Wednesday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 1);
      } else if (currentDayOfWeek === 5) { // Friday - previous weekday is Thursday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 1);
      } else if (currentDayOfWeek === 6) { // Saturday - previous weekday is Friday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 1);
      } else { // Sunday - previous weekday is Friday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 2);
      }
      
      // Normalize times for comparison
      previousWeekday.setHours(0, 0, 0, 0);
      dueDatePacific.setHours(0, 0, 0, 0);
      // Check if due date is on or after the previous weekday (due today or yesterday)
      isActuallyYesterday = dueDatePacific.getTime() >= previousWeekday.getTime();
    }

    // Add the isActuallyYesterday flag to the assignment for consistent styling
    const assignmentWithFlags = {
      ...assignment,
      isActuallyYesterday
    };
    
    studentData[assignment.studentName].classes[assignment.className].assignments[dayColumn].push(assignmentWithFlags);
  });

  // Sort assignments by due date within each column and calculate totals
  Object.values(studentData).forEach(student => {
    Object.values(student.classes).forEach(classData => {
      DAYS.forEach(day => {
        if (classData.assignments[day].length > 0) {
          // Sort by due date (oldest to newest)
          classData.assignments[day].sort((a, b) => {
            // Handle null due dates
            if (!a.dateDue && !b.dateDue) return 0;
            if (!a.dateDue) return 1; // Put null dates at end
            if (!b.dateDue) return -1;
            
            const dateA = new Date(a.dateDue);
            const dateB = new Date(b.dateDue);
            return dateA.getTime() - dateB.getTime(); // Oldest first
          });
        }
      });
    });
  });

  // Get current day for highlighting (using Pacific time)
  const today = new Date();
  const pacificToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pacificToday.getDay()];
  // If it's weekend, highlight Monday instead. Only highlight if it's a weekday column.
  const highlightDay = (pacificToday.getDay() === 0 || pacificToday.getDay() === 6) ? 'Monday' : 
                      (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(currentDay)) ? currentDay : 'Monday';

  const createNoDueDateSummary = (assignments: ProcessedAssignment[], studentName: string, className: string) => {
    if (assignments.length === 0) return null;
    
    const totalPoints = assignments.reduce((sum, assignment) => sum + (assignment.pointValue || 0), 0);
    
    return (
      <div className="text-xs leading-tight">
        <button
          onClick={() => onNavigateToDetail(studentName, className)}
          className="text-blue-600 hover:text-blue-800 underline hover:no-underline font-medium"
        >
          {assignments.length} due ({totalPoints} points)
        </button>
      </div>
    );
  };


  const formatAssignment = (assignment: ProcessedAssignment, allAssignments: ProcessedAssignment[], dayColumn: string) => {
    const title = assignment.assignmentTitle; // Use full assignment title
    const points = assignment.pointValue ? `(${assignment.pointValue})` : '';
    const isCompleted = assignment.status === 'Graded' || assignment.status === 'Submitted' || assignment.status === 'Submitted (Late)';
    const isOverdue = assignment.status === 'Missing';
    const isOptional = assignment.status === 'Optional';
    
    // Check if this is a "day before" assignment (due on previous weekday)
    // This now applies to assignments in day columns, not just "Late"
    const isDayBefore = dayColumn !== 'Prior weeks' && dayColumn !== 'Next Week' && dayColumn !== 'No Due Date' && assignment.dateDue && assignment.status === 'Missing';
    let isActuallyYesterday = false;
    if (isDayBefore && assignment.dateDue) {
      // Convert due date from UTC to Pacific time (same logic as assignment categorization)
      const dueDateUTC = new Date(assignment.dateDue);
      const pacificOffset = -8 * 60 * 60 * 1000; // 8 hours in milliseconds
      const dueDatePacific = new Date(dueDateUTC.getTime() + pacificOffset);
      
      const today = new Date();
      const pacificToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
      
      // Get the previous weekday based on current day
      let previousWeekday: Date;
      const currentDayOfWeek = pacificToday.getDay();
      
      if (currentDayOfWeek === 1) { // Monday - previous weekday is Friday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 3);
      } else if (currentDayOfWeek === 2) { // Tuesday - previous weekday is Monday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 1);
      } else if (currentDayOfWeek === 3) { // Wednesday - previous weekday is Tuesday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 1);
      } else if (currentDayOfWeek === 4) { // Thursday - previous weekday is Wednesday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 1);
      } else if (currentDayOfWeek === 5) { // Friday - previous weekday is Thursday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 1);
      } else if (currentDayOfWeek === 6) { // Saturday - previous weekday is Friday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 1);
      } else { // Sunday - previous weekday is Friday
        previousWeekday = new Date(pacificToday);
        previousWeekday.setDate(pacificToday.getDate() - 2);
      }
      
      // Normalize times for comparison
      previousWeekday.setHours(0, 0, 0, 0);
      dueDatePacific.setHours(0, 0, 0, 0);
      // Check if due date is on or after the previous weekday (due today or yesterday)
      isActuallyYesterday = dueDatePacific.getTime() >= previousWeekday.getTime();
      
      // Debug logging for previous weekday logic
      console.log('Previous weekday debug:', {
        currentDayOfWeek,
        pacificToday: pacificToday.toDateString(),
        previousWeekday: previousWeekday.toDateString(),
        dueDatePacific: dueDatePacific.toDateString(),
        isActuallyYesterday,
        assignmentId: assignment.assignmentId,
        assignmentTitle: assignment.assignmentTitle
      });
    }
    
    // Check if there are duplicate assignment names in the same class
    const duplicatesInClass = allAssignments.filter(a => 
      a.className === assignment.className && 
      a.assignmentTitle === assignment.assignmentTitle
    );
    
    let displayTitle = title;
    
    // Add due date for Prior weeks assignments
    if (dayColumn === 'Prior weeks' && assignment.dateDue) {
      const dueDate = new Date(assignment.dateDue);
      const month = dueDate.getMonth() + 1;
      const day = dueDate.getDate();
      displayTitle = `${month}/${day}: ${title}`;
    } else if (dayColumn === 'Next Week' && assignment.dateDue) {
      // Add day prefix for Next Week assignments
      const dueDate = new Date(assignment.dateDue);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayOfWeek = dayNames[dueDate.getDay()];
      displayTitle = `${dayOfWeek}: ${title}`;
    } else if (duplicatesInClass.length > 1) {
      // Add due date to distinguish duplicates
      if (assignment.dateDue) {
        const dueDate = new Date(assignment.dateDue);
        const month = dueDate.getMonth() + 1;
        const day = dueDate.getDate();
        displayTitle = `${title} (${month}/${day})`;
      }
    }
    
    return (
      <div className="text-xs leading-tight">
        <a 
          href={assignment.canvasDeepLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline hover:no-underline ${
            isCompleted ? 'text-green-600' : 
            isOverdue ? 'text-red-600' : 
            isOptional ? 'text-gray-500' : 'text-blue-600'
          } ${
            isOverdue && !assignment.isActuallyYesterday ? 'bg-yellow-200' : ''
          }`}
        >
          {displayTitle} {points}
        </a>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
              Student / Class
            </th>
            {DAYS.map(day => {
              // Calculate the date for weekday columns
              let dateDisplay = '';
              if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)) {
                // Use Pacific timezone for consistent date calculations
                const today = new Date();
                const pacificToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
                
                // Get the current day of week (0=Sunday, 1=Monday, etc.)
                const currentDayOfWeek = pacificToday.getDay();
                
                // Find the reference Monday based on the logic:
                // If it's Saturday (6) or Sunday (0), use NEXT Monday
                // Otherwise, use the Monday of the CURRENT week
                let referenceMonday;
                if (currentDayOfWeek === 0 || currentDayOfWeek === 6) { // Saturday or Sunday
                  // Go to NEXT Monday
                  const daysUntilNextMonday = currentDayOfWeek === 0 ? 1 : 2; // Sunday: 1 day, Saturday: 2 days
                  referenceMonday = new Date(pacificToday.getTime() + (daysUntilNextMonday * 24 * 60 * 60 * 1000));
                } else {
                  // Use Monday of CURRENT week
                  const daysBackToMonday = currentDayOfWeek - 1;
                  referenceMonday = new Date(pacificToday.getTime() - (daysBackToMonday * 24 * 60 * 60 * 1000));
                }
                referenceMonday.setHours(0, 0, 0, 0);
                
                // Calculate the specific date for this day of the week
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const targetDayIndex = dayNames.indexOf(day);
                // For Monday, we want 0 days added to referenceMonday
                // For Tuesday, we want 1 day added, etc.
                const daysToAdd = targetDayIndex - 1; // Monday=1, so 1-1=0 days to add
                const targetDate = new Date(referenceMonday.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
                
                const month = targetDate.getMonth() + 1;
                const dayOfMonth = targetDate.getDate();
                dateDisplay = `(${month}/${dayOfMonth})`;
                
              }
              
              return (
                <th 
                  key={day}
                  className={`border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 ${
                    day === highlightDay ? 'bg-yellow-100' : ''
                  }`}
                >
                  <div>{day}</div>
                  {dateDisplay && <div className="text-xs font-normal text-gray-500">{dateDisplay}</div>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Object.values(studentData).map(student => {
            // Get all assignments for this student (needed for formatAssignment function)
            const studentAssignments = data.filter(a => a.studentName === student.name);
            
            // Calculate status counts for this student across all relevant columns
            const statusCounts = {
              overdue: 0,      // ⚠️ Missing assignments due before previous weekday
              yesterday: 0,    // ❓ Missing assignments due on previous weekday  
              upcoming: 0,     // 👍 Upcoming assignments (not missing, not completed)
              completed: 0     // ✅ Completed assignments
            };
            
            // Count assignments from Prior weeks, Monday-Friday, and Next Week columns
            Object.values(student.classes).forEach(classData => {
              ['Prior weeks', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Next Week'].forEach(day => {
                if (classData.assignments[day]) {
                  classData.assignments[day].forEach(assignment => {
                    const isCompleted = assignment.status === 'Graded' || assignment.status === 'Submitted' || assignment.status === 'Submitted (Late)';
                    const isOverdue = assignment.status === 'Missing';
                    
                    if (isCompleted) {
                      statusCounts.completed++;
                    } else if (isOverdue) {
                      if (assignment.isActuallyYesterday) {
                        statusCounts.yesterday++;
                      } else {
                        statusCounts.overdue++;
                      }
                    } else {
                      statusCounts.upcoming++;
                    }
                  });
                }
              });
            });
            
            // Create status summary string
            const statusSummary = [
              `⚠️: ${statusCounts.overdue}`,
              `❓: ${statusCounts.yesterday}`,
              `👍: ${statusCounts.upcoming}`,
              `✅: ${statusCounts.completed}`
            ].join(' / ');
            
            return (
              <React.Fragment key={student.name}>
              {/* Student header row */}
              <tr className="bg-blue-50">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-blue-800" colSpan={DAYS.length + 1}>
                  {student.name} ({statusSummary})
                </td>
              </tr>
                
                {/* Class rows - sorted by period */}
                {Object.entries(student.classes)
                  .sort(([, classDataA], [, classDataB]) => {
                    const periodA = coursePreferences[classDataA.courseId]?.period || 1;
                    const periodB = coursePreferences[classDataB.courseId]?.period || 1;
                    return periodA - periodB;
                  })
                  .map(([className, classData]) => (
                  <tr key={className}>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">
                      {getCourseDisplayName({ className, courseId: classData.courseId } as ProcessedAssignment)}
                    </td>
                    {DAYS.map(day => (
                    <td 
                      key={day}
                      className={`border border-gray-300 px-2 py-2 ${
                        day === highlightDay ? 'bg-yellow-50' : ''
                      }`}
                    >
                      {day === 'No Due Date' ? (
                        createNoDueDateSummary(classData.assignments[day], student.name, className)
                      ) : (
                        <div className="space-y-1 text-left">
                          {classData.assignments[day].map((assignment, index) => (
                            <div key={index} className="flex items-start">
                              <div className="flex-shrink-0 mr-2 mt-0.5">
                                {(() => {
                                  const isCompleted = assignment.status === 'Graded' || assignment.status === 'Submitted' || assignment.status === 'Submitted (Late)';
                                  const isOverdue = assignment.status === 'Missing';
                                  const isOptional = assignment.status === 'Optional';
                                  
                                  // isActuallyYesterday is now calculated during data processing and stored with the assignment
                                  
                                  if (isCompleted) return <span className="text-green-600">✓</span>;
                                  if (isOverdue && assignment.isActuallyYesterday) return <span className="text-blue-600">❓</span>;
                                  if (isOverdue) return <span className="text-red-600">⚠️</span>;
                                  if (isOptional) return <span className="text-gray-500">○</span>;
                                  return <span className="text-blue-600">👍</span>;
                                })()}
                              </div>
                              <div className="flex-1">
                                {formatAssignment(assignment, studentAssignments, day)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    ))}
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
