/* eslint-disable camelcase */
import { http, HttpResponse } from 'msw'
import { StudentDataResponse, MetaDataResponse } from '@/lib/contracts/api'

// Mock data - in real implementation, this would be generated from real API responses
const mockStudentData: StudentDataResponse = {
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
          },
          orphanSubmissions: {},
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
            'assignment3': {
              assignmentId: 'assignment3',
              courseId: 'course2',
              canvas: {
                name: 'Essay 1',
                due_at: '2024-01-18T23:59:59Z',
                points_possible: 50,
                html_url: 'https://canvas.instructure.com/courses/course2/assignments/assignment3',
              },
              pointsPossible: 50,
              link: 'https://canvas.instructure.com/courses/course2/assignments/assignment3',
              submissions: {
                'submission2': {
                  submissionId: 'submission2',
                  assignmentId: 'assignment3',
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
          },
          orphanSubmissions: {},
        },
      },
    },
  },
  lastLoadedAt: '2024-01-20T10:00:00Z',
  apiVersion: '1',
}

const mockMetaData: MetaDataResponse = {
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
}

export const handlers = [
  // Mock /api/student-data endpoint
  http.get('/api/student-data', () => {
    return HttpResponse.json(mockStudentData)
  }),

  // Mock /api/metadata endpoint
  http.get('/api/metadata', () => {
    return HttpResponse.json(mockMetaData)
  }),

  // Mock /api/student-data/update endpoint
  http.post('/api/student-data/update', () => {
    return HttpResponse.json({ success: true, message: 'Data updated successfully' })
  }),

  // Mock /api/student-data/reset endpoint
  http.post('/api/student-data/reset', () => {
    return HttpResponse.json({ success: true, message: 'Data reset successfully' })
  }),

  // Mock error scenarios
  http.get('/api/student-data/error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error', message: 'Something went wrong', statusCode: 500 },
      { status: 500 }
    )
  }),

  http.get('/api/student-data/forbidden', () => {
    return HttpResponse.json(
      { error: 'Forbidden', message: 'Access denied', statusCode: 403 },
      { status: 403 }
    )
  }),

  // Mock network error
  http.get('/api/student-data/network-error', () => {
    return HttpResponse.error()
  }),
]
