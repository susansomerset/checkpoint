#!/usr/bin/env node
// scripts/refresh-test-cache.js
// Manual script to refresh the real data cache for tests

const { refreshRealDataCache, getCacheStatus } = require('../tests/fixtures/real-data-cache.ts')

console.log('🔄 Refreshing test data cache...')

// Show current cache status
const status = getCacheStatus()
console.log('Current cache status:', status)

// Refresh the cache
refreshRealDataCache()

console.log('✅ Test data cache refreshed successfully!')
console.log('Next test run will fetch fresh real data from the API.')
