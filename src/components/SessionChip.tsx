// src/components/SessionChip.tsx
'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { useStudent } from '@/contexts/StudentContext'
import { useState, useEffect } from 'react'

export function SessionChip() {
  const { user, isLoading } = useUser()
  const { data, refreshData } = useStudent()
  const [duration, setDuration] = useState<string>('')

  // Calculate duration since last reset
  useEffect(() => {
    if (!data?.lastLoadedAt) {
      setDuration('')
      return
    }

    const updateDuration = () => {
      const lastLoaded = new Date(data.lastLoadedAt)
      const now = new Date()
      const diffMs = now.getTime() - lastLoaded.getTime()
      
      const minutes = Math.floor(diffMs / (1000 * 60))
      const hours = Math.floor(minutes / 60)
      
      if (hours > 0) {
        const remainingMinutes = minutes % 60
        setDuration(`${hours}h${remainingMinutes.toString().padStart(2, '0')}m`)
      } else {
        setDuration(`${minutes}m`)
      }
    }

    updateDuration()
    const interval = setInterval(updateDuration, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [data?.lastLoadedAt])

  const handleRefresh = async () => {
    try {
      // Call the reset endpoint first
      const resetResponse = await fetch('/api/student-data/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (!resetResponse.ok) {
        throw new Error(`Reset failed: ${resetResponse.statusText}`)
      }
      
      // Then refresh the data
      await refreshData()
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">Checking auth...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        <span className="text-sm text-gray-600">Signed out</span>
        <Link
          href="/api/auth/login"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end text-right">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="text-sm font-medium text-gray-900">
          {user.name || user.email}
        </span>
        <Link
          href="/api/auth/logout"
          className="text-gray-500 hover:text-gray-700 p-1"
          title="Sign out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </Link>
      </div>
      {duration && (
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-gray-500">{duration}</span>
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-gray-700 p-1"
            title="Refresh student data"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
