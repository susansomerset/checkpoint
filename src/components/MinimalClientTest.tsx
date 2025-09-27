'use client'

import { useState, useEffect } from 'react'

export function MinimalClientTest() {
  const [mounted, setMounted] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    console.log('MinimalClientTest mounted!')
  }, [])

  return (
    <div className="p-4 bg-purple-100 border border-purple-300 rounded">
      <h3 className="font-bold">Minimal Client Test</h3>
      <p>Mounted: {String(mounted)}</p>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        className="px-2 py-1 bg-purple-500 text-white rounded text-sm"
      >
        Increment
      </button>
    </div>
  )
}
