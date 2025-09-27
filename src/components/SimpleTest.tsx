'use client'

import { useEffect, useState } from 'react'

export function SimpleTest() {
  const [mounted, setMounted] = useState(false)
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    console.log('SimpleTest useEffect running')
    setMounted(true)
    
    const interval = setInterval(() => {
      setCount(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="p-2 bg-green-100 border border-green-300 rounded text-xs">
      <strong>Simple Test:</strong> Mounted: {mounted ? 'true' : 'false'}, Count: {count}
    </div>
  )
}
