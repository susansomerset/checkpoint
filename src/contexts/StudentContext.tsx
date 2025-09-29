'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { StudentData, Student } from '@/lib/contracts/types'
import { resetRadialCache } from '@/selectors/cache'
import { fetchStudentDataWithRetry } from '@/lib/api/studentData'

interface StudentContextType {
  selectedStudentId: string | null
  setSelectedStudentId: (_studentId: string | null) => void
  students: Student[]
  data: StudentData | null
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
  user: unknown
  authLoading: boolean
}

const StudentContext = createContext<StudentContextType | undefined>(undefined)

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useUser()
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(false) // Start as false, only true when fetching
  const [error, setError] = useState<string | null>(null)

  // Fetch student data only when authenticated
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchStudentDataWithRetry()
      
      // Sort students by preferred name
      const studentsData = result.students || {};
      const studentsArray = Object.values(studentsData).sort((a, b) => {
        const nameA = a.meta.preferredName || a.meta.legalName || 'Unknown'
        const nameB = b.meta.preferredName || b.meta.legalName || 'Unknown'
        return nameA.localeCompare(nameB)
      })
      
      setStudents(studentsArray)
      // Add versioning for cache invalidation
      const versionedData = { ...result, version: Date.now() }
      setData(versionedData)
      resetRadialCache() // Clear cache when new data arrives
      
      // Auto-select first student if none selected
      if (!selectedStudentId && studentsArray.length > 0) {
        setSelectedStudentId(studentsArray[0].studentId)
      }
    } catch (err: unknown) {
      // Suppress console logging for expected 401s, continue logging other errors
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes('401') || errorMessage.includes('AUTH_REQUIRED')) {
        setError(null) // Clear error for expected auth failures
      } else {
        console.error('Failed to fetch student data:', err)
        setError(errorMessage || 'Failed to load student data')
      }
    } finally {
      setLoading(false)
    }
  }, []) // Removed selectedStudentId from dependency array

  // Fetch data only when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      fetchData()
    }
  }, [user, authLoading, fetchData]) // Fetch when auth state changes

  // Auto-select first student when data loads
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].studentId)
    }
  }, [selectedStudentId, students])

  const refreshData = async () => {
    await fetchData()
  }

  return (
    <StudentContext.Provider value={{ 
      selectedStudentId, 
      setSelectedStudentId, 
      students, 
      data, 
      loading, 
      error, 
      refreshData,
      user,
      authLoading
    }}>
      {children}
    </StudentContext.Provider>
  )
}

export function useStudent() {
  const context = useContext(StudentContext)
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider')
  }
  return context
}

// Alias for compatibility
export const useStudentContext = useStudent
