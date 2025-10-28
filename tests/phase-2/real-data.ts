/**
 * Test fixtures generated from real API data
 * This ensures we test against actual data patterns
 */

import { StudentData, MetaData } from '@/lib/contracts/types'

/**
 * Generate test fixtures from real API data
 */
export const generateTestFixtures = async (): Promise<{
  studentData: StudentData
  metaData: MetaData
}> => {
  try {
    // Fetch real data from API
    const [studentDataResponse, metaDataResponse] = await Promise.all([
      fetch('/api/student-data').then(res => res.json()),
      fetch('/api/metadata').then(res => res.json())
    ])
    
    return {
      studentData: studentDataResponse,
      metaData: metaDataResponse,
    }
  } catch (error) {
    console.warn('Failed to fetch real data, using mock data:', error)
    
    // Fallback to mock data if real API is not available
    return {
      studentData: getMockStudentData(),
      metaData: getMockMetaData(),
    }
  }
}

/**
 * Mock student data for testing when real API is not available
 */
export const getMockStudentData = (): StudentData => ({
  students: {
    'student1': {
      studentId: 'student1',
      meta: {
        legalName: 'John Doe',
        preferredName: 'Johnny',
      },
      courses: {
        'course1': {
          courseId: 'course1',
          canvas: {
            name: 'Math 101',
            course_code: 'MATH101',
          },
          meta: {
            shortName: 'Math',
            teacher: 'Ms. Smith',
            period: 1,
          },
          assignments: {
            'assignment1': {
              assignmentId: 'assignment1',
              courseId: 'course1',
              canvas: {
                name: 'Homework 1',
                due_at: '2024-01-15T23:59:59Z',
                points_possible: 10,
                html_url: 'https://canvas.instructure.com/courses/course1/assignments/assignment1',
              },
              pointsPossible: 10,
              link: 'https://canvas.instructure.com/courses/course1/assignments/assignment1',
              submissions: {
                'submission1': {
                  submissionId: 'submission1',
                  assignmentId: 'assignment1',
                  courseId: 'course1',
                  studentId: 'student1',
                  canvas: {
                    submitted_at: '2024-01-14T10:30:00Z',
                    score: 9,
                    graded_at: '2024-01-16T08:00:00Z',
                  },
                  status: 'graded',
                  score: 9,
                  gradedAt: '2024-01-16T08:00:00Z',
                  submittedAt: '2024-01-14T10:30:00Z',
                },
              },
              meta: {
                checkpointStatus: 'Graded',
                checkpointEarnedPoints: 9,
                checkpointLostPoints: 0,
                checkpointSubmittedPoints: 0,
                checkpointMissingPoints: 0,
                assignmentType: 'Pointed',
              },
            },
            'assignment2': {
              assignmentId: 'assignment2',
              courseId: 'course1',
              canvas: {
                name: 'Quiz 1',
                due_at: '2024-01-20T23:59:59Z',
                points_possible: 20,
                html_url: 'https://canvas.instructure.com/courses/course1/assignments/assignment2',
              },
              pointsPossible: 20,
              link: 'https://canvas.instructure.com/courses/course1/assignments/assignment2',
              submissions: {},
              meta: {
                checkpointStatus: 'Missing',
                checkpointEarnedPoints: 0,
                checkpointLostPoints: 0,
                checkpointSubmittedPoints: 0,
                checkpointMissingPoints: 20,
                assignmentType: 'Pointed',
              },
            },
            'assignment3': {
              assignmentId: 'assignment3',
              courseId: 'course1',
              canvas: {
                name: 'Vector Assignment',
                due_at: null,
                points_possible: 0,
                html_url: 'https://canvas.instructure.com/courses/course1/assignments/assignment3',
              },
              pointsPossible: 0,
              link: 'https://canvas.instructure.com/courses/course1/assignments/assignment3',
              submissions: {},
              meta: {
                checkpointStatus: 'Vector',
                checkpointEarnedPoints: 0,
                checkpointLostPoints: 0,
                checkpointSubmittedPoints: 0,
                checkpointMissingPoints: 0,
                assignmentType: 'Vector',
              },
            },
          }
        },
        'course2': {
          courseId: 'course2',
          canvas: {
            name: 'English 101',
            course_code: 'ENG101',
          },
          meta: {
            shortName: 'English',
            teacher: 'Mr. Johnson',
            period: 2,
          },
          assignments: {
            'assignment4': {
              assignmentId: 'assignment4',
              courseId: 'course2',
              canvas: {
                name: 'Essay 1',
                due_at: '2024-01-18T23:59:59Z',
                points_possible: 50,
                html_url: 'https://canvas.instructure.com/courses/course2/assignments/assignment4',
              },
              pointsPossible: 50,
              link: 'https://canvas.instructure.com/courses/course2/assignments/assignment4',
              submissions: {
                'submission2': {
                  submissionId: 'submission2',
                  assignmentId: 'assignment4',
                  courseId: 'course2',
                  studentId: 'student1',
                  canvas: {
                    submitted_at: '2024-01-19T14:30:00Z',
                  },
                  status: 'submittedLate',
                  submittedAt: '2024-01-19T14:30:00Z',
                },
              },
              meta: {
                checkpointStatus: 'Submitted',
                checkpointEarnedPoints: 0,
                checkpointLostPoints: 0,
                checkpointSubmittedPoints: 50,
                checkpointMissingPoints: 0,
                assignmentType: 'Pointed',
              },
            },
          }
        },
      },
    },
  },
  lastLoadedAt: '2024-01-20T10:00:00Z',
  apiVersion: '1',
})

