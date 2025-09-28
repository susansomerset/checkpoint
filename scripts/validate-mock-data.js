// scripts/validate-mock-data.js
const { validateMockDataStructure, generateMockApiResponse } = require('../tests/fixtures/mock-data-generator.js')

console.log('🔍 Validating mock data structure against backend schemas...\n')

try {
  // Test schema validation
  const isValid = validateMockDataStructure()
  
  if (isValid) {
    console.log('✅ Schema validation passed!')
    
    // Test API response format
    const apiResponse = generateMockApiResponse()
    console.log('\n📊 Generated API Response:')
    console.log(`   - Status: ${apiResponse.status}`)
    console.log(`   - OK: ${apiResponse.ok}`)
    console.log(`   - Students: ${Object.keys(apiResponse.data.students).length}`)
    console.log(`   - API Version: ${apiResponse.data.apiVersion}`)
    console.log(`   - Last Loaded: ${apiResponse.data.lastLoadedAt}`)
    
    // Test student structure
    const firstStudent = Object.values(apiResponse.data.students)[0]
    console.log(`\n👤 First Student: ${firstStudent.meta.preferredName || firstStudent.meta.legalName}`)
    console.log(`   - Courses: ${Object.keys(firstStudent.courses).length}`)
    
    // Test course structure
    const firstCourse = Object.values(firstStudent.courses)[0]
    console.log(`\n📚 First Course: ${firstCourse.meta.shortName || firstCourse.canvas.name}`)
    console.log(`   - Teacher: ${firstCourse.meta.teacher}`)
    console.log(`   - Period: ${firstCourse.meta.period}`)
    console.log(`   - Assignments: ${Object.keys(firstCourse.assignments).length}`)
    
    // Test assignment structure
    const firstAssignment = Object.values(firstCourse.assignments)[0]
    console.log(`\n📝 First Assignment: ${firstAssignment.canvas.name}`)
    console.log(`   - Status: ${firstAssignment.meta.checkpointStatus}`)
    console.log(`   - Points: ${firstAssignment.pointsPossible}`)
    console.log(`   - Type: ${firstAssignment.meta.assignmentType}`)
    
    console.log('\n🎉 Mock data structure is fully compatible with backend schemas!')
    process.exit(0)
  } else {
    console.error('❌ Schema validation failed!')
    process.exit(1)
  }
} catch (error) {
  console.error('❌ Error during validation:', error.message)
  process.exit(1)
}
