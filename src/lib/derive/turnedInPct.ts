import { CourseAggregate } from './courseAggregates'

/**
 * Calculate turned-in percentage for a single course
 */
export const calculateTurnedInPercentage = (aggregate: CourseAggregate): number => {
  if (aggregate.totalPoints === 0) {
    return 100 // No assignments = 100% complete
  }
  
  const turnedInPoints = aggregate.earnedPoints + aggregate.submittedPoints + aggregate.lostPoints
  return Math.round((turnedInPoints / aggregate.totalPoints) * 100)
}

/**
 * Calculate turned-in percentage for multiple courses
 */
export const calculateOverallTurnedInPercentage = (aggregates: CourseAggregate[]): number => {
  if (aggregates.length === 0) {
    return 100
  }
  
  let totalPoints = 0
  let turnedInPoints = 0
  
  for (const aggregate of aggregates) {
    totalPoints += aggregate.totalPoints
    turnedInPoints += aggregate.earnedPoints + aggregate.submittedPoints + aggregate.lostPoints
  }
  
  if (totalPoints === 0) {
    return 100
  }
  
  return Math.round((turnedInPoints / totalPoints) * 100)
}

/**
 * Check if all assignments are turned in (no missing assignments)
 */
export const isAllTurnedIn = (aggregate: CourseAggregate): boolean => {
  return aggregate.statusCounts.Missing === 0
}

/**
 * Check if all assignments are turned in across multiple courses
 */
export const isAllTurnedInOverall = (aggregates: CourseAggregate[]): boolean => {
  return aggregates.every(aggregate => isAllTurnedIn(aggregate))
}

/**
 * Get the number of missing assignments
 */
export const getMissingCount = (aggregate: CourseAggregate): number => {
  return aggregate.statusCounts.Missing || 0
}

/**
 * Get the total number of missing assignments across multiple courses
 */
export const getTotalMissingCount = (aggregates: CourseAggregate[]): number => {
  return aggregates.reduce((total, aggregate) => total + getMissingCount(aggregate), 0)
}

/**
 * Get progress status for display
 */
export const getProgressStatus = (aggregate: CourseAggregate): {
  status: 'complete' | 'in-progress' | 'behind'
  message: string
} => {
  const missingCount = getMissingCount(aggregate)
  
  if (missingCount === 0) {
    return {
      status: 'complete',
      message: 'All assignments turned in! 🎉'
    }
  }
  
  if (missingCount <= 2) {
    return {
      status: 'in-progress',
      message: `${missingCount} assignment${missingCount === 1 ? '' : 's'} remaining`
    }
  }
  
  return {
    status: 'behind',
    message: `${missingCount} assignments missing`
  }
}
