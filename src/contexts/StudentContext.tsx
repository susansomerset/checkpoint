'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface StudentContextType {
  selectedStudentId: string | null
  setSelectedStudentId: (studentId: string | null) => void
}

const StudentContext = createContext<StudentContextType | undefined>(undefined)

export function StudentProvider({ children }: { children: ReactNode }) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  return (
    <StudentContext.Provider value={{ selectedStudentId, setSelectedStudentId }}>
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
