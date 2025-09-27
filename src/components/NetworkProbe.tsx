'use client'

import { useEffect, useState } from 'react'

export function NetworkProbe() {
  const [status, setStatus] = useState<string>('Testing...')
  const [response, setResponse] = useState<any>(null)
  
  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('NetworkProbe: Testing /api/auth/me directly')
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        console.log('NetworkProbe: Response status:', res.status)
        console.log('NetworkProbe: Response headers:', Object.fromEntries(res.headers.entries()))
        
        const text = await res.text()
        console.log('NetworkProbe: Response body:', text)
        
        setStatus(`HTTP ${res.status}`)
        setResponse({ status: res.status, body: text, headers: Object.fromEntries(res.headers.entries()) })
      } catch (error) {
        console.error('NetworkProbe: Error:', error)
        setStatus(`Error: ${error}`)
      }
    }
    
    testApi()
  }, [])
  
  return (
    <div className="p-2 bg-blue-100 border border-blue-300 rounded text-xs">
      <strong>Network Probe:</strong> {status}
      {response && (
        <div className="mt-1">
          <div>Status: {response.status}</div>
          <div>Body: {response.body || 'empty'}</div>
        </div>
      )}
    </div>
  )
}
