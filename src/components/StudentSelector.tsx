'use client'

import React from 'react'
import { useStudent } from '@/contexts/StudentContext'

export function StudentSelector() {
  const { selectedStudentId, setSelectedStudentId, students, loading, error } = useStudent()

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">Loading students...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Error loading students: {error}
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="text-sm text-gray-600">
        No students found
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Student:</span>
      <div className="flex space-x-1">
        {students.map((student) => {
          const displayName = student.meta.preferredName || student.meta.legalName || 'Unknown'
          const isSelected = selectedStudentId === student.studentId
          
          return (
            <button
              key={student.studentId}
              onClick={() => setSelectedStudentId(student.studentId)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {displayName}
            </button>
          )
        })}
      </div>
    </div>
  )
}
