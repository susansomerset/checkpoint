import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AssignmentList } from '../../src/components/AssignmentList'
import { fetchStudentDataWithRetry } from '../../src/lib/api/studentData'

// Mock the API
jest.mock('../../src/lib/api/studentData')
const mockFetchStudentDataWithRetry = fetchStudentDataWithRetry as jest.MockedFunction<typeof fetchStudentDataWithRetry>

// Mock data with Vector assignments and multiple students
const mockDataWithVector = {
  students: {
    student1: {
      studentId: 'student1',
      meta: {
        preferredName: 'Zach',
        legalName: 'Zachary Smith',
      },
      courses: {
        course1: {
          courseId: 'course1',
          canvas: {
            name: 'Math 101',
            html_url: 'https://djusd.instructure.com/courses/course1',
          },
          meta: {
            shortName: 'Math',
            teacher: 'Ms. Johnson',
            period: 1,
          },
          assignments: {
            assignment1: {
              assignmentId: 'assignment1',
              courseId: 'course1',
              canvas: {
                name: 'Homework 1',
                html_url: 'https://djusd.instructure.com/courses/course1/assignments/assignment1',
                points_possible: 10,
              },
              pointsPossible: 10,
              link: 'https://djusd.instructure.com/courses/course1/assignments/assignment1',
              submissions: {},
              meta: {
                checkpointStatus: 'Missing',
                checkpointEarnedPoints: 0,
                checkpointLostPoints: 0,
                checkpointSubmittedPoints: 0,
                checkpointMissingPoints: 10,
                assignmentType: 'graded',
              },
            },
            assignment2: {
              assignmentId: 'assignment2',
              courseId: 'course1',
              canvas: {
                name: 'Vector Assignment',
                html_url: 'https://djusd.instructure.com/courses/course1/assignments/assignment2',
                points_possible: 5,
              },
              pointsPossible: 5,
              link: 'https://djusd.instructure.com/courses/course1/assignments/assignment2',
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
          },
          orphanSubmissions: {},
        },
      },
    },
    student2: {
      studentId: 'student2',
      meta: {
        preferredName: 'Sam',
        legalName: 'Samuel Jones',
      },
      courses: {
        course2: {
          courseId: 'course2',
          canvas: {
            name: 'English 101',
            html_url: 'https://djusd.instructure.com/courses/course2',
          },
          meta: {
            shortName: 'English',
            teacher: 'Mr. Brown',
            period: 2,
          },
          assignments: {
            assignment3: {
              assignmentId: 'assignment3',
              courseId: 'course2',
              canvas: {
                name: 'Essay 1',
                html_url: 'https://djusd.instructure.com/courses/course2/assignments/assignment3',
                points_possible: 20,
              },
              pointsPossible: 20,
              link: 'https://djusd.instructure.com/courses/course2/assignments/assignment3',
              submissions: {},
              meta: {
                checkpointStatus: 'Submitted',
                checkpointEarnedPoints: 0,
                checkpointLostPoints: 0,
                checkpointSubmittedPoints: 20,
                checkpointMissingPoints: 0,
                assignmentType: 'graded',
              },
            },
          },
          orphanSubmissions: {},
        },
      },
    },
  },
  lastLoadedAt: '2024-01-01T00:00:00Z',
  apiVersion: '1' as const,
}

describe('AssignmentList Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should filter out Vector assignments', async () => {
    mockFetchStudentDataWithRetry.mockResolvedValue({
      ok: true,
      status: 200,
      data: mockDataWithVector,
    })

    render(<AssignmentList />)

    await waitFor(() => {
      expect(screen.getByText('Assignments (2)')).toBeInTheDocument()
    })

    // Should show the graded assignments from both students
    expect(screen.getByText('Homework 1')).toBeInTheDocument()
    expect(screen.getByText('Essay 1')).toBeInTheDocument()
    
    // Should NOT show the Vector assignment
    expect(screen.queryByText('Vector Assignment')).not.toBeInTheDocument()
  })

  it('should filter by selected student', async () => {
    mockFetchStudentDataWithRetry.mockResolvedValue({
      ok: true,
      status: 200,
      data: mockDataWithVector,
    })

    render(<AssignmentList />)

    await waitFor(() => {
      expect(screen.getByText('Assignments (2)')).toBeInTheDocument()
    })

    // Should show both students' assignments initially
    expect(screen.getByText('Homework 1')).toBeInTheDocument()
    expect(screen.getByText('Essay 1')).toBeInTheDocument()

    // Select Zach (student1)
    const studentSelect = screen.getByLabelText('Student:')
    fireEvent.change(studentSelect, { target: { value: 'student1' } })

    await waitFor(() => {
      expect(screen.getByText('Assignments (1)')).toBeInTheDocument()
    })

    // Should only show Zach's assignments
    expect(screen.getByText('Homework 1')).toBeInTheDocument()
    expect(screen.queryByText('Essay 1')).not.toBeInTheDocument()
  })

  it('should use correct Canvas domain (djusd.instructure.com)', async () => {
    mockFetchStudentDataWithRetry.mockResolvedValue({
      ok: true,
      status: 200,
      data: mockDataWithVector,
    })

    render(<AssignmentList />)

    await waitFor(() => {
      expect(screen.getByText('Assignments (2)')).toBeInTheDocument()
    })

    // Check that Canvas links use the correct domain
    const canvasLinks = screen.getAllByText('View in Canvas')
    expect(canvasLinks).toHaveLength(2)
    
    canvasLinks.forEach(link => {
      expect(link.closest('a')).toHaveAttribute('href', expect.stringContaining('djusd.instructure.com'))
    })
  })

  it('should show correct student names in dropdown', async () => {
    mockFetchStudentDataWithRetry.mockResolvedValue({
      ok: true,
      status: 200,
      data: mockDataWithVector,
    })

    render(<AssignmentList />)

    await waitFor(() => {
      expect(screen.getByText('Assignments (2)')).toBeInTheDocument()
    })

    const studentSelect = screen.getByLabelText('Student:')
    const options = Array.from(studentSelect.querySelectorAll('option')).map(option => option.textContent)
    
    expect(options).toContain('All Students')
    expect(options).toContain('Zach')
    expect(options).toContain('Sam')
  })

  it('should handle loading state', () => {
    mockFetchStudentDataWithRetry.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<AssignmentList />)

    // Should show loading skeleton elements
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should handle error state with retry', async () => {
    mockFetchStudentDataWithRetry.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Server error',
    })

    render(<AssignmentList />)

    await waitFor(() => {
      expect(screen.getByText('Error loading assignments')).toBeInTheDocument()
    })

    expect(screen.getByText('Server error')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()

    // Test retry functionality
    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)

    expect(mockFetchStudentDataWithRetry).toHaveBeenCalledTimes(2)
  })

  it('should show empty state when no assignments', async () => {
    const emptyData = {
      students: {},
      lastLoadedAt: '2024-01-01T00:00:00Z',
      apiVersion: '1' as const,
    }

    mockFetchStudentDataWithRetry.mockResolvedValue({
      ok: true,
      status: 200,
      data: emptyData,
    })

    render(<AssignmentList />)

    await waitFor(() => {
      expect(screen.getByText('No assignments found')).toBeInTheDocument()
    })
  })
})
