// tests/fixtures/real-data-cache.ts
import { generateMockApiResponse, validateMockDataStructure } from '../fixtures/mock-data-generator'

let cachedStudentData: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Gets mock student data that exactly matches the backend API response structure
 * This data is validated against the actual backend schemas to ensure compatibility
 */
export async function getRealStudentData(): Promise<any> {
  const now = Date.now()
  
  // Return cached data if still fresh
  if (cachedStudentData && (now - cacheTimestamp) < CACHE_DURATION) {
    // Cached data available, no log needed
    return cachedStudentData
  }
  
  // Generate fresh data (suppressed logs during test runs)
  
  // Validate schema structure first
  if (!validateMockDataStructure('real-data-cache.ts')) {
    throw new Error('Mock data structure validation failed - check schema compatibility')
  }
  
  // Generate the exact API response format
  const data = generateMockApiResponse()
  
  // Cache it
  cachedStudentData = data
  cacheTimestamp = now
  
  return data
}

// Manual cache refresh function
export function refreshRealDataCache() {
  console.log('Manually refreshing mock data cache')
  cachedStudentData = null
  cacheTimestamp = 0
}

// Get cache status for debugging
export function getCacheStatus() {
  const now = Date.now()
  const age = now - cacheTimestamp
  const isFresh = age < CACHE_DURATION
  
  return {
    hasData: !!cachedStudentData,
    age: age,
    isFresh: isFresh,
    cacheDuration: CACHE_DURATION
  }
}