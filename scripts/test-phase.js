#!/usr/bin/env node

/**
 * Phase-based test runner
 * 
 * Testing Strategy:
 * 1. Run smoke test FIRST - if it fails, stop everything
 * 2. Run the target phase tests
 * 3. Run ALL previous phases' tests (in order)
 * 4. Stop if ANY test fails
 */

// Suppress NO_COLOR/FORCE_COLOR conflict warning from Node.js
delete process.env.FORCE_COLOR;
delete process.env.NO_COLOR;

const { execSync } = require('child_process');
const path = require('path');

const PHASES = [
  'phase-1', // Foundation & Setup
  'phase-2', // Vertical Slice  
  'phase-3', // Progress Header
  'phase-4', // Student Progress Table
  'phase-5', // Weekly Grid
  'phase-6', // Detail Table
  'phase-7', // Settings & Metadata
  'phase-8'  // Integration & Polish
];

function runCommand(command, description, captureOutput = false) {
  if (!captureOutput) {
    console.log(`\n🔄 ${description}...`);
  }
  try {
    const options = captureOutput 
      ? { stdio: 'pipe', cwd: process.cwd() }
      : { 
          stdio: 'inherit', 
          cwd: process.cwd(),
          env: { 
            ...process.env, 
            CI: 'true',  // Prevent browser windows from opening
            HEADLESS: 'true'
          }
        };
    
    const result = execSync(command, options);
    
    if (!captureOutput) {
      console.log(`✅ ${description} passed`);
    }
    
    return captureOutput ? result.toString() : true;
  } catch (error) {
    if (!captureOutput) {
      console.error(`❌ ${description} failed`);
      console.error(error.message);
    }
    return false;
  }
}

function runSmokeTest() {
  console.log('\n🚨 STEP 1: Running smoke test (MUST PASS)');
  return runCommand('npx playwright test tests/smoke/core-functionality.spec.ts', 'Smoke test');
}

function runPhaseTests(phase) {
  console.log(`\n📋 STEP 2: Running ${phase} tests`);
  
  // Check if phase has Jest tests (.test.ts files)
  const hasJestTests = runCommand(`find tests/${phase} -name "*.test.ts" | wc -l`, `Check for Jest tests in ${phase}`, true);
  if (hasJestTests && hasJestTests.trim() !== '0') {
    console.log(`  Running Jest unit tests for ${phase}...`);
    if (!runCommand(`npm test -- tests/${phase}`, `${phase} Jest tests`)) {
      return false;
    }
  }
  
  // Check if phase has Playwright tests (.spec.ts files)
  const hasPlaywrightTests = runCommand(`find tests/${phase} -name "*.spec.ts" | wc -l`, `Check for Playwright tests in ${phase}`, true);
  if (hasPlaywrightTests && hasPlaywrightTests.trim() !== '0') {
    console.log(`  Running Playwright E2E tests for ${phase}...`);
    // Use 4 workers for phase-2 to speed up execution
    // Note: Each worker maintains its own in-memory cache (real-data-cache.ts)
    const workers = phase === 'phase-2' ? '--workers=4' : '';
    if (!runCommand(`npx playwright test tests/${phase}/ ${workers}`, `${phase} Playwright tests`)) {
      return false;
    }
  }
  
  return true;
}

function runAllPreviousPhases(targetPhase) {
  const targetIndex = PHASES.indexOf(targetPhase);
  if (targetIndex === -1) {
    console.error(`❌ Unknown phase: ${targetPhase}`);
    process.exit(1);
  }

  const previousPhases = PHASES.slice(0, targetIndex);
  
  if (previousPhases.length === 0) {
    console.log('\n📋 STEP 3: No previous phases to test');
    return true;
  }

  console.log(`\n📋 STEP 3: Running all previous phases: ${previousPhases.join(', ')}`);
  
  for (const phase of previousPhases) {
    // Check if phase has Jest tests (.test.ts files)
    const hasJestTests = runCommand(`find tests/${phase} -name "*.test.ts" | wc -l`, `Check for Jest tests in ${phase}`, true);
    if (hasJestTests && hasJestTests.trim() !== '0') {
      console.log(`  Running Jest unit tests for ${phase}...`);
      if (!runCommand(`npm test -- tests/${phase}`, `${phase} Jest tests`)) {
        return false;
      }
    }
    
    // Check if phase has Playwright tests (.spec.ts files)
    const hasPlaywrightTests = runCommand(`find tests/${phase} -name "*.spec.ts" | wc -l`, `Check for Playwright tests in ${phase}`, true);
    if (hasPlaywrightTests && hasPlaywrightTests.trim() !== '0') {
      console.log(`  Running Playwright E2E tests for ${phase}...`);
      // Use 4 workers for phase-2 to speed up execution
      // Note: Each worker maintains its own in-memory cache (real-data-cache.ts)
      const workers = phase === 'phase-2' ? '--workers=4' : '';
      if (!runCommand(`npx playwright test tests/${phase}/ ${workers}`, `${phase} Playwright tests`)) {
        return false;
      }
    }
  }
  
  return true;
}

