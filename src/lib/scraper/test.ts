import { scrapeOutcomes } from './scraper';

async function test(courseID: number, parseType: string) {
  try {
    console.log(`=== Testing course ${courseID} with parseType: ${parseType} ===`);
    const result = await scrapeOutcomes([courseID], parseType);
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('[DEBUG] Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Get parameters from command line
const courseID = parseInt(process.argv[2]) || 21874;
const parseType = process.argv[3] || "dvjh";

console.log(`Running test with courseID: ${courseID}, parseType: ${parseType}`);
test(courseID, parseType);
