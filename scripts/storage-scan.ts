#!/usr/bin/env tsx
/**
 * Storage key audit script
 * Scans Redis keys to detect accidental dev: writes or namespace issues
 */

import { Redis } from '@upstash/redis';
import { k } from '../src/lib/storage/prefix';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function scanKeys(pattern: string = '*') {
  try {
    console.log(`Scanning keys with pattern: ${pattern}`);
    
    // Note: Upstash Redis doesn't support SCAN command
    // This is a placeholder for future implementation
    // For now, we'll check specific known keys
    
    const knownKeys = [
      k('studentData:v1'),
      k('metadata:v1'),
      k('lastLoadedAt'),
    ];
    
    console.log('Checking known keys:');
    for (const key of knownKeys) {
      try {
        const exists = await redis.exists(key);
        const type = await redis.type(key);
        const ttl = await redis.ttl(key);
        
        console.log(`  ${key}: exists=${exists}, type=${type}, ttl=${ttl}`);
      } catch (error) {
        console.error(`  ${key}: error - ${error}`);
      }
    }
    
    // Check for accidental dev: keys
    console.log('\nChecking for accidental dev: keys...');
    const devKeys = [
      'dev:studentData:v1',
      'dev:metadata:v1',
      'dev:lastLoadedAt',
    ];
    
    for (const key of devKeys) {
      try {
        const exists = await redis.exists(key);
        if (exists) {
          console.warn(`  WARNING: Found accidental dev key: ${key}`);
        } else {
          console.log(`  OK: No dev key found: ${key}`);
        }
      } catch (error) {
        console.error(`  ${key}: error - ${error}`);
      }
    }
    
  } catch (error) {
    console.error('Scan failed:', error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const pattern = args[0] || '*';
  
  console.log('Storage Key Audit Script');
  console.log('======================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Namespace: ${process.env.UPSTASH_NAMESPACE || 'none (using fallback)'}`);
  console.log('');
  
  await scanKeys(pattern);
}

if (require.main === module) {
  main().catch(console.error);
}

