'use client'

import { useUser } from '@auth0/nextjs-auth0/client'

export function AuthProviderProbe() {
  const { user, isLoading, error } = useUser()
  
  console.log('AuthProviderProbe (inside provider):', { user, isLoading, error })
  
  return (
    <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
      <strong>Provider Probe:</strong> Loading: {isLoading ? 'true' : 'false'}, 
      User: {user ? 'present' : 'null'}, 
      Error: {error ? error.message : 'none'}
    </div>
  )
}
