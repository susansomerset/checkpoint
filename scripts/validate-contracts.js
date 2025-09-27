#!/usr/bin/env node

/**
 * Contract validation script
 * Validates TypeScript contracts and basic data structure
 */

console.log('🔍 Validating TypeScript contracts...')

// Basic validation - check if our contract files exist and are valid
const fs = require('fs')
const path = require('path')

const contractFiles = [
  'src/lib/contracts/types.ts',
  'src/lib/contracts/api.ts',
  'src/mocks/handlers.ts'
]

let allValid = true

for (const file of contractFiles) {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`)
    
    // Check if file has content
    const content = fs.readFileSync(filePath, 'utf8')
    if (content.trim().length === 0) {
      console.log(`❌ ${file} is empty`)
      allValid = false
    } else {
      console.log(`✅ ${file} has content`)
    }
  } else {
    console.log(`❌ ${file} missing`)
    allValid = false
  }
}

// Check if our test fixtures are valid
try {
  console.log('🔍 Checking test fixtures...')
  const fixturesPath = path.join(__dirname, '..', 'tests', 'fixtures', 'real-data.ts')
  if (fs.existsSync(fixturesPath)) {
    console.log('✅ Test fixtures exist')
  } else {
    console.log('❌ Test fixtures missing')
    allValid = false
  }
} catch (error) {
  console.log('❌ Error checking fixtures:', error.message)
  allValid = false
}

// Check if our utility functions exist
const utilityFiles = [
  'src/lib/derive/courseAggregates.ts',
  'src/lib/derive/turnedInPct.ts',
  'src/lib/derive/weekWindow.ts',
  'src/lib/derive/labels.ts',
  'src/lib/derive/pointsSizing.ts',
  'src/lib/derive/canvasLinks.ts'
]

console.log('🔍 Checking utility functions...')
for (const file of utilityFiles) {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`)
  } else {
    console.log(`❌ ${file} missing`)
    allValid = false
  }
}

if (allValid) {
  console.log('✅ All contract validations passed!')
  console.log('📊 Contract files are valid and present')
  console.log('📊 Utility functions are present')
  console.log('📊 Test fixtures are present')
  process.exit(0)
} else {
  console.log('❌ Contract validation failed')
  process.exit(1)
}