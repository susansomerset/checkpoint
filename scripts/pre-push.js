#!/usr/bin/env node

/**
 * Pre-push script that runs all quality checks before allowing push to master
 * 
 * This script runs:
 * 1. ESLint check
 * 2. TypeScript check  
 * 3. All tests (smoke + all phases)
 * 4. Only allows push if everything passes
 */

const { execSync } = require('child_process');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        CI: 'true',  // Prevent browser windows from opening
        HEADLESS: 'true'
      }
    });
    console.log(`✅ ${description} passed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed`);
    console.error(error.message);
    return false;
  }
}

function main() {
  console.log('🚀 PRE-PUSH QUALITY CHECKS');
  console.log('=' .repeat(50));
  console.log('Running comprehensive checks before allowing push to master...\n');

  // Step 1: ESLint check
  if (!runCommand('npx eslint src --ext .ts,.tsx --max-warnings 0', 'ESLint check')) {
    console.log('\n💥 ESLint failed - push blocked');
    process.exit(1);
  }

  // Step 2: TypeScript check
  if (!runCommand('npx tsc --noEmit', 'TypeScript check')) {
    console.log('\n💥 TypeScript check failed - push blocked');
    process.exit(1);
  }

  // Step 3: All tests (smoke + all phases)
  if (!runCommand('node scripts/test-phase.js', 'All tests (smoke + all phases)')) {
    console.log('\n💥 Tests failed - push blocked');
    process.exit(1);
  }

  console.log('\n🎉 ALL QUALITY CHECKS PASSED!');
  console.log('✅ ESLint: PASSED');
  console.log('✅ TypeScript: PASSED');
  console.log('✅ Smoke test: PASSED');
  console.log('✅ All phases: PASSED');
  console.log('\n🚀 Ready to push to master!');
}

main();
