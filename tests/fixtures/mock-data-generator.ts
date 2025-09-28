// tests/fixtures/mock-data-generator.ts
import { StudentData, Student, Course, Assignment, Submission } from '@/lib/contracts/types'
import { StudentDataSchema } from '@/lib/contracts/types'

/**
 * Generates mock data that exactly matches the backend API response structure
 * and validates against the actual schemas used by the backend
 */

export function generateMockStudentData(): StudentData {
  const mockData: StudentData = {
    students: {
      'student-001': {
        studentId: 'student-001',
        meta: {
          legalName: 'John Smith',
          preferredName: 'Johnny'
        },
        courses: {
          'course-101': {
            courseId: 'course-101',
            canvas: {
              name: 'Algebra I',
              id: 101,
              course_code: 'MATH-101'
            },
            meta: {
              shortName: 'Algebra I',
              teacher: 'Ms. Johnson',
              period: 1
            },
            assignments: {
              'assignment-001': {
                assignmentId: 'assignment-001',
                courseId: 'course-101',
                canvas: {
                  name: 'Chapter 5 Quiz',
                  due_at: '2024-10-15T23:59:59Z',
                  html_url: 'https://djusd.instructure.com/courses/101/assignments/001',
                  points_possible: 20
                },
                pointsPossible: 20,
                link: 'https://djusd.instructure.com/courses/101/assignments/001',
                submissions: {
                  'submission-001': {
                    submissionId: 'submission-001',
                    assignmentId: 'assignment-001',
                    courseId: 'course-101',
                    studentId: 'student-001',
                    canvas: {
                      submitted_at: '2024-10-14T15:30:00Z',
                      score: 18,
                      grade: '18'
                    },
                    status: 'submittedOnTime',
                    score: 18,
                    gradedAt: '2024-10-15T08:00:00Z',
                    submittedAt: '2024-10-14T15:30:00Z'
                  }
                },
                meta: {
                  checkpointStatus: 'Graded',
                  checkpointEarnedPoints: 18,
                  checkpointLostPoints: 2,
                  checkpointSubmittedPoints: 18,
                  checkpointMissingPoints: 0,
                  assignmentType: 'Pointed'
                }
              },
              'assignment-002': {
                assignmentId: 'assignment-002',
                courseId: 'course-101',
                canvas: {
                  name: 'Homework Set 3',
                  due_at: '2024-10-20T23:59:59Z',
                  html_url: 'https://djusd.instructure.com/courses/101/assignments/002',
                  points_possible: 15
                },
                pointsPossible: 15,
                link: 'https://djusd.instructure.com/courses/101/assignments/002',
                submissions: {},
                meta: {
                  checkpointStatus: 'Due',
                  checkpointEarnedPoints: 0,
                  checkpointLostPoints: 0,
                  checkpointSubmittedPoints: 0,
                  checkpointMissingPoints: 15,
                  assignmentType: 'Pointed'
                }
              }
            },
            orphanSubmissions: {}
          },
          'course-102': {
            courseId: 'course-102',
            canvas: {
              name: 'English Literature',
              id: 102,
              course_code: 'ENG-102'
            },
            meta: {
              shortName: 'English Lit',
              teacher: 'Mr. Davis',
              period: 2
            },
            assignments: {
              'assignment-003': {
                assignmentId: 'assignment-003',
                courseId: 'course-102',
                canvas: {
                  name: 'Essay: Character Analysis',
                  due_at: '2024-10-18T23:59:59Z',
                  html_url: 'https://djusd.instructure.com/courses/102/assignments/003',
                  points_possible: 50
                },
                pointsPossible: 50,
                link: 'https://djusd.instructure.com/courses/102/assignments/003',
                submissions: {
                  'submission-003': {
                    submissionId: 'submission-003',
                    assignmentId: 'assignment-003',
                    courseId: 'course-102',
                    studentId: 'student-001',
                    canvas: {
                      submitted_at: '2024-10-17T14:20:00Z',
                      score: 45,
                      grade: '45'
                    },
                    status: 'submittedOnTime',
                    score: 45,
                    gradedAt: '2024-10-18T09:15:00Z',
                    submittedAt: '2024-10-17T14:20:00Z'
                  }
                },
                meta: {
                  checkpointStatus: 'Graded',
                  checkpointEarnedPoints: 45,
                  checkpointLostPoints: 5,
                  checkpointSubmittedPoints: 45,
                  checkpointMissingPoints: 0,
                  assignmentType: 'Pointed'
                }
              }
            },
            orphanSubmissions: {}
          }
        }
      },
      'student-002': {
        studentId: 'student-002',
        meta: {
          legalName: 'Sarah Johnson',
          preferredName: 'Sarah'
        },
        courses: {
          'course-101': {
            courseId: 'course-101',
            canvas: {
              name: 'Algebra I',
              id: 101,
              course_code: 'MATH-101'
            },
            meta: {
              shortName: 'Algebra I',
              teacher: 'Ms. Johnson',
              period: 1
            },
            assignments: {
              'assignment-001': {
                assignmentId: 'assignment-001',
                courseId: 'course-101',
                canvas: {
                  name: 'Chapter 5 Quiz',
                  due_at: '2024-10-15T23:59:59Z',
                  html_url: 'https://djusd.instructure.com/courses/101/assignments/001',
                  points_possible: 20
                },
                pointsPossible: 20,
                link: 'https://djusd.instructure.com/courses/101/assignments/001',
                submissions: {
                  'submission-002': {
                    submissionId: 'submission-002',
                    assignmentId: 'assignment-001',
                    courseId: 'course-101',
                    studentId: 'student-002',
                    canvas: {
                      submitted_at: '2024-10-15T22:45:00Z',
                      score: 20,
                      grade: '20'
                    },
                    status: 'submittedOnTime',
                    score: 20,
                    gradedAt: '2024-10-16T08:00:00Z',
                    submittedAt: '2024-10-15T22:45:00Z'
                  }
                },
                meta: {
                  checkpointStatus: 'Graded',
                  checkpointEarnedPoints: 20,
                  checkpointLostPoints: 0,
                  checkpointSubmittedPoints: 20,
                  checkpointMissingPoints: 0,
                  assignmentType: 'Pointed'
                }
              }
            },
            orphanSubmissions: {}
          }
        }
      }
    },
    lastLoadedAt: new Date().toISOString(),
    apiVersion: '1'
  }

  return mockData
}

