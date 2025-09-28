// src/components/SessionChip.tsx
'use client'

import { useUser } from '@auth0/nextjs-auth0/client'

export function SessionChip() {
  const { user, isLoading } = useUser()

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
        <a
          href="/api/auth/login"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
      <span className="text-sm text-gray-600">
        Signed in as <span className="font-medium">{user.name || user.email}</span>
      </span>
      <a
        href="/api/auth/logout"
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Sign out
      </a>
    </div>
  )
}
