'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { StudentData, Student } from '@/lib/contracts/types'
import { fetchStudentDataWithRetry } from '@/lib/api/studentData'

interface StudentContextType {
  selectedStudentId: string | null
  setSelectedStudentId: (studentId: string | null) => void
  students: Student[]
  data: StudentData | null
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
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
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchStudentDataWithRetry()
      
      // Sort students by preferred name
      const studentsArray = Object.values(result.students || {}).sort((a, b) => {
        const nameA = a.meta.preferredName || a.meta.legalName || 'Unknown'
        const nameB = b.meta.preferredName || b.meta.legalName || 'Unknown'
        return nameA.localeCompare(nameB)
      })
      
      setStudents(studentsArray)
      setData(result)
      
      // Auto-select first student if none selected
      if (!selectedStudentId && studentsArray.length > 0) {
        setSelectedStudentId(studentsArray[0].studentId)
      }
    } catch (err: any) {
      // Suppress console logging for expected 401s, continue logging other errors
      if (err.message.includes('401') || err.message.includes('AUTH_REQUIRED')) {
        setError(null) // Clear error for expected auth failures
      } else {
        console.error('Failed to fetch student data:', err)
        setError(err.message || 'Failed to load student data')
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch data only when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      fetchData()
    }
  }, [user, authLoading]) // Fetch when auth state changes

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
      refreshData 
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
