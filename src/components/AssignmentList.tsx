'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import toast from 'react-hot-toast'
import { StudentData, Assignment, Course } from '@/lib/contracts/types'
import { fetchStudentDataWithRetry } from '@/lib/api/studentData'
import { buildCanvasAssignmentUrl } from '@/lib/derive/canvasLinks'

interface AssignmentListProps {
  studentId?: string
  onStudentChange?: (_studentId: string) => void
}

interface AssignmentWithCourse extends Assignment {
  course: Course
  courseName: string
  teacherName?: string
  period?: number
}

export function AssignmentList({ studentId, onStudentChange }: AssignmentListProps) {
  const { user, isLoading: authLoading } = useUser()
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    studentId || null
  )

  // Fetch data with retry logic
  const fetchData = async (studentId?: string) => {
    console.log('fetchData called with studentId:', studentId)
    setLoading(true)
    setError(null)

    try {
      const result = await fetchStudentDataWithRetry(studentId, 3, 1000)
      console.log('fetchStudentDataWithRetry result:', result)
      
      if (result.ok && result.data) {
        setData(result.data)
        setError(null)
        setRetryCount(0)
        toast.success('Data loaded successfully')
      } else {
        const errorMessage = result.error || 'Failed to fetch data'
        console.log('API Error:', { status: result.status, error: result.error, result })
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.log('fetchData catch error:', err)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch - only when authenticated
  useEffect(() => {
    if (authLoading) {
      // Still checking authentication - keep loading state
      return
    }
    
    if (!user) {
      // Not authenticated - show sign in required
      setLoading(false)
      setError('AUTH_REQUIRED')
      return
    }
    
    // User is authenticated - fetch data
    fetchData(selectedStudentId || undefined)
  }, [selectedStudentId, user, authLoading])

  // Handle student selection change
  const handleStudentChange = (newStudentId: string) => {
    setSelectedStudentId(newStudentId)
    onStudentChange?.(newStudentId)
    
    // Update URL state
    const url = new URL(window.location.href)
    if (newStudentId) {
      url.searchParams.set('student', newStudentId)
    } else {
      url.searchParams.delete('student')
    }
    window.history.replaceState({}, '', url.toString())
  }

  // Handle retry with exponential backoff
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    fetchData(selectedStudentId || undefined)
  }

  // Get all assignments with course info
  const getAllAssignments = (): AssignmentWithCourse[] => {
    if (!data || !data.students) return []

    const assignments: AssignmentWithCourse[] = []
    
    // Filter students by selectedStudentId if specified
    const studentsToProcess = selectedStudentId 
      ? [data.students[selectedStudentId]].filter(Boolean)
      : Object.values(data.students)
    
    studentsToProcess.forEach(student => {
      if (!student || !student.courses) return
      
      Object.values(student.courses).forEach(course => {
        if (!course || !course.assignments || !course.meta) return
        
        Object.values(course.assignments).forEach(assignment => {
          if (!assignment || !assignment.meta) return
          
          // Filter out Vector assignments as per delivery plan
          if (assignment.meta.assignmentType === 'Vector') return

          assignments.push({
            ...assignment,
            course,
            courseName: course.meta.shortName || `Course ${course.courseId}`,
            teacherName: course.meta.teacher,
            period: course.meta.period,
          })
        })
      })
    })

    // Sort by period, then by course name, then by due date
    return assignments.sort((a, b) => {
      if (a.period !== b.period) {
        return (a.period || 999) - (b.period || 999)
      }
      if (a.courseName !== b.courseName) {
        return a.courseName.localeCompare(b.courseName)
      }
      return 0
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Missing':
        return 'text-red-600 bg-red-50'
      case 'Submitted':
        return 'text-blue-600 bg-blue-50'
      case 'Graded':
        return 'text-green-600 bg-green-50'
      case 'Due':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="text-sm text-gray-500">
            {authLoading ? 'Checking authentication...' : 'Loading...'}
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state with retry button
  if (error) {
    // Check if this is an authentication error
    const isAuthError = error.includes('AUTH_REQUIRED') || error.includes('401') || error.includes('403')
    
    if (isAuthError) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-blue-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sign in required</h3>
          <p className="mt-1 text-sm text-gray-500">Please sign in to view your assignments.</p>
          <div className="mt-6">
            <a
              href="/api/auth/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </a>
          </div>
        </div>
      )
    }
    
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-red-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading assignments</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again {retryCount > 0 && `(${retryCount})`}
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  const assignments = getAllAssignments()
  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
        <p className="mt-1 text-sm text-gray-500">No assignments are available at this time.</p>
      </div>
    )
  }

  // Student selection
  const students = data && data.students ? Object.values(data.students) : []

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      {students.length > 1 && (
        <div className="flex items-center space-x-4">
          <label htmlFor="student-select" className="text-sm font-medium text-gray-700">
            Student:
          </label>
          <select
            id="student-select"
            value={selectedStudentId || ''}
            onChange={(e) => handleStudentChange(e.target.value)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Students</option>
            {students.map(student => (
              <option key={student.studentId} value={student.studentId}>
                {student.meta.preferredName || student.meta.legalName || `Student ${student.studentId}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Assignments Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Assignments ({assignments.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            All assignments with Canvas links
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {assignments.map((assignment) => {
            const canvasUrl = assignment.courseId && assignment.assignmentId 
              ? buildCanvasAssignmentUrl({
                  courseId: assignment.courseId,
                  assignmentId: assignment.assignmentId,
                })
              : null

            return (
              <li key={assignment.assignmentId} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.meta.checkpointStatus)}`}>
                          {assignment.meta.checkpointStatus}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {assignment.courseName}
                          {assignment.teacherName && (
                            <span className="text-gray-500 ml-2">({assignment.teacherName})</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {assignment.canvas.name || 'Untitled Assignment'}
                        </p>
                        {assignment.canvas.due_at && (
                          <p className="mt-1 text-xs text-gray-500">
                            Due: {new Date(assignment.canvas.due_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {assignment.pointsPossible && (
                      <p className="mt-1 text-xs text-gray-500">
                        {assignment.pointsPossible} points possible
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {canvasUrl ? (
                      <a
                        href={canvasUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View in Canvas
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">No link available</span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
