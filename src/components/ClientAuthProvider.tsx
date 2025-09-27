'use client'

import { UserProvider } from '@auth0/nextjs-auth0/client'
import { AuthProviderProbe } from './AuthProviderProbe'

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AuthProviderProbe />
      <div className="p-1 bg-red-100 border border-red-300 rounded text-xs">
        <strong>Provider Test:</strong> This should appear
      </div>
      {children}
    </UserProvider>
  )
}