/**
 * Validates that the mock data matches the backend schema exactly
 * This ensures our tests are using data that would pass backend validation
 */
export function validateMockDataStructure(): boolean {
  try {
    const mockData = generateMockStudentData()
    
    // Validate against the exact schema used by the backend
    const validatedData = StudentDataSchema.parse(mockData)
    
    console.log('✅ Mock data structure validation passed')
    console.log(`   - Students: ${Object.keys(validatedData.students).length}`)
    console.log(`   - API Version: ${validatedData.apiVersion}`)
    console.log(`   - Last Loaded: ${validatedData.lastLoadedAt}`)
    
    // Count total assignments across all courses
    let totalAssignments = 0
    Object.values(validatedData.students).forEach(student => {
      Object.values(student.courses).forEach(course => {
        totalAssignments += Object.keys(course.assignments).length
      })
    })
    console.log(`   - Total Assignments: ${totalAssignments}`)
    
    return true
  } catch (error) {
    console.error('❌ Mock data structure validation failed:', error)
    return false
  }
}

/**
 * Generates the exact API response format that the backend returns
 * This matches the ApiResponse<StudentData> structure
 */
export function generateMockApiResponse() {
  const mockData = generateMockStudentData()
  
  return {
    ok: true,
    status: 200,
    data: mockData
  }
}

// Run validation on import to catch schema mismatches early
if (require.main === module) {
  validateMockDataStructure()
}
