'use client'

import { UserProvider } from '@auth0/nextjs-auth0/client'

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  )
}