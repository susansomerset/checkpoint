'use client'

import { useUser } from '@auth0/nextjs-auth0/client'

export function MinimalAuthTest() {
  const { user, isLoading, error } = useUser()
  
  console.log('MinimalAuthTest render:', { user, isLoading, error })
  
  return (
    <div className="p-4 border rounded">
      <h3>Minimal Auth Test</h3>
      <p>Loading: {isLoading ? 'true' : 'false'}</p>
      <p>User: {user ? 'present' : 'null'}</p>
      <p>Error: {error ? error.message : 'none'}</p>
    </div>
  )
}