function runAllPhases() {
  console.log('\n📋 Running all phases in order...');
  
  for (const phase of PHASES) {
    console.log(`\n🔄 Testing ${phase}...`);
    if (!runPhaseTests(phase)) {
      console.log(`\n💥 ${phase} tests failed - stopping`);
      return false;
    }
  }
  
  return true;
}

function runCodeQualityChecks() {
  console.log('\n🔍 STEP 4: Running code quality checks...');
  
  // Run spec tests (unit, E2E, visual)
  console.log('\n  Running spec-aligned tests...');
  if (!runCommand('npm run test:spec:unit', 'Spec unit tests')) {
    console.log('\n💥 Spec unit tests failed - stopping');
    return false;
  }
  
  // Run ESLint
  if (!runCommand('npx eslint src --ext .ts,.tsx --max-warnings 0', 'ESLint check')) {
    console.log('\n💥 ESLint failed - stopping');
    return false;
  }
  
  // Run TypeScript check
  if (!runCommand('npx tsc --noEmit', 'TypeScript check')) {
    console.log('\n💥 TypeScript check failed - stopping');
    return false;
  }
  
  return true;
}

function main() {
  const targetPhase = process.argv[2];
  
  if (!targetPhase) {
    console.log('🎯 Testing all phases (smoke + all phases in order)');
    console.log('=' .repeat(60));

    // Step 1: Smoke test (MUST PASS)
    if (!runSmokeTest()) {
      console.log('\n💥 Smoke test failed - stopping all testing');
      process.exit(1);
    }

    // Step 2: All phases in order
    if (!runAllPhases()) {
      console.log('\n💥 Phase tests failed - stopping');
      process.exit(1);
    }

    // Step 3: Code quality checks (ESLint + TSC)
    if (!runCodeQualityChecks()) {
      console.log('\n💥 Code quality checks failed - stopping');
      process.exit(1);
    }

    console.log('\n🎉 All tests and code quality checks passed!');
    console.log(`✅ Smoke test: PASSED`);
    console.log(`✅ All phases: PASSED`);
    console.log(`✅ ESLint: PASSED`);
    console.log(`✅ TypeScript: PASSED`);
    return;
  }

  // Validate target phase
  if (!PHASES.includes(targetPhase)) {
    console.log('Usage: node scripts/test-phase.js [phase]');
    console.log('Available phases:', PHASES.join(', '));
    console.log('\nIf no phase is specified, runs smoke test + all phases in order');
    console.log('\nExample: node scripts/test-phase.js phase-3');
    process.exit(1);
  }

  console.log(`🎯 Testing phase: ${targetPhase}`);
  console.log('=' .repeat(50));

  // Step 1: Smoke test (MUST PASS)
  if (!runSmokeTest()) {
    console.log('\n💥 Smoke test failed - stopping all testing');
    process.exit(1);
  }

  // Step 2: Target phase tests
  if (!runPhaseTests(targetPhase)) {
    console.log(`\n💥 ${targetPhase} tests failed - stopping`);
    process.exit(1);
  }

  // Step 3: All previous phases
  if (!runAllPreviousPhases(targetPhase)) {
    console.log('\n💥 Previous phase tests failed - stopping');
    process.exit(1);
  }

  // Step 4: Code quality checks (ESLint + TSC)
  if (!runCodeQualityChecks()) {
    console.log('\n💥 Code quality checks failed - stopping');
    process.exit(1);
  }

  console.log('\n🎉 All tests and code quality checks passed!');
  console.log(`✅ Smoke test: PASSED`);
  console.log(`✅ ${targetPhase}: PASSED`);
  console.log(`✅ All previous phases: PASSED`);
  console.log(`✅ ESLint: PASSED`);
  console.log(`✅ TypeScript: PASSED`);
}

main();
