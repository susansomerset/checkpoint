// tests/fixtures/real-data-cache.ts
import * as fs from 'fs'
import * as path from 'path'
import { generateMockApiResponse, validateMockDataStructure } from '../fixtures/mock-data-generator'

// Schema version - increment when mock data structure changes
const SCHEMA_VERSION = '1.0.0'

// File-based cache shared across all workers
const CACHE_FILE = path.join('/tmp', 'checkpoint-test-cache.json')

// In-memory cache for this worker (faster than file reads)
let cachedStudentData: any = null
let cacheTimestamp: number = 0

// Sticky TTL: short in production, long in tests
const CACHE_DURATION = process.env.NODE_ENV === 'test' 
  ? 24 * 60 * 60 * 1000  // 24 hours for tests
  : 5 * 60 * 1000         // 5 minutes for production

// Singleflight: prevent duplicate rebuilds when multiple tests call at once
let buildPromise: Promise<any> | null = null
let hasLoggedBuild = false

/**
 * Gets mock student data that exactly matches the backend API response structure
 * This data is validated against the actual backend schemas to ensure compatibility
 * 
 * Cache strategy:
 * 1. Check in-memory cache (fastest)
 * 2. Check file cache shared across workers (fast)
 * 3. Build fresh and write to file (slow, only once per test run)
 */
export async function getRealStudentData(): Promise<any> {
  const now = Date.now()
  
  // Fast path: in-memory cache for this worker
  if (cachedStudentData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedStudentData
  }
  
  // Singleflight: if another call is already building, wait for it
  if (buildPromise) {
    return buildPromise
  }
  
  // Try to load from file cache (shared across workers)
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const fileContent = fs.readFileSync(CACHE_FILE, 'utf-8')
      const cached = JSON.parse(fileContent)
      
      // Check schema version and timestamp
      if (cached.schemaVersion === SCHEMA_VERSION && 
          (now - cached.timestamp) < CACHE_DURATION) {
        // File cache is fresh, use it
        cachedStudentData = cached.data
        cacheTimestamp = cached.timestamp
        return cachedStudentData
      }
    }
  } catch (err) {
    // File cache corrupted or missing, rebuild
  }
  
  // No valid cache, need to build (and share with other workers)
  buildPromise = buildAndCacheData()
  try {
    const data = await buildPromise
    return data
  } finally {
    buildPromise = null
  }
}

/**
 * Build fresh data and write to file cache atomically
 */
async function buildAndCacheData(): Promise<any> {
  // Only log the first build, or failures
  if (!hasLoggedBuild) {
    console.log('🔨 Building fresh mock data cache (schema v' + SCHEMA_VERSION + ')...')
    hasLoggedBuild = true
  }
  
  // Validate schema structure first (silent mode - we log build message above)
  if (!validateMockDataStructure('real-data-cache.ts', true)) {
    throw new Error('Mock data structure validation failed - check schema compatibility')
  }
  
  // Generate the exact API response format
  const data = generateMockApiResponse()
  const now = Date.now()
  
  // Cache in memory
  cachedStudentData = data
  cacheTimestamp = now
  
  // Write to file atomically (write temp, then rename)
  try {
    const cacheContent = {
      schemaVersion: SCHEMA_VERSION,
      timestamp: now,
      data: data
    }
    
    const tempFile = `${CACHE_FILE}.tmp.${process.pid}`
    fs.writeFileSync(tempFile, JSON.stringify(cacheContent), 'utf-8')
    fs.renameSync(tempFile, CACHE_FILE)
  } catch (err) {
    // File write failed, but in-memory cache still works
    console.warn('⚠️  Failed to write cache file, continuing with in-memory cache')
  }
  
  return data
}

// Manual cache refresh function
export function refreshRealDataCache() {
  console.log('Manually refreshing mock data cache')
  cachedStudentData = null
  cacheTimestamp = 0
  hasLoggedBuild = false
  
  // Also clear file cache
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE)
    }
  } catch (err) {
    // Ignore errors
  }
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