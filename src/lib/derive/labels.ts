import { Assignment, CheckpointStatus } from '@/lib/contracts/types'

/**
 * Column-specific label formatting for weekly grid
 */
export const formatAssignmentLabel = (
  assignment: Assignment,
  columnIndex: number
): string => {
  const points = assignment.pointsPossible || 0
  const dueDate = assignment.canvas.due_at ? new Date(assignment.canvas.due_at) : null
  
  switch (columnIndex) {
    case 0: // Past Due
      return `${formatDateForColumn(dueDate)}: ${assignment.canvas.name || 'Untitled'} (${points})`
    
    case 1: // Monday
    case 2: // Tuesday  
    case 3: // Wednesday
    case 4: // Thursday
    case 5: // Friday
      return `${assignment.canvas.name || 'Untitled'} (${points})`
    
    case 6: // Next Week
      return `${formatDateForColumn(dueDate)}: ${assignment.canvas.name || 'Untitled'} (${points})`
    
    case 7: // No Due Date
      return `${assignment.canvas.name || 'Untitled'} (${points})`
    
    default:
      return assignment.canvas.name || 'Untitled'
  }
}

/**
 * Format date for column display
 */
const formatDateForColumn = (dueDate: Date | null): string => {
  if (!dueDate) return 'No Due Date'
  
  return dueDate.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'numeric',
    day: 'numeric'
  })
}

/**
 * Get assignment status emoji for weekly grid based on checkpointStatus
 */
export const getAssignmentEmoji = (assignment: Assignment): string => {
  const status = assignment.meta.checkpointStatus
  
  switch (status) {
    case 'Missing':
      return '❓' // Missing
    case 'Submitted':
      return '✅' // Submitted
    case 'Graded':
      return '✅' // Graded
    case 'Due':
      return '👍' // Due and not completed
    case 'Vector':
      return '🔗' // Vector assignment
    case 'Locked':
    case 'Closed':
    case 'Cancelled':
      return '🔒' // Locked/Closed/Cancelled
    default:
      return '👍' // Default
  }
}

/**
 * Get assignment status color for weekly grid based on checkpointStatus
 */
export const getAssignmentColor = (assignment: Assignment): string => {
  const status = assignment.meta.checkpointStatus
  
  switch (status) {
    case 'Missing':
      return 'text-red-600' // Red text
    case 'Submitted':
      return 'text-green-600' // Green text
    case 'Graded':
      return 'text-green-600' // Green text
    case 'Due':
      return 'text-blue-600' // Blue text
    case 'Vector':
      return 'text-purple-600' // Purple text
    case 'Locked':
    case 'Closed':
    case 'Cancelled':
      return 'text-gray-600' // Gray text
    default:
      return 'text-blue-600' // Default blue
  }
}

/**
 * Get font size class based on point value
 */
export const getFontSizeClass = (points: number): string => {
  if (points >= 30) {
    return 'text-lg font-bold' // Large and bold
  } else if (points >= 10) {
    return 'text-base' // Normal size
  } else {
    return 'text-sm' // Small size
  }
}

/**
 * Get assignment link text for different contexts
 */
export const getAssignmentLinkText = (assignment: Assignment, context: 'grid' | 'table' | 'list'): string => {
  const name = assignment.canvas.name || 'Untitled'
  const points = assignment.pointsPossible || 0
  
  switch (context) {
    case 'grid':
      return `${name} (${points})`
    case 'table':
      return name
    case 'list':
      return `${name} - ${points} points`
    default:
      return name
  }
}

/**
 * Format assignment for display in progress table
 */
export const formatAssignmentForProgress = (assignment: Assignment): {
  name: string
  dueDate: string
  points: number
  status: CheckpointStatus
} => {
  const name = assignment.canvas.name || 'Untitled'
  const points = assignment.pointsPossible || 0
  const dueDate = assignment.canvas.due_at 
    ? new Date(assignment.canvas.due_at).toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short',
        day: 'numeric'
      })
    : 'No Due Date'
  
  // Use checkpointStatus directly from backend
  const status = assignment.meta.checkpointStatus
  
  return {
    name,
    dueDate,
    points,
    status
  }
}
