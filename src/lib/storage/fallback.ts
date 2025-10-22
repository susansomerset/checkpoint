/**
 * Fallback shim for KV migration
 * Read-through from Vercel KV on miss, backfill to Upstash
 */

import { getRaw, setRaw } from './redis-raw';
// import { k } from './prefix';
import * as legacyKv from './kv-legacy';

// Metrics with time-based tracking
interface MetricEntry {
  timestamp: number;
  count: number;
}

let kvFallbackHits: MetricEntry[] = [];
let dualWriteErrors: MetricEntry[] = [];
let storageWriteLatency: number[] = [];

export function getMetrics() {
  return {
    kvFallbackHits,
    dualWriteErrors,
    storageWriteLatency,
  };
}

export function resetMetrics() {
  kvFallbackHits = [];
  dualWriteErrors = [];
  storageWriteLatency = [];
}

// Helper to get counts from last hour
function getLastHourCount(entries: MetricEntry[]): number {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return entries
    .filter(entry => entry.timestamp >= oneHourAgo)
    .reduce((sum, entry) => sum + entry.count, 0);
}

export function getMetricsSummary() {
  return {
    fallbackHits1h: getLastHourCount(kvFallbackHits),
    dualWriteErrors1h: getLastHourCount(dualWriteErrors),
    storageWriteP50: storageWriteLatency.length > 0 
      ? storageWriteLatency.sort((a, b) => a - b)[Math.floor(storageWriteLatency.length * 0.5)]
      : 0,
    storageWriteP95: storageWriteLatency.length > 0 
      ? storageWriteLatency.sort((a, b) => a - b)[Math.floor(storageWriteLatency.length * 0.95)]
      : 0,
  };
}

// Helper to record metrics with timestamp
function recordMetric(entries: MetricEntry[], count: number = 1) {
  entries.push({
    timestamp: Date.now(),
    count,
  });
  
  // Keep only last 24 hours of data
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = entries.filter(entry => entry.timestamp >= twentyFourHoursAgo);
  entries.length = 0;
  entries.push(...filtered);
}

/**
 * Get with fallback - read from Upstash, fallback to Vercel KV if enabled
 */
export async function getWithFallback(key: string): Promise<string | null> {
  // Try Upstash first
  const v = await getRaw(key);
  if (v !== null || process.env.USE_KV_FALLBACK !== '1') {
    return v;
  }

  // Fallback to legacy KV
  console.info(`ZXQ fallback: Reading ${key} from legacy KV`);
  const legacy = await legacyKv.get(key);
  if (legacy !== null) {
    recordMetric(kvFallbackHits);
    try {
      // Backfill to Upstash
      await setRaw(key, legacy);
      console.info(`ZXQ fallback: Backfilled ${key} to Upstash`);
    } catch (e) {
      console.warn(`ZXQ fallback: Failed to backfill ${key}:`, e);
    }
  }
  return legacy;
}

/**
 * Set with dual-write capability
 */
export async function setWithDualWrite(key: string, value: string, opts?: { ex?: number }): Promise<void> {
  const startTime = Date.now();
  
  // Primary write to Upstash (MUST succeed)
  await setRaw(key, value, opts?.ex ? { ex: opts.ex } : undefined);
  
  // Record latency for primary write
  const latency = Date.now() - startTime;
  storageWriteLatency.push(latency);
  
  // Keep only last 1000 latency measurements
  if (storageWriteLatency.length > 1000) {
    storageWriteLatency = storageWriteLatency.slice(-1000);
  }

  // Dual write to legacy KV if enabled (best-effort)
  if (process.env.DUAL_WRITE === '1') {
    try {
      // Optional: skip if payload unchanged (hash equal)
      const currentLegacy = await legacyKv.get(key);
      if (currentLegacy === value) {
        // Skip write if identical
        return;
      }
      
      await legacyKv.set(key, value);
    } catch (e) {
      recordMetric(dualWriteErrors);
      console.warn(`ZXQ dual-write failed for ${key}:`, e);
      // Do NOT throw - this is best-effort
    }
  }
}

/**
 * Delete with dual-write capability
 */
export async function delWithDualWrite(key: string): Promise<void> {
  // Primary delete from Upstash
  await require('./redis-raw').delRaw(key);

  // Dual delete from legacy KV if enabled
  if (process.env.DUAL_WRITE === '1') {
    try {
      // Note: legacy KV doesn't have del, so we set to empty string
      await legacyKv.set(key, '');
    } catch (e) {
      recordMetric(dualWriteErrors);
      console.warn(`ZXQ dual-delete failed for ${key}:`, e);
    }
  }
}
