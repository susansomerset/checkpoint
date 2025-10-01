/**
 * processing.getWeeklyGrids v1.0.0
 * Spec: spec/current.json
 * 
 * Build WeeklyGrids for known students (rows per course; Prior | Mon–Fri | Next | No Date)
 */

import { parseISO, startOfWeek, addDays, format, getDay, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { toGridItems, GridItemEntry, GridItem } from '../pure/toGridItems';
import { StudentData, StudentNode, CourseNode, AssignmentNode } from '../student/builder';
import { Assignment as CanvasAssignment } from '../canvas/assignments';

// Input types (matching fixture structure)
interface Assignment {
  id: string;
  name: string;
  points?: number;
  dueAt?: string;
  checkpointStatus: 'Due' | 'Missing' | 'Submitted' | 'Graded';
  url: string;
}

interface Course {
  id: string;
  name: string;
  assignments: Assignment[];
}

interface Student {
  id: string;
  name: string;
  courses: Course[];
}

interface StudentDataInput {
  students: Student[];
}

// Output types (from spec)
interface AttentionCounts {
  Check: number;
  Thumb: number;
  Question: number;
  Warning: number;
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

export interface StudentWeeklyGrid {
  summary: {
    attentionCounts: AttentionCounts;
    totalItems: number;
  };
  grid: WeeklyGrid;
}

export type WeeklyGridsResult = Record<string, StudentWeeklyGrid>;

/**
 * Internal adapter: Convert StudentData to StudentDataInput
 * Extracts data from complex nested structure to simple array structure
 */
function adaptStudentData(studentData: StudentData): StudentDataInput {
  return {
    students: Object.values(studentData.students).map((student: StudentNode) => (({
      id: student.studentId,
      name: student.meta?.preferredName || student.meta?.legalName || student.studentId,
      courses: Object.values(student.courses).map((course: CourseNode) => {
        const canvasCourse = course.canvas as Record<string, unknown>;
        return {
          id: course.courseId,
          name: course.meta?.shortName || (canvasCourse.name as string) || 'Unknown',
          assignments: Object.values(course.assignments).map((assignment: AssignmentNode) => {
            const canvasAssignment = assignment.canvas as unknown as CanvasAssignment;
            return {
              id: assignment.assignmentId,
              name: canvasAssignment.name || 'Untitled',
              points: assignment.pointsPossible,
              dueAt: canvasAssignment.due_at,
              checkpointStatus: assignment.meta.checkpointStatus,
              url: canvasAssignment.html_url || `https://djusd.instructure.com/courses/${course.courseId}/assignments/${assignment.assignmentId}`
            };
          })
        };
      })
    }) as Student))
  };
}

/**
 * Build WeeklyGrids for all students in studentData.
 * Returns an object keyed by studentId for easy lookup.
 */
export function getWeeklyGrids(
  studentData: StudentData,
  asOf: string,
  timezone?: string
): WeeklyGridsResult {
  // Adapt StudentData to expected input format
  const input = adaptStudentData(studentData);
  // Parse asOf in timezone
  const asOfDate = parseISO(asOf);
  const asOfInTz = timezone ? toZonedTime(asOfDate, timezone) : asOfDate;
  
  // Compute Monday of week
  const monday = startOfWeek(asOfInTz, { weekStartsOn: 1 }); // 1 = Monday
  const mondayISO = monday.toISOString();
  
  // Derive weekday labels (shared by all students)
  const weekdayLabels = {
    Mon: `Mon (${format(monday, 'M/d')})`,
    Tue: `Tue (${format(addDays(monday, 1), 'M/d')})`,
    Wed: `Wed (${format(addDays(monday, 2), 'M/d')})`,
    Thu: `Thu (${format(addDays(monday, 3), 'M/d')})`,
    Fri: `Fri (${format(addDays(monday, 4), 'M/d')})`
  };
  
  // Column headers (shared by all students)
  const columns = [
    'Class Name',
    'Prior Weeks',
    weekdayLabels.Mon,
    weekdayLabels.Tue,
    weekdayLabels.Wed,
    weekdayLabels.Thu,
    weekdayLabels.Fri,
    'Next Week',
    'No Date'
  ];
  
  // Process each student and build indexed object
  const result: WeeklyGridsResult = {};
  
  input.students.forEach(student => {
    const rows: CourseRow[] = [];
    let studentAttentionCounts: AttentionCounts = { Check: 0, Thumb: 0, Question: 0, Warning: 0 };
    let studentTotalItems = 0;
    
    // Process each course
    student.courses.forEach(course => {
      const courseRow = buildCourseRow(course, asOf, monday, timezone, student.id);
      rows.push(courseRow);
      
      // Aggregate student-level summary
      studentAttentionCounts = {
        Check: studentAttentionCounts.Check + courseRow.summary.attentionCounts.Check,
        Thumb: studentAttentionCounts.Thumb + courseRow.summary.attentionCounts.Thumb,
        Question: studentAttentionCounts.Question + courseRow.summary.attentionCounts.Question,
        Warning: studentAttentionCounts.Warning + courseRow.summary.attentionCounts.Warning
      };
      studentTotalItems += courseRow.summary.totalItems;
    });
    
    // Format student header string
    const displayName = student.name || student.id;
    const attentionSummary = `⚠️:${studentAttentionCounts.Warning} / ❓:${studentAttentionCounts.Question} / 👍:${studentAttentionCounts.Thumb} / ✅:${studentAttentionCounts.Check}`;
    const studentHeader = `${displayName} — ${attentionSummary}`;
    
    result[student.id] = {
      summary: {
        attentionCounts: studentAttentionCounts,
        totalItems: studentTotalItems
      },
      grid: {
        header: {
          studentHeader,
          columns,
          monday: mondayISO,
          timezone: timezone || 'UTC'
        },
        rows
      }
    };
  });
  
  return result;
}

/**
 * Build a single course row with all buckets and summaries.
 */
function buildCourseRow(
  course: Course,
  asOf: string,
  monday: Date,
  timezone: string | undefined,
  studentId: string
): CourseRow {
  // Define week boundaries
  const weekStart = startOfDay(monday);
  const weekEnd = endOfDay(addDays(monday, 4)); // Friday
  const nextWeekEnd = endOfDay(addDays(monday, 11)); // Next Friday
  
  // Partition assignments into buckets
  const buckets: {
    prior: Assignment[];
    Mon: Assignment[];
    Tue: Assignment[];
    Wed: Assignment[];
    Thu: Assignment[];
    Fri: Assignment[];
    next: Assignment[];
    noDate: Assignment[];
  } = {
    prior: [],
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    next: [],
    noDate: []
  };
  
  course.assignments.forEach(assignment => {
    if (!assignment.dueAt) {
      // No due date
      buckets.noDate.push(assignment);
    } else {
      const dueDate = parseISO(assignment.dueAt);
      const dueDateInTz = timezone ? toZonedTime(dueDate, timezone) : dueDate;
      
      if (dueDateInTz < weekStart) {
        // Prior weeks - ONLY Missing assignments
        // Submitted/Graded before this week are excluded from WeeklyGrid
        if (assignment.checkpointStatus === 'Missing') {
          buckets.prior.push(assignment);
        }
        // else: exclude Submitted/Graded before current week
      } else if (dueDateInTz >= weekStart && dueDateInTz <= weekEnd) {
        // Current week - determine which weekday
        const weekday = getDay(dueDateInTz);
        switch (weekday) {
          case 1: buckets.Mon.push(assignment); break;
          case 2: buckets.Tue.push(assignment); break;
          case 3: buckets.Wed.push(assignment); break;
          case 4: buckets.Thu.push(assignment); break;
          case 5: buckets.Fri.push(assignment); break;
          // Weekend (Sat/Sun) would go to Monday, but spec says no weekend columns
        }
      } else if (dueDateInTz > weekEnd && dueDateInTz <= nextWeekEnd) {
        // Next week
        buckets.next.push(assignment);
      }
      // Far future (beyond next week) is excluded
    }
  });
  
  // Sort within each bucket (dueAt asc, then name asc)
  const sortBucket = (a: Assignment, b: Assignment) => {
    if (a.dueAt && b.dueAt) {
      if (a.dueAt !== b.dueAt) {
        return a.dueAt.localeCompare(b.dueAt);
      }
    }
    return a.name.localeCompare(b.name);
  };
  
  buckets.prior.sort(sortBucket);
  buckets.Mon.sort(sortBucket);
  buckets.Tue.sort(sortBucket);
  buckets.Wed.sort(sortBucket);
  buckets.Thu.sort(sortBucket);
  buckets.Fri.sort(sortBucket);
  buckets.next.sort(sortBucket);
  
  // Convert to GridItemEntry format and call toGridItems for each bucket
  const toEntries = (assignments: Assignment[]): GridItemEntry[] => 
    assignments.map(a => ({
      assignment: {
        id: a.id,
        name: a.name,
        // eslint-disable-next-line camelcase
        due_at: a.dueAt,
        // eslint-disable-next-line camelcase
        points_possible: a.points,
        // eslint-disable-next-line camelcase
        html_url: a.url
      },
      checkpointStatus: a.checkpointStatus
    }));
  
  const priorItems = buckets.prior.length > 0 ? toGridItems(toEntries(buckets.prior), 'Prior', asOf, timezone) : [];
  const monItems = buckets.Mon.length > 0 ? toGridItems(toEntries(buckets.Mon), 'Weekday', asOf, timezone) : [];
  const tueItems = buckets.Tue.length > 0 ? toGridItems(toEntries(buckets.Tue), 'Weekday', asOf, timezone) : [];
  const wedItems = buckets.Wed.length > 0 ? toGridItems(toEntries(buckets.Wed), 'Weekday', asOf, timezone) : [];
  const thuItems = buckets.Thu.length > 0 ? toGridItems(toEntries(buckets.Thu), 'Weekday', asOf, timezone) : [];
  const friItems = buckets.Fri.length > 0 ? toGridItems(toEntries(buckets.Fri), 'Weekday', asOf, timezone) : [];
  const nextItems = buckets.next.length > 0 ? toGridItems(toEntries(buckets.next), 'Next', asOf, timezone) : [];
  
  // Compute noDate summary
  const noDateCount = buckets.noDate.length;
  const noDatePoints = buckets.noDate.reduce((sum, a) => sum + (a.points ?? 0), 0);
  const noDateLabel = `${noDateCount} no due date (${noDatePoints} points)`;
  const noDateDeepLink = `https://app/detail?student=${studentId}&course=${course.id}&nodate=1`;
  
  // Compute attention counts and total items (exclude noDate from attentionCounts)
  const allItems = [...priorItems, ...monItems, ...tueItems, ...wedItems, ...thuItems, ...friItems, ...nextItems];
  const attentionCounts: AttentionCounts = { Check: 0, Thumb: 0, Question: 0, Warning: 0 };
  
  allItems.forEach(item => {
    if (item.attentionType in attentionCounts) {
      attentionCounts[item.attentionType as keyof AttentionCounts]++;
    }
  });
  
  return {
    courseId: course.id,
    courseName: course.name,
    cells: {
      prior: priorItems,
      weekday: {
        Mon: monItems,
        Tue: tueItems,
        Wed: wedItems,
        Thu: thuItems,
        Fri: friItems
      },
      next: nextItems,
      noDate: {
        count: noDateCount,
        points: noDatePoints,
        label: noDateLabel,
        deepLinkUrl: noDateDeepLink
      }
    },
    summary: {
      attentionCounts,
      totalItems: allItems.length
    }
  };
}
