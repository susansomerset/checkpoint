'use client'

import { useState, useEffect } from 'react'

export default function MinimalPage() {
  const [mounted, setMounted] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('MINIMAL: useEffect ran!')
    setMounted(true)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Ultra Minimal Test</h1>
      <p>Mounted: {String(mounted)}</p>
      <p>Count: {count}</p>
      <button 
        onClick={() => {
          console.log('MINIMAL: Button clicked!')
          setCount(c => c + 1)
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Increment
      </button>
      <p className="mt-4 text-sm text-gray-600">
        Check browser console for logs.
      </p>
    </div>
  )
}
