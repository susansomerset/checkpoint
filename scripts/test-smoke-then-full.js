#!/usr/bin/env node
// scripts/test-smoke-then-full.js
// Run smoke tests first, then full suite only if smoke tests pass

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running smoke tests first...\n');

try {
  // Run smoke tests
  execSync('npx playwright test tests/e2e/smoke.spec.ts --project=firefox', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ Smoke tests passed! Running full test suite...\n');
  
  // Run full test suite
  execSync('npx playwright test --project=firefox', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n🎉 All tests passed!');
  
} catch (error) {
  console.error('\n❌ Tests failed. Stopping execution.');
  console.error('Error:', error.message);
  process.exit(1);
}
