/**
 * Legacy KV wrapper for backfill script
 * Re-exports only what we need from the old kv.ts
 */

import * as legacyKv from './kv';

export async function get<T = string>(key: string): Promise<T | null> {
  try {
    return legacyKv.get(key) as Promise<T | null>;
  } catch (error) {
    console.warn('ZXQ Legacy KV: get failed, using mock:', error);
    return null;
  }
}

export async function set(key: string, value: string): Promise<void> {
  try {
    return legacyKv.set(key, value);
  } catch (error) {
    console.warn('ZXQ Legacy KV: set failed, using mock:', error);
    // Mock implementation - do nothing
  }
}
