'use client'

import { useEffect, useState } from 'react'

export default function HydrationTestPage() {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('HydrationTestPage mounted!')
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Hydration Test</h1>
      <p>Mounted: {String(mounted)}</p>
      <p>Count: {count}</p>
      <button
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Increment
      </button>
      <p className="mt-4 text-sm text-gray-600">If this page works, you should see "Mounted: true" and the button should work.</p>
    </div>
  )
}
