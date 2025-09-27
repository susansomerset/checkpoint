#!/usr/bin/env node

/**
 * Contract validation script
 * Validates real Canvas data against TypeScript contracts
 */

const { validateApiResponse, StudentDataResponseSchema } = require('../src/lib/contracts/api')

async function validateContracts() {
  console.log('🔍 Validating API contracts...')
  
  try {
    // Fetch real data from API
    const response = await fetch('http://localhost:3000/api/student-data')
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Validate against contract
    try {
      const validatedData = validateApiResponse(StudentDataResponseSchema, data)
      console.log('✅ Contract validation passed!')
      console.log(`📊 Found ${Object.keys(validatedData.students).length} students`)
      
      // Count assignments
      let totalAssignments = 0
      for (const student of Object.values(validatedData.students)) {
        for (const course of Object.values(student.courses)) {
          totalAssignments += Object.keys(course.assignments).length
        }
      }
      console.log(`📚 Found ${totalAssignments} assignments`)
      
      // Check for missing fields
      const missingFields = []
      for (const [studentId, student] of Object.entries(validatedData.students)) {
        if (!student.meta.preferredName) {
          missingFields.push(`Student ${studentId}: missing preferredName`)
        }
        
        for (const [courseId, course] of Object.entries(student.courses)) {
          if (!course.meta.shortName) {
            missingFields.push(`Course ${courseId}: missing shortName`)
          }
          if (!course.meta.teacher) {
            missingFields.push(`Course ${courseId}: missing teacher`)
          }
          if (!course.meta.period) {
            missingFields.push(`Course ${courseId}: missing period`)
          }
        }
      }
      
      if (missingFields.length > 0) {
        console.log('⚠️  Missing metadata fields:')
        missingFields.forEach(field => console.log(`   - ${field}`))
      } else {
        console.log('✅ All metadata fields present')
      }
      
      process.exit(0)
      
    } catch (validationError) {
      console.error('❌ Contract validation failed:')
      console.error(validationError.message)
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch data from API:')
    console.error(error.message)
    console.log('💡 Make sure the development server is running (npm run dev)')
    process.exit(1)
  }
}

// Run validation
validateContracts()
