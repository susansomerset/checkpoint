/**
 * processing.toGridItems v1.1.0
 * Spec: spec/current.json
 * 
 * Batched processor: Canvas assignments → GridItem[]
 * Pure function with memoized helpers, no global state
 */

import { format, parseISO, getDay, subDays, isSameDay, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export type CheckpointStatus = 'Due' | 'Missing' | 'Submitted' | 'Graded';
export type FormatType = 'Prior' | 'Weekday' | 'Next';
export type AttentionType = 'Check' | 'Thumb' | 'Question' | 'Warning' | 'Hand';

export interface CanvasAssignmentRaw {
  id: string;
  name: string;
  due_at?: string | null;
  points_possible?: number | null;
  html_url?: string;
  url?: string;
}

export interface GridItemEntry {
  assignment: CanvasAssignmentRaw;
  checkpointStatus: CheckpointStatus;
}

export interface GridItem {
  id: string;
  title: string;
  dueAt?: string;
  points?: number;
  url: string;
  attentionType: AttentionType;
}

/**
 * Batched processor: converts array of Canvas assignments to array of GridItems.
 * Precomputes timezone conversions and formatters once per call.
 * 
 * @param entries - Array of assignment + checkpointStatus pairs
 * @param formatType - How to format titles (Prior | Weekday | Next)
 * @param asOf - Reference date/time (ISO8601)
 * @param timezone - Optional IANA timezone (e.g., 'America/Los_Angeles')
 * @returns Array of GridItems (same order as input)
 */
export function toGridItems(
  entries: GridItemEntry[],
  formatType: FormatType,
  asOf: string,
  timezone?: string
): GridItem[] {
  // Precompute once per call (per spec: no recompute per element)
  const asOfDate = parseISO(asOf);
  const asOfInTz = timezone ? toZonedTime(asOfDate, timezone) : asOfDate;
  const asOfWeekday = getDay(asOfInTz); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  
  // Memoized helpers (computed once)
  const prevFridayInstant = getPreviousFriday(asOfInTz);
  const prevDayInstant = getPreviousDay(asOfInTz);
  
  // Process each entry
  return entries.map(entry => {
    const { assignment, checkpointStatus } = entry;
    
    // Validation: id must be non-empty
    if (!assignment.id || assignment.id.trim() === '') {
      throw new Error(`Assignment ID is required and cannot be empty`);
    }

    // Validation: html_url must be present and start with http:// or https://
    const url = assignment.html_url;
    if (!url) {
      throw new Error(`Assignment ${assignment.id} html_url is required`);
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`Assignment ${assignment.id} URL must start with http:// or https://`);
    }

    // Map id
    const id = assignment.id;

    // Map points (clamp to >= 0; omit if null/undefined)
    let points: number | undefined;
    if (assignment.points_possible !== null && assignment.points_possible !== undefined) {
      points = Math.max(0, assignment.points_possible);
    }
    const pointsOrZero = points ?? 0;

    // Map dueAt (validate ISO8601 with timezone if present)
    let dueAt: string | undefined;
    let dueDate: Date | undefined;
    if (assignment.due_at) {
      dueDate = parseISO(assignment.due_at);
      dueAt = assignment.due_at;
    }

    // Build name (trim and collapse whitespace)
    const name = assignment.name.trim().replace(/\s+/g, ' ');

    // Build title based on formatType
    let title: string;
    
    if (formatType === 'Prior' && dueDate) {
      // Format: M/d: Name (pts)
      const dueDateInTz = timezone ? toZonedTime(dueDate, timezone) : dueDate;
      const datePrefix = format(dueDateInTz, 'M/d');
      title = `${datePrefix}: ${name} (${pointsOrZero})`;
    } else if (formatType === 'Weekday') {
      // Format: Name (pts)
      title = `${name} (${pointsOrZero})`;
    } else if (formatType === 'Next' && dueDate) {
      // Format: EEE: Name (pts)
      const dueDateInTz = timezone ? toZonedTime(dueDate, timezone) : dueDate;
      const dayPrefix = format(dueDateInTz, 'EEE');
      title = `${dayPrefix}: ${name} (${pointsOrZero})`;
    } else {
      // No dueAt, omit date prefix
      title = `${name} (${pointsOrZero})`;
    }

    // Derive attentionType
    const attentionType = getAttentionType(
      checkpointStatus,
      dueDate,
      asOfInTz,
      asOfWeekday,
      prevFridayInstant,
      prevDayInstant,
      timezone
    );

    return {
      id,
      title,
      ...(dueAt && { dueAt }),
      ...(points !== undefined && { points }),
      url,
      attentionType,
    };
  });
}


/**
 * Get attention type based on checkpoint status and dates.
 * Uses precomputed values for efficiency.
 */
function getAttentionType(
  checkpointStatus: CheckpointStatus,
  dueDate: Date | undefined,
  asOfInTz: Date,
  asOfWeekday: number,
  prevFridayInstant: Date,
  prevDayInstant: Date,
  timezone?: string
): AttentionType {
  // Submitted or Graded → Check
  if (checkpointStatus === 'Submitted' || checkpointStatus === 'Graded') {
    return 'Check';
  }

  // Due → Thumb
  if (checkpointStatus === 'Due') {
    return 'Thumb';
  }

  // Missing → Question or Warning based on previous weekday logic
  if (checkpointStatus === 'Missing' && dueDate) {
    const dueInTz = timezone ? toZonedTime(dueDate, timezone) : dueDate;
    const dueDateOnly = startOfDay(dueInTz);
    
    // Check if dueDate matches previous Friday or previous day
    if (asOfWeekday === 0 || asOfWeekday === 1 || asOfWeekday === 6) {
      // Sat, Sun, Mon → check previous Friday
      if (isSameDay(dueDateOnly, prevFridayInstant)) {
        return 'Question';
      }
    } else {
      // Tue, Wed, Thu, Fri → check previous day
      if (isSameDay(dueDateOnly, prevDayInstant)) {
        return 'Question';
      }
    }
    
    return 'Warning';
  }

  // Default
  return 'Warning';
}

/**
 * Get previous Friday from a given date.
 * Mon → Fri (prior week)
 * Sat/Sun → Fri (prior week)
 */
function getPreviousFriday(date: Date): Date {
  const weekday = getDay(date);
  
  if (weekday === 1) {
    // Monday → previous Friday (3 days back)
    return startOfDay(subDays(date, 3));
  } else if (weekday === 0) {
    // Sunday → previous Friday (2 days back)
    return startOfDay(subDays(date, 2));
  } else if (weekday === 6) {
    // Saturday → previous Friday (1 day back)
    return startOfDay(subDays(date, 1));
  } else {
    // Tue-Fri → previous Friday (depends on day)
    const daysToFriday = (weekday + 7 - 5) % 7;
    return startOfDay(subDays(date, daysToFriday));
  }
}

/**
 * Get previous day from a given date.
 * Simply subtracts 1 day.
 */
function getPreviousDay(date: Date): Date {
  return startOfDay(subDays(date, 1));
}
