'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useEffect, useState } from 'react'

export function AuthTest() {
  const { user, isLoading, error } = useUser()
  const [mounted, setMounted] = useState(false)
  const [timeoutReached, setTimeoutReached] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    console.log('AuthTest mounted, useUser result:', { user, isLoading, error })
    
    // Set a timeout to detect if the hook never resolves
    const timeout = setTimeout(() => {
      console.log('AuthTest timeout reached - useUser still loading')
      setTimeoutReached(true)
    }, 10000) // 10 second timeout
    
    return () => clearTimeout(timeout)
  }, [user, isLoading, error])
  
  if (!mounted) {
    return <div>Component mounting...</div>
  }
  
  console.log('AuthTest render:', { user, isLoading, error })
  
  if (isLoading && !timeoutReached) {
    return <div>Auth loading...</div>
  }
  
  if (isLoading && timeoutReached) {
    return <div>Auth loading timeout - hook never resolved</div>
  }
  
  if (error) {
    return <div>Auth error: {error.message}</div>
  }
  
  if (!user) {
    return <div>Not authenticated</div>
  }
  
  return <div>Authenticated as: {user.email}</div>
}
