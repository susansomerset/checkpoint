/**
 * Timezone-aware date utilities for weekly grid
 * All date math runs in America/Los_Angeles timezone
 */

const TZ_DEFAULT = 'America/Los_Angeles'

/**
 * Get current date in Pacific timezone
 */
export const getCurrentDatePacific = (): Date => {
  const now = new Date()
  return new Date(now.toLocaleString('en-US', { timeZone: TZ_DEFAULT }))
}

/**
 * Get start of week (Monday) in Pacific timezone
 */
export const getWeekStartPacific = (date: Date = getCurrentDatePacific()): Date => {
  const pacificDate = new Date(date.toLocaleString('en-US', { timeZone: TZ_DEFAULT }))
  const dayOfWeek = pacificDate.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Sunday = 0, Monday = 1
  const monday = new Date(pacificDate)
  monday.setDate(pacificDate.getDate() + daysToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Get end of week (Sunday) in Pacific timezone
 */
export const getWeekEndPacific = (date: Date = getCurrentDatePacific()): Date => {
  const weekStart = getWeekStartPacific(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return weekEnd
}

/**
 * Get next week start (Monday) in Pacific timezone
 */
export const getNextWeekStartPacific = (date: Date = getCurrentDatePacific()): Date => {
  const thisWeekStart = getWeekStartPacific(date)
  const nextWeekStart = new Date(thisWeekStart)
  nextWeekStart.setDate(thisWeekStart.getDate() + 7)
  return nextWeekStart
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
}

/**
 * Map weekend dates to Monday (for weekly grid)
 */
export const mapWeekendToMonday = (date: Date): Date => {
  if (!isWeekend(date)) {
    return date
  }
  
  const dayOfWeek = date.getDay()
  const daysToMonday = dayOfWeek === 0 ? 1 : 2 // Sunday -> Monday, Saturday -> Monday
  const monday = new Date(date)
  monday.setDate(date.getDate() + daysToMonday)
  return monday
}

/**
 * Get the column index for a date in the weekly grid
 * 0 = Past Due, 1-5 = Mon-Fri, 6 = Next Week, 7 = No Due Date
 */
export const getWeekGridColumn = (dueDate: Date | null, currentDate: Date = getCurrentDatePacific()): number => {
  if (!dueDate) {
    return 7 // No Due Date column
  }
  
  const weekStart = getWeekStartPacific(currentDate)
  const weekEnd = getWeekEndPacific(currentDate)
  const nextWeekStart = getNextWeekStartPacific(currentDate)
  
  // Past due (before this week)
  if (dueDate < weekStart) {
    return 0
  }
  
  // This week (Monday-Friday)
  if (dueDate >= weekStart && dueDate <= weekEnd) {
    const dayOfWeek = dueDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend assignments go to Monday column
      return 1
    }
    return dayOfWeek // Monday = 1, Friday = 5
  }
  
  // Next week
  if (dueDate >= nextWeekStart && dueDate < getNextWeekStartPacific(nextWeekStart)) {
    return 6
  }
  
  // Future beyond next week
  return 7 // No Due Date column
}

/**
 * Check if a date is the current day (highlighted in grid)
 */
export const isCurrentDay = (date: Date, currentDate: Date = getCurrentDatePacific()): boolean => {
  const pacificDate = new Date(date.toLocaleString('en-US', { timeZone: TZ_DEFAULT }))
  const pacificCurrent = new Date(currentDate.toLocaleString('en-US', { timeZone: TZ_DEFAULT }))
  
  return pacificDate.toDateString() === pacificCurrent.toDateString()
}

/**
 * Calculate days between two dates (for "≤1 weekday late" logic)
 */
export const calculateWeekdaysBetween = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate.toLocaleString('en-US', { timeZone: TZ_DEFAULT }))
  const end = new Date(endDate.toLocaleString('en-US', { timeZone: TZ_DEFAULT }))
  
  let count = 0
  const current = new Date(start)
  
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

/**
 * Check if assignment is overdue by more than 1 weekday
 */
export const isOverdueByMoreThanOneWeekday = (dueDate: Date | null, currentDate: Date = getCurrentDatePacific()): boolean => {
  if (!dueDate) return false
  
  const weekdaysBetween = calculateWeekdaysBetween(dueDate, currentDate)
  return weekdaysBetween > 1
}

/**
 * Get previous weekday (for "≤1 weekday late" calculation)
 */
export const getPreviousWeekday = (date: Date = getCurrentDatePacific()): Date => {
  const previous = new Date(date)
  previous.setDate(date.getDate() - 1)
  
  // If it's Monday, go back to Friday
  if (previous.getDay() === 0) { // Sunday
    previous.setDate(previous.getDate() - 2) // Go to Friday
  }
  
  return previous
}

/**
 * Format date for display in weekly grid
 */
export const formatDateForGrid = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    timeZone: TZ_DEFAULT,
    month: 'numeric', 
    day: 'numeric' 
  })
}

/**
 * Get week range string for display
 */
export const getWeekRangeString = (date: Date = getCurrentDatePacific()): string => {
  const weekStart = getWeekStartPacific(date)
  const weekEnd = getWeekEndPacific(date)
  
  const startStr = weekStart.toLocaleDateString('en-US', { 
    timeZone: TZ_DEFAULT,
    month: 'short', 
    day: 'numeric' 
  })
  const endStr = weekEnd.toLocaleDateString('en-US', { 
    timeZone: TZ_DEFAULT,
    month: 'short', 
    day: 'numeric' 
  })
  
  return `${startStr} - ${endStr}`
}
