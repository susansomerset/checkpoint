#!/usr/bin/env tsx

/**
 * Test script for student data reset pipeline
 * Calls the reset function directly and shows all logs
 * Usage: npm run test:reset
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { performStudentDataReset } from '../src/lib/student/reset';

async function main() {
  console.log('🧪 Starting student data reset test...\n');
  
  const startTime = Date.now();
  
  try {
    const result = await performStudentDataReset();
    
    const duration = Date.now() - startTime;
    
    console.log('\n📊 RESULT SUMMARY:');
    console.log('━'.repeat(50));
    console.log(`Status: ${result.ok ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Step: ${result.step || 'complete'}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    
    if (result.counts) {
      console.log('\n📈 Counts:');
      console.log(`  Students: ${result.counts.students}`);
      console.log(`  Courses: ${result.counts.courses}`);
      console.log(`  Assignments: ${result.counts.assignments}`);
      console.log(`  Submissions: ${result.counts.submissions}`);
    }
    
    if (result.stats) {
      console.log('\n📊 Augmentation Stats:');
      console.log(`  Students Processed: ${result.stats.studentsProcessed}`);
      console.log(`  ParseType Groups:`, JSON.stringify(result.stats.parseTypeGroups, null, 2));
      console.log(`  Courses Scraped: ${result.stats.coursesScraped}`);
      console.log(`  Assignments Augmented: ${result.stats.assignmentsAugmented}`);
      console.log(`  Assignments Unmatched: ${result.stats.assignmentsUnmatched}`);
      console.log(`  Courses With Outcomes: ${result.stats.coursesWithOutcomes}`);
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log('\n━'.repeat(50));
    
    process.exit(result.ok ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:');
    console.error(error);
    process.exit(1);
  }
}

main();

