import { Course, StudentData, CheckpointStatus } from '@/lib/contracts/types'

/**
 * Course aggregate data for progress calculations
 */
export interface CourseAggregate {
  courseId: string
  courseName: string
  teacher: string
  period: number
  totalAssignments: number
  totalPoints: number
  earnedPoints: number
  submittedPoints: number
  missingPoints: number
  lostPoints: number
  turnedInPercentage: number
  statusCounts: Record<CheckpointStatus, number>
}

/**
 * Calculate course aggregates for a single course
 */
export const calculateCourseAggregate = (course: Course): CourseAggregate => {
  const assignments = Object.values(course.assignments)
  const filteredAssignments = assignments.filter(assignment => assignment.meta.assignmentType !== 'Vector')
  
  // Count statuses from checkpointStatus
  const statusCounts: Record<CheckpointStatus, number> = {
    'Locked': 0,
    'Closed': 0,
    'Due': 0,
    'Missing': 0,
    'Vector': 0,
    'Submitted': 0,
    'Graded': 0,
    'Cancelled': 0,
  }
  
  for (const assignment of filteredAssignments) {
    const status = assignment.meta.checkpointStatus
    statusCounts[status] = (statusCounts[status] || 0) + 1
  }
  
  let totalPoints = 0
  let earnedPoints = 0
  let submittedPoints = 0
  let missingPoints = 0
  let lostPoints = 0
  
  for (const assignment of filteredAssignments) {
    const points = assignment.pointsPossible || 0
    totalPoints += points
    
    // Add points based on assignment meta
    earnedPoints += assignment.meta.checkpointEarnedPoints
    submittedPoints += assignment.meta.checkpointSubmittedPoints
    missingPoints += assignment.meta.checkpointMissingPoints
    lostPoints += assignment.meta.checkpointLostPoints
  }
  
  const turnedInPercentage = totalPoints > 0 
    ? Math.round(((earnedPoints + submittedPoints + lostPoints) / totalPoints) * 100)
    : 100
  
  return {
    courseId: course.courseId,
    courseName: course.meta.shortName || course.canvas.name || 'Unknown Course',
    teacher: course.meta.teacher || 'Unknown Teacher',
    period: course.meta.period || 0,
    totalAssignments: filteredAssignments.length,
    totalPoints,
    earnedPoints,
    submittedPoints,
    missingPoints,
    lostPoints,
    turnedInPercentage,
    statusCounts,
  }
}

/**
 * Calculate course aggregates for all courses in student data
 */
export const calculateAllCourseAggregates = (studentData: StudentData): CourseAggregate[] => {
  const aggregates: CourseAggregate[] = []
  
  for (const student of Object.values(studentData.students)) {
    for (const course of Object.values(student.courses)) {
      aggregates.push(calculateCourseAggregate(course))
    }
  }
  
  // Sort by period, then by course name
  return aggregates.sort((a, b) => {
    if (a.period !== b.period) {
      return a.period - b.period
    }
    return a.courseName.localeCompare(b.courseName)
  })
}

/**
 * Calculate course aggregates for a specific student
 */
export const calculateStudentCourseAggregates = (
  studentData: StudentData, 
  studentId: string
): CourseAggregate[] => {
  const student = studentData.students[studentId]
  if (!student) {
    return []
  }
  
  const aggregates: CourseAggregate[] = []
  
  for (const course of Object.values(student.courses)) {
    aggregates.push(calculateCourseAggregate(course))
  }
  
  // Sort by period, then by course name
  return aggregates.sort((a, b) => {
    if (a.period !== b.period) {
      return a.period - b.period
    }
    return a.courseName.localeCompare(b.courseName)
  })
}

/**
 * Calculate overall progress across all courses
 */
export const calculateOverallProgress = (aggregates: CourseAggregate[]): {
  totalCourses: number
  totalAssignments: number
  totalPoints: number
  earnedPoints: number
  submittedPoints: number
  missingPoints: number
  lostPoints: number
  turnedInPercentage: number
} => {
  const totalCourses = aggregates.length
  let totalAssignments = 0
  let totalPoints = 0
  let earnedPoints = 0
  let submittedPoints = 0
  let missingPoints = 0
  let lostPoints = 0
  
  for (const aggregate of aggregates) {
    totalAssignments += aggregate.totalAssignments
    totalPoints += aggregate.totalPoints
    earnedPoints += aggregate.earnedPoints
    submittedPoints += aggregate.submittedPoints
    missingPoints += aggregate.missingPoints
    lostPoints += aggregate.lostPoints
  }
  
  const turnedInPercentage = totalPoints > 0 
    ? Math.round(((earnedPoints + submittedPoints + lostPoints) / totalPoints) * 100)
    : 100
  
  return {
    totalCourses,
    totalAssignments,
    totalPoints,
    earnedPoints,
    submittedPoints,
    missingPoints,
    lostPoints,
    turnedInPercentage,
  }
}
