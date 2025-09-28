// src/components/AssignmentList.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import toast from 'react-hot-toast'
import { StudentData, Assignment, Course } from '@/lib/contracts/types'
import { fetchStudentDataWithRetry } from '@/lib/api/studentData'
import { buildCanvasAssignmentUrl } from '@/lib/derive/canvasLinks'
import { useStudent } from '@/contexts/StudentContext'

interface AssignmentListProps {
  // No longer need studentId prop - will get from context
}

interface CourseAssignmentData {
  course: Course
  assignments: Assignment[]
}

interface AssignmentDisplayData extends Assignment {
  courseName: string
  teacherName?: string
  period?: number
}

export function AssignmentList({}: AssignmentListProps) {
  const { user, isLoading: authLoading } = useUser()
  const { selectedStudentId } = useStudent()
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch data with retry logic
  const fetchData = async (studentId?: string) => {
    console.log('fetchData called with studentId:', studentId)
    setLoading(true)
    setError(null) // Clear previous errors
    try {
      const result = await fetchStudentDataWithRetry(studentId)
      console.log('ZXQ fetchData result:', result)
      console.log('ZXQ fetchData result.students:', result.students)
      console.log('ZXQ fetchData result.students type:', typeof result.students)
      console.log('ZXQ fetchData result.students keys:', result.students ? Object.keys(result.students) : 'no students')
      setData(result)
      toast.success('Assignments loaded successfully!')
    } catch (err: any) {
      console.error('Failed to fetch student data:', err)
      if (err.message === 'AUTH_REQUIRED' || err.message.includes('401') || err.message.includes('403')) {
        setError('AUTH_REQUIRED')
        toast.error('Authentication required. Please sign in.')
      } else {
        setError(err.message || 'Failed to load assignments.')
        toast.error(`Error: ${err.message || 'Failed to load assignments.'}`)
      }
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

  // No longer need this effect since selectedStudentId comes from context

  if (loading) {
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
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error === 'AUTH_REQUIRED') {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-red-600 mb-4">Sign in required to view assignments.</p>
        <a
          href="/api/auth/login"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign In
        </a>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-red-600 mb-4">Error loading assignments: {error}</p>
        <button
          onClick={() => fetchData(selectedStudentId || undefined)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data || !data.students || typeof data.students !== 'object' || Object.keys(data.students).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-600">No student data available.</p>
      </div>
    )
  }

  const studentsArray = Object.values(data.students)
  const currentStudent = studentsArray.find(s => s.studentId === selectedStudentId) || studentsArray[0]
  const assignmentsByCourse: CourseAssignmentData[] = []

  Object.values(currentStudent.courses).forEach(course => {
    // Assignments are stored at the root level, not under each student
    const allAssignments = Object.values(data.assignments || {})
    const courseAssignments = allAssignments.filter(
      assignment => assignment.courseId === course.courseId && assignment.meta.assignmentType !== 'Vector'
    )
    if (courseAssignments.length > 0) {
      assignmentsByCourse.push({ course, assignments: courseAssignments })
    }
  })

  // Sort courses by period
  assignmentsByCourse.sort((a, b) => (a.course.meta.period || 0) - (b.course.meta.period || 0))

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">
        Assignments for {currentStudent.meta.preferredName || currentStudent.meta.legalName || 'Unknown Student'}
      </h2>

      {assignmentsByCourse.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">No assignments found for this student.</p>
        </div>
      ) : (
        assignmentsByCourse.map(({ course, assignments }) => (
          <div key={course.courseId} className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {course.meta.shortName || course.canvas.name} ({course.meta.period}) - {course.meta.teacher}
                      </h3>
                    </div>
            <ul role="list" className="divide-y divide-gray-200">
              {assignments.map(assignment => (
                <li key={assignment.assignmentId} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      <a
                        href={buildCanvasAssignmentUrl(course.courseId, assignment.assignmentId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {assignment.canvas.name}
                      </a>
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {assignment.meta.checkpointStatus}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Due: {assignment.canvas.due_at ? new Date(assignment.canvas.due_at).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        Points: {assignment.pointsPossible}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}
