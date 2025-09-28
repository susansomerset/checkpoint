// src/lib/api/studentData.ts
import { StudentData } from '@/lib/contracts/types'

export interface ApiResponse<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

export interface FetchOptions {
  signal?: AbortSignal
}

export async function fetchStudentDataWithRetry(
  studentId?: string,
  options: FetchOptions = {}
): Promise<StudentData> {
  const { signal } = options
  
  const url = studentId 
    ? `/api/student-data?student=${encodeURIComponent(studentId)}`
    : '/api/student-data'
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  })
  
  const result: ApiResponse<StudentData> = await response.json()
  
  if (!response.ok) {
    // 401/403 are terminal - don't retry
    if (response.status === 401 || response.status === 403) {
      throw new Error('AUTH_REQUIRED')
    }
    
    // Other errors
    throw new Error(result.error || `HTTP ${response.status}`)
  }
  
  if (!result.ok || !result.data) {
    throw new Error(result.error || 'Invalid response format')
  }
  
  return result.data
}

export function createAbortController(): AbortController {
  return new AbortController()
}