/**
 * Mock metadata for testing when real API is not available
 */
export const getMockMetaData = (): MetaData => ({
  students: {
    'student1': {
      legalName: 'John Doe',
      preferredName: 'Johnny',
    },
  },
  courses: {
    'course1': {
      shortName: 'Math',
      teacher: 'Ms. Smith',
      period: 1,
    },
    'course2': {
      shortName: 'English',
      teacher: 'Mr. Johnson',
      period: 2,
    },
  },
  autoRefresh: {
    dailyFullAtMidnightPT: false,
    quickEveryMinutes: 0,
  },
  apiVersion: '1',
})

/**
 * Edge case test data for comprehensive testing
 */
export const getEdgeCaseTestData = (): StudentData => {
  const baseData = getMockStudentData()
  
  // Add edge cases
  const edgeCaseStudent = {
    ...baseData.students.student1,
    courses: {
      ...baseData.students.student1.courses,
      'course3': {
        courseId: 'course3',
        canvas: {
          name: 'Science 101',
          course_code: 'SCI101',
        },
        meta: {
          shortName: 'Science',
          teacher: 'Dr. Wilson',
          period: 3,
        },
        assignments: {
          'assignment5': {
            assignmentId: 'assignment5',
            courseId: 'course3',
            canvas: {
              name: 'Weekend Assignment',
              due_at: '2024-01-20T23:59:59Z', // Saturday
              points_possible: 15,
              html_url: 'https://canvas.instructure.com/courses/course3/assignments/assignment5',
            },
            pointsPossible: 15,
            link: 'https://canvas.instructure.com/courses/course3/assignments/assignment5',
            submissions: {},
            meta: {
              checkpointStatus: 'Missing' as const,
              checkpointEarnedPoints: 0,
              checkpointLostPoints: 0,
              checkpointSubmittedPoints: 0,
              checkpointMissingPoints: 15,
              assignmentType: 'Pointed' as const,
            },
          },
          'assignment6': {
            assignmentId: 'assignment6',
            courseId: 'course3',
            canvas: {
              name: 'Large Assignment',
              due_at: '2024-01-25T23:59:59Z',
              points_possible: 100,
              html_url: 'https://canvas.instructure.com/courses/course3/assignments/assignment6',
            },
            pointsPossible: 100,
            link: 'https://canvas.instructure.com/courses/course3/assignments/assignment6',
            submissions: {},
            meta: {
              checkpointStatus: 'Due' as const,
              checkpointEarnedPoints: 0,
              checkpointLostPoints: 0,
              checkpointSubmittedPoints: 0,
              checkpointMissingPoints: 0,
              assignmentType: 'Pointed' as const,
            },
          },
        }
      },
    },
  }
  
  return {
    ...baseData,
    students: {
      ...baseData.students,
      student1: edgeCaseStudent,
    },
  }
}
