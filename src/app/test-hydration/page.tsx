'use client'

import { useState, useEffect } from 'react'

export default function TestHydrationPage() {
  const [mounted, setMounted] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    console.log('HYDRATION TEST: useEffect ran!')
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Hydration Test</h1>
      <p>Mounted: {String(mounted)}</p>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Increment
      </button>
      <p className="mt-4 text-sm text-gray-600">
        If this page works, you should see "Mounted: true" and the button should work.
      </p>
    </div>
  )
}
