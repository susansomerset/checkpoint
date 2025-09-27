import { StudentData } from '@/lib/contracts/types'

// Standardized API return shape
export interface ApiResponse<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

// AbortController for request deduplication
class RequestManager {
  private activeRequests = new Map<string, AbortController>()

  createRequest(key: string): AbortController {
    // Cancel any existing request with the same key
    const existing = this.activeRequests.get(key)
    if (existing) {
      existing.abort()
    }

    const controller = new AbortController()
    this.activeRequests.set(key, controller)
    return controller
  }

  removeRequest(key: string): void {
    this.activeRequests.delete(key)
  }

  abortAll(): void {
    this.activeRequests.forEach(controller => controller.abort())
    this.activeRequests.clear()
  }
}

const requestManager = new RequestManager()

// Single abortable, deduped fetch wrapper for /api/student-data
export async function fetchStudentData(studentId?: string): Promise<ApiResponse<StudentData>> {
  const requestKey = `student-data-${studentId || 'all'}`
  const controller = requestManager.createRequest(requestKey)

  try {
    const url = studentId 
      ? `/api/student-data?studentId=${encodeURIComponent(studentId)}`
      : '/api/student-data'

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '1',
      },
    })

    requestManager.removeRequest(requestKey)

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    
    return {
      ok: true,
      status: response.status,
      data,
    }
  } catch (error) {
    requestManager.removeRequest(requestKey)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        error: 'Request aborted',
      }
    }

    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Retry with exponential backoff
export async function fetchStudentDataWithRetry(
  studentId?: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<ApiResponse<StudentData>> {
  let lastError: string = ''

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fetchStudentData(studentId)
    
    if (result.ok) {
      return result
    }

    lastError = result.error || 'Unknown error'

    // Don't retry on client errors (4xx) or if we've exhausted retries
    if (result.status >= 400 && result.status < 500) {
      return result
    }

    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return {
    ok: false,
    status: 0,
    error: `Failed after ${maxRetries + 1} attempts: ${lastError}`,
  }
}

// Cleanup function for component unmount
export function abortAllRequests(): void {
  requestManager.abortAll()
}
